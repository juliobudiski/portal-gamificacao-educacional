"""
Pacote de Serviços (Services)
Este pacote contém a camada de regras de negócio da aplicação.
Aqui residem as lógicas complexas de gamificação, IA, validações e integrações,
mantendo os controladores (routes) limpos e focados apenas em receber/enviar HTTP.
"""
from .activity_service import *
from .user_service import *