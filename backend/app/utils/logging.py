# backend/app/utils/logging.py
import logging

def configure_logging(app):
    app.logger.setLevel(logging.DEBUG)
    handler = logging.StreamHandler()
    handler.setLevel(logging.DEBUG)
    app.logger.addHandler(handler)