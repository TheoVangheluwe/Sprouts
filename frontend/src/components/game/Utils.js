export const drawGame = (canvasRef, pointsToDraw, curvesToDraw, tempCurve = null) => {
  const canvas = canvasRef.current;
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    pointsToDraw.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "black";
      ctx.fill();
      ctx.fillText(point.label, point.x + 10, point.y + 5);
    });
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
  if (curvePoints.some(point => !points.some(p => p.x === point.x && p.y === point.y))) {
    console.error("Courbe contient des points non valides");
    return;
  }

  let updatedPoints;
  if (p1 === p2) {
    updatedPoints = points.map(point => {
      if (point === p1) {
        return { ...point, connections: point.connections + 2 };
      }
      return point;
    });
  } else {
    updatedPoints = points.map(point => {
      if (point === p1 || point === p2) {
        return { ...point, connections: point.connections + 1 };
      }
      return point;
    });
  }
  setPoints(updatedPoints);
  setCurves(prevCurves => [...prevCurves, curvePoints]);
};

export const curveIntersects = (newCurve, curves) => {
  for (let curve of curves) {
    for (let i = 0; i < newCurve.length - 1; i++) {
      const seg1Start = newCurve[i];
      const seg1End = newCurve[i + 1];
      for (let j = 0; j < curve.length - 1; j++) {
        const seg2Start = curve[j];
        const seg2End = curve[j + 1];
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

export const generateGraphString = (points, curves) => {
  let graphStr = "";
  const regions = identifyRegions(curves);
  regions.forEach((region, index) => {
    graphStr += `${region.map(boundary => boundary.map(point => point.label).join('.')).join('.')}.}`;
  });
  graphStr += '!';
  return graphStr;
};

export const identifyRegions = (curves) => {
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

  curves.forEach(curve => {
    const boundaries = findBoundaries(curve, 0, curve.length - 1);
    if (boundaries.length > 0) {
      regions.push(boundaries);
    }
  });

  return regions;
};
