# Generated by Django 5.1.1 on 2024-10-03 13:04

import reportcreator_api.utils.models
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='TestPluginModel',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created', models.DateTimeField(default=reportcreator_api.utils.models.now, editable=False)),
                ('updated', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=255)),
            ],
            options={
                'ordering': ['-created'],
                'abstract': False,
            },
        ),
    ]
