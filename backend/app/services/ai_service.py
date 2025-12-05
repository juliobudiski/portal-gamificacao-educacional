import google.generativeai as genai
import os
import json
import logging
import time
import re
from typing import Dict, List, Any, Optional
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
# Mantenha as constantes globais (AVAILABLE_SCENARIOS, AVAILABLE_CHARACTERS) 
# no topo do arquivo como já estavam.

class AIService:
    def __init__(self):
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            logger.warning("GOOGLE_API_KEY não configurada.")
        
        try:
            if api_key:
                genai.configure(api_key=api_key)
                logger.info("Google GenAI configurado.")
        except Exception as e:
            logger.error(f"Falha Google GenAI: {e}")

        self.model_name = 'gemini-2.0-flash' 
        self.model = genai.GenerativeModel(
            self.model_name, 
            generation_config={
                "response_mime_type": "application/json",
                "max_output_tokens": 8192, 
                "temperature": 0.5, # Aumentei levemente para criatividade
                "top_p": 0.8
            }
        )

    def orchestrate_story(self, activity_context: Dict, path_structure: List[Dict], ai_config: Dict, client_socket_id: str = None) -> Dict:
        logger.info(f"--- INICIANDO ORQUESTRAÇÃO ROBUSTA (Modelo: {self.model_name}) ---")
        
        steps_to_fill = [s for s in path_structure if s['type'] in ['quiz', 'narrative', 'content']]
        total_steps = len(steps_to_fill)
        
        if not steps_to_fill:
            return {}
        
        execution_trace = {
            "last_narrative_event": "A aventura começou.",
            "last_taught_concept": "Conceitos introdutórios.",
            "accumulated_knowledge": []
        }
        
        final_map = {}
        MAX_RETRIES = 3 # Integridade: Tenta 3x antes de desistir

        for index, step in enumerate(steps_to_fill):
            step_number = index + 1
            step_type = step['type']
            step_id = step['id']
            
            # Feedback visual via Socket
            if client_socket_id:
                try:
                    percent = int(((index) / total_steps) * 100)
                    socketio.emit('ai_progress', {
                        'percent': percent,
                        'message': f"Criando {self._get_step_label(step_type)} ({step_number}/{total_steps})...",
                    }, to=client_socket_id)
                except Exception:
                    pass
            
            # --- LOOP DE INTEGRIDADE (RETRY MECHANISM) ---
            attempts = 0
            valid_content = None
            
            while attempts < MAX_RETRIES and not valid_content:
                attempts += 1
                try:
                    if attempts > 1:
                        logger.warning(f"Tentativa {attempts} para o passo {step_id} ({step_type})...")

                    raw_content = self._generate_single_step(
                        step_type, step_number, total_steps, 
                        activity_context, ai_config, execution_trace
                    )
                    
                    # Validação de Integridade
                    if self._validate_content_integrity(step_type, raw_content):
                        valid_content = raw_content
                    else:
                        logger.warning(f"Conteúdo inválido gerado para {step_type}. Retrying...")
                        
                except Exception as e:
                    logger.error(f"Erro na tentativa {attempts} do passo {step_id}: {str(e)}")
                    time.sleep(1) # Backoff simples

            # Se falhou após 3 tentativas, usa fallback vazio para não travar o app
            if not valid_content:
                logger.error(f"FALHA CRÍTICA: Não foi possível gerar passo {step_id} após {MAX_RETRIES} tentativas.")
                valid_content = self._get_fallback_content(step_type)

            # --- ATUALIZAÇÃO DA MEMÓRIA ---
            self._update_memory_trace(execution_trace, step_type, valid_content)

            final_map[step_id] = valid_content
            socketio.sleep(0.5) # Evita rate limit

        if client_socket_id:
            socketio.emit('ai_progress', {'percent': 100, 'message': "Finalizando..."}, to=client_socket_id)

        return final_map

    # --- NOVO: VALIDADOR DE INTEGRIDADE ---
    def _validate_content_integrity(self, step_type: str, content: Dict) -> bool:
        """Retorna True se o conteúdo tiver o mínimo necessário para não quebrar o frontend."""
        if not content or not isinstance(content, dict):
            return False
            
        if step_type == 'narrative':
            # Precisa ter array de diálogos e pelo menos 2 falas
            dialogues = content.get('dialogue', [])
            has_dialogue = isinstance(dialogues, list) and len(dialogues) >= 2
            # Garante que as falas tenham texto
            valid_lines = all(d.get('text') and d.get('characterRole') for d in dialogues) if has_dialogue else False
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

    def _get_step_label(self, type):
        labels = {'quiz': 'Desafio', 'narrative': 'História', 'content': 'Conteúdo'}
        return labels.get(type, 'Passo')

    # -------------------------------------------------------------------------
    # NOVO MÉTODO: Centraliza a Persona (A "Alma" da IA)
    # -------------------------------------------------------------------------
    def _get_system_persona(self, config: Dict) -> str:
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

    # -------------------------------------------------------------------------
    # REFACTOR: _generate_single_step (Orquestrador do Prompt)
    # -------------------------------------------------------------------------
    def _generate_single_step(self, step_type, step_idx, total_steps, context, config, execution_trace):
        # 1. Metadados
        teaching_focus = config.get('teachingFocus') or context.get('title')
        target_audience = config.get('targetAudience', 'Junior')
        characters_list = config.get('charactersList', [])
        
        # Formata o elenco para a IA saber quem está falando
        formatted_cast = "\n".join([
            f"- {c['role']} ({c['type']}): Use a imagem '{c.get('image', '')}'." 
            for c in characters_list
        ])

        # 2. Define a Fase da História
        progress_ratio = step_idx / total_steps
        story_phase = "INTRODUÇÃO (O Problema Surge)"
        if progress_ratio > 0.3: story_phase = "DESENVOLVIMENTO (Tentativa e Erro)"
        if progress_ratio > 0.8: story_phase = "CLÍMAX (A Solução Final)"

        # 3. Montagem do Prompt Modular
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
        
        # Geração
        response = self.model.generate_content(full_prompt)
        parsed_json = self._clean_and_parse_json(response.text)
        
        if step_type == 'quiz':
            parsed_json = self._shuffle_quiz_options(parsed_json)
            
        return parsed_json

    # -------------------------------------------------------------------------
    # REFACTOR: _get_dynamic_instruction (Onde a mágica acontece)
    # -------------------------------------------------------------------------
    def _get_dynamic_instruction(self, step_type, trace, phase, cast, topic, config):
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

    def _get_strict_instructions(self, step_type, quiz_count, dialogue_len, char_list):
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
        """Parse robusto que limpa Markdown e trata erros comuns de LLM."""
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
        if content.get('type') != 'quiz' or 'questions' not in content: return content
        for q in content['questions']:
            opts = q.get('options', [])
            corr = q.get('correct_option', "")
            # Limpa prefixos comuns (A), 1., etc)
            clean_opts = [re.sub(r'^([A-Z][\).]\s*|\d+[\).]\s*)', '', o) for o in opts]
            
            # Atualiza a correta se ela tinha prefixo
            if corr in opts:
                idx = opts.index(corr)
                corr = clean_opts[idx]
            elif re.match(r'^([A-Z][\).]\s*|\d+[\).]\s*)', corr):
                 corr = re.sub(r'^([A-Z][\).]\s*|\d+[\).]\s*)', '', corr)

            # Embaralha
            c = list(zip(clean_opts, [o == corr for o in clean_opts])) # Marca qual é a correta
            random.shuffle(c) # Só aqui usamos random, não precisa importar se já tiver
            
            q['options'] = [x[0] for x in c]
            # Recupera a string correta (caso o shuffle mude a ordem, precisamos saber quem era)
            # Mas espera, a lógica acima estava errada. O jeito mais fácil:
            # Reencontrar a string correta na lista limpa.
            if corr in q['options']:
                q['correct_option'] = corr
            else:
                # Fallback se a limpeza quebrou o match exato
                q['correct_option'] = q['options'][0] 
                
        return content

ai_service = AIService()