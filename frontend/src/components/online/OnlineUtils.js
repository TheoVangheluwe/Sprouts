// Constants pour les dimensions logiques
const LOGICAL_WIDTH = 500;
const LOGICAL_HEIGHT = 500;

// Fonction pour convertir les coordonnées logiques vers les coordonnées physiques
const toPhysicalCoords = (x, y, scale) => {
    return {
        x: x * scale.x,
        y: y * scale.y
    };
};

// Fonction pour convertir les coordonnées physiques vers les coordonnées logiques
const toLogicalCoords = (x, y, scale) => {
    return {
        x: x / scale.x,
        y: y / scale.y
    };
};

export const drawGame = (canvasRef, pointsToDraw = [], curvesToDraw = [], tempCurve = null, scale = null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Calculer l'échelle si elle n'est pas fournie
    if (!scale) {
        scale = {
            x: canvas.width / LOGICAL_WIDTH,
            y: canvas.height / LOGICAL_HEIGHT
        };
    }

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // S'assurer que curvesToDraw est un tableau
    const safeCurves = Array.isArray(curvesToDraw) ? curvesToDraw : [];

    // Dessiner les courbes
    safeCurves.forEach(curve => {
        let pointsToUse = null;

        if (curve && Array.isArray(curve)) {
            pointsToUse = curve;
        } else if (curve && typeof curve === 'object' && Array.isArray(curve.points)) {
            pointsToUse = curve.points;
        }

        if (pointsToUse && pointsToUse.length > 0) {
            ctx.beginPath();
            // Convertir les coordonnées logiques en coordonnées physiques
            const physicalStart = toPhysicalCoords(pointsToUse[0].x, pointsToUse[0].y, scale);
            ctx.moveTo(physicalStart.x, physicalStart.y);

            for (let i = 1; i < pointsToUse.length; i++) {
                const physicalPoint = toPhysicalCoords(pointsToUse[i].x, pointsToUse[i].y, scale);
                ctx.lineTo(physicalPoint.x, physicalPoint.y);
            }
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });

    // S'assurer que pointsToDraw est un tableau
    const safePoints = Array.isArray(pointsToDraw) ? pointsToDraw : [];

    // Dessiner les points
    safePoints.forEach(point => {
        if (point && typeof point.x === 'number' && typeof point.y === 'number') {
            ctx.beginPath();
            // Convertir les coordonnées logiques en coordonnées physiques
            const physicalPoint = toPhysicalCoords(point.x, point.y, scale);
            // Ajuster la taille du cercle en fonction de l'échelle
            const radius = 5 * Math.min(scale.x, scale.y);

            // Changer la couleur en fonction du nombre de connexions
            if (point.connections >= 3) {
                ctx.fillStyle = "red";  // Maximum de connexions atteint
            } else {
                ctx.fillStyle = "black"; // Peut être connecté et faire des boucles
            }

            ctx.arc(physicalPoint.x, physicalPoint.y, radius, 0, Math.PI * 2);
            ctx.fill();

            if (point.label) {
                // Ajuster la taille du texte en fonction de l'échelle
                const fontSize = 12 * Math.min(scale.x, scale.y);
                ctx.font = `${fontSize}px Arial`;
                ctx.fillStyle = "black";
                ctx.fillText(point.label, physicalPoint.x + radius + 5, physicalPoint.y + 5);
            }
        }
    });

    // Dessiner la courbe temporaire
    if (tempCurve && tempCurve.length > 0) {
        ctx.beginPath();
        // Convertir les coordonnées logiques en coordonnées physiques
        const physicalStart = toPhysicalCoords(tempCurve[0].x, tempCurve[0].y, scale);
        ctx.moveTo(physicalStart.x, physicalStart.y);

        for (let i = 1; i < tempCurve.length; i++) {
            const physicalPoint = toPhysicalCoords(tempCurve[i].x, tempCurve[i].y, scale);
            ctx.lineTo(physicalPoint.x, physicalPoint.y);
        }
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
};

export const getMousePos = (canvas, event) => {
    const rect = canvas.getBoundingClientRect();
    const physicalX = event.clientX - rect.left;
    const physicalY = event.clientY - rect.top;

    // Convertir en coordonnées logiques [0,500]×[0,500]
    const scale = {
        x: canvas.width / LOGICAL_WIDTH,
        y: canvas.height / LOGICAL_HEIGHT
    };

    return toLogicalCoords(physicalX, physicalY, scale);
};

export const getNearPoint = (x, y, points, threshold = 15) => {
    return points.find(point => Math.hypot(point.x - x, point.y - y) <= threshold) || null;
};

// Fonction corrigée pour gérer correctement la limite de connexions
export const canConnect = (p1, p2) => {
    // Vérifier si c'est une boucle (même point)
    if (p1.label === p2.label) {
        // Une boucle compte pour 2 connexions sur le même point
        // Donc, un point doit avoir au maximum 1 connexion avant de faire une boucle
        return p1.connections <= 1;
    } else {
        // Pour les connexions entre points différents, limiter à 3 connexions par point
        return p1.connections < 3 && p2.connections < 3;
    }
};

export const connectPoints = (p1, p2, curvePoints, points, setPoints, setCurves) => {
    console.log("Connecting points:", p1, p2);

    // Vérifier s'il s'agit d'une boucle (même point)
    const isSelfLoop = p1.label === p2.label;

    // Update point connections
    let updatedPoints = points.map(point => {
        if (point.label === p1.label && isSelfLoop) {
            // Si c'est une boucle sur le même point, ajouter 2 connexions
            const newConnections = point.connections + 2;
            return {...point, connections: newConnections};
        } else if (point.label === p1.label || point.label === p2.label) {
            // Pour des points différents, ajouter 1 connexion à chacun
            const newConnections = point.connections + 1;
            return {...point, connections: newConnections};
        }
        return point;
    });

    console.log("Updated points: ", updatedPoints);

    // Update points and add the curve
    setPoints(updatedPoints);
    setCurves(prevCurves => {
        const updatedCurves = [...prevCurves, curvePoints];
        console.log("Updated curves: ", updatedCurves);
        return updatedCurves;
    });
};

export const curveLength = (curve) => {
    let length = 0;
    for (let i = 1; i < curve.length; i++) {
        length += Math.hypot(curve[i].x - curve[i - 1].x, curve[i].y - curve[i - 1].y);
    }
    return length;
};


export const segmentsIntersect = (A, B, C, D) => {
    // Fonction pour l'orientation de trois points
    const orientation = (p, q, r) => {
        const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
        return val === 0 ? 0 : (val > 0 ? 1 : -1);
    };

    // Pour vérifier si q est sur le segment pr
    const onSegment = (p, q, r) => {
        return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
            q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
    };

    // Les quatre orientations nécessaires
    const o1 = orientation(A, B, C);
    const o2 = orientation(A, B, D);
    const o3 = orientation(C, D, A);
    const o4 = orientation(C, D, B);

    // Cas général d'intersection
    if (o1 !== o2 && o3 !== o4) {
        return true;
    }

    // Cas spéciaux de colinéarité
    if (o1 === 0 && onSegment(A, C, B)) return true;
    if (o2 === 0 && onSegment(A, D, B)) return true;
    if (o3 === 0 && onSegment(C, A, D)) return true;
    if (o4 === 0 && onSegment(C, B, D)) return true;

    return false;
};


// Fonction de détection d'intersection
export const curveIntersects = (newCurve, curves = [], points) => {
    console.log("Checking intersections for new curve:", newCurve);

    // Si la courbe est invalide ou trop courte, pas d'intersection
    if (!newCurve || newCurve.length < 2) {
        console.log("Curve too short, no intersection check");
        return false;
    }

    // Vérifier si un point est près d'un point officiel
    const isNearOfficialPoint = (point, tolerance = 15) => {
        if (!point || !points || !Array.isArray(points)) return false;

        return points.some(officialPoint => {
            if (!officialPoint) return false;

            const dx = Number(officialPoint.x) - Number(point.x);
            const dy = Number(officialPoint.y) - Number(point.y);
            const distance = Math.sqrt(dx * dx + dy * dy);

            return distance < tolerance;
        });
    };

    // 1. Normaliser toutes les courbes pour s'assurer que les coordonnées sont traitées comme des nombres
    const normalizePoint = (p) => {
        if (!p) return null;
        return {x: Number(p.x), y: Number(p.y), label: p.label};
    };

    const normalizedNewCurve = newCurve.map(normalizePoint).filter(p => p !== null);

    // 2. Vérifier les intersections avec les courbes existantes
    for (let curveIndex = 0; curveIndex < curves.length; curveIndex++) {
        const curve = curves[curveIndex];

        // Extraire et normaliser les points de la courbe
        let curvePoints = [];
        if (Array.isArray(curve)) {
            curvePoints = curve.map(normalizePoint).filter(p => p !== null);
        } else if (curve && typeof curve === 'object' && Array.isArray(curve.points)) {
            curvePoints = curve.points.map(normalizePoint).filter(p => p !== null);
        }

        if (curvePoints.length < 2) continue;

        console.log(`Checking against curve #${curveIndex} with ${curvePoints.length} points`);

        // Vérifier chaque segment de la nouvelle courbe contre chaque segment de la courbe existante
        for (let i = 0; i < normalizedNewCurve.length - 1; i++) {
            const seg1Start = normalizedNewCurve[i];
            const seg1End = normalizedNewCurve[i + 1];

            // Ignorer les segments très courts
            const seg1Length = Math.hypot(seg1End.x - seg1Start.x, seg1End.y - seg1Start.y);
            if (seg1Length < 3) continue;

            for (let j = 0; j < curvePoints.length - 1; j++) {
                const seg2Start = curvePoints[j];
                const seg2End = curvePoints[j + 1];

                // Ignorer les segments très courts
                const seg2Length = Math.hypot(seg2End.x - seg2Start.x, seg2End.y - seg2Start.y);
                if (seg2Length < 3) continue;

                // Vérifier si ce sont des connexions légitimes aux points officiels
                // Une connexion légitime implique un partage de point à une extrémité qui est aussi un point officiel
                const isStartConnection = i === 0 && isNearOfficialPoint(seg1Start);
                const isEndConnection = i === normalizedNewCurve.length - 2 && isNearOfficialPoint(seg1End);

                if ((isStartConnection &&
                        (Math.hypot(seg1Start.x - seg2Start.x, seg1Start.y - seg2Start.y) < 15 ||
                            Math.hypot(seg1Start.x - seg2End.x, seg1Start.y - seg2End.y) < 15)) ||
                    (isEndConnection &&
                        (Math.hypot(seg1End.x - seg2Start.x, seg1End.y - seg2Start.y) < 15 ||
                            Math.hypot(seg1End.x - seg2End.x, seg1End.y - seg2End.y) < 15))) {
                    // Connexion légitime, ignorer
                    continue;
                }

                // Test d'intersection avec notre fonction améliorée
                if (segmentsIntersect(seg1Start, seg1End, seg2Start, seg2End)) {
                    console.log("Intersection detected between segments:",
                        seg1Start, seg1End, "and", seg2Start, seg2End);
                    return true;
                }
            }
        }
    }

    // 3. Vérifier l'auto-intersection de la nouvelle courbe
    for (let i = 0; i < normalizedNewCurve.length - 3; i++) {
        const seg1Start = normalizedNewCurve[i];
        const seg1End = normalizedNewCurve[i + 1];

        // Ignorer les segments très courts
        const seg1Length = Math.hypot(seg1End.x - seg1Start.x, seg1End.y - seg1Start.y);
        if (seg1Length < 3) continue;

        // Vérifier avec les segments non adjacents
        for (let j = i + 2; j < normalizedNewCurve.length - 1; j++) {
            // Cas spécial : Ignorer l'intersection entre le premier et le dernier segment
            // si les deux extrémités sont des points officiels
            if (i === 0 && j === normalizedNewCurve.length - 2) {
                const startPoint = normalizedNewCurve[0];
                const endPoint = normalizedNewCurve[normalizedNewCurve.length - 1];

                if (isNearOfficialPoint(startPoint) && isNearOfficialPoint(endPoint)) {
                    console.log("Legitimate loop between official points, ignoring");
                    continue;
                }
            }

            const seg2Start = normalizedNewCurve[j];
            const seg2End = normalizedNewCurve[j + 1];

            // Ignorer les segments très courts
            const seg2Length = Math.hypot(seg2End.x - seg2Start.x, seg2End.y - seg2Start.y);
            if (seg2Length < 3) continue;

            // Test d'intersection
            if (segmentsIntersect(seg1Start, seg1End, seg2Start, seg2End)) {
                console.log("Self-intersection detected between segments:",
                    seg1Start, seg1End, "and", seg2Start, seg2End);
                return true;
            }
        }
    }

    // 4. Vérifier si la nouvelle courbe passe par un point officiel autre que ses extrémités
    for (let i = 1; i < normalizedNewCurve.length - 1; i++) {
        const point = normalizedNewCurve[i];

        if (isNearOfficialPoint(point)) {
            // Vérifier que ce n'est pas un point d'extrémité
            const startPoint = normalizedNewCurve[0];
            const endPoint = normalizedNewCurve[normalizedNewCurve.length - 1];

            if (Math.hypot(point.x - startPoint.x, point.y - startPoint.y) >= 15 &&
                Math.hypot(point.x - endPoint.x, point.y - endPoint.y) >= 15) {
                console.log("Curve passes through an official point:", point);
                return true;
            }
        }
    }

    console.log("No intersections found");
    return false;
};


export const getNextLabel = (points) => {
    const usedLabels = points.map(point => point.label);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'; // Inclut les lettres majuscules et minuscules

    for (let letter of alphabet) {
        if (!usedLabels.includes(letter)) {
            return letter;
        }
    }
    return ''; // Retourne une chaîne vide si toutes les lettres sont utilisées
};

export const getClosestPointOnCurve = (x, y, curve, tolerance = 15) => {
    let closestPoint = null;
    let minDistance = Infinity;

    for (let i = 0; i < curve.length - 1; i++) {
        const start = curve[i];
        const end = curve[i + 1];
        const projection = getProjection(x, y, start, end);

        if (projection) {
            const distance = Math.hypot(projection.x - x, projection.y - y);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = projection;
            }
        }
    }

    // Return null if the closest point is beyond the tolerance
    if (minDistance > tolerance) {
        return null;
    }

    return closestPoint;
};

export const isPointTooClose = (x, y, points, minDistance = 15) => {
    for (const point of points) {
        const distance = Math.hypot(point.x - x, point.y - y);
        if (distance < minDistance) {
            return true;
        }
    }
    return false;
};

const getProjection = (px, py, p1, p2) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const t = ((px - p1.x) * dx + (py - p1.y) * dy) / (dx * dx + dy * dy);

    if (t < 0) {
        return p1;
    } else if (t > 1) {
        return p2;
    } else {
        return {x: p1.x + t * dx, y: p1.y + t * dy};
    }
};

