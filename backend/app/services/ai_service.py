"""
Serviço de Inteligência Artificial (AIService)
Responsável por fazer a ponte entre o backend e a API do Google Generative AI (Gemini).
Gerencia chaves (BYOK), fallback de modelos em caso de limites de taxa (HTTP 429),
validação estrutural JSON e moderação de conteúdo.
"""
import google.generativeai as genai
import google.api_core.exceptions as google_exceptions
import os
import json
import json_repair
import logging
import time
import re
from typing import Dict, List, Any
from ..extensions import socketio
import random
from difflib import get_close_matches
from .ai_prompt_builder import build_prompt

logger = logging.getLogger(__name__)
# ADD DEBUG FILE HANDLER
try:
    # Usando caminho relativo para não quebrar em produção (ex: Render)
    file_handler = logging.FileHandler('ai_debug.log')
    file_handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
except Exception as e:
    print(f"Aviso: Não foi possível configurar o arquivo de log local: {e}")
logger.setLevel(logging.DEBUG)

# --- METADADOS DOS ASSETS ---
AVAILABLE_SCENARIOS = [
    {"url": "/narrativa/cenarios/cenario1.webp", "description": "Sala de aula moderna e iluminada, ambiente acadêmico limpo."},
    {"url": "/narrativa/cenarios/cenario2.webp", "description": "Laboratório de TI futurista, servidores, luzes neon azul/roxo."},
    {"url": "/narrativa/cenarios/cenario3.webp", "description": "Escritório corporativo estilo startup, open-space, profissional."},
    {"url": "/narrativa/cenarios/cenario4.webp", "description": "Mundo digital abstrato, realidade virtual, 'dentro do computador'."}
]

AVAILABLE_CHARACTERS = [
    {"url": "/narrativa/personagens/instrutor1.webp", "description": "Mentor homem, grisalho, sábio, professor experiente."},
    {"url": "/narrativa/personagens/instrutor2.webp", "description": "Mentora mulher, óculos, liderança técnica, confiante."},
    {"url": "/narrativa/personagens/aluno1.webp", "description": "Aluno homem, jovem, casual, estagiário ou aprendiz."},
    {"url": "/narrativa/personagens/aluno2.webp", "description": "Aluna mulher, jovem, focada, desenvolvedora júnior."}
]

