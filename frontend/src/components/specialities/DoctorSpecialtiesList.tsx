import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { appointmentService } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserDoctor, 
  faSearch, 
  faPlus, 
  faTrash, 
  faEdit, 
  faEye, 
  faCalendar,
  faTimes,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import Select from 'react-select';
import { Link } from 'react-router-dom';
import { userService } from '../../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
}

interface Doctor {
    id: number;
    firstName: string;
    lastName: string;
    specialite?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
}

const DoctorSpecialtiesList: React.FC = () => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<{value: number; label: string} | null>(null);
    const [appointmentDate, setAppointmentDate] = useState<Date>(new Date());
    const [appointmentTime, setAppointmentTime] = useState('09:00');
    
    // Define time slots for appointments
    const timeSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];
    const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get authentication token
            const token = localStorage.getItem('access_token') || 
                         localStorage.getItem('token') ||
                         sessionStorage.getItem('access_token') ||
                         sessionStorage.getItem('token');
            
            if (!token) {
                throw new Error('Authentication required. Please log in to view doctors.');
            }

            try {
                const data = await userService.getDoctors();
                
                if (!Array.isArray(data)) {
                    throw new Error('Invalid data format received from server');
                }
                
                const formattedDoctors = data.map((doctor: any) => ({
                    id: doctor.id,
                    firstName: doctor.firstName || '',
                    lastName: doctor.lastName || '',
                    specialite: doctor.specialite || 'Not specified',
                    email: doctor.email || 'No email provided',
                    phone: doctor.phone || 'No phone provided',
                    isActive: doctor.isActive !== false // Default to true if not specified
                }));
                
                setDoctors(formattedDoctors);
                setFilteredDoctors(formattedDoctors);
            } catch (err: any) {
                console.error('Error fetching doctors:', err);
                throw new Error(err.message || 'Failed to load doctors. Please try again later.');
            }
        } catch (err: any) {
            console.error('Error in fetchDoctors:', err);
            setError(err.message || 'An error occurred while fetching doctors');
            setDoctors([]);
            setFilteredDoctors([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredDoctors(doctors);
        } else {
            const lowercasedFilter = searchTerm.toLowerCase();
            const filtered = doctors.filter(doctor => 
                (doctor.firstName?.toLowerCase().includes(lowercasedFilter) ||
                doctor.lastName?.toLowerCase().includes(lowercasedFilter) ||
                doctor.specialite?.toLowerCase().includes(lowercasedFilter) ||
                doctor.email?.toLowerCase().includes(lowercasedFilter))
            );
            setFilteredDoctors(filtered);
        }
    }, [searchTerm, doctors]);

    // Fetch patients from API
    const fetchPatients = useCallback(async () => {
        try {
            setIsLoadingPatients(true);
            
            // Fetch patients from the API
            const response = await userService.getUsersByRole('patient');
            
            if (response && Array.isArray(response)) {
                const formattedPatients: Patient[] = response.map((user: any) => ({
                    id: user.id,
                    firstName: user.firstName || '',
                    lastName: user.lastName || ''
                }));
                
                setPatients(formattedPatients);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
            // Handle error appropriately
        } finally {
            setIsLoadingPatients(false);
        }
    }, []);

    const handleBookAppointment = async () => {
    if (!selectedPatient?.value || !appointmentDate || !selectedDoctor) {
        toast.error('Veuillez sélectionner un patient, un médecin et une date');
        return;
    }

    try {
        const formattedDate = appointmentDate.toISOString().split('T')[0];
        
        console.log('Sending appointment data:', {
            doctorId: selectedDoctor.id,
            patientId: selectedPatient.value,
            appointmentDate: formattedDate,
            appointmentTime: appointmentTime,
            status: 'Planifié',
            specialite: selectedDoctor.specialite || 'Généraliste'
        });

        await appointmentService.createAppointment({
            doctorId: selectedDoctor.id,
            patientId: selectedPatient.value,
            appointmentDate: formattedDate,
            appointmentTime: appointmentTime,
            status: 'Planifié',
            specialite: selectedDoctor.specialite || 'Généraliste'
        });

        toast.success('Rendez-vous programmé avec succès!');
        setShowAppointmentModal(false);
        setSelectedPatient(null);
        setAppointmentDate(new Date());
        setAppointmentTime('09:00');
    } catch (error) {
        console.error('Error booking appointment:', error);
        toast.error('Une erreur est survenue lors de la prise de rendez-vous');
    }
};

    // Time slots are already defined at the component level

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-700">Loading doctors...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">
                            {error}
                        </p>
                    </div>
                </div>
                <div className="mt-4">
                    <button
                        onClick={fetchDoctors}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
                    <FontAwesomeIcon icon={faUserDoctor} className="mr-2 text-blue-600" />
                    Liste des Médecins
                </h1>
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Rechercher un médecin..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Link
                    to="/admin/doctors/add"
                    className="mt-4 md:mt-0 ml-0 md:ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Ajouter un médecin
                </Link>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {filteredDoctors.length === 0 ? (
                    <div className="text-center py-12">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun médecin trouvé</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm ? 'Aucun médecin ne correspond à votre recherche.' : 'Aucun médecin n\'a été enregistré pour le moment.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {filteredDoctors.map((doctor) => (
                            <div key={doctor.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                                <div className="p-6">
                                    <div className="flex items-center mb-4">
                                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                            <FontAwesomeIcon icon={faUserDoctor} className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {doctor.firstName} {doctor.lastName}
                                            </h3>
                                            <p className="text-sm text-gray-500">{doctor.specialite}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                            </svg>
                                            {doctor.email}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                            </svg>
                                            {doctor.phone}
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <span className={`px-2 py-1 text-xs rounded-full ${doctor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {doctor.isActive ? 'Actif' : 'Inactif'}
                                            </span>
                                            <div className="flex space-x-2">
                                                <Link
                                                    to={`/admin/doctors/${doctor.id}`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Voir les détails"
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </Link>
                                                <Link
                                                    to={`/admin/doctors/edit/${doctor.id}`}
                                                    className="text-yellow-600 hover:text-yellow-900"
                                                    title="Modifier"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </Link>
                                                <button
                                                    className="text-blue-600 hover:text-blue-900 ml-2"
                                                    title="Prendre un rendez-vous"
                                                    onClick={() => {
                                                      setSelectedDoctor(doctor);
                                                      fetchPatients();
                                                      setShowAppointmentModal(true);
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faCalendar} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Appointment Booking Modal */}
            {showAppointmentModal && selectedDoctor && (
              <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                  <button
                    onClick={() => setShowAppointmentModal(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                  </button>
                  
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">
                    Prendre un rendez-vous avec Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Patient
                      </label>
                      <div className="relative">
                        <Select
                          className="w-full text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          classNamePrefix="select"
                          isDisabled={isLoadingPatients}
                          isLoading={isLoadingPatients}
                          isClearable={true}
                          isSearchable={true}
                          name="patient"
                          options={patients.map(patient => ({
                            value: patient.id,
                            label: `${patient.firstName} ${patient.lastName}`,
                            ...patient
                          }))}
                          value={selectedPatient}
                          onChange={(selectedOption) => {
                            setSelectedPatient(selectedOption);
                            setSearchTerm('');
                          }}
                          onInputChange={(inputValue) => setSearchTerm(inputValue)}
                          inputValue={searchTerm}
                          placeholder="Rechercher un patient..."
                          noOptionsMessage={() => 'Aucun patient trouvé'}
                          loadingMessage={() => 'Chargement...'}
                          styles={{
                            control: (provided) => ({
                              ...provided,
                              minHeight: '42px',
                              borderColor: '#d1d5db',
                              '&:hover': {
                                borderColor: '#9ca3af'
                              },
                              boxShadow: 'none'
                            }),
                            option: (provided, state) => ({
                              ...provided,
                              backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
                              color: state.isSelected ? 'white' : '#111827',
                              '&:active': {
                                backgroundColor: state.isSelected ? '#2563eb' : '#e5e7eb'
                              }
                            })
                          }}
                          components={{
                            DropdownIndicator: () => (
                              <div className="px-3">
                                <FontAwesomeIcon icon={faChevronDown} className="text-gray-500" />
                              </div>
                            ),
                            IndicatorSeparator: () => null
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date du rendez-vous
                      </label>
                      <DatePicker
                        selected={appointmentDate}
                        onChange={(date: Date | null) => date && setAppointmentDate(date)}
                        minDate={new Date()}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Sélectionner une date"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Heure du rendez-vous
                      </label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                      >
                        {timeSlots.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAppointmentModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleBookAppointment}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!selectedPatient?.value || !appointmentDate}
                      >
                        Confirmer le rendez-vous
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
    );
  };

export default DoctorSpecialtiesList;