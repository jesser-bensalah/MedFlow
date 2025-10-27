import React from 'react';

const PatientDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">MedFlow</h1>
              </div>
              <nav className="ml-6 flex space-x-8">
                <a href="#" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </a>
                <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Mes Consultations
                </a>
                <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Facturation
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Prise de Rendez-vous */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Prise de Rendez-vous</h3>
              </div>
            </div>

            {/* Mes Consultations */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Mes Consultations</h3>
              </div>
            </div>

            {/* Facturation */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Facturation</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Prochain RDV */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Prochain RDV</h3>
                <div className="text-3xl font-bold text-gray-900">12</div>
              </div>

              {/* Documents */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
                <div className="text-3xl font-bold text-gray-900">18</div>
              </div>

              {/* Rappels Récents */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Rappels Récents</h3>
                <div className="text-3xl font-bold text-gray-900">27</div>
              </div>

              {/* Solde Facturation */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Solde Facturation</h3>
                <div className="text-3xl font-bold text-gray-900">838</div>
              </div>
            </div>

            {/* Middle Column */}
            <div className="space-y-6">
              {/* Prochain Rendez-vous */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Prochain Rendez-vous</h3>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">2025 40M: 16/05/2024</div>
                  <div className="font-medium">Documents</div>
                  <div className="text-sm text-gray-600">20:15 AM</div>
                  <div className="text-sm text-gray-600">26/05 AM : 11:55 2025</div>
                  <button className="w-full mt-4 bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-red-700">
                    Annuler
                  </button>
                </div>
              </div>

              {/* Documents Récents */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Documents Récents</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Ordonance - 15/05/2024</span>
                    <span className="text-xs text-gray-500">15/05/2024</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Ordonance - 15/05/2024</span>
                    <span className="text-xs text-gray-500">15/05/2024</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Compte-rdu - 10/04/2024</span>
                    <span className="text-xs text-gray-500">10/04/2024</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Historique des Consultations */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Historique des Consultations</h3>
                <div className="space-y-2">
                  {['Lisan Doport - 89.30', 'Livres Fossus - 19.30', 'Lisan Paille - 13.30', 
                    'Compte-rendus - 17.15', 'Lide bretail à gueillis - 65.10', 'Cenlar-silfen - 65.10']
                    .map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.split(' - ')[0]}</span>
                        <span>{item.split(' - ')[1]}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Actions Rapides */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Actions Rapides</h3>
                <div className="space-y-3">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700">
                    Prendre un nouveau RDV
                  </button>
                  <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700">
                    Consulter mes résultats
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;