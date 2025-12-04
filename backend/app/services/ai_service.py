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
        teaching_focus = config.get('teachingFocus') or context.get('title')
        target_audience = config.get('targetAudience', 'Estudante')
        #target_audience = context.get('player_profile', 'Estudantes')
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
            CONTEXTO:
            - Erro observado na narrativa: "{execution_trace['last_narrative_event']}"
            - Foco Técnico: "{teaching_focus}"
            
            SUA MISSÃO (CONSTRUTIVISMO):
            1. NÃO DÊ AULA. Forneça a documentação técnica necessária para resolver o artefato quebrado da narrativa anterior.
            2. USE A TÉCNICA "BRIDGING": Comece validando o que o aluno viu ("Vocês viram o erro 500 no log?").
            3. ENTREGUE O "TOOLKIT": Explique a ferramenta/conceito exato que corrige aquele log.
            """
        
        elif step_type == 'quiz':
            dynamic_instruction = f"""
            CONTEXTO SITUACIONAL:
            - Conceito TÉCNICO recém-ensinado: "{execution_trace['last_taught_concept']}"
            - Cenário Narrativo Anterior: "{execution_trace['last_narrative_event']}" (Use isso para a Pergunta 1)
            - Dificuldade: {difficulty}
            - Público Alvo: {target_audience}
            
            SUA MISSÃO: Atuar como um Tech Lead entrevistando um candidato. 
            Você deve validar se o usuário sabe APLICAR o conhecimento, e não apenas memorizá-lo.
            """
            
        elif step_type == 'narrative':
            dynamic_instruction = f"""
            CONTEXTO SITUACIONAL:
            - Tópico Técnico em Pauta: "{execution_trace['last_taught_concept']}" ou "{teaching_focus}"
            - Fase da História: {story_phase}
            - Personagens em Cena (ELENCO OBRIGATÓRIO): {formatted_cast}
            
            SUA MISSÃO (CRIAR TENSÃO):
            1. NÃO RESOLVA O PROBLEMA: Crie uma situação onde o sistema falha, um bug crítico aparece ou um prazo estourou.
            2. FOCO NO SINTOMA: Os personagens devem descrever o erro (ex: logs estranhos, tela travada, cliente reclamando), e não a teoria.
            3. CLIFFHANGER: O diálogo deve terminar com os personagens precisando urgentemente aprender algo novo para consertar a situação (preparando terreno para o próximo Conteúdo).
            """

        # 4. Montagem do Prompt Enriquecido
        system_role = f"""
        Você é um Tech Lead Sênior e Roteirista de Ficção Científica.
        Sua especialidade é criar cenários de crise em Engenharia de Software que exigem solução imediata.
        Você NUNCA resolve o problema na narrativa; você apenas expõe os sintomas do erro para que o aluno investigue.
        Personalidade da IA: {config.get('personality', 'Mentor Pragmático')}..
        Tom da História: {config.get('tone', 'Aventura')}.
        Objetivo Global: {config.get('narrativeGoal', 'Ensinar conceito X')}.
        """
        
        full_prompt = f"""
        {system_role}
        
        # METADADOS DA ATIVIDADE
        - Título: {context.get('title')}
        - TÓPICO DE ENSINO (CONTEÚDO TÉCNICO): {teaching_focus}
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
        parsed_json = self._clean_and_parse_json(response.text)
        
        # --- APLICAÇÃO DA CORREÇÃO DE VIÉS ---
        if step_type == 'quiz':
            parsed_json = self._shuffle_quiz_options(parsed_json)
            
        return parsed_json

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
            # TAREFA: GERAR AVALIAÇÃO DIAGNÓSTICA (TIPO: 'quiz')
            
            ## 1. Regras de Quantidade:
            - Você DEVE gerar uma lista com EXATAMENTE {quiz_count} perguntas.
            
            ## 2. Ciência da Avaliação:
            - **PERGUNTA 1 (Contexto):** Pergunte sobre o ERRO descrito verbalmente na narrativa anterior.
            - **PERGUNTAS 2 a {quiz_count} (Técnicas):** Crie cenários de código ou arquitetura ("Spot the Bug").
            - **Distratores:** Use erros conceituais comuns de Júniores, não erros de sintaxe bobos.
            
            ## 3. Schema JSON Obrigatório:
            {{
                "type": "quiz",
                "questions": [
                    {{
                        "_concept_tested": "Conceito da Pergunta 1",
                        "text": "Sobre o erro mencionado pelo Mentor na história...",
                        "options": ["Certa", "Errada 1", "Errada 2", "Errada 3"],
                        "correct_option": "Certa",
                        "explanation": "Explicação do porquê...",
                        "points": 10,
                        "coins": 5,
                        "timeLimit": 60
                    }},
                    {{
                        "_concept_tested": "Conceito da Pergunta 2",
                        "text": "Analise o código: ```python ... ```",
                        "options": ["...", "...", "...", "..."],
                        "correct_option": "...",
                        "explanation": "...",
                        "points": 10,
                        "coins": 5,
                        "timeLimit": 60
                    }}
                    // ... GERE AS OUTRAS {quiz_count - 2} PERGUNTAS AQUI ...
                ]
            }}
            """
        elif step_type == 'content':
            return f"""
            # TAREFA: GERAR DOCUMENTAÇÃO TÉCNICA (TIPO: 'content')
            
            ## 1. Regras de Estilo (Anti-Wikipedia):
            - **TOM:** Pragmático, "Senior para Junior". Use "Nós usamos X para..." em vez de "X é definido como...".
            - **SEM INTRODUÇÕES LONGAS:** Corte frases como "No mundo da computação..." ou "É importante notar que...". Vá direto ao ponto.
            - **CONEXÃO NARRATIVA:** Comece obrigatoriamente com um "Callout" ou nota conectando ao problema anterior. Ex: "Para corrigir o erro 500 que travou o sistema da Capitã Debug, precisamos entender Exceções...".
            
            ## 2. Estrutura Visual (Markdown Obrigatório):
            - Use **Negrito** para termos-chave.
            - Use `Code Blocks` para comandos ou sintaxe.
            - Use > Blockquotes para "Dicas Pro" ou "Avisos de Segurança".
            - Use Listas para passo-a-passo.
            
            ## 3. Estrutura do Conteúdo (Obrigatória):
            1. **O Diagnóstico:** Por que o problema (da história) aconteceu?
            2. **O Conceito:** A explicação técnica da solução.
            3. **A Prática:** Um exemplo de código (snippet) mostrando a implementação correta.
            
            Schema JSON Obrigatório:
            {{
                "type": "content",
                "text_content": "### 🛠️ Diagnóstico do Erro\\n\\nO servidor caiu porque...\\n\\n### 📚 Conceito: Try/Except\\n\\nPara evitar isso, utilizamos blocos de tratamento...\\n\\n> **Dica Senior:** Nunca use except puro!\\n\\n```python\\ntry:\\n    codigo_perigoso()\\nexcept ValueError:\\n    log_erro()\\n```",
                "video_url": "",
                "material_link": ""
            }}
            """

    def _clean_and_parse_json(self, raw_text: str) -> Dict:
        """
        Faz o parse robusto de JSON vindo de LLMs.
        Remove markdown, extrai apenas o bloco JSON, remove vírgulas sobrando (trailing commas)
        e comentários, prevenindo erros de sintaxe comuns (JSONDecodeError).
        """
        try:
            text = raw_text.strip()

            # 1. REMOÇÃO DE MARKDOWN (Fase 1)
            # Remove blocos ```json ... ``` ou apenas ```
            text = re.sub(r'```(?:json)?', '', text)
            text = re.sub(r'```', '', text)

            # 2. EXTRAÇÃO DO BLOCO JSON (Fase 2)
            # Localiza o primeiro '{' ou '[' e o último '}' ou ']'
            # Isso ignora textos como "Aqui está o seu JSON:" no início
            idx_brace_start = text.find('{')
            idx_bracket_start = text.find('[')

            # Determina onde começa (o que vier primeiro)
            start_idx = -1
            end_idx = -1
            
            if idx_brace_start != -1 and (idx_bracket_start == -1 or idx_brace_start < idx_bracket_start):
                start_idx = idx_brace_start
                end_idx = text.rfind('}') + 1 # +1 para incluir o caractere
            elif idx_bracket_start != -1:
                start_idx = idx_bracket_start
                end_idx = text.rfind(']') + 1

            if start_idx != -1 and end_idx != -1:
                text = text[start_idx:end_idx]
            else:
                # Se não achou delimitadores, tenta parsear o texto limpo original
                # (Pode ser um JSON válido mas sem chaves, ex: string ou number, embora raro aqui)
                pass 

            # 3. HIGIENIZAÇÃO DE SINTAXE VIA REGEX (Fase 3 - O Pulo do Gato)
            
            # Remove comentários de linha (// ...)
            # Cuidado: Isso é um regex simples e pode remover URLs dentro de strings. 
            # Se suas URLs não tiverem // (usarem https:), ok. Se tiverem, melhor comentar essa linha ou usar lógica mais complexa.
            # Para segurança em URLs, vamos assumir que a IA retorna JSON puro sem comentários, 
            # mas vamos focar na vírgula, que é o erro crítico.
            
            # Remove Trailing Commas (Vírgulas antes de fechar objeto/lista)
            # Ex: {"a": 1, } -> {"a": 1 }
            # Ex: [1, 2, ] -> [1, 2 ]
            text = re.sub(r',\s*([\]}])', r'\1', text)

            # 4. PARSE
            parsed = json.loads(text)
            
            # Tratamento para listas retornadas quando se espera dict
            if isinstance(parsed, list):
                if len(parsed) > 0 and isinstance(parsed[0], dict):
                    return parsed[0]
                return {} # Lista vazia

            return parsed

        except json.JSONDecodeError as e:
            # Log rico para debug: mostra onde quebrou
            logger.error(f"FALHA GRAVE JSON DECODE. Erro: {e}")
            logger.error(f"Texto Original (inicio): {raw_text[:200]}")
            logger.error(f"Texto Higienizado (tentativa): {text[:200]}")
            return {}
        except Exception as e:
            logger.error(f"Erro inesperado no parser: {e}")
            return {}
    
    def _shuffle_quiz_options(self, content: Dict) -> Dict:
        """
        Embaralha as opções do quiz deterministicamente para evitar vício de posição da IA.
        Também remove prefixos comuns como 'A)', '1.', etc.
        """
        if content.get('type') != 'quiz' or 'questions' not in content:
            return content

        for question in content['questions']:
            options = question.get('options', [])
            correct_val = question.get('correct_option', "")
            
            # 1. Limpeza de prefixos (A), B), 1., etc) para não ficar estranho ao embaralhar
            clean_options = []
            for opt in options:
                # Remove "A) ", "1. ", "- " do início da string
                clean_text = re.sub(r'^([A-Da-d][\).]\s*|\d+[\).]\s*|-\s*)', '', opt)
                clean_options.append(clean_text)
                
                # Se esta era a correta, precisamos atualizar o texto da correta também
                # (caso o frontend compare string exata)
                if opt == correct_val:
                    correct_val = clean_text

            # 2. Atualiza a correta limpa no objeto
            question['correct_option'] = correct_val
            
            # 3. Embaralha a lista limpa
            random.shuffle(clean_options)
            question['options'] = clean_options

        return content

ai_service = AIService()