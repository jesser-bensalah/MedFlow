import { api } from '../contexts/api';

export const ordonnanceService = {
  // Get all prescriptions for the current patient
  getPatientPrescriptions: async (patientId: number) => {
    try {
      const response = await api.get(`/ordonnances/patient/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      throw error;
    }
  },

  // Get a single prescription by ID
  getPrescriptionById: async (id: number) => {
    try {
      const response = await api.get(`/ordonnances/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching prescription:', error);
      throw error;
    }
  },

  // Generate PDF for a prescription
  generatePdf: async (id: number) => {
    try {
      const response = await api.get(`/ordonnances/${id}/pdf`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
};
