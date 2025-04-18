import React from 'react';

const MoveHistory = ({ moves }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg w-64 h-full overflow-y-auto text-white">
      <h2 className="text-xl font-bold mb-4">Historique des Coups</h2>
      <ul>
        {moves.map((move, index) => (
          <li key={index} className="mb-2">
            {index + 1}. {move}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MoveHistory;
