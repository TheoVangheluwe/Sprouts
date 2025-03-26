import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  drawGame,
  getMousePos,
  getNearPoint,
  canConnect,
  connectPoints,
  curveIntersects,
  curveLength,
  getNextLabel,
  getClosestPointOnCurve,
  isPointTooClose,
  updateConnections,
  generateGraphString,
  findRegions,
} from './Utils';

const Canvas = ({ points, setPoints, curves, setCurves }) => {
  const canvasRef = useRef(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentCurve, setCurrentCurve] = useState([]);
  const [awaitingPointPlacement, setAwaitingPointPlacement] = useState(false);
  const [connections, setConnections] = useState({});
  const [endPoint, setEndPoint] = useState(null);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawGame(canvasRef, points, curves, currentCurve);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [points, curves, currentCurve]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.3;
    const n = 3;
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    const newPoints = Array.from({ length: n }, (_, i) => {
      const angle = (2 * Math.PI * i) / n;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        connections: 0,
        label: alphabet[i]
      };
    });

    // Initialiser les connexions pour chaque point
    const initialConnections = {};
    newPoints.forEach(point => {
      initialConnections[point.label] = [];
    });

    setPoints(newPoints);
    setConnections(initialConnections);
  }, [setPoints]);

  const handleMouseDown = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getMousePos(canvas, event);

    if (awaitingPointPlacement) {
      handlePointPlacement(pos);
    } else {
      handleDrawStart(pos);
    }
  };

  const handlePointPlacement = (pos) => {
    const closestPoint = getClosestPointOnCurve(pos.x, pos.y, currentCurve);
    if (closestPoint && !isPointTooClose(closestPoint.x, closestPoint.y, points)) {
      const newPoint = { x: closestPoint.x, y: closestPoint.y, connections: 2, label: getNextLabel(points) };
      setPoints(prevPoints => [...prevPoints, newPoint]);
      setCurves(prevCurves => [...prevCurves, currentCurve]);
      setAwaitingPointPlacement(false);
      setCurrentCurve([]); // Réinitialiser la courbe après placement
      toast.success("Point placé.", { autoClose: 1500 });

      // Mettre à jour les connexions après placement du point
      const updatedConnections = updateConnections(selectedPoint.label, endPoint.label, newPoint.label, connections);
      setConnections(updatedConnections);
      console.log("Updated Connections:", updatedConnections);

      const regions = findRegions(connections);
      console.log("Régions trouvées:", regions);

      // Générer la chaîne de caractères
      const graphStr = generateGraphString(updatedConnections);
      console.log("Graph String:", graphStr);
    } else {
      toast.error(closestPoint ? "Le point est trop proche d'un autre." : "Cliquez plus près de la courbe.", { autoClose: 1500 });
    }
  };

  const handleDrawStart = (pos) => {
    const start = getNearPoint(pos.x, pos.y, points);
    if (start) {
      setSelectedPoint(start);
      setIsDrawing(true);
      setCurrentCurve([{ x: start.x, y: start.y }]);
    }
  };

  const handleMouseUp = (event) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas not found.");
      return;
    }

    const pos = getMousePos(canvas, event);
    const detectedEndPoint = getNearPoint(pos.x, pos.y, points);

    if (detectedEndPoint && selectedPoint && canConnect(selectedPoint, detectedEndPoint)) {
      const adjustedCurve = [...currentCurve, { x: detectedEndPoint.x, y: detectedEndPoint.y }];

      if (curveIntersects(adjustedCurve, curves, points)) {
        toast.error("Intersection détectée.", { autoClose: 1500 });
        setCurrentCurve([]); // Réinitialiser la courbe en cas d'intersection
        drawGame(canvasRef, points, curves, []); // Redessiner sans la courbe actuelle
      } else if (curveLength(adjustedCurve) < 50) {
        toast.error("Courbe trop courte.", { autoClose: 1500 });
        setCurrentCurve([]); // Réinitialiser la courbe si trop courte
      } else {
        connectPoints(selectedPoint, detectedEndPoint, adjustedCurve, points, setPoints, setCurves);
        setEndPoint(detectedEndPoint); // Mettre à jour endPoint dans l'état
        setAwaitingPointPlacement(true);
      }
    } else {
      toast.error(detectedEndPoint ? "Trop de connexions sur le point." : "Destination invalide.", { autoClose: 1500 });
      setCurrentCurve([]); // Réinitialiser la courbe si la connexion échoue
    }

    setIsDrawing(false);
  };

  const handleMouseMove = (event) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getMousePos(canvas, event);
    const newCurve = [...currentCurve, { x: pos.x, y: pos.y }];

    if (validateCurve(newCurve)) {
      drawGame(canvasRef, points, curves, newCurve);
      setCurrentCurve(newCurve);
    }
  };

  const validateCurve = (curve) => {
    return curve.every(point => point && point.x != null && point.y != null);
  };

  return (
    <div id="canvas-container">
      <canvas
        ref={canvasRef}
        style={{ border: "1px solid black" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
};

export default Canvas;
