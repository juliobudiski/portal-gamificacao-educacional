# backend/app/services/recommendation_engine.py
import json
import os
import logging
from pydantic import BaseModel, Field
from typing import List

logger = logging.getLogger(__name__)

# ==========================================
# 1. SCHEMAS DE ENTRADA (Mapeando o React)
# ==========================================
class CurrentScenarioInput(BaseModel):
    problems: List[str] = Field(default_factory=list)

class DesiredScenarioInput(BaseModel):
    objectives: List[str] = Field(default_factory=list)

class PlayerProfileInput(BaseModel):
    selectedProfiles: List[str] = Field(default_factory=list)

class LogisticsInput(BaseModel):
    characteristics: List[str] = Field(default_factory=list)
    isTeamActivity: bool = Field(default=False)

class GameficaContextInput(BaseModel):
    greatArea: str = Field(default="")
    areaKnowledge: str = Field(default="")
    currentScenario: CurrentScenarioInput = Field(default_factory=CurrentScenarioInput)
    desiredScenario: DesiredScenarioInput = Field(default_factory=DesiredScenarioInput)
    playerProfile: PlayerProfileInput = Field(default_factory=PlayerProfileInput)
    activityPlanning: LogisticsInput = Field(default_factory=LogisticsInput)

# ==========================================
# 2. MOTOR DE INFERÊNCIA HÍBRIDO (M.U.I.)
# ==========================================
class ContextualRecommendationEngine:
    def __init__(self, kb_path: str = "knowledge_base.json"):
        self.kb_path = kb_path
        self._load_knowledge_base()

        self.frontend_map = {
            "Nível": "Níveis",
            "Pontos": "Sistema de pontuação",
            "Estatísticas": "Estatísticas (métricas de progresso)",
            "Economia": "Economia (sistema monetário)",
            "Pressão de tempo": "Pressão de tempo",
            "Competição": "Sistema de classificação e ranking",
            "Cooperação": "Fórum de Discussão", 
            "Objetivo": "Objetivo (missão, meta do jogo)",
            "Quebra cabeça": "Quebra-cabeça",
            "Storytelling": "Storytelling",
            "Narrativa": "Narrativas envolventes",
            "Progressão": "Progressão baseada em habilidade",
            "Reconhecimento": "Conquistas digitais para metas alcançadas"
        }

        self.all_react_elements = [
            "Níveis", "Sistema de pontuação", "Estatísticas (métricas de progresso)", "Reconhecimento",
            "Raridade (itens exclusivos, objetos raros)", "Economia (sistema monetário)", "Escolha imposta (decisões forçadas)",
            "Chance (sorte e probabilidade)", "Pressão de tempo", "Reputação (prestígio, renome, status)",
            "Pressão social", "Sensação (imersão, experiência sensorial)",
            "Objetivo (missão, meta do jogo)", "Quebra-cabeça", "Renovação (atualizações de conteúdo)",
            "Novidade (novas funcionalidades)", "Storytelling", "Customização de personagem",
            "Customização de equipamento", "Chat ou sistema de mensagens", "Fórum de Discussão",
            "Interação social com outros jogadores", "Feedback claro sobre o desempenho",
            "Progressão baseada em habilidade", "Narrativas envolventes", "Sistema de classificação e ranking",
            "Recompensas atraentes", "Conquistas digitais para metas alcançadas"
        ]

        # Configurações de Conflito Severo baseadas na Calibração Matemática
        self.profile_mods = {
            "competitivo": { "Competição": {"mu": 1.5, "lambda": 0.5}, "Pressão de tempo": {"mu": 1.5, "lambda": 0.5}, "Cooperação": {"mu": 0.1, "lambda": 5.0} },
            "social": { "Cooperação": {"mu": 1.5, "lambda": 0.5}, "Narrativa": {"mu": 1.5, "lambda": 0.5}, "Storytelling": {"mu": 1.5, "lambda": 0.5}, "Competição": {"mu": 0.1, "lambda": 5.0} },
            "realizador": { "Pontos": {"mu": 1.5, "lambda": 0.5}, "Nível": {"mu": 1.5, "lambda": 0.5}, "Quebra cabeça": {"mu": 1.5, "lambda": 0.5}, "Reconhecimento": {"mu": 1.5, "lambda": 0.5} },
            "explorador": { "Narrativa": {"mu": 1.5, "lambda": 0.5}, "Storytelling": {"mu": 1.5, "lambda": 0.5}, "Quebra cabeça": {"mu": 1.5, "lambda": 0.5}, "Pressão de tempo": {"mu": 0.1, "lambda": 5.0} }
        }

        self.objective_mods = {
            "teorico": { "Narrativa": {"mu": 1.5, "lambda": 0.5}, "Quebra cabeça": {"mu": 1.5, "lambda": 0.5}, "Pressão de tempo": {"mu": 0.1, "lambda": 5.0}, "Economia": {"mu": 0.1, "lambda": 5.0} },
            "pratico": { "Pontos": {"mu": 1.5, "lambda": 0.5}, "Economia": {"mu": 1.5, "lambda": 0.5}, "Pressão de tempo": {"mu": 1.5, "lambda": 0.5}, "Estatísticas": {"mu": 1.5, "lambda": 0.5}, "Narrativa": {"mu": 0.1, "lambda": 5.0} },
            "colaborativo": { "Cooperação": {"mu": 1.5, "lambda": 0.5}, "Reconhecimento": {"mu": 1.5, "lambda": 0.5}, "Competição": {"mu": 0.1, "lambda": 5.0} }
        }

    def _load_knowledge_base(self):
        try:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            full_path = os.path.join(base_dir, self.kb_path)
            with open(full_path, 'r', encoding='utf-8') as f:
                self.bible = json.load(f)
        except Exception as e:
            logger.error(f"Falha ao carregar knowledge_base.json: {e}")
            self.bible = {}

    def _classify_objectives(self, frontend_texts: List[str]) -> List[str]:
        text_joined = " ".join(frontend_texts).lower()
        classes = []
        
        if any(w in text_joined for w in ["lógic", "abstra", "teori", "teóri", "leitura", "históric", "memoriz", "legisla", "sistêmic", "crítico", "argumentação"]): 
            classes.append("teorico")
        if any(w in text_joined for w in ["prátic", "técnic", "experimen", "testes", "clínica", "dados", "procedimentos", "depuração", "bugs"]): 
            classes.append("pratico")
        if any(w in text_joined for w in ["equipe", "debate", "empatia", "negocia", "liderança", "colabora", "papéis", "scrum"]): 
            classes.append("colaborativo")
            
        return classes if classes else ["pratico"]

    def _get_context_modifiers(self, keys: List[str], mod_matrix: dict, element: str) -> tuple:
        """
        Substitui a média por uma lógica de Segurança Psicológica.
        Se qualquer elemento do array gerar conflito (0.1), o conflito prevalece.
        """
        if not keys: return 1.0, 1.0
        has_positive = False
        has_negative = False
        
        for k in keys:
            k_lower = k.lower()
            if k_lower in mod_matrix:
                mods = mod_matrix[k_lower].get(element, {"mu": 1.0, "lambda": 1.0})
                if mods["mu"] < 1.0: has_negative = True
                if mods["mu"] > 1.0: has_positive = True
        
        if has_negative: return 0.1, 5.0 # Veto por segurança impera
        if has_positive: return 1.5, 0.5 # Bônus concedido
        return 1.0, 1.0 # Neutro

    def calculate_recommendations(self, context_data: dict) -> dict:
        try:
            val_input = GameficaContextInput(**context_data)
        except Exception as e:
            raise ValueError(f"Payload inválido: {e}")

        area_swebok = val_input.areaKnowledge.upper()
        if area_swebok not in self.bible:
            area_swebok = "SOFTWARE ENGINEERING PROFESSIONAL PRACTICE"

        profiles = val_input.playerProfile.selectedProfiles
        frontend_texts = val_input.currentScenario.problems + val_input.desiredScenario.objectives
        objectives = self._classify_objectives(frontend_texts)
        logistics = [str(item).lower() for item in val_input.activityPlanning.characteristics]

        resultados_brutos = []
        elementos_area = self.bible.get(area_swebok, {})
        processed_react_names = set()

        for elemento_json, dados_literatura in elementos_area.items():
            react_name = self.frontend_map.get(elemento_json, elemento_json)
            processed_react_names.add(react_name)

            # 1. Extração de Dados Puros e Metadados do JSON purificado
            sb_puro = dados_literatura.get("sb_puro", 0.0)
            pc_puro = dados_literatura.get("pc_puro", 0.0)
            meta = dados_literatura.get("metadata", {})

            # 2. Moduladores de Contexto (Perfil da Turma vs Objetivo Pedagógico)
            mu_prof, lam_prof = self._get_context_modifiers(profiles, self.profile_mods, elemento_json)
            mu_obj, lam_obj = self._get_context_modifiers(objectives, self.objective_mods, elemento_json)
            
            # Lógica Min-Max (Gargalo de Segurança)
            mu_total = min(mu_prof, mu_obj)
            lam_total = max(lam_prof, lam_obj)

            # 3. Moduladores Epistêmicos (Calibração Matemática)
            phi_ativo = 2.0 if (meta.get("area_theoretical") and meta.get("mechanic_cognitive_stress")) else 1.0
            
            tau_ativo = 1.0
            if meta.get("mechanic_structural"): tau_ativo = 0.1
            elif meta.get("mechanic_competitive"): tau_ativo = 1.0
            

            # 4. Fronteira de Decisão Algébrica
            sb_modificado = sb_puro * mu_total
            pc_modificado = pc_puro * tau_ativo * phi_ativo * lam_total
            
            score_bruto = sb_modificado - pc_modificado
            
            # 5. Avaliação de Veto (Regras Severas)
            veto_algebrico = pc_modificado > sb_modificado
            hard_block = (mu_total <= 0.1) and (lam_total >= 5.0)
            status_veto = veto_algebrico or hard_block

            # Constantes de Penalidade para Ordenação da Interface (Big-M Method)
            PENALIDADE_LOGISTICA = -100.0
            PENALIDADE_RESIDUAL = -10.0

            veto_logistico = False
            if any("desplugado" in item for item in logistics):
                elementos_digitais = [
                    "Fórum de Discussão", "Chat ou sistema de mensagens", 
                    "Conquistas digitais para metas alcançadas", 
                    "Estatísticas (métricas de progresso)", "Economia (sistema monetário)"
                ]
                if react_name in elementos_digitais:
                    veto_logistico = True
                    status_veto = True
                    score_bruto = PENALIDADE_LOGISTICA 

            if status_veto: 
                # Garante que o score seja negativo para cair na restrição visual do Front-end
                score_bruto = -abs(score_bruto) if score_bruto != 0 else PENALIDADE_RESIDUAL
                
            resultados_brutos.append({
                "elemento": react_name,
                "score_bruto": score_bruto,
                "veto": status_veto,
                "veto_logistico": veto_logistico,
                "conflito_contextual": hard_block,
                "mu_total": mu_total,
                "lam_total": lam_total
            })

        max_abs = max([abs(r["score_bruto"]) for r in resultados_brutos]) if resultados_brutos else 1.0
        if max_abs == 0: max_abs = 1.0

        for react_elem in self.all_react_elements:
            if react_elem not in processed_react_names:
                resultados_brutos.append({
                    "elemento": react_elem,
                    "score_bruto": 0.0,
                    "veto": False,
                    "conflito_contextual": False,
                    "mu_total": 1.0,
                    "lam_total": 1.0
                })

        response = {"recommended": [], "neutral": [], "not_recommended": []}
        
        # --- MONTA OS CLUSTERS FINAIS ---
        for res in resultados_brutos:
            score_normalizado = (res["score_bruto"] / max_abs) * 50
            
            PISO_NORMALIZADO_UI = -50.0
            if res.get("veto_logistico", False):
                score_normalizado = PISO_NORMALIZADO_UI 
                reason = "VETADO: Requer tecnologia (Incompatível com sala de aula física)."
                response["not_recommended"].append({"name": res["elemento"], "score": round(score_normalizado, 2), "reason": reason})
                continue 

            if res.get("conflito_contextual", False): 
                reason = "VETADO: Choque Severo entre o Perfil da Turma e o Objetivo."
            elif res["veto"]: 
                reason = "VETADO: Risco Matemático superou a Sinergia."
            elif res["mu_total"] > 1.2: 
                reason = "Alta afinidade com o contexto (Sinergia Impulsionada)."
            elif res["lam_total"] > 1.2: 
                reason = "Possui atritos leves, monitorar aplicação."
            elif res["score_bruto"] == 0.0:
                reason = "Uso neutro (Base de conhecimento ausente)."
            else: 
                reason = "Recomendação padrão da literatura."

            item_data = {"name": res["elemento"], "score": round(score_normalizado, 2), "reason": reason}

            if res["veto"] or score_normalizado <= -5:
                response["not_recommended"].append(item_data)
            elif score_normalizado >= 25:
                item_data["pre_selected"] = score_normalizado >= 40
                response["recommended"].append(item_data)
            else:
                response["neutral"].append(item_data)

        for key in response:
            response[key] = sorted(response[key], key=lambda x: x["score"], reverse=True)

        return response