class AIService:
    """
    @desc Serviço de orquestração para geração de conteúdo de atividades com IA.
    Esta classe gerencia a comunicação com a API do Google Generative AI,
    implementando uma lógica de fallback de modelos, retentativas, e
    formatação de prompts para criar conteúdo pedagógico (narrativas, quizzes).
    """
    def __init__(self):
        """
        @desc Inicializa o serviço de IA.
        Configura a chave de API, a hierarquia de modelos e os parâmetros de geração.
        """
        self.default_api_key = os.environ.get("GOOGLE_API_KEY")
        if self.default_api_key:
            genai.configure(api_key=self.default_api_key, transport="rest")
        
        # Lista de prioridade de modelos, do mais preferível ao fallback.
        # ATENÇÃO: gemini-2.0-flash foi descontinuado (404 em produção em 2026-08-30).
        # Substituído por gemini-3.6-flash conforme mensagem oficial da API.
        self.MODEL_HIERARCHY = [
            'models/gemini-2.5-flash',             # 1. Qualidade e Velocidade
            'models/gemini-3.6-flash',             # 2. Substituto oficial do 2.0-flash
            'models/gemini-2.5-flash-lite',        # 3. Lite - Rápido e barato
            'models/gemini-2.5-flash-lite-preview-06-17', # 4. Preview lite
            'models/gemini-flash-latest',          # 5. Fallback genérico
            'models/gemini-2.5-pro'                # 6. Alta inteligência (se necessário)
        ]
        
        # Configurações de geração para a API, buscando respostas em JSON.
        self.generation_config = {
            "response_mime_type": "application/json",
            "max_output_tokens": 8192, 
            "temperature": 0.5,
            "top_p": 0.8
        }

        # Centraliza constantes de controle para fácil ajuste.
        self.max_retries = 2
        self.cooldown_seconds = 2 # Tempo de espera entre chamadas para evitar rate limit.

    def orchestrate_story(self, activity_context: Dict, path_structure: List[Dict], ai_config: Dict, room_id: str = None, user_api_key: str = None) -> Dict:
        """
        @desc Orquestra a geração de conteúdo para todos os passos de uma atividade.
        Itera sobre a estrutura do caminho de progressão, gerando conteúdo para cada
        passo do tipo 'quiz', 'narrative' ou 'content' de forma sequencial e robusta.

        @param {Dict} activity_context - Dados gerais da atividade (título, descrição).
        @param {List[Dict]} path_structure - A lista de passos do tabuleiro.
        @param {Dict} ai_config - Configurações da IA (personalidade, tom, etc.).
        @param {str} room_id - ID da sala Socket.io para enviar atualizações de progresso.
        @returns {Dict} Um mapa onde as chaves são os IDs dos passos e os valores são o conteúdo gerado.
        @note Espera-se que 'path_structure' contenha dicionários com chaves 'type' e 'id'.
        """
        logger.info(f"--- INICIANDO ORQUESTRAÇÃO (Hierarquia: {self.MODEL_HIERARCHY}) ---")
        steps_to_fill = [s for s in path_structure if s['type'] in ['quiz', 'narrative', 'content']]
        total_steps = len(steps_to_fill)
        
        final_map = {}
        
        # Cooldown dinâmico: Se o professor trouxe a própria chave (BYOK), não precisamos 
        # esperar 2 segundos por passo (evitando rate limit do sistema global).
        dynamic_cooldown = 0.1 if user_api_key else self.cooldown_seconds

        # Validar chaves antes de tentar gerar (Evita hang do ADC)
        active_key = user_api_key or self.default_api_key
        if not active_key:
            logger.error("Nenhuma chave de API (Usuário ou Sistema) configurada!")
            if room_id:
                socketio.emit('ai_error', {'message': 'Nenhuma chave de API configurada. Adicione sua chave no Perfil.', 'room_id': room_id}, namespace='/')
            return {}
        
        # Log de debug para saber qual origem da chave estamos usando
        if user_api_key:
            logger.debug("Usando a chave de API fornecida pelo usuário (BYOK).")
            genai.configure(api_key=user_api_key, transport="rest")
        else:
            logger.debug("Usando a chave de API padrão do sistema.")
            genai.configure(api_key=self.default_api_key, transport="rest")
        
        # Memória de execução persistente durante a orquestração
        execution_trace = {
            "last_narrative_event": "Início da jornada.", 
            "last_taught_concept": "Nenhum.", 
            "accumulated_knowledge": []
        }

        for index, step in enumerate(steps_to_fill):
            step_type = step['type']
            step_id = step['id']
            
            if room_id:
                percent = int((index / total_steps) * 100)
                # Garante que o frontend saia dos 5% iniciais
                if percent == 0: percent = 10 
                logger.info(f"Emitindo ai_progress para sala {room_id}: {percent}%")
                socketio.emit('ai_progress', {'percent': percent, 'message': f"Criando {self._get_step_label(step_type)}...", 'room_id': room_id}, namespace='/')
                socketio.sleep(0) # Força o context switch do eventlet para garantir o envio imediato da mensagem!

            # Build prompt usando a memória atualizada (agora separa a persona em System Instruction)
            system_instruction, full_prompt = build_prompt(step_type, index+1, total_steps, activity_context, ai_config, execution_trace)
            logger.debug(f"[DEBUG] Prompt para o passo {step_id} ({step_type}): {full_prompt[:200]}...")

            success = False
            current_retry = 0
            fallback_reason = "Erro na geração pela IA"
            
            # Model Routing Inteligente: Quiz usa flash-lite por ser tarefa extrativa simples e rápida.
            # Narrativa e Conteúdo exigem raciocínio complexo, logo começamos no flash normal.
            models_to_try = self.MODEL_HIERARCHY.copy()
            if step_type == 'quiz':
                # Move o flash-lite para o topo da lista se ele existir
                lite_models = [m for m in models_to_try if 'lite' in m]
                if lite_models:
                    models_to_try.remove(lite_models[0])
                    models_to_try.insert(0, lite_models[0])

            current_model_idx = 0

            # Tenta modelos da lista dinâmica
            while not success and current_model_idx < len(models_to_try):
                model_name = models_to_try[current_model_idx]
                logger.debug(f"[DEBUG] Tentando modelo {model_name} para {step_type}")
                try:
                    config = self.generation_config.copy()
                    if step_type == 'content':
                        config.pop('response_mime_type', None) # Desativa o JSON mode para markdown livre

                    # INSTRUÇÃO DE SISTEMA NATIVA: Melhora a aderência às regras e economiza tokens
                    model = genai.GenerativeModel(
                        model_name, 
                        generation_config=config,
                        system_instruction=system_instruction
                    )
                    response = model.generate_content(full_prompt)
                    logger.debug(f"[DEBUG] Resposta raw do LLM (primeiros 300 chars): {response.text[:300]}...")
                    
                    if step_type == 'content':
                        # FIX: O modelo retorna Markdown puro para 'content' (JSON mode desativado).
                        # Não tentar parsear como JSON — encapsular diretamente no schema esperado.
                        raw_text = response.text.strip()
                        valid_content = {
                            "type": "content",
                            "text_content": raw_text,
                            "video_url": "",
                            "material_link": ""
                        }
                    else:
                        valid_content = self._clean_and_parse_json(response.text)
                        
                    logger.debug(f"[DEBUG] JSON parseado: {valid_content}")
                    
                    is_valid = self._validate_content_integrity(step_type, valid_content)
                    logger.debug(f"[DEBUG] Validação de integridade ({step_type}): {is_valid}")
                    
                    if is_valid:
                        # Pós-processamento específico
                        if step_type == 'quiz':
                            valid_content = self._shuffle_quiz_options(valid_content)
                            
                        final_map[step_id] = valid_content
                        self._update_memory_trace(execution_trace, step_type, valid_content)
                        success = True
                        current_retry = 0 # Reseta retry
                        logger.info(f"✅ Passo {step_id} gerado com sucesso usando {model_name}.")
                    else:
                        raise Exception("Conteúdo estruturalmente inválido gerado pela IA")
                except google_exceptions.ResourceExhausted as e:
                    if current_retry < 1:
                        current_retry += 1
                        logger.warning(f"⚠️ Erro transitório (ResourceExhausted) em {model_name} (tentativa {current_retry}/2). Retentando em 2s...")
                        socketio.sleep(2)
                        continue
                    else:
                        logger.warning(f"⚠️ Cota esgotada em {model_name}. Rebaixando modelo...")
                        current_model_idx += 1
                        current_retry = 0
                except google_exceptions.InvalidArgument as e:
                    # FIX: API_KEY_INVALID (400) — não adianta tentar outros modelos ou outros passos.
                    # A chave é inválida para toda a sessão. Abortar TODA a orquestração agora.
                    error_msg = "Chave de API inválida. Verifique sua chave no perfil ou aguarde a cota do sistema ser restaurada."
                    logger.error(f"❌ ABORT: {error_msg} | Detalhe: {str(e)}")
                    if room_id:
                        socketio.emit('ai_error', {'message': error_msg, 'room_id': room_id}, namespace='/')
                    # Restaurar chave padrão antes de sair
                    if user_api_key and self.default_api_key:
                        genai.configure(api_key=self.default_api_key, transport="rest")
                    return {}  # Aborta toda a orquestração
                except Exception as e:
                    logger.error(f"Erro no modelo {model_name}: {str(e)}")
                    if "429" in str(e) or "Quota" in str(e) or "503" in str(e):
                        current_model_idx += 1
                    elif "404" in str(e) or "no longer available" in str(e).lower():
                        # Modelo deprecado — pular para o próximo na hierarquia
                        logger.warning(f"⚠️ Modelo {model_name} descontinuado (404). Pulando para o próximo.")
                        current_model_idx += 1
                    else:
                        fallback_reason = str(e)
                        break
            
            if not success:
                logger.error(f"Falha ao gerar passo {step_id}. Usando fallback estático.")
                final_map[step_id] = self._get_fallback_content(step_type, fallback_reason)

            socketio.sleep(dynamic_cooldown)

        if room_id:
             percent = 100
             logger.info(f"Emitindo ai_progress final 100% para sala {room_id}")
             socketio.emit('ai_progress', {'percent': percent, 'message': f"Finalizando roteiro..."}, room=room_id, namespace='/')
             socketio.sleep(0)
             logger.info(f"Emitindo ai_complete para sala {room_id} com chaves: {list(final_map.keys())}")
             socketio.emit('ai_complete', {'result': final_map, 'room_id': room_id}, namespace='/')
             socketio.sleep(0)

        # Restaurar chave default com REST para não vazar a custom key em outras threads assíncronas no escopo global
        if user_api_key and self.default_api_key:
            genai.configure(api_key=self.default_api_key, transport="rest")

        return final_map


    def _generate_with_sticky_fallback(self, prompt, start_index=0):
        """
        Tenta gerar a partir de um índice específico da hierarquia.
        Trata exceções tipadas de acordo com o SDK do Google.
        """
        last_error = None
        # Itera a partir do último modelo que funcionou
        for i in range(start_index, len(self.MODEL_HIERARCHY)):
            model_name = self.MODEL_HIERARCHY[i]
            try:
                current_model = genai.GenerativeModel(model_name, generation_config=self.generation_config)
                response = current_model.generate_content(prompt)
                return self._clean_and_parse_json(response.text), i # Retorna o conteúdo e o índice que funcionou
            except google_exceptions.ResourceExhausted as e:
                # HTTP 429: Rate Limit / Quota Exceeded
                logger.warning(f"⚠️ Cota estourada para {model_name} (ResourceExhausted). Subindo nível de fallback.")
                last_error = e
                continue
            except google_exceptions.InvalidArgument as e:
                # HTTP 400: API Key Invalid, Bad Request, Modelo não existe
                logger.error(f"❌ Erro não transitório (InvalidArgument) no modelo {model_name}: {e}. Abortando retry.")
                raise e # Erros 400 não se resolvem tentando o próximo modelo (exceto se for nome do modelo). Para API Key, interrompe na hora.
            except google_exceptions.PermissionDenied as e:
                # HTTP 403: Chave não tem permissão para a API
                logger.error(f"❌ Erro de permissão (PermissionDenied) no modelo {model_name}: {e}. Abortando retry.")
                raise e
            except Exception as e:
                # Outros erros sistêmicos (500, 503, Timeout).
                logger.error(f"Erro inesperado no modelo {model_name}: {e}")
                last_error = e
                continue
        raise last_error
    
    def _generate_content_with_fallback(self, prompt: str) -> str:
        """Tenta gerar usando a lista de modelos. Se um falhar (429), tenta o próximo."""
        """
        @desc Tenta gerar usando a lista de modelos. Se um falhar (429), tenta o próximo.
        @param {str} prompt - O prompt completo para a IA.
        @returns {str} O texto gerado pela IA.
        """
        
        last_error = None

        for model_name in self.MODEL_HIERARCHY:
            try:
                # Instancia o modelo da vez.
                current_model = genai.GenerativeModel(
                    model_name, 
                    generation_config=self.generation_config
                )
                
                logger.info(f"🤖 Tentando gerar com modelo: {model_name}...")
                
                # LOG: [AIService] Metadados do prompt (evita logar prompt inteiro por segurança/tamanho)
                if os.environ.get('FLASK_DEBUG'):
                    logger.debug(f"[AIService] Prompt length: {len(prompt)} chars")

                # Tenta gerar o conteúdo.
                response = current_model.generate_content(prompt)
                
                # Se chegou aqui, funcionou. Retorna o texto.
                logger.info(f"✅ Sucesso com {model_name}!")
                return response.text

            except Exception as e:
                error_str = str(e)
                # Se for erro de cota (429), loga e passa para o próximo modelo.
                # Se for erro de cota (429), loga e tenta de novo ou passa
                if "429" in error_str or "Quota exceeded" in error_str or "503" in error_str:
                    logger.warning(f"⚠️ Cota estourada para {model_name}. Tentando próximo...")
                    last_error = e
                    time.sleep(1) # Pequena pausa antes de trocar.
                    continue # Vai para o próximo modelo da lista
                else:
                    logger.error(f"Erro não relacionado a cota em {model_name}: {error_str}")
                    raise e

        # Se o loop terminou, todos os modelos falharam.
        logger.error("❌ Todos os modelos de fallback falharam.")
        # pyrefly: ignore [bad-raise]
        raise last_error
    
    def _validate_content_integrity(self, step_type: str, content: Dict) -> bool:
        """Retorna True se o conteúdo tiver o mínimo necessário para não quebrar o frontend."""
        """
        @desc Retorna True se o conteúdo tiver o mínimo necessário para não quebrar o frontend.
        @param {str} step_type - O tipo de passo ('narrative', 'quiz', 'content').
        @param {Dict} content - O conteúdo JSON parseado.
        @returns {bool} True se válido, False caso contrário.
        """
        if not content or not isinstance(content, dict):
            # LOG: [AIService] Falha de validação estrutural
            if os.environ.get('FLASK_DEBUG'):
                logger.debug(f"[AIService] Conteúdo inválido ou vazio para {step_type}")
            return False
            
        if step_type == 'narrative':
            # Precisa ter array de diálogos e pelo menos 2 falas
            dialogue = content.get('dialogue', [])
            has_dialogue = isinstance(dialogue, list) and len(dialogue) >= 2
            # Garante que as falas tenham texto
            valid_lines = all(d.get('text') and d.get('characterRole') for d in dialogue) if has_dialogue else False
            return has_dialogue and valid_lines

        elif step_type == 'quiz':
            # Precisa ter perguntas
            questions = content.get('questions', [])
            return isinstance(questions, list) and len(questions) > 0

        elif step_type == 'content':
            # Precisa ter texto
            text = content.get('text_content', '')
            return len(str(text)) > 50

        return True

    def _get_fallback_content(self, step_type: str, fallback_reason: str = "Ocorreu um erro ao gerar o conteúdo.") -> Dict:
        """
        @desc Gera conteúdo estático de emergência caso a IA falhe completamente.
        Esse fallback é vital para que a sala não fique bloqueada e o processo continue.
        Garante que o schema corresponda 100% ao que o Frontend (React) espera.
        """
        if step_type == 'narrative':
            return {
                "type": "narrative",
                "scenario": "/narrativa/cenarios/cenario1.webp",
                "characters": [
                    {"name": "Sistema", "image": "/narrativa/personagens/robo.webp", "emotion": "sad"}
                ],
                "dialogue": [
                    {"character": "Sistema", "text": "Houve uma falha na minha matriz gerativa..."},
                    {"character": "Sistema", "text": f"Motivo do erro: {fallback_reason}. A geração não pôde prosseguir."}
                ]
            }
        elif step_type == 'quiz':
            return {
                "type": "quiz",
                "questions": [
                    {
                        "text": f"O que aconteceu? (Erro: {fallback_reason})",
                        "options": ["A API falhou", "Tudo está perfeito", "O servidor caiu", "Magia"],
                        "correct_option": "A API falhou",
                        "points": 10,
                        "coins": 5,
                        "timeLimit": 30
                    }
                ]
            }
        elif step_type == 'content':
            return {
                "type": "content", 
                "text_content": f"### Erro na Geração\nOcorreu um problema ao comunicar com o modelo de linguagem.\n\nMotivo: {fallback_reason}\n\nRecomendamos editar este conteúdo manualmente.", 
                "video_url": "",
                "material_link": ""
            }
        return {}

    def _update_memory_trace(self, trace, step_type, content):
        """Atualiza a memória de curto prazo para o próximo passo."""
        if step_type == 'narrative':
            # Pega o diálogo
            dialogues = " ".join([f"{d.get('characterRole', 'Alguém')}: {d.get('text', '')}" for d in content.get('dialogue', [])])
            trace["last_narrative_event"] = dialogues[:800] + "..." 
            
            # Tenta inferir se houve alguma explicação técnica no diálogo e adiciona à memória
            # Isso ajuda a evitar que o próximo 'content' repita o que o mentor acabou de falar
            if len(dialogues) > 100:
                 trace["last_taught_concept"] = f"Tópico discutido brevemente na narrativa: {dialogues[:200]}..."

        elif step_type == 'content':
            topic = content.get('text_content', '')
            # Guarda um resumo maior para a IA saber exatamente o que já foi passado
            trace["last_taught_concept"] = topic[:600] 
            trace["accumulated_knowledge"].append(topic[:100])

    def _get_step_label(self, step_type: str) -> str:
        """Retorna um rótulo amigável para o tipo de passo."""
        labels = {'quiz': 'Desafio', 'narrative': 'Diálogo', 'content': 'Conteúdo'}
        return labels.get(step_type, 'Passo')


    def _generate_single_step(self, step_type: str, step_idx: int, total_steps: int, context: Dict, config: Dict, execution_trace: Dict) -> Dict:
        """
        @desc Gera o conteúdo para um único passo, montando o prompt completo.
        Reutiliza a lógica de construção de prompt centralizada.
        """
        full_prompt = build_prompt(step_type, step_idx, total_steps, context, config, execution_trace)
        
        # Geração e pós-processamento.
        response = self._generate_content_with_fallback(full_prompt)
        parsed_json = self._clean_and_parse_json(response)
        
        if step_type == 'quiz':
            parsed_json = self._shuffle_quiz_options(parsed_json)
            
        return parsed_json


    def _clean_and_parse_json(self, raw_text: str) -> Dict:
        """
        @desc Limpa e parseia uma string que deveria conter JSON.
        Utiliza a biblioteca json_repair para máxima resiliência contra
        respostas mal formatadas do LLM, e fallback com regex para blocos markdown.
        @param {str} raw_text - Texto bruto retornado pela IA.
        @returns {Dict} Dicionário parseado ou vazio em caso de erro.
        """
        
        # 1. Pré-limpeza simples (remover espaços e tags comuns markdown markdown de json)
        clean_text = raw_text.strip()
        
        # Se vier encapsulado em ```json ... ```, extrai o conteúdo do meio via Regex
        match = re.search(r'```(?:json)?\s*(.*?)\s*```', clean_text, re.DOTALL | re.IGNORECASE)
        if match:
            clean_text = match.group(1).strip()
            
        # Fast-Path: Tenta usar o parser nativo (super rápido) antes de engatilhar a lib externa.
        try:
            result = json.loads(clean_text)
            if isinstance(result, dict):
                return result
        except json.JSONDecodeError:
            pass # Falhou, vai pro fallback do json_repair
            
        try:
            # json_repair cuida magicamente de crases, vírgulas sobrando, etc.
            result = json_repair.loads(clean_text)
            if not isinstance(result, dict):
                logger.error("JSON Parse Error: Resultado não é um dicionário.")
                return {}
            return result
        except Exception as e:
            logger.error(f"JSON Parse Error: {e} | Text snippet: {raw_text[:100]}...")
            return {}
    
    def _shuffle_quiz_options(self, content: Dict) -> Dict:
        """
        @desc Embaralha as opções de um quiz e garante que a resposta correta seja atualizada.
        Também limpa prefixos comuns que a IA pode adicionar (ex: "A)", "1.").
        Isso evita que a resposta correta seja sempre a primeira e melhora a
        qualidade do quiz.
        @param {Dict} content - O conteúdo do quiz.
        @returns {Dict} O conteúdo do quiz com as opções embaralhadas.
        """
        if content.get('type') != 'quiz' or 'questions' not in content: 
            return content
            
        for q in content['questions']:
            raw_options = q.get('options', [])
            raw_correct = q.get('correct_option', "")
            
            # 1. Função auxiliar para limpar prefixos (A), 1., etc).
            def clean_text(text):
                return re.sub(r'^([A-Z][\).]\s*|\d+[\).]\s*)', '', text).strip()

            # 2. Limpa todas as opções e a resposta correta.
            clean_opts = [clean_text(o) for o in raw_options]
            clean_correct = clean_text(raw_correct)
            
            # 3. Garante que a resposta correta exista na lista de opções limpas.
            # Se a IA alucinou uma resposta que não está nas opções, assume a primeira como correta
            # para evitar que o quiz fique sem resposta válida.
            if clean_correct not in clean_opts:
                # Tenta encontrar a opção mais parecida gerada pela IA
                matches = get_close_matches(clean_correct, clean_opts, n=1, cutoff=0.6)
                if matches:
                    clean_correct = matches[0]
                    logger.info(f"Refactor: Match aproximado encontrado: {clean_correct}")
                else:
                    logger.warning("Falha crítica: Nenhuma opção se assemelha à resposta correta.")
                    # Aqui talvez seja melhor marcar o passo como 'precisa de revisão'

            # 4. Cria pares (opção, é_correta?) para embaralhar mantendo a referência.
            # Ex: [("Java", False), ("Python", True), ("C++", False)].
            pairs = []
            for opt in clean_opts:
                is_correct = (opt == clean_correct)
                pairs.append((opt, is_correct))

            # 5. Embaralha a lista de pares.
            random.shuffle(pairs)
            
            # 6. Reconstrói a lista de opções e atualiza a resposta correta.
            q['options'] = [p[0] for p in pairs]
            
            # Encontra qual é a opção correta na nova ordem.
            for opt, is_correct in pairs:
                if is_correct:
                    q['correct_option'] = opt
                    break
                
        return content
    
    
    def moderate_content(self, text: str) -> Dict:
        """
        @desc Analisa texto em busca de discurso de ódio usando hierarquia de modelos.
        Itera sobre a lista de modelos (fallback) até conseguir uma resposta válida.
        """
        # Validação rápida para economizar tokens
        if len(text) < 5:
            return {"safe": True, "reason": "Texto muito curto", "category": "none"}

        prompt = f"""
        ATUE COMO: Um Moderador de Conteúdo para uma plataforma educacional (jovens e adolescentes).
        
        TAREFA: Analise o texto abaixo e classifique se ele viola regras de segurança.
        
        TEXTO DO USUÁRIO: "{text}"
        
        CATEGORIAS DE VIOLAÇÃO (Nível Estrito):
        1. Hate Speech (Racismo, Homofobia, Xenofobia, Sexismo).
        2. Harassment (Bullying, Ataques Pessoais, Ameaças).
        3. Sexual (Conteúdo explícito ou sugestivo).
        4. Violence (Incentivo à violência ou automutilação).
        
        SAÍDA ESPERADA (JSON):
        {{
            "safe": boolean, // True se puder ser publicado, False se violar regras.
            "category": "string", // Categoria da violação ou "none".
            "reason": "string" // Explicação curta (PT-BR) para o usuário.
        }}
        """

        # Loop de Fallback: Tenta cada modelo na hierarquia
        for model_name in self.MODEL_HIERARCHY:
            try:
                # Configura o modelo da vez
                model = genai.GenerativeModel(
                    model_name, 
                    generation_config={"response_mime_type": "application/json"}
                )
                
                logger.info(f"🛡️ Verificando segurança com modelo: {model_name}...")
                response = model.generate_content(prompt)
                
                # Tenta parsear o JSON
                result = json.loads(response.text)
                
                # Validação estrutural da resposta da IA
                if 'safe' not in result:
                    logger.warning(f"⚠️ Modelo {model_name} retornou JSON inválido (sem chave 'safe'). Tentando próximo...")
                    continue # Força o loop a tentar o próximo modelo
                
                # SUCESSO: Retorna o resultado imediatamente
                return result

            except google_exceptions.ResourceExhausted as e:
                # Se for erro de cota (429), loga e tenta o próximo
                logger.warning(f"⚠️ Cota estourada na moderação com {model_name}: {str(e)}. Tentando próximo...")
                time.sleep(1) # Breve pausa para não espamar a API em caso de erro sistêmico
                continue
            except google_exceptions.InvalidArgument as e:
                # 400, API Key errada, quebra de imediato.
                logger.error(f"❌ Erro não transitório na moderação com {model_name}: {str(e)}.")
                break # Sai do loop pois a chave ou modelo é permanentemente inválido
            except Exception as e:
                logger.warning(f"⚠️ Erro desconhecido na moderação com {model_name}: {str(e)}. Tentando próximo...")
                time.sleep(1)
                continue

        # Se o loop terminar e nenhum modelo responder:
        logger.error("❌ Todos os modelos de moderação falharam.")
        return {
            "safe": False, 
            "reason": "O sistema de verificação está indisponível no momento. Tente novamente mais tarde.", 
            "category": "system_error"
        }

ai_service = AIService()