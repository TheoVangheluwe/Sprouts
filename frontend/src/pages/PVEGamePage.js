import React, { useState } from 'react';
import Canvas from '../components/game/Canvas';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PVEGamePage = () => {
    const [points, setPoints] = useState([]);
    const [curves, setCurves] = useState([]);
  
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-screen-lg">
          <h1 className="text-2xl font-bold mb-4 text-center">Joueur contre IA</h1>
          <div className="w-full max-w-screen-md aspect-square bg-gray-50">
            <Canvas
              points={points}
              setPoints={setPoints}
              curves={curves}
              setCurves={setCurves}
              className="w-full h-full"
            />
          </div>
        </div>
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
  

export default PVEGamePage;
