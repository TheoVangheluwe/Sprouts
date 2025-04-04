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
  let regionString;

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

    console.log(regions);
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

  console.log("départ isolé", startIsIsolated);
  console.log("fin isolé", endIsIsolated);

  // Cas n°1: Les deux points sont différents et isolés
  if (startIsIsolated && endIsIsolated && (startPoint !== endPoint)) {
    regionString = `${startPoint.label}${addedPoint.label}${endPoint.label}${addedPoint.label}`;

    // Remplacer les points isolés par la nouvelle connexion
    let updatedGraphString = currentGraphString
      .replace(new RegExp(`${startPoint.label}\\.`), `${regionString}.`)
      .replace(new RegExp(`${endPoint.label}\\.`), '');

    return updatedGraphString;
  }
  // Cas n°2: Un point est isolé et l'autre est déjà relié
  else if (startIsIsolated !== endIsIsolated) {
    const isolatedPoint = startIsIsolated ? startPoint : endPoint;
    const connectedPoint = startIsIsolated ? endPoint : startPoint;

    // Créer la nouvelle région en utilisant le point connecté comme référence
    regionString = `${connectedPoint.label}${addedPoint.label}${isolatedPoint.label}${addedPoint.label}`;
    console.log("Nouvelle région:", regionString);

    const regions = findRegions(currentGraphString);

    // Trouver la région qui contient également le point isolé
    const relevantRegion = regions.find(region => region.includes(isolatedPoint.label));
    console.log("Région pertinente:", relevantRegion);

    if (relevantRegion) {
      const commonPoint = connectedPoint.label;
      console.log("Point commun:", commonPoint);

      // Trouver l'index du point commun dans la région existante
      const insertIndex = relevantRegion.indexOf(commonPoint);
      console.log("Index d'insertion:", insertIndex);

      // Insérer la nouvelle région avant le point commun dans la région existante
      let updatedRegion = relevantRegion.slice(0, insertIndex) + regionString + relevantRegion.slice(insertIndex);

      // Supprimer le point isolé de la région mise à jour
      updatedRegion = updatedRegion.replace(new RegExp(`${isolatedPoint.label}\\.`), '');
      console.log("Région mise à jour:", updatedRegion);

      // Remplacer l'ancienne région par la nouvelle région mise à jour dans la chaîne globale
      let updatedGraphString = currentGraphString.replace(relevantRegion, updatedRegion);

      console.log("Chaîne mise à jour:", updatedGraphString);
      return updatedGraphString;
    }
  }
