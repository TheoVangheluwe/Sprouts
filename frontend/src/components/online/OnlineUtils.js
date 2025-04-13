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

export { toPhysicalCoords, toLogicalCoords, LOGICAL_WIDTH, LOGICAL_HEIGHT };