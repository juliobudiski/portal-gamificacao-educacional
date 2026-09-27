"""
Módulo de Cache de Estado de Execução de Testes E2E.
Gerencia a persistência em arquivo JSON local (test_state.json) para habilitar
execuções incrementais e evitar re-execuções desnecessárias de testes já aprovados.
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, Optional


class TestStateCache:
    """
    Controlador do cache de execução dos testes E2E.

    Atributos:
        cache_file (str): Caminho para o arquivo JSON de persistência.
        skip_passed (bool): Quando True, indica que testes com status 'passed' devem ser ignorados.
    """
    __test__ = False

    def __init__(self, cache_file: str = "test_state.json", skip_passed: bool = True):
        self.cache_file = cache_file
        self.skip_passed = skip_passed
        self._state: Dict[str, Any] = self._load()

    def _load(self) -> Dict[str, Any]:
        """Carrega os dados do arquivo JSON de cache ou retorna uma estrutura vazia se inexistente."""
        if not os.path.exists(self.cache_file):
            return {}
        try:
            with open(self.cache_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return {}

    def _save(self) -> None:
        """Persiste o dicionário de estado no arquivo JSON local."""
        try:
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(self._state, f, ensure_ascii=False, indent=2)
        except OSError as exc:
            print(f"[TestStateCache] Aviso: Não foi possível salvar o cache em {self.cache_file}: {exc}")

    def should_skip(self, feature_id: str) -> bool:
        """
        Determina se a funcionalidade/teste identificado por feature_id deve ser pulado.

        Args:
            feature_id (str): Identificador único da funcionalidade ou caso de teste.

        Returns:
            bool: True se skip_passed estiver ativo e o último status gravado for 'passed'.
        """
        if not self.skip_passed:
            return False
        feature_data = self._state.get(feature_id)
        if not feature_data:
            return False
        return feature_data.get("status") == "passed"

    def record_result(self, feature_id: str, status: str, details: Optional[Dict[str, Any]] = None) -> None:
        """
        Registra o resultado da execução de um teste no cache local.

        Args:
            feature_id (str): Identificador único do teste/feature.
            status (str): Resultado ('passed', 'failed', 'skipped', etc.).
            details (Optional[Dict[str, Any]]): Metadados adicionais opcionais (duração, erro, etc.).
        """
        now_iso = datetime.now().isoformat()
        entry: Dict[str, Any] = {
            "status": status,
            "updated_at": now_iso
        }
        if details:
            entry["details"] = details
        self._state[feature_id] = entry
        self._save()

    def get_result(self, feature_id: str) -> Optional[Dict[str, Any]]:
        """Retorna o histórico gravado para um determinado feature_id."""
        return self._state.get(feature_id)

    def clear(self) -> None:
        """Limpa todo o cache e remove o arquivo local persistido."""
        self._state = {}
        if os.path.exists(self.cache_file):
            try:
                os.remove(self.cache_file)
            except OSError:
                pass
