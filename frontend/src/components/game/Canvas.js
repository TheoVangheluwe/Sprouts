import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { drawGame, getMousePos, getNearPoint, canConnect, connectPoints, curveIntersects, curveLength, getNextLabel, generateGraphString, getClosestPointOnCurve } from './Utils';

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
      const closestPoint = getClosestPointOnCurve(pos.x, pos.y, currentCurve);
      if (closestPoint) {
        const newPoint = { x: closestPoint.x, y: closestPoint.y, connections: 2, label: getNextLabel(points) };
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
    const endPoint = getNearPoint(pos.x, pos.y, points, 30); // Increased threshold for end point detection

    if (endPoint && selectedPoint && canConnect(selectedPoint, endPoint)) {
      // Adjust the end of the curve to the nearest point
      let adjustedCurve = [...currentCurve];

      // Remove the last few points if necessary to snap to the nearest point
      const lastPointIndex = adjustedCurve.length - 1;
      if (Math.hypot(adjustedCurve[lastPointIndex].x - endPoint.x, adjustedCurve[lastPointIndex].y - endPoint.y) > 30) {
        adjustedCurve = adjustedCurve.slice(0, -1); // Remove the last point
      }

      adjustedCurve.push(endPoint);

      if (curveIntersects(adjustedCurve, curves)) {
        toast.error("Intersection détectée.", { autoClose: 1500 });
        setCurrentCurve([]);
      } else if (curveLength(adjustedCurve) < 50) {
        toast.error("Courbe trop courte.", { autoClose: 1500 });
        setCurrentCurve([]);
      } else {
        toast.success("Placez un point sur la courbe.", { autoClose: 1500 });
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
