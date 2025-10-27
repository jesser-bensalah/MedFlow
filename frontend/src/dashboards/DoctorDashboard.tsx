import React from 'react';

const DoctorDashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de board Doctor</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Rendez-vous du jour */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Rendez-vous du jour</h3>
              <div className="mt-2 text-3xl font-bold text-gray-900">12</div>
            </div>
          </div>

          {/* Patients arrivés */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Patients arrivés</h3>
              <div className="mt-2 text-3xl font-bold text-gray-900">8</div>
            </div>
          </div>

          {/* Patients vus aujourd'hui */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Patients vus aujourd'hui</h3>
              <div className="mt-2 text-3xl font-bold text-gray-900">8</div>
            </div>
          </div>

          {/* Taux de présence */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Taux de présence</h3>
              <div className="mt-2 text-3xl font-bold text-gray-900">3</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Rendez-vous à venir */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rendez-vous à venir</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {[
                'Neo Dupont J.',
                'Mesin A',
                'Filienne, Taur',
                'Comissile animal',
              ].map((patient, index) => (
                <div key={index} className="p-2 border rounded-lg text-sm">
                  {patient}
                </div>
              ))}
            </div>
          </div>

          {/* Statistiques Personnelles */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Statistiques Personnelles - Consultations par spécialité (Mensuel)
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Trait commis/cerres, %</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Travaux Sciences Tours</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Politain/terreurs</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Résultats de laboratoire urgents */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Résultats de laboratoire urgents</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left text-sm font-medium text-gray-700">Nom</th>
                    <th className="text-left text-sm font-medium text-gray-700">Naïne</th>
                    <th className="text-left text-sm font-medium text-gray-700">Racisme</th>
                    <th className="text-left text-sm font-medium text-gray-700">Tails</th>
                    <th className="text-left text-sm font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-sm">Pneumoniaire à l'aidee</td>
                    <td className="text-sm">30</td>
                    <td className="text-sm">Donné Biel</td>
                    <td className="text-sm">2</td>
                    <td className="text-sm">
                      <button className="text-blue-600 hover:text-blue-800">Voir</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Actions Rapides */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex space-x-4">
            <button className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">
              Annuler
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
              Démarrer consultation rapide
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700">
              Enregistrer nouveau patient
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700">
              Accéder au agenda PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;