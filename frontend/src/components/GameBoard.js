import React, { useEffect, useRef, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './GameBoard.css';

const GameBoard = () => {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [curves, setCurves] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [grapheChaine, setGrapheChaine] = useState("");
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

  // Initialisation des points de départ avec des lettres
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
  }, []);

  // Mise à jour du texte du graphe et redessin du canvas
  useEffect(() => {
    const graphStr = generateGraphString(points, curves);
    setGrapheChaine(graphStr);
    drawGame(points, curves, currentCurve);
  }, [points, curves, currentCurve]);

  // Fonction de dessin sur le canvas
  const drawGame = (pointsToDraw, curvesToDraw, tempCurve = null) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
      // Dessiner les points avec leurs labels
      pointsToDraw.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.fillText(point.label, point.x + 10, point.y + 5);
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

  // Génération de la chaîne de caractères représentant le graphe
  const generateGraphString = (points, curves) => {
    let graphStr = "";
    const regions = identifyRegions(curves);
    regions.forEach((region, index) => {
      graphStr += `${region.map(boundary => boundary.map(point => point.label).join('.')).join('.')}.}`;
    });
    graphStr += '!';
    return graphStr;
  };

  // Identification des régions à partir des courbes
  const identifyRegions = (curves) => {
    const regions = [];
    const visited = new Set();

    // Fonction pour trouver les frontières d'une région
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

    if (awaitingPointPlacement) {
      // Placer un point sur la courbe actuelle
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
      const start = getNearPoint(pos.x, pos.y);
      if (start) {
        setSelectedPoint(start);
        setIsDrawing(true);
        setCurrentCurve([pos]);
      }
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
        toast.error("Intersection détectée.", { autoClose: 1500 });
        setCurrentCurve([]); // Supprimer la courbe incorrecte
      } else if (curveLength(currentCurve) < 50) {
        // Vérifier la longueur minimale de la courbe
        toast.error("Courbe trop courte.", { autoClose: 1500 });
        setCurrentCurve([]); // Supprimer la courbe incorrecte
      } else {
        toast.success("Placez un point sur la courbe.", { autoClose: 1500 });
        connectPoints(selectedPoint, endPoint, currentCurve);
        setAwaitingPointPlacement(true);
      }
    } else {
      if (!endPoint) {
        toast.error("Destination invalide.", { autoClose: 1500 });
      } else if (!canConnect(selectedPoint, endPoint)) {
        toast.error("Trop de connexions sur le point.", { autoClose: 1500 });
      }
      setCurrentCurve([]); // Supprimer la courbe incorrecte
    }
    // Réinitialiser l'état du tracé
    setIsDrawing(false);
  };

  // Vérifie que deux points peuvent être reliés
  const canConnect = (p1, p2) => {
    if (p1 === p2) {
      return p1.connections <= 1;
    } else {
      if (p1.connections >= 3 || p2.connections >= 3) return false;
      return true;
    }
  };

  // Connexion de deux points via le tracé dessiné par l'utilisateur
  const connectPoints = (p1, p2, curvePoints) => {
    if (curvePoints.some(point => !points.some(p => p.x === point.x && p.y === point.y))) {
      console.error("Courbe contient des points non valides");
      return;
    }

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
    setPoints(updatedPoints);
    setCurves(prevCurves => [...prevCurves, curvePoints]);
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
    // Vérifier l'auto-intersection de la courbe actuelle
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

  // Calcule la longueur totale de la courbe
  const curveLength = (curve) => {
    let length = 0;
    for (let i = 1; i < curve.length; i++) {
      length += Math.hypot(curve[i].x - curve[i - 1].x, curve[i].y - curve[i - 1].y);
    }
    return length;
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

  // Obtenir la prochaine lettre pour un nouveau point
  const getNextLabel = (points) => {
    const usedLabels = points.map(point => point.label);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let letter of alphabet) {
      if (!usedLabels.includes(letter)) {
        return letter;
      }
    }
    return '';
  };

  return (
    <div className="game-container">
      <h1>Sprouts Game</h1>
      <div id="canvas-container">
        <canvas
          ref={canvasRef}
          style={{ border: "1px solid black" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>
      <ToastContainer position="top-right" autoClose={1500} hideProgressBar={true} newestOnTop={false} closeOnClick={false} rtl={false} pauseOnFocusLoss={false} draggable={false} pauseOnHover={false} />

      {/*<pre>{grapheChaine}</pre>*/}

    </div>
  );
};

export default GameBoard;
