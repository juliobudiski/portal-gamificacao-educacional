# backend/app/services/recommendation_engine.py
import json
import os
import logging
import re
from pydantic import BaseModel, Field, field_validator
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
    # [NOTA ARQUITETURAL]: 'isTeamActivity' atua como metadado de Pass-through.
    # Ela não modula os cálculos da fronteira de decisão heurística (S_mod e P_mod),
    # mas transita pelo payload para persistência de estado e formatação 
    # do plano de aula no Front-end (React) e Banco de Dados.
    isTeamActivity: bool = Field(default=False)

    # Validando e normalizando os dados de logística no momento da entrada (O verdadeiro Data Contract)
    @field_validator('characteristics', mode='before')
    def normalize_characteristics(cls, v):
        if not v:
            return []
        # Converte tudo para minúsculo na raiz, prevenindo qualquer falha de casing do Frontend
        return [str(item).strip().lower() for item in v]

class GameficaContextInput(BaseModel):
    greatArea: str = Field(default="")
    areaKnowledge: str = Field(default="")
    currentScenario: CurrentScenarioInput = Field(default_factory=CurrentScenarioInput)
    desiredScenario: DesiredScenarioInput = Field(default_factory=DesiredScenarioInput)
    playerProfile: PlayerProfileInput = Field(default_factory=PlayerProfileInput)
    activityPlanning: LogisticsInput = Field(default_factory=LogisticsInput)

