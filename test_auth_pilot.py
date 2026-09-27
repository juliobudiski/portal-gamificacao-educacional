"""
Teste Funcional E2E: Piloto de Autenticação e Carregamento do Dashboard de Turmas.
Conecta o Page Object Model, o Logger estruturado e o Cache de Estado Incremental.
"""

import os
import pytest
from playwright.async_api import async_playwright
from test_cache import TestStateCache
from logger import e2e_logger
from pages.auth_dashboard_page import AuthDashboardPage

FEATURE_ID = "auth_pilot_teacher_login_to_classes"
BASE_URL = os.getenv("E2E_BASE_URL", "https://portalgamificaedu.vercel.app")
TEACHER_EMAIL = os.getenv("E2E_TEACHER_EMAIL", "professor@gamificaedu.com")
TEACHER_PASSWORD = os.getenv("E2E_TEACHER_PASSWORD", "Professor123!")


@pytest.mark.asyncio
async def test_teacher_login_to_classes_dashboard():
    """
    Executa o fluxo E2E:
    1. Verifica no TestStateCache se a funcionalidade já foi aprovada (skip incremental).
    2. Inicializa o Playwright em modo headless.
    3. Navega até a página de login.
    4. Realiza autenticação com credenciais docentes.
    5. Assegura o carregamento do Dashboard de Gerenciamento de Turmas.
    6. Atualiza o cache com status 'passed' (ou 'failed' com screenshot em caso de erro).
    """
    cache = TestStateCache(cache_file="test_state.json", skip_passed=True)

    if cache.should_skip(FEATURE_ID):
        e2e_logger.log_info(f"Pulando execução do teste '{FEATURE_ID}' (já aprovado no cache).")
        pytest.skip(f"Feature '{FEATURE_ID}' já aprovada anteriormente.")

    e2e_logger.log_info(f"Iniciando execução do teste E2E: {FEATURE_ID}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="GamificaEdu-E2E-Pilot/1.0"
        )
        page = await context.new_page()
        auth_page = AuthDashboardPage(page=page, base_url=BASE_URL)

        try:
            # 1. Navegação para Login
            await auth_page.navigate_to_login()

            # 2. Execução do Login
            await auth_page.login(email=TEACHER_EMAIL, password=TEACHER_PASSWORD)

            # 3. Transição para o Dashboard
            await auth_page.wait_for_teacher_dashboard_or_classes()

            # 4. Asserções no Dashboard de Turmas
            await auth_page.assert_class_management_loaded()

            # 5. Registro de Sucesso no Cache
            cache.record_result(FEATURE_ID, "passed", details={"base_url": BASE_URL, "user": TEACHER_EMAIL})
            e2e_logger.log_info(f"Teste '{FEATURE_ID}' finalizado e gravado como 'passed' com sucesso.")

        except Exception as exc:
            # Captura de erro com screenshot e registro de falha no cache
            screenshot_file = await e2e_logger.log_error_with_screenshot(page, FEATURE_ID, exc)
            cache.record_result(
                FEATURE_ID,
                "failed",
                details={
                    "base_url": BASE_URL,
                    "error": str(exc),
                    "screenshot": screenshot_file
                }
            )
            raise exc

        finally:
            await context.close()
            await browser.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_teacher_login_to_classes_dashboard())