// Exporter les fonctions de conversion pour les utiliser dans d'autres fichiers
export const getScalingFactor = (canvas) => {
    return {
        x: canvas.width / LOGICAL_WIDTH,
        y: canvas.height / LOGICAL_HEIGHT
    };
};

// Nouvelles fonctions ajoutées pour la gestion des chaînes de caractères

export const updateCurveMap = (curveMap, startPoint, endPoint, newCurve) => {
    // Mettre à jour la courbe pour le point de départ
    const startCurves = curveMap.get(startPoint.label) || [];
    startCurves.push({curve: newCurve, role: 'start'});
    curveMap.set(startPoint.label, startCurves);

    // Mettre à jour la courbe pour le point de fin
    const endCurves = curveMap.get(endPoint.label) || [];
    endCurves.push({curve: newCurve, role: 'end'});
    curveMap.set(endPoint.label, endCurves);

    return curveMap;
};

//Géneration de la chaine de caractère initial
export const generateInitialGraphString = (points) => {
    let initialGraphString = '';

    // Ajouter les points isolés à la chaîne de caractères
    points.forEach(point => {
        initialGraphString += `${point.label}.`;
    });

    // Ajout de la terminaison finale
    initialGraphString += '}!';

    return initialGraphString;
};

export const generateGraphString = (startPoint, addedPoint, endPoint, currentGraphString, curveMap, points) => {
    // Vérifier si les points sont isolés dans la chaîne de caractères actuelle
    const isIsolated = (label, graphString) => {
        const regex = new RegExp(`(^|[.}])${label}\\.`);
        return regex.test(graphString);
    };

    // Identifier les régions existantes dans la chaîne de caractères
    const findRegions = (graphString) => {
        const regionRegex = /(^[^{}]+|[^{}]+)(?=[.}]|$)/g;
        const regions = [];
        let match;
        while ((match = regionRegex.exec(graphString)) !== null) {
            regions.push(match[0]);
        }
        return regions;
    };

    // Identifier les frontières existantes dans la chaîne de caractères
    const findFrontieres = (regions) => {
        const frontiereRegex = /([^.]+)/g;
        const frontieresMap = {};

        regions.forEach(region => {
            const frontieres = [];
            let match;
            while ((match = frontiereRegex.exec(region)) !== null) {
                frontieres.push(match[0]);
            }
            frontieresMap[region] = frontieres;
        });

        return frontieresMap;
    };

    // Vérifier les conditions pour les points
    const startIsIsolated = isIsolated(startPoint.label, currentGraphString);
    const endIsIsolated = isIsolated(endPoint.label, currentGraphString);

    // Cas n°1: Les deux points sont différents et isolés
    if (startIsIsolated && endIsIsolated && (startPoint !== endPoint)) {
        console.log("Cas où les deux points sont différents et isolés");

        // Trouver toutes les régions
        const areas = findRegions(currentGraphString);

        // Trouver la région pertinente
        const relevantArea = areas.filter(area => area.includes(startPoint.label) && area.includes(endPoint.label));

        // Filtrer les régions non pertinentes
        const nonRelevantAreas = areas.filter(area => !area.includes(startPoint.label) && !area.includes(endPoint.label));

        console.log(relevantArea);

        // Trouver toutes les frontières et les extraire en un seul tableau
        const boundaries = Object.values(findFrontieres(relevantArea)).flat();

        // Trouver toutes les frontières non pertinentes
        const nonRelevantBoundaries = boundaries.filter(boundary => !boundary.includes(startPoint.label) && !boundary.includes(endPoint.label));

        // Construire la nouvelle région
        const newBoundarie = `${startPoint.label}${addedPoint.label}${endPoint.label}${addedPoint.label}${nonRelevantBoundaries.length > 0 ? `.${nonRelevantBoundaries.join('.')}` : ''}`;

        // Construire la chaîne de caractères
        const newGraphString = `${newBoundarie}.}${nonRelevantAreas.join('}')}`;

        return newGraphString;
    }
    // Cas n°2: Un point est isolé et l'autre est déjà relié
    else if (startIsIsolated !== endIsIsolated) {
        console.log("Cas où un point est isolé et l'autre non isolé");

        // Détermine le point isolé et le point commun
        const isolatedPoint = startIsIsolated ? startPoint : endPoint;
        const connectedPoint = startIsIsolated ? endPoint : startPoint;

        // Trouver toutes les régions
        const areas = findRegions(currentGraphString);
        console.log("Régions trouvées:", areas);

        // Trouver la région pertinente
        const relevantArea = areas.filter(area => area.includes(isolatedPoint.label));
        console.log("Région pertinente:", relevantArea);

        // Vérifier si la région pertinente existe
        if (!relevantArea || relevantArea.length === 0) {
            console.warn("Aucune région pertinente trouvée pour le point isolé");
            return currentGraphString;
        }

        // Trouver les régions non pertinentes
        const nonRelevantAreas = areas.filter(area => !area.includes(isolatedPoint.label));

        // Trouver toutes les frontières et les extraire en un seul tableau
        const boundariesObj = findFrontieres(relevantArea);
        console.log("Frontières trouvées:", boundariesObj);

        // Vérifier si boundariesObj existe et a des propriétés
        if (!boundariesObj || Object.keys(boundariesObj).length === 0) {
            console.warn("Aucune frontière trouvée");
            // Solution simplifiée: créer une nouvelle chaîne directement
            const mergedRegion = `${isolatedPoint.label}${addedPoint.label}${connectedPoint.label}.}`;
            const newGraphString = `${relevantArea.join('')}${mergedRegion}${nonRelevantAreas.join('}')}`;
            return newGraphString;
        }

        const boundaries = Object.values(boundariesObj).flat();

        // Vérifier si boundaries existe et a des éléments
        if (!boundaries || boundaries.length === 0) {
            console.warn("Aucune frontière n'a été extraite");
            // Solution simplifiée: créer une nouvelle chaîne directement
            const mergedRegion = `${isolatedPoint.label}${addedPoint.label}${connectedPoint.label}.}`;
            const newGraphString = `${relevantArea.join('')}${mergedRegion}${nonRelevantAreas.join('}')}`;
            return newGraphString;
        }

        // Trouver la frontière pertinente
        const relevantBoundarie = boundaries.find(boundary =>
            boundary && typeof boundary === 'string' && boundary.includes && boundary.includes(connectedPoint.label)
        );

        // Vérifier si relevantBoundarie existe
        if (!relevantBoundarie) {
            console.warn("Frontière pertinente non trouvée pour le point connecté");
            // Solution simplifiée: créer une nouvelle chaîne directement
            const mergedRegion = `${isolatedPoint.label}${addedPoint.label}${connectedPoint.label}.}`;
            const newGraphString = `${relevantArea.join('')}${mergedRegion}${nonRelevantAreas.join('}')}`;
            return newGraphString;
        }

        // Trouver les frontières non pertinentes
        const nonRelevantBoundaries = boundaries.filter(boundary =>
            boundary &&
            typeof boundary === 'string' &&
            boundary.includes &&
            !boundary.includes(connectedPoint.label) &&
            !boundary.includes(isolatedPoint.label)
        );

        // Trouver l'index du point commun dans la frontière pertinente
        const insertIndex = relevantBoundarie.indexOf(connectedPoint.label);

        // Vérifier si insertIndex est valide
        if (insertIndex === -1) {
            console.warn("Point connecté non trouvé dans la frontière pertinente");
            // Solution simplifiée: créer une nouvelle chaîne directement
            const mergedRegion = `${isolatedPoint.label}${addedPoint.label}${connectedPoint.label}.}`;
            const newGraphString = `${relevantArea.join('')}${mergedRegion}${nonRelevantAreas.join('}')}`;
            return newGraphString;
        }

        // Construire la nouvelle région
        const newBoundarie = `${relevantBoundarie.slice(0, insertIndex)}${connectedPoint.label}${addedPoint.label}${isolatedPoint.label}${addedPoint.label}${relevantBoundarie.slice(insertIndex)}${nonRelevantBoundaries.length > 0 ? `.${nonRelevantBoundaries.join('.')}` : ''}`;

        // Construire la chaîne de caractères
        const newGraphString = `${newBoundarie}.}${nonRelevantAreas.join('}')}`;

        return newGraphString;
    }
    // Cas n°3: Les deux points sont déjà reliés
    else if (!startIsIsolated && !endIsIsolated && startPoint !== endPoint) {
        console.log("Cas où les deux points sont différents et non isolés");

        let chosenRegion = [];

        // Créer la nouvelle région
        let regionString = `${startPoint.label}${addedPoint.label}${endPoint.label}`;

        // Trouver toutes les régions
        const areas = findRegions(currentGraphString);

        // Trouver la région pertinente
        const relevantArea = areas.filter(area => area.includes(startPoint.label) && area.includes(endPoint.label));

        // Il y a 2 régions pertinentes
        if (relevantArea.length > 1) {
            console.log("Il y a plusieurs régions pertinentes");

            const areAreasIdentical = relevantArea.every(region => region === relevantArea[0]);

            // Les 2 régions pertinentes sont différentes
            if (!areAreasIdentical) {
                // Trouver toutes les frontières et les extraire en un seul tableau
                const boundariesArea1 = Object.values(findFrontieres(relevantArea.slice(0, 1))).flat();

                // Trouver la frontière pertinente
                const relevantBoundarieArea1 = boundariesArea1.filter(boundary => boundary.includes(startPoint.label) && boundary.includes(endPoint.label));

                // Trouver toutes les frontières non pertinentes
                const nonRelevantBoundariesArea1 = boundariesArea1.filter(boundary => !boundary.includes(startPoint.label) && !boundary.includes(endPoint.label));

                // Trouver toutes les frontières et les extraire en un seul tableau
                const boundariesArea2 = Object.values(findFrontieres(relevantArea.slice(1, 2))).flat();

                // Trouver la frontière pertinente
                const relevantBoundarieArea2 = boundariesArea2.filter(boundary => boundary.includes(startPoint.label) && boundary.includes(endPoint.label));

                // Trouver toutes les frontières non pertinentes
                const nonRelevantBoundariesArea2 = boundariesArea2.filter(boundary => !boundary.includes(startPoint.label) && !boundary.includes(endPoint.label));

                // Vérifier si les frontières pertinentes sont les mêmes
                const areBoundariesIdentical = JSON.stringify(relevantBoundarieArea1) === JSON.stringify(relevantBoundarieArea2);

                // Les frontières sont différentes, utiliser isFrontiereInRegion pour déterminer la région choisie
                if (!areBoundariesIdentical) {
                    if (isFrontiereInRegion(addedPoint.label, relevantBoundarieArea1[0], curveMap, points)) {
                        chosenRegion.push(relevantArea[0]);
                    } else {
                        chosenRegion.push(relevantArea[1]);
                    }
                }
                // Les frontières pertinentes sont identiques, utilisons les frontières non pertinentes
                else {
                    let temporaryRegion;
                    let temporaryRegionIndex;

                    // Si la première région n'a pas de frontière non pertinente, on prends la deuxième
                    if (nonRelevantBoundariesArea1.length === 0) {
                        temporaryRegion = nonRelevantBoundariesArea2[0];
                        temporaryRegionIndex = 1;
                    }
                    //Sinon on prends la première
                    else {
                        temporaryRegion = nonRelevantBoundariesArea1[0];
                        temporaryRegionIndex = 0;
                    }

                    // Vérifier si la première frontière non pertinente est comprise dans la frontière pertinente
                    const isFirstNonRelevantInRelevant = isFrontiereInRegion(temporaryRegion, relevantBoundarieArea1[0], curveMap, points);

                    // Vérifier si le point ajouté est compris dans la frontière pertinente
                    const isAddedPointInRelevant = isFrontiereInRegion(addedPoint.label, relevantBoundarieArea1[0], curveMap, points);

                    // Déterminer la région choisie
                    if (isFirstNonRelevantInRelevant && isAddedPointInRelevant) {
                        chosenRegion.push(relevantArea[temporaryRegionIndex]);
                    } else {
                        chosenRegion.push(relevantArea[1 - temporaryRegionIndex]);
                    }
                }
            }
            // Les 2 régions pertinentes sont identiques
            else {
                console.log("Les régions pertinentes sont identiques. On choisit la première arbitrairement.");
                chosenRegion.push(relevantArea[0]);
            }
        }
        // Il y a une seule région pertinente
        else {
            chosenRegion = relevantArea;
        }

        console.log(areas);
        console.log(chosenRegion);

        // Filtrer les régions non pertinentes
        const nonRelevantAreas = areas.filter(area => area !== chosenRegion[0]);

        console.log(nonRelevantAreas);

        // Trouver toutes les frontières et les extraire en un seul tableau
        const boundariesArea = Object.values(findFrontieres(chosenRegion)).flat();

        // Trouver la frontière pertinente
        const relevantBoundarieArea = boundariesArea.find(boundary => boundary.includes(startPoint.label) && boundary.includes(endPoint.label));

        // Trouver les frontières non pertinentes
        const nonRelevantBoundariesArea = boundariesArea.filter(boundary => !boundary.includes(startPoint.label) && !boundary.includes(endPoint.label));

        if (!relevantBoundarieArea) {
            // Trouver la frontiere pertinente du startPoint
            const relevantBoundarieStartPoint = boundariesArea.find(boundary =>
                boundary && typeof boundary === 'string' && boundary.includes && boundary.includes(startPoint.label)
            );
            console.log(relevantBoundarieStartPoint);

            // Trouver la frontiere du startPoint
            const relevantBoundarieEndPoint = boundariesArea.find(boundary =>
                boundary && typeof boundary === 'string' && boundary.includes && boundary.includes(endPoint.label)
            );
            console.log(relevantBoundarieEndPoint);

            // Vérifier si les frontières ont été trouvées
            if (!relevantBoundarieStartPoint || !relevantBoundarieEndPoint) {
                console.warn("Une ou plusieurs frontières n'ont pas été trouvées. Utilisation d'une chaîne par défaut.");
                // Créer une nouvelle chaîne simple qui relie les deux points
                return `${startPoint.label}${addedPoint.label}${endPoint.label}.}${currentGraphString}`;
            }

            // Maintenant on peut utiliser indexOf sans risque d'erreur
            const insertIndex = relevantBoundarieStartPoint.indexOf(startPoint.label);
            console.log("Index d'insertion:", insertIndex);

            // Réorganiser relevantFrontiere2 pour commencer par endPoint.label et boucler correctement
            const endPointIndex = relevantBoundarieEndPoint.indexOf(endPoint.label);
            const reorganizedFrontiere2 = relevantBoundarieEndPoint.slice(endPointIndex) + relevantBoundarieEndPoint.slice(0, endPointIndex);

            // Construire la nouvelle région
            // Insérer la nouvelle région avant le point commun dans la région existante
            const newBoundarie = `${relevantBoundarieStartPoint.slice(0, insertIndex) + startPoint.label + addedPoint.label + reorganizedFrontiere2 + endPoint.label + addedPoint.label + relevantBoundarieStartPoint.slice(insertIndex)}.${nonRelevantBoundariesArea.join('.')}}`;

            // Construire la nouvelle chaîne
            const newGraphString = `${newBoundarie}${nonRelevantAreas.join('}')}`;

            return newGraphString;
        } else {
            // Trouver les indices des points de départ et d'arrivée dans la frontière
            const startPointIndices = [...relevantBoundarieArea.matchAll(new RegExp(`${startPoint.label}`, 'g'))].map(match => match.index);
            const endPointIndices = [...relevantBoundarieArea.matchAll(new RegExp(`${endPoint.label}`, 'g'))].map(match => match.index);

            const startIndex = startPointIndices[0];
            const endIndex = endPointIndices[0];

            let departToDepart = '';
            let departToEnd = '';
            let endToDepart = '';
            let endToEnd = '';

            let initialIndex = startIndex <= endIndex ? startIndex : endIndex;
            let startingIndexRecord = initialIndex;
            let index = initialIndex;

            while (true) {
                let result = '';

                while (true) {
                    index = (index + 1) % relevantBoundarieArea.length;
                    if (relevantBoundarieArea[index] === startPoint.label || relevantBoundarieArea[index] === endPoint.label) {
                        break;
                    }
                    result += relevantBoundarieArea[index];
                }

                if (relevantBoundarieArea[startingIndexRecord] === startPoint.label && relevantBoundarieArea[index] === startPoint.label) {
                    departToDepart = result;
                    console.log("Points entre départ et départ:", departToDepart);
                } else if (relevantBoundarieArea[startingIndexRecord] === startPoint.label && relevantBoundarieArea[index] === endPoint.label) {
                    departToEnd = result;
                    console.log("Points entre départ et arrivée:", departToEnd);
                } else if (relevantBoundarieArea[startingIndexRecord] === endPoint.label && relevantBoundarieArea[index] === startPoint.label) {
                    endToDepart = result;
                    console.log("Points entre arrivée et départ:", endToDepart);
                } else if (relevantBoundarieArea[startingIndexRecord] === endPoint.label && relevantBoundarieArea[index] === endPoint.label) {
                    endToEnd = result;
                    console.log("Points entre arrivée et arrivée:", endToEnd);
                }

                startingIndexRecord = index;
                if (initialIndex === index) {
                    break;
                }
            }
            // Logique pour gérer les points déjà reliés
            let region1 = '';
            let region2 = '';

            // Cas n°3.1, 3.2, 3.3, 3.4: départ-arrivé: non vide, arrivé-départ: non vide
            if (departToEnd !== "" && endToDepart !== '') {
                region1 = `${regionString}${endToDepart}`;

                if (departToDepart !== '' && endToEnd !== '') {
                    // Cas n°3.1: départ-départ: non vide, arrivé-arrivé: non vide
                    region2 = `${regionString}${endToEnd}${endPoint.label}${endToDepart}${startPoint.label}${departToDepart}`;
                } else if (departToDepart !== '') {
                    // Cas n°3.2: départ-départ: non vide, arrivé-arrivé: vide
                    region2 = `${regionString}${endToDepart}${startPoint.label}${departToDepart}`;
                } else if (endToEnd !== '') {
                    // Cas n°3.3: départ-départ: vide, arrivé-arrivé: non vide
                    region2 = `${regionString}${endToEnd}${endPoint.label}${endToDepart}`;
                } else {
                    // Cas n°3.4: départ-départ: vide, arrivé-arrivé: vide
                    if (departToEnd === endToDepart.split('').reverse().join('')) {
                        // Si departToEnd et endToDepart sont identiques mais décalés
                        region2 = `${regionString}${endToDepart}`;
                    } else {
                        regionString = regionString.split('').reverse().join('');
                        region2 = `${regionString}${departToEnd}`;
                    }
                }
            }
            // Cas n°3.5, 3.6, 3.7, 3.8: départ-arrivé: vide, arrivé-départ: vide
            else if (departToEnd === "" && endToDepart === '') {
                region1 = `${regionString}`;

                if (departToDepart !== '' && endToEnd !== '') {
                    // Cas n°3.5: départ-départ: non vide, arrivé-arrivé: non vide
                    let reversedDepartToDepart = departToDepart.split('').reverse().join('');
                    let reversedEndToEnd = endToEnd.split('').reverse().join('');
                    region2 = `${regionString}${reversedEndToEnd}${endPoint.label}${reversedDepartToDepart}${startPoint.label}`;
                } else if (departToDepart !== '') {
                    // Cas n°3.3: départ-départ: non vide, arrivé-arrivé: vide
                    let reversedDepartToDepart = departToDepart.split('').reverse().join('');
                    region2 = `${regionString}${startPoint.label}${reversedDepartToDepart}`;
                } else if (endToEnd !== '') {
                    // Cas n°3.4: départ-départ: vide, arrivé-arrivé: non vide
                    let reversedEndToEnd = endToEnd.split('').reverse().join('');
                    region2 = `${regionString}${reversedEndToEnd}${endPoint.label}`;
                } else {
                    console.log("Le cas vide-vide-vide-vide est strictement impossible !");
                    region2 = `${regionString}`;
                }
            }
            //Cas n°3.9: départ-arrivé: vide, arrivé-départ: non vide, départ-départ: vide, arrivé-arrivé: vide
            else if (departToEnd === "" && endToDepart !== '' && departToDepart === '' && endToEnd === '') {
                //Définition de la 1ère nouvelle région.
                region1 = `${regionString}${endToDepart}`;
                console.log(region1);

                //Définition de la 2ème nouvelle région.
                region2 = `${regionString}`;
                console.log(region2);
            } else {
                console.log("Un cas non prévu est apparu !");
                // Inclure les anciens points pour éviter de perdre les régions importantes
                const merged = `${startPoint.label}${addedPoint.label}${endPoint.label}`;

                // Utilise la région existante comme base
                region1 = `${regionString.includes(startPoint.label) ? regionString : merged}`;
                region2 = `${regionString.includes(endPoint.label) ? regionString : merged}`;

                console.log("Solution de secours appliquée:");
                console.log("Région 1:", region1);
                console.log("Région 2:", region2);
            }


            nonRelevantBoundariesArea.forEach(frontiere => {
                if (isFrontiereInRegion(frontiere, region1, curveMap, points)) {
                    region1 += `.${frontiere}`;
                } else {
                    region2 += `.${frontiere}`;
                }
            });

            console.log(region1);
            console.log(region2);

            // Construire la nouvelle chaîne
            const newGraphString = `${region1}.}${region2}.}${nonRelevantAreas.join('}')}`;

            console.log("Chaîne mise à jour:", newGraphString);
            return newGraphString;
        }
    }
    // Cas n°4: Le point de départ est le point d'arrivée (boucle)
    else if (startPoint.label === endPoint.label) {
        console.log("Cas où les points de départ et d'arrivé sont les mêmes");

        const regionString = `${startPoint.label}${addedPoint.label}`;

        // Trouver toutes les régions
        const areas = findRegions(currentGraphString);

        // Trouver la région pertinente
        const relevantArea = areas.filter(area => area.includes(startPoint.label));

        // Filtrer les régions non pertinentes
        const nonRelevantAreas = areas.filter(area => !area.includes(startPoint.label));

        // Trouver toutes les frontières et les extraire en un seul tableau
        const boundaries = Object.values(findFrontieres(relevantArea)).flat();

        // Trouver la frontière pertinente
        const relevantBoundarie = boundaries.filter(boundary => boundary.includes(startPoint.label));

        // Trouver toutes les frontières non pertinentes
        const nonRelevantBoundaries = boundaries.filter(boundary => !boundary.includes(startPoint.label));

        // Construire la 1ère région
        let firstArea = `${startPoint.label}${addedPoint.label}`;

        //Construire la 2ème région
        let secondArea = startIsIsolated ? `${startPoint.label}${addedPoint.label}` : relevantBoundarie.map(frontiere => frontiere.replace(startPoint.label, `${startPoint.label}${addedPoint.label}${startPoint.label}`)).join('.');

        // Répartir les frontières non pertinentes entre les deux nouvelles régions
        nonRelevantBoundaries.forEach(boundarie => {
            if (isFrontiereInRegion(boundarie, regionString, curveMap, points)) {
                firstArea += `.${boundarie}`;
            } else {
                secondArea += `.${boundarie}`;
            }
        });

        // Construire la nouvelle chaîne
        const newGraphString = `${firstArea}.}${secondArea}.}${nonRelevantAreas.join('}')}`;

        return newGraphString;
    }
    //Cas n°5: Pas prévu
    else {
        console.log("Ce type de cas n'est pas prévu");
    }
    return currentGraphString;
};