// Cas n°3: Les deux points sont déjà reliés
else if (!startIsIsolated && !endIsIsolated && startPoint !== endPoint) {
  let updatedGraphString = "";
  let chosenRegion = [];

  // Créer la nouvelle région
  regionString = `${startPoint.label}${addedPoint.label}${endPoint.label}`;
  console.log("Nouvelle région:", regionString);

  // On trouve toutes les régions
  const regions = findRegions(currentGraphString);
  console.log("Régions existantes:", regions);

  // Trouver les régions qui contiennent les deux points
  const relevantRegions = regions.filter(region => region.includes(startPoint.label) && region.includes(endPoint.label));
  console.log("Régions pertinentes:", relevantRegions);

  // Vérifier le nombre de régions pertinentes
  if (relevantRegions.length === 1) {
    // Cas 1: Une seule région pertinente
    chosenRegion = relevantRegions;
  } else if (relevantRegions.length === 2) {
    const areRegionsIdentical = relevantRegions.every(region => region === relevantRegions[0]);

    if (areRegionsIdentical) {
      // Cas 2: Deux régions identiques
      console.log("Les régions pertinentes sont identiques. On choisit la première arbitrairement.");
      chosenRegion.push(relevantRegions[0]);
    } else {
      // Cas 3: Deux régions différentes, chacune contenant les deux points
      console.log("Deux régions différentes, chacune contenant les deux points.");
      console.log(addedPoint)
      // Utiliser isFrontiereInRegion pour déterminer la région choisie
      if (isFrontiereInRegion(addedPoint.label, relevantRegions[0], curveMap, points)) {
        chosenRegion.push(relevantRegions[0]);
      } else {
        chosenRegion.push(relevantRegions[1]);
      }
    }
  } else {
    console.log("Plusieurs régions pertinentes détectées. Ce cas doit être géré à part.");
    return currentGraphString;
  }

  // Appeler et afficher la fonction findFrontieres avec chosenRegion
  const frontieresMap = findFrontieres(chosenRegion);
  console.log("Frontières trouvées:", frontieresMap);

  // Afficher les frontières de chaque région
  chosenRegion.forEach(region => {
    console.log(`Frontières pour la région "${region}":`, frontieresMap[region]);
  });

  chosenRegion.forEach(region => {
    const frontieres = frontieresMap[region];

    // Trouver la frontière qui contient les points de départ et d'arrivée
    const relevantFrontiere = frontieres.find(frontiere =>
      frontiere.includes(startPoint.label) && frontiere.includes(endPoint.label)
    );

    if (relevantFrontiere) {
      // Trouver les indices des points de départ et d'arrivée dans la frontière
      const startPointIndices = [...relevantFrontiere.matchAll(new RegExp(`${startPoint.label}`, 'g'))].map(match => match.index);
      const endPointIndices = [...relevantFrontiere.matchAll(new RegExp(`${endPoint.label}`, 'g'))].map(match => match.index);

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
          index = (index + 1) % relevantFrontiere.length;
          if (relevantFrontiere[index] === startPoint.label || relevantFrontiere[index] === endPoint.label) {
            break;
          }
          result += relevantFrontiere[index];
        }

        if (relevantFrontiere[startingIndexRecord] === startPoint.label && relevantFrontiere[index] === startPoint.label) {
          departToDepart = result;
          console.log("Points entre départ et départ:", departToDepart);
        } else if (relevantFrontiere[startingIndexRecord] === startPoint.label && relevantFrontiere[index] === endPoint.label) {
          departToEnd = result;
          console.log("Points entre départ et arrivée:", departToEnd);
        } else if (relevantFrontiere[startingIndexRecord] === endPoint.label && relevantFrontiere[index] === startPoint.label) {
          endToDepart = result;
          console.log("Points entre arrivée et départ:", endToDepart);
        } else if (relevantFrontiere[startingIndexRecord] === endPoint.label && relevantFrontiere[index] === endPoint.label) {
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

      //Cas n°3.1: départ-arrivé: non vide, arrivé-départ: non vide, départ-départ: vide, arrivé-arrivé: vide
      if (departToEnd !== "" && endToDepart !== '' && departToDepart === '' && endToEnd === '') {

        //Définition de la 1ère nouvelle région.
        //Il est nécessaire d'inverser la chaîne de caractère
        let reversedDepartToEnd = departToEnd.split('').reverse().join('');
        region1 = `${regionString}${reversedDepartToEnd}`;
        console.log(region1);

        //Définition de la 2ème nouvelle région.
        region2 = `${regionString}${endToDepart}`;
        console.log(region2);
      }
      //Cas n°3.2: départ-arrivé: vide, arrivé-départ: vide, départ-départ: non vide, arrivé-arrivé: vide
      else if (departToEnd === "" && endToDepart === '' && departToDepart !== '' && endToEnd === '') {

        //Définition de la 1ère nouvelle région.
        //Il est nécessaire d'inverser la chaîne de caractère

        region1 =`${regionString}`; 
        console.log(region1);

        //Définition de la 2ème nouvelle région.
        let reversedDepartToDepart = departToDepart.split('').reverse().join('');
        region2 = `${regionString}${startPoint.label}${reversedDepartToDepart}`;
        console.log(region2);
      }
      //Cas n°3.3: départ-arrivé: vide, arrivé-départ: vide, départ-départ: vide, arrivé-arrivé: non vide
      else if (departToEnd === "" && endToDepart === '' && departToDepart === '' && endToEnd !== '') {

        //Définition de la 1ère nouvelle région.
        region1 = `${regionString}`;
        console.log(region1);

        //Définition de la 2ème nouvelle région.
        //Il est nécessaire d'inverser la chaîne de caractère
        let reversedEndtoEnd = endToEnd.split('').reverse().join('');
        region2 = `${regionString}${reversedEndtoEnd}${endPoint.label}`;
        console.log(region2);
      }
      //Cas n°3.4: départ-arrivé: vide, arrivé-départ: vide, départ-départ: non vide, arrivé-arrivé: non vide
      else if (departToEnd === "" && endToDepart === '' && departToDepart !== '' && endToEnd !== '') {

        //Définition de la 1ère nouvelle région.
        //Il est nécessaire d'inverser la chaîne de caractère
        let reversedDepartToDepart = departToDepart.split('').reverse().join('');
        region1 = `${regionString}${startPoint.label}${reversedDepartToDepart}`;
        console.log(region1);

        //Définition de la 2ème nouvelle région.
        //Il est nécessaire d'inverser la chaîne de caractère
        let reversedEndtoEnd = endToEnd.split('').reverse().join('');
        region2 = `${regionString}${reversedEndtoEnd}${endPoint.label}`;
        console.log(region2);
      }
      //Cas n°3.5: départ-arrivé: non vide, arrivé-départ: non vide, départ-départ: non vide, arrivé-arrivé: non vide
      else if (departToEnd !== "" && endToDepart !== '' && departToDepart !== '' && endToEnd !== '') {

        //Définition de la 1ère nouvelle région.
        region1 = `${regionString}${endToDepart}`;
        console.log(region1);

        //Définition de la 2ème nouvelle région.
        //Il est nécessaire d'inverser la chaîne de caractère
        //let reversedEndtoEnd = endToEnd.split('').reverse().join('');
        region2 = `${regionString}${endToEnd}${endPoint.label}${endToDepart}${startPoint.label}${departToDepart}`;
        console.log(region2);
      } else {
        console.log("Un cas non prévu est apparu !");
      }

      // Répartir les frontières non pertinentes entre region1 et region2
      const allFrontieres = Object.values(frontieresMap).flat();
      const nonRelevantFrontieres = allFrontieres.filter(frontiere => !frontiere.includes(startPoint.label) || !frontiere.includes(endPoint.label));
      console.log("Frontières non pertinentes:", nonRelevantFrontieres);

      nonRelevantFrontieres.forEach(frontiere => {
        if (isFrontiereInRegion(frontiere, region1, curveMap, points)) {
          //updatedGraphString = updatedGraphString.replace('!', `${frontiere}.}!`);
          region1 += `.${frontiere}`;
        } else {
          //updatedGraphString = updatedGraphString.replace('!', `${frontiere}.}!`);
          region2 += `.${frontiere}`;
        }
      });

      // Supprimer l'ancienne frontière et son point qui suit
      updatedGraphString = currentGraphString.replace(region, '').replace(/\.\./g, '.').replace(/(^|})}/g, '');;

      // Ajout des nouvelles régions avant "!"
      if (region1 && region2) {
        updatedGraphString = updatedGraphString.replace('!', `${region1}.}${region2}.}!`);
      }

      console.log("Chaîne mise à jour:", updatedGraphString);
    }
  });
  return updatedGraphString;
}

  // Cas n°4: Le point de départ est le point d'arrivée (boucle)
  else if (startPoint === endPoint) {
    if (startIsIsolated) {
      regionString = `${startPoint.label}${addedPoint.label}`;

      // Remplacer le point isolé par la nouvelle connexion
      let updatedGraphString = currentGraphString.replace(
        new RegExp(`${startPoint.label}\\.`),
        `${regionString}.`
      );

      // Ajouter la nouvelle région à la fin
      updatedGraphString = updatedGraphString.replace('!', `${regionString}.}!`);

      return updatedGraphString;
    } else {
      // Cas où le point est déjà connecté
      const commonPoint = startPoint.label;

      // Trouver la région existante contenant le point commun
      const regions = findRegions(currentGraphString);
      const connectedRegions = regions.filter(region => region.includes(commonPoint));

      if (connectedRegions.length > 0) {
        // Créer la nouvelle région pour la boucle
        regionString = `${commonPoint}${addedPoint.label}`;

        // Trouver l'index du point commun dans la région existante
        const relevantRegion = connectedRegions[0]; // Assuming we take the first relevant region
        const insertIndex = relevantRegion.indexOf(commonPoint);

        // Insérer la nouvelle région avant le point commun dans la région existante
        const updatedRegion = relevantRegion.slice(0, insertIndex) + regionString + relevantRegion.slice(insertIndex);

        // Mettre à jour la chaîne globale
        let updatedGraphString = currentGraphString.replace(relevantRegion, updatedRegion);

        // Ajouter la nouvelle région à la fin
        updatedGraphString = updatedGraphString.replace('!', `${regionString}.}!`);

        return updatedGraphString;
      }
    }
  }
  return currentGraphString;
};

