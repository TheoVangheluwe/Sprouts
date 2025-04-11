import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { drawGame, getMousePos, getNearPoint, canConnect, connectPoints, curveIntersects, curveLength, getNextLabel, getClosestPointOnCurve, isPointTooClose } from './OnlineUtils';

const OnlineCanvas = ({ points, setPoints, curves = [], setCurves, currentPlayer, myTurn, onMove }) => {
    const canvasRef = useRef(null);
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentCurve, setCurrentCurve] = useState([]);
    const [awaitingPointPlacement, setAwaitingPointPlacement] = useState(false);

    const prevPointsRef = useRef(null);
    const prevCurvesRef = useRef(null);

    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const container = canvas.parentElement;
                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;

                // Taille logique du canvas
                const logicalWidth = 500;
                const logicalHeight = 500;

                // Calculer le facteur d'échelle
                const scaleX = containerWidth / logicalWidth;
                const scaleY = containerHeight / logicalHeight;
                const scale = Math.min(scaleX, scaleY);

                // Mettre à jour la taille du canvas et appliquer la transformation
                canvas.width = containerWidth;
                canvas.height = containerHeight;
                const context = canvas.getContext('2d');
                context.setTransform(scale, 0, 0, scale, 0, 0);

                // Dessiner le jeu
                const safePoints = Array.isArray(points) ? points : [];
                const safeCurves = Array.isArray(curves) ? curves : [];
                drawGame(canvasRef, safePoints, safeCurves, currentCurve);
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [points, curves, currentCurve]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const safePoints = Array.isArray(points) ? points : [];
            const safeCurves = Array.isArray(curves) ? curves : [];
            drawGame(canvasRef, safePoints, safeCurves, currentCurve);
        }
    }, [points, curves, currentCurve]);

    useEffect(() => {
        const pointsChanged = prevPointsRef.current !== points;
        const curvesChanged = prevCurvesRef.current !== curves;

        if (pointsChanged || curvesChanged) {
            prevPointsRef.current = points;
            prevCurvesRef.current = curves;
        }
    }, [points, curves]);

    useEffect(() => {
        if (points.length === 0) {
            const newPoints = [];
            const canvas = canvasRef.current;
            if (!canvas) return;
            const centerX = 250;
            const centerY = 250;
            const radius = 150;
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

    useEffect(() => {
        const toastId = myTurn ? "your-turn" : "opponent-turn";
        if (myTurn) {
            toast.info("C'est votre tour de jouer.", { autoClose: false, toastId });
        } else {
            toast.info("En attente du tour de l'autre joueur.", { autoClose: false, toastId });
        }
        return () => {
            toast.dismiss(toastId);
        };
    }, [myTurn]);

    const handleMouseDown = (event) => {
        if (!myTurn) {
            toast.info("Ce n'est pas à vous de jouer.", { autoClose: 1500 });
            return;
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        const pos = getMousePos(canvas, event);

        if (awaitingPointPlacement) {
            const closestPoint = getClosestPointOnCurve(pos.x, pos.y, currentCurve);
            if (closestPoint) {
                if (!isPointTooClose(closestPoint.x, closestPoint.y, points)) {
                    const newLabel = getNextLabel(points);
                    const newPoint = {
                        x: closestPoint.x,
                        y: closestPoint.y,
                        connections: 2,
                        label: newLabel
                    };

                    const updatedPoints = [...points, newPoint];
                    setPoints(updatedPoints);

                    setCurves(prevCurves => {
                        const updatedCurves = [...prevCurves, currentCurve];
                        return updatedCurves;
                    });

                    setAwaitingPointPlacement(false);
                    setCurrentCurve([]);

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
            }
        }
    };

    const handleMouseUp = (event) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

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
        } else if (curveLength(adjustedCurve) < 50) {
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

    const handleMouseMove = (event) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const pos = getMousePos(canvas, event);

        setCurrentCurve(prevCurve => {
            const newCurve = [...prevCurve, { x: pos.x, y: pos.y }];
            if (newCurve.length > 1) {
                const safePoints = Array.isArray(points) ? points : [];
                const safeCurves = Array.isArray(curves) ? curves : [];
                drawGame(canvasRef, safePoints, safeCurves, newCurve);
            }
            return newCurve;
        });
    };

    return (
        <div id="canvas-container" style={{ width: '80%', height: '80vh', margin: 'auto' }}>
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
