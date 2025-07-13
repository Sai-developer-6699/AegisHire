"""
Context processors for injecting configuration into templates.
"""

import os

def api_config(request):
    """
    Inject API configuration into template context.
    """
    return {
        'API_CONFIG': {
            'protocol': os.getenv('API_PROTOCOL', 'http'),
            'host': os.getenv('API_HOST', '127.0.0.1'),
            'port': os.getenv('API_PORT', '8000'),
            'baseUrl': os.getenv('API_BASE_URL', 'http://127.0.0.1:8000'),
        }
    } 