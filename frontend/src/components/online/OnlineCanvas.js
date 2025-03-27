import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { drawGame, getMousePos, getNearPoint, canConnect, connectPoints, curveIntersects, curveLength, getNextLabel, getClosestPointOnCurve, isPointTooClose } from './OnlineUtils';

const OnlineCanvas = ({ points, setPoints, curves = [], setCurves, currentPlayer, myTurn, onMove }) => {
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
        drawGame(canvasRef, points || [], curves || [], currentCurve); // Redraw the game
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
    if (myTurn) {
      console.log("It's your turn to play.");
    } else {
      console.log("Waiting for the other player to play.");
    }
  }, [myTurn]);

  const handleMouseDown = (event) => {
    if (!myTurn) {
      console.log("Not player's turn");
      return; // Ne pas permettre de dessiner si ce n'est pas le tour du joueur
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getMousePos(canvas, event);
    console.log("Mouse down at position:", pos);

    if (awaitingPointPlacement) {
      const closestPoint = getClosestPointOnCurve(pos.x, pos.y, currentCurve);
      if (closestPoint) {
        if (!isPointTooClose(closestPoint.x, closestPoint.y, points)) {
          const newPoint = { x: closestPoint.x, y: closestPoint.y, connections: 2, label: getNextLabel(points) };
          console.log("Placing new point:", newPoint);
          setPoints(prevPoints => [...prevPoints, newPoint]);
          setCurves(prevCurves => [...prevCurves, currentCurve]);
          setAwaitingPointPlacement(false);
          setCurrentCurve([]);
          toast.success("Point placé.", { autoClose: 1500 });
          onMove({ type: 'place_point', point: newPoint, curve: currentCurve });
        } else {
          toast.error("Le point est trop proche d'un autre.", { autoClose: 1500 });
        }
      } else {
        toast.error("Cliquez plus près de la courbe.", { autoClose: 1500 });
      }
    } else {
      const start = getNearPoint(pos.x, pos.y, points);
      if (start) {
        console.log("Starting new curve from point:", start);
        setSelectedPoint(start);
        setIsDrawing(true);
        setCurrentCurve([{ x: start.x, y: start.y }]);
      } else {
        console.log("No point near start position");
      }
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
    const endPoint = getNearPoint(pos.x, pos.y, points);
    console.log("Mouse up at position:", pos);

    if (endPoint && selectedPoint && canConnect(selectedPoint, endPoint)) {
      const adjustedCurve = [...currentCurve, { x: endPoint.x, y: endPoint.y }];
      console.log("Connecting to end point:", endPoint);

      if (curveIntersects(adjustedCurve, curves, points)) {
        toast.error("Intersection détectée.", { autoClose: 1500 });
        setCurrentCurve([]); // Réinitialiser la courbe
      } else if (curveLength(adjustedCurve) < 50) {
        toast.error("Courbe trop courte.", { autoClose: 1500 });
        setCurrentCurve([]); // Réinitialiser la courbe
      } else {
        connectPoints(selectedPoint, endPoint, adjustedCurve, points, setPoints, setCurves);
        setAwaitingPointPlacement(true);
        onMove({ type: 'draw_curve', curve: adjustedCurve });
      }
    } else {
      if (!endPoint) {
        toast.error("Destination invalide.", { autoClose: 1500 });
      } else if (!canConnect(selectedPoint, endPoint)) {
        toast.error("Trop de connexions sur le point.", { autoClose: 1500 });
      }
      setCurrentCurve([]); // Réinitialiser la courbe
    }
    setIsDrawing(false);
    setSelectedPoint(null); // Réinitialiser le point sélectionné
  };

  const handleMouseMove = (event) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getMousePos(canvas, event);

    setCurrentCurve(prevCurve => {
      const newCurve = [...prevCurve, { x: pos.x, y: pos.y }];
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
        onMouseLeave={handleMouseUp} // Ajoutez ceci pour arrêter de dessiner lorsque la souris quitte le canvas
      />
    </div>
  );
};

export default OnlineCanvas;