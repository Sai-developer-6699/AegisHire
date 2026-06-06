"""
Database utilities for multi-database support.
"""

import os
from django.conf import settings
from django.db import connections
from django.core.management import execute_from_command_line

def get_current_db_info():
    """
    Get information about the current database connection.
    """
    db_type = os.getenv('DB_TYPE', 'local').lower()
    
    if db_type == 'company':
        return {
            'type': 'company',
            'name': os.getenv('COMPANY_DB_NAME', 'company_recruitment'),
            'host': os.getenv('COMPANY_DB_HOST', 'company-server.com'),
            'port': os.getenv('COMPANY_DB_PORT', '3306'),
        }
    else:
        return {
            'type': 'local',
            'name': os.getenv('LOCAL_DB_NAME', 'recruitment'),
            'host': os.getenv('LOCAL_DB_HOST', 'localhost'),
            'port': os.getenv('LOCAL_DB_PORT', '3306'),
        }

def test_database_connection():
    """
    Test the current database connection.
    """
    try:
        with connections['default'].cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            return True, "Database connection successful"
    except Exception as e:
        return False, f"Database connection failed: {str(e)}"

def run_migrations():
    """
    Run migrations on the current database.
    """
    try:
        execute_from_command_line(['manage.py', 'migrate'])
        return True, "Migrations completed successfully"
    except Exception as e:
        return False, f"Migration failed: {str(e)}"

def create_superuser(username, email, password):
    """
    Create a superuser in the current database.
    """
    try:
        execute_from_command_line([
            'manage.py', 'createsuperuser',
            '--username', username,
            '--email', email,
            '--noinput'
        ])
        return True, f"Superuser {username} created successfully"
    except Exception as e:
        return False, f"Superuser creation failed: {str(e)}" 