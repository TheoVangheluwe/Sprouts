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
        // Adaptez cette partie pour gérer les courbes avec des structures différentes
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
            return { ...point, connections: newConnections };
        } else if (point.label === p1.label || point.label === p2.label) {
            // Pour des points différents, ajouter 1 connexion à chacun
            const newConnections = point.connections + 1;
            return { ...point, connections: newConnections };
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

// Fonction de détection d'intersection améliorée
export const curveIntersects = (newCurve, curves = [], points) => {
    console.log("Checking intersections for new curve:", newCurve);

    // Si la courbe est invalide ou trop courte, pas d'intersection
    if (!newCurve || newCurve.length < 2) {
        console.log("Curve too short, no intersection check");
        return false;
    }

    // Fonction pour vérifier si un point appartient à un segment
    const pointOnSegment = (p, s1, s2, tolerance = 3) => {
        const d1 = Math.hypot(p.x - s1.x, p.y - s1.y);
        const d2 = Math.hypot(p.x - s2.x, p.y - s2.y);
        const lineLength = Math.hypot(s1.x - s2.x, s1.y - s2.y);

        return Math.abs(d1 + d2 - lineLength) < tolerance;
    };

    // Vérifier si un point est près d'un point officiel
    const isNearOfficialPoint = (p, tolerance = 15) => {
        return points.some(point => Math.hypot(point.x - p.x, point.y - p.y) < tolerance);
    };

    // 1. Vérifier les intersections avec les courbes existantes
    for (let curve of curves) {
        // Adapter en fonction du format de la courbe
        let curvePoints = [];
        if (curve && Array.isArray(curve)) {
            curvePoints = curve;
        } else if (curve && typeof curve === 'object' && Array.isArray(curve.points)) {
            curvePoints = curve.points;
        }

        if (curvePoints.length < 2) continue;

        for (let i = 0; i < newCurve.length - 1; i++) {
            const seg1Start = newCurve[i];
            const seg1End = newCurve[i + 1];

            // Ignorer les segments très courts
            if (Math.hypot(seg1End.x - seg1Start.x, seg1End.y - seg1Start.y) < 3) continue;

            for (let j = 0; j < curvePoints.length - 1; j++) {
                const seg2Start = curvePoints[j];
                const seg2End = curvePoints[j + 1];

                // Ignorer les segments très courts
                if (Math.hypot(seg2End.x - seg2Start.x, seg2End.y - seg2Start.y) < 3) continue;

                // Si les deux segments partagent un point d'extrémité qui est un point officiel,
                // ce n'est pas considéré comme une intersection
                if ((isNearOfficialPoint(seg1Start) &&
                    (Math.hypot(seg1Start.x - seg2Start.x, seg1Start.y - seg2Start.y) < 15 ||
                     Math.hypot(seg1Start.x - seg2End.x, seg1Start.y - seg2End.y) < 15)) ||
                    (isNearOfficialPoint(seg1End) &&
                    (Math.hypot(seg1End.x - seg2Start.x, seg1End.y - seg2Start.y) < 15 ||
                     Math.hypot(seg1End.x - seg2End.x, seg1End.y - seg2End.y) < 15))) {
                    continue;
                }

                // Vérifier l'intersection des segments
                if (segmentsIntersect(seg1Start, seg1End, seg2Start, seg2End)) {
                    console.log("Intersection detected with existing curve at segments:",
                                seg1Start, seg1End, "and", seg2Start, seg2End);
                    return true;
                }
            }
        }
    }

    // 2. Vérifier l'auto-intersection de la nouvelle courbe
    for (let i = 0; i < newCurve.length - 2; i++) {
        const seg1Start = newCurve[i];
        const seg1End = newCurve[i + 1];

        // Ignorer les segments très courts
        if (Math.hypot(seg1End.x - seg1Start.x, seg1End.y - seg1Start.y) < 3) continue;

        // Ne vérifier que les segments non adjacents (au moins 2 de distance)
        for (let j = i + 2; j < newCurve.length - 1; j++) {
            const seg2Start = newCurve[j];
            const seg2End = newCurve[j + 1];

            // Ignorer les segments très courts
            if (Math.hypot(seg2End.x - seg2Start.x, seg2End.y - seg2Start.y) < 3) continue;

            // Ignorer les connexions aux extrémités (points officiels)
            if (i === 0 && j === newCurve.length - 2 &&
                isNearOfficialPoint(seg1Start) && isNearOfficialPoint(seg2End)) {
                continue;
            }

            // Vérifier l'intersection
            if (segmentsIntersect(seg1Start, seg1End, seg2Start, seg2End)) {
                console.log("Self-intersection detected at segments:",
                            seg1Start, seg1End, "and", seg2Start, seg2End);
                return true;
            }
        }
    }

    // 3. Vérifier si la nouvelle courbe passe par un point officiel autre que ses extrémités
    for (let i = 1; i < newCurve.length - 1; i++) {
        const point = newCurve[i];

        for (let officialPoint of points) {
            // Si ce n'est pas un point d'extrémité et qu'on passe près d'un point officiel
            if (Math.hypot(point.x - officialPoint.x, point.y - officialPoint.y) < 15 &&
                Math.hypot(newCurve[0].x - officialPoint.x, newCurve[0].y - officialPoint.y) >= 15 &&
                Math.hypot(newCurve[newCurve.length-1].x - officialPoint.x, newCurve[newCurve.length-1].y - officialPoint.y) >= 15) {
                console.log("Curve passes through an official point:", officialPoint);
                return true;
            }
        }
    }

    console.log("No intersections found");
    return false;
};

export const curveLength = (curve) => {
    let length = 0;
    for (let i = 1; i < curve.length; i++) {
        length += Math.hypot(curve[i].x - curve[i - 1].x, curve[i].y - curve[i - 1].y);
    }
    return length;
};

// Algorithme amélioré pour la détection d'intersection de segments
export const segmentsIntersect = (A, B, C, D) => {
    // Fonction orientée pour déterminer l'orientation de trois points
    const ccw = (A, B, C) => {
        return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    };

    // Vérifie si les segments AB et CD s'intersectent
    return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
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

export const isPointTooClose = (x, y, points, minDistance = 30) => {
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
        return { x: p1.x + t * dx, y: p1.y + t * dy };
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
  startCurves.push({ curve: newCurve, role: 'start' });
  curveMap.set(startPoint.label, startCurves);

  // Mettre à jour la courbe pour le point de fin
  const endCurves = curveMap.get(endPoint.label) || [];
  endCurves.push({ curve: newCurve, role: 'end' });
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

    // Trouver la région pertinente
    const relevantArea = areas.filter(area => area.includes(isolatedPoint.label));

    // Trouver les régions non pertinentes
    const nonRelevantAreas = areas.filter(area => !area.includes(isolatedPoint.label));

    // Trouver toutes les frontières et les extraire en un seul tableau
    const boundaries = Object.values(findFrontieres(relevantArea)).flat();

    // Trouver la frontière pertinente
    const relevantBoundarie = boundaries.find(boundary => boundary.includes(connectedPoint.label));

    // Trouver les frontières non pertinentes
    const nonRelevantBoundaries = boundaries.filter(boundary => !boundary.includes(connectedPoint.label) && !boundary.includes(isolatedPoint.label));

    // Trouver l'index du point commun dans la frontière pertinente
    const insertIndex = relevantBoundarie.indexOf(connectedPoint.label);

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

    console.log(relevantArea);

    // Il y a 2 régions pertinentes
    if (relevantArea.length > 1) {
      console.log("Il y a plusieurs régions pertinentes");

      const areAreasIdentical = relevantArea.every(region => region === relevantArea[0]);

      console.log(areAreasIdentical);

      // Les 2 régions pertinentes sont différentes
      if (!areAreasIdentical) {
        console.log(relevantArea[0]);

        // Trouver toutes les frontières et les extraire en un seul tableau
        const boundariesArea1 = Object.values(findFrontieres(relevantArea.slice(0, 1))).flat();

        // Trouver la frontière pertinente
        const relevantBoundarieArea1= boundariesArea1.filter(boundary => boundary.includes(startPoint.label) && boundary.includes(endPoint.label));

        // Trouver toutes les frontières non pertinentes
        const nonRelevantBoundariesArea1 = boundariesArea1.filter(boundary => !boundary.includes(startPoint.label) && !boundary.includes(endPoint.label));

        // Trouver toutes les frontières et les extraire en un seul tableau
        const boundariesArea2 = Object.values(findFrontieres(relevantArea.slice(1, 2))).flat();

        // Trouver la frontière pertinente
        const relevantBoundarieArea2= boundariesArea2.filter(boundary => boundary.includes(startPoint.label) && boundary.includes(endPoint.label));

        // Trouver toutes les frontières non pertinentes
        const nonRelevantBoundariesArea2 = boundariesArea2.filter(boundary => !boundary.includes(startPoint.label) && !boundary.includes(endPoint.label));

        // Vérifier si les frontières pertinentes sont les mêmes
        const areBoundariesIdentical = JSON.stringify(relevantBoundarieArea1) === JSON.stringify(relevantBoundarieArea2);

        // Les frontières sont différentes, utiliser isFrontiereInRegion pour déterminer la région choisie
        if(!areBoundariesIdentical){
          if (isFrontiereInRegion(addedPoint.label, relevantBoundarieArea1[0], curveMap, points)) {
            chosenRegion.push(relevantArea[0]);
          } else {
            chosenRegion.push(relevantArea[1]);
          }
          console.log(chosenRegion);
        }
        // Les frontières pertinentes sont identiques, utilisons les frontières non pertinentes
        else{
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
    // l y a une seule région pertinente
    else{
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
    const relevantBoundarieArea= boundariesArea.find(boundary => boundary.includes(startPoint.label) && boundary.includes(endPoint.label));

    // Trouver les frontières non pertinentes
    const nonRelevantBoundariesArea = boundariesArea.filter(boundary => !boundary.includes(startPoint.label) && !boundary.includes(endPoint.label));

    if (!relevantBoundarieArea) {
      // Trouver la frontiere pertinente du startPoint
      const relevantBoundarieStartPoint= boundariesArea.find(boundary => boundary.includes(startPoint.label));
      console.log(relevantBoundarieStartPoint);

      // Trouver la frontiere du startPoint
      const relevantBoundarieEndPoint= boundariesArea.find(boundary => boundary.includes(endPoint.label));
      console.log(relevantBoundarieEndPoint);

      // Trouver l'index du point commun dans la région existante
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
    }
    else {
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
        }
        else if (relevantBoundarieArea[startingIndexRecord] === startPoint.label && relevantBoundarieArea[index] === endPoint.label) {
          departToEnd = result;
          console.log("Points entre départ et arrivée:", departToEnd);
        }
        else if (relevantBoundarieArea[startingIndexRecord] === endPoint.label && relevantBoundarieArea[index] === startPoint.label) {
          endToDepart = result;
          console.log("Points entre arrivée et départ:", endToDepart);
        }
        else if (relevantBoundarieArea[startingIndexRecord] === endPoint.label && relevantBoundarieArea[index] === endPoint.label) {
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
      }
      else {
        console.log("Un cas non prévu est apparu !");
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
      const newGraphString = `${region1}.}${region2}.}${nonRelevantAreas.join('.}')}`;

      console.log("Chaîne mise à jour:", newGraphString);
      return newGraphString;
    }
  }
  // Cas n°4: Le point de départ est le point d'arrivée (boucle)
  else if (startPoint === endPoint) {
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
  // Obtenir la première lettre de la frontière
  const firstPointLabel = frontiere[0];

  // Obtenir les coordonnées du premier point de la frontière
  const firstPoint = points.find(point => point.label === firstPointLabel);
  if (!firstPoint) {
    return false; // Si le point n'est pas trouvé, il n'est pas dans la région
  }

  // Obtenir les courbes associées à la région
  const regionCurves = [];
  region.split('').forEach((pointLabel, i) => {
    // Calculer l'index pour i+2 en tenant compte de la longueur de la région
    const nextIndex = i + 2 < region.length ? i + 2 : i;

    const curves = curveMap.get(pointLabel) || [];
    curves.forEach(curveInfo => {
      // Vérifier si le dernier point de la courbe est égal au label de region[nextIndex]
      if (curveInfo.role === 'start' && curveInfo.curve[curveInfo.curve.length - 1].label === region[nextIndex] && curveInfo.curve[curveInfo.curve.length - 2].label !== firstPointLabel) {
        regionCurves.push(...curveInfo.curve);
      }
    });
  });

  // Calculer l'espace formé par les courbes de la région
  const regionPolygon = regionCurves.flat().map(point => [point.x, point.y]);

  // Vérifier si le premier point de la frontière est dans l'espace de la région
  const isInRegion = isPointInPolygon([firstPoint.x, firstPoint.y], regionPolygon);
  return isInRegion;
};

// Fonction pour vérifier si un point est dans un polygone
const isPointInPolygon = (point, polygon) => {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

export { toPhysicalCoords, toLogicalCoords, LOGICAL_WIDTH, LOGICAL_HEIGHT };