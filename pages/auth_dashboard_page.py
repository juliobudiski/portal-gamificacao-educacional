"""
Page Object Model (POM): AuthDashboardPage
Modela o fluxo crítico de autenticação do professor até o carregamento
completo e assertivo do Dashboard de Gerenciamento de Turmas.
"""

from playwright.async_api import Page, expect
from logger import e2e_logger


class AuthDashboardPage:
    """
    Representa os fluxos das páginas de Login e Dashboard de Turmas do GamificaEdu.
    """

    def __init__(self, page: Page, base_url: str = "https://portalgamificaedu.vercel.app"):
        self.page = page
        self.base_url = base_url.rstrip("/")

        # Seletores resilientes da página de Login
        self.email_input = page.locator("input#email")
        self.password_input = page.locator("input#password")
        self.submit_button = page.locator('button[type="submit"]')
        self.login_error_banner = page.locator('div[role="alert"]')

        # Seletores resilientes da página de Turmas
        self.classes_heading = page.locator("h1", has_text="Minhas Turmas")
        self.new_class_button = page.locator('a[href="/professor/turmas/nova"]')
        self.classes_grid = page.locator("div.grid")
        self.empty_classes_container = page.locator('h3:has-text("Nenhuma turma encontrada")')
        self.teacher_dashboard_card = page.locator('#tour-dash-classes, a[href="/professor/gerenciar-turmas"]')

    async def navigate_to_login(self) -> None:
        """Navega para a página de login da aplicação de forma resiliente."""
        target_url = f"{self.base_url}/login"
        e2e_logger.log_navigation(target_url)
        await self.page.goto(target_url, wait_until="domcontentloaded", timeout=20000)
        await expect(self.email_input).to_be_visible(timeout=15000)
        e2e_logger.log_assertion("Página de Login renderizada com campo de email visível.")

    async def login(self, email: str, password: str) -> None:
        """
        Preenche os dados de credenciais e submete o formulário de login.

        Args:
            email (str): E-mail do usuário.
            password (str): Senha de acesso.
        """
        e2e_logger.log_fill("input#email", masked=False, value_preview=email)
        await self.email_input.fill(email)

        e2e_logger.log_fill("input#password", masked=True)
        await self.password_input.fill(password)

        e2e_logger.log_click('button[type="submit"]')
        await self.submit_button.click()

    async def wait_for_teacher_dashboard_or_classes(self) -> None:
        """
        Aguarda o redirecionamento para o dashboard do professor ou navega
        diretamente para a área de turmas garantindo persistência da sessão.
        """
        e2e_logger.log_info("Aguardando confirmação de autenticação e redirecionamento...")

        # O fluxo redireciona para /professor/dashboard ou /professor/gerenciar-turmas
        await self.page.wait_for_url("**/professor/**", timeout=20000)
        current_url = self.page.url
        e2e_logger.log_info(f"Redirecionado com sucesso para: {current_url}")

        if "gerenciar-turmas" not in current_url:
            classes_url = f"{self.base_url}/professor/gerenciar-turmas"
            e2e_logger.log_navigation(classes_url)
            await self.page.goto(classes_url, wait_until="domcontentloaded", timeout=20000)

    async def handle_geolocation_prompt_if_present(self) -> None:
        """Descarta o modal de aviso de geolocalização se estiver visível."""
        dismiss_button = self.page.locator('button:has-text("Entendi, Continuar")')
        try:
            if await dismiss_button.is_visible(timeout=3000):
                e2e_logger.log_click('button:has-text("Entendi, Continuar")')
                await dismiss_button.click()
                e2e_logger.log_info("Modal de aviso de localização descartado com sucesso.")
        except Exception:
            pass

    async def assert_class_management_loaded(self) -> None:
        """
        Valida que o gerenciamento de turmas foi totalmente carregado,
        verificando tanto o cabeçalho 'Minhas Turmas' quanto os controles essenciais.
        """
        await self.handle_geolocation_prompt_if_present()

        e2e_logger.log_assertion("Avaliando cabeçalho 'Minhas Turmas'...")
        await expect(self.classes_heading).to_be_visible(timeout=15000)

        # Validação da presença do botão 'Nova Turma' para o professor
        e2e_logger.log_assertion("Avaliando presença do botão 'Nova Turma'...")
        await expect(self.new_class_button).to_be_visible(timeout=10000)

        # Validação do estado: ou possui cards de turmas ou banner informativo de nenhuma turma
        class_cards = self.page.locator('div.group.bg-secondary-bg\\/80, a:has-text("Nova Turma")')
        is_empty_present = await self.empty_classes_container.is_visible()
        cards_count = await self.page.locator('div:has-text("Código de Inscrição")').count()

        assert cards_count > 0 or is_empty_present, (
            "A página de turmas deve exibir ao menos uma turma ativa ou a mensagem de 'Nenhuma turma encontrada'."
        )
        e2e_logger.log_assertion(f"Dashboard de turmas carregado e validado com sucesso ({cards_count} turma(s) encontrada(s)).")
