import React, { useState, useEffect, useCallback } from 'react';
import { DocumentTextIcon, XMarkIcon, DocumentCheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import { appointmentService, userService, invoiceService } from '../../contexts/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Appointment {
  id: number;
  date: string;
  time: string;
  status: 'en attente' | 'confirmé' | 'annulé' | 'terminé';
  patient: Patient;
  doctor: {
    id: number;
    firstName: string;
    lastName: string;
    specialite: string;
  };
  notes?: string;
}

interface ServiceItem {
  description: string;
  amount: number;
}

interface FactureData {
  id?: string;
  numeroFacture?: string;
  patientName: string;
  appointmentDate: string;
  services: ServiceItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'check' | 'transfer';
  notes?: string;
  patientId?: number;
  doctorId?: number;
  clinicId?: number;
  etat: 'Payée' | 'Non Payée';
}

const EditionFacture: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<Omit<FactureData, 'id' | 'numeroFacture'>>({
    patientName: '',
    appointmentDate: '',
    services: [{ description: '', amount: 0 }],
    etat: 'Non Payée',
    total: 0,
    paymentMethod: 'cash',
    notes: '',
    patientId: undefined,
    doctorId: undefined,
    clinicId: undefined
  });

  useEffect(() => {
    if (!user) return;

    const fetchCompletedAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let allAppointments = [];
        
        if (user.role === 'admin') {
          allAppointments = await appointmentService.getAppointments();
        } else if (user.role === 'doctor') {
          allAppointments = await appointmentService.getAppointmentsByDoctor(user.id);
        } else if (user.role === 'receptionist') {
          allAppointments = await appointmentService.getAppointments();
        } else {
          throw new Error('Unauthorized access');
        }
        
        // Filter for completed appointments
        const completedAppointments = allAppointments.filter(
          (appt: any) => appt.status === 'Terminé' || appt.status === 'terminé'
        );

        if (completedAppointments.length === 0) {
          setAppointments([]);
          return;
        }

        // from completed appointments
        const patientIds = [...new Set(completedAppointments.map((appt: any) => appt.patient?.id))];

        // Fetch patient details 
        const patientsData = await Promise.all(
          patientIds.map((id: number) => 
            userService.getUserById(id).catch(() => null)
          )
        );

        // Map appointments with patient details
        const appointmentsWithDetails = completedAppointments.map((appt: any) => {
          const patient = patientsData.find(p => p && p.id === appt.patient?.id) || appt.patient;
          return {
            ...appt,
            patient: {
              id: patient?.id || 0,
              firstName: patient?.firstName || 'Unknown',
              lastName: patient?.lastName || 'Patient',
              email: patient?.email || 'N/A',
              phone: patient?.phone || 'N/A'
            }
          };
        });

        setAppointments(appointmentsWithDetails);
      } catch (error: any) {
        console.error('Error fetching completed appointments:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch appointments';
        setError(errorMessage);
        toast.error(`Error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedAppointments();
  }, [user]);

  const handleAppointmentSelect = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setFormData(prev => ({
      ...prev,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      appointmentDate: appointment.date,
      services: [{ description: '', amount: 0 }],
      total: 0,
      paymentMethod: 'cash',
      notes: appointment.notes || '',
      patientId: appointment.patient.id,
      doctorId: appointment.doctor.id,
      clinicId: user?.clinicId
    }));
    setIsModalOpen(true);
  }, [user?.clinicId]);

  const handleAddService = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { description: '', amount: 0 }]
    }));
  }, []);

  const handleRemoveService = useCallback((index: number) => {
    setFormData(prev => {
      const updatedServices = prev.services.filter((_, i) => i !== index);
      return {
        ...prev,
        services: updatedServices,
        total: updatedServices.reduce((sum, service) => sum + (Number(service.amount) || 0), 0)
      };
    });
  }, []);

  const handleServiceChange = useCallback((index: number, field: keyof ServiceItem, value: string | number) => {
    setFormData(prev => {
      const updatedServices = [...prev.services];
      updatedServices[index] = { ...updatedServices[index], [field]: value };
      return {
        ...prev,
        services: updatedServices,
        total: updatedServices.reduce((sum, service) => sum + (Number(service.amount) || 0), 0)
      };
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Format date as YYYY-MM-DD for MySQL
      const formatDateForDb = (dateString: string | Date) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      // Filter out empty services and format the data
      const validServices = formData.services
        .filter(service => service.description.trim() !== '')
        .map(service => ({
          description: service.description.trim(),
          amount: Number(service.amount) || 0
        }));

      if (validServices.length === 0) {
        toast.error('Veuillez ajouter au moins un service');
        return;
      }

      // Prepare the base invoice data
      const invoiceData: any = {
        patientName: formData.patientName,
        appointmentDate: formatDateForDb(formData.appointmentDate),
        services: validServices,
        total: validServices.reduce((sum, service) => sum + service.amount, 0),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        etat: 'Non Payée',
        date: formatDateForDb(new Date())
      };

      // Only include clinicId if it exists
      if (user?.clinicId) {
        invoiceData.clinicId = user.clinicId;
      }

    console.log('Submitting invoice:', invoiceData);
    await invoiceService.createInvoice(invoiceData);
    
// Reset form
setFormData({
  patientName: '',
  appointmentDate: '',
  services: [{ description: '', amount: 0 }],
  total: 0,
  paymentMethod: 'cash',
  notes: '',
  patientId: undefined,
  doctorId: undefined,
  clinicId: user?.clinicId,
  etat: 'Non Payée' 
});
    setIsModalOpen(false);
    toast.success('Facture créée avec succès');
  } catch (error) {
    console.error('Error creating invoice:', error);
    toast.error('Erreur lors de la création de la facture');
  }
}, [formData, user?.clinicId]);


const getStatusBadge = (status: string) => {
  const baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
  switch (status) {
    case 'terminé':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'confirmé':
      return `${baseClasses} bg-blue-100 text-blue-800`;
    case 'annulé':
      return `${baseClasses} bg-red-100 text-red-800`;
    default: 
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
  }
};

return (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-800 mb-6">Facturation</h1>
    
    {loading ? (
      <div>Chargement...</div>
    ) : error ? (
      <div className="text-red-600">{error}</div>
    ) : (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun rendez-vous terminé</h3>
            <p className="mt-1 text-sm text-gray-500">Les rendez-vous terminés apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Médecin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Heure</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {`${appointment.patient.firstName[0]}${appointment.patient.lastName[0]}`.toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {`${appointment.patient.firstName} ${appointment.patient.lastName}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{appointment.patient.email}</div>
                      <div className="text-sm text-gray-500">{appointment.patient.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{`Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`}</div>
                      <div className="text-sm text-gray-500">{appointment.doctor.specialite}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(appointment.date).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500">{appointment.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(appointment.status)}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleAppointmentSelect(appointment)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Créer facture
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div> 
    )}

{isModalOpen && (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    {/* Backdrop */}
    <div 
      className="fixed inset-0 bg-transparent backdrop-blur-sm bg-opacity-75 transition-opacity z-40"
      onClick={() => setIsModalOpen(false)}
      aria-hidden="true"
    ></div>

    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0 ">
      <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      <div className="inline-block align-bottom border-1 bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6 relative z-50">
        <div>
          <div className="mt-3 text-center sm:mt-0 sm:text-left">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Créer une nouvelle facture
            </h3>
            <div className="mt-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient and Doctor Info */}
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Patient</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {formData.patientName}
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Médecin</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedAppointment?.doctor.firstName} {selectedAppointment?.doctor.lastName}
                    </div>
                  </div>
                </div>

                {/* Services List */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Services</label>
                    <button
                      type="button"
                      onClick={handleAddService}
                      className="inline-flex items-center  px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Ajouter un service
                    </button>
                  </div>

                  {formData.services && formData.services.map((service, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 mb-4 items-end">
                      <div className="col-span-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={service.description}
                          onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                          className="mt-1 h-[30px] block w-full rounded-md border-gray-300 shadow-md shadow-gray-400/50 focus:shadow-gray-500/50 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Montant (DT)
                        </label>
                        <div className="flex">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={service.amount || ''}
                            onChange={(e) => handleServiceChange(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="mt-1 h-[30px] block w-full rounded-md border-gray-300 shadow-md shadow-gray-400/50 focus:shadow-gray-500/50 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                          />
                          {formData.services.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveService(index)}
                              className="ml-2 text-red-600 hover:text-red-800"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment Method */}
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Méthode de paiement
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => {
                        const paymentMethod = e.target.value as 'cash' | 'card' | 'check';
                        setFormData({
                          ...formData,
                          paymentMethod,
                          etat: (paymentMethod === 'cash' || paymentMethod === 'check') ? 'Payée' : formData.etat
                        });
                      }}
                      className="mt-1 h-[30px] block w-full rounded-md border-gray-300 shadow-md shadow-gray-400/50 focus:shadow-gray-500/50 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    >
                      <option value="cash">Espèces</option>
                      <option value="card">Carte bancaire</option>
                      <option value="check">Chèque</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total
                    </label>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                      {formData.total.toFixed(2)} DT
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="mt-1 min-h-[80px] block w-full rounded-md border-gray-300 shadow-md shadow-gray-400/50 focus:shadow-gray-500/50 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                {/* Form Actions */}
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setFormData({
                        patientName: '',
                        appointmentDate: '',
                        services: [{ description: '', amount: 0 }],
                        total: 0,
                        paymentMethod: 'cash',
                        notes: '',
                        patientId: undefined,
                        doctorId: undefined,
                        clinicId: user?.clinicId,
                        etat: 'Non Payée'
                      });
                      setSelectedAppointment(null);
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-1 sm:text-sm"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-2 sm:text-sm"
                  >
                    <DocumentCheckIcon className="h-5 w-5 mr-2" />
                    Générer la facture
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
  </div>
  
)};

export default EditionFacture;