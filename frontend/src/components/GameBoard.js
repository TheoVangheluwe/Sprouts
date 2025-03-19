import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import './GameBoard.css';

const GameBoard = () => {
  const gameBoardRef = useRef(null);
  const [grapheChaine, setGrapheChaine] = useState('');
  const canAddPoint = useRef(false);
  const lastCurve = useRef(null);
  let points = [];
  let completedCurves = [];
  let nextLetterCharCode = 65;

  useEffect(() => {
    const currentGameBoardRef = gameBoardRef.current;
    const sketch = (p) => {
      let currentCurve = [];
      let isDrawing = false;
      const maxConnections = 3;
      const tolerance = 5;
      const minPointDistance = 15;

      const getNextLetter = () => String.fromCharCode(nextLetterCharCode++);

      const updateGraphString = () => {
        setGrapheChaine(grapheVersChaine(points, completedCurves));
      };

      const doesLineIntersect = (x1, y1, x2, y2, a1, b1, a2, b2) => {
        const det = (x2 - x1) * (b2 - b1) - (y2 - y1) * (a2 - a1);
        if (det === 0) return false;

        const lambda = ((b2 - b1) * (a2 - x1) + (a1 - a2) * (b2 - y1)) / det;
        const gamma = ((y1 - y2) * (a2 - x1) + (x2 - x1) * (b2 - y1)) / det;

        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
      };

      const doesLineIntersectExistingCurves = (x1, y1, x2, y2) => {
        for (const curve of completedCurves) {
          for (let i = 0; i < curve.length - 1; i++) {
            const a1 = curve[i].x;
            const b1 = curve[i].y;
            const a2 = curve[i + 1].x;
            const b2 = curve[i + 1].y;

            if (doesLineIntersect(x1, y1, x2, y2, a1, b1, a2, b2)) {
              return true;
            }
          }
        }
        return false;
      };

      const isPointOnCurve = (x, y, curve) => {
        for (let i = 0; i < curve.length - 1; i++) {
          const d = p.dist(x, y, curve[i].x, curve[i].y) + p.dist(x, y, curve[i + 1].x, curve[i + 1].y) - p.dist(curve[i].x, curve[i].y, curve[i + 1].x, curve[i + 1].y);
          if (d < tolerance) {
            return { index: i, position: { x, y } };
          }
        }
        return null;
      };

      p.setup = () => {
        const canvas = p.createCanvas(currentGameBoardRef.offsetWidth, currentGameBoardRef.offsetHeight);
        canvas.parent(currentGameBoardRef);
        p.background(255);

        while (points.length < 3) {
          let newPoint;
          do {
            newPoint = {
              letter: getNextLetter(),
              x: p.random(p.width * 0.2, p.width * 0.8),
              y: p.random(p.height * 0.2, p.height * 0.8),
              connections: 0,
            };
          } while (points.some(pt => p.dist(pt.x, pt.y, newPoint.x, newPoint.y) < minPointDistance));
          points.push(newPoint);
        }
        updateGraphString();
      };

      p.draw = () => {
        p.background(255);
        p.fill(0);
        p.noStroke();
        points.forEach(pt => {
          p.text(pt.letter, pt.x, pt.y);
          p.ellipse(pt.x, pt.y, 10, 10);
        });

        p.stroke(0);
        p.noFill();
        completedCurves.forEach(curve => {
          p.beginShape();
          curve.forEach(pt => p.vertex(pt.x, pt.y));
          p.endShape();
        });

        if (isDrawing) {
          p.stroke(150);
          p.noFill();
          p.beginShape();
          currentCurve.forEach(pt => p.vertex(pt.x, pt.y));
          p.vertex(p.mouseX, p.mouseY);
          p.endShape();
        }
      };

      p.mousePressed = () => {
        if (canAddPoint.current && lastCurve.current) {
          const found = isPointOnCurve(p.mouseX, p.mouseY, lastCurve.current);
          if (found) {
            const newPoint = {
              letter: getNextLetter(),
              x: found.position.x,
              y: found.position.y,
              connections: 0,
            };
            lastCurve.current.splice(found.index + 1, 0, newPoint);
            points.push(newPoint);
            canAddPoint.current = false; // ✅ Ajout d’un point réinitialise l'état
            updateGraphString();
            return;
          }
        }

        if (canAddPoint.current) {
          return; // 🚨 Bloque les nouvelles connexions tant qu'un point n'est pas ajouté
        }

        const selectedPoints = points.filter(pt => p.dist(pt.x, pt.y, p.mouseX, p.mouseY) < 10);
        if (selectedPoints.length === 1 && selectedPoints[0].connections < maxConnections) {
          isDrawing = true;
          currentCurve = [selectedPoints[0]];
        }
      };

      p.mouseDragged = () => {
        if (isDrawing) {
          currentCurve.push({ x: p.mouseX, y: p.mouseY });
        }
      };

      p.mouseReleased = () => {
        if (!isDrawing) return;
        isDrawing = false;

        const selectedPoints = points.filter(pt => p.dist(pt.x, pt.y, p.mouseX, p.mouseY) < 10);
        if (
          selectedPoints.length === 1 &&
          selectedPoints[0] !== currentCurve[0] &&
          selectedPoints[0].connections < maxConnections &&
          currentCurve[0].connections < maxConnections &&
          !doesLineIntersectExistingCurves(currentCurve[0].x, currentCurve[0].y, selectedPoints[0].x, selectedPoints[0].y)
        ) {
          currentCurve.push(selectedPoints[0]);
          completedCurves.push(currentCurve);
          lastCurve.current = currentCurve;
          currentCurve[0].connections += 1;
          selectedPoints[0].connections += 1;
          canAddPoint.current = true; // 🚨 Force l'ajout d'un point avant une nouvelle connexion
          updateGraphString();
        }
      };
    };

    new p5(sketch, currentGameBoardRef);
    return () => currentGameBoardRef?.firstChild?.remove();
  }, []);

  return (
    <div className="game-container">
      <h1>Sprouts Game</h1>
      <div id="canvas-container" ref={gameBoardRef}></div>
      <pre>{grapheChaine}</pre>
    </div>
  );
};

const grapheVersChaine = (points, completedCurves) => {
  let regions = completedCurves.map(curve => curve.map(p => p.letter || '').join('') + '.');
  return [...new Set(regions)].join('') + '!';
};

export default GameBoard;
