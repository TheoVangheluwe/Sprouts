from move_verification import parse_boundaries, parse_regions, get_vertex_degrees, is_valid_move,playable_vertices, is_valid_move2
from move_generator import generate_possible_moves, choose_move
from move_over import is_game_over

chain_doc = "AL.}AL.BNMCMN.}D.COFPGQFOCM.}E.HRISJSIUKTKUIR.FQGP.}KT.}!" #chaine du pdf

"""
Test parse_boundaries
"""
if False:
    boundaries = parse_boundaries(chain_doc)

    print("Frontières détectées :")
    for i, boundary in enumerate(boundaries):
        print(f"Frontière {i+1}: {boundary}")

"""
Test parse_regions
"""
if False:
    regions = parse_regions(chain_doc)

    for i, region in enumerate(regions):
        print(f"Région {i+1}: {region}")

"""
Test get_vertex_degrees
"""
if False:
    degree = get_vertex_degrees(chain_doc)

    print("\nDegrés des sommets :")
    for v, d in degree.items():
        print(f"  {v} : {d}")

"""
Test playable_vertices
"""
if False :
    print("\nSommets jouables (degré < 3) :")
    print(playable_vertices(chain_doc))

"""
Test is_valid_move
"""
chain = "AL.}AL.BNMCMN.}MC.}!"
chain_old = "A.BNMCMN.}MC.}!" #possible chaine avant 1
chain_old2 = "AL.}AL.B.MC.}MC.}!" #possible chaine avant 2
#faire des tests avec des fausses chaines qui isolent chaque module de test de la fct

chain_alt_old = "A.}"
chain_alt = "AB.}AB.}"

if True:
    #print(is_valid_move(chain_alt_old, chain_alt))
    #print(is_valid_move2(chain_alt_old, chain_alt))
    print(is_valid_move2(chain_old2, chain))

"""
Test is_game_over
"""
chain_over = "ABC.}ABC.}AB.}"
chain_not_over = "AL.}AL.BNMCMN.}MC.}!"

if False:
    print(is_game_over(chain_over))

"""
Test generate_possible_moves
"""
if False:
    print("Liste des coups possibles :")
    print(generate_possible_moves(chain_doc))

"""
Test choose_move (dépend de generate_possible_moves)
"""
if False:
    print("Coup choisi :")
    print(choose_move(chain_doc))