import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { drawGame, getMousePos, getNearPoint, canConnect, connectPoints, curveIntersects, curveLength, getNextLabel, getClosestPointOnCurve, isPointTooClose, generateInitialGraphString, generateGraphString, updateCurveMap } from './PVEUtils';

const PVECanvas = ({ points, setPoints, curves, setCurves, currentPlayer, handlePlayerChange, handleGameOver, initialPointCount, addMove }) => {
  const canvasRef = useRef(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentCurve, setCurrentCurve] = useState([]);
  const [awaitingPointPlacement, setAwaitingPointPlacement] = useState(false);
  const [graphString, setGraphString] = useState(''); // État pour stocker la chaîne de caractères
  const [curveMap, setCurveMap] = useState(new Map()); // État pour stocker la curveMap
  const [endPoint, setEndPoint] = useState(null); // État pour stocker endPoint

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = document.getElementById("canvas-container");
      if (canvas && container) {
        // 🔒 Dimensions fixes en pixels
        canvas.width = container.clientWidth;
        canvas.height = 500;
        drawGame(canvasRef, points, curves, currentCurve);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [points, curves, currentCurve]);

  useEffect(() => {
    initializePoints(initialPointCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log("Chaîne mise à jour: ", graphString);
    checkGameOver();
  }, [graphString]);

  const initializePoints = (initialPointCount) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newPoints = generateInitialPoints(canvas, initialPointCount);
    setPoints(newPoints);

    const initialGraphString = generateInitialGraphString(newPoints);
    setGraphString(initialGraphString);
    console.log("Initial graph as string:", initialGraphString);
  };

  const generateInitialPoints = (canvas, initialPointCount) => {
    const minDistance = 100; // Distance minimale entre les points
    const width = canvas.width;
    const height = canvas.height;
    const newPoints = [];

    const generateRandomPoint = () => {
      const x = Math.round(Math.random() * width);
      const y = Math.round(Math.random() * height);
      return { x, y };
    };

    while (newPoints.length < initialPointCount) {
      const newPoint = generateRandomPoint();
      if (newPoints.every(point => Math.hypot(point.x - newPoint.x, point.y - newPoint.y) >= minDistance)) {
        newPoint.connections = 0;
        newPoint.label = getNextLabel(newPoints);
        newPoints.push(newPoint);
      }
    }

    return newPoints;
  };

  const checkGameOver = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/is_game_over/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chain: graphString }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log("la partie est finie:", data.game_over);
      handleGameOver(data.game_over);
    } catch (error) {
      console.error('Error checking game over:', error);
    }
  };

  const handleMouseDown = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getMousePos(canvas, event);

    if (awaitingPointPlacement) {
      const closestPoint = getClosestPointOnCurve(Math.round(pos.x), Math.round(pos.y), currentCurve);
      if (closestPoint) {
        if (!isPointTooClose(Math.round(closestPoint.x), Math.round(closestPoint.y), points)) {
          const newPoint = { x: Math.round(closestPoint.x), y: Math.round(closestPoint.y), connections: 2, label: getNextLabel(points) };
          setCurves(prevCurves => [...prevCurves, currentCurve]);

          const test = points;
          test.push(newPoint);

          // Mettre à jour la chaîne de caractères après avoir placé le point
          const updatedGraphString = generateGraphString(selectedPoint, newPoint, endPoint, graphString, curveMap, test);
          setGraphString(updatedGraphString);

          // Ajouter le coup à l'historique
          //addMove(`${selectedPoint.label} -> ${newPoint.label} : ${closestPoint.label}`);

          setAwaitingPointPlacement(false);
          setCurrentCurve([]);
          toast.success("Point placé.", { autoClose: 1500 });
          handlePlayerChange(); // Changer de joueur après avoir placé le point
        } else {
          toast.error("Le point est trop proche d'un autre.", { autoClose: 1500 });
        }
      } else {
        toast.error("Cliquez plus près de la courbe.", { autoClose: 1500 });
      }
    } else {
      const start = getNearPoint(Math.round(pos.x), Math.round(pos.y), points);
      if (start) {
        setSelectedPoint(start);
        setIsDrawing(true);
        setCurrentCurve([{ x: Math.round(start.x), y: Math.round(start.y) }]);
      }
    }
  };

  const handleMouseUp = (event) => {
    console.log("handleMouseUp triggered"); // Log de début de la fonction
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas not found.");
      return;
    }

    const pos = getMousePos(canvas, event);
    console.log("Mouse position on mouseUp: ", pos); // Log des coordonnées du curseur

    const end = getNearPoint(Math.round(pos.x), Math.round(pos.y), points);
    console.log("End point found: ", end); // Log du point trouvé

    if (end && selectedPoint && canConnect(selectedPoint, end)) {
      setEndPoint(end); // Stocker endPoint dans l'état
      const addedPoint = { x: Math.round(pos.x), y: Math.round(pos.y), connections: 0, label: getNextLabel(points) };
      const adjustedCurve = [...currentCurve, addedPoint, end];
      console.log("Adjusted curve: ", adjustedCurve); // Log de la courbe ajustée

      if (curveIntersects(adjustedCurve, curves, points)) {
        toast.error("Intersection détectée.", { autoClose: 1500 });
        setCurrentCurve([]); // Réinitialiser la courbe
      } else if (curveLength(adjustedCurve) < 50) {
        toast.error("Courbe trop courte.", { autoClose: 1500 });
        setCurrentCurve([]); // Réinitialiser la courbe
      } else {
        console.log("Curve validated, connecting points...");

        // Mettre à jour la curveMap existante
        const updatedCurveMap = updateCurveMap(curveMap, selectedPoint, end, adjustedCurve);

        setCurves(prevCurves => [...prevCurves, adjustedCurve]);
        setCurveMap(updatedCurveMap);

        connectPoints(selectedPoint, end, adjustedCurve, points, setPoints, setCurves);

        if(!awaitingPointPlacement) {
          // Ajouter le coup à l'historique
          addMove(`${selectedPoint.label} -> ${end.label} : ${addedPoint.label}`);
        }

        setAwaitingPointPlacement(true);

        
      }
    } else {
      if (!end) {
        toast.error("Destination invalide.", { autoClose: 1500 });
      } else if (!canConnect(selectedPoint, end)) {
        toast.error("Trop de connexions sur le point.", { autoClose: 1500 });
      }
      setCurrentCurve([]); // Réinitialiser la courbe
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
      const newCurve = [...prevCurve, { x: Math.round(pos.x), y: Math.round(pos.y) }];
      if (!validateCurve(newCurve)) {
        console.error("Invalid curve detected:", newCurve);
        return prevCurve; // Retourne la courbe précédente si elle est invalide
      }
      if (newCurve.length > 1) {
        drawGame(canvasRef, points, curves, newCurve);
      }
      return newCurve;
    });
  };

  return (
    <div
      id="canvas-container"
      className="relative flex items-center justify-center w-full rounded-xl border-4 border-yellow-400 shadow-[0_0_25px_#facc15] bg-gray-900"
      style={{ height: '500px' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-md shadow-inner"
        style={{
          backgroundColor: '#fff',
          border: 'none',
          margin: 0,
          padding: 0,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
};

export default PVECanvas;
