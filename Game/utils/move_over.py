from move_verification import playable_vertices

"""
Vérifie si le jeu est terminé en fonction de la chaîne en argument
"""
def is_game_over(chain):
    if len(playable_vertices(chain)) == 0:
        return True
    return False