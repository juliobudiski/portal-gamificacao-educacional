# backend/app/services/recommendation_engine.py
import logging

logger = logging.getLogger(__name__)

class ContextualRecommendationEngine:
    def __init__(self):
        # Mapeamento: Nome Interno (Conceito) -> Nome Frontend (Visual)
        self.element_mapping = {
            "Ranking": "Sistema de classificação e ranking",
            "Pontos": "Sistema de pontuação",
            "Cooperação": "Cooperação",
            "Economia": "Economia (sistema monetário)",
            "Narrativa": "Narrativas envolventes",
            "Tempo": "Pressão de tempo",
            "Puzzle": "Quebra-cabeça",
            "Customização": "Customização de personagem",
            "Feedback": "Feedback claro sobre o desempenho",
            "Raridade": "Raridade (itens exclusivos, objetos raros)",
            "Níveis": "Níveis",
            "Conquistas": "Conquistas digitais para metas alcançadas",
            "Chat": "Chat ou sistema de mensagens",
            "Fórum": "Fórum de Discussão",
            "Social": "Interação social com outros jogadores",
            "Imersão": "Sensação (imersão, experiência sensorial)",
            "Decisão": "Escolha imposta (decisões forçadas)",
            "Sorte": "Chance (sorte e probabilidade)",
            "Status": "Reputação (prestígio, renome, status)",
            "Storytelling": "Storytelling",
            "Equipamento": "Customização de equipamento",
            "Recompensas": "Recompensas atraentes",
            "Habilidade": "Progressão baseada em habilidade",
            "Competição": "Competição",
            "Pressão Social": "Pressão social",
            # --- NOVAS CHAVES ADICIONADAS PARA EVITAR KEYERROR ---
            "Objetivo": "Objetivo (missão, meta do jogo)",
            "Estatísticas": "Estatísticas (métricas de progresso)",
            "Renovação": "Renovação (atualizações de conteúdo)",
            "Novidade": "Novidade (novas funcionalidades)",
            "Reconhecimento": "Reconhecimento"
        }
        
        # Lista completa baseada nos valores do mapa
        self.all_frontend_elements = list(self.element_mapping.values())

        # --- MATRIZ DE HEURÍSTICAS REFINADA ---
        # Chaves (keywords) devem estar em minúsculo para o match funcionar
        
        self.heuristics = {
            # ==========================================
            # 1. PERFIL DO JOGADOR (Step 4)
            # ==========================================
            "competitivo": {
                self.element_mapping["Ranking"]: 35,
                self.element_mapping["Competição"]: 35,
                self.element_mapping["Pontos"]: 20
            },
            "predador": { 
                self.element_mapping["Ranking"]: 40,
                self.element_mapping["Competição"]: 40,
                self.element_mapping["Cooperação"]: -30
            },
            "cooperativo": {
                self.element_mapping["Ranking"]: -40,
                self.element_mapping["Competição"]: -60,
                self.element_mapping["Cooperação"]: 45,
                self.element_mapping["Social"]: 30
            },
            "socializador": {
                self.element_mapping["Chat"]: 30,
                self.element_mapping["Fórum"]: 30,
                self.element_mapping["Cooperação"]: 25
            },
            "explorador": {
                self.element_mapping["Narrativa"]: 30,
                self.element_mapping["Imersão"]: 25,
                self.element_mapping["Raridade"]: 20
            },

            # ==========================================
            # 2. ÁREA: EXATAS & ENGENHARIAS
            # ==========================================
            "abstração": { 
                self.element_mapping["Imersão"]: 30, 
                self.element_mapping["Storytelling"]: 25
            },
            "teoria na prática": {
                self.element_mapping["Puzzle"]: 30,
                self.element_mapping["Objetivo"]: 20 # Corrigido
            },
            "erros técnicos": { 
                self.element_mapping["Feedback"]: 35,
                self.element_mapping["Sorte"]: 20
            },
            "bugs": { 
                self.element_mapping["Feedback"]: 35,
                self.element_mapping["Sorte"]: 20
            },
            "raciocínio lógico": {
                self.element_mapping["Puzzle"]: 40,
                self.element_mapping["Decisão"]: 20
            },
            "persistência": {
                self.element_mapping["Níveis"]: 30, 
                self.element_mapping["Habilidade"]: 25
            },
            "experimentação": { 
                self.element_mapping["Imersão"]: 25,
                self.element_mapping["Decisão"]: 20
            },

            # ==========================================
            # 3. ÁREA: HUMANAS
            # ==========================================
            "leitura": { 
                self.element_mapping["Narrativa"]: 35, 
                self.element_mapping["Puzzle"]: 20 
            },
            "debates": {
                self.element_mapping["Fórum"]: 40,
                self.element_mapping["Social"]: 25
            },
            "timidez": { 
                self.element_mapping["Chat"]: 30, 
                self.element_mapping["Customização"]: 30, 
                self.element_mapping["Pressão Social"]: -50 
            },
            "crítico": { # Pensamento crítico
                self.element_mapping["Decisão"]: 35, 
                self.element_mapping["Fórum"]: 25
            },
            "empatia": {
                self.element_mapping["Narrativa"]: 40, 
                self.element_mapping["Storytelling"]: 30
            },
            "fatos históricos": {
                self.element_mapping["Storytelling"]: 35,
                self.element_mapping["Imersão"]: 25
            },

            # ==========================================
            # 4. ÁREA: SAÚDE
            # ==========================================
            "memoriza": { # "memorizar" (Problema) e "Memorização" (Objetivo)
                self.element_mapping["Tempo"]: 30, 
                self.element_mapping["Feedback"]: 30
            },
            "clínica": { # "decisão clínica" e "teoria com a clínica"
                self.element_mapping["Imersão"]: 35, 
                self.element_mapping["Decisão"]: 30
            },
            "procedimentos práticos": {
                 self.element_mapping["Imersão"]: 40, 
                 self.element_mapping["Sorte"]: 20 
            },
            "humanização": { 
                self.element_mapping["Narrativa"]: 35,
                self.element_mapping["Social"]: 25
            },
            "protocolos": {
                self.element_mapping["Conquistas"]: 30, 
                self.element_mapping["Níveis"]: 25
            },
            "tato": { 
                self.element_mapping["Narrativa"]: 30,
                self.element_mapping["Social"]: 25
            },

            # ==========================================
            # 5. ÁREA: SOCIAIS APLICADAS
            # ==========================================
            "legislações": { 
                self.element_mapping["Puzzle"]: 25,
                self.element_mapping["Níveis"]: 20
            },
            "sistêmica": { 
                self.element_mapping["Economia"]: 45,
                self.element_mapping["Estatísticas"]: 30 # Corrigido
            },
            "negociação": {
                self.element_mapping["Cooperação"]: 35, 
                self.element_mapping["Social"]: 30
            },
            "liderança": {
                self.element_mapping["Cooperação"]: 40,
                self.element_mapping["Status"]: 35
            },
            "análise de dados": {
                self.element_mapping["Estatísticas"]: 40, # Corrigido
                self.element_mapping["Puzzle"]: 20
            },
            "ética": { 
                self.element_mapping["Decisão"]: 40, 
                self.element_mapping["Status"]: 20
            },

            # ==========================================
            # 6. ÁREA: ARTES & LETRAS
            # ==========================================
            "bloqueio criativo": {
                self.element_mapping["Customização"]: 40, 
                self.element_mapping["Equipamento"]: 30,
                self.element_mapping["Decisão"]: -20 
            },
            "insegurança": { 
                self.element_mapping["Reconhecimento"]: 35, 
                self.element_mapping["Cooperação"]: 25
            },
            "expressão criativa": {
                self.element_mapping["Customização"]: 45,
                self.element_mapping["Storytelling"]: 30
            },
            "portfólio": {
                self.element_mapping["Conquistas"]: 35, 
                self.element_mapping["Raridade"]: 25
            },
            "interpretação": { 
                self.element_mapping["Narrativa"]: 30,
                self.element_mapping["Puzzle"]: 20
            },
            "repertório": {
                self.element_mapping["Raridade"]: 25, 
                self.element_mapping["Imersão"]: 20
            },

            # ==========================================
            # 7. TRANSVERSAL / GERAL
            # ==========================================
            "colaboração": {
                self.element_mapping["Cooperação"]: 50,
                self.element_mapping["Ranking"]: -60, 
                self.element_mapping["Competição"]: -60
            },
            "trabalho em equipe": {
                self.element_mapping["Cooperação"]: 50,
                self.element_mapping["Social"]: 30
            },
            "motivação": {
                self.element_mapping["Pontos"]: 25,
                self.element_mapping["Recompensas"]: 35,
                self.element_mapping["Níveis"]: 20
            },
            "prazos": { 
                self.element_mapping["Tempo"]: -40, 
                self.element_mapping["Estatísticas"]: 20 # Corrigido
            },
            "autonomia": {
                self.element_mapping["Customização"]: 30,
                self.element_mapping["Decisão"]: 30
            },
            "concentração": { 
                self.element_mapping["Tempo"]: 20, 
                self.element_mapping["Narrativa"]: -20 
            },
            "aplicabilidade": { 
                self.element_mapping["Imersão"]: 35, 
                self.element_mapping["Storytelling"]: 25
            }
        }

    def _apply_psychosocial_safety(self, scores: dict, conflicts: dict, context_text: str):
        """
        Implementação do Algoritmo de Supressão Condicional (Capítulo 4).
        ATENÇÃO: Isso NÃO impede o uso (Soft Block), apenas joga o score para negativo,
        classificando o item como "Não Recomendado" e acionando o alerta no frontend.
        """
        risk_markers = ["baixa autoeficácia", "turma desunida", "ansiedade", "bullying", "exclusão"]
        
        detected_risks = [risk for risk in risk_markers if risk in context_text]
        
        if detected_risks:
            risk_msg = f"Risco Psicossocial ({', '.join(detected_risks)}). Recomendamos cautela."
            logger.warning(f"[MRC Safety] {risk_msg}")
            
            elements_to_suppress = [
                self.element_mapping["Ranking"],
                self.element_mapping["Competição"],
                self.element_mapping["Pressão Social"],
                self.element_mapping["Status"]
            ]
            
            for element in elements_to_suppress:
                if element in scores:
                    # Subtrair 50 garante que o score fique baixo, 
                    # movendo para a categoria de alerta, mas o item ainda existe.
                    scores[element] -= 50
                    conflicts[element] = risk_msg

    def calculate_recommendations(self, context: dict) -> dict:
        scores = {element: 0 for element in self.all_frontend_elements}
        conflicts = {} 
        
        # 1. Normalização do Contexto
        context_text = ""
        profiles = context.get('playerProfile', {}).get('selectedProfiles', [])
        context_text += " ".join(profiles).lower() if isinstance(profiles, list) else str(profiles).lower()
        context_text += " "
        objectives = context.get('desiredScenario', {}).get('objectives', [])
        context_text += " ".join(objectives).lower() + " "
        problems = context.get('currentScenario', {}).get('problems', [])
        context_text += " ".join(problems).lower() + " "
        
        # Variáveis Logísticas
        logistics = context.get('logistics', {})
        environment = logistics.get('environment', '')
        time_constraint = logistics.get('time', '')
        
        logger.info(f"[MRC Engine] Processando contexto normalizado...")

        # 2. Heurísticas Base (Pattern Matching via Dicionário)
        for keyword, impacts in self.heuristics.items():
            if keyword in context_text:
                for element, adjustment in impacts.items():
                    if element in scores:
                        scores[element] += adjustment
                        # Registra conflitos suaves baseados no dicionário
                        if adjustment <= -30:
                            conflicts[element] = f"Conflito pedagógico: Tópico '{keyword}'."

        # 3. SEGURANÇA (Supressão Condicional)
        self._apply_psychosocial_safety(scores, conflicts, context_text)

        # 4. Regras de Logística
        if environment == "Presencial sem Tecnologia":
            tech_blocklist = [
                self.element_mapping["Economia"], 
                self.element_mapping["Feedback"], 
                self.element_mapping["Chat"],
                self.element_mapping["Conquistas"]
            ]
            for item in tech_blocklist:
                if item in scores:
                    # Penalidade alta para classificar como "Não Recomendado"
                    scores[item] -= 200 
                    conflicts[item] = "Requer tecnologia (incompatível com ambiente físico)."

        if time_constraint == "Curto (1 aula)":
            rpg = self.element_mapping["Narrativa"]
            if rpg in scores:
                scores[rpg] -= 50
                conflicts[rpg] = "Narrativas complexas exigem longo prazo."
            
            fast = self.element_mapping["Tempo"]
            if fast in scores: scores[fast] += 30

        return self._clusterize_results(scores, conflicts)
    

    def _clusterize_results(self, scores: dict, conflicts: dict) -> dict:
        # Renomeado 'forbidden' para 'not_recommended' para refletir o Soft Block
        response = {"recommended": [], "neutral": [], "not_recommended": []}

        for element, score in scores.items():
            item_data = {"name": element, "score": score}
            
            if score >= 30: 
                item_data["pre_selected"] = True
                item_data["reason"] = "Alta sinergia detectada."
                response["recommended"].append(item_data)
            elif score < 0: 
                # Item continua acessível, mas carrega o aviso (warning_msg)
                # O Frontend deve usar 'warning_msg' para exibir o Modal de Confirmação.
                item_data["warning_msg"] = conflicts.get(element, "Não recomendado para este cenário.")
                response["not_recommended"].append(item_data)
            else: 
                response["neutral"].append(item_data)
        
        # Ordenação
        for k in response:
            response[k].sort(key=lambda x: x['score'], reverse=True)

        return response