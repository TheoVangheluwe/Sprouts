from django.db import models
from django.contrib.auth.models import User

class Game(models.Model):
    status = models.CharField(max_length=20, default='waiting')
    state = models.JSONField(default=dict)  # Stocke l'état du jeu
    current_player = models.ForeignKey(User, related_name='current_games', on_delete=models.CASCADE, default=1)
    player_count = models.IntegerField(default=0)
    players = models.ManyToManyField(User, related_name='games')
    player_ready = models.JSONField(default=dict)  # {player_id: True/False}
    curves = models.JSONField(default=list)  # Stocke les courbes sous forme de liste

    def is_ready(self):
        return all(self.player_ready.values())