// Fonction pour vérifier si une frontière est dans une région
const isFrontiereInRegion = (frontiere, region, curveMap, points) => {
    // Vérifier si la frontière est une chaîne de caractères
    if (typeof frontiere !== 'string' || frontiere.length === 0) {
        return false;
    }

    // Obtenir la première lettre de la frontière
    const firstPointLabel = frontiere[0];

    // Obtenir les coordonnées du premier point de la frontière
    const firstPoint = points.find(point => point.label === firstPointLabel);
    if (!firstPoint) {
        return false; // Si le point n'est pas trouvé, il n'est pas dans la région
    }

    // Vérifier si la région est valide
    if (typeof region !== 'string' || region.length < 2) {
        return false;
    }

    // Obtenir les courbes associées à la région
    const regionCurves = [];
    region.split('').forEach((pointLabel, i) => {
        // Vérifier si pointLabel est défini et est une chaîne
        if (!pointLabel) return;

        // Calculer l'index pour i+2 en tenant compte de la longueur de la région
        const nextIndex = i + 2 < region.length ? i + 2 : i;

        // Vérifier si region[nextIndex] existe
        if (!region[nextIndex]) return;

        const curves = curveMap.get(pointLabel) || [];
        curves.forEach(curveInfo => {
            // Vérifier si curveInfo et curveInfo.curve sont valides
            if (!curveInfo || !curveInfo.curve || !Array.isArray(curveInfo.curve) ||
                curveInfo.curve.length < 2) return;

            // Vérifier que les éléments nécessaires existent
            const lastPoint = curveInfo.curve[curveInfo.curve.length - 1];
            const secondLastPoint = curveInfo.curve[curveInfo.curve.length - 2];

            if (!lastPoint || !secondLastPoint) return;

            // Vérifier si le dernier point a un label
            if (!lastPoint.label) return;

            // Vérifier si le dernier point de la courbe est égal au label de region[nextIndex]
            if (curveInfo.role === 'start' &&
                lastPoint.label === region[nextIndex] &&
                (!secondLastPoint.label || secondLastPoint.label !== firstPointLabel)) {
                regionCurves.push(...curveInfo.curve);
            }
        });
    });

    // Si nous n'avons pas assez de points pour former un polygone, retourner false
    if (regionCurves.length < 3) {
        return false;
    }

    // Calculer l'espace formé par les courbes de la région
    const regionPolygon = regionCurves.map(point =>
        point && typeof point.x === 'number' && typeof point.y === 'number' ?
            [point.x, point.y] : null
    ).filter(Boolean); // Filtrer les valeurs null

    // Si nous n'avons pas assez de points pour former un polygone, retourner false
    if (regionPolygon.length < 3) {
        return false;
    }

    // Vérifier si le premier point de la frontière est dans l'espace de la région
    try {
        const isInRegion = isPointInPolygon([firstPoint.x, firstPoint.y], regionPolygon);
        return isInRegion;
    } catch (error) {
        console.error("Erreur lors de la vérification si un point est dans un polygone:", error);
        return false;
    }
};

