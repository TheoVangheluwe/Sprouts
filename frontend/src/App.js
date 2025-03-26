import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import GamePage from './pages/GamePage';
import HomePage from './pages/HomePage';
import WaitingRoom from './components/game/WaitingRoom';
import OnlineGame from './components/Online/OnlineGame';
import './App.css';

const App = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/waiting-room" element={<WaitingRoom />} />
        <Route path="/online/game/:gameId" element={<OnlineGame />} />
      </Routes>
    </Router>
  );
};

export default App;