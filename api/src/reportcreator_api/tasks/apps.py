from django.apps import AppConfig


class TaskConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'reportcreator_api.tasks'

    def ready(self):
        from . import tasks  # noqa
