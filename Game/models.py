from django.db import models
from django.contrib.auth.models import User

class Game(models.Model):
    player1 = models.ForeignKey(User, related_name='player1_games', on_delete=models.CASCADE)
    player2 = models.ForeignKey(User, related_name='player2_games', on_delete=models.CASCADE)
    state = models.JSONField()  # État du jeu
    created_at = models.DateTimeField(auto_now_add=True)
