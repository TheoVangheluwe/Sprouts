from django.db import models

class Game(models.Model):
    STATUS_CHOICES = [
        ('waiting', 'Waiting for players'),
        ('in_progress', 'Game in progress'),
        ('completed', 'Game completed'),
    ]
    status = models.CharField(max_length=20, choices=[('waiting', 'Waiting'), ('in_progress', 'In Progress'), ('started', 'Started')])
    player_count = models.IntegerField(default=0)
