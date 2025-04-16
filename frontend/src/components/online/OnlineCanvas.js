import React, {useEffect, useRef, useState} from 'react';
import {toast} from 'react-toastify';
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
    generateInitialGraphString,
    generateGraphString,
    updateCurveMap,
    basicCurveIntersects,
    LOGICAL_WIDTH,
    LOGICAL_HEIGHT
} from './OnlineUtils';

const OnlineCanvas = ({points, setPoints, curves = [], setCurves, myTurn, onMove}) => {
    const canvasRef = useRef(null);
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentCurve, setCurrentCurve] = useState([]);
    const [awaitingPointPlacement, setAwaitingPointPlacement] = useState(false);

    const [graphString, setGraphString] = useState('');
    const [curveMap, setCurveMap] = useState(new Map());
    const [storedEndPoint, setStoredEndPoint] = useState(null);

    const prevPointsRef = useRef(null);
    const prevCurvesRef = useRef(null);
    const prevMyTurnRef = useRef(myTurn);

    const endPointRef = useRef(null);

    // Fonction pour arrondir les coordonnées au pixel près
    const roundCoordinates = (point) => {
        if (!point) return null;
        return {
            ...point,
            x: Math.round(Number(point.x)),
            y: Math.round(Number(point.y))
        };
    };

    // Fonction sécurisée pour générer la chaîne graphString