const isFrontiereInRegion = (frontiere, region, curveMap, points) => {
  
  // Obtenir la première lettre de la frontière
  const firstPointLabel = frontiere[0];
  console.log(firstPointLabel);

  // Obtenir les coordonnées du premier point de la frontière
  const firstPoint = points.find(point => point.label === firstPointLabel);
  console.log(firstPoint);
  if (!firstPoint) {
    return false; // Si le point n'est pas trouvé, il n'est pas dans la région
  }

  // Obtenir les courbes associées à la région
  const regionCurves = [];
  region.split('').forEach(pointLabel => {
    const curves = curveMap.get(pointLabel) || [];
    console.log(curves);
    curves.forEach(curveInfo => {
      if (curveInfo.role === 'start' && region.includes(curveInfo.curve[curveInfo.curve.length - 1].label)) {
        regionCurves.push(...curveInfo.curve);
        console.log("ajouté!");
      }
    });
  });

  // Calculer l'espace formé par les courbes de la région
  const regionPolygon = regionCurves.flat().map(point => [point.x, point.y]);
  console.log(regionPolygon);

  // Vérifier si le premier point de la frontière est dans l'espace de la région
  const isInRegion = isPointInPolygon([firstPoint.x, firstPoint.y], regionPolygon);
  console.log(isInRegion);

  return isInRegion;
};


// Fonction pour vérifier si un point est dans un polygone
const isPointInPolygon = (point, polygon) => {
  const x = point[0];
  const y = point[1];
  let inside = false;
  console.log(x);
  console.log(y);

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    console.log(intersect);
    if (intersect) inside = !inside;
  }

  return inside;
};
