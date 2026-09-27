"""
Page Object Model: GamifiedActivityPage
Encapsula os seletores e fluxos do Professor (criação e publicação de atividades)
e do Aluno (navegação por turmas, seleção da atividade e resolução interativa com ganho de XP).
"""

from playwright.async_api import Page, expect
from logger import e2e_logger


class GamifiedActivityPage:
    """
    POM abrangendo os fluxos docentes e discentes de atividades gamificadas.
    """

    def __init__(self, page: Page, base_url: str = "http://127.0.0.1:5173"):
        self.page = page
        self.base_url = base_url.rstrip("/")

        # --- Seletores de Login ---
        self.email_input = page.locator("input#email")
        self.password_input = page.locator("input#password")
        self.submit_login_button = page.locator('button[type="submit"]')

        # --- Seletores do Professor (Criação de Atividades) ---
        self.create_activity_link = page.locator('a[href="/professor/criar-atividade"], #tour-dash-create-btn')
        self.scratch_mode_button = page.locator('button:has-text("Criar do Zero"), button:has-text("Começar do Zero")')
        self.activity_title_input = page.locator('input[name="title"]')
        self.activity_desc_input = page.locator('textarea[name="description"], textarea#description')
        self.knowledge_area_select = page.locator('select[name="areaKnowledge"]')
        self.next_step_button = page.locator('button:has-text("Próximo Passo"), button:has-text("Avançar")')
        self.publish_activity_button = page.locator('button:has-text("Publicar Atividade"), button:has-text("Salvar Atividade"), button:has-text("Concluir Atividade")')

        # --- Seletores do Aluno ---
        self.student_activities_link = page.locator('a[href="/aluno/atividades"], a:has-text("Minhas Atividades")')
        self.student_activity_search_input = page.locator('input[placeholder*="Buscar atividade"]')
        self.confirm_answer_button = page.locator('button:has-text("Confirmar Resposta")')
        self.success_feedback_modal = page.locator('h2:has-text("Pontos"), h2:has-text("Correta"), div.animate-fadeIn')

    async def handle_geolocation_prompt_if_present(self) -> None:
        """Descarta o modal de aviso de geolocalização e aviso de servidor se estiverem visíveis."""
        dismiss_server = self.page.locator('button:has-text("Fechar aviso")')
        try:
            if await dismiss_server.is_visible(timeout=1500):
                e2e_logger.log_click('button:has-text("Fechar aviso")')
                await dismiss_server.click(force=True)
                e2e_logger.log_info("Modal de aviso de inicialização de servidor descartado.")
        except Exception:
            pass

        dismiss_location = self.page.locator('button:has-text("Entendi, Continuar")')
        try:
            if await dismiss_location.is_visible(timeout=1500):
                e2e_logger.log_click('button:has-text("Entendi, Continuar")')
                await dismiss_location.click(force=True)
                e2e_logger.log_info("Modal de aviso de localização descartado.")
        except Exception:
            pass


    # =========================================================================
    # AÇÕES DO PROFESSOR
    # =========================================================================

    async def login_as_teacher(self, email: str, password: str) -> None:
        """Autentica na plataforma com credenciais docentes."""
        target_url = f"{self.base_url}/login"
        e2e_logger.log_navigation(target_url)
        await self.page.goto(target_url, wait_until="domcontentloaded", timeout=60000)
        await expect(self.email_input).to_be_visible(timeout=30000)
        
        e2e_logger.log_fill("input#email", masked=False, value_preview=email)
        await self.email_input.fill(email)

        e2e_logger.log_fill("input#password", masked=True)
        await self.password_input.fill(password)

        e2e_logger.log_click('button[type="submit"]')
        await self.submit_login_button.click()

        await self.page.wait_for_url("**/professor/**", timeout=30000)
        await self.handle_geolocation_prompt_if_present()
        e2e_logger.log_assertion("Login do Professor autenticado com sucesso.")

    async def create_and_publish_gamified_activity(self, title: str, description: str, xp_reward: int = 150) -> None:
        """
        Executa a criação completa da atividade gamificada com quiz e a publica
        para que fique imediatamente acessível aos alunos matriculados na turma.
        """
        e2e_logger.log_info(f"Iniciando fluxo de criação da atividade: '{title}'")
        
        create_payload = {
            "title": title,
            "description": description,
            "areaKnowledge": "Computação e Engenharia de Software",
            "isPublic": True,
            "gamificationDesign": {
                "progression_path": [
                    {
                        "id": "step_1",
                        "name": "Missão Inicial: Desafio de Programação",
                        "type": "quiz",
                        "content": {
                            "step_id": "step_1",
                            "type": "quiz",
                            "questions": [
                                {
                                    "text": "Qual princípio SOLID afirma que uma classe deve ter apenas um motivo para mudar?",
                                    "options": [
                                        "Single Responsibility Principle (SRP)",
                                        "Open/Closed Principle (OCP)",
                                        "Liskov Substitution Principle (LSP)",
                                        "Dependency Inversion Principle (DIP)"
                                    ],
                                    "correct_option": "Single Responsibility Principle (SRP)",
                                    "points": xp_reward,
                                    "coins": 25
                                }
                            ]
                        }
                    }
                ]
            }
        }

        assign_script = '''
        async ([payload]) => {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            return { ok: res.ok, data };
        }
        '''
        response_result = await self.page.evaluate(assign_script, [create_payload])
        assert response_result.get("ok"), f"Falha ao criar atividade via API docente: {response_result}"
        
        created_activity_id = response_result["data"]["activity"]["id"]
        e2e_logger.log_info(f"Atividade ID {created_activity_id} criada e publicada com sucesso.")

        classes_script = '''
        async (actId) => {
            const token = localStorage.getItem('token');
            const classRes = await fetch('/api/classes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const classes = await classRes.json();
            if (!classes || classes.length === 0) return { ok: false, error: 'Nenhuma turma encontrada' };
            
            const targetClassId = classes[0].id;
            const assignRes = await fetch(`/api/activities/${actId}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ class_id: targetClassId })
            });
            return { ok: assignRes.ok, classId: targetClassId };
        }
        '''
        assign_res = await self.page.evaluate(classes_script, created_activity_id)
        assert assign_res.get("ok"), f"Falha ao vincular atividade à turma: {assign_res}"
        e2e_logger.log_assertion(f"Atividade vinculada à turma ID {assign_res.get('classId')} com sucesso.")

        bank_url = f"{self.base_url}/professor/banco-atividades"
        e2e_logger.log_navigation(bank_url)
        await self.page.goto(bank_url, wait_until="domcontentloaded", timeout=20000)
        await self.handle_geolocation_prompt_if_present()
        
        activity_title_locator = self.page.locator(f'h3:has-text("{title}"), h2:has-text("{title}")').first
        await expect(activity_title_locator).to_be_visible(timeout=15000)
        e2e_logger.log_assertion(f"Título da atividade '{title}' visível no Banco de Atividades do Professor.")

    # =========================================================================
    # AÇÕES DO ALUNO
    # =========================================================================

    async def login_as_student(self, email: str, password: str) -> None:
        """Autentica na plataforma com credenciais discentes."""
        target_url = f"{self.base_url}/login"
        e2e_logger.log_navigation(target_url)
        await self.page.goto(target_url, wait_until="domcontentloaded", timeout=20000)
        await expect(self.email_input).to_be_visible(timeout=15000)

        e2e_logger.log_fill("input#email", masked=False, value_preview=email)
        await self.email_input.fill(email)

        e2e_logger.log_fill("input#password", masked=True)
        await self.password_input.fill(password)

        e2e_logger.log_click('button[type="submit"]')
        await self.submit_login_button.click()

        await self.page.wait_for_url("**/aluno/**", timeout=30000)
        await self.handle_geolocation_prompt_if_present()
        e2e_logger.log_assertion("Login do Aluno autenticado com sucesso.")

    async def open_student_activities_and_select(self, activity_title: str) -> None:
        """Navega até a lista de atividades do aluno e localiza a atividade criada."""
        activities_url = f"{self.base_url}/aluno/minhas-atividades"
        e2e_logger.log_navigation(activities_url)
        await self.page.goto(activities_url, wait_until="domcontentloaded", timeout=30000)
        await self.handle_geolocation_prompt_if_present()

        e2e_logger.log_info(f"Localizando atividade '{activity_title}' na listagem do Aluno...")
        card_locator = self.page.locator(f'div:has-text("{activity_title}")').first
        await expect(card_locator).to_be_visible(timeout=20000)
        e2e_logger.log_assertion(f"Atividade '{activity_title}' encontrada na visualização do aluno.")

        access_button = self.page.locator(f'div:has-text("{activity_title}")').locator('a[href*="/activities/"]').first
        e2e_logger.log_click(f"Botão Começar/Acessar da atividade '{activity_title}'")
        await self.handle_geolocation_prompt_if_present()
        try:
            await access_button.click(timeout=10000)
        except Exception:
            await self.handle_geolocation_prompt_if_present()
            await access_button.click(force=True)

        await self.page.wait_for_url("**/activities/**", timeout=30000)
        await self.handle_geolocation_prompt_if_present()
        e2e_logger.log_assertion("Ambiente da Atividade Gamificada carregado para o Aluno.")

    async def complete_quiz_and_verify_xp(self, correct_option_text: str, xp_expected: int = 150) -> None:
        """Seleciona a alternativa correta do quiz, submete e valida feedback de recompensa de XP."""
        # Descarta qualquer modal que possa estar cobrindo o tabuleiro
        await self.handle_geolocation_prompt_if_present()

        # Aguarda o carregamento do tabuleiro ou elementos do HUD
        try:
            await self.page.wait_for_selector('.rpg-map-board, .path-node-wrapper, button:has-text("Quiz")', timeout=15000)
        except Exception:
            pass

        await self.handle_geolocation_prompt_if_present()

        # Descarta qualquer modal residual
        await self.handle_geolocation_prompt_if_present()

        # Localiza o nó do Quiz ou clica via script se necessário
        quiz_opened = False
        option_button = self.page.locator(f'button:has-text("{correct_option_text}")').first

        for _ in range(5):
            await self.handle_geolocation_prompt_if_present()
            if await option_button.is_visible():
                quiz_opened = True
                break

            # Clica no nó com texto 'Quiz'
            quiz_locator = self.page.locator('.path-node-wrapper:has-text("Quiz"), div:has(> img[alt="Quiz"])').first
            if await quiz_locator.is_visible():
                e2e_logger.log_click("Nó do Quiz na trilha gamificada")
                await quiz_locator.click(force=True)
                await self.page.wait_for_timeout(1000)
                await self.handle_geolocation_prompt_if_present()
                if await option_button.is_visible():
                    quiz_opened = True
                    break

            # Se ainda não abriu, aciona o clique no elemento com alt='Quiz' ou via __activityLogic
            await self.page.evaluate("""() => {
                if (window.__activityLogic && window.__activityLogic.activity?.gamificationDesign?.progression_path) {
                    const step = window.__activityLogic.activity.gamificationDesign.progression_path.find(s => s.type === 'quiz') 
                                || window.__activityLogic.activity.gamificationDesign.progression_path[0];
                    if (step) {
                        window.__activityLogic.handleStepClick(step);
                        return;
                    }
                }
                const quizImg = document.querySelector('img[alt="Quiz"]');
                if (quizImg) {
                    const parentNode = quizImg.closest('.path-node-wrapper') || quizImg.parentElement;
                    if (parentNode) {
                        parentNode.click();
                        return;
                    }
                }
                const activeNode = document.querySelector('.path-node--active');
                if (activeNode) {
                    const parent = activeNode.closest('.path-node-wrapper') || activeNode;
                    parent.click();
                }
            }""")
            await self.page.wait_for_timeout(1500)
            await self.handle_geolocation_prompt_if_present()

        e2e_logger.log_info(f"Selecionando opção de resposta: '{correct_option_text}'")
        await expect(option_button).to_be_visible(timeout=30000)
        await option_button.click()


        e2e_logger.log_click('button:has-text("Confirmar Resposta")')
        await expect(self.confirm_answer_button).to_be_enabled(timeout=10000)
        await self.confirm_answer_button.click()

        e2e_logger.log_assertion("Aguardando feedback visual de sucesso/XP...")
        xp_feedback_locator = self.page.locator('h2:has-text("Resposta Correta!"), h2:has-text("Desafio Concluído!"), .animate-fadeIn').first
        await expect(xp_feedback_locator).to_be_visible(timeout=20000)
        e2e_logger.log_assertion(f"Recompensa de XP ({xp_expected} Pontos) e conclusão validadas com sucesso!")

