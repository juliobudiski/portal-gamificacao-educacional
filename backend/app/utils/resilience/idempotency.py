"""
Middleware/Decorator de Idempotência de Requisições (Idempotency-Key)
Garante que requisições idênticas recebidas repetidamente (duplo clique, retries de rede)
retornem exatamente o mesmo resultado anterior sem reprocessar mutações críticas no banco.
"""

import functools
import time
import json
from typing import Optional, Dict, Any
from flask import request, jsonify, make_response, Response

# Armazenamento em memória com suporte a expiração (TTL)
# Em clusters distribuídos com múltiplos nós pode ser substituído por Redis
_IDEMPOTENCY_CACHE: Dict[str, Dict[str, Any]] = {}

def idempotent(ttl_seconds: int = 300, header_name: str = "Idempotency-Key"):
    """
    Decorator para endpoints mutáveis (POST, PUT, PATCH).
    Lê o cabeçalho 'Idempotency-Key' ou 'X-Idempotency-Key'.
    """
    def decorator(f):
        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            key = request.headers.get(header_name) or request.headers.get(f"X-{header_name}")
            
            # Se a requisição não fornecer o cabeçalho, processa normalmente
            if not key:
                return f(*args, **kwargs)

            now = time.time()
            cached_entry = _IDEMPOTENCY_CACHE.get(key)

            # Verifica cache existente e não expirado
            if cached_entry:
                if now < cached_entry['expires_at']:
                    if cached_entry['status'] == 'PROCESSING':
                        return jsonify({"message": "Requisição em processamento concorrente com esta chave de idempotência."}), 409
                    
                    # Replay da resposta gravada
                    resp = make_response(cached_entry['body'], cached_entry['status_code'])
                    for h_key, h_val in cached_entry.get('headers', {}).items():
                        resp.headers[h_key] = h_val
                    resp.headers['X-Idempotent-Replay'] = 'true'
                    return resp
                else:
                    # Chave expirada: remove do cache
                    _IDEMPOTENCY_CACHE.pop(key, None)

            # Marca como em processamento para prevenir race condition
            _IDEMPOTENCY_CACHE[key] = {
                'status': 'PROCESSING',
                'created_at': now,
                'expires_at': now + ttl_seconds
            }

            try:
                result = f(*args, **kwargs)
                response = make_response(result)

                # Captura corpo, status e headers
                headers_to_cache = {
                    'Content-Type': response.headers.get('Content-Type', 'application/json')
                }
                _IDEMPOTENCY_CACHE[key] = {
                    'status': 'COMPLETED',
                    'status_code': response.status_code,
                    'body': response.get_data(as_text=True),
                    'headers': headers_to_cache,
                    'created_at': now,
                    'expires_at': now + ttl_seconds
                }

                response.headers['X-Idempotent-Replay'] = 'false'
                return response
            except Exception as e:
                # Em caso de falha não tratada, libera a chave
                _IDEMPOTENCY_CACHE.pop(key, None)
                raise e

        return wrapper
    return decorator

def clear_idempotency_cache():
    """Limpa o cache de idempotência (útil para testes)."""
    _IDEMPOTENCY_CACHE.clear()