// Fonction pour vérifier si un point est dans un polygone avec gestion d'erreurs
const isPointInPolygon = (point, polygon) => {
    if (!point || point.length < 2 || !polygon || polygon.length < 3) {
        return false;
    }

    const [x, y] = point;
    if (typeof x !== 'number' || typeof y !== 'number') {
        return false;
    }

    let inside = false;

    try {
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (!polygon[i] || !polygon[j] ||
                polygon[i].length < 2 || polygon[j].length < 2) {
                continue;
            }

            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];

            if (typeof xi !== 'number' || typeof yi !== 'number' ||
                typeof xj !== 'number' || typeof yj !== 'number') {
                continue;
            }

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    } catch (error) {
        console.error("Erreur lors du calcul isPointInPolygon:", error);
        return false;
    }
};

// Fonction de détection d'intersection simplifiée et robuste
export const basicCurveIntersects = (newCurve, existingCurves, points) => {

    // Filtrer les points de la nouvelle courbe pour enlever les doublons consécutifs
    const filteredNewCurve = [newCurve[0]];
    for (let i = 1; i < newCurve.length; i++) {
        const lastPoint = filteredNewCurve[filteredNewCurve.length - 1];
        const currentPoint = newCurve[i];

        // Si le point est différent du dernier point ajouté
        if (lastPoint.x !== currentPoint.x || lastPoint.y !== currentPoint.y) {
            filteredNewCurve.push(currentPoint);
        }
    }

    // Si la courbe filtrée est trop courte, pas d'intersection
    if (filteredNewCurve.length < 2) {
        return false;
    }

    // Récupérer les points de départ et de fin de la nouvelle courbe
    const startPoint = filteredNewCurve[0];
    const endPoint = filteredNewCurve[filteredNewCurve.length - 1];

    // Fonction pour vérifier si un point est près d'un point officiel
    const isNearOfficialPoint = (point) => {
        for (const officialPoint of points) {
            const dx = officialPoint.x - point.x;
            const dy = officialPoint.y - point.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 15) {
                return true;
            }
        }
        return false;
    };

    // Vérifier les intersections avec les courbes existantes
    for (let curveIndex = 0; curveIndex < existingCurves.length; curveIndex++) {
        const curve = existingCurves[curveIndex];

        // Extraire les points de la courbe existante
        let curvePoints = [];
        if (Array.isArray(curve)) {
            curvePoints = curve;
        } else if (curve && curve.points) {
            curvePoints = curve.points;
        }

        // Filtrer les points consécutifs identiques
        const filteredCurvePoints = [curvePoints[0]];
        for (let i = 1; i < curvePoints.length; i++) {
            const lastPoint = filteredCurvePoints[filteredCurvePoints.length - 1];
            const currentPoint = curvePoints[i];

            if (lastPoint.x !== currentPoint.x || lastPoint.y !== currentPoint.y) {
                filteredCurvePoints.push(currentPoint);
            }
        }

        // Si la courbe filtrée est trop courte, passer à la suivante
        if (filteredCurvePoints.length < 2) continue;


        // Vérifier chaque segment de la nouvelle courbe avec chaque segment de la courbe existante
        for (let i = 0; i < filteredNewCurve.length - 1; i++) {
            const seg1Start = filteredNewCurve[i];
            const seg1End = filteredNewCurve[i + 1];

            // Ignorer les segments aux points officiels
            const isStartSegment = i === 0;
            const isEndSegment = i === filteredNewCurve.length - 2;

            for (let j = 0; j < filteredCurvePoints.length - 1; j++) {
                const seg2Start = filteredCurvePoints[j];
                const seg2End = filteredCurvePoints[j + 1];

                // Ignorer l'intersection aux points officiels
                if ((isStartSegment && isNearOfficialPoint(seg1Start)) ||
                    (isEndSegment && isNearOfficialPoint(seg1End))) {
                    // Si c'est un segment d'extrémité et qu'il est proche d'un point officiel,
                    // vérifier s'il partage un point avec le segment de la courbe existante
                    const isConnectedToSeg2 =
                        (Math.abs(seg1Start.x - seg2Start.x) < 5 && Math.abs(seg1Start.y - seg2Start.y) < 5) ||
                        (Math.abs(seg1Start.x - seg2End.x) < 5 && Math.abs(seg1Start.y - seg2End.y) < 5) ||
                        (Math.abs(seg1End.x - seg2Start.x) < 5 && Math.abs(seg1End.y - seg2Start.y) < 5) ||
                        (Math.abs(seg1End.x - seg2End.x) < 5 && Math.abs(seg1End.y - seg2End.y) < 5);

                    if (isConnectedToSeg2) {
                        continue;  // Ignorer les connexions légitimes
                    }
                }

                // Vérifier l'intersection
                if (segmentsIntersect(seg1Start, seg1End, seg2Start, seg2End)) {
                    return true;
                }
            }
        }
    }

    // Vérifier l'auto-intersection
    for (let i = 0; i < filteredNewCurve.length - 3; i++) {
        const seg1Start = filteredNewCurve[i];
        const seg1End = filteredNewCurve[i + 1];

        for (let j = i + 2; j < filteredNewCurve.length - 1; j++) {
            // Exception spéciale pour le premier et dernier segment (boucle)
            if (i === 0 && j === filteredNewCurve.length - 2) {
                if (isNearOfficialPoint(startPoint) && isNearOfficialPoint(endPoint)) {
                    continue; // Boucle légitime
                }
            }

            const seg2Start = filteredNewCurve[j];
            const seg2End = filteredNewCurve[j + 1];

            if (segmentsIntersect(seg1Start, seg1End, seg2Start, seg2End)) {
                return true;
            }
        }
    }

    console.log("Aucune intersection détectée");
    return false;
};


export {toPhysicalCoords, toLogicalCoords, LOGICAL_WIDTH, LOGICAL_HEIGHT};



