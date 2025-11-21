import { XMarkIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
registerLocale('fr', fr);
setDefaultLocale('fr');

interface Appointment {
  id: number;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
  };
  date: string;
}

interface PrescriptionData {
  expirationDate: Date | null;
  medicaments: string;
}

interface OrdonnanceProps {
    appointmentId: number | null;
    onClose: () => void;
}

const Ordonnance = ({ appointmentId, onClose }: OrdonnanceProps) => {
    const { user } = useAuth();
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prescription, setPrescription] = useState<PrescriptionData>({
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
        medicaments: '' 
    });

    useEffect(() => {
        const fetchAppointment = async () => {
            if (!appointmentId) return;
            
            try {
                setLoading(true);
                console.log('Fetching appointment with ID:', appointmentId);
                const response = await axios.get(`http://localhost:3001/appointment/${appointmentId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                console.log('Appointment data:', response.data);
                setAppointment(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching appointment:', err);
                if (axios.isAxiosError(err) && err.response) {
                    console.error('Error response data:', err.response.data);
                    console.error('Error status:', err.response.status);
                    setError(`Erreur ${err.response.status}: ${err.response.data?.message || 'Erreur inconnue'}`);
                } else {
                    setError('Impossible de charger les détails du rendez-vous');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAppointment();
    }, [appointmentId]);

    const handleSave = async () => {
        if (!appointmentId || !prescription.expirationDate || !prescription.medicaments.trim()) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            const now = new Date();
            const expirationDate = prescription.expirationDate || new Date();
            
            // Format date as YYYY-MM-DD for the database
            const formatDateForBackend = (date: Date) => {
                const d = new Date(date);
                return d.toISOString().split('T')[0]; // Returns YYYY-MM-DD
            };

            const requestData = {
                date: formatDateForBackend(now),
                dateExpiration: formatDateForBackend(expirationDate),
                medicaments: prescription.medicaments,
                patientId: Number(appointment?.patient.id),
                doctorId: Number(user?.id),
                patientName: `${appointment?.patient.firstName} ${appointment?.patient.lastName}`,
                doctorName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Médecin',
                appointmentId: appointmentId,
                notes: '',
                nomClinique: 'Clinique par défaut' 
            };

            console.log('Sending data to backend:', requestData);

            const response = await axios.post(
                'http://localhost:3001/ordonnances',
                requestData,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 201) {
                toast.success('Ordonnance créée avec succès !', {
                    position: 'top-right',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
                onClose();
            }
        } catch (err: any) {
            console.error('Error saving prescription:', err);
            const errorMessage = err.response?.data?.message || 'Erreur lors de l\'enregistrement de l\'ordonnance. Veuillez réessayer.';
            setError(errorMessage);
            toast.error(errorMessage, {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!appointmentId) return null;


    return (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[70%] overflow-y-auto border z-[60] relative">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-semibold">Ordonnance </h2>
                    <h3 className="text-xl font-semibold">clinic  </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Fermer"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Médecin</h3>
                            <div className="flex items-center h-[42px] px-4 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                              {user ? `${user.firstName} ${user.lastName}` : 'Chargement...'}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Patient</h3>
                            <div className="flex items-center h-[42px] px-4 border border-gray-300 rounded-md bg-white">
                                {loading ? (
                                    <span className="text-gray-500">Chargement...</span>
                                ) : error ? (
                                    <span className="text-red-500 text-sm">{error}</span>
                                ) : (
                                    `${appointment?.patient?.firstName || ''} ${appointment?.patient?.lastName || ''}`
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Date de rendez-vous</h3>
                            <div className="flex items-center h-[42px] px-4 border border-gray-300 rounded-md bg-white">
                                {loading ? (
                                    <span className="text-gray-500">Chargement...</span>
                                ) : error ? (
                                    <span className="text-red-500 text-sm">-</span>
                                ) : (
                                    new Date(appointment?.date || '').toLocaleDateString('fr-FR')
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Valable jusqu'à</h3>
                            <div className="h-[42%] w-[100%] ">
                                <div className="relative">
                                    <div className="relative">
                                        <DatePicker
                                            selected={prescription.expirationDate}
                                            onChange={(date: Date | null) => {
                                                setPrescription(prev => ({ ...prev, expirationDate: date }));
                                            }}
                                            minDate={new Date()}
                                            className="h-10 w-[305px] pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            dateFormat="dd/MM/yyyy"
                                            placeholderText="Sélectionner une date"
                                            disabled={loading}
                                            locale="fr"
                                            showPopperArrow={false}
                                            popperPlacement="bottom-start"
                                            isClearable
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mr-3">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium mb-3">Médicaments</h3>
                        <textarea
                            value={prescription.medicaments}
                            onChange={(e) => setPrescription(prev => ({ ...prev, medicaments: e.target.value }))}
                            className="w-full h-24 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Liste des médicaments"
                        />  
                           
                        </div>
                    </div>

                    <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                    >
                        Fermer
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !prescription.expirationDate || !prescription.medicaments.trim()}
                        className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm ${
                            isSaving || !prescription.expirationDate || !prescription.medicaments.trim()
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>

                
                </div>
            </div>
       
    );
};

export default Ordonnance;