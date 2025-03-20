import React, { useState } from 'react';
import Canvas from './Canvas';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './GameBoard.css';

const GameBoard = () => {
  const [points, setPoints] = useState([]);
  const [curves, setCurves] = useState([]);
  const [grapheChaine, setGrapheChaine] = useState("");

  return (
    <div className="game-container">
      <h1>Sprouts Game</h1>
      <Canvas
        points={points}
        setPoints={setPoints}
        curves={curves}
        setCurves={setCurves}
        setGrapheChaine={setGrapheChaine}
      />
      <ToastContainer position="top-right" autoClose={1500} hideProgressBar={true} newestOnTop={false} closeOnClick={false} rtl={false} pauseOnFocusLoss={false} draggable={false} pauseOnHover={false} />
      {/*<pre>{grapheChaine}</pre>*/}
    </div>
  );
};

export default GameBoard;