// Fonction sécurisée pour générer la chaîne graphString
    const safeGenerateGraphString = (startPoint, addedPoint, endPoint, currentString, curveMapData, pointsData) => {
        try {
            console.log("Génération de chaîne avec:", {
                startPoint: startPoint ? startPoint.label : 'null',
                addedPoint: addedPoint ? addedPoint.label : 'null',
                endPoint: endPoint ? endPoint.label : 'null',
                currentString: currentString,
                mapSize: curveMapData ? curveMapData.size : 'null',
                pointsCount: pointsData ? pointsData.length : 'null'
            });

            // Vérifier que tous les paramètres nécessaires sont valides
            if (!startPoint || !startPoint.label) {
                console.warn("safeGenerateGraphString: startPoint invalide");
                return currentString;
            }
            if (!addedPoint || !addedPoint.label) {
                console.warn("safeGenerateGraphString: addedPoint invalide");
                return currentString;
            }
            if (!endPoint || !endPoint.label) {
                console.warn("safeGenerateGraphString: endPoint invalide");
                return currentString;
            }
            if (!currentString) {
                console.warn("safeGenerateGraphString: currentString invalide, utilisation d'une chaîne vide");
                currentString = '';
            }
            if (!curveMapData) {
                console.warn("safeGenerateGraphString: curveMap invalide, utilisation d'une Map vide");
                curveMapData = new Map();
            }
            if (!pointsData || !Array.isArray(pointsData) || pointsData.length === 0) {
                console.warn("safeGenerateGraphString: points invalides");
                return currentString;
            }

            // Appel sécurisé à la fonction generateGraphString
            const newString = generateGraphString(
                startPoint,
                addedPoint,
                endPoint,
                currentString,
                curveMapData,
                pointsData
            );

            console.log("Nouvelle chaîne générée:", newString);
            return newString;
        } catch (error) {
            console.error("Erreur dans safeGenerateGraphString:", error);
            console.error("Détails:", {
                startPoint,
                addedPoint,
                endPoint,
                currentString,
                curveMapSize: curveMapData ? curveMapData.size : 'null',
                pointsLength: pointsData ? pointsData.length : 'null'
            });
            return currentString; // Retourner la chaîne d'origine en cas d'erreur
        }
    };

    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const container = canvas.parentElement;
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;

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
            const centerX = LOGICAL_WIDTH / 2;
            const centerY = LOGICAL_HEIGHT / 2;
            const radius = Math.min(LOGICAL_WIDTH, LOGICAL_HEIGHT) * 0.3;
            const n = 3;
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            for (let i = 0; i < n; i++) {
                const angle = (2 * Math.PI * i) / n;
                const x = Math.round(centerX + radius * Math.cos(angle));
                const y = Math.round(centerY + radius * Math.sin(angle));
                newPoints.push({x, y, connections: 0, label: alphabet[i]});
            }
            setPoints(newPoints);
            setGraphString(generateInitialGraphString(newPoints));
        } else if (points.length > 0 && graphString === '') {
            setGraphString(generateInitialGraphString(points));
        }
    }, [setPoints, points, graphString]);

    useEffect(() => {
        if (myTurn !== prevMyTurnRef.current) {
            prevMyTurnRef.current = myTurn;
        }
        return () => {
        };
    }, [myTurn]);

    const handleMouseDown = async (event) => {
        if (!myTurn) {
            toast.error("Ce n'est pas à vous de jouer.", {autoClose: 1500});
            return;
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        const pos = roundCoordinates(getMousePos(canvas, event));

        if (awaitingPointPlacement) {
            const closestPoint = roundCoordinates(getClosestPointOnCurve(pos.x, pos.y, currentCurve));
            const endPointToUse = storedEndPoint;

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

                    // Récupérer la chaîne de caractères actuelle du serveur
                    try {
                        // Récupérer l'état actuel du jeu
                        const response = await fetch(`/api/game/${window.location.pathname.split('/').pop()}/state/`, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        });

                        if (!response.ok) {
                            throw new Error('Erreur lors de la récupération de l\'état du jeu');
                        }

                        const gameData = await response.json();

                        // Récupérer la chaîne de caractères du serveur
                        let currentServerGraphString = gameData.graphString ||
                            (gameData.state && gameData.state.graphString) ||
                            graphString;

                        console.log("Chaîne récupérée du serveur:", currentServerGraphString);

                        // Si la chaîne du serveur est vide ou invalide, utiliser notre chaîne locale
                        if (!currentServerGraphString) {
                            currentServerGraphString = graphString || generateInitialGraphString(updatedPoints);
                            console.log("Utilisation de la chaîne locale:", currentServerGraphString);
                        }

                        // Générer la nouvelle chaîne de caractères
                        let newGraphString = currentServerGraphString;
                        try {
                            if (endPointToUse && selectedPoint) {
                                newGraphString = safeGenerateGraphString(
                                    selectedPoint,
                                    newPoint,
                                    endPointToUse,
                                    currentServerGraphString,
                                    curveMap,
                                    updatedPoints
                                );
                            }
                            console.log("Nouvelle chaîne générée:", newGraphString);
                            setGraphString(newGraphString);
                        } catch (error) {
                            console.error("Erreur lors de la génération de la chaîne graphString:", error);
                            toast.warning("Avertissement: La détection de fin de partie pourrait ne pas fonctionner correctement.", {autoClose: 1500});
                        }

                        setAwaitingPointPlacement(false);
                        setCurrentCurve([]);
                        toast.success("Point placé.", {autoClose: 1500});

                        // Envoyer le mouvement avec la nouvelle chaîne
                        onMove({
                            type: 'place_point',
                            point: newPoint,
                            curve: currentCurve,
                            graphString: newGraphString
                        });

                    } catch (error) {
                        console.error("Erreur lors de la récupération de l'état du jeu:", error);

                        // En cas d'erreur, utiliser notre chaîne locale
                        let newGraphString = graphString;
                        try {
                            if (!newGraphString) {
                                newGraphString = generateInitialGraphString(updatedPoints);
                            }

                            if (endPointToUse && selectedPoint) {
                                newGraphString = safeGenerateGraphString(
                                    selectedPoint,
                                    newPoint,
                                    endPointToUse,
                                    newGraphString,
                                    curveMap,
                                    updatedPoints
                                );
                            }
                            setGraphString(newGraphString);
                        } catch (genError) {
                            console.error("Erreur lors de la génération de la chaîne graphString:", genError);
                            toast.warning("Avertissement: La détection de fin de partie pourrait ne pas fonctionner correctement.", {autoClose: 1500});
                        }

                        setAwaitingPointPlacement(false);
                        setCurrentCurve([]);
                        toast.success("Point placé.", {autoClose: 1500});

                        // Envoyer le mouvement avec la chaîne locale
                        onMove({
                            type: 'place_point',
                            point: newPoint,
                            curve: currentCurve,
                            graphString: newGraphString
                        });
                    }
                } else {
                    toast.error("Le point est trop proche d'un autre.", {autoClose: 1500});
                }
            } else {
                toast.error("Cliquez plus près de la courbe.", {autoClose: 1500});
            }
        } else {
            const start = getNearPoint(pos.x, pos.y, points);
            if (start) {
                setSelectedPoint(start);
                setIsDrawing(true);
                setCurrentCurve([roundCoordinates({x: start.x, y: start.y})]);
            }
        }
    };


    const handleMouseUp = async (event) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const pos = roundCoordinates(getMousePos(canvas, event));
        const endPoint = getNearPoint(pos.x, pos.y, points);

        // S'assurer que endPoint est défini avant de le stocker
        if (endPoint) {
            endPointRef.current = endPoint;
            setStoredEndPoint(endPoint);
        } else {
            toast.error("Point invalide.", {autoClose: 1500});
            resetDrawing();
            return;
        }

        if (!selectedPoint) {
            toast.error("Point de départ invalide.", {autoClose: 1500});
            resetDrawing();
            return;
        }

        const isSelfLoop = selectedPoint.label === endPoint.label;

        if (isSelfLoop && selectedPoint.connections > 1) {
            toast.error("Ce point a déjà trop de connexions pour une boucle.", {autoClose: 1500});
            resetDrawing();
            return;
        }

        if (!canConnect(selectedPoint, endPoint)) {
            toast.error("Trop de connexions sur le point.", {autoClose: 1500});
            resetDrawing();
            return;
        }

        // Arrondir les coordonnées de tous les points de la courbe
        const adjustedCurve = [...currentCurve, roundCoordinates({x: endPoint.x, y: endPoint.y})];

        console.log("Vérification d'intersection pour la courbe:", adjustedCurve);
        console.log("Nombre de courbes existantes:", curves.length);

        // S'assurer que curves est un tableau
        const safeCurves = Array.isArray(curves) ? curves : [];

        // CHANGEMENT CLÉ: Utiliser notre fonction simplifiée de détection d'intersection
        if (basicCurveIntersects(adjustedCurve, safeCurves, points)) {
            console.log("INTERSECTION DÉTECTÉE");
            toast.error("Intersection détectée.", {autoClose: 1500});
            resetDrawing();
            return;
        } else if (curveLength(adjustedCurve) < 15) {
            toast.error("Courbe trop courte.", {autoClose: 1500});
            resetDrawing();
            return;
        } else {
            const updatedPoints = points.map(point => {
                if (point.label === selectedPoint.label && isSelfLoop) {
                    return {...point, connections: point.connections + 2};
                } else if (point.label === selectedPoint.label || point.label === endPoint.label) {
                    return {...point, connections: point.connections + 1};
                }
                return point;
            });

            const updatedCurves = [...curves, adjustedCurve];

            setPoints(updatedPoints);
            setCurves(updatedCurves);
            setAwaitingPointPlacement(true);
            setCurrentCurve(adjustedCurve);

            const newCurveMap = new Map(curveMap);
            updateCurveMap(newCurveMap, selectedPoint, endPoint, adjustedCurve);
            setCurveMap(newCurveMap);

            // Créer un point temporaire pour la mise à jour de graphString
            const tempAddedPoint = {
                label: getNextLabel(updatedPoints), // Générer un label temporaire
                x: 0,
                y: 0,
                connections: 0
            };

            // Récupérer la chaîne de caractères actuelle du serveur
            try {
                // Récupérer l'état actuel du jeu
                const response = await fetch(`/api/game/${window.location.pathname.split('/').pop()}/state/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération de l\'état du jeu');
                }

                const gameData = await response.json();

                // Récupérer la chaîne de caractères du serveur
                let currentServerGraphString = gameData.graphString ||
                    (gameData.state && gameData.state.graphString) ||
                    graphString;

                console.log("Chaîne récupérée du serveur:", currentServerGraphString);

                // Si la chaîne du serveur est vide ou invalide, utiliser notre chaîne locale
                if (!currentServerGraphString) {
                    currentServerGraphString = graphString || generateInitialGraphString(updatedPoints);
                    console.log("Utilisation de la chaîne locale:", currentServerGraphString);
                }

                // Générer la nouvelle chaîne de caractères
                let newGraphString = currentServerGraphString;
                try {
                    newGraphString = safeGenerateGraphString(
                        selectedPoint,
                        tempAddedPoint,
                        endPoint,
                        currentServerGraphString,
                        newCurveMap,
                        updatedPoints
                    );
                    console.log("Nouvelle chaîne générée:", newGraphString);
                    setGraphString(newGraphString);
                } catch (error) {
                    console.error("Erreur lors de la génération de la chaîne graphString:", error);
                    toast.warning("Avertissement: La détection de fin de partie pourrait ne pas fonctionner correctement.", {autoClose: 1500});
                }

                // Envoyer le mouvement avec la nouvelle chaîne
                onMove({
                    type: 'draw_curve',
                    curve: adjustedCurve,
                    startPoint: selectedPoint.label,
                    endPoint: endPoint.label,
                    graphString: newGraphString
                });

            } catch (error) {
                console.error("Erreur lors de la récupération de l'état du jeu:", error);

                // En cas d'erreur, utiliser notre chaîne locale
                let newGraphString = graphString;
                try {
                    if (!newGraphString) {
                        newGraphString = generateInitialGraphString(updatedPoints);
                    }

                    newGraphString = safeGenerateGraphString(
                        selectedPoint,
                        tempAddedPoint,
                        endPoint,
                        newGraphString,
                        newCurveMap,
                        updatedPoints
                    );
                    setGraphString(newGraphString);
                } catch (genError) {
                    console.error("Erreur lors de la génération de la chaîne graphString:", genError);
                    toast.warning("Avertissement: La détection de fin de partie pourrait ne pas fonctionner correctement.", {autoClose: 1500});
                }

                // Envoyer le mouvement avec la chaîne locale
                onMove({
                    type: 'draw_curve',
                    curve: adjustedCurve,
                    startPoint: selectedPoint.label,
                    endPoint: endPoint.label,
                    graphString: newGraphString
                });
            }
        }

        setIsDrawing(false);
        setSelectedPoint(null);
    };


    const resetDrawing = () => {
        setCurrentCurve([]);
        setIsDrawing(false);
        setSelectedPoint(null);
        setAwaitingPointPlacement(false);
    };

    const handleMouseMove = (event) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const pos = roundCoordinates(getMousePos(canvas, event));

        setCurrentCurve(prevCurve => {
            const newCurve = [...prevCurve, {x: pos.x, y: pos.y}];
            if (newCurve.length > 1) {
                const safePoints = Array.isArray(points) ? points : [];
                const safeCurves = Array.isArray(curves) ? curves : [];

                drawGame(canvasRef, safePoints, safeCurves, newCurve);
            }
            return newCurve;
        });
    };

    return (
        <div id="canvas-container" style={{width: '100%', height: '100%'}}>
            <canvas
                ref={canvasRef}
                style={{border: "1px solid black", width: '100%', height: '100%'}}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        </div>
    );
};

export default OnlineCanvas;