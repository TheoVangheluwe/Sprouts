export const drawGame = (canvasRef, pointsToDraw = [], curvesToDraw = [], tempCurve = null) => {
  const canvas = canvasRef.current;
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw curves
    if (Array.isArray(curvesToDraw)) {
      curvesToDraw.forEach(curve => {
        if (curve.length > 0) {
          ctx.beginPath();
          ctx.moveTo(curve[0].x, curve[0].y);
          for (let i = 1; i < curve.length; i++) {
            ctx.lineTo(curve[i].x, curve[i].y);
          }
          ctx.strokeStyle = "blue";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    }

    // Draw points
    if (Array.isArray(pointsToDraw)) {
      pointsToDraw.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "black";
        ctx.fill();
        if (point.label) {
          ctx.fillText(point.label, point.x + 10, point.y + 5);
        }
      });
    }

    // Draw temporary curve
    if (Array.isArray(tempCurve) && tempCurve.length > 0) {
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
  console.log("Checking intersections for newCurve:", newCurve);
  console.log("Existing curves:", curves);
  console.log("Points:", points);

  for (let curve of curves) {
    for (let i = 0; i < newCurve.length - 1; i++) {
      const seg1Start = newCurve[i];
      const seg1End = newCurve[i + 1];
      for (let j = 0; j < curve.length - 1; j++) {
        const seg2Start = curve[j];
        const seg2End = curve[j + 1];

        console.log("Checking segments:", seg1Start, seg1End, seg2Start, seg2End);

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

      console.log("Checking segments within newCurve:", seg1Start, seg1End, seg2Start, seg2End);

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
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let letter of alphabet) {
    if (!usedLabels.includes(letter)) {
      return letter;
    }
  }
  return '';
};

export const identifyRegions = (curves = []) => {
  const regions = [];
  const visited = new Set();

  const findBoundaries = (curve, startIndex, endIndex) => {
    const boundaries = [];
    let currentIndex = startIndex;
    while (currentIndex <= endIndex) {
      const boundary = [];
      let i = currentIndex;
      while (i <= endIndex && !visited.has(`${curve[i].x},${curve[i].y}`)) {
        boundary.push(curve[i]);
        visited.add(`${curve[i].x},${curve[i].y}`);
        i++;
      }
      if (boundary.length > 0) {
        boundaries.push(boundary);
      }
      currentIndex = i;
    }
    return boundaries;
  };

  console.log("Curves to be processed: ", curves);
  curves.forEach(curve => {
    const boundaries = findBoundaries(curve, 0, curve.length - 1);
    if (boundaries.length > 0) {
      regions.push(boundaries);
    }
  });

  return regions;
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