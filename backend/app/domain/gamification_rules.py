"""
Regras Puras de Gamificação e Domínio Educacional
Lógica isolada sem dependência de banco de dados, contexto HTTP ou bibliotecas externas.
Permite testes unitários ultrarrápidos, determinísticos e com 100% de cobertura.
"""

from typing import Dict, Any, List

class GamificationRules:
    BASE_XP = 100
    LEVEL_STEP_XP = 50

    @classmethod
    def xp_for_level(cls, level: int) -> int:
        """
        Calcula o XP necessário para progredir a partir do nível informado.
        Nível 1: 100 XP
        Nível 2: 150 XP
        Nível 3: 200 XP
        """
        if level < 1:
            raise ValueError("O nível deve ser maior ou igual a 1.")
        return cls.BASE_XP + (level - 1) * cls.LEVEL_STEP_XP

    @classmethod
    def calculate_level_progression(cls, total_xp: int) -> Dict[str, int]:
        """
        Recebe o total acumulado de XP e retorna o nível atual,
        o XP necessário para o próximo nível e o saldo dentro do nível atual.
        """
        if total_xp is None or total_xp < 0:
            total_xp = 0

        level = 1
        xp_needed = cls.xp_for_level(level)
        accumulated_xp = 0

        current_balance = total_xp
        while current_balance >= xp_needed:
            current_balance -= xp_needed
            accumulated_xp += xp_needed
            level += 1
            xp_needed = cls.xp_for_level(level)

        return {
            "level": level,
            "xp_for_next_level": xp_needed,
            "current_level_xp": current_balance,
            "accumulated_xp": accumulated_xp,
            "total_xp": total_xp
        }

    @classmethod
    def calculate_quiz_score(cls, correct_answers: int, total_questions: int, base_xp: int = 100) -> Dict[str, Any]:
        """
        Calcula a nota percentual (0 a 100%) e o XP conquistado proporcionalmente.
        Garante tratamento de borda para questionários sem perguntas.
        """
        if total_questions <= 0:
            return {
                "percentage": 0.0,
                "earned_xp": 0,
                "is_perfect": False
            }

        valid_correct = max(0, min(correct_answers, total_questions))
        percentage = round((valid_correct / total_questions) * 100.0, 2)
        earned_xp = int(round((valid_correct / total_questions) * base_xp))
        is_perfect = (valid_correct == total_questions)

        return {
            "percentage": percentage,
            "earned_xp": earned_xp,
            "is_perfect": is_perfect
        }

    @classmethod
    def balance_teams_by_xp(cls, students: List[Dict[str, Any]], num_teams: int) -> List[List[Dict[str, Any]]]:
        """
        Algoritmo clássico de balanceamento de turmas/equipes (Greedy Partitioning).
        Distribui alunos ordenados por XP decrescente na equipe com menor soma total de XP.
        Garante equilíbrio de forças competitivo.
        """
        if num_teams <= 0:
            raise ValueError("O número de equipes deve ser no mínimo 1.")
        
        teams: List[List[Dict[str, Any]]] = [[] for _ in range(num_teams)]
        team_totals = [0] * num_teams

        # Ordena alunos por XP decrescente
        sorted_students = sorted(students, key=lambda s: s.get('xp', 0), reverse=True)

        for student in sorted_students:
            # Encontra a equipe com menor XP total acumulado
            min_team_idx = team_totals.index(min(team_totals))
            teams[min_team_idx].append(student)
            team_totals[min_team_idx] += student.get('xp', 0)

        return teams
