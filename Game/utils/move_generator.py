from .move_verification import parse_boundaries, parse_regions, get_vertex_degrees, is_valid_move,playable_vertices
import random

"""
Détermine la liste des coups possibles à partir de la chaîne de caractères en argument ("bug" connu, il y a parfois deux fois le même coup dans la liste, pas très important)
"""
def generate_possible_moves(chain):
    free_v_region = [] #free_vertex_region
    plays = [] #liste des coups possibles (2 verteces)
    #boundaries = parse_boundaries(chain)
    regions = parse_regions(chain)
    degree = get_vertex_degrees(chain)

    #parcours de chaque région pour trouver les sommets connectables (degré <= 2)
    for region in regions:
        connectable_vertices = [v for v in region if degree[v] <= 2]
        if len(connectable_vertices) > 1: #s'il y a au moins un sommets connectables
            free_v_region.append(connectable_vertices) #pour les ajouter 

    possible_pairs = [] #liste des paires de deux sommets différents connectables
    for region_vertices in free_v_region:
        for i in range(len(region_vertices)):
            for j in range(i + 1, len(region_vertices)):
                possible_pairs.append((region_vertices[i], region_vertices[j]))
    plays = possible_pairs #ajout des paires de sommets connectables à la liste des coups possibles

    # Add vertices with degree 1 or 0 to the list of possible plays
    possible_selfloops = []
    for region in regions:
        for vertex in region:
            if degree[vertex] <= 1:
                possible_selfloops.append((vertex,vertex))
    plays.extend(possible_selfloops) #ajout des sommets de degré 1 ou 0 à la liste des coups possibles en tant que 'self-loop'

    #if plays:
    #    return [random.choice(plays)]
    return plays

"""
Choisi un coup possible entre deux sprouts à partir de la chaîne de caractères en argument et de generate_possible_moves
"""
def choose_move(chain):
    possible_moves = generate_possible_moves(chain) #liste des coups possibles
    if possible_moves:
        return random.choice(possible_moves) #choix aléatoire d'un coup parmi la liste des coups possibles
    else:
        return None #aucun coup possible