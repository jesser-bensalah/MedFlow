import { useState, useEffect } from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { api } from '../../contexts/api';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

const Consultation = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Date invalide' : date.toLocaleDateString('fr-FR');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date invalide';
    }
  };

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        // Fetch patients 
        const response = await api.get('/users/role/patient');
        
        // Transform the data to match our Patient interface
        const patientsData = response.data.map((patient: any) => ({
          id: patient.id,
          firstName: patient.firstName || 'N/A',
          lastName: patient.lastName || 'N/A',
          email: patient.email || 'N/A',
          phone: patient.phone || 'N/A',
          dateOfBirth: patient.dateNaissance ? formatDate(patient.dateNaissance) : 'N/A',
          gender: patient.gender || 'Non spécifié',
          address: patient.address || 'N/A',
          rawDateOfBirth: patient.dateOfBirth || null
        }));
        
        setPatients(patientsData);
      } catch (error) {
        console.error('Erreur lors du chargement des patients:', error);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPatient(null);
  };

  if (loading) {
    return <div className="p-6">chargement des patients...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Mes Patients
      </h2>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {`${patient.firstName} ${patient.lastName}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.phone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(patient)}
                      className="text-indigo-600 hover:text-indigo-900"
                      aria-label="View details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Aucun patient trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Details Modal */}
      {openDialog && selectedPatient && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 z-70  mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Dossier du Patient </h3>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Nom & prénom :</span> {`${selectedPatient.firstName} ${selectedPatient.lastName}`}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Email:</span> {selectedPatient.email}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Téléphone:</span> {selectedPatient.phone || 'N/A'}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Date de naissance:</span> {selectedPatient.dateOfBirth || 'N/A'}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Adresse:</span> {selectedPatient.address || 'N/A'}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleCloseDialog}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultation;
