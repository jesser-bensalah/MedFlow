import React from 'react';

const ReceptionistDashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de board Réceptionniste</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* RDV du jour */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">RDV du jour</h3>
              <div className="mt-2 text-3xl font-bold text-gray-900">42</div>
            </div>
          </div>

          {/* Patients arrivés */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Patients arrivés</h3>
              <div className="mt-2 text-3xl font-bold text-gray-900">18</div>
            </div>
          </div>

          {/* Patients en attente */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Patients en attente</h3>
              <div className="mt-2 text-3xl font-bold text-gray-900">3</div>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Rendez-vous à venir aujourd'hui */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Rendez-vous à venir aujourd'hui</h3>
              <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                + Nouvel RDV
              </button>
            </div>
            
            <div className="space-y-3">
              {[
                { patient: 'Moure', doctor: 'Support J.', time: '09:15', status: 'Confirmé' },
                { patient: 'Petit A.', doctor: 'Dr. Schmidt', time: '10:15', status: 'Confirmé' },
                { patient: 'Garcia M.', doctor: 'Dr Bouslahi', time: '11:30', status: 'En attente' },
                { patient: 'Licen F.', doctor: 'Dr Bonsalah', time: '14:00', status: 'En attente' },
              ].map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{appointment.patient}</div>
                    <div className="text-sm text-gray-500">{appointment.doctor}</div>
                  </div>
                  <div className="text-sm">{appointment.time}</div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    appointment.status === 'Confirmé' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tâches urgentes */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tâches urgentes</h3>
            <div className="space-y-3">
              {[
                { task: 'Préparer dossiers de nouveaux patients', completed: false },
                { task: 'Appeler labo pour résultats', completed: true },
                { task: 'Confirmer RDV demain matin', completed: false },
                { task: 'Ranger l\'archive des factures', completed: false },
              ].map((item, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    readOnly
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className={`ml-3 text-sm ${
                    item.completed ? 'line-through text-gray-500' : 'text-gray-700'
                  }`}>
                    {item.task}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patients arrivés (aujourd'hui) */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Patients arrivés (aujourd'hui)</h3>
            <div className="space-y-2">
              {['Jean Dupont', 'Alice Petit', 'Carlos Garcia', 'Licen Fumeria'].map((patient, index) => (
                <div key={index} className="flex items-center p-2 border rounded">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 rounded mr-3" />
                  <span>{patient}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions Rapides */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions Rapides</h3>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700">
                Prendre RDV
              </button>
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700">
                Enregistrer nouveau Patient
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;