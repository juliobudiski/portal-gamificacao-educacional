# backend/app/services/recommendation_engine.py
import logging
from pydantic import BaseModel, Field, ValidationError
from typing import Any

logger = logging.getLogger(__name__)

# ==========================================
# 1. Schemas de Validação (Pydantic)
# ==========================================
class CurrentScenarioInput(BaseModel):
    problems: list[str] = Field(default_factory=list)

class DesiredScenarioInput(BaseModel):
    objectives: list[str] = Field(default_factory=list)

class PlayerProfileInput(BaseModel):
    selectedProfiles: list[str] = Field(default_factory=list)

class LogisticsInput(BaseModel):
    environment: str = Field(default="")
    time: str = Field(default="")

class GameficaContextInput(BaseModel):
    title: str = Field(default="")
    greatArea: str = Field(default="")
    areaKnowledge: str = Field(default="")
    subdomain: str = Field(default="")
    currentScenario: CurrentScenarioInput = Field(default_factory=CurrentScenarioInput)
    desiredScenario: DesiredScenarioInput = Field(default_factory=DesiredScenarioInput)
    playerProfile: PlayerProfileInput = Field(default_factory=PlayerProfileInput)
    logistics: LogisticsInput = Field(default_factory=LogisticsInput)

# ==========================================
# 2. Motor de Recomendação
# ==========================================
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
            "Objetivo": "Objetivo (missão, meta do jogo)",
            "Estatísticas": "Estatísticas (métricas de progresso)",
            "Renovação": "Renovação (atualizações de conteúdo)",
            "Novidade": "Novidade (novas funcionalidades)",
            "Reconhecimento": "Reconhecimento"
        }
        
        self.all_frontend_elements = list(self.element_mapping.values())

        # Matriz Completa de Heurísticas
        self.heuristics = {
            # 1. PERFIL DO JOGADOR
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
            
            # === NOVOS SUBDOMÍNIOS E PROBLEMAS (COMPUTAÇÃO) ===
            "fundamentos e programação introdutória": {
                self.element_mapping["Puzzle"]: 30,
                self.element_mapping["Feedback"]: 20  # Ciclos de depuração
            },
            "abstração": { # "Barreira de abstração..."
                self.element_mapping["Puzzle"]: 25,
                self.element_mapping["Imersão"]: 20
            },
            "depuração": { # "Medo de errar e frustração com depuração..."
                self.element_mapping["Feedback"]: 35,
                self.element_mapping["Sorte"]: 20 # Reduz previsibilidade do erro
            },
            
            "engenharia de software e projetos": {
                self.element_mapping["Narrativa"]: 40, # Roleplay
                self.element_mapping["Cooperação"]: 30 # Missões colaborativas
            },
            "papéis": { # "...adoção de papéis (ex: Scrum)."
                self.element_mapping["Narrativa"]: 35, 
                self.element_mapping["Customização"]: 25
            },
            "débito técnico": { # "...consequências a longo prazo (débito técnico)."
                self.element_mapping["Estatísticas"]: 30,
                self.element_mapping["Tempo"]: 20
            },
            
            "testes e qualidade de software": {
                self.element_mapping["Ranking"]: 30,
                self.element_mapping["Economia"]: 20 # Moedas/Bug Bounty
            },
            "cobertura de código": { # "...atingir alta cobertura de código."
                self.element_mapping["Conquistas"]: 35,
                self.element_mapping["Ranking"]: 25
            },
            "tediosa": { # "...atividade tediosa e secundária."
                self.element_mapping["Recompensas"]: 30,
                self.element_mapping["Economia"]: 25
            },

            # 2. EXATAS & ENGENHARIAS (Match com "abstração lógica", "teoria na prática", etc.)
            "abstração": { 
                self.element_mapping["Imersão"]: 30, 
                self.element_mapping["Storytelling"]: 25
            },
            "teoria na prática": {
                self.element_mapping["Puzzle"]: 30,
                self.element_mapping["Objetivo"]: 20
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

            # 3. HUMANAS
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
            "crítico": { 
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

            # 4. SAÚDE
            "memoriza": { 
                self.element_mapping["Tempo"]: 30, 
                self.element_mapping["Feedback"]: 30
            },
            "clínica": { 
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

            # 5. SOCIAIS APLICADAS
            "legislações": { 
                self.element_mapping["Puzzle"]: 25,
                self.element_mapping["Níveis"]: 20
            },
            "sistêmica": { 
                self.element_mapping["Economia"]: 45,
                self.element_mapping["Estatísticas"]: 30
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
                self.element_mapping["Estatísticas"]: 40,
                self.element_mapping["Puzzle"]: 20
            },
            "ética": { 
                self.element_mapping["Decisão"]: 40, 
                self.element_mapping["Status"]: 20
            },

            # 6. ARTES & LETRAS
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

            # 7. GERAL / TRANSVERSAL
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
                self.element_mapping["Estatísticas"]: 20
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
        """Soft Block para riscos psicossociais detectados no texto de contexto."""
        risk_markers = ["baixa autoeficácia", "turma desunida", "ansiedade", "bullying", "exclusão", "insegurança", "timidez"]
        
        detected_risks = [risk for risk in risk_markers if risk in context_text]
        
        if detected_risks:
            risk_msg = f"Risco Psicossocial ({', '.join(detected_risks)}). Recomendamos cautela."
            logger.warning(f"[MDC Safety] {risk_msg}")
            
            elements_to_suppress = [
                self.element_mapping["Ranking"],
                self.element_mapping["Competição"],
                self.element_mapping["Pressão Social"],
                self.element_mapping["Status"]
            ]
            
            for element in elements_to_suppress:
                if element in scores:
                    scores[element] -= 50
                    conflicts[element] = risk_msg

    def calculate_recommendations(self, context_data: dict[str, Any]) -> dict:
        """Processamento principal com validação Pydantic."""
        try:
            validated_input = GameficaContextInput(**context_data)
        except ValidationError as e:
            logger.error(f"[MDC] Payload inválido: {e.errors()}")
            raise ValueError(f"Payload inválido: {e}")

        scores = {element: 0 for element in self.all_frontend_elements}
        conflicts = {} 
        
        # 1. Normalização do Contexto em Texto Único (Lower Case para Pattern Matching)
        context_text = " ".join([
            " ".join(validated_input.playerProfile.selectedProfiles),
            " ".join(validated_input.desiredScenario.objectives),
            " ".join(validated_input.currentScenario.problems),
            validated_input.greatArea,
            validated_input.areaKnowledge,
            validated_input.subdomain
        ]).lower()
        
        # 2. Heurísticas Base
        for keyword, impacts in self.heuristics.items():
            if keyword in context_text:
                for element, adjustment in impacts.items():
                    if element in scores:
                        scores[element] += adjustment
                        if adjustment <= -30:
                            conflicts[element] = f"Conflito pedagógico: Tópico '{keyword}'."

        # 3. Regras de Segurança
        self._apply_psychosocial_safety(scores, conflicts, context_text)

        # 4. Regras de Logística
        environment = validated_input.logistics.environment
        time_constraint = validated_input.logistics.time

        if environment == "Presencial sem Tecnologia":
            tech_blocklist = [
                self.element_mapping["Economia"], 
                self.element_mapping["Feedback"], 
                self.element_mapping["Chat"],
                self.element_mapping["Conquistas"]
            ]
            for item in tech_blocklist:
                if item in scores:
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
        response = {"recommended": [], "neutral": [], "not_recommended": []}

        for element, score in scores.items():
            item_data = {"name": element, "score": score}
            
            if score >= 30: 
                item_data["pre_selected"] = True
                item_data["reason"] = "Alta sinergia detectada."
                response["recommended"].append(item_data)
            elif score < 0: 
                item_data["warning_msg"] = conflicts.get(element, "Não recomendado para este cenário.")
                response["not_recommended"].append(item_data)
            else: 
                response["neutral"].append(item_data)
        
        for k in response:
            response[k].sort(key=lambda x: x['score'], reverse=True)

        return response