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

export const generateGraphString = (startPoint, addedPoint, endPoint, currentGraphString) => {
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
  const findFrontieres = (graphString) => {
    const frontiereRegex = /(^|[.{}])([a-zA-Z]{2,})\./g;
    const frontieres = [];
    let match;
    while ((match = frontiereRegex.exec(graphString)) !== null) {
      frontieres.push(match[2]);
    }
    return frontieres;
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
    /*const connectedRegions = regions.filter(region => region.includes(connectedPoint.label));
    console.log("Régions connectées:", connectedRegions);*/

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
    // Ajoutez ici la logique pour gérer les points déjà reliés
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
