import React from 'react';

const TechnicPDF = () => {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-black flex items-center justify-center min-h-screen p-6 font-arcade">
        <div className="bg-gray-800 border-4 border-yellow-400 p-6 rounded-lg shadow-2xl w-full max-w-4xl text-center flex flex-col" style={{ height: '90vh' }}>
          <h1 className="text-3xl text-yellow-300 font-bold mb-4">
            Documentation du Projet
          </h1>
        
          <div className="flex-grow overflow-hidden rounded-md shadow-inner border-2 border-gray-700">
            <iframe
              src="/static/doc.pdf"
              title="Mentions Légales PDF"
              className="w-full h-full"
              frameBorder="0"
            ></iframe>
          </div>
        
          <p className="text-sm text-gray-400 mt-4">
            Si le PDF ne s’affiche pas, <a href="/static/doc.pdf" className="text-blue-400 underline hover:text-yellow-300">cliquez ici pour le télécharger</a>.
          </p>
        </div>
    </div>
  );
};

export default TechnicPDF;
