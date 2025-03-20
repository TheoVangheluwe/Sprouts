import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { drawGame, getMousePos, getNearPoint, canConnect, connectPoints, curveIntersects, curveLength, getNextLabel, generateGraphString } from './Utils';

const Canvas = ({ points, setPoints, curves, setCurves, setGrapheChaine }) => {
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
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

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
    const graphStr = generateGraphString(points, curves);
    setGrapheChaine(graphStr);
    drawGame(canvasRef, points, curves, currentCurve);
  }, [points, curves, currentCurve]);

  const handleMouseDown = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getMousePos(canvas, event);

    if (awaitingPointPlacement) {
      const distanceToCurve = currentCurve.map(p => Math.hypot(p.x - pos.x, p.y - pos.y));
      const minDistance = Math.min(...distanceToCurve);
      if (minDistance <= 15) {
        const newPoint = { x: pos.x, y: pos.y, connections: 2, label: getNextLabel(points) };
        setPoints(prevPoints => [...prevPoints, newPoint]);
        setCurves(prevCurves => [...prevCurves, currentCurve]);
        setAwaitingPointPlacement(false);
        setCurrentCurve([]);
        toast.success("Point placé.", { autoClose: 1500 });
      } else {
        toast.error("Cliquez plus près de la courbe.", { autoClose: 1500 });
      }
    } else {
      const start = getNearPoint(pos.x, pos.y, points);
      if (start) {
        setSelectedPoint(start);
        setIsDrawing(true);
        setCurrentCurve([pos]);
      }
    }
  };

  const handleMouseMove = (event) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getMousePos(canvas, event);
    setCurrentCurve(prevCurve => {
      const newCurve = [...prevCurve, pos];
      drawGame(canvasRef, points, curves, newCurve);
      return newCurve;
    });
  };

  const handleMouseUp = (event) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getMousePos(canvas, event);
    const endPoint = getNearPoint(pos.x, pos.y, points);
    if (endPoint && selectedPoint && canConnect(selectedPoint, endPoint)) {
      if (curveIntersects(currentCurve, curves)) {
        toast.error("Intersection détectée.", { autoClose: 1500 });
        setCurrentCurve([]);
      } else if (curveLength(currentCurve) < 50) {
        toast.error("Courbe trop courte.", { autoClose: 1500 });
        setCurrentCurve([]);
      } else {
        toast.success("Placez un point sur la courbe.", { autoClose: 1500 });
        connectPoints(selectedPoint, endPoint, currentCurve, points, setPoints, setCurves);
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
