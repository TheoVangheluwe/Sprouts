from collections import defaultdict

from collections import defaultdict

def parse_chain(chain):
    regions = []
    region = []
    boundary = []
    current_word = ""

    for char in chain:
        if char.isalnum():
            current_word += char
        elif char == '.':
            if current_word:
                boundary.extend(list(current_word))
                current_word = ""
            region.append(boundary)
            boundary = []
        elif char == '}':
            if current_word:
                boundary.extend(list(current_word))
                current_word = ""
            if boundary:
                region.append(boundary)
                boundary = []
        elif char == '!':
            if region:
                regions.append(region)
                region = []

    return regions

def analyze_vertices(regions):
    degree = defaultdict(int)

    for region in regions:
        for boundary in region:
            for vertex in boundary:
                degree[vertex] += 1  # approximation du degré
    return degree

def playable_vertices(degree):
    return [v for v, d in degree.items() if d < 3]

def get_vertex_degrees(regions):
    degree = defaultdict(int)
    appearance_count = defaultdict(int)
    single_vertex_boundaries = set()

    for region in regions:
        for boundary in region:
            for v in boundary:
                appearance_count[v] += 1
            # si la frontière est composée d’un seul sommet → il est peut-être isolé
            if len(boundary) == 1:
                single_vertex_boundaries.add(boundary[0])

    for v, count in appearance_count.items():
        if count == 1 and v in single_vertex_boundaries:
            degree[v] = 0  # sommet isolé
        else:
            degree[v] = count

    return degree

def is_valid_move(old_chain, new_chain):
    #setup
    old_regions = parse_chain(old_chain)
    new_regions = parse_chain(new_chain)
    old_degrees = get_vertex_degrees(old_regions)
    new_degrees = get_vertex_degrees(new_regions)
    old_vertices = set(old_degrees.keys())
    new_vertices = set(new_degrees.keys())

    #1. Vérifier qu'un seul nouveau sommet a été ajouté
    added_vertices = new_vertices - old_vertices
    if len(added_vertices) != 1:
        print("Plus d’un nouveau sommet ou aucun n’a été ajouté.")
        return False
    new_vertex = list(added_vertices)[0] #on recup ce nouveau sommet pour plus tard

    #2. Vérifier que le nouveau sommet a exactement 2 connexions
    if new_degrees[new_vertex] != 2:
        print("Le nouveau sommet n’a pas exactement 2 connexions.")
        return False
    
    #3. Vérifier que la somme des degrés des sommets actuels est égale à la somme des degrés des sommets anciens moins 4
    old_degree_sum = sum(old_degrees.values())
    new_degree_sum = sum(new_degrees.values())
    if new_degree_sum != old_degree_sum + 4:
        print(f"La somme des degrés des sommets n'est pas correcte : {new_degree_sum} != {old_degree_sum} + 4.")
        return False

    #3. Vérifier qu’aucun sommet existant ne dépasse 3 connexions
    for v in old_vertices:
        if new_degrees[v] > 3:
            print(f"Le sommet {v} dépasse 3 connexions ({new_degrees[v]}).")
            return False

    # Vérification OK
    #print("Coup valide selon les règles de base.")
    return True



# Exemple
chain = "AL.}AL.BNMCMN.}MC.}!"
chain_old2 = "A.BNMCMN.}MC.}!"
chain_old = "AL.}AL.B.MC.}MC.}!"

#regions = parse_chain(chain)
#print("➡️ Structure détectée :")
#for i, region in enumerate(regions):
#    print(f"Région {i+1}:")
#    for boundary in region:
#        print("  -", boundary)
#degree = analyze_vertices(regions)
#print("\n📊 Degrés des sommets :")
#for v, d in degree.items():
#    print(f"  {v} : {d}")
#print("\n🟢 Sommets jouables (degré < 3) :")
#print(playable_vertices(degree))


print(is_valid_move(chain_old, chain))