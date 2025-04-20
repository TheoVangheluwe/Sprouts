import React, { useState, useEffect, useRef } from 'react';
import PVECanvas from '../components/game/pve/PVECanvas';
import MoveHistory from '../components/MoveHistory'; // Importer le composant MoveHistory
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PVEGamePage = () => {
    const [phase, setPhase] = useState('menu');
    const [initialPoints, setInitialPoints] = useState(3);
    const [points, setPoints] = useState([]);
    const [curves, setCurves] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [moves, setMoves] = useState([]); // État pour stocker l'historique des coups

    const [timer1, setTimer1] = useState(600); // 10 minutes en secondes
    const [timer2, setTimer2] = useState(600);

    const timerInterval = useRef(null);

    // Formate les secondes en mm:ss
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Gestion du timer à chaque changement de joueur
    useEffect(() => {
        if (phase !== 'game' || gameOver) return;

        // Nettoyer le timer existant
        if (timerInterval.current) clearInterval(timerInterval.current);

        timerInterval.current = setInterval(() => {
            if (currentPlayer === 1) {
                setTimer1((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerInterval.current);
                        setGameOver(true);
                        setPhase('end');
                        return 0;
                    }
                    return prev - 1;
                });
            } else {
                setTimer2((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerInterval.current);
                        setGameOver(true);
                        setPhase('end');
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);

        return () => clearInterval(timerInterval.current);
    }, [currentPlayer, phase]);

    const handleStartGame = () => {
        setPhase('game');
        setGameOver(false);
        setPoints([]);
        setCurves([]);
        setCurrentPlayer(1);
        setTimer1(600);
        setTimer2(600);
        setMoves([]); // Réinitialiser l'historique des coups
    };

    const handleGameOver = (isGameOver) => {
        if (isGameOver) {
            clearInterval(timerInterval.current);
            setGameOver(true);
            setPhase('end');
        }
    };

    const handleRejouer = () => {
        setPhase('menu');
    };

    const handlePlayerChange = () => {
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    };

    const addMove = (move) => {
        setMoves((prevMoves) => [...prevMoves, move]);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black font-arcade text-white p-4">
            <div className="bg-gray-800 border-4 border-yellow-400 p-6 rounded-lg shadow-2xl w-full max-w-screen-lg text-center flex flex-row space-x-4">
                <div className="flex-1">
                    {phase === 'menu' && (
                        <>
                            <h1 className="text-3xl mb-4 animate-pulse text-yellow-300">🎮 Nombre de points initiaux 🎮</h1>
                            <p className="mb-2">Choisissez le nombre de points initiaux :</p>
                            <div className="flex justify-center gap-4 mb-4">
                                {[3, 4, 5, 6].map(n => (
                                    <button
                                        key={n}
                                        className={`px-4 py-2 rounded border-2 border-white transition transform hover:scale-105 ${
                                            initialPoints === n ? 'bg-yellow-400 text-black' : 'bg-gray-700'
                                        }`}
                                        onClick={() => setInitialPoints(n)}
                                    >
                                        {n} points
                                    </button>
                                ))}
                            </div>
                            <button
                                className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded border-2 border-white shadow-md transition-transform hover:scale-110"
                                onClick={handleStartGame}
                            >
                                ▶️ Commencer
                            </button>
                        </>
                    )}

                    {phase === 'game' && (
                        <>
                            <h1 className="text-2xl font-bold mb-4 text-yellow-300">🎲 Joueur contre Joueur</h1>
                            <div className="flex justify-around mb-4 text-xl font-bold">
                                <div className={`${currentPlayer === 1 ? 'text-green-400' : 'text-white'}`}>
                                    🟢 Joueur 1: {formatTime(timer1)}
                                </div>
                                <div className={`${currentPlayer === 2 ? 'text-green-400' : 'text-white'}`}>
                                    🔴 Joueur 2: {formatTime(timer2)}
                                </div>
                            </div>
                            <div className="text-xl mb-4 animate-bounce">
                                🚩 Tour du joueur <span className="text-green-400">{currentPlayer}</span>
                            </div>
                            <div className="flex justify-center items-center w-full" style={{ height: '500px' }}>
                                <PVECanvas
                                    points={points}
                                    setPoints={setPoints}
                                    curves={curves}
                                    setCurves={setCurves}
                                    currentPlayer={currentPlayer}
                                    handlePlayerChange={handlePlayerChange}
                                    handleGameOver={handleGameOver}
                                    initialPointCount={initialPoints}
                                    addMove={addMove} // Passer la fonction pour ajouter un coup
                                />
                            </div>
                            <div className="w-full h-2 bg-yellow-400 my-4"></div> {/* Séparation */}
                            <button
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded border-2 border-white"
                onClick={() => window.location.href = '/menu'}
                >
                ❌ Quitter
            </button>
                        </>
                    )}

                    {phase === 'end' && (
                        <>
                            <h1 className="text-4xl font-bold text-red-600 mb-4 animate-pulse">💥 Fin de la partie !</h1>
                            <p className="text-xl mb-2">
                                🏆 Le joueur{' '}
                                <span className="text-yellow-300">
                                    {(timer1 === 0 || timer2 === 0) ? (timer1 === 0 ? 2 : 1) : (currentPlayer === 1 ? 2 : 1)}
                                </span>{' '}
                                a gagné !
                            </p>
                            <div className="flex gap-4 justify-center mt-6">
                                <button
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded border-2 border-white"
                                    onClick={handleRejouer}
                                >
                                    🔁 Rejouer
                                </button>
                                <button
                                    className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded border-2 border-white"
                                    onClick={() => window.location.href = '/menu'}
                                >
                                    ❌ Quitter
                                </button>
                            </div>
                        </>
                    )}
                </div>
                {phase === 'game' && <MoveHistory moves={moves} />}
            </div>
            <ToastContainer
                position="top-right"
                autoClose={1500}
                hideProgressBar={true}
                closeOnClick={false}
                pauseOnHover={false}
                draggable={false}
                className="mt-4"
            />
        </div>
    );
};

export default PVEGamePage;
