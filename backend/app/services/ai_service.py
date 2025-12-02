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
        logger.info(f"--- INICIANDO ORQUESTRAÇÃO (Modelo: {self.model_name}) ---")
        
        steps_to_fill = [s for s in path_structure if s['type'] in ['quiz', 'narrative']]
        total_steps = len(steps_to_fill)
        
        if not steps_to_fill:
            return {}
        
        story_memory = "ESTADO INICIAL: O aluno acabou de entrar na simulação."
        final_map = {}

        for index, step in enumerate(steps_to_fill):
            step_number = index + 1
            step_type = step['type']
            step_id = step['id']
            
            # --- CÁLCULO E ENVIO DO PROGRESSO ---
            # Como importamos do extensions, 'socketio' agora sempre existe e é válido
            if client_socket_id:
                try:
                    percent = int(((index) / total_steps) * 100)
                    socketio.emit('ai_progress', {
                        'percent': percent,
                        'message': f"Escrevendo passo {step_number}/{total_steps} ({step_type})...",
                    }, to=client_socket_id)
                    
                    # Força o envio imediato da mensagem WebSocket
                    socketio.sleep(0) 
                except Exception as e:
                    logger.error(f"Erro socket emit: {e}")
            
            logger.info(f"Processando Passo {step_number}/{total_steps}")
            
            try:
                attempts = 0
                max_attempts = 2
                content = {}
                
                while attempts < max_attempts:
                    try:
                        content = self._generate_single_step(
                            step_type, step_number, total_steps, activity_context, ai_config, story_memory
                        )
                        if content: break
                    except Exception as err:
                        logger.warning(f"Tentativa {attempts+1} falhou: {err}")
                        attempts += 1
                        time.sleep(2)
                
                if not content:
                    content = {} 

                if step_type == 'narrative' and 'dialogue' not in content:
                    content = {"type": "narrative", "dialogue": [], "scenario": "", "characters": []}
                if step_type == 'quiz' and 'questions' not in content:
                    content = {"type": "quiz", "questions": []}

                final_map[step_id] = content
                
                if step_type == 'narrative':
                    last_dialogues = " ".join([f"{d.get('characterRole', 'Alguém')}: {d.get('text', '')}" for d in content.get('dialogue', [])])
                    story_memory = f"RECENTE: {last_dialogues[:800]}..."
                
                # Pequeno delay para garantir que o frontend receba a atualização visual
                socketio.sleep(0.5)

            except Exception as e:
                logger.error(f"Erro passo {step_id}: {str(e)}")
                continue

        # Envia 100% no final
        if client_socket_id:
            socketio.emit('ai_progress', {'percent': 100, 'message': "Finalizando..."}, to=client_socket_id)
            socketio.sleep(0)

        return final_map

    def _generate_single_step(self, step_type, step_idx, total_steps, context, config, memory):
        """
        Constrói o prompt de engenharia avançada e chama o modelo.
        """
        
        # 1. Configuração de Variáveis do Prompt
        personality = config.get('personality', 'Tech Lead Pragmático')
        # Garantir inteiros
        try:
            quiz_count = int(config.get('questionsPerQuiz', 4))
            dialogue_len = int(config.get('linesPerNarrative', 6))
        except:
            quiz_count = 4
            dialogue_len = 6

        user_characters = config.get('charactersList', [])
        
        # Serialização segura dos assets para o prompt
        assets_context = {
            "available_scenarios": AVAILABLE_SCENARIOS,
            "available_characters": AVAILABLE_CHARACTERS,
            "user_selected_cast": user_characters
        }

        # 2. Definição da Dinâmica da História (Micro-Journey)
        story_phase = ""
        if step_idx == 1:
            story_phase = "SETUP & INCITING INCIDENT: Apresente o cenário e o problema técnico (bug, feature request, queda de servidor). Estabeleça a urgência."
        elif step_idx == total_steps:
            story_phase = "RESOLUTION: O problema é resolvido com sucesso após a aplicação do conhecimento. Clímax e lição aprendida."
        else:
            story_phase = "RISING ACTION: O problema se complica. Tentativas falham ou novos requisitos surgem. É necessário aprofundar a teoria."

        # 3. Construção do Prompt Modular
        system_role = f"""
        Você é um Engenheiro de Software Sênior e Game Master de uma plataforma educacional chamada Gamefica.Edu.
        Sua Persona: "{personality}".
        Seu Objetivo: Criar uma experiência de aprendizado imersiva para alunos de Computação.
        O tom deve ser técnico, profissional, mas engajador. Use jargão correto (ex: deploy, commit, request, latency).
        """

        task_context = f"""
        # CONTEXTO DA ATIVIDADE
        - Título: {context.get('title', 'Sem título')}
        - Área: {context.get('area_knowledge', 'Engenharia de Software')}
        - Descrição Técnica: {context.get('description', '')}
        - Meta Narrativa Global: {config.get('narrativeGoal', 'Resolver um problema de software')}
        
        # ESTADO ATUAL (Passo {step_idx} de {total_steps})
        - Fase da História: {story_phase}
        - Memória (O que aconteceu antes): "{memory}"
        
        # ASSETS DISPONÍVEIS (Use APENAS estas URLs)
        {json.dumps(assets_context, ensure_ascii=False)}
        """

        specific_instructions = self._get_strict_instructions(step_type, quiz_count, dialogue_len)

        full_prompt = f"""
        {system_role}
        
        {task_context}
        
        {specific_instructions}
        
        # FORMATO DE RESPOSTA
        Retorne APENAS um objeto JSON válido. Não use Markdown. Não inclua explicações fora do JSON.
        """
        
        # 4. Chamada ao Modelo
        response = self.model.generate_content(full_prompt)
        
        # 5. Parsing e Limpeza Robusta
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
        else:
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

    def _clean_and_parse_json(self, raw_text: str) -> Dict:
        """
        Limpa alucinações de markdown (```json ... ```) e tenta fazer o parse.
        Lança exceção se falhar, para ser capturado pelo retry logic.
        """
        try:
            # Remove blocos de código markdown se existirem
            cleaned_text = re.sub(r'```json\s*', '', raw_text)
            cleaned_text = re.sub(r'```\s*$', '', cleaned_text)
            cleaned_text = cleaned_text.strip()
            
            return json.loads(cleaned_text)
        except json.JSONDecodeError as e:
            logger.error(f"Falha ao decodificar JSON gerado. Texto bruto: {raw_text[:100]}...")
            raise e
        
ai_service = AIService()