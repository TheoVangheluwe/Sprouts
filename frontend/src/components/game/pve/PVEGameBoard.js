import React, { useState } from 'react';
import Canvas from './Canvas';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GameBoard = () => {
  const [points, setPoints] = useState([]);
  const [curves, setCurves] = useState([]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Menu */}
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mb-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Menu</h1>
        <div className="space-y-4">
          <button className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 w-full">
            Jeux Local
          </button>
          <button className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 w-full">
            Jeux Multi
          </button>
          <button className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 w-full">
            Paramètres
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Joueur contre IA</h1>
        <div className="w-full max-w-full aspect-square bg-gray-50">
          <Canvas
            points={points}
            setPoints={setPoints}
            curves={curves}
            setCurves={setCurves}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={1500}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        className="mt-4"
      />
    </div>
  );
};

export default GameBoard;
