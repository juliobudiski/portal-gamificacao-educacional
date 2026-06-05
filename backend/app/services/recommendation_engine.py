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
        Motor Intra-dimensional: Extrai os moduladores do dicionário e aplica 
        uma lógica matemática baseada em dominância de risco.
        """
        if not keys: 
            return 1.0, 1.0, [], []
        
        mus = []
        lambdas = []
        has_positive = []
        has_negative = []
        
        for k in keys:
            k_lower = k.lower()
            if k_lower in mod_matrix:
                mods = mod_matrix[k_lower].get(element, {"mu": 1.0, "lambda": 1.0})
                
                # Adiciona os valores reais matemáticos à lista
                mus.append(mods["mu"])
                lambdas.append(mods["lambda"])
                
                # Rastreabilidade para a Explicabilidade
                if mods["mu"] < 1.0: has_negative.append(k)
                if mods["mu"] > 1.0: has_positive.append(k)
        
        # Se a mecânica não está mapeada para essas chaves, retorna Neutralidade
        if not mus:
            return 1.0, 1.0, [], []
            
        # PRECEDÊNCIA DE RISCO INTRA-DIMENSIONAL (O Verdadeiro Min-Max)
        # Se existe algum vetor de conflito (0.1), ele esmaga os neutros e bônus.
        if has_negative:
            final_mu = min(mus)      # Forçará matematicamente para 0.1
            final_lambda = max(lambdas) # Forçará matematicamente para 5.0
        
        # Se não há conflito, mas há bônus (1.5), assumimos o bônus máximo.
        elif has_positive:
            final_mu = max(mus)      # Captura o 1.5 e ignora os neutros (1.0)
            final_lambda = min(lambdas) # Captura o 0.5
            
        # Se só existem elementos neutros (1.0)
        else:
            final_mu, final_lambda = 1.0, 1.0
            
        return final_mu, final_lambda, has_positive, has_negative

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
            mu_prof, lam_prof, pos_prof, neg_prof = self._get_context_modifiers(profiles, self.profile_mods, elemento_json)
            mu_obj, lam_obj, pos_obj, neg_obj = self._get_context_modifiers(objectives, self.objective_mods, elemento_json)
            
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
            
            # Controle Inteligente do Limiar Basal
            if pc_puro == 0.1 and lam_total <= 1.0 and phi_ativo == 1.0:
                score_bruto = sb_modificado
            else:
                score_bruto = sb_modificado - pc_modificado

            # 5. Avaliação de Veto (Regras Severas)
            veto_algebrico = (pc_modificado > sb_modificado) and (pc_modificado > 0.1)
            hard_block = (mu_total <= 0.1) and (lam_total >= 5.0)
            status_veto = veto_algebrico or hard_block

            # Avaliação Logística (Mundo Físico)
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
                
            resultados_brutos.append({
                "elemento": react_name,
                "score_bruto": score_bruto,
                "veto": status_veto,
                "veto_logistico": veto_logistico,
                "conflito_contextual": hard_block,
                "mu_total": mu_total,
                "lam_total": lam_total,
                "pos_prof": pos_prof, "neg_prof": neg_prof,
                "pos_obj": pos_obj, "neg_obj": neg_obj
            })

        # TETO ALGÉBRICO (Normalização Relativa - Seção 6.2 do Manuscrito)
        # O max_abs não pode considerar as penalidades (-100), senão ele esmaga a proporção matemática.
        # Ele deve olhar apenas para mecânicas que NÃO foram vetadas e têm pontuação positiva.
        scores_positivos = [r["score_bruto"] for r in resultados_brutos if not r["veto"] and r["score_bruto"] > 0]
        max_abs = max(scores_positivos) if scores_positivos else 1.0

        # TRAVA DE RELEVÂNCIA (Anti-inflação Estatística)
        # Se a melhor mecânica tem um score pífio (ex: 0.05), o sistema crava o teto em 1.0
        # Isso impede que uma mediocridade matemática seja multiplicada para nota máxima.
        if max_abs < 0.2:
            max_abs = 1.0


        for react_elem in self.all_react_elements:
            if react_elem not in processed_react_names:
                resultados_brutos.append({
                    "elemento": react_elem,
                    "score_bruto": 0.0,
                    "veto": False,
                    "conflito_contextual": False,
                    "mu_total": 1.0,
                    "lam_total": 1.0,
                    "pos_prof": [], "neg_prof": [], "pos_obj": [], "neg_obj": []
                })

        response = {"recommended": [], "neutral": [], "not_recommended": []}
        
        # --- MONTA OS CLUSTERS FINAIS ---
        for res in resultados_brutos:
            score_normalizado = (res["score_bruto"] / max_abs) * 50
            
            # A trava visual do Alerta Logístico (Apoiada no texto da tese)
            if res.get("veto_logistico", False):
                score_normalizado = -50.0 
                reason = "VETADO: Requer tecnologia (Incompatível com sala de aula física)."
                response["not_recommended"].append({"name": res["elemento"], "score": round(score_normalizado, 2), "reason": reason})
                continue

            # GERADOR DINÂMICO DE EXPLICABILIDADE (XDSS)
            if res.get("conflito_contextual", False): 
                # Rastreador de Conflitos
                culpados = []
                if res["neg_prof"]: culpados.append(f"Perfil {res['neg_prof'][0].capitalize()}")
                if res["neg_obj"]: culpados.append(f"Objetivo {res['neg_obj'][0].capitalize()}")
                
                if culpados:
                    reason = f"VETADO: Choque Severo gerado pelo {(' e '.join(culpados))}."
                else:
                    reason = "VETADO: Incompatibilidade comportamental estrita."
                    
            elif res["veto"]: 
                reason = "VETADO: O Risco Matemático da literatura superou a Sinergia teórica."
                
            elif score_normalizado < 0:
                reason = "Afastado: O risco estrutural ou contextual engoliu os benefícios esperados."
                
            elif res["mu_total"] > 1.2: 
                # Rastreador de Afinidades (Bônus)
                impulsionadores = []
                if res["pos_prof"]: impulsionadores.append(f"Perfil {res['pos_prof'][0].capitalize()}")
                if res["pos_obj"]: impulsionadores.append(f"Objetivo {res['pos_obj'][0].capitalize()}")
                
                if impulsionadores:
                    reason = f"Alta Afinidade: Potencializado pelo {(' e '.join(impulsionadores))}."
                else:
                    reason = "Alta afinidade orgânica com o contexto da turma."
                    
            elif res["lam_total"] > 1.2: 
                reason = "Atenção: Possui atritos comportamentais leves. Monitore o engajamento durante a aplicação."
            
            elif res["score_bruto"] == 0.0:
                reason = "Uso Livre: Mecânica sem atritos teóricos, mas sem dados empíricos mapeados na disciplina."
            
            else: 
                # Se não tem bônus de perfil, mas a nota é alta, é porque a disciplina em si (SWEBOK) se beneficia muito disso.
                if score_normalizado >= 25:
                    reason = "Alta eficácia histórica na disciplina. Estratégia sólida, segura e versátil para a turma."
                # Se não tem bônus de perfil e a nota é mediana, é um item de suporte.
                else:
                    reason = "Eficácia moderada na disciplina. Opção viável e segura, mas de impacto secundário."

            item_data = {"name": res["elemento"], "score": round(score_normalizado, 2), "reason": reason}

            # Lógica Estrita baseada no Manuscrito: 
            if res["veto"] or score_normalizado < 0:
                response["not_recommended"].append(item_data)
            elif score_normalizado >= 25:
                item_data["pre_selected"] = score_normalizado >= 40
                response["recommended"].append(item_data)
            else:
                response["neutral"].append(item_data)

        for key in response:
            response[key] = sorted(response[key], key=lambda x: x["score"], reverse=True)

# ==========================================
        # SONDA DE DEBUG PARA O TERMINAL PYTHON
        # ==========================================
        print("\n" + "="*50)
        print("🔍 DIAGNÓSTICO DO MOTOR DE RECOMENDAÇÃO (MUI)")
        print("="*50)
        print(f"Área SWEBOK processada: {area_swebok}")
        print(f"Perfis recebidos: {profiles}")
        print(f"Objetivos detectados: {objectives}")
        print(f"Teto Algébrico (Max Abs): {max_abs}")
        print("-" * 50)
        
        recomendados_count = 0
        neutros_count = 0
        vetos_count = 0

        for r in resultados_brutos:
            # Pula os que foram zerados por falta de literatura para não poluir o log
            if r["score_bruto"] == 0.0 and r["mu_total"] == 1.0:
                neutros_count += 1
                continue
                
            status_txt = "🔴 VETADO" if r["veto"] else "🟢 APROVADO"
            if r["veto_logistico"]: status_txt = "⚫ VETO LOGÍSTICO"
            elif r["score_bruto"] > 0:
                recomendados_count += 1
            else:
                neutros_count += 1
                
            print(f"[{status_txt}] Mecânica: {r['elemento']}")
            print(f"    Sinergia(mu): {r['mu_total']} | Risco(lam): {r['lam_total']}")
            print(f"    Score Bruto: {r['score_bruto']:.4f}")
            print(f"    Culpados do Choque: {r['neg_prof']} / {r['neg_obj']}")
            print("-" * 50)
            
        print(f"Resumo da Interface -> Recomendados: {len(response['recommended'])} | Neutros: {len(response['neutral'])} | Lixeira: {len(response['not_recommended'])}")
        print("="*50 + "\n")

        return response
