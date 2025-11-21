import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { appointmentService, userService } from '../contexts/api';
import { format, isBefore, parseISO, addDays } from 'date-fns';
import { ordonnanceService } from '../services/ordonnance.service';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-toastify/dist/ReactToastify.css';

interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
  doctor: {
    id: number;
    firstName: string;
    lastName: string;
    specialite: string;
  };
  patient?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  notes?: string;
}

interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  specialite: string;
}

interface TimeSlot {
  value: string;
  label: string;
}

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch prescriptions
  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (user?.id) {
        try {
          const data = await ordonnanceService.getPatientPrescriptions(user.id);
          setPrescriptions(data);
        } catch (error) {
          console.error('Error fetching prescriptions:', error);
        }
      }
    };

    fetchPrescriptions();
  }, [user?.id]);

  // Handle PDF download
  const handleDownloadPdf = async (prescriptionId: number, patientName: string, date: string) => {
    try {
      const blob = await ordonnanceService.generatePdf(prescriptionId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ordonnance-${patientName}-${date}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Erreur lors du téléchargement du PDF');
    }
  };
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModifyModal, setShowModifyModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchPatientAppointments = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const patientAppointments = await appointmentService.getAppointmentsByPatient(user.id);
        setAppointments(patientAppointments);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Erreur lors du chargement des rendez-vous');
        toast.error('Erreur lors du chargement des rendez-vous');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientAppointments();
  }, [user?.id]);

  const fetchDoctors = useCallback(async () => {
    try {
      const doctorsList = await userService.getDoctors();
      setDoctors(doctorsList);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      toast.error('Erreur lors du chargement des médecins');
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9; 
    const endHour = 17; 
    const now = new Date();

    for (let hour = startHour; hour <= endHour; hour++) {
      // Skip times that are in the past for the selected date
      if (date.toDateString() === now.toDateString() && hour < now.getHours()) {
        continue;
      }
      
      // Add full hour slot
      slots.push({
        value: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour}h00`
      });
      
      // Add half hour slot if not the last hour
      if (hour < endHour) {
        slots.push({
          value: `${hour.toString().padStart(2, '0')}:30`,
          label: `${hour}h30`
        });
      }
    }
    
    return slots;
  };

  const handleModifyClick = (appointment: Appointment) => {
    console.log('Modify button clicked', { appointment });
    try {
      setCurrentAppointment(appointment);
      setSelectedDate(parseISO(appointment.date));
      setSelectedTime(appointment.time);
      const slots = generateTimeSlots(parseISO(appointment.date));
      setAvailableTimeSlots(slots);
      setShowModifyModal(true);
      console.log('Modify modal should now be visible');
    } catch (error) {
      console.error('Error in handleModifyClick:', error);
    }
  };

  const handleCancelClick = (appointment: Appointment) => {
    console.log('Cancel button clicked', { appointment });
    try {
      setCurrentAppointment(appointment);
      setShowCancelModal(true);
      console.log('Cancel modal should now be visible');
    } catch (error) {
      console.error('Error in handleCancelClick:', error);
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      const slots = generateTimeSlots(date);
      setAvailableTimeSlots(slots);
      // Reset time if not in available slots
      if (slots.length > 0 && !slots.some(slot => slot.value === selectedTime)) {
        setSelectedTime(slots[0].value);
      }
    }
  };

  const handleUpdateAppointment = async () => {
    if (!currentAppointment || !selectedDate || !selectedTime) {
      console.error('Missing required data for update');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Format the date to YYYY-MM-DD and ensure it's in local time
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      console.log('1. Updating appointment with:', {
        id: currentAppointment.id,
        date: formattedDate,
        time: selectedTime,
        doctorId: currentAppointment.doctor.id,
        patientId: currentAppointment.patient?.id || user?.id,
        status: 'Planifié',
        originalDate: selectedDate.toString(),
        formattedDate: formattedDate
      });

      const updateData = {
        date: formattedDate,
        time: selectedTime,
        doctorId: currentAppointment.doctor.id,
        patientId: currentAppointment.patient?.id || user?.id,
        status: 'Planifié',
        notes: `Modifié par le patient le ${new Date().toLocaleDateString()}`,
        specialite: currentAppointment.doctor.specialite || 'Généraliste',
        // Add timezone information
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
      
      
      console.log('1.1. Raw update payload:', JSON.stringify(updateData, null, 2));

      console.log('2. Sending update data:', updateData);
     
      console.log('3. Current appointments before update:', JSON.parse(JSON.stringify(appointments)));
      
      const updatedAppointment = await appointmentService.updateAppointment(
        currentAppointment.id,
        updateData
      );

      console.log('4. Update response:', updatedAppointment);

      if (user?.id) {
        console.log('5. Fetching updated appointments...');
        // Add a small delay to ensure the backend has time to process the update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const updatedAppointments = await appointmentService.getAppointmentsByPatient(user.id);
        console.log('6. Fetched updated appointments:', updatedAppointments);
        
        // Check if the updated appointment is in the response
        const updatedAppt = updatedAppointments.find(a => a.id === currentAppointment.id);
        console.log('7. Found updated appointment in response:', updatedAppt);
        
        if (!updatedAppt) {
          console.error('Updated appointment not found in the response');
          throw new Error('Failed to retrieve updated appointment');
        }
        
        // Log the changes
        console.log('8. Changes made:', {
          before: {
            date: currentAppointment.date,
            time: currentAppointment.time,
            doctorId: currentAppointment.doctor.id
          },
          after: {
            date: updatedAppt.date,
            time: updatedAppt.time,
            doctorId: updatedAppt.doctor?.id
          }
        });
        
        // Update the state
        setAppointments(updatedAppointments);
        console.log('9. State updated with new appointments');
      }
      
      setShowModifyModal(false);
      toast.success('Rendez-vous modifié avec succès');
    } catch (err: unknown) {
      console.error('Error updating appointment:', err);
      let errorMessage = 'Erreur inconnue';
      
      if (err && typeof err === 'object') {
        if ('response' in err && 
            typeof err.response === 'object' && 
            err.response !== null &&
            'data' in err.response &&
            typeof err.response.data === 'object' &&
            err.response.data !== null &&
            'message' in err.response.data) {
          errorMessage = String(err.response.data.message);
        } else if ('message' in err && typeof err.message === 'string') {
          errorMessage = err.message;
        }
      }
      
      console.error('Error details:', errorMessage);
      toast.error(`Erreur lors de la modification du rendez-vous: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!currentAppointment) return;
    
    try {
      setIsSubmitting(true);
      await appointmentService.requestCancellation(
        currentAppointment.id,
        cancellationReason
      );
      
      setAppointments(prev => 
        prev.map(appt => 
          appt.id === currentAppointment.id 
            ? { ...appt, status: 'Annulé' } 
            : appt
        )
      );
      
      setShowCancelModal(false);
      setCancellationReason('');
      toast.success('Demande d\'annulation envoyée avec succès');
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      toast.error('Erreur lors de la demande d\'annulation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAppointmentDate = (dateString?: string, timeString?: string) => {
    console.log('Formatting date:', { dateString, timeString });
    
    if (!dateString || !timeString) {
      console.error('Missing date or time string');
      return 'Date non définie';
    }
    
    try {
      // Format the date string to YYYY-MM-DD if it's in a different format
      const formattedDate = dateString.split('T')[0]; // In case it's an ISO string
      
      // Extract date parts from the date string (format: YYYY-MM-DD)
      const [year, month, day] = formattedDate.split('-').map(Number);
      
      // Extract time parts from the time string (format: HH:MM)
      const [hours, minutes] = timeString.split(':').map(Number);
      
      // Create a new date object with the extracted values
      const date = new Date(year, month - 1, day, hours, minutes);
      
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      // Format the date in a user-friendly way in French
      // Note: Using 'H' for 24-hour format without leading zero, 'HH' with leading zero
      return format(date, "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr });
    } catch (e) {
      console.error('Error formatting date:', {
        error: e,
        dateString,
        timeString,
        date: new Date().toISOString()
      });
      return 'Date invalide';
    }
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmé':
        return 'bg-blue-100 text-blue-800';
      case 'annulé':
        return 'bg-red-100 text-red-800';
      case 'terminé':
        return 'bg-green-100 text-green-800';
      case 'planifié':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Filter upcoming and past appointments
  const now = new Date();
  const upcomingAppointments = appointments
    .filter(appt => {
      if (!appt.date || !appt.time) return false;
      try {
        const [year, month, day] = appt.date.split('T')[0].split('-').map(Number);
        const [hours, minutes] = appt.time.split(':').map(Number);
        const apptDate = new Date(year, month - 1, day, hours, minutes);
        return isBefore(now, apptDate) && appt.status.toLowerCase() !== 'annulé';
      } catch (e) {
        console.error('Error processing appointment date:', e, appt);
        return false;
      }
    })
    .sort((a, b) => {
      try {
        const [yearA, monthA, dayA] = a.date.split('T')[0].split('-').map(Number);
        const [hoursA, minutesA] = a.time.split(':').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA, hoursA, minutesA);
        
        const [yearB, monthB, dayB] = b.date.split('T')[0].split('-').map(Number);
        const [hoursB, minutesB] = b.time.split(':').map(Number);
        const dateB = new Date(yearB, monthB - 1, dayB, hoursB, minutesB);
        
        return dateA.getTime() - dateB.getTime();
      } catch (e) {
        console.error('Error sorting appointments:', e);
        return 0;
      }
    });

  const pastAppointments = appointments
    .filter(appt => {
      if (!appt.date || !appt.time) return false;
      try {
        const [year, month, day] = appt.date.split('T')[0].split('-').map(Number);
        const [hours, minutes] = appt.time.split(':').map(Number);
        const apptDate = new Date(year, month - 1, day, hours, minutes);
        return !isBefore(now, apptDate) || appt.status.toLowerCase() === 'annulé';
      } catch (e) {
        console.error('Error processing appointment date:', e, appt);
        return false;
      }
    })
    .sort((a, b) => {
      try {
        const [yearA, monthA, dayA] = a.date.split('T')[0].split('-').map(Number);
        const [hoursA, minutesA] = a.time.split(':').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA, hoursA, minutesA);
        
        const [yearB, monthB, dayB] = b.date.split('T')[0].split('-').map(Number);
        const [hoursB, minutesB] = b.time.split(':').map(Number);
        const dateB = new Date(yearB, monthB - 1, dayB, hoursB, minutesB);
        
        return dateB.getTime() - dateA.getTime();
      } catch (e) {
        console.error('Error sorting appointments:', e);
        return 0;
      }
    });

  // Modifier Appointment Modal
  const ModifierModal = () => (
    <div className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl border-1">
        <h2 className="text-xl font-bold mb-4">Modifier le rendez-vous</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            minDate={new Date()}
            className="w-full p-2 border border-gray-300 rounded-md"
            dateFormat="dd/MM/yyyy"
            placeholderText="Sélectionner une date"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Heure
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
          >
            {availableTimeSlots.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setShowModifyModal(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            onClick={handleUpdateAppointment}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            disabled={!selectedDate || !selectedTime || isSubmitting}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );

  // Cancel Appointment Modal
  const AnnulerModal = () => (
    <div className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md  border-1">
        <h2 className="text-xl font-bold mb-4">Annuler le rendez-vous</h2>
        
        <p className="mb-4">
          Êtes-vous sûr de vouloir annuler ce rendez-vous ?
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Raison de l'annulation (optionnel)
          </label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={3}
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Pourquoi souhaitez-vous annuler ce rendez-vous ?"
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setShowCancelModal(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            disabled={isSubmitting}
          >
            Non, garder le rendez-vous
          </button>
          <button
            onClick={handleCancelAppointment}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Traitement...' : 'Oui, annuler'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {showModifyModal && <ModifierModal />}
      {showCancelModal && <AnnulerModal />}
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

           {/* Documents Récents */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ordonnances</h3>
                {prescriptions.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune ordonnance disponible</p>
                ) : (
                  <div className="space-y-3">
                    {prescriptions.map((prescription) => {
                      const formattedDate = format(new Date(prescription.date), 'dd/MM/yyyy');
                      const patientName = prescription.patientName || 'Patient';
                      return (
                        <div 
                          key={prescription.id}
                          className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => handleDownloadPdf(prescription.id, patientName, formattedDate)}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">Ordonnance pour {patientName}</p>
                            <p className="text-xs text-gray-500">Médecin: {prescription.doctorName}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">{formattedDate}</span>
                            <button 
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPdf(prescription.id, patientName, formattedDate);
                              }}
                            >
                              Télécharger
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
              {/* Prochains Rendez-vous */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Mes Rendez-vous à venir</h3>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-500 text-sm">{error}</div>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="text-gray-500 text-sm">Aucun rendez-vous à venir</div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {appointment.doctor?.specialite || 'Spécialité non spécifiée'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatAppointmentDate(appointment.date, appointment.time)}
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAppointmentStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleModifyClick(appointment)}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                            disabled={appointment.status.toLowerCase() !== 'planifié'}
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleCancelClick(appointment)}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                            disabled={appointment.status.toLowerCase() !== 'planifié'}
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Historique des Rendez-vous */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Historique des Rendez-vous</h3>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-500 text-sm">{error}</div>
                ) : pastAppointments.length === 0 ? (
                  <div className="text-gray-500 text-sm">Aucun rendez-vous passé</div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {pastAppointments.map((appointment) => (
                      <div key={appointment.id} className="border-b border-gray-100 pb-3 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatAppointmentDate(appointment.date, appointment.time)}
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAppointmentStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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