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
            ctx.arc(physicalPoint.x, physicalPoint.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = point.connections >= 3 ? "red" : "black";
            ctx.fill();

            if (point.label) {
                // Ajuster la taille du texte en fonction de l'échelle
                const fontSize = 12 * Math.min(scale.x, scale.y);
                ctx.font = `${fontSize}px Arial`;
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

    // Convertir en coordonnées logiques [0,1000]×[0,1000]
    const scale = {
        x: canvas.width / LOGICAL_WIDTH,
        y: canvas.height / LOGICAL_HEIGHT
    };

    return toLogicalCoords(physicalX, physicalY, scale);
};

// Les fonctions suivantes n'ont pas besoin d'être modifiées car elles travaillent
// déjà avec des coordonnées logiques après la conversion par getMousePos
export const getNearPoint = (x, y, points, threshold = 15) => {
    return points.find(point => Math.hypot(point.x - x, point.y - y) <= threshold) || null;
};

export const canConnect = (p1, p2) => {
    if (p1 === p2) {
        return p1.connections <= 1;
    } else {
        // Pour les connexions entre points différents, limiter à 3 connexions
        return p1.connections < 3 && p2.connections < 3;
    }
};

export const connectPoints = (p1, p2, curvePoints, points, setPoints, setCurves) => {
    console.log("Connecting points:", p1, p2);

    // Update point connections
    let updatedPoints = points.map(point => {
        if (point.label === p1.label || point.label === p2.label) {
            const newConnections = point.connections + 1;
            console.log(`Updating point ${point.label} with ${newConnections} connections`);
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

export const curveIntersects = (newCurve, curves = [], points) => {
    // Si la courbe est invalide ou trop courte, pas d'intersection
    if (!newCurve || newCurve.length < 2) return false;

    // Fonction utilitaire pour vérifier si un point est proche d'un point officiel
    const isNearOfficialPoint = (p) => {
        return points.some(point =>
            Math.hypot(point.x - p.x, point.y - p.y) < 10 // Seuil de tolérance plus élevé
        );
    };

    // Vérifier les intersections avec les courbes existantes
    for (let curve of curves) {
        // Gérer différents formats de courbes
        const curvePoints = Array.isArray(curve.points) ? curve.points :
                          Array.isArray(curve) ? curve : [];

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

                // Si les segments sont aux extrémités (points de jeu), pas d'intersection
                if ((isNearOfficialPoint(seg1Start) && isNearOfficialPoint(seg2Start)) ||
                    (isNearOfficialPoint(seg1Start) && isNearOfficialPoint(seg2End)) ||
                    (isNearOfficialPoint(seg1End) && isNearOfficialPoint(seg2Start)) ||
                    (isNearOfficialPoint(seg1End) && isNearOfficialPoint(seg2End))) {
                    continue;
                }

                // Vérifier l'intersection
                if (segmentsIntersect(seg1Start, seg1End, seg2Start, seg2End)) {
                    console.log("Intersection found between segments:",
                                seg1Start, seg1End, "and", seg2Start, seg2End);
                    return true;
                }
            }
        }
    }

    // Vérifier l'auto-intersection de la nouvelle courbe
    // On ne teste que les segments non adjacents
    for (let i = 0; i < newCurve.length - 1; i++) {
        const seg1Start = newCurve[i];
        const seg1End = newCurve[i + 1];

        // Ignorer les segments très courts
        if (Math.hypot(seg1End.x - seg1Start.x, seg1End.y - seg1Start.y) < 3) continue;

        // Tester uniquement avec des segments non adjacents (au moins 2 segments d'écart)
        for (let j = i + 3; j < newCurve.length - 1; j++) {
            const seg2Start = newCurve[j];
            const seg2End = newCurve[j + 1];

            // Ignorer les segments très courts
            if (Math.hypot(seg2End.x - seg2Start.x, seg2End.y - seg2Start.y) < 3) continue;

            // Vérifier l'intersection
            if (segmentsIntersect(seg1Start, seg1End, seg2Start, seg2End)) {
                console.log("Self-intersection found between segments:",
                            seg1Start, seg1End, "and", seg2Start, seg2End);
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

// Nouvelle implémentation plus robuste de l'algorithme d'intersection
export const segmentsIntersect = (A, B, C, D) => {
    // Epsilon pour la comparaison à virgule flottante
    const EPSILON = 1e-9;

    // Fonction pour calculer la distance entre un point et un segment
    const distancePointToSegment = (p, s1, s2) => {
        const lengthSquared = Math.pow(s2.x - s1.x, 2) + Math.pow(s2.y - s1.y, 2);
        if (lengthSquared === 0) return Math.hypot(p.x - s1.x, p.y - s1.y);

        let t = ((p.x - s1.x) * (s2.x - s1.x) + (p.y - s1.y) * (s2.y - s1.y)) / lengthSquared;
        t = Math.max(0, Math.min(1, t));

        const proj = {
            x: s1.x + t * (s2.x - s1.x),
            y: s1.y + t * (s2.y - s1.y)
        };

        return Math.hypot(p.x - proj.x, p.y - proj.y);
    };

    // Fonction pour vérifier si deux points sont presque identiques
    const pointsAlmostEqual = (p1, p2) => {
        return Math.abs(p1.x - p2.x) < EPSILON && Math.abs(p1.y - p2.y) < EPSILON;
    };

    // Si deux extrémités de segments sont les mêmes, ce n'est pas considéré comme une intersection
    if (pointsAlmostEqual(A, C) || pointsAlmostEqual(A, D) ||
        pointsAlmostEqual(B, C) || pointsAlmostEqual(B, D)) {
        return false;
    }

    // Vérifier si les points d'un segment sont proches de l'autre segment
    const PROXIMITY_THRESHOLD = 1.0; // pixels logiques
    if (distancePointToSegment(A, C, D) < PROXIMITY_THRESHOLD ||
        distancePointToSegment(B, C, D) < PROXIMITY_THRESHOLD ||
        distancePointToSegment(C, A, B) < PROXIMITY_THRESHOLD ||
        distancePointToSegment(D, A, B) < PROXIMITY_THRESHOLD) {
        return false; // Les segments sont trop proches, mais ne se croisent pas réellement
    }

    // Utiliser la méthode des déterminants pour vérifier l'intersection
    const det = (a, b, c, d) => a * d - b * c;

    const dx1 = B.x - A.x;
    const dy1 = B.y - A.y;
    const dx2 = D.x - C.x;
    const dy2 = D.y - C.y;

    const d = det(dx1, -dx2, dy1, -dy2);

    // Si les lignes sont parallèles, elles ne s'intersectent pas (ou coïncident)
    if (Math.abs(d) < EPSILON) return false;

    const s = det(C.x - A.x, -dx2, C.y - A.y, -dy2) / d;
    const t = det(dx1, C.x - A.x, dy1, C.y - A.y) / d;

    // Vérifier si l'intersection est sur les deux segments
    return (s >= 0 && s <= 1 && t >= 0 && t <= 1);
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
