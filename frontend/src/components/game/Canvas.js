import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { drawGame, getMousePos, getNearPoint, canConnect, connectPoints, curveIntersects, curveLength, getNextLabel, getClosestPointOnCurve, isPointTooClose } from './Utils';

const Canvas = ({ points, setPoints, curves, setCurves, isMultiplayer }) => {
  const canvasRef = useRef(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentCurve, setCurrentCurve] = useState([]);
  const [awaitingPointPlacement, setAwaitingPointPlacement] = useState(false);

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
    const newPoints = [];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.3;
    const n = 3;
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      newPoints.push({ x, y, connections: 0, label: alphabet[i] });
    }
    setPoints(newPoints);
  }, [setPoints]);

  useEffect(() => {
    if (isMultiplayer) {
      // Logique pour écouter les événements WebSocket et mettre à jour l'état du jeu
    }
  }, [isMultiplayer]);

  const handleMouseDown = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getMousePos(canvas, event);

    if (awaitingPointPlacement) {
      const closestPoint = getClosestPointOnCurve(pos.x, pos.y, currentCurve);
      if (closestPoint) {
        if (!isPointTooClose(closestPoint.x, closestPoint.y, points)) {
          const newPoint = { x: closestPoint.x, y: closestPoint.y, connections: 2, label: getNextLabel(points) };
          setPoints(prevPoints => [...prevPoints, newPoint]);
          console.log("points:", points)
          setCurves(prevCurves => [...prevCurves, currentCurve]);
          setAwaitingPointPlacement(false);
          setCurrentCurve([]);
          toast.success("Point placé.", { autoClose: 1500 });
        } else {
          toast.error("Le point est trop proche d'un autre.", { autoClose: 1500 });
        }
      } else {
        toast.error("Cliquez plus près de la courbe.", { autoClose: 1500 });
      }
    } else {
      const start = getNearPoint(pos.x, pos.y, points);
      if (start) {
        setSelectedPoint(start);
        setIsDrawing(true);
        setCurrentCurve([{ x: start.x, y: start.y }]);
      }
    }
  };

  const handleMouseUp = (event) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getMousePos(canvas, event);
    const endPoint = getNearPoint(pos.x, pos.y, points);

    if (endPoint && selectedPoint && canConnect(selectedPoint, endPoint)) {
      const adjustedCurve = [...currentCurve, { x: endPoint.x, y: endPoint.y }];

      if (curveIntersects(adjustedCurve, curves, points)) {
        toast.error("Intersection détectée.", { autoClose: 1500 });
        setCurrentCurve([]);
      } else if (curveLength(adjustedCurve) < 50) {
        toast.error("Courbe trop courte.", { autoClose: 1500 });
        setCurrentCurve([]);
      } else {
        connectPoints(selectedPoint, endPoint, adjustedCurve, points, setPoints, setCurves);
        setAwaitingPointPlacement(true);
      }
    } else {
      if (!endPoint) {
        toast.error("Destination invalide.", { autoClose: 1500 });
      } else if (!canConnect(selectedPoint, endPoint)) {
        toast.error("Trop de connexions sur le point.", { autoClose: 1500 });
      }
      setCurrentCurve([]);
    }
    setIsDrawing(false);
  };

  const validateCurve = (curve) => {
    return curve.every(point => point && point.x && point.y);
  };

  const handleMouseMove = (event) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getMousePos(canvas, event);

    setCurrentCurve(prevCurve => {
      const newCurve = [...prevCurve, { x: pos.x, y: pos.y }];
      if (!validateCurve(newCurve)) {
        return prevCurve;
      }
      if (newCurve.length > 1) {
        drawGame(canvasRef, points, curves, newCurve);
      }
      return newCurve;
    });
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
