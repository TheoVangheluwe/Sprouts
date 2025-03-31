from collections import defaultdict

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

def get_vertex_degrees(boundaries):
    degree = defaultdict(int)
    appearance_count = defaultdict(int)
    single_vertex_boundaries = set()

    forbidden = {'.', '}', '!'}

    for boundary in boundaries:
        for v in boundary:
            if v in forbidden:
                continue
            appearance_count[v] += 1
        if len(boundary) == 1 and boundary[0] not in forbidden:
            single_vertex_boundaries.add(boundary[0])

    for v, count in appearance_count.items():
        if count == 1 and v in single_vertex_boundaries:
            degree[v] = 0
        else:
            degree[v] = count

    return degree

def playable_vertices(degree):
    return [v for v, d in degree.items() if d < 3]

def is_valid_move(old_chain, new_chain):
    old_boundaries = parse_boundaries(old_chain)
    new_boundaries = parse_boundaries(new_chain)

    old_degrees = get_vertex_degrees(old_boundaries)
    new_degrees = get_vertex_degrees(new_boundaries)

    old_vertices = set(old_degrees.keys())
    new_vertices = set(new_degrees.keys())

    added_vertices = new_vertices - old_vertices
    if len(added_vertices) != 1:
        print("Plus d’un nouveau sommet ou aucun n’a été ajouté.")
        return False

    new_vertex = list(added_vertices)[0]

    if new_degrees[new_vertex] != 2:
        print("Le nouveau sommet n’a pas exactement 2 connexions.")
        return False

    old_degree_sum = sum(old_degrees.values())
    new_degree_sum = sum(new_degrees.values())
    if new_degree_sum != old_degree_sum + 4:
        print(f"La somme des degrés des sommets n'est pas correcte : {new_degree_sum} != {old_degree_sum} + 4.")
        return False

    for v in old_vertices:
        if new_degrees[v] > 3:
            print(f"Le sommet {v} dépasse 3 connexions ({new_degrees[v]}).")
            return False

    return True
