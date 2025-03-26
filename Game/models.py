from django.db import models
from django.contrib.auth.models import User

class Game(models.Model):
    STATUS_CHOICES = [
        ('waiting', 'Waiting for players'),
        ('in_progress', 'Game in progress'),
        ('completed', 'Game completed'),
        ('started', 'Started'),  # Ajouté pour correspondre aux choix dans la vue
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    player_count = models.IntegerField(default=0)
    players = models.ManyToManyField(User, related_name='games')

    def __str__(self):
        return f"Game {self.id} - {self.status}"