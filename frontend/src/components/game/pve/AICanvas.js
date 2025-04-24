import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  drawGame, getMousePos, getNearPoint, canConnect, connectPoints,
  curveIntersects, curveLength, getNextLabel, getClosestPointOnCurve,
  isPointTooClose, generateInitialGraphString, generateGraphString,
  updateCurveMap
} from './PVEUtils';

const AICanvas = ({ points, setPoints, curves, setCurves, currentPlayer, handlePlayerChange, handleGameOver, initialPointCount, addMove, difficulty }) => {

  const canvasRef = useRef(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentCurve, setCurrentCurve] = useState([]);
  const [awaitingPointPlacement, setAwaitingPointPlacement] = useState(false);
  const [graphString, setGraphString] = useState('');
  const [curveMap, setCurveMap] = useState(new Map());
  const [endPoint, setEndPoint] = useState(null);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = document.getElementById("canvas-container");
      if (canvas && container) {
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
  }, []);

  useEffect(() => {
    console.log("Chaîne mise à jour: ", graphString);
    checkGameOver();
  }, [graphString]);

  useEffect(() => {
    // L'IA ne joue que si c'est à elle et qu'on a déjà un graphe
    if (currentPlayer === 2 && graphString !== '') {
      handleAIMove();
    }
  }, [currentPlayer, graphString]);
  

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
    const minDistance = 100;
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

          const updatedGraphString = generateGraphString(selectedPoint, newPoint, endPoint, graphString, curveMap, test);
          setGraphString(updatedGraphString);

          setAwaitingPointPlacement(false);
          setCurrentCurve([]);
          toast.success("Point placé.", { autoClose: 1500 });
          handlePlayerChange();
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
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getMousePos(canvas, event);
    const end = getNearPoint(Math.round(pos.x), Math.round(pos.y), points);

    if (end && selectedPoint && canConnect(selectedPoint, end)) {
      setEndPoint(end);
      const addedPoint = { x: Math.round(pos.x), y: Math.round(pos.y), connections: 0, label: getNextLabel(points) };
      const adjustedCurve = [...currentCurve, addedPoint, end];

      if (curveIntersects(adjustedCurve, curves, points)) {
        toast.error("Intersection détectée.", { autoClose: 1500 });
        setCurrentCurve([]);
      } else if (curveLength(adjustedCurve) < 50) {
        toast.error("Courbe trop courte.", { autoClose: 1500 });
        setCurrentCurve([]);
      } else {
        const updatedCurveMap = updateCurveMap(curveMap, selectedPoint, end, adjustedCurve);
        setCurves(prevCurves => [...prevCurves, adjustedCurve]);
        setCurveMap(updatedCurveMap);

        connectPoints(selectedPoint, end, adjustedCurve, points, setPoints, setCurves);

        if(!awaitingPointPlacement) {
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
      const newCurve = [...prevCurve, { x: Math.round(pos.x), y: Math.round(pos.y) }];
      if (!validateCurve(newCurve)) {
        console.error("Invalid curve detected:", newCurve);
        return prevCurve;
      }
      if (newCurve.length > 1) {
        drawGame(canvasRef, points, curves, newCurve);
      }
      return newCurve;
    });
  };

  const generateBezierCurvePoints = (startPoint, endPoint, controlPoint1, controlPoint2, numPoints = 100) => {
    const curvePoints = [];
    for (let t = 0; t <= 1; t += 1 / numPoints) {
      const x = Math.pow(1 - t, 3) * startPoint.x + 3 * Math.pow(1 - t, 2) * t * controlPoint1.x + 3 * (1 - t) * Math.pow(t, 2) * controlPoint2.x + Math.pow(t, 3) * endPoint.x;
      const y = Math.pow(1 - t, 3) * startPoint.y + 3 * Math.pow(1 - t, 2) * t * controlPoint1.y + 3 * (1 - t) * Math.pow(t, 2) * controlPoint2.y + Math.pow(t, 3) * endPoint.y;
      curvePoints.push({ x: Math.round(x), y: Math.round(y) });
    }
    return curvePoints;
  };

  const generateCirclePoints = (centerPoint, radius, numPoints = 40, startAngle = 0, endAngle = 2 * Math.PI) => {
    const circlePoints = [];
    const angleStep = (endAngle - startAngle) / numPoints;
    for (let i = 0; i <= numPoints; i++) {
      const angle = startAngle + i * angleStep;
      const x = centerPoint.x + radius * Math.cos(angle);
      const y = centerPoint.y + radius * Math.sin(angle);
      circlePoints.push({ x: Math.round(x), y: Math.round(y) });
    }
    return circlePoints;
  };

  const isPointWithinCanvas = (point, canvas) => {
    return point.x >= 0 && point.x <= canvas.width && point.y >= 0 && point.y <= canvas.height;
  };

  const findValidCurve = (start, end, canvas, curves, points, maxAttempts = 1000) => {
    let attempts = 0;
    while (attempts < maxAttempts) {
      const controlPoint1 = { x: start.x + (Math.random() - 0.5) * 200, y: start.y + (Math.random() - 0.5) * 200 };
      const controlPoint2 = { x: end.x + (Math.random() - 0.5) * 200, y: end.y + (Math.random() - 0.5) * 200 };
      let curvePoints = generateBezierCurvePoints(start, end, controlPoint1, controlPoint2);
      let adjustedCurve = [start, ...curvePoints, end];

      if (adjustedCurve.every(point => isPointWithinCanvas(point, canvas)) && !curveIntersects(adjustedCurve, curves, points)) {
        return adjustedCurve;
      }

      attempts++;
    }
    return null;
  };

  const handleAIMove = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/get_possible_moves/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ graph_string: graphString }),
      });
  
      if (!response.ok) throw new Error('Erreur réseau');
  
      const data = await response.json();
      const possibleMoves = data.possible_moves;
  
      if (!possibleMoves || possibleMoves.length === 0) {
        console.log("Aucun mouvement possible pour l'IA.");
        return;
      }

      if (difficulty === 'easy') {
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        console.log("IA (facile) a choisi :", randomMove);
        // Tu peux ici directement exécuter le coup avec randomMove[0] et randomMove[1]
        return;
      }
  
      const pairMoves = [];
      const impairMoves = [];
  
      for (const move of possibleMoves) {
        const start = points.find(p => p.label === move[0]);
        const end = points.find(p => p.label === move[1]);
  
        if (!start || !end) continue;
  
        let adjustedCurve;
        if (start.label === end.label) {
          // Générer des demi-cercles et des quarts de cercle dans différentes directions
          const radius = 50; // Vous pouvez ajuster cette valeur selon vos besoins
          const directions = [
            { startAngle: 0, endAngle: Math.PI }, // Demi-cercle supérieur
            { startAngle: Math.PI, endAngle: 2 * Math.PI }, // Demi-cercle inférieur
            { startAngle: Math.PI / 2, endAngle: 3 * Math.PI / 2 }, // Demi-cercle gauche
            { startAngle: 3 * Math.PI / 2, endAngle: Math.PI / 2 }, // Demi-cercle droit
            { startAngle: 0, endAngle: Math.PI / 2 }, // Quart de cercle supérieur droit
            { startAngle: Math.PI / 2, endAngle: Math.PI }, // Quart de cercle supérieur gauche
            { startAngle: Math.PI, endAngle: 3 * Math.PI / 2 }, // Quart de cercle inférieur gauche
            { startAngle: 3 * Math.PI / 2, endAngle: 2 * Math.PI } // Quart de cercle inférieur droit
          ];
  
          for (const direction of directions) {
            const curvePoints = generateCirclePoints(start, radius, 40, direction.startAngle, direction.endAngle);
            adjustedCurve = [start, ...curvePoints, start];
  
            if (adjustedCurve.every(point => isPointWithinCanvas(point, canvasRef.current)) && !curveIntersects(adjustedCurve, curves, points)) {
              break;
            }
          }
        } else {
          adjustedCurve = findValidCurve(start, end, canvasRef.current, curves, points);
        }
  
        if (!adjustedCurve || (adjustedCurve && curveLength(adjustedCurve) < 50)) continue;
  
        // Simuler le coup
        const simulatedPoints = [...points];
        const simulatedCurves = [...curves, adjustedCurve];
        const simulatedCurveMap = updateCurveMap(curveMap, start, end, adjustedCurve);
  
        const mid = adjustedCurve[Math.floor(adjustedCurve.length / 2)];
        const newPoint = { x: mid.x, y: mid.y, connections: 2, label: getNextLabel(simulatedPoints) };
        simulatedPoints.push(newPoint);
  
        const simulatedGraphString = generateGraphString(start, newPoint, end, graphString, simulatedCurveMap, simulatedPoints);
  
        // Récupérer les coups restants après ce coup
        const response2 = await fetch('http://127.0.0.1:8000/api/get_possible_moves/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ graph_string: simulatedGraphString }),
        });
  
        if (!response2.ok) throw new Error('Erreur réseau');
  
        const data2 = await response2.json();
        const remainingMoves = data2.possible_moves.length;
  
        // Classer les coups en pair et impair
        if (remainingMoves % 2 === 0) {
          pairMoves.push(move);
        } else {
          impairMoves.push(move);
        }
      }
  
      // Afficher les coups pairs et impairs
      console.log("Coups pairs:", pairMoves);
      console.log("Coups impairs:", impairMoves);

      // Choisir un coup parmi les coups pairs si possible, sinon parmi les coups impairs
      let chosenMove = null;

      if (pairMoves.length > 0) {
        chosenMove = pairMoves[Math.floor(Math.random() * pairMoves.length)];
        console.log("IA a choisi un coup pair :", chosenMove);
      } else if (impairMoves.length > 0) {
        chosenMove = impairMoves[Math.floor(Math.random() * impairMoves.length)];
        console.log("IA a choisi un coup impair :", chosenMove);
      } else {
        console.log("Aucun coup disponible pour l'IA.");
        return;
      }

    } catch (error) {
      console.error('Erreur IA:', error);
    }
  };

  return (
    <div id="canvas-container" className="relative flex items-center justify-center w-full rounded-xl border-4 border-yellow-400 shadow-[0_0_25px_#facc15] bg-gray-900" style={{ height: '500px' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-md shadow-inner"
        style={{ backgroundColor: '#fff', border: 'none', margin: 0, padding: 0 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
};

export default AICanvas;
