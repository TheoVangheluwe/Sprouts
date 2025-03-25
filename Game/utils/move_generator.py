from move_verification import parse_chain, get_vertex_degrees
from copy import deepcopy
import itertools

def generate_possible_moves(chain, prefix="X"):
    regions = parse_chain(chain)
    degrees = get_vertex_degrees(regions)

    playable = [v for v, d in degrees.items() if d < 3]
    moves = []
    counter = 0

    for region in regions:
        # 1. Construction de la map frontière → sommets
        boundaries = region
        boundary_map = []
        for boundary in boundaries:
            boundary_map.append(set(boundary))

        # 2. Pour chaque paire (v1, v2)
        for v1, v2 in itertools.combinations_with_replacement(playable, 2):
            # on cherche deux frontières distinctes contenant v1 et v2
            valid = False
            for i, b1 in enumerate(boundary_map):
                if v1 not in b1:
                    continue
                for j, b2 in enumerate(boundary_map):
                    if i == j:
                        continue
                    if v2 in b2:
                        valid = True
                        break
                if valid:
                    break

            if not valid:
                continue  # pas de coup possible pour cette paire

            # coup possible
            new_vertex = f"{prefix}{counter}"
            counter += 1

            # 🧬 copie du graphe
            new_region = [list(boundary) for boundary in boundaries]
            new_region.append([v1, new_vertex, v2])

            # recréer toute la structure (liste des régions)
            new_regions = deepcopy(regions)
            new_regions.remove(region)
            new_regions.append(new_region)

            # encoder
            new_chain = encode_to_chain(new_regions)
            moves.append(new_chain)

    return moves

def encode_to_chain(graph_structure):
    chain = ""
    for region in graph_structure:
        for boundary in region:
            chain += "".join(boundary) + ".}"
        chain += "!"
    return chain