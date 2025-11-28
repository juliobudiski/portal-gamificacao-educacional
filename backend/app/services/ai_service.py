import google.generativeai as genai
import os
import json
import logging
import time
from flask import current_app

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
    def __init__(self):
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            logger.warning("GOOGLE_API_KEY não configurada.")
            return
        
        try:
            genai.configure(api_key=api_key)
            logger.info("Google GenAI configurado com sucesso.")
        except Exception as e:
            logger.error(f"Falha ao configurar Google GenAI: {e}")

        self.model_name = 'gemini-2.0-flash' 
        self.model = genai.GenerativeModel(
            self.model_name, 
            generation_config={
                "response_mime_type": "application/json",
                "max_output_tokens": 8192, 
                "temperature": 0.3 
            }
        )

    def orchestrate_story(self, activity_context, path_structure, ai_config):
        logger.info(f"--- INICIANDO ORQUESTRAÇÃO SERIAL (Modelo: {self.model_name}) ---")
        
        steps_to_fill = [s for s in path_structure if s['type'] in ['quiz', 'narrative']]
        total_steps = len(steps_to_fill)
        
        if not steps_to_fill:
            logger.warning("Nenhum passo para preencher.")
            return {}
        
        # Variável para manter a memória da história entre os passos
        story_memory = "A história está apenas começando. O aluno foi introduzido ao desafio."
        final_map = {}

        # --- LOOP DE GERAÇÃO PASSO A PASSO ---
        for index, step in enumerate(steps_to_fill):
            step_number = index + 1
            step_type = step['type']
            step_id = step['id']
            
            logger.info(f"Gerando passo {step_number}/{total_steps} (Tipo: {step_type})...")
            
            try:
                # Gera o conteúdo deste passo específico
                content = self._generate_single_step(
                    step_type, 
                    step_number, 
                    total_steps, 
                    activity_context, 
                    ai_config, 
                    story_memory
                )
                
                # Salva no mapa final
                final_map[step_id] = content
                
                # Atualiza a memória para o próximo passo
                if step_type == 'narrative':
                    # Pega a última fala ou um resumo para passar para o próximo quiz
                    dialogue_text = " ".join([d['text'] for d in content.get('dialogue', [])])
                    story_memory = f"Resumo anterior: {dialogue_text[:500]}..." # Limita tamanho para não estourar
                
                # Pequena pausa para não bater no rate limit do Google (opcional, mas seguro)
                time.sleep(1) 

            except Exception as e:
                logger.error(f"Erro ao gerar passo {step_id}: {str(e)}")
                # Em vez de falhar tudo, continuamos para o próximo (o passo ficará vazio ou com erro)
                continue

        logger.info(f"Orquestração concluída! {len(final_map)} passos gerados.")
        return final_map

    def _generate_single_step(self, step_type, step_idx, total_steps, context, config, memory):
        """Gera o conteúdo de UM ÚNICO passo, focado e detalhado."""
        
        personality = config.get('personality', 'Mentor Socrático')
        quiz_count = int(config.get('questionsPerQuiz', 4))
        dialogue_len = int(config.get('linesPerNarrative', 6))
        user_characters = config.get('charactersList', [])
        
        # Definição específica do objetivo deste passo na história
        step_goal = ""
        if step_type == 'narrative':
            if step_idx == 1: step_goal = "INTRODUÇÃO: Apresente o problema e os personagens."
            elif step_idx == total_steps: step_goal = "CONCLUSÃO: Resolva o conflito final e celebre."
            else: step_goal = "DESENVOLVIMENTO: Aprofunde o problema técnico e a tensão."
        else:
            step_goal = f"AVALIAÇÃO: Teste o conhecimento técnico e a atenção aos detalhes da história recente: '{memory}'"

        prompt = f"""
        Atue como Especialista em Gamificação. Personalidade: "{personality}".
        
        ESTAMOS GERANDO O PASSO {step_idx} DE {total_steps}.
        TIPO DO PASSO: {step_type.upper()}
        
        # CONTEXTO
        - Atividade: {context.get('title')} ({context.get('area_knowledge')})
        - Objetivo: {context.get('description')}
        - Enredo Global: {config.get('narrativeGoal')}
        - Memória Recente (O que acabou de acontecer): "{memory}"
        
        # ASSETS VISUAIS
        Cenários: {json.dumps(AVAILABLE_SCENARIOS)}
        Personagens: {json.dumps(AVAILABLE_CHARACTERS)}
        Elenco do Usuário: {json.dumps(user_characters)}

        # INSTRUÇÕES DE GERAÇÃO PARA ESTE PASSO
        Objetivo do Passo: {step_goal}
        
        {self._get_type_instructions(step_type, quiz_count, dialogue_len)}
        
        # SAÍDA (JSON OBJECT ÚNICO)
        Retorne APENAS um Objeto JSON correspondente ao tipo solicitado.
        """
        
        # Chama a API
        response = self.model.generate_content(prompt)
        text_response = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(text_response)

    def _get_type_instructions(self, step_type, quiz_count, dialogue_len):
        if step_type == 'narrative':
            return f"""
            Regras para NARRATIVA:
            1. Gere EXATAMENTE {dialogue_len} linhas de diálogo.
            2. Use a "description" dos assets para escolher a URL correta de "image" e "scenario".
            3. Formato JSON Esperado:
            {{
                "type": "narrative",
                "scenario": "/narrativa/cenarios/...",
                "characters": [ {{ "role": "Nome", "image": "..." }} ],
                "dialogue": [ {{ "characterRole": "Nome", "text": "Fala..." }} ]
            }}
            """
        else:
            return f"""
            Regras para QUIZ:
            1. Gere EXATAMENTE {quiz_count} perguntas.
            2. 20% das perguntas devem ser sobre a "Memória Recente" (Contexto da história).
            3. 80% das perguntas devem ser Técnicas sobre o tema da atividade.
            4. Formato JSON Esperado:
            {{
                "type": "quiz",
                "questions": [
                    {{
                        "text": "Pergunta...",
                        "options": ["A", "B", "C", "D"],
                        "correct_option": "A",
                        "points": 10, "coins": 5, "timeLimit": 45
                    }}
                ]
            }}
            """

ai_service = AIService()