export const drawGame = (canvasRef, pointsToDraw, curvesToDraw, tempCurve = null) => {
  const canvas = canvasRef.current;
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw curves
    curvesToDraw.forEach(curve => {
      ctx.beginPath();
      ctx.moveTo(curve[0].x, curve[0].y);
      for (let i = 1; i < curve.length; i++) {
        ctx.lineTo(curve[i].x, curve[i].y);
      }
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw points
    pointsToDraw.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "black";
      ctx.fill();
      ctx.fillText(point.label, point.x + 10, point.y + 5);
    });

    // Draw temporary curve
    if (tempCurve && tempCurve.length > 0) {
      ctx.beginPath();
      ctx.moveTo(tempCurve[0].x, tempCurve[0].y);
      for (let i = 1; i < tempCurve.length; i++) {
        ctx.lineTo(tempCurve[i].x, tempCurve[i].y);
      }
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
};

export const getMousePos = (canvas, event) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

export const getNearPoint = (x, y, points, threshold = 15) => {
  return points.find(point => Math.hypot(point.x - x, point.y - y) <= threshold) || null;
};

export const canConnect = (p1, p2) => {
  if (p1 === p2) {
    return p1.connections <= 1;
  } else {
    if (p1.connections >= 3 || p2.connections >= 3) return false;
    return true;
  }
};

export const connectPoints = (p1, p2, curvePoints, points, setPoints, setCurves) => {
  console.log("Connecting points:", p1, p2); // Log des points à connecter
  // Mettre à jour les connexions des points
  let updatedPoints = points.map(point => {
    if (point.label === p1.label || point.label === p2.label) {
      const newConnections = point.connections + 1;
      console.log(`Updating point ${point.label} with ${newConnections} connections`); // Log des mises à jour de points
      return { ...point, connections: newConnections }; // Retourner une copie avec connections mises à jour
    }
    return point;
  });

  console.log("Updated points: ", updatedPoints); // Log des points mis à jour

  // Mettre à jour les points et ajouter la courbe
  setPoints(updatedPoints);

  setCurves(prevCurves => {
    const updatedCurves = [...prevCurves, curvePoints];
    console.log("Updated curves: ", updatedCurves); // Log des courbes mises à jour
    return updatedCurves;
  });
};

export const curveIntersects = (newCurve, curves, points) => {
  for (let curve of curves) {
    for (let i = 0; i < newCurve.length - 1; i++) {
      const seg1Start = newCurve[i];
      const seg1End = newCurve[i + 1];
      for (let j = 0; j < curve.length - 1; j++) {
        const seg2Start = curve[j];
        const seg2End = curve[j + 1];

        // Ignore intersections at start and end points
        if (points.some(point => point.x === seg1Start.x && point.y === seg1Start.y) ||
            points.some(point => point.x === seg1End.x && point.y === seg1End.y) ||
            points.some(point => point.x === seg2Start.x && point.y === seg2Start.y) ||
            points.some(point => point.x === seg2End.x && point.y === seg2End.y)) {
          continue;
        }

        if (segmentsIntersect(seg1Start, seg1End, seg2Start, seg2End)) {
          return true;
        }
      }
    }
  }

  for (let i = 0; i < newCurve.length - 1; i++) {
    const seg1Start = newCurve[i];
    const seg1End = newCurve[i + 1];
    for (let j = i + 2; j < newCurve.length - 1; j++) {
      const seg2Start = newCurve[j];
      const seg2End = newCurve[j + 1];

      // Ignore intersections at start and end points
      if (points.some(point => point.x === seg1Start.x && point.y === seg1Start.y) ||
          points.some(point => point.x === seg1End.x && point.y === seg1End.y) ||
          points.some(point => point.x === seg2Start.x && point.y === seg2Start.y) ||
          points.some(point => point.x === seg2End.x && point.y === seg2End.y)) {
        continue;
      }

      if (segmentsIntersect(seg1Start, seg1End, seg2Start, seg2End)) {
        return true;
      }
    }
  }
  return false;
};

export const curveLength = (curve) => {
  let length = 0;
  for (let i = 1; i < curve.length; i++) {
    length += Math.hypot(curve[i].x - curve[i - 1].x, curve[i].y - curve[i - 1].y);
  }
  return length;
};

export const segmentsIntersect = (A, B, C, D) => {
  const orientation = (p, q, r) => {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (Math.abs(val) < 1e-6) return 0;
    return val > 0 ? 1 : 2;
  };

  const o1 = orientation(A, B, C);
  const o2 = orientation(A, B, D);
  const o3 = orientation(C, D, A);
  const o4 = orientation(C, D, B);

  return (o1 !== o2 && o3 !== o4);
};

export const getNextLabel = (points) => {
  const usedLabels = points.map(point => point.label);
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Inclut les lettres majuscules et minuscules

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

    console.log(relevantArea)

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
    const relevantBoundarie = boundaries.find(boundary => boundary.includes(connectedPoint.label))

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

    console.log(relevantArea)

    // Il y a 2 régions pertinentes 
    if (relevantArea.length > 1) {

      console.log("Il y a plusieurs régions pertinentes")

      const areAreasIdentical = relevantArea.every(region => region === relevantArea[0]);

      console.log(areAreasIdentical)

      // Les 2 régions pertinentes sont différentes
      if (!areAreasIdentical) {

        console.log(relevantArea[0])

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
          console.log(chosenRegion)
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

    console.log(areas)
    console.log(chosenRegion);

    // Filtrer les régions non pertinentes
    const nonRelevantAreas = areas.filter(area => area !== chosenRegion[0]);

    console.log(nonRelevantAreas)

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


/**
 * Découpe la chaîne de caractères en argument en frontières (concept de boundary)
 */
function parseBoundaries(chain) {
  const boundaries = [];
  let currentBoundary = [];

  for (const char of chain) {
      if (/\w/.test(char)) { // Vérifie si c'est un caractère alphanumérique
          currentBoundary.push(char);
      } else if (char === '.' || char === '}') {
          if (currentBoundary.length > 0) {
              boundaries.push(currentBoundary);
              currentBoundary = [];
          }
      } else if (char === '!') {
          break; // fin de la position
      }
  }

  return boundaries;
}

/**
* Découpe la chaîne de caractères en argument en régions
*/
function parseRegions(chain) {
  const regions = [];
  let currentRegion = [];
  const seenInRegion = new Set();
  let currentWord = "";

  for (const char of chain) {
      if (/\w/.test(char)) {
          currentWord += char;
      } else if (char === '.') {
          if (currentWord) {
              for (const v of currentWord) {
                  if (!seenInRegion.has(v)) {
                      currentRegion.push(v);
                      seenInRegion.add(v);
                  }
              }
              currentWord = "";
          }
      } else if (char === '}') {
          if (currentWord) {
              for (const v of currentWord) {
                  if (!seenInRegion.has(v)) {
                      currentRegion.push(v);
                      seenInRegion.add(v);
                  }
              }
              currentWord = "";
          }
          if (currentRegion.length > 0) {
              regions.push(currentRegion);
              currentRegion = [];
              seenInRegion.clear();
          }
      } else if (char === '!') {
          if (currentWord) {
              for (const v of currentWord) {
                  if (!seenInRegion.has(v)) {
                      currentRegion.push(v);
                      seenInRegion.add(v);
                  }
              }
          }
          if (currentRegion.length > 0) {
              regions.push(currentRegion);
          }
          break;
      }
  }

  return regions;
}

/**
* Détermine le degré de chaque sommet dans la chaîne de caractères en argument
*/
function getVertexDegrees(chain) {
  const boundaries = parseBoundaries(chain);
  const degree = {};
  const appearanceCount = {};
  const singleVertexBoundaries = new Set();

  const forbidden = new Set(['.', '}', '!']);

  for (const boundary of boundaries) {
      for (const v of boundary) {
          if (forbidden.has(v)) continue;
          appearanceCount[v] = (appearanceCount[v] || 0) + 1;
      }
      if (boundary.length === 1 && !forbidden.has(boundary[0])) {
          singleVertexBoundaries.add(boundary[0]);
      }
  }

  for (const [v, count] of Object.entries(appearanceCount)) {
      if (count === 1 && singleVertexBoundaries.has(v)) {
          degree[v] = 0;
      } else {
          degree[v] = count;
      }
  }

  return degree;
}

/**
* Détermine les sommets sur lesquels un coup peut être joué
*/
function playableVertices(chain) {
  const degree = getVertexDegrees(chain);
  return Object.entries(degree)
      .filter(([_, d]) => d < 3)
      .map(([v, _]) => v);
}

/**
* Détermine à partir de deux chaînes de caractères si le coup est valide ou non
*/
function isValidMove(oldChain, newChain) {
  const oldBoundaries = parseBoundaries(oldChain);
  const newBoundaries = parseBoundaries(newChain);

  const oldDegrees = getVertexDegrees(oldChain);
  const newDegrees = getVertexDegrees(newChain);

  const oldVertices = new Set(Object.keys(oldDegrees));
  const newVertices = new Set(Object.keys(newDegrees));

  // 1: Vérification de la présence d’un nouveau sommet
  const addedVertices = [...newVertices].filter(v => !oldVertices.has(v));
  if (addedVertices.length !== 1) {
      console.log("Plus d’un nouveau sommet ou aucun n’a été ajouté.");
      return false;
  }

  const newVertex = addedVertices[0];

  // 2: Vérification du degré (2) du nouveau sommet
  if (newDegrees[newVertex] !== 2) {
      console.log("Le nouveau sommet n’a pas exactement 2 connexions.");
      return false;
  }

  // 3: Vérification de la somme des degrés
  const oldDegreeSum = Object.values(oldDegrees).reduce((a, b) => a + b, 0);
  const newDegreeSum = Object.values(newDegrees).reduce((a, b) => a + b, 0);
  if (newDegreeSum !== oldDegreeSum + 4) {
      console.log(`La somme des degrés des sommets n'est pas correcte : ${newDegreeSum} != ${oldDegreeSum} + 4.`);
      return false;
  }

  // 4: Vérification des degrés de tous les sommets
  for (const v of oldVertices) {
      if (newDegrees[v] > 3) {
          console.log(`Le sommet ${v} dépasse 3 connexions (${newDegrees[v]}).`);
          return false;
      }
  }

  // 5: Vérifier que le nouveau coup est valide (connection des sommets valide)
  const connections = [];
  for (const boundary of newBoundaries) {
      if (boundary.includes(newVertex)) {
          const indices = boundary
              .map((x, i) => (x === newVertex ? i : -1))
              .filter(i => i !== -1);
          for (const idx of indices) {
              if (idx > 0) {
                  const vBefore = boundary[idx - 1];
                  if (vBefore !== newVertex) connections.push(vBefore);
              }
              if (idx + 1 < boundary.length) {
                  const vAfter = boundary[idx + 1];
                  if (vAfter !== newVertex) connections.push(vAfter);
              }
          }
      }
  }

  let connectedVertices = connections.filter(v => oldVertices.has(v));
  connectedVertices = [...new Set(connectedVertices)];
  if (connectedVertices.length === 1 && newDegrees[connectedVertices[0]] === 2) {
      connectedVertices.push(connectedVertices[0]);
  }
  if (connectedVertices.length !== 2) {
      console.log("Le nouveau sommet n’est pas connecté à exactement deux anciens sommets.");
      return false;
  }

  // 5.2: Vérifier que le nouveau coup est valide (région)
  if (connectedVertices[0] !== connectedVertices[1]) {
      const regions = parseRegions(newChain);
      if (!regions.some(region => region.includes(connectedVertices[0]) && region.includes(connectedVertices[1]))) {
          console.log("Les deux sommets connectés ne se trouvent pas dans la même région.");
          return false;
      }
  }

  // 6: Vérifier que les régions créées soient valides
  return true;
}



/**
 * Détermine la liste des coups possibles à partir de la chaîne de caractères en argument
 * ("bug" connu, il y a parfois deux fois le même coup dans la liste, pas très important)
 */
function generatePossibleMoves(chain) {
    const freeVRegion = []; // free_vertex_region
    let plays = []; // liste des coups possibles (2 sommets)
    const regions = parseRegions(chain);
    const degree = getVertexDegrees(chain);

    // Parcours de chaque région pour trouver les sommets connectables (degré <= 2)
    for (const region of regions) {
        const connectableVertices = region.filter(v => degree[v] <= 2);
        if (connectableVertices.length > 1) { // s'il y a au moins un sommet connectable
            freeVRegion.push(connectableVertices); // pour les ajouter
        }
    }

    // Liste des paires de deux sommets différents connectables
    const possiblePairs = [];
    for (const regionVertices of freeVRegion) {
        for (let i = 0; i < regionVertices.length; i++) {
            for (let j = i + 1; j < regionVertices.length; j++) {
                possiblePairs.push([regionVertices[i], regionVertices[j]]);
            }
        }
    }
    plays = possiblePairs; // ajout des paires de sommets connectables à la liste des coups possibles

    // Ajouter les sommets avec un degré de 1 ou 0 à la liste des coups possibles
    const possibleSelfLoops = [];
    for (const region of regions) {
        for (const vertex of region) {
            if (degree[vertex] <= 1) {
                possibleSelfLoops.push([vertex, vertex]);
            }
        }
    }
    plays = plays.concat(possibleSelfLoops); // ajout des sommets de degré 1 ou 0 en tant que 'self-loop'

    return plays;
}

/**
 * Choisit un coup possible entre deux sprouts à partir de la chaîne de caractères en argument
 * et de generatePossibleMoves
 */
function chooseMove(chain) {
    const possibleMoves = generatePossibleMoves(chain); // liste des coups possibles
    if (possibleMoves.length > 0) {
        return possibleMoves[Math.floor(Math.random() * possibleMoves.length)]; // choix aléatoire d'un coup
    } else {
        return null; // aucun coup possible
    }
}

export { generatePossibleMoves, chooseMove };



/**
 * Vérifie si le jeu est terminé en fonction de la chaîne en argument
 */
function isGameOver(chain) {
    const regions = parseRegions(chain);
    const allDegrees = getVertexDegrees(chain);

    // On regarde dans chaque région s'il y a un coup possible, 2 cas :
    // 1. Il y a au moins un point de degré = 1 ou 0, self-loop jouable
    // 2. Il y a au moins 2 points de degré <= 2, on peut jouer un coup

    for (const region of regions) {
        const regionDegrees = Object.fromEntries(
            region.filter(v => v in allDegrees).map(v => [v, allDegrees[v]])
        );

        // Cas 1 : Vérifie s'il y a un point de degré 1 ou 0
        const lowDegreePoints = Object.entries(regionDegrees).filter(([_, d]) => d <= 1);
        if (lowDegreePoints.length > 0) {
            return false;
        }

        // Cas 2 : Vérifie s'il y a au moins 2 points de degré <= 2
        const playablePoints = Object.entries(regionDegrees).filter(([_, d]) => d <= 2);
        if (playablePoints.length >= 2) {
            return false;
        }
    }

    return true; // Rien n'est jouable
}

export { isGameOver };



/**
 * Relie automatiquement deux points via une courbe en respectant les règles du jeu.
 */
export const autoConnectPoints = (points, curves, setPoints, setCurves, graphString, setGraphString, curveMap, setCurveMap) => {
  // Générer les coups possibles
  const possibleMoves = generatePossibleMoves(graphString);

  if (possibleMoves.length === 0) {
    console.log("Aucun coup possible.");
    return;
  }

  // Choisir un coup valide
  for (const [startLabel, endLabel] of possibleMoves) {
    const startPoint = points.find(point => point.label === startLabel);
    const endPoint = points.find(point => point.label === endLabel);

    if (!startPoint || !endPoint) continue;

    // Vérifier si les points peuvent être connectés
    if (startPoint.connections >= 3 || endPoint.connections >= 3) continue;

    // Générer une courbe plus naturelle
    const midX = (startPoint.x + endPoint.x) / 2;
    const midY = (startPoint.y + endPoint.y) / 2;

    // Ajouter un décalage pour éloigner le point intermédiaire des courbes existantes
    const offset = 50; // Ajustez cette valeur pour contrôler la courbure
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const offsetX = (dy / length) * offset; // Perpendiculaire au segment
    const offsetY = -(dx / length) * offset;

    const controlPoint = {
      x: midX + offsetX,
      y: midY + offsetY,
    };

    const curve = [
      { x: startPoint.x, y: startPoint.y },
      controlPoint, // Point de contrôle pour la courbure
      { x: endPoint.x, y: endPoint.y },
    ];

    // Vérifier si la courbe croise d'autres courbes
    if (curveIntersects(curve, curves, points)) {
      console.log("Intersection détectée, tentative avec un autre coup.");
      continue;
    }

    // Vérifier si le coup est valide pour la chaîne de caractères
    const addedPoint = {
      x: controlPoint.x,
      y: controlPoint.y,
      connections: 2,
      label: getNextLabel(points),
    };

    const updatedGraphString = generateGraphString(startPoint, addedPoint, endPoint, graphString, curveMap, points);
    if (!isValidMove(graphString, updatedGraphString)) {
      console.log("Coup invalide pour la chaîne de caractères.");
      continue;
    }

    // Mettre à jour les points et les courbes
    const updatedPoints = points.map(point => {
      if (point.label === startPoint.label || point.label === endPoint.label) {
        return { ...point, connections: point.connections + 1 };
      }
      return point;
    });
    updatedPoints.push(addedPoint);

    const updatedCurves = [...curves, curve];
    const updatedCurveMap = updateCurveMap(curveMap, startPoint, endPoint, curve);

    // Mettre à jour les états
    setPoints(updatedPoints);
    setCurves(updatedCurves);
    setGraphString(updatedGraphString);
    setCurveMap(updatedCurveMap);

    console.log("Coup joué :", { startPoint, endPoint, addedPoint });
    console.log("Chaîne mise à jour :", updatedGraphString);
    return;
  }

  console.log("Aucun coup valide trouvé.");
};