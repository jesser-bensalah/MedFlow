import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/solid';
import { appointmentService } from '../../services/api';
interface Appointment {
    id: number;
    date: string;
    time: string;
    status: string;
    patient: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    notes?: string;
}

const ListRendezVous = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);
                const appointments = await appointmentService.getAppointmentsByDoctor(user.id);
                setAppointments(appointments);
            } catch (err) {
                console.error('Error fetching appointments:', err);
                setError('Failed to load appointments');
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchAppointments();
        }
    }, [user?.id]);

    const updateAppointmentStatus = async (id: number, status: 'Planifié' | 'Confirmé' | 'Annulé' | 'Terminé') => {
        if (!user?.id) return;
        
        try {
            setUpdatingId(id);
            await appointmentService.updateAppointmentStatus(id, status);
            
            // Update the local state
            setAppointments(prevAppointments => 
                prevAppointments.map(appt => 
                    appt.id === id ? { ...appt, status } : appt
                )
            );
        } catch (err) {
            console.error('Error updating appointment status:', err);
            setError('Échec de la mise à jour du statut du rendez-vous. Veuillez réessayer.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleCancel = (id: number) => {
        if (window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
            updateAppointmentStatus(id, 'Annulé');
        }
    };

    const handleComplete = (id: number) => {
        if (window.confirm('Marquer ce rendez-vous comme terminé ?')) {
            updateAppointmentStatus(id, 'Terminé');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Mes Rendez-vous</h1>

            {appointments.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <p className="text-gray-600">Aucun rendez-vous trouvé.</p>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Patient
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Téléphone
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date et Heure
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Statut
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {appointments.map((appointment) => (
                                <tr key={appointment.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {appointment.patient.firstName} {appointment.patient.lastName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {appointment.patient.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {appointment.patient.phone}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {`${new Date(appointment.date).toLocaleDateString('fr-FR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })} à ${appointment.time}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            appointment.status === 'Confirmé' || appointment.status === 'Terminé'
                                                ? 'bg-green-100 text-green-800'
                                                : appointment.status === 'Annulé' || appointment.status === 'cancelled'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {appointment.status === 'Confirmé'
                                                ? 'Confirmé'
                                                : appointment.status === 'Annulé'
                                                    ? 'Annulé'
                                                    : appointment.status === 'Terminé'
                                                        ? 'Terminé'
                                                        : 'Planifié'}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleCancel(appointment.id)}
                                                disabled={updatingId === appointment.id || appointment.status === 'Annulé'}
                                                className={`p-2 rounded-full ${appointment.status === 'Annulé' 
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                                    : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                                                title="Annuler le rendez-vous"
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleComplete(appointment.id)}
                                                disabled={updatingId === appointment.id || appointment.status === 'Terminé' || appointment.status === 'Annulé'}
                                                className={`p-2 rounded-full ${(appointment.status === 'Terminé' || appointment.status === 'Annulé')
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                                    : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                                                title="Marquer comme terminé"
                                            >
                                                <CheckIcon className="h-5 w-5" />
                                            </button>
                                            {updatingId === appointment.id && (
                                                <div className="ml-2">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ListRendezVous;
