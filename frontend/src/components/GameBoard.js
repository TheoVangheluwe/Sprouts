import React, { useEffect, useRef, useState } from 'react';
import './GameBoard.css';

const canvasWidth = 800;
const canvasHeight = 600;

const GameBoard = () => {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [curves, setCurves] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [grapheChaine, setGrapheChaine] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentCurve, setCurrentCurve] = useState([]);

  // Initialisation des points de départ
  useEffect(() => {
    const newPoints = [];
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = 200;
    const n = 3;
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      newPoints.push({ x, y, connections: 0 });
    }
    setPoints(newPoints);
  }, []);

  // Mise à jour du texte du graphe et redessin du canvas
  useEffect(() => {
    const graphStr = `Points: ${JSON.stringify(points, null, 2)}
Nombre de courbes: ${curves.length}`;
    setGrapheChaine(graphStr);
    drawGame(points, curves, currentCurve);
  }, [points, curves, currentCurve]);

  // Fonction de dessin sur le canvas
  // Si tempCurve est fourni, on le dessine (en rouge)
  const drawGame = (pointsToDraw, curvesToDraw, tempCurve = null) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      // Dessiner les courbes validées
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
      // Dessiner les points
      pointsToDraw.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "black";
        ctx.fill();
      });
      // Dessiner la courbe en cours (si elle existe)
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

  // Récupération des coordonnées relatives au canvas
  const getMousePos = (canvas, event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  // Retourne le point le plus proche (seuil de 15px)
  const getNearPoint = (x, y, threshold = 15) => {
    return points.find(point => Math.hypot(point.x - x, point.y - y) <= threshold) || null;
  };

  // Démarrage du tracé : l'utilisateur appuie sur la souris
  const handleMouseDown = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getMousePos(canvas, event);
    const start = getNearPoint(pos.x, pos.y);
    if (start) {
      setSelectedPoint(start);
      setIsDrawing(true);
      setCurrentCurve([pos]);
    }
  };

  // L'utilisateur déplace la souris pendant le tracé
  const handleMouseMove = (event) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getMousePos(canvas, event);
    setCurrentCurve(prevCurve => {
      const newCurve = [...prevCurve, pos];
      drawGame(points, curves, newCurve);
      return newCurve;
    });
  };

  // Fin du tracé : l'utilisateur relâche la souris
  const handleMouseUp = (event) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getMousePos(canvas, event);
    // Vérifier si le point final est proche d'un point existant (même si c'est le même que le départ)
    const endPoint = getNearPoint(pos.x, pos.y);
    if (endPoint && selectedPoint && canConnect(selectedPoint, endPoint)) {
      // Vérifier que la courbe dessinée ne croise pas d'autres courbes
      if (curveIntersects(currentCurve)) {
        console.log("La courbe dessinée intersecte une autre.");
      } else {
        connectPoints(selectedPoint, endPoint, currentCurve);
      }
    } else {
      console.log("Fin de dessin sans destination valide.");
    }
    // Réinitialiser l'état du tracé
    setIsDrawing(false);
    setCurrentCurve([]);
    setSelectedPoint(null);
  };

  // Vérifie que deux points peuvent être reliés
  // Si c'est une self-loop, le point doit avoir au plus 1 connexion pour pouvoir ajouter 2 connexions
  const canConnect = (p1, p2) => {
    if (p1 === p2) {
      return p1.connections <= 1;
    } else {
      if (p1.connections >= 3 || p2.connections >= 3) return false;
      return true;
    }
  };

  // Connexion de deux points via le tracé dessiné par l'utilisateur
  // currentCurve est le tableau de points recueillis pendant le tracé
  const connectPoints = (p1, p2, curvePoints) => {
    let updatedPoints;
    if (p1 === p2) {
      // Self-loop : ajouter 2 connexions au même point
      updatedPoints = points.map(point => {
        if (point === p1) {
          return { ...point, connections: point.connections + 2 };
        }
        return point;
      });
    } else {
      // Cas normal : ajouter 1 connexion à chaque extrémité
      updatedPoints = points.map(point => {
        if (point === p1 || point === p2) {
          return { ...point, connections: point.connections + 1 };
        }
        return point;
      });
    }
    // Ajout d'un nouveau point sur la courbe (point médian) avec 2 connexions
    const median = curvePoints[Math.floor(curvePoints.length / 2)];
    updatedPoints.push({ x: median.x, y: median.y, connections: 2 });

    const updatedCurves = [...curves, curvePoints];
    setPoints(updatedPoints);
    setCurves(updatedCurves);
  };

  // Vérifie si la courbe passée (tableau de points) intersecte une courbe déjà dessinée
  const curveIntersects = (newCurve) => {
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
    return false;
  };

  const segmentsIntersect = (A, B, C, D) => {
    // Calcule l'orientation de l triplet de points (p, q, r)
    const orientation = (p, q, r) => {
      const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
      if (Math.abs(val) < 1e-6) return 0; // Colinéarité
      return val > 0 ? 1 : 2; // 1: sens horaire, 2: sens antihoraire
    };
  
    const o1 = orientation(A, B, C);
    const o2 = orientation(A, B, D);
    const o3 = orientation(C, D, A);
    const o4 = orientation(C, D, B);
  
    // Les segments se coupent si les orientations diffèrent sur chaque segment
    return (o1 !== o2 && o3 !== o4);
  };
  
  

  return (
    <div className="game-container">
      <h1>Sprouts Game</h1>
      <div id="canvas-container">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{ border: "1px solid black" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>
      <pre>{grapheChaine}</pre>
    </div>
  );
};

export default GameBoard;
