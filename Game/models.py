from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class QueueEntry(models.Model):
    """Modèle pour les entrées dans la file d'attente globale"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='queue_entries')
    point_preferences = models.JSONField(default=list)  # Points souhaités par le joueur
    ready = models.BooleanField(default=False)
    matched_with = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL,
                                     related_name='matched_by')
    joined_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = "Entrée de file d'attente"
        verbose_name_plural = "Entrées de file d'attente"

    def __str__(self):
        return f"{self.user.username} - {self.point_preferences}"


class Game(models.Model):
    status = models.CharField(max_length=20, default='waiting')
    state = models.JSONField(default=dict)  # Stocke l'état du jeu
    current_player = models.ForeignKey(User, related_name='current_games', on_delete=models.CASCADE, null=True)
    player_count = models.IntegerField(default=0)
    players = models.ManyToManyField(User, related_name='games')
    player_ready = models.JSONField(default=dict)  # {player_id: True/False}
    curves = models.JSONField(default=list)  # Stocke les courbes sous forme de liste
    point_options = models.JSONField(default=list)  # Stocke les options de nombre de points [3, 4, 5, etc.]
    created_at = models.DateTimeField(default=timezone.now)
    # Nouveau champ pour suivre si le jeu a été créé à partir d'une file d'attente
    from_queue = models.BooleanField(default=False)
    # Points sélectionnés pour cette partie (basés sur les préférences communes)
    selected_points = models.IntegerField(null=True, blank=True)
    winner = models.ForeignKey(User, related_name='games_won', on_delete=models.SET_NULL, null=True, blank=True)
    loser = models.ForeignKey(User, related_name='games_lost', on_delete=models.SET_NULL, null=True, blank=True)
    victory_reason = models.CharField(max_length=20, choices=[
        ('normal', 'Victoire normale'),
        ('abandoned', 'Abandon de l\'adversaire')
    ], null=True, blank=True)

    def is_ready(self):
        return all(self.player_ready.values())

    def default_state(self):
        return {"curves": [], "points": []}