# ==========================================
# 2. MOTOR DE PRECIFICAÇÃO HEURÍSTICA (M.U.I. - Heuristic Scoring Engine)
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
            "Novidade (novas funcionalidades)", "Customização de personagem",
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
        
        # O uso de \b (Word Boundary) garante que a palavra DEVE COMEÇAR com esses caracteres.
        # Exemplo: \blógic encontra "lógica" e "lógico", mas NÃO encontra "biológica" ou "tecnológica".
        teorico_pattern = re.compile(r'\b(lógic|abstra|teori|teóri|leitura|históric|memoriz|legisla|sistêmic|crítico|argumentação)')
        pratico_pattern = re.compile(r'\b(prátic|técnic|experimen|testes|clínica|dados|procedimentos|depuração|bugs)')
        colab_pattern = re.compile(r'\b(equipe|debate|empatia|negocia|liderança|colabora|papéis|scrum)')

        if teorico_pattern.search(text_joined): 
            classes.append("teorico")
        if pratico_pattern.search(text_joined): 
            classes.append("pratico")
        if colab_pattern.search(text_joined): 
            classes.append("colaborativo")
            
        return classes if classes else ["pratico"]

    def _get_context_modifiers(self, keys: List[str], mod_matrix: dict, element: str) -> tuple:
        """
        Processador de Regras de Domínio: Extrai os moduladores escalares do dicionário 
        e aplica a regra estrutural de dominância de risco (Min-Max).
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
            
        # AGREGAÇÃO PESSIMISTA (Min/Max Aritmético)
        # A resolução de múltiplos estados prioriza a segurança: utiliza-se a 
        # seleção primária primitiva (min/max) para garantir que qualquer 
        # escalar de conflito (0.1 / 5.0) tenha precedência absoluta sobre bônus.
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
        logistics = val_input.activityPlanning.characteristics

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

            # 3.1 Modulador Ontológico (Tau): Proteção Sistêmica
            # A hipótese nula assume que narrativas, imersão e estrutura são inofensivas (0.1)
            tau_ativo = 0.1 
            
            # Apenas mecânicas de pressão social/comparação perdem a proteção (1.0)
            if meta.get("mechanic_competitive"): 
                tau_ativo = 1.0
            
            # 3.2 Modulador de Carga Cognitiva (Phi): Limite de Sweller
            # Hipótese nula: A mecânica não gera sobrecarga cognitiva paralela (1.0)
            phi_ativo = 1.0
            
            # Validação Simultânea: Se a Área é Teórica Densa AND a Mecânica gera Estresse Agudo
            if meta.get("area_theoretical") and meta.get("mechanic_cognitive_stress"):
                phi_ativo = 2.0  # Dobra o risco conforme Calibração da Tese

            # 4. Fronteira de Decisão Algébrica
            sb_modificado = sb_puro * mu_total
            pc_modificado = pc_puro * tau_ativo * phi_ativo * lam_total
            
            # Função Indicadora de Ameaça Orgânica (Substitui o if/else por álgebra)
            # Retorna 1 (True) se houver risco comprovado, ou 0 (False) se for apenas ruído.
            ameaca_organica = (pc_puro > 0.1) or (lam_total > 1.0) or (phi_ativo > 1.0)
            
            # Fronteira de Decisão Algébrica com Supressão Matemática de Ruído
            score_bruto = sb_modificado - (pc_modificado * int(ameaca_organica))

            # 5. Avaliação de Veto (Arquitetura Híbrida de Segurança)
            # Validação Algébrica Tradicional (Ameaça supera o Benefício)
            veto_algebrico = (pc_modificado > sb_modificado) and (pc_modificado > 0.1)

            # Gatilho de Veto Heurístico Absoluto (Override booleano para contornar blindagem de Tau)
            veto_heuristico_absoluto = (mu_total <= 0.1) and (lam_total >= 5.0)

            # A mecânica é vetada se falhar na álgebra OU se o contexto disparar a regra estrita
            status_veto = veto_algebrico or veto_heuristico_absoluto

            

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
                "conflito_contextual": veto_heuristico_absoluto,
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


        # ------------------------------------------------------------------
        # CORREÇÃO: AVALIAÇÃO DE CONTEXTO PARA MECÂNICAS SEM LASTRO (FALLBACK)
        # ------------------------------------------------------------------
        # Dicionário reverso para que as regras heurísticas entendam o React
        react_to_internal = {v: k for k, v in self.frontend_map.items()}

        for react_elem in self.all_react_elements:
            if react_elem not in processed_react_names:
                # 1. Recupera o nome interno para cruzar com as matrizes (ex: "Competição")
                internal_name = react_to_internal.get(react_elem, react_elem)
                
                # 2. Avalia Moduladores de Contexto (O CORAÇÃO DA CORREÇÃO)
                mu_prof, lam_prof, pos_prof, neg_prof = self._get_context_modifiers(profiles, self.profile_mods, internal_name)
                mu_obj, lam_obj, pos_obj, neg_obj = self._get_context_modifiers(objectives, self.objective_mods, internal_name)
                
                # Lógica Min-Max (Gargalo de Segurança Estrito)
                mu_total = min(mu_prof, mu_obj)
                lam_total = max(lam_prof, lam_obj)
                
                # 3. Gatilho de Veto Heurístico Absoluto 
                # (Mesmo sem risco da literatura, se houver choque comportamental severo, VETA)
                veto_heuristico_absoluto = (mu_total <= 0.1) and (lam_total >= 5.0)
                status_veto = veto_heuristico_absoluto
                
                # 4. Avaliação Logística (Mundo Físico)
                veto_logistico = False
                if any("desplugado" in item for item in logistics):
                    elementos_digitais = [
                        "Fórum de Discussão", "Chat ou sistema de mensagens", 
                        "Conquistas digitais para metas alcançadas", 
                        "Estatísticas (métricas de progresso)", "Economia (sistema monetário)"
                    ]
                    if react_elem in elementos_digitais:
                        veto_logistico = True
                        status_veto = True

                # 5. Anexa aos resultados com os parâmetros reais (e não injetados falsamente)
                resultados_brutos.append({
                    "elemento": react_elem,
                    "score_bruto": 0.0, # Permanece 0.0 porque não há lastro no SWEBOK
                    "veto": status_veto,
                    "veto_logistico": veto_logistico, 
                    "conflito_contextual": veto_heuristico_absoluto,
                    "mu_total": mu_total,
                    "lam_total": lam_total,
                    "pos_prof": pos_prof, "neg_prof": neg_prof,
                    "pos_obj": pos_obj, "neg_obj": neg_obj
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

            
            if res.get("conflito_contextual", False): 
                # Rastreador de Conflitos: Varre TODOS os elementos do vetor
                culpados = []
                if res["neg_prof"]: 
                    nomes_perfis = " e ".join([p.capitalize() for p in res["neg_prof"]])
                    culpados.append(f"Perfil {nomes_perfis}")
                if res["neg_obj"]: 
                    nomes_objs = " e ".join([o.capitalize() for o in res["neg_obj"]])
                    culpados.append(f"Objetivo {nomes_objs}")
                
                if culpados:
                    reason = f"VETADO: Choque Severo gerado pelo {(' e '.join(culpados))}."
                else:
                    reason = "VETADO: Incompatibilidade comportamental estrita."
                    
            elif res["veto"]: 
                reason = "VETADO: O Risco Matemático da literatura superou a Sinergia teórica."
                
            elif score_normalizado < 0:
                reason = "Afastado: O risco estrutural ou contextual engoliu os benefícios esperados."
                
            # Checagem de Estado Discreto (State Matching)
            elif res["mu_total"] == 1.5: 
                # Rastreador de Afinidades: Varre TODOS os elementos do vetor
                impulsionadores = []
                if res["pos_prof"]: 
                    nomes_perfis = " e ".join([p.capitalize() for p in res["pos_prof"]])
                    impulsionadores.append(f"Perfil {nomes_perfis}")
                if res["pos_obj"]: 
                    nomes_objs = " e ".join([o.capitalize() for o in res["pos_obj"]])
                    impulsionadores.append(f"Objetivo {nomes_objs}")
                
                if impulsionadores:
                    reason = f"Alta Afinidade: Potencializado pelo {(' e '.join(impulsionadores))}."
                else:
                    reason = "Alta afinidade orgânica com o contexto da turma."
                    
            # Se sobreviveu aos vetos, mas o risco é maior que a Neutralidade (1.0)
            elif res["lam_total"] > 1.0: 
                reason = "Atenção: Possui atritos comportamentais. Monitore o engajamento durante a aplicação."
            
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
            # Lógica Estrita baseada no Manuscrito (Seção 6.2): 
            if res["veto"] or res.get("veto_logistico", False) or score_normalizado < 0:
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
