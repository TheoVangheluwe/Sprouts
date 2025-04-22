import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReplayCanvas from '../components/replay/ReplayCanvas';

const GameSummaryPage = () => {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    fetch(`/api/game/${gameId}/summary/`, {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setGame(data);
        setStep(0); // on commence au tour 0
      })
      .catch(err => console.error('Erreur:', err));
  }, [gameId]);

  const next = () => {
    if (game && step < game.curves.length) setStep(step + 1);
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black min-h-screen flex flex-col items-center justify-center p-6 font-arcade text-white">
      <div className="bg-gray-800 border-4 border-yellow-400 p-6 rounded-xl shadow-2xl w-full max-w-3xl text-center">
        <h1 className="text-4xl font-bold mb-6 text-yellow-300 animate-pulse">
          🧾 Résumé de la partie #{gameId}
        </h1>

        {game ? (
          <>
            <div className="bg-white border-4 border-yellow-400 rounded-xl p-4 shadow-xl inline-block">
              <ReplayCanvas
                curves={game.curves}
                points={game.points || []}
                currentStep={step}
                initialPointCount={game.selected_points || 3}
              />
            </div>

            <div className="mt-6 flex gap-6 justify-center">
              <button
                onClick={prev}
                disabled={step === 0}
                className={`px-4 py-2 rounded-lg font-bold transition ${
                  step === 0 ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-black'
                }`}
              >
                ← Reculer
              </button>
              <button
                onClick={next}
                disabled={step === game.curves.length}
                className={`px-4 py-2 rounded-lg font-bold transition ${
                  step === game.curves.length ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-black'
                }`}
              >
                Avancer →
              </button>
            </div>

            <p className="mt-3 text-sm text-gray-300">
              Coup n°{step} / {game.curves.length}
            </p>

            <p className="text-sm text-gray-400 mt-1">
              Points de départ : {game.selected_points || 3}
            </p>
          </>
        ) : (
          <p className="text-gray-400">Chargement des données...</p>
        )}
      </div>
    </div>
  );
};

export default GameSummaryPage;

