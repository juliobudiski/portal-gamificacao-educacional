"""
Testes Unitários Puros de Domínio e Regras de Gamificação
Executam em sub-milissegundos com isolamento total de I/O.
"""

import pytest
from app.domain.gamification_rules import GamificationRules

class TestGamificationRulesDomain:
    def test_xp_for_level_progression(self):
        """Verifica a curva linear de progressão de níveis."""
        assert GamificationRules.xp_for_level(1) == 100
        assert GamificationRules.xp_for_level(2) == 150
        assert GamificationRules.xp_for_level(3) == 200
        assert GamificationRules.xp_for_level(10) == 550

    def test_xp_for_invalid_level_raises_error(self):
        with pytest.raises(ValueError):
            GamificationRules.xp_for_level(0)

    def test_calculate_level_progression_zero_xp(self):
        """Aluno sem XP deve iniciar no Nível 1 com saldo zero."""
        result = GamificationRules.calculate_level_progression(0)
        assert result["level"] == 1
        assert result["current_level_xp"] == 0
        assert result["xp_for_next_level"] == 100
        assert result["total_xp"] == 0

    def test_calculate_level_progression_level_up(self):
        """100 XP deve subir para o Nível 2."""
        result = GamificationRules.calculate_level_progression(100)
        assert result["level"] == 2
        assert result["current_level_xp"] == 0
        assert result["xp_for_next_level"] == 150

    def test_calculate_level_progression_intermediate_xp(self):
        """130 XP = Nível 2 com 30 XP de saldo e faltam 120 para o Nível 3."""
        result = GamificationRules.calculate_level_progression(130)
        assert result["level"] == 2
        assert result["current_level_xp"] == 30
        assert result["xp_for_next_level"] == 150

    def test_calculate_quiz_score_perfect(self):
        result = GamificationRules.calculate_quiz_score(correct_answers=5, total_questions=5, base_xp=200)
        assert result["percentage"] == 100.0
        assert result["earned_xp"] == 200
        assert result["is_perfect"] is True

    def test_calculate_quiz_score_partial(self):
        result = GamificationRules.calculate_quiz_score(correct_answers=3, total_questions=4, base_xp=100)
        assert result["percentage"] == 75.0
        assert result["earned_xp"] == 75
        assert result["is_perfect"] is False

    def test_calculate_quiz_score_zero_questions(self):
        result = GamificationRules.calculate_quiz_score(correct_answers=0, total_questions=0)
        assert result["percentage"] == 0.0
        assert result["earned_xp"] == 0
        assert result["is_perfect"] is False

    def test_balance_teams_by_xp(self):
        students = [
            {"name": "Alice", "xp": 1000},
            {"name": "Bob", "xp": 800},
            {"name": "Carol", "xp": 600},
            {"name": "Dave", "xp": 400},
        ]
        teams = GamificationRules.balance_teams_by_xp(students, num_teams=2)
        assert len(teams) == 2
        # Team 0: Alice (1000) + Dave (400) = 1400
        # Team 1: Bob (800) + Carol (600) = 1400
        team_0_xp = sum(s["xp"] for s in teams[0])
        team_1_xp = sum(s["xp"] for s in teams[1])
        assert team_0_xp == team_1_xp == 1400
