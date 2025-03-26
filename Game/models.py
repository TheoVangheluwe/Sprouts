from django.db import models
from django.contrib.auth.models import User

class Game(models.Model):
    status = models.CharField(max_length=20, default='waiting')
    player_count = models.IntegerField(default=0)
    players = models.ManyToManyField(User, related_name='games')
    player_ready = models.JSONField(default=dict)  # {player_id: True/False}

    def is_ready(self):
        # Vérifie si tous les joueurs sont prêts
        return all(self.player_ready.values())