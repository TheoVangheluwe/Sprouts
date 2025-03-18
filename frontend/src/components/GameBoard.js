import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import './GameBoard.css';

const GameBoard = () => {
  const gameBoardRef = useRef(null);

  useEffect(() => {
    const currentGameBoardRef = gameBoardRef.current;

    const sketch = (p) => {
      let points = [];
      let currentCurve = [];
      let completedCurves = [];
      let isDrawing = false;
      let canAddPoint = false;
      const maxConnections = 3;
      const tolerance = 15; // Tolérance pour éviter les points trop serrés
      const minPointDistance = 15; // Distance minimale entre les points
      const minPointsInLoop = 50; // Nombre minimum de points pour former une boucle

      // Fonction pour vérifier si une courbe croise une autre
      const curvesIntersect = (curve1, curves) => {
        for (let i = 0; i < curve1.length - 1; i++) {
          for (let j = 0; j < curves.length; j++) {
            const curve2 = curves[j];
            for (let k = 0; k < curve2.length - 1; k++) {
              const [x1, y1, x2, y2] = [curve1[i].x, curve1[i].y, curve1[i + 1].x, curve1[i + 1].y];
              const [x3, y3, x4, y4] = [curve2[k].x, curve2[k].y, curve2[k + 1].x, curve2[k + 1].y];

              // Ignorer les intersections si les segments sont proches des points existants
              const isNearPoint = (px, py) => points.some(pt => p.dist(px, py, pt.x, pt.y) < tolerance);

              if (isNearPoint(x1, y1) && isNearPoint(x2, y2)) continue;
              if (isNearPoint(x3, y3) && isNearPoint(x4, y4)) continue;

              if (linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4)) {
                console.log('Intersection detected between:', { x1, y1, x2, y2 }, 'and', { x3, y3, x4, y4 });
                return true;
              }
            }
          }
        }
        return false;
      };

      // Fonction pour vérifier si deux lignes se croisent
      const linesIntersect = (x1, y1, x2, y2, x3, y3, x4, y4) => {
        const d = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (d === 0) return false;
        const uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / d;
        const uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / d;
        return uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1;
      };

      // Fonction pour vérifier si une courbe s'auto-intersecte
      const isSelfIntersecting = (curve) => {
        for (let i = 0; i < curve.length - 1; i++) {
          for (let j = i + 2; j < curve.length - 1; j++) {
            const [x1, y1, x2, y2] = [curve[i].x, curve[i].y, curve[i + 1].x, curve[i + 1].y];
            const [x3, y3, x4, y4] = [curve[j].x, curve[j].y, curve[j + 1].x, curve[j + 1].y];
            if (linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4)) {
              console.log('Self-intersection detected in curve:', { x1, y1, x2, y2 }, 'and', { x3, y3, x4, y4 });
              return true;
            }
          }
        }
        return false;
      };

      // Fonction pour vérifier si un point est sur la courbe actuelle
      const isPointOnCurve = (x, y, curve) => {
        for (let i = 0; i < curve.length - 1; i++) {
          const x1 = curve[i].x;
          const y1 = curve[i].y;
          const x2 = curve[i + 1].x;
          const y2 = curve[i + 1].y;
          const d = p.dist(x, y, x1, y1) + p.dist(x, y, x2, y2) - p.dist(x1, y1, x2, y2);
          if (d < tolerance) {
            return true;
          }
        }
        return false;
      };

      p.setup = () => {
        const canvas = p.createCanvas(currentGameBoardRef.offsetWidth, currentGameBoardRef.offsetHeight);
        canvas.parent(currentGameBoardRef);
        p.background(255);

        // Créer 3 points initiaux aléatoires
        for (let i = 0; i < 3; i++) {
          points.push({
            x: p.random(p.width * 0.2, p.width * 0.8),
            y: p.random(p.height * 0.2, p.height * 0.8),
            connections: 0
          });
        }
      };

      p.draw = () => {
        p.background(255);

        // Dessiner les points initiaux
        p.fill(0);
        p.noStroke();
        points.forEach(pt => {
          p.ellipse(pt.x, pt.y, 10, 10);
        });

        // Dessiner les courbes complétées
        p.stroke(0);
        p.noFill();
        completedCurves.forEach(curve => {
          p.beginShape();
          curve.forEach(pt => {
            p.vertex(pt.x, pt.y);
          });
          p.endShape();
        });

        // Dessiner la courbe à main levée si l'utilisateur dessine
        if (isDrawing) {
          p.beginShape();
          currentCurve.forEach(pt => {
            p.vertex(pt.x, pt.y);
          });
          p.vertex(p.mouseX, p.mouseY);
          p.endShape();
        }
      };

      p.mousePressed = () => {
        if (canAddPoint) {
          // Ajouter un point sur la courbe actuelle
          if (isPointOnCurve(p.mouseX, p.mouseY, currentCurve)) {
            const newPoint = { x: p.mouseX, y: p.mouseY, connections: 0 };
            const isTooClose = points.some(pt => p.dist(pt.x, pt.y, newPoint.x, newPoint.y) < minPointDistance);

            if (!isTooClose) {
              points.push(newPoint);
              console.log('New point added on curve:', newPoint);
              canAddPoint = false;
            } else {
              console.log('Point too close to an existing point.');
            }
          } else {
            console.log('Point not on the curve.');
          }
        } else if (!isDrawing) {
          const selectedPoints = points.filter(pt => p.dist(pt.x, pt.y, p.mouseX, p.mouseY) < 10);

          if (selectedPoints.length === 1) {
            const startPoint = selectedPoints[0];

            if (startPoint.connections < maxConnections) {
              isDrawing = true;
              currentCurve = [startPoint];
              console.log('Start drawing from:', startPoint);
            } else {
              console.log('Point already has max connections:', startPoint);
            }
          } else {
            console.log('No valid start point found.');
          }
        }
      };

      p.mouseReleased = () => {
        if (isDrawing) {
          isDrawing = false;

          const selectedPoints = points.filter(pt => p.dist(pt.x, pt.y, p.mouseX, p.mouseY) < 10);

          if (selectedPoints.length === 1) {
            const endPoint = selectedPoints[0];
            const newCurve = [...currentCurve, endPoint];
            console.log('End drawing at:', endPoint);

            if (endPoint === currentCurve[0]) {
              if (endPoint.connections < 2 && newCurve.length >= minPointsInLoop) {
                const isLoopValid = !curvesIntersect(newCurve, completedCurves) && !isSelfIntersecting(newCurve.slice(0, -1));

                if (isLoopValid) {
                  completedCurves.push(newCurve);
                  endPoint.connections += 2;
                  console.log('Loop added:', newCurve);
                  canAddPoint = true;
                } else {
                  console.log('Loop not added due to intersection.');
                }
              } else {
                console.log(`Loop not added due to connection limit or insufficient points in loop. Points in loop: ${newCurve.length}`);
              }
            } else if (endPoint.connections < maxConnections) {
              if (!curvesIntersect(newCurve, completedCurves) && !isSelfIntersecting(newCurve)) {
                completedCurves.push(newCurve);
                newCurve.forEach(pt => {
                  pt.connections += 1;
                });
                console.log('Curve added:', newCurve);
                canAddPoint = true;
              } else {
                console.log('Curve not added due to intersection.');
              }
            } else {
              console.log('Curve not added due to connection limit.');
            }
          } else {
            console.log('No valid end point found.');
          }
        }
      };

      p.mouseDragged = () => {
        if (isDrawing) {
          currentCurve.push({ x: p.mouseX, y: p.mouseY });
          console.log('Dragging to:', p.mouseX, p.mouseY);
        }
      };

      p.windowResized = () => {
        p.resizeCanvas(currentGameBoardRef.offsetWidth, currentGameBoardRef.offsetHeight);
      };
    };

    new p5(sketch, currentGameBoardRef);

    return () => {
      if (currentGameBoardRef && currentGameBoardRef.firstChild) {
        currentGameBoardRef.firstChild.remove();
      }
    };
  }, []);

  return (
    <div className="game-container">
      <h1>Sprouts Game</h1>
      <div id="canvas-container" ref={gameBoardRef}></div>
    </div>
  );
};

export default GameBoard;
