from move_verification import parse_chain, get_vertex_degrees, is_valid_move,analyze_vertices,playable_vertices
from move_generator import generate_possible_moves, encode_to_chain

# Exemple move_verification.py, is_valid_move
chain = "AL.}AL.BNMCMN.}MC.}!"
chain_old2 = "A.BNMCMN.}MC.}!"
chain_old = "AL.}AL.B.MC.}MC.}!"

#print(is_valid_move(chain_old, chain))

#some subtests
#regions = parse_chain(chain)
#print("Structure détectée :")
#for i, region in enumerate(regions):
#    print(f"Région {i+1}:")
#    for boundary in region:
#        print("  -", boundary)
#degree = analyze_vertices(regions)
#print("\nDegrés des sommets :")
#for v, d in degree.items():
#    print(f"  {v} : {d}")
#print("\nSommets jouables (degré < 3) :")
#print(playable_vertices(degree))


chain = "AL.BNMCMN.}MC}!"
moves = generate_possible_moves(chain)

for i, m in enumerate(moves):
    print(f"Move {i+1}: {m}")

print("\n\n\n")

chain_doc = "AL.}AL.BNMCMN.}D.COFPGQFOCM.}E.HRISJSIUKTKUIR.FQGP.}KT.}!"

regions = parse_chain(chain_doc)
print("Structure détectée :")
for i, region in enumerate(regions):
    print(f"Région {i+1}:")
    for boundary in region:
        print("  -", boundary)
degree = analyze_vertices(regions)
print("\nDegrés des sommets :")
for v, d in degree.items():
    print(f"  {v} : {d}")
print("\nSommets jouables (degré < 3) :")
print(playable_vertices(degree))