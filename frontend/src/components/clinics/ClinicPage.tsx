import React, { useState, useEffect } from 'react';
import { clinicService, userService } from '../../contexts/api';
import { toast } from 'react-toastify';
import { PencilIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/solid';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Clinic {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClinicDto {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface UpdateClinicDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

const ClinicPage: React.FC = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignDoctorModal, setShowAssignDoctorModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  const [formData, setFormData] = useState<CreateClinicDto>({
    name: '',
    address: '',
    phone: '',
    email: '',
    isActive: true
  });
  
  const [editFormData, setEditFormData] = useState<UpdateClinicDto>({});
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    try {
      const data = await clinicService.getAllClinics();
      setClinics(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading clinics:', error);
      setError('Erreur lors du chargement des cliniques');
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const data = await clinicService.getAllClinics();
      setClinics(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      setError('Erreur lors de la récupération des cliniques');
      setLoading(false);
    }
  };

  const handleAddClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    
    try {
      const newClinic = await clinicService.createClinic(formData);
      setSuccess('Clinique ajoutée avec succès');
      setShowAddModal(false);
      resetForm();
      loadClinics();
    } catch (error: any) {
      console.error('Error adding clinic:', error);
      setError(error.message || 'Erreur lors de l\'ajout de la clinique');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinic) return;
    
    setFormLoading(true);
    setError('');
    
    try {
      await clinicService.updateClinic(selectedClinic.id, editFormData);
      setSuccess('Clinique modifiée avec succès');
      setShowEditModal(false);
      setSelectedClinic(null);
      setEditFormData({});
      loadClinics();
    } catch (error: any) {
      console.error('Error updating clinic:', error);
      setError(error.message || 'Erreur lors de la modification de la clinique');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClinic = async () => {
    if (!selectedClinic) return;
    
    setFormLoading(true);
    setError('');
    
    try {
      await clinicService.deleteClinic(selectedClinic.id);
      setSuccess('Clinique supprimée avec succès');
      setShowDeleteModal(false);
      setSelectedClinic(null);
      loadClinics();
    } catch (error: any) {
      console.error('Error deleting clinic:', error);
      setError(error.message || 'Erreur lors de la suppression de la clinique');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (clinic: Clinic) => {
    try {
      await clinicService.toggleClinicStatus(clinic.id, !clinic.isActive);
      setSuccess(`Clinique ${!clinic.isActive ? 'activée' : 'désactivée'} avec succès`);
      loadClinics();
    } catch (error: any) {
      console.error('Error toggling clinic status:', error);
      setError(error.message || 'Erreur lors du changement de statut');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      isActive: true
    });
    setError('');
    setSuccess('');
  };

  const openEditModal = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setEditFormData({
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      email: clinic.email,
      isActive: clinic.isActive
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedClinic) return;
    
    try {
      await clinicService.deleteClinic(selectedClinic.id);
      toast.success('Clinique supprimée avec succès');
      setShowDeleteModal(false);
      loadClinics();
    } catch (error) {
      console.error('Error deleting clinic:', error);
      toast.error('Erreur lors de la suppression de la clinique');
    }
  };

  const openAssignDoctorModal = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setSelectedDoctorId('');
    loadDoctors();
    setShowAssignDoctorModal(true);
  };

  const loadDoctors = async () => {
    try {
      const data = await userService.getDoctors();
      setDoctors(data);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error('Erreur lors du chargement des médecins');
    }
  };

  const handleAssignDoctor = async () => {
    if (!selectedClinic || !selectedDoctorId) {
      toast.error('Veuillez sélectionner un médecin');
      return;
    }

    try {
      // Add doctor to clinic 
      await clinicService.addDoctorToClinic(selectedClinic.id, selectedDoctorId);
      
      toast.success('Médecin affecté avec succès à la clinique');
      setShowAssignDoctorModal(false);
      loadClinics();
    } catch (error) {
      console.error('Error assigning doctor:', error);
      toast.error('Erreur lors de l\'affectation du médecin');
    }
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowAssignDoctorModal(false);
    setSelectedClinic(null);
    setEditingClinic(null);
    setEditFormData({});
    setSelectedDoctorId('');
    setError('');
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des cliniques...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Cliniques</h1>
            <p className="text-sm text-gray-600 mt-1">
              {clinics.length} clinique(s) trouvée(s)
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter une clinique
            </button>
          </div>
        </div>

        {/* Clinics Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {clinics.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune clinique</h3>
              <p className="mt-1 text-sm text-gray-500">Commencez par ajouter une nouvelle clinique.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adresse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
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
                {clinics.map((clinic) => (
                  <tr key={clinic.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {clinic.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {clinic.name}
                          </div>
                          <div className="text-sm text-gray-500">{clinic.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{clinic.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{clinic.phone}</div>
                      <div className="text-sm text-gray-500">{clinic.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(clinic)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors ${
                          clinic.isActive 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                            >
                                {clinic.isActive ? 'Active' : 'Inactive'}
                            </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                                <button
                                onClick={() => openEditModal(clinic)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                                title="Modifier"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => openAssignDoctorModal(clinic)}
                                className="text-green-600 hover:text-green-900 mr-3"
                                title="Affecter un médecin"
                              >
                                <UserPlusIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(clinic)}
                                className="text-red-600 hover:text-red-900"
                                title="Supprimer"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )}
</div>
</div>

      {/* Add Clinic Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm" onClick={closeModals}></div>
            <div className="inline-block z-70 align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Ajouter une clinique
                  </h3>
                  <div className="mt-4">
                    <form onSubmit={handleAddClinic}>
                      <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 text-left mb-1">
                          Nom de la clinique
                        </label>
                        <input
                          type="text"
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                          placeholder="Nom de la clinique"
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 text-left mb-1">
                          Adresse
                        </label>
                        <input
                          type="text"
                          id="address"
                          required
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                          placeholder="Adresse complète"
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 text-left mb-1">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                          placeholder="Numéro de téléphone"
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-left mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                          placeholder="Email de contact"
                        />
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleAddClinic}
                  disabled={formLoading}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm ${
                    formLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {formLoading ? 'Enregistrement...' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={closeModals}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
      )}

      {/* Edit Clinic Modal */}
      {showEditModal && selectedClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0  bg-transparent backdrop-blur-sm" onClick={closeModals}></div>
            <div className="inline-block z-70 align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Modifier la clinique
                  </h3>
                  <div className="mt-4">
                    <form onSubmit={handleEditClinic}>
                      <div className="mb-4">
                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 text-left mb-1">
                          Nom de la clinique
                        </label>
                        <input
                          type="text"
                          id="edit-name"
                          required
                          value={editFormData.name || selectedClinic.name}
                          onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                          placeholder="Nom de la clinique"
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700 text-left mb-1">
                          Adresse
                        </label>
                        <input
                          type="text"
                          id="edit-address"
                          required
                          value={editFormData.address !== undefined ? editFormData.address : selectedClinic.address}
                          onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                          placeholder="Adresse complète"
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 text-left mb-1">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          id="edit-phone"
                          required
                          value={editFormData.phone !== undefined ? editFormData.phone : selectedClinic.phone}
                          onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                          placeholder="Numéro de téléphone"
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 text-left mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          id="edit-email"
                          required
                          value={editFormData.email !== undefined ? editFormData.email : selectedClinic.email}
                          onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                          placeholder="Email de contact"
                        />
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleEditClinic}
                  disabled={formLoading}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm ${
                    formLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {formLoading ? 'Enregistrement...' : 'Enregistrer '}
                </button>
                <button
                  type="button"
                  onClick={closeModals}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm" onClick={closeModals}></div>
            <div className="inline-block z-70 align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Supprimer la clinique
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Êtes-vous sûr de vouloir supprimer la clinique <span className="font-semibold">{selectedClinic.name}</span> ? Cette action est irréversible.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteClinic}
                  disabled={formLoading}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${
                    formLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {formLoading ? 'Suppression...' : 'Supprimer'}
                </button>
                <button
                  type="button"
                  onClick={closeModals}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
      )}

      {/* Assign Doctor Modal */}
      {showAssignDoctorModal && selectedClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeModals}></div>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative z-10">
            <h3 className="text-lg font-medium mb-4">Affecter un médecin à {selectedClinic.name}</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sélectionner un médecin
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
              >
                <option value="">Sélectionner un médecin</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.firstName} {doctor.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={closeModals}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleAssignDoctor}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Affecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicPage;