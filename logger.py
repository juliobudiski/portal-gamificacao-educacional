"""
Módulo de Registro Estruturado (Logger) para Testes E2E.
Fornece logs formatados em tempo real com timestamp em console e arquivo de saída,
além de capturas de tela (screenshots) automáticas em caso de erro ou inspeção.
"""

import os
import sys
import logging
from datetime import datetime
from typing import Optional
from playwright.async_api import Page


class E2ELogger:
    """
    Logger especializado para automações Playwright.

    Gerencia:
    - Gravação contínua em arquivo e stdout com formato padronizado [DATA HORA] [NÍVEL] Mensagem.
    - Capturas de tela organizadas no diretório de artefatos.
    """

    def __init__(self, log_file: str = "e2e_execution.log", screenshots_dir: str = "screenshots"):
        self.log_file = log_file
        self.screenshots_dir = screenshots_dir
        os.makedirs(self.screenshots_dir, exist_ok=True)

        self.logger = logging.getLogger("GamificaEdu_E2E")
        self.logger.setLevel(logging.DEBUG)
        self.logger.handlers.clear()

        log_format = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )

        file_handler = logging.FileHandler(self.log_file, mode="a", encoding="utf-8")
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(log_format)
        self.logger.addHandler(file_handler)

        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(log_format)
        self.logger.addHandler(console_handler)

    def log_navigation(self, url: str) -> None:
        """Registra início ou conclusão de navegação para uma URL."""
        self.logger.info(f"[NAVEGAÇÃO] Acessando URL: {url}")

    def log_click(self, selector_or_label: str) -> None:
        """Registra intenção de clique em um elemento da página."""
        self.logger.info(f"[CLIQUE] Clicando no elemento: {selector_or_label}")

    def log_fill(self, selector_or_label: str, masked: bool = False, value_preview: str = "") -> None:
        """Registra o preenchimento de campo de entrada, mascarando senhas."""
        content = "********" if masked else value_preview
        self.logger.info(f"[PREENCHIMENTO] Campo '{selector_or_label}' preenchido com: {content}")

    def log_assertion(self, description: str) -> None:
        """Registra validação/asserção executada com sucesso."""
        self.logger.info(f"[ASSERÇÃO] Validação realizada: {description}")

    def log_info(self, message: str) -> None:
        """Registra mensagem informativa geral."""
        self.logger.info(f"[INFO] {message}")

    def log_warning(self, message: str) -> None:
        """Registra alerta de execução."""
        self.logger.warning(f"[ALERTA] {message}")

    async def log_error_with_screenshot(self, page: Optional[Page], action_name: str, error: Exception) -> str:
        """
        Registra o erro crítico com traceback e salva uma captura de tela do estado visual da página.

        Args:
            page (Optional[Page]): Objeto Page do Playwright ativo.
            action_name (str): Identificador da etapa que falhou.
            error (Exception): Objeto de exceção capturado.

        Returns:
            str: Caminho do arquivo de screenshot gerado (ou vazio se indisponível).
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        sanitized_action = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in action_name)
        screenshot_path = os.path.join(self.screenshots_dir, f"error_{sanitized_action}_{timestamp}.png")

        self.logger.error(f"[ERRO] Falha durante a etapa '{action_name}': {str(error)}", exc_info=True)

        if page:
            try:
                await page.screenshot(path=screenshot_path, full_page=True)
                self.logger.info(f"[SCREENSHOT] Captura de tela salva em: {screenshot_path}")
                return screenshot_path
            except Exception as ss_err:
                self.logger.warning(f"[SCREENSHOT] Não foi possível capturar a tela: {ss_err}")
        return ""


# Instância padrão compartilhada
e2e_logger = E2ELogger()
