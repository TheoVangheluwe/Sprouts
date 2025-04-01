from collections import defaultdict

"""
Découpe la chaîne de caractères en argument en frontières (concept de boundary)
"""
def parse_boundaries(chain):
    boundaries = []
    current_boundary = []

    for char in chain:
        if char.isalnum():
            current_boundary.append(char)
        elif char in {'.', '}'}:
            if current_boundary:
                boundaries.append(current_boundary)
                current_boundary = []
        elif char == '!':
            break  # fin de la position

    return boundaries

"""
Détermine le degré de chaque sommet dans la chaîne de caractères en argument
"""
def get_vertex_degrees(chain): #utilisation modulaire necessitant seulement la chaine (pas comme avant où on prenait le res de parse_boundaries)
    boundaries = parse_boundaries(chain) #modularisation avec fct preced
    degree = defaultdict(int)
    appearance_count = defaultdict(int)
    single_vertex_boundaries = set()

    forbidden = {'.', '}', '!'}

    for boundary in boundaries:
        for v in boundary:
            if v in forbidden: #ignore les "marqueurs" {'.', '}', '!'}
                continue
            appearance_count[v] += 1 #compteur
        if len(boundary) == 1 and boundary[0] not in forbidden: #if : boundary taille == 1 & pas un marqueur : on ajoute le sommet à un set de sommets uniques
            single_vertex_boundaries.add(boundary[0])

    for v, count in appearance_count.items():
        if count == 1 and v in single_vertex_boundaries: #si degre == 1 et sommet unique : on le met à 0 (ambigueté degré 0 et 1)
            degree[v] = 0
        else: #normal
            degree[v] = count

    return degree

#A AMELIORER (voir dans regions si liable)
"""
Détermine les sommets sur lesquels un coup peut être joué (pas très utile en comparaison avec les autres fonctions + complètes)
"""
def playable_vertices(chain):
    degree = get_vertex_degrees(chain)
    return [v for v, d in degree.items() if d < 3]

#NON FINIT
"""
Détermine à partir de deux chaînes de caractères (chaine actuelle et chaine du tour precedent) si le coup est valide ou non
"""
def is_valid_move(old_chain, new_chain):
    old_boundaries = parse_boundaries(old_chain)
    new_boundaries = parse_boundaries(new_chain)

    old_degrees = get_vertex_degrees(old_boundaries)
    new_degrees = get_vertex_degrees(new_boundaries)

    old_vertices = set(old_degrees.keys())
    new_vertices = set(new_degrees.keys())

    #1: Vérification de la présence d’un nouveau sommet 
    added_vertices = new_vertices - old_vertices
    if len(added_vertices) != 1:
        print("Plus d’un nouveau sommet ou aucun n’a été ajouté.")
        return False

    new_vertex = list(added_vertices)[0]

    #2: Vérification du degré (2) du nouveau sommet
    if new_degrees[new_vertex] != 2:
        print("Le nouveau sommet n’a pas exactement 2 connexions.")
        return False

    #3: Vérification de la somme des degrés
    # La somme des degrés doit être égale à la somme des degrés de l'ancien + 4 (1 nouvelle connexion pour chaque ancien sommet (ou 2 pour 1 si self loop) + 2 pour le nouveau sommet)
    old_degree_sum = sum(old_degrees.values())
    new_degree_sum = sum(new_degrees.values())
    if new_degree_sum != old_degree_sum + 4:
        print(f"La somme des degrés des sommets n'est pas correcte : {new_degree_sum} != {old_degree_sum} + 4.")
        return False

    #4: Vérification des degrés de tous les sommets
    for v in old_vertices:
        if new_degrees[v] > 3:
            print(f"Le sommet {v} dépasse 3 connexions ({new_degrees[v]}).")
            return False

    #5 Vérifier que le nouveau coup est valide (connection des sommets valide)

    #5.2 Verifier que le nouveau coup est valide (region) (verif si doit créer nouvelle region ou pas)

    return True
