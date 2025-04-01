from move_verification import parse_boundaries, get_vertex_degrees, is_valid_move,playable_vertices
#from move_generator import generate_possible_moves, encode_to_chain

# Exemple move_verification.py, is_valid_move
chain = "AL.}AL.BNMCMN.}MC.}!"
chain_old = "A.BNMCMN.}MC.}!" #possible chaine avant 1
chain_old2 = "AL.}AL.B.MC.}MC.}!" #possible chaine avant 2

#print(is_valid_move(chain_old, chain))


#chain = "AL.BNMCMN.}MC}!"
#moves = generate_possible_moves(chain)

#for i, m in enumerate(moves):
#    print(f"Move {i+1}: {m}")

print("\n\n\n")

chain_doc = "AL.}AL.BNMCMN.}D.COFPGQFOCM.}E.HRISJSIUKTKUIR.FQGP.}KT.}!"

#BOUNDARIES
boundaries = parse_boundaries(chain_doc)

print("Frontières détectées :")
for i, boundary in enumerate(boundaries):
    print(f"Frontière {i+1}: {boundary}")

#DEGREES
degree = get_vertex_degrees(chain_doc)

print("\nDegrés des sommets :")
for v, d in degree.items():
    print(f"  {v} : {d}")

#PLAYABLE VERTICES
print("\nSommets jouables (degré < 3) :")
print(playable_vertices(chain_doc))