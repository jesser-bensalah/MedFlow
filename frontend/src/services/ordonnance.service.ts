import { api } from '../contexts/api';

export const ordonnanceService = {
 
  getPatientPrescriptions: async (patientId: number) => {
    try {
      const response = await api.get(`/ordonnances/patient/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      throw error;
    }
  },


  getPrescriptionById: async (id: number) => {
    try {
      const response = await api.get(`/ordonnances/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching prescription:', error);
      throw error;
    }
  },

  
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
