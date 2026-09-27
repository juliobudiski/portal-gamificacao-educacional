"""
Teste E2E Completo Otimizado: Ciclo de Vida Multiusuário de Atividade Gamificada.
Integra com TestStateCache para execuções inteligentes e incrementais (economia de tokens/recursos).
"""

import os
import time
import pytest
from playwright.async_api import async_playwright
from test_cache import TestStateCache
from logger import e2e_logger
from pages.gamified_activity_page import GamifiedActivityPage

FEATURE_ID = "e2e_gamification_lifecycle_multiuser"
BASE_URL = os.getenv("E2E_BASE_URL", "http://127.0.0.1:5173")
TEACHER_EMAIL = os.getenv("E2E_TEACHER_EMAIL", "teste9@gmail.com")
TEACHER_PASSWORD = os.getenv("E2E_TEACHER_PASSWORD", "teste9")
STUDENT_EMAIL = os.getenv("E2E_STUDENT_EMAIL", "alunoteste@gmail.com")
STUDENT_PASSWORD = os.getenv("E2E_STUDENT_PASSWORD", "alunoteste")


@pytest.mark.asyncio
async def test_gamification_lifecycle_multiuser():
    """
    Fluxo Inteligente com Cache Incremental:
    1. Verifica cache de aprovação prévia para economizar recursos.
    2. Sessão Professor: login, criação, publicação e vinculação à turma.
    3. Sessão Aluno: login isolado, acesso à atividade, resolução e validação de XP.
    4. Grava aprovação no cache local.
    """
    cache = TestStateCache(cache_file="test_state.json", skip_passed=True)
    if cache.should_skip(FEATURE_ID):
        e2e_logger.log_info(f"Pulando execução do teste '{FEATURE_ID}' (já validado no cache).")
        pytest.skip(f"Feature '{FEATURE_ID}' já aprovada anteriormente.")

    timestamp = int(time.time())
    activity_title = f"Desafio Gamificado SOLID - {timestamp}"
    activity_desc = "Atividade prática de arquitetura e boas práticas com ganho de XP."
    correct_option = "Single Responsibility Principle (SRP)"
    xp_value = 150

    e2e_logger.log_info(f"Iniciando Teste Multiusuário E2E com atividade: '{activity_title}'")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )

        try:
            # =================================================================
            # FASE 1: Sessão do Professor
            # =================================================================
            e2e_logger.log_info("=== [FASE 1] SESSÃO DO PROFESSOR ===")
            teacher_context = await browser.new_context(
                viewport={"width": 1280, "height": 720},
                user_agent="GamificaEdu-Teacher-E2E/1.0"
            )
            teacher_page = await teacher_context.new_page()
            teacher_pom = GamifiedActivityPage(page=teacher_page, base_url=BASE_URL)

            await teacher_pom.login_as_teacher(email=TEACHER_EMAIL, password=TEACHER_PASSWORD)
            await teacher_pom.create_and_publish_gamified_activity(
                title=activity_title,
                description=activity_desc,
                xp_reward=xp_value
            )
            await teacher_context.close()
            e2e_logger.log_info("=== [FASE 1] CONCLUÍDA COM SUCESSO ===")

            # =================================================================
            # FASE 2: Sessão do Aluno (Validação Cruzada)
            # =================================================================
            e2e_logger.log_info("=== [FASE 2] SESSÃO DO ALUNO ===")
            student_context = await browser.new_context(
                viewport={"width": 1280, "height": 720},
                user_agent="GamificaEdu-Student-E2E/1.0"
            )
            student_page = await student_context.new_page()
            student_pom = GamifiedActivityPage(page=student_page, base_url=BASE_URL)

            await student_pom.login_as_student(email=STUDENT_EMAIL, password=STUDENT_PASSWORD)
            await student_pom.open_student_activities_and_select(activity_title=activity_title)
            await student_pom.complete_quiz_and_verify_xp(
                correct_option_text=correct_option,
                xp_expected=xp_value
            )
            await student_context.close()
            e2e_logger.log_info("=== [FASE 2] CONCLUÍDA COM SUCESSO ===")

            # Grava no cache de execução inteligente
            cache.record_result(
                FEATURE_ID,
                "passed",
                details={
                    "base_url": BASE_URL,
                    "activity_title": activity_title,
                    "teacher": TEACHER_EMAIL,
                    "student": STUDENT_EMAIL,
                    "xp_reward": xp_value
                }
            )
            e2e_logger.log_info(f"Ciclo E2E '{FEATURE_ID}' registrado como 'passed' com sucesso.")

        except Exception as exc:
            cache.record_result(FEATURE_ID, "failed", details={"error": str(exc)})
            raise exc
        finally:
            await browser.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_gamification_lifecycle_multiuser())
