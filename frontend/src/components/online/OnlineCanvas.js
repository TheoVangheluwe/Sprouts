import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
    drawGame,
    getMousePos,
    getNearPoint,
    canConnect,
    connectPoints,
    curveIntersects,
    curveLength,
    getNextLabel,
    getClosestPointOnCurve,
    isPointTooClose,
    LOGICAL_WIDTH,
    LOGICAL_HEIGHT
} from './OnlineUtils';

const OnlineCanvas = ({ points, setPoints, curves = [], setCurves, myTurn, onMove }) => {
    const canvasRef = useRef(null);
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentCurve, setCurrentCurve] = useState([]);
    const [awaitingPointPlacement, setAwaitingPointPlacement] = useState(false);

    // Références pour suivre les changements dans les props
    const prevPointsRef = useRef(null);
    const prevCurvesRef = useRef(null);
    const prevMyTurnRef = useRef(myTurn);

    // UseEffect pour redimensionner le canvas
    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const container = canvas.parentElement;
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;

                // Assurer que les courbes sont un tableau valide
                const safePoints = Array.isArray(points) ? points : [];
                const safeCurves = Array.isArray(curves) ? curves : [];
                drawGame(canvasRef, safePoints, safeCurves, currentCurve);
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [points, curves, currentCurve]);

    // UseEffect pour dessiner le jeu quand les données changent
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Vérifier et sécuriser les données avant de dessiner
            const safePoints = Array.isArray(points) ? points : [];
            const safeCurves = Array.isArray(curves) ? curves : [];

            drawGame(canvasRef, safePoints, safeCurves, currentCurve);
        }
    }, [points, curves, currentCurve]);

    // UseEffect pour les logs de débogage des props
    useEffect(() => {
        // Compare les références pour éviter les logs redondants
        const pointsChanged = prevPointsRef.current !== points;
        const curvesChanged = prevCurvesRef.current !== curves;

        // Ne log que si quelque chose a changé
        if (pointsChanged || curvesChanged)  {
            // Met à jour les références
            prevPointsRef.current = points;
            prevCurvesRef.current = curves;
        }
    }, [points, curves]);

    // UseEffect pour initialiser les points
    useEffect(() => {
        if (points.length === 0) {
            const newPoints = [];
            // Utiliser les dimensions logiques pour positionner les points initiaux
            const centerX = LOGICAL_WIDTH / 2;
            const centerY = LOGICAL_HEIGHT / 2;
            const radius = Math.min(LOGICAL_WIDTH, LOGICAL_HEIGHT) * 0.3;
            const n = 3;
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            for (let i = 0; i < n; i++) {
                const angle = (2 * Math.PI * i) / n;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                newPoints.push({ x, y, connections: 0, label: alphabet[i] });
            }
            setPoints(newPoints);
        }
    }, [setPoints, points]);

    // UseEffect pour le suivi du tour - Corrigé pour éviter les notifications multiples
    useEffect(() => {
        // Identifiants uniques pour chaque type de toast
        const yourTurnId = "your-turn-toast";
        const opponentTurnId = "opponent-turn-toast";

        // Si myTurn a changé, mettre à jour les notifications
        if (myTurn !== prevMyTurnRef.current) {
            // Mettre à jour la référence
            prevMyTurnRef.current = myTurn;
        }
        return () => {
        };
    }, [myTurn]);

    // Fonction pour gérer le clic de souris
    const handleMouseDown = (event) => {
        if (!myTurn) {
            toast.info("Ce n'est pas à vous de jouer.", { autoClose: 1500 });
            return;
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        // getMousePos convertit déjà en coordonnées logiques [0,1000]
        const pos = getMousePos(canvas, event);

        if (awaitingPointPlacement) {
            const closestPoint = getClosestPointOnCurve(pos.x, pos.y, currentCurve);
            if (closestPoint) {
                if (!isPointTooClose(closestPoint.x, closestPoint.y, points)) {
                    // Créer un nouveau point
                    const newLabel = getNextLabel(points);
                    const newPoint = {
                        x: closestPoint.x,
                        y: closestPoint.y,
                        connections: 2,
                        label: newLabel
                    };

                    // Mettre à jour les points localement
                    const updatedPoints = [...points, newPoint];
                    setPoints(updatedPoints);

                    // Mettre à jour les courbes
                    setCurves(prevCurves => {
                        const updatedCurves = [...prevCurves, currentCurve];
                        return updatedCurves;
                    });

                    // Réinitialiser les états
                    setAwaitingPointPlacement(false);
                    setCurrentCurve([]);

                    // Notifier l'utilisateur et envoyer au serveur
                    toast.success("Point placé.", { autoClose: 1500 });
                    onMove({
                        type: 'place_point',
                        point: newPoint,
                        curve: currentCurve
                    });
                } else {
                    toast.error("Le point est trop proche d'un autre.", { autoClose: 1500 });
                }
            } else {
                toast.error("Cliquez plus près de la courbe.", { autoClose: 1500 });
            }
        } else {
            const start = getNearPoint(pos.x, pos.y, points);
            if (start) {
                setSelectedPoint(start);
                setIsDrawing(true);
                setCurrentCurve([{ x: start.x, y: start.y }]);
            } else {
            }
        }
    };

    // Fonction pour gérer le relâchement du clic de souris
    const handleMouseUp = (event) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // getMousePos convertit déjà en coordonnées logiques [0,1000]
        const pos = getMousePos(canvas, event);
        const endPoint = getNearPoint(pos.x, pos.y, points);

        if (!endPoint) {
            toast.error("Destination invalide.", { autoClose: 1500 });
            setCurrentCurve([]);
            setIsDrawing(false);
            setSelectedPoint(null);
            return;
        }

        if (!selectedPoint || !canConnect(selectedPoint, endPoint)) {
            toast.error("Trop de connexions sur le point.", { autoClose: 1500 });
            setCurrentCurve([]);
            setIsDrawing(false);
            setSelectedPoint(null);
            return;
        }

        const adjustedCurve = [...currentCurve, { x: endPoint.x, y: endPoint.y }];

        if (curveIntersects(adjustedCurve, Array.isArray(curves) ? curves : [], points)) {
            toast.error("Intersection détectée.", { autoClose: 1500 });
            setCurrentCurve([]);
        } else if (curveLength(adjustedCurve) < 15) {
            toast.error("Courbe trop courte.", { autoClose: 1500 });
            setCurrentCurve([]);
        } else {
            const updatedPoints = points.map(point => {
                if (point.label === selectedPoint.label || point.label === endPoint.label) {
                    return { ...point, connections: point.connections + 1 };
                }
                return point;
            });

            const updatedCurves = [...curves, adjustedCurve];

            setPoints(updatedPoints);
            setCurves(updatedCurves);
            setAwaitingPointPlacement(true);

            onMove({
                type: 'draw_curve',
                curve: adjustedCurve,
                startPoint: selectedPoint.label,
                endPoint: endPoint.label
            });
        }

        setIsDrawing(false);
        setSelectedPoint(null);
    };

    // Fonction pour gérer le mouvement de la souris
    const handleMouseMove = (event) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        // getMousePos convertit déjà en coordonnées logiques [0,1000]
        const pos = getMousePos(canvas, event);

        setCurrentCurve(prevCurve => {
            const newCurve = [...prevCurve, { x: pos.x, y: pos.y }];
            if (newCurve.length > 1) {
                // Assurer que les données sont des tableaux valides
                const safePoints = Array.isArray(points) ? points : [];
                const safeCurves = Array.isArray(curves) ? curves : [];

                drawGame(canvasRef, safePoints, safeCurves, newCurve);
            }
            return newCurve;
        });
    };

    return (
        <div id="canvas-container" style={{ width: '100%', height: '100%' }}>
            <canvas
                ref={canvasRef}
                style={{ border: "1px solid black", width: '100%', height: '100%' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        </div>
    );
};

export default OnlineCanvas;
