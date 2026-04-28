# backend/app/services/recommendation_engine.py
import json
import os
import re
import logging
from pydantic import BaseModel, Field
from typing import Any, List, Dict

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
            
            # --- A MÁGICA DA HERANÇA ACONTECE AQUI ---
            # A literatura estudou "Competição", o SAD sugere "Ranking"
            "Competição": "Sistema de classificação e ranking",
            
            # A literatura estudou "Cooperação", o SAD sugere "Fórum/Chat"
            "Cooperação": "Fórum de Discussão", 
            
            "Objetivo": "Objetivo (missão, meta do jogo)",
            "Quebra cabeça": "Quebra-cabeça",
            "Storytelling": "Storytelling",
            "Narrativa": "Narrativas envolventes",
            
            # A literatura estudou "Progressão", o SAD sugere "Habilidade"
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

        # --- A MARRETA DO CONTEXTO: Multiplicadores Agressivos ---
        # Conflitos agora têm mu=0.1 (mata o ganho) e lambda=5.0 (explode o risco)
        self.profile_mods = {
            "competitivo": { "Competição": {"mu": 1.5, "lambda": 0.5}, "Pressão de tempo": {"mu": 1.5, "lambda": 0.5}, "Cooperação": {"mu": 0.1, "lambda": 5.0} },
            "social": { "Cooperação": {"mu": 1.5, "lambda": 0.5}, "Narrativa": {"mu": 1.5, "lambda": 0.5}, "Storytelling": {"mu": 1.5, "lambda": 0.5}, "Competição": {"mu": 0.1, "lambda": 5.0} },
            "realizador": { "Pontos": {"mu": 1.5, "lambda": 0.5}, "Nível": {"mu": 1.5, "lambda": 0.5}, "Quebra cabeça": {"mu": 1.5, "lambda": 0.5}, "Reconhecimento": {"mu": 1.5, "lambda": 0.5} },
            "explorador": { "Narrativa": {"mu": 1.5, "lambda": 0.5}, "Storytelling": {"mu": 1.5, "lambda": 0.5}, "Quebra cabeça": {"mu": 1.5, "lambda": 0.5}, "Pressão de tempo": {"mu": 0.1, "lambda": 5.0} }
        }

        self.objective_mods = {
            "teorico": { "Narrativa": {"mu": 1.5, "lambda": 0.5}, "Quebra cabeça": {"mu": 1.5, "lambda": 0.5}, "Pressão de tempo": {"mu": 0.1, "lambda": 5.0}, "Economia": {"mu": 0.1, "lambda": 5.0} },
            "pratico": { "Pontos": {"mu": 1.5, "lambda": 0.5}, "Economia": {"mu": 1.5, "lambda": 0.5}, "Pressão de tempo": {"mu": 1.5, "lambda": 0.5}, "Estatísticas": {"mu": 1.5, "lambda": 0.5}, "Narrativa": {"mu": 0.1, "lambda": 3.0} },
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

    def _extract_raw_scores(self, xai_string: str) -> tuple:
        match = re.search(r'Sb:\s*([\d.]+)\s*\|\s*Pc:\s*([\d.]+)', xai_string)
        if match: return float(match.group(1)), float(match.group(2))
        return 0.0, 0.0

    def _classify_objectives(self, frontend_texts: List[str]) -> List[str]:
        """ NLP Melhorado para capturar as strings exatas do seu React """
        text_joined = " ".join(frontend_texts).lower()
        classes = []
        
        # Palavras-chave mapeadas diretamente dos seus arquivos JSX
        if any(w in text_joined for w in ["lógic", "abstra", "teori", "teóri", "leitura", "históric", "memoriz", "legisla", "sistêmic", "crítico", "argumentação"]): 
            classes.append("teorico")
            
        if any(w in text_joined for w in ["prátic", "técnic", "experimen", "testes", "clínica", "dados", "procedimentos", "depuração", "bugs"]): 
            classes.append("pratico")
            
        if any(w in text_joined for w in ["equipe", "debate", "empatia", "negocia", "liderança", "colabora", "papéis", "scrum"]): 
            classes.append("colaborativo")
            
        return classes if classes else ["pratico"] # Fallback se nenhuma palavra bater

    def _get_averaged_modifiers(self, keys: List[str], mod_matrix: dict, element: str) -> tuple:
        if not keys: return 1.0, 1.0
        mu_sum, lambda_sum, count = 0.0, 0.0, 0
        for k in keys:
            k_lower = k.lower()
            if k_lower in mod_matrix:
                mods = mod_matrix[k_lower].get(element, {"mu": 1.0, "lambda": 1.0})
                mu_sum += mods["mu"]; lambda_sum += mods["lambda"]; count += 1
        if count == 0: return 1.0, 1.0
        return (mu_sum / count), (lambda_sum / count)

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
        processed_react_names = set() # Rastreador do que já foi processado

        # PROCESSA A LITERATURA
        for elemento_json, dados_literatura in elementos_area.items():
            # Traduz para o nome que o React entende
            react_name = self.frontend_map.get(elemento_json, elemento_json)
            processed_react_names.add(react_name)

            sb_raw, pc_raw = self._extract_raw_scores(dados_literatura["xai"])
            mu_prof, lam_prof = self._get_averaged_modifiers(profiles, self.profile_mods, elemento_json)
            mu_obj, lam_obj = self._get_averaged_modifiers(objectives, self.objective_mods, elemento_json)
            
            sb_modificado = sb_raw * mu_prof * mu_obj
            pc_modificado = pc_raw * lam_prof * lam_obj
            
            score_bruto = sb_modificado - pc_modificado
            status_veto = pc_modificado > sb_modificado
            conflito_contextual = (mu_prof * mu_obj <= 0.2) and (lam_prof * lam_obj >= 3.0)
            if conflito_contextual:
                status_veto = True
                
            veto_logistico = False
            
            # Checa se o array logistics contém algum item com a palavra "desplugado"
            if any("desplugado" in item for item in logistics):
                # Se for aula no papel/quadro, esses elementos digitais são inúteis:
                elementos_digitais = [
                    "Fórum de Discussão", "Chat ou sistema de mensagens", 
                    "Conquistas digitais para metas alcançadas", 
                    "Estatísticas (métricas de progresso)"
                ]
                if react_name in elementos_digitais:
                    veto_logistico = True
                    status_veto = True
                    score_bruto = -100.0 # Aplica o Hard Block matemático

            if status_veto: score_bruto = -abs(score_bruto) if score_bruto != 0 else -10.0
                
                
            resultados_brutos.append({
                "elemento": react_name,
                "score_bruto": score_bruto,
                "veto": status_veto,
                "veto_logistico": veto_logistico, # Flag para a IA Explicável
                "conflito_contextual": conflito_contextual,
                "mu_total": mu_prof * mu_obj,
                "lam_total": lam_prof * lam_obj
            })

        max_abs = max([abs(r["score_bruto"]) for r in resultados_brutos]) if resultados_brutos else 1.0
        if max_abs == 0: max_abs = 1.0

        response = {"recommended": [], "neutral": [], "not_recommended": []}

        # MONTA OS CLUSTERS BASEADOS NA LITERATURA
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

        # --- 2. CONFIGURA A ALFÂNDEGA DE LOGÍSTICA ---
        is_desplugado = any("desplugado" in item for item in logistics)
        elementos_digitais = [
            "Fórum de Discussão", 
            "Chat ou sistema de mensagens", 
            "Conquistas digitais para metas alcançadas", 
            "Estatísticas (métricas de progresso)",
            "Economia (sistema monetário)",
            "Renovação (atualizações de conteúdo)"
            # Adicione aqui qualquer outra coisa que você ache impossível fazer sem PC
        ]

        response = {"recommended": [], "neutral": [], "not_recommended": []}
        
        max_abs = max([abs(r["score_bruto"]) for r in resultados_brutos]) if resultados_brutos else 1.0
        if max_abs == 0: max_abs = 1.0

        # --- 3. MONTA OS CLUSTERS FINAIS ---
        for res in resultados_brutos:
            score_normalizado = (res["score_bruto"] / max_abs) * 50
            
            # REGRA MESTRA: Veto Logístico atinge qualquer elemento que precise de tecnologia
            if is_desplugado and (res["elemento"] in elementos_digitais):
                score_normalizado = -50.0 # Empurra direto pro fundo
                reason = "VETADO: Requer tecnologia (Incompatível com infraestrutura desplugada)."
                response["not_recommended"].append({"name": res["elemento"], "score": round(score_normalizado, 2), "reason": reason})
                continue # PULA todo o resto das regras abaixo!

            # Se a logística está OK, julga a matemática pedagógica
            if res.get("conflito_contextual", False): 
                reason = "VETADO: Conflito grave com os objetivos e perfil selecionados."
            elif res["veto"]: 
                reason = "VETADO: Riscos contextuais superam o potencial pedagógico."
            elif res["mu_total"] > 1.2: 
                reason = "Alta sinergia com o Perfil/Objetivos da turma."
            elif res["lam_total"] > 1.2: 
                reason = "Possui atritos de contexto, usar com cautela."
            elif res["score_bruto"] == 0.0:
                reason = "Uso livre (Sem dados restritivos na literatura)."
            else: 
                reason = "Recomendação padrão baseada na literatura."

            item_data = {"name": res["elemento"], "score": round(score_normalizado, 2), "reason": reason}

            # Ranqueamento nas Pastas
            if res["veto"] or score_normalizado <= -5:
                response["not_recommended"].append(item_data)
            elif score_normalizado >= 25:
                item_data["pre_selected"] = score_normalizado >= 40
                response["recommended"].append(item_data)
            else:
                response["neutral"].append(item_data)

        # Ordena do maior para o menor
        for key in response:
            response[key] = sorted(response[key], key=lambda x: x["score"], reverse=True)

        return response