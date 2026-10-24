"""
Testes Unitários TDD: Anonimização de Nomes no Ranking de Professores (LGPD)
Executável diretamente via python3 para validação imediata e independente.
"""

import unittest
import sys
import os

class TeacherPrivacyNameFormatter:
    """
    Formatador de nomes orientado a objetos para conformidade com a LGPD.
    Exibe o primeiro nome e as iniciais dos sobrenomes (ex: 'Julio Cesar da Silva' -> 'Julio C. S.').
    """
    PREPOSITIONS = {'de', 'da', 'do', 'das', 'dos', 'e'}

    @classmethod
    def format(cls, raw_name: str) -> str:
        if not raw_name or not isinstance(raw_name, str):
            return "Professor Anônimo"
        
        # Limpa espaços extras e quebras
        cleaned = " ".join(raw_name.strip().split())
        if not cleaned:
            return "Professor Anônimo"
        
        tokens = cleaned.split(" ")
        first_name = tokens[0].capitalize()
        
        if len(tokens) == 1:
            return first_name
        
        initials = []
        for token in tokens[1:]:
            lower_token = token.lower()
            if lower_token in cls.PREPOSITIONS:
                continue
            char = token[0].upper()
            if char.isalnum():
                initials.append(f"{char}.")
        
        if not initials:
            return first_name
            
        return f"{first_name} {' '.join(initials)}"


class TestTeacherPrivacyNameFormatter(unittest.TestCase):
    def test_happy_path_with_multiple_surnames_and_prepositions(self):
        result = TeacherPrivacyNameFormatter.format("Julio Cesar da Silva Budiski")
        self.assertEqual(result, "Julio C. S. B.")

    def test_single_name(self):
        result = TeacherPrivacyNameFormatter.format("Sócrates")
        self.assertEqual(result, "Sócrates")

    def test_name_with_extra_spaces(self):
        result = TeacherPrivacyNameFormatter.format("   Maria   de   Lourdes   dos   Santos   ")
        self.assertEqual(result, "Maria L. S.")

    def test_name_with_two_words(self):
        result = TeacherPrivacyNameFormatter.format("Carlos Drummond")
        self.assertEqual(result, "Carlos D.")

    def test_name_with_only_preposition_after_first_name(self):
        result = TeacherPrivacyNameFormatter.format("João da")
        self.assertEqual(result, "João")

    def test_chaos_monkey_none_value(self):
        result = TeacherPrivacyNameFormatter.format(None)
        self.assertEqual(result, "Professor Anônimo")

    def test_chaos_monkey_empty_string(self):
        result = TeacherPrivacyNameFormatter.format("   ")
        self.assertEqual(result, "Professor Anônimo")

    def test_chaos_monkey_non_string_input(self):
        result = TeacherPrivacyNameFormatter.format(12345)
        self.assertEqual(result, "Professor Anônimo")


if __name__ == '__main__':
    unittest.main()
