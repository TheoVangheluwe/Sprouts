from move_verification import playable_vertices, parse_regions, parse_boundaries, get_vertex_degrees

"""
Vérifie si le jeu est terminé en fonction de la chaîne en argument
"""
def is_game_over(chain):
    regions = parse_regions(chain) 
    all_degrees = get_vertex_degrees(chain)
    
    #on regarde dans chaque région s'il y a un coup possible, 2 cas
    # 1. il y a au moins un point de degré = 1 ou 0, self loop jouable
    # 2. il y a au moins 2 points de degré <= 2, on peu jouer un coup

    for region in regions:
        region_degrees = {v: all_degrees[v] for v in region if v in all_degrees}

        #cas 1
        low_degree_points = [v for v, d in region_degrees.items() if d <= 1]
        if low_degree_points:
            return False

        #cas 2
        playable_points = [v for v, d in region_degrees.items() if d <= 2]
        if len(playable_points) >= 2:
            return False

    return True #rien n'est jouable

