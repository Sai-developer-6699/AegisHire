"""
Management command to switch between local and company databases.
Usage: python manage.py switch_db [local|company]
"""

from django.core.management.base import BaseCommand
import os
import re

class Command(BaseCommand):
    help = 'Switch between local and company database configurations'

    def add_arguments(self, parser):
        parser.add_argument(
            'database_type',
            type=str,
            choices=['local', 'company'],
            help='Database type to switch to (local or company)'
        )

    def handle(self, *args, **options):
        db_type = options['database_type']
        env_file = '.env'
        
        if not os.path.exists(env_file):
            self.stdout.write(
                self.style.ERROR(f'Environment file {env_file} not found!')
            )
            return
        
        # Read current .env file
        with open(env_file, 'r') as f:
            content = f.read()
        
        # Update DB_TYPE
        if 'DB_TYPE=' in content:
            # Replace existing DB_TYPE
            content = re.sub(r'DB_TYPE=.*', f'DB_TYPE={db_type}', content)
        else:
            # Add DB_TYPE if it doesn't exist
            content += f'\nDB_TYPE={db_type}\n'
        
        # Write back to .env file
        with open(env_file, 'w') as f:
            f.write(content)
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully switched to {db_type} database configuration!')
        )
        self.stdout.write(
            self.style.WARNING('Remember to restart your Django server for changes to take effect.')
        ) 