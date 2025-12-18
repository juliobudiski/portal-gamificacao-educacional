import google.generativeai as genai
import os
import json
import logging
import time
import re
from typing import Dict, List, Any
from ..extensions import socketio
import random

logger = logging.getLogger(__name__)
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
        api_key = os.environ.get("GOOGLE_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
        
        # Lista de prioridade de modelos, do mais preferível ao fallback.
        self.MODEL_HIERARCHY = [
            'models/gemini-2.5-flash',             # 1. Qualidade e Velocidade (Novo)
            'models/gemini-2.0-flash-lite-preview', # 2. Otimizado para cota alta (Lite)
            'models/gemini-2.0-flash'             # 3. O que você estava usando
            
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
        self.cooldown_seconds = 5 # Tempo de espera entre chamadas para evitar rate limit.

    def orchestrate_story(self, activity_context: Dict, path_structure: List[Dict], ai_config: Dict, client_socket_id: str = None) -> Dict:
        """
        @desc Orquestra a geração de conteúdo para todos os passos de uma atividade.
        Itera sobre a estrutura do caminho de progressão, gerando conteúdo para cada
        passo do tipo 'quiz', 'narrative' ou 'content' de forma sequencial e robusta.

        @param {Dict} activity_context - Dados gerais da atividade (título, descrição).
        @param {List[Dict]} path_structure - A lista de passos do tabuleiro.
        @param {Dict} ai_config - Configurações da IA (personalidade, tom, etc.).
        @param {str} client_socket_id - ID do socket do cliente para enviar atualizações de progresso.
        @returns {Dict} Um mapa onde as chaves são os IDs dos passos e os valores são o conteúdo gerado.
        """
        logger.info(f"--- INICIANDO ORQUESTRAÇÃO ROBUSTA (Hierarquia: {self.MODEL_HIERARCHY}) ---")
        
        steps_to_fill = [s for s in path_structure if s['type'] in ['quiz', 'narrative', 'content']]
        total_steps = len(steps_to_fill)
        
        # Limite de segurança para evitar execuções muito longas e custosas.
        if len(steps_to_fill) > 15:
            steps_to_fill = steps_to_fill[:15] 
            logger.warning("Trilha muito longa. Limitando geração aos primeiros 15 passos.")
        if not steps_to_fill:
            return {}
        
        # "Memória de curto prazo" para dar contexto sequencial à IA.
        execution_trace = {
            "last_narrative_event": "A aventura começou.",
            "last_taught_concept": "Conceitos introdutórios.",
            "accumulated_knowledge": []
        }
        
        final_map = {}
        # TODO: Considerar tornar o cooldown dinâmico com base em headers de resposta da API, se disponíveis.

        for index, step in enumerate(steps_to_fill):
            step_number = index + 1
            step_type = step['type']
            step_id = step['id']
            
            # Feedback visual via Socket
            if client_socket_id: # pragma: no cover
                try:
                    percent = int(((index) / total_steps) * 100)
                    socketio.emit('ai_progress', {
                        'percent': percent,
                        'message': f"Criando {self._get_step_label(step_type)} ({step_number}/{total_steps})...",
                    }, to=client_socket_id)
                except Exception:
                    pass
            
            # Loop de retentativa para garantir que o conteúdo seja gerado.
            attempts = 0
            valid_content = None
            
            while attempts < self.max_retries and not valid_content:
                attempts += 1
                try:
                    if attempts > 1:
                        logger.warning(f"Tentativa {attempts} para o passo {step_id} ({step_type})...")

                    raw_content = self._generate_single_step(
                        step_type, step_number, total_steps, 
                        activity_context, ai_config, execution_trace
                    )
                    
                    # Validação de integridade para garantir que o JSON tem os campos mínimos.
                    if self._validate_content_integrity(step_type, raw_content):
                        valid_content = raw_content
                    else:
                        logger.warning(f"Conteúdo inválido gerado para {step_type}. Retrying...")
                        
                except Exception as e:
                    error_msg = str(e)
                    logger.error(f"Erro na tentativa {attempts} do passo {step_id}: {error_msg}")
                    
                    # Lógica de Backoff para Erro 429 (Rate Limit)
                    if "429" in error_msg:
                        wait_time = (attempts + 1) * self.cooldown_seconds # Aumenta a espera a cada tentativa.
                        if client_socket_id:
                            socketio.emit('ai_progress', {
                                'percent': int(((index) / total_steps) * 100),
                                'message': f"Atingimos o limite da IA. Aguardando {wait_time}s para retomar...",
                            }, to=client_socket_id)
                        
                        logger.warning(f"⚠️ Quota excedida (429). Pausando por {wait_time} segundos...")
                        time.sleep(wait_time)
                    else:
                        time.sleep(2) # Backoff simples para outros erros

            # Se falhou após 3 tentativas, usa fallback vazio para não travar o app
            if not valid_content:
                logger.error(f"FALHA CRÍTICA: Não foi possível gerar passo {step_id} após {self.max_retries} tentativas.")
                valid_content = self._get_fallback_content(step_type)

            # Atualiza a memória com o resultado do passo atual para o próximo.
            self._update_memory_trace(execution_trace, step_type, valid_content)

            final_map[step_id] = valid_content
            
            # Pausa estratégica (cooldown) para evitar atingir o limite de requisições por minuto da API.
            if index < total_steps - 1:
                logger.info(f"⏳ Cooldown: Pausando por {self.cooldown_seconds}s para evitar rate limit...")
                time.sleep(self.cooldown_seconds)

        if client_socket_id: # pragma: no cover
            socketio.emit('ai_progress', {'percent': 100, 'message': "Finalizando..."}, to=client_socket_id)

        return final_map

    def _generate_content_with_fallback(self, prompt: str) -> str:
        """Tenta gerar usando a lista de modelos. Se um falhar (429), tenta o próximo."""
        
        last_error = None

        for model_name in self.MODEL_HIERARCHY:
            try:
                # Instancia o modelo da vez.
                current_model = genai.GenerativeModel(
                    model_name, 
                    generation_config=self.generation_config
                )
                
                logger.info(f"🤖 Tentando gerar com modelo: {model_name}...")
                
                # Tenta gerar o conteúdo.
                response = current_model.generate_content(prompt)
                
                # Se chegou aqui, funcionou. Retorna o texto.
                logger.info(f"✅ Sucesso com {model_name}!")
                return response.text

            except Exception as e:
                error_str = str(e)
                # Se for erro de cota (429), loga e passa para o próximo modelo.
                if "429" in error_str or "Quota exceeded" in error_str:
                    logger.warning(f"⚠️ Cota estourada para {model_name}. Tentando próximo...")
                    last_error = e
                    time.sleep(1) # Pequena pausa antes de trocar.
                    continue # Vai para o próximo modelo da lista
                else:
                    # Se for outro erro (ex: erro de sintaxe, filtro de segurança), 
                    # não adianta trocar de modelo, então quebra.
                    logger.error(f"Erro não relacionado a cota em {model_name}: {error_str}")
                    raise e

        # Se o loop terminou, todos os modelos falharam.
        logger.error("❌ Todos os modelos de fallback falharam.")
        raise last_error
    
    def _validate_content_integrity(self, step_type: str, content: Dict) -> bool:
        """Retorna True se o conteúdo tiver o mínimo necessário para não quebrar o frontend."""
        if not content or not isinstance(content, dict):
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

    def _get_fallback_content(self, step_type):
        """Retorna estrutura vazia segura em caso de falha total."""
        if step_type == 'narrative':
            return {"type": "narrative", "dialogue": [], "scenario": "", "characters": []}
        elif step_type == 'quiz':
            return {"type": "quiz", "questions": []}
        return {"type": "content", "text_content": "Erro na geração. Edite manualmente.", "video_url": ""}

    def _update_memory_trace(self, trace, step_type, content):
        """Atualiza a memória de curto prazo para o próximo passo."""
        if step_type == 'narrative':
            dialogues = " ".join([f"{d.get('characterRole', 'Alguém')}: {d.get('text', '')}" for d in content.get('dialogue', [])])
            trace["last_narrative_event"] = dialogues[:800] + "..." 
        elif step_type == 'content':
            topic = content.get('text_content', '')[:300]
            trace["last_taught_concept"] = topic
            trace["accumulated_knowledge"].append(topic[:50])

    def _get_step_label(self, step_type: str) -> str:
        """Retorna um rótulo amigável para o tipo de passo."""
        labels = {'quiz': 'Desafio', 'narrative': 'Diálogo', 'content': 'Conteúdo'}
        return labels.get(step_type, 'Passo')

    def _get_system_persona(self, config: Dict) -> str:
        """
        @desc Monta a instrução de "persona" do sistema.
        Define a personalidade, mentalidade pedagógica e tom de escrita da IA.
        @param {Dict} config - Configurações da IA vindas do frontend.
        @returns {str} O texto formatado da persona.
        """
        personality = config.get('personality', 'Socrático')
        tone = config.get('tone', 'Aventura')

        base_persona = f"""
        VOCÊ É: Um Tech Lead Sênior (Google/Netflix ex-employee) e Roteirista premiado de Ficção Interativa.
        
        SUA MENTALIDADE (PEDAGOGIA):
        1.  **Anti-Tédio:** Você odeia definições de dicionário ("X é uma ferramenta que..."). Você explica COMO e POR QUE usar.
        2.  **Contexto Real:** Tudo deve ser aplicado a um cenário de produção (servidores caindo, bugs em produção, prazos apertados).
        3.  **Método:** Use a abordagem '{personality}'. Se for 'Socrático', faça perguntas que guiem. Se for 'Hardcore', seja direto e exija atenção aos detalhes.
        
        SEU ESTILO DE ESCRITA (TOM '{tone}'):
        -   Evite linguagem corporativa vazia ("alavancar sinergias").
        -   Use terminologia técnica correta (Stack Trace, Deploy, Commit, Branch), mas com uma narrativa envolvente.
        """
        return base_persona

    def _generate_single_step(self, step_type: str, step_idx: int, total_steps: int, context: Dict, config: Dict, execution_trace: Dict) -> Dict:
        """
        @desc Gera o conteúdo para um único passo, montando o prompt completo.
        Este é o coração do prompt engineering, onde a persona, o contexto, a memória,
        a missão específica e as regras de formato são combinadas.

        @param {str} step_type - O tipo de passo a ser gerado ('quiz', 'narrative', etc.).
        @param {int} step_idx - O número do passo atual (1-based).
        @param {int} total_steps - O número total de passos a serem gerados.
        @param {Dict} context - Contexto geral da atividade.
        @param {Dict} config - Configurações da IA.
        @param {Dict} execution_trace - A "memória" do que já foi gerado.
        @returns {Dict} O conteúdo JSON gerado e validado para o passo.
        """
        teaching_focus = config.get('teachingFocus') or context.get('title', 'Tópico não definido')
        target_audience = config.get('targetAudience', 'Junior')
        characters_list = config.get('charactersList', [])
        
        # Formata o elenco para a IA saber quem está falando
        formatted_cast = "\n".join([
            f"- {c['role']} ({c['type']}): Use a imagem '{c.get('image', '')}'." 
            for c in characters_list
        ])

        # Define a fase da história para guiar o tom da IA.
        progress_ratio = step_idx / total_steps
        story_phase = "INTRODUÇÃO (O Problema Surge)"
        if progress_ratio > 0.3: story_phase = "DESENVOLVIMENTO (Tentativa e Erro)"
        if progress_ratio > 0.8: story_phase = "CLÍMAX (A Solução Final)"

        # Montagem do prompt modular.
        system_persona = self._get_system_persona(config)
        specific_instruction = self._get_dynamic_instruction(step_type, execution_trace, story_phase, formatted_cast, teaching_focus, config)
        json_schema = self._get_strict_instructions(step_type, config.get('questionsPerQuiz', 4), config.get('linesPerNarrative', 6), characters_list)

        full_prompt = f"""
        {system_persona}

        --- CONTEXTO ATUAL ---
        TÓPICO DE ENSINO: "{teaching_focus}"
        NÍVEL DO ALUNO: {target_audience} (Ajuste a complexidade técnica para este nível)
        FASE DA NARRATIVA: {story_phase}
        
        --- MEMÓRIA (O que já aconteceu) ---
        Último Evento: "{execution_trace['last_narrative_event']}"
        Conceito Ensinado Recentemente: "{execution_trace['last_taught_concept']}"

        --- SUA MISSÃO AGORA ({step_type.upper()}) ---
        {specific_instruction}

        --- REGRAS DE SAÍDA (EXTREMAMENTE CRÍTICO) ---
        1. Responda APENAS com JSON válido.
        2. NÃO use Markdown (sem ```json).
        3. Siga estritamente o schema abaixo.
        
        {json_schema}
        """
        
        # Geração e pós-processamento.
        response = self._generate_content_with_fallback(full_prompt)
        parsed_json = self._clean_and_parse_json(response)
        
        if step_type == 'quiz':
            parsed_json = self._shuffle_quiz_options(parsed_json)
            
        return parsed_json

    def _get_dynamic_instruction(self, step_type: str, trace: Dict, phase: str, cast: str, topic: str, config: Dict) -> str:
        """
        @desc Retorna a instrução específica da tarefa para a IA com base no tipo de passo.
        @param {str} step_type - Tipo do passo ('narrative', 'content', 'quiz').
        @param {Dict} trace - Memória da execução.
        @param {str} phase - Fase atual da história.
        @param {str} cast - Elenco de personagens formatado.
        @param {str} topic - Tópico de ensino principal.
        @param {Dict} config - Configurações da IA.
        @returns {str} A instrução detalhada para a tarefa.
        """
        if step_type == 'narrative':
            return f"""
            **TAREFA:** Escrever um roteiro de diálogo curto e tenso.
            
            **PERSONAGENS DISPONÍVEIS:**
            {cast}
            
            **DIRETRIZES DE ROTEIRO:**
            1.  **O Conflito:** Crie um problema técnico ESPECÍFICO relacionado a "{topic}". 
                * RUIM: "O sistema não funciona."
                * BOM: "O endpoint de login está retornando 403 Forbidden intermitente." ou "O loop infinito travou a main thread."
            2.  **Vozes Distintas:**
                * O **Mentor** deve ser calmo, questionador e sênior.
                * O **Aluno** deve demonstrar urgência, confusão ou iniciativa (dependendo do erro).
            3.  **Show, Don't Tell:** Não faça eles falarem "Nossa, precisamos estudar X". Faça o erro acontecer na tela deles.
            4.  **Gancho (Cliffhanger):** Termine o diálogo no momento exato em que eles percebem que não sabem como resolver sem aprender o conceito "{topic}".
            """

        elif step_type == 'content':
            return f"""
            **TAREFA:** Criar um guia técnico prático ("Cheat Sheet") para resolver o problema da narrativa anterior.
            
            **ESTRUTURA OBRIGATÓRIA DO CONTEÚDO (Markdown):**
            
            1.  **O Diagnóstico (Por que quebrou?):**
                - Explique o erro técnico que ocorreu na história. Conecte a teoria à prática.
                - Ex: "O erro 403 aconteceu porque o token JWT expirou..."
            
            2.  **A Teoria (Mental Model):**
                - Use uma analogia rápida se ajudar.
                - Explique o conceito de "{topic}" de forma direta.
            
            3.  **A Solução (Code Snippet):**
                - Forneça um bloco de código Python/JS (conforme o tópico) mostrando a implementação correta.
                - O código deve seguir boas práticas (Clean Code).
            
            **REGRAS DE ESTILO:**
            - Use formatação rica: **Negrito**, `Código Inline`, > Blockquotes para avisos.
            - CÓDIGO: Sempre envolva blocos de código com três crases e o nome da linguagem (ex: ```python ... ```).
            - ESPAÇAMENTO: Use sempre duas quebras de linha (\n\n) para separar parágrafos de texto.
            - Seja conciso. Alunos odeiam textão.
            """

        elif step_type == 'quiz':
            return f"""
            **TAREFA:** Criar um desafio de validação de conhecimento (Quiz).
            
            **DIRETRIZES DE DESIGN DE PERGUNTAS (Bloom's Taxonomy):**
            1.  **Evite Decoreba:** NÃO pergunte "O que é X?".
            2.  **Foco em Cenários:** Pergunte "Dado o código abaixo, o que acontece se...?" ou "Qual a melhor arquitetura para resolver Y?".
            3.  **Debug Mental:** Coloque um trecho de código com um bug sutil relacionado a "{topic}" e peça para o aluno identificar.
            4.  **Feedback Educativo:** O campo 'explanation' deve explicar POR QUE a resposta certa é a certa e POR QUE a errada é uma armadilha comum.
            
            **CONTEXTO:** Baseie as perguntas no conceito "{topic}" e no problema narrado na história.
            """
        return ""

    def _get_strict_instructions(self, step_type: str, quiz_count: int, dialogue_len: int, char_list: List[Dict]) -> str:
        """
        @desc Define e retorna o schema JSON que a IA deve seguir para sua resposta.
        @param {str} step_type - Tipo do passo.
        @param {int} quiz_count - Número de questões a gerar para um quiz.
        @param {int} dialogue_len - Número de falas a gerar para uma narrativa.
        @param {List[Dict]} char_list - Lista de personagens para extrair papéis.
        """
        # Extrai nomes para ajudar a IA
        roles = [c['role'] for c in char_list]
        role1 = roles[0] if len(roles) > 0 else "Mentor"
        role2 = roles[1] if len(roles) > 1 else "Aluno"

        if step_type == 'narrative':
            return f"""
            JSON Schema Obrigatório para NARRATIVA:
            {{
                "type": "narrative",
                "scenario": "/narrativa/cenarios/cenario1.webp",
                "characters": [
                    {{ "role": "{role1}", "image": "/narrativa/personagens/instrutor1.webp" }},
                    {{ "role": "{role2}", "image": "/narrativa/personagens/aluno1.webp" }}
                ],
                "dialogue": [
                    {{ "characterRole": "{role1}", "text": "Frase curta e direta sobre o problema." }},
                    {{ "characterRole": "{role2}", "text": "Pergunta ou reação ao erro." }}
                ]
            }}
            Gere EXATAMENTE {dialogue_len} linhas de 'dialogue'. Use apenas URLs válidas fornecidas anteriormente ou as do exemplo.
            """
        elif step_type == 'quiz':
            return f"""
            JSON Schema Obrigatório para QUIZ ({quiz_count} questões):
            {{
                "type": "quiz",
                "questions": [
                    {{
                        "text": "Pergunta técnica sobre o erro...",
                        "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
                        "correct_option": "Opção A",
                        "explanation": "Por que é A...",
                        "points": 10, "coins": 5, "timeLimit": 60
                    }}
                ]
            }}
            """
        elif step_type == 'content':
            return f"""
            JSON Schema para CONTEÚDO:
            {{
                "type": "content",
                "text_content": "### Título\\n\\nExplicação técnica direta.\\n\\n```python\\nprint('Exemplo')\\n```",
                "video_url": "",
                "material_link": ""
            }}
            """
        return ""

    def _clean_and_parse_json(self, raw_text: str) -> Dict:
        """
        @desc Limpa e parseia uma string que deveria conter JSON.
        Remove blocos de código Markdown, texto introdutório e vírgulas finais
        antes de tentar o parse, tornando o processo mais resiliente a respostas
        mal formatadas da IA.
        """
        try:
            text = raw_text.strip()
            # 1. Remove Markdown (```json ... ```)
            if "```" in text:
                text = re.sub(r'```(?:json)?', '', text)
                text = re.sub(r'```', '', text)
            
            # 2. Encontra o JSON real (ignora texto introdutório da IA)
            start_idx = text.find('{')
            end_idx = text.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                text = text[start_idx:end_idx]

            # 3. Limpeza de "sujeira" comum em JSON gerado
            # Remove vírgulas trailling (ex: [1, 2,] -> [1, 2])
            text = re.sub(r',\s*([\]}])', r'\1', text)
            
            # Tenta carregar
            return json.loads(text)

        except json.JSONDecodeError as e:
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
                logger.warning(f"Resposta correta '{raw_correct}' não encontrada nas opções. Usando a primeira como fallback.")
                clean_correct = clean_opts[0] 

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

ai_service = AIService()