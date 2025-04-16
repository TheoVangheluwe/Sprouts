import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { drawGame, getMousePos, getNearPoint, canConnect, connectPoints, curveIntersects, curveLength, getNextLabel, getClosestPointOnCurve, isPointTooClose, generateInitialGraphString, generateGraphString, updateCurveMap } from './PVEUtils';

const PVECanvas = ({ points, setPoints, curves, setCurves }) => {
  const canvasRef = useRef(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentCurve, setCurrentCurve] = useState([]);
  const [awaitingPointPlacement, setAwaitingPointPlacement] = useState(false);
  const [graphString, setGraphString] = useState(''); // État pour stocker la chaîne de caractères
  const [curveMap, setCurveMap] = useState(new Map()); // État pour stocker la curveMap
  const [endPoint, setEndPoint] = useState(null); // État pour stocker endPoint
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 800;
        canvas.height = 500;
        drawGame(canvasRef, points, curves, currentCurve);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [points, curves, currentCurve]);

  useEffect(() => {
    initializePoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    checkGameOver();
  }, [graphString]);

  const initializePoints = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newPoints = generateInitialPoints(canvas);
    setPoints(newPoints);

    const initialGraphString = generateInitialGraphString(newPoints);
    setGraphString(initialGraphString);
    console.log("Initial graph as string:", initialGraphString);
  };

  const generateInitialPoints = (canvas) => {
    const minDistance = 100; // Distance minimale entre les points
    const width = canvas.width;
    const height = canvas.height;
    const newPoints = [];

    const generateRandomPoint = () => {
      const x = Math.round(Math.random() * width);
      const y = Math.round(Math.random() * height);
      return { x, y };
    };

    while (newPoints.length < 4) {
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
      const response = await fetch('http://localhost:8000/api/is_game_over/', {
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
      console.log(data.game_over);
      setGameOver(data.game_over);
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
          //setPoints(prevPoints => [...prevPoints, newPoint]);
          setCurves(prevCurves => [...prevCurves, currentCurve]);

          const test = points;
          test.push(newPoint);

          // Mettre à jour la chaîne de caractères après avoir placé le point
          const updatedGraphString = generateGraphString(selectedPoint, newPoint, endPoint, graphString, curveMap, test);
          setGraphString(updatedGraphString);

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
    <div id="canvas-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        width="1000"
        height="1000"
        style={{ border: "1px solid black", backgroundColor: '#fff' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <p>Chaîne de caractères: {graphString}</p>
    </div>
  );
};

export default PVECanvas;
