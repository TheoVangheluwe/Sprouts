import React, {useEffect, useRef, useState} from 'react';
import {toast} from 'react-toastify';
import {
    drawGame,
    getMousePos,
    getNearPoint,
    canConnect,
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

    // Fonction améliorée pour valider et nettoyer les chaînes graphString
    const validateGraphString = (graphString, pointsArray = points) => {
        if (!graphString) {
            return generateInitialGraphString(pointsArray); // Générer une nouvelle chaîne si vide
        }

        // Nettoyage des problèmes connus
        graphString = graphString
            .replace(/^\.\}/g, '')          // Supprimer .} au début
            .replace(/\.\.\}/g, '.}')       // Corriger les doubles points
            .replace(/\}\}/g, '}')          // Corriger les doubles accolades
            .replace(/\.+\}/g, '.}')        // Corriger les multiples points avant }
            .replace(/\.\./g, '.')          // Corriger les points consécutifs
            .replace(/\s/g, '');            // Supprimer les espaces

        // Si après correction, la chaîne commence par }, la considérer comme invalide
        if (graphString.startsWith('}')) {
            return generateInitialGraphString(pointsArray);
        }

        // S'assurer que la chaîne se termine correctement
        if (!graphString.endsWith('!')) {
            graphString = graphString.endsWith('}') ? graphString + '!' : graphString + '}!';
        }

        // Vérifier que la chaîne contient au moins une région valide
        if (!graphString.includes('.}')) {
            // Créer une chaîne de base avec tous les points
            const baseChain = pointsArray.map(p => p.label).join('.') + '.}!';
            return baseChain;
        }

        // NOUVEAU: Vérifier que tous les points sont présents dans la chaîne
        if (pointsArray && pointsArray.length > 0) {
            // Obtenir tous les labels de points
            const pointLabels = pointsArray.map(p => p.label);

            // Vérifier quels points sont absents de la chaîne
            const missingPoints = pointLabels.filter(label => !graphString.includes(label));

            // Si des points sont manquants, les ajouter
            if (missingPoints.length > 0) {
                console.warn("Points manquants dans la chaîne:", missingPoints);

                // Ajouter les points manquants sous forme de régions isolées
                let correctedGraphString = graphString;

                // Si la chaîne se termine par !
                if (correctedGraphString.endsWith('!')) {
                    correctedGraphString = correctedGraphString.substring(0, correctedGraphString.length - 1);
                }

                // Ajouter chaque point manquant comme une région isolée
                missingPoints.forEach(label => {
                    correctedGraphString += `${label}.}`;
                });

                // Terminer la chaîne correctement
                if (!correctedGraphString.endsWith('!')) {
                    correctedGraphString += '!';
                }

                return correctedGraphString;
            }
        }

        return graphString;
    };

    // Fonction pour vérifier si le jeu est terminé
    const checkGameOver = async (graphString) => {
    try {
        // Valider la chaîne avant de l'envoyer
        graphString = validateGraphString(graphString);

        const response = await fetch('/api/is_game_over/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({chain: graphString})
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log(`Vérification de fin de partie: ${data.game_over ? 'OUI' : 'NON'}`);

        if (data.game_over) {
            console.log("Le jeu est terminé - le joueur actuel ne peut plus jouer");
        }

        return data.game_over;
    } catch (error) {
        console.error('Error checking game over:', error);
        return false;
    }
};

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
                return validateGraphString(currentString, pointsData);
            }
            if (!addedPoint || !addedPoint.label) {
                console.warn("safeGenerateGraphString: addedPoint invalide");
                return validateGraphString(currentString, pointsData);
            }
            if (!endPoint || !endPoint.label) {
                console.warn("safeGenerateGraphString: endPoint invalide");
                return validateGraphString(currentString, pointsData);
            }

            // Valider le format de la chaîne d'entrée
            if (!currentString) {
                console.warn("safeGenerateGraphString: currentString invalide, génération d'une chaîne initiale");
                currentString = generateInitialGraphString(pointsData);
            } else {
                currentString = validateGraphString(currentString, pointsData);
            }

            if (!curveMapData) {
                console.warn("safeGenerateGraphString: curveMap invalide, utilisation d'une Map vide");
                curveMapData = new Map();
            }

            if (!pointsData || !Array.isArray(pointsData) || pointsData.length === 0) {
                console.warn("safeGenerateGraphString: points invalides");
                return validateGraphString(currentString, pointsData);
            }

            // Vérifier que les points existent bien dans la liste des points
            const startExists = pointsData.some(p => p.label === startPoint.label);
            const endExists = pointsData.some(p => p.label === endPoint.label);

            if (!startExists || !endExists) {
                console.warn(`safeGenerateGraphString: les points ne sont pas dans la liste (start: ${startExists}, end: ${endExists})`);
                return validateGraphString(currentString, pointsData);
            }

            // Appel sécurisé à la fonction generateGraphString
            let newString;
            try {
                newString = generateGraphString(
                    startPoint,
                    addedPoint,
                    endPoint,
                    currentString,
                    curveMapData,
                    pointsData
                );

                // Validation finale de la chaîne générée
                newString = validateGraphString(newString, pointsData);

                // NOUVEAU: Vérification supplémentaire
                // S'assurer que la nouvelle chaîne contient tous les points
                const allPointsIncluded = pointsData.every(p => newString.includes(p.label));
                if (!allPointsIncluded) {
                    console.error("La chaîne générée ne contient pas tous les points, reconstruction nécessaire");
                    // Reconstruire une chaîne correcte à partir de zéro
                    const baseChain = pointsData.map(p => p.label).join('.') + '.}';
                    newString = `${startPoint.label}${addedPoint.label}${endPoint.label}.}${baseChain}!`;
                    newString = validateGraphString(newString, pointsData);
                }
            } catch (error) {
                console.error("Erreur dans generateGraphString:", error);
                // En cas d'erreur, générer une chaîne simplifiée qui inclut tous les points
                newString = `${startPoint.label}${addedPoint.label}${endPoint.label}.}`;

                // Ajouter tous les autres points comme régions isolées
                pointsData.forEach(p => {
                    if (p.label !== startPoint.label && p.label !== endPoint.label && p.label !== addedPoint.label) {
                        newString += `${p.label}.}`;
                    }
                });

                newString += '!';

                // Valider cette chaîne simplifiée
                newString = validateGraphString(newString, pointsData);
            }

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

            // En cas d'erreur générale, générer une chaîne qui inclut explicitement tous les points
            let safeString = `${startPoint ? startPoint.label : ''}${addedPoint ? addedPoint.label : ''}${endPoint ? endPoint.label : ''}.}`;

            // Ajouter tous les points pour s'assurer qu'aucun n'est perdu
            if (pointsData && Array.isArray(pointsData)) {
                const usedLabels = [
                    startPoint ? startPoint.label : '',
                    endPoint ? endPoint.label : '',
                    addedPoint ? addedPoint.label : ''
                ];

                pointsData.forEach(p => {
                    if (!usedLabels.includes(p.label)) {
                        safeString += `${p.label}.}`;
                    }
                });
            }

            if (!safeString.endsWith('!')) {
                safeString += '!';
            }

            return validateGraphString(safeString, pointsData);
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
            const initialGraphString = generateInitialGraphString(newPoints);
            setGraphString(initialGraphString);

            // Envoyer la chaîne graphString initiale au serveur
            const gameId = window.location.pathname.split('/').pop();
            if (gameId) {
                fetch(`/api/game/${gameId}/move/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        type: 'initialize_points',
                        points: newPoints,
                        graphString: initialGraphString
                    })
                }).catch(error => {
                    console.error("Error sending initial graph string:", error);
                });
            }
        } else if (points.length > 0 && graphString === '') {
            const initialGraphString = generateInitialGraphString(points);
            setGraphString(initialGraphString);

            // Envoyer la chaîne graphString au serveur
            const gameId = window.location.pathname.split('/').pop();
            if (gameId) {
                fetch(`/api/game/${gameId}/move/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        type: 'update_graph_string',
                        graphString: initialGraphString
                    })
                }).catch(error => {
                    console.error("Error sending initial graph string:", error);
                });
            }
        }
    }, [setPoints, points, graphString, setCurves]);

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
                        const gameId = window.location.pathname.split('/').pop();
                        const response = await fetch(`/api/game/${gameId}/state/`, {
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

                        // Valider et nettoyer la chaîne du serveur avec tous les points existants
                        currentServerGraphString = validateGraphString(currentServerGraphString, updatedPoints);

                        // Vérification supplémentaire: s'assurer que tous les points sont inclus
                        const allPointsIncluded = updatedPoints.every(p => currentServerGraphString.includes(p.label));
                        if (!allPointsIncluded) {
                            console.error("La chaîne du serveur ne contient pas tous les points, reconstruction nécessaire");

                            // Reconstruire la chaîne à partir de zéro
                            currentServerGraphString = generateInitialGraphString(updatedPoints);
                            console.log("Chaîne reconstruite:", currentServerGraphString);
                        }

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

                            // Validation finale de la chaîne générée
                            newGraphString = validateGraphString(newGraphString);

                            console.log("Nouvelle chaîne générée:", newGraphString);
                            setGraphString(newGraphString);
                        } catch (error) {
                            console.error("Erreur lors de la génération de la chaîne graphString:", error);
                            toast.warning("Avertissement: La détection de fin de partie pourrait ne pas fonctionner correctement.", {autoClose: 1500});

                            // En cas d'erreur, utiliser une chaîne simple mais valide
                            newGraphString = `${selectedPoint.label}${newPoint.label}${endPointToUse.label}.}${validateGraphString(currentServerGraphString)}`;
                        }

                        setAwaitingPointPlacement(false);
                        setCurrentCurve([]);
                        toast.success("Point placé.", {autoClose: 1500});
                        const allPointsInFinalString = updatedPoints.every(p => newGraphString.includes(p.label));
                        if (!allPointsInFinalString) {
                            console.error("La chaîne finale ne contient pas tous les points, correction avant envoi");
                            newGraphString = validateGraphString(newGraphString, updatedPoints);
                            console.log("Chaîne corrigée avant envoi:", newGraphString);
                        }

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

                            // Validation finale de la chaîne générée
                            newGraphString = validateGraphString(newGraphString);

                            setGraphString(newGraphString);

                        } catch (genError) {
                            console.error("Erreur lors de la génération de la chaîne graphString:", genError);
                            toast.warning("Avertissement: La détection de fin de partie pourrait ne pas fonctionner correctement.", {autoClose: 1500});

                            // En cas d'erreur grave, générer une chaîne simple
                            newGraphString = generateInitialGraphString(updatedPoints);
                        }

                        setAwaitingPointPlacement(false);
                        setCurrentCurve([]);
                        toast.success("Point placé.", {autoClose: 1500});

                        // Envoyer le mouvement avec la chaîne locale
                        const isGameOver = await checkGameOver(newGraphString);
                        onMove({
                            type: 'place_point',
                            point: newPoint,
                            curve: currentCurve,
                            graphString: newGraphString,
                            isGameOver: isGameOver
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

        console.log("Nombre de courbes existantes:", curves.length);

        // S'assurer que curves est un tableau
        const safeCurves = Array.isArray(curves) ? curves : [];

        // Utiliser notre fonction simplifiée de détection d'intersection
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
                const gameId = window.location.pathname.split('/').pop();
                const response = await fetch(`/api/game/${gameId}/state/`, {
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

                // Valider et nettoyer la chaîne du serveur avec tous les points existants
                currentServerGraphString = validateGraphString(currentServerGraphString, updatedPoints);

                // Vérification supplémentaire: s'assurer que tous les points sont inclus
                const allPointsIncluded = updatedPoints.every(p => currentServerGraphString.includes(p.label));
                if (!allPointsIncluded) {
                    console.error("La chaîne du serveur ne contient pas tous les points, reconstruction nécessaire");

                    // Reconstruire la chaîne à partir de zéro
                    currentServerGraphString = generateInitialGraphString(updatedPoints);
                    console.log("Chaîne reconstruite:", currentServerGraphString);
                }

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

                    // Validation finale de la chaîne générée
                    newGraphString = validateGraphString(newGraphString);

                    setGraphString(newGraphString);
                } catch (error) {
                    console.error("Erreur lors de la génération de la chaîne graphString:", error);
                    toast.warning("Avertissement: La détection de fin de partie pourrait ne pas fonctionner correctement.", {autoClose: 1500});

                    // En cas d'erreur, générer une chaîne simple
                    newGraphString = `${selectedPoint.label}${tempAddedPoint.label}${endPoint.label}.}${validateGraphString(currentServerGraphString)}`;
                }

                // Formater correctement les points de la courbe avant de les envoyer
                const formattedCurve = adjustedCurve.map(point => ({
                    x: point.x,
                    y: point.y,
                    label: point.label || undefined
                }));
                // Envoyer le mouvement avec la nouvelle chaîne
                // Pas besoin de vérifier la fin de partie ici, ce sera fait lors du placement du point
                onMove({
                    type: 'draw_curve',
                    curve: formattedCurve,
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

                    // Validation finale de la chaîne générée
                    newGraphString = validateGraphString(newGraphString);

                    setGraphString(newGraphString);
                } catch (genError) {
                    console.error("Erreur lors de la génération de la chaîne graphString:", genError);
                    toast.warning("Avertissement: La détection de fin de partie pourrait ne pas fonctionner correctement.", {autoClose: 1500});

                    // En cas d'erreur grave, générer une chaîne simple
                    newGraphString = generateInitialGraphString(updatedPoints);
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