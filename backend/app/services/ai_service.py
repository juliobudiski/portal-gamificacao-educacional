import google.generativeai as genai
import os
import json
import logging
import time
import re
from typing import Dict, List, Any, Optional
from ..extensions import socketio
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
                "temperature": 0.4,
                "top_p": 0.8
            }
        )

    def orchestrate_story(self, activity_context: Dict, path_structure: List[Dict], ai_config: Dict, client_socket_id: str = None) -> Dict:
        logger.info(f"--- INICIANDO ORQUESTRAÇÃO INTELIGENTE (Modelo: {self.model_name}) ---")
        
        # Filtra apenas os passos preenchíveis
        steps_to_fill = [s for s in path_structure if s['type'] in ['quiz', 'narrative', 'content']]
        total_steps = len(steps_to_fill)
        
        if not steps_to_fill:
            return {}
        
        # --- MEMÓRIA DE CURTO PRAZO ---
        # Armazena o resumo do que aconteceu nos passos anteriores para dar continuidade
        execution_trace = {
            "last_narrative_event": "A aventura começou.", # O que aconteceu na última história
            "last_taught_concept": "Nenhum conceito ensinado ainda.", # O que foi ensinado no último conteúdo
            "accumulated_knowledge": [] # Lista de tópicos já cobertos
        }
        
        final_map = {}

        for index, step in enumerate(steps_to_fill):
            step_number = index + 1
            step_type = step['type']
            step_id = step['id']
            
            # Cálculo de Progresso (Visual para o usuário)
            if client_socket_id:
                try:
                    percent = int(((index) / total_steps) * 100)
                    socketio.emit('ai_progress', {
                        'percent': percent,
                        'message': f"Criando passo {step_number}/{total_steps}: {self._get_step_label(step_type)}...",
                    }, to=client_socket_id)
                    socketio.sleep(0)
                except Exception:
                    pass
            
            try:
                # --- LÓGICA DE CONTINUIDADE ---
                # Passamos o 'execution_trace' para a IA saber o contexto imediato
                content = self._generate_single_step(
                    step_type, 
                    step_number, 
                    total_steps, 
                    activity_context, 
                    ai_config, 
                    execution_trace # <--- NOVA INJEÇÃO DE DEPENDÊNCIA
                )
                
                # --- ATUALIZAÇÃO DA MEMÓRIA (O Pulo do Gato) ---
                if content:
                    if step_type == 'narrative':
                        # Salva o último diálogo para o próximo passo saber
                        dialogues = " ".join([f"{d.get('characterRole', 'Alguém')}: {d.get('text', '')}" for d in content.get('dialogue', [])])
                        execution_trace["last_narrative_event"] = dialogues[:500] + "..." # Trunca para não estourar tokens
                        
                    elif step_type == 'content':
                        # Salva o tópico ensinado para o Quiz usar
                        topic = content.get('text_content', '')[:300]
                        execution_trace["last_taught_concept"] = topic
                        execution_trace["accumulated_knowledge"].append(topic[:50])

                # Fallbacks de segurança (Schema garantido)
                if not content: content = {}
                if step_type == 'narrative' and 'dialogue' not in content:
                    content = {"type": "narrative", "dialogue": [], "scenario": "", "characters": []}
                if step_type == 'quiz' and 'questions' not in content:
                    content = {"type": "quiz", "questions": []}
                if step_type == 'content' and 'text_content' not in content:
                    content = {"type": "content", "text_content": "Erro na geração.", "video_url": ""}

                final_map[step_id] = content
                socketio.sleep(0.5)

            except Exception as e:
                logger.error(f"Erro passo {step_id}: {str(e)}")
                continue

        if client_socket_id:
            socketio.emit('ai_progress', {'percent': 100, 'message': "Finalizando..."}, to=client_socket_id)

        return final_map

    def _get_step_label(self, type):
        labels = {'quiz': 'Desafio', 'narrative': 'História', 'content': 'Conteúdo Teórico'}
        return labels.get(type, 'Passo')

    def _generate_single_step(self, step_type, step_idx, total_steps, context, config, execution_trace):
        # 1. Extração de Metadados Ricos (Novos Campos)
        area_knowledge = context.get('area_knowledge', 'Geral')
        teaching_focus = config.get('teachingFocus', context.get('title')) # "Loop For"
        target_audience = config.get('targetAudience', 'Estudante')
        target_audience = context.get('player_profile', 'Estudantes')
        characters_list = config.get('charactersList', []) # A lista que vem do Modal
        
        # Formata a lista de personagens para o prompt
        formatted_cast = ", ".join([f"{c['role']} ({c['type']})" for c in characters_list])
        
        # Formata o conhecimento acumulado para evitar repetição
        known_topics = "; ".join(execution_trace['accumulated_knowledge'])

        # 2. Definição da Dinâmica (Mantida)
        progress_ratio = step_idx / total_steps
        story_phase = "INTRODUÇÃO"
        difficulty = "FÁCIL (Conceitos Básicos)"
        
        if progress_ratio > 0.3 and progress_ratio < 0.8:
            story_phase = "DESENVOLVIMENTO (Conflito e Aplicação)"
            difficulty = "MÉDIO (Análise de Casos)"
        elif progress_ratio >= 0.8:
            story_phase = "CLÍMAX (Resolução Complexa)"
            difficulty = "DIFÍCIL (Avaliação e Síntese)"

        # 3. Contexto Dinâmico Melhorado
        dynamic_instruction = ""
        
        if step_type == 'content':
            dynamic_instruction = f"""
            CONTEXTO SITUACIONAL:
            - Último evento: "{execution_trace['last_narrative_event']}"
            - Tópicos JÁ ENSINADOS (NÃO REPITA): {known_topics}
            - SUA MISSÃO: Introduza um NOVO conceito técnico necessário para resolver o problema atual. Use exemplos em código se aplicável à área "{area_knowledge}".
            """
        
        elif step_type == 'quiz':
            dynamic_instruction = f"""
            CONTEXTO SITUACIONAL:
            - Conceito ACABOU de ser ensinado: "{execution_trace['last_taught_concept']}"
            - Dificuldade Atual: {difficulty}
            - Público Alvo: {target_audience}
            - SUA MISSÃO: Crie perguntas focadas estritamente no conceito recém-ensinado.
            """
            
        elif step_type == 'narrative':
            dynamic_instruction = f"""
            CONTEXTO SITUACIONAL:
            - Conceito técnico em foco: "{execution_trace['last_taught_concept']}"
            - Fase da História: {story_phase}
            - Personagens Disponíveis (USE ESTES NOMES): {formatted_cast}
            - SUA MISSÃO: Crie um diálogo onde os personagens discutem ou enfrentam um problema relacionado ao conceito técnico. Mantenha as personalidades definidas.
            """

        # 4. Montagem do Prompt Enriquecido
        system_role = f"""
        Você é um Arquiteto de Aprendizagem Gamificada e Escritor Sênior.
        Personalidade da IA: {config.get('personality', 'Mentor Socrático')}.
        Tom da História: {config.get('tone', 'Aventura')}.
        Objetivo Global: {config.get('narrativeGoal', 'Ensinar conceito X')}.
        """
        
        full_prompt = f"""
        {system_role}
        
        # METADADOS DA ATIVIDADE
        - Título: {context.get('title')}
        - Descrição: {context.get('description')}
        - Área de Conhecimento: {area_knowledge}
        - Público Alvo: {target_audience}
        
        # INSTRUÇÕES DE CONTINUIDADE E MEMÓRIA
        {dynamic_instruction}
        
        # REGRAS ESTRUTURAIS (SCHEMA JSON)
        {self._get_strict_instructions(step_type, config.get('questionsPerQuiz', 4), config.get('linesPerNarrative', 6))}
        
        Retorne APENAS o JSON válido.
        """
        
        response = self.model.generate_content(full_prompt)
        return self._clean_and_parse_json(response.text)

    def _get_strict_instructions(self, step_type, quiz_count, dialogue_len):
        """Retorna instruções específicas e 'failsafes' para cada tipo."""
        
        if step_type == 'narrative':
            return f"""
            # TAREFA: GERAR NARRATIVA (TIPO: 'narrative')
            
            Regras de Roteiro:
            1. Gere EXATAMENTE {dialogue_len} linhas de diálogo alternando entre os personagens.
            2. CONTINUIDADE VISUAL: Se o cenário anterior era um escritório, mantenha-o, a menos que a história exija mudança (ex: ir para a sala de servidores).
            3. ESCOLHA DE PERSONAGEM: Use o campo 'role' (ex: 'Mentor', 'Aluno') e associe a uma URL de 'image' válida da lista 'available_characters'. Tente usar o elenco do usuário se houver match.
            4. TENSÃO TÉCNICA: O diálogo não deve ser "fofoca". Deve ser sobre o problema de software, logs de erro, arquitetura ou código.
            
            Schema JSON Obrigatório:
            {{
                "type": "narrative",
                "scenario": "URL_DO_CENARIO_ESCOLHIDO (deve vir de available_scenarios)",
                "characters": [ 
                    {{ "role": "NomePersonagem1", "image": "URL_DA_IMAGEM" }},
                    {{ "role": "NomePersonagem2", "image": "URL_DA_IMAGEM" }}
                ],
                "dialogue": [ 
                    {{ "characterRole": "NomePersonagem1", "text": "Fala técnica e contextual..." }},
                    {{ "characterRole": "NomePersonagem2", "text": "Resposta ou dúvida pertinente..." }}
                ]
            }}
            """
        elif step_type == 'quiz':
            return f"""
            # TAREFA: GERAR QUIZ (TIPO: 'quiz')
            
            Regras Pedagógicas (Engenharia de Software):
            1. Gere EXATAMENTE {quiz_count} perguntas.
            2. PERGUNTA 1 (A Ponte): Deve ser obrigatoriamente sobre a situação narrativa que acabou de acontecer ("No diálogo anterior, o sistema falhou porque...").
            3. DEMAIS PERGUNTAS (Técnicas): Devem testar conceitos da 'Atividade'. Use a Taxonomia de Bloom (Níveis: Aplicação e Análise). Evite perguntas de simples memorização ("O que é X?"). Prefira cenários ("Dado o erro X, qual a solução Y?").
            4. DISTRATORES: As opções erradas devem ser plausíveis para um júnior, não absurdas.
            
            Schema JSON Obrigatório:
            {{
                "type": "quiz",
                "questions": [
                    {{
                        "text": "Enunciado da pergunta focado em resolução de problemas...",
                        "options": ["Opção A (Correta)", "Opção B (Plausível)", "Opção C (Erro comum)", "Opção D"],
                        "correct_option": "Opção A (Correta)",
                        "explanation": "Breve explicação pedagógica do porquê esta é a correta (feedback imediato).",
                        "points": 10, 
                        "coins": 5, 
                        "timeLimit": 45
                    }}
                ]
            }}
            """
        elif step_type == 'content':
            return f"""
            # TAREFA: GERAR CONTEÚDO EDUCACIONAL (TIPO: 'content')
            
            Regras Pedagógicas (Engenharia de Software):
            1. Gere um texto explicativo RICO em Markdown sobre o conceito técnico que os personagens estão enfrentando na história.
            2. ESTRUTURA: Use Títulos (#), subtítulos (##), code blocks (```sql ou ```python) e listas.
            3. TOM: Deve ser como um tutorial técnico ou documentação interna da empresa fictícia, mas didático para o aluno.
            4. CONEXÃO: Comece fazendo uma breve ponte com o problema narrativo atual (ex: "Para resolver o erro de servidor mencionado pela Capitã Debug, precisamos entender Logs...").
            5. VIDEO: O campo 'video_url' deve vir VAZIO (""), pois o professor irá inserir manualmente depois.
            
            Schema JSON Obrigatório:
            {{
                "type": "content",
                "text_content": "# Título do Tópico\\n\\nExplicação detalhada...\\n\\n```python\\nprint('Exemplo de código')\\n```",
                "video_url": "",
                "material_link": ""
            }}
            """

    def _clean_and_parse_json(self, raw_text: str) -> Dict:
        """
        Limpa markdown e faz parse seguro, tratando casos onde a IA retorna lista.
        """
        try:
            # Remove blocos de código markdown (```json ... ```)
            cleaned_text = re.sub(r'```json\s*', '', raw_text)
            cleaned_text = re.sub(r'```\s*$', '', cleaned_text)
            cleaned_text = cleaned_text.strip()
            
            parsed = json.loads(cleaned_text)
            
            # --- CORREÇÃO DO BUG "list has no attribute get" ---
            # Se a IA retornou uma lista [{}], pegamos o primeiro item
            if isinstance(parsed, list):
                if len(parsed) > 0 and isinstance(parsed[0], dict):
                    return parsed[0]
                else:
                    return {} # Lista vazia ou inválida
            
            return parsed
        except json.JSONDecodeError as e:
            logger.error(f"Falha ao decodificar JSON. Texto bruto: {raw_text[:100]}...")
            raise e

ai_service = AIService()