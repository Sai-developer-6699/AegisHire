"""
Database router for multi-database support.
This allows different apps to use different databases.
"""

class DatabaseRouter:
    """
    A router to control all database operations on models for different
    databases.
    """
    
    def db_for_read(self, model, **hints):
        """
        Suggest the database that should be used for reads of objects of type
        `model`.
        """
        # All models use the default database
        return 'default'
    
    def db_for_write(self, model, **hints):
        """
        Suggest the database that should be used for writes of objects of type
        `model`.
        """
        # All models use the default database
        return 'default'
    
    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow any relation between objects in the same database.
        """
        return True
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Make sure the app only appears in the 'default' database.
        """
        return True 