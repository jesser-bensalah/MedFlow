
import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

const API_URL = 'http://localhost:3001';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});


api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token') || 
                 localStorage.getItem('token') ||
                 sessionStorage.getItem('access_token') ||
                 sessionStorage.getItem('token');
    
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      data: response.data
    });
    return response;
  },
  (error: AxiosError) => {
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject({
        message: 'Network Error: Unable to connect to the server. Please check your internet connection.',
        isNetworkError: true
      });
    }
    
    const { status, data } = error.response;
    console.error(`[API Error] ${status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status,
      data,
      headers: error.response.headers
    });
    
    if (status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('token');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject({
      status,
      message: (data as any)?.message || error.message,
      data: data
    });
  }
);

export const appointmentService = {
  // Create a new appointment
  createAppointment: async (appointmentData: {
    patientId: number;
    doctorId: number;
    appointmentDate: string;
    appointmentTime: string;
    specialite: string;
    status?: string;
  }): Promise<any> => {
    try {
      const response = await api.post('/appointment', appointmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  // Get all appointments (admin only)
  getAppointments: async (): Promise<any[]> => {
    try {
      const response = await api.get('/appointment');
      return response.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

  // Get appointments by patient ID
  getAppointmentsByPatient: async (patientId: number): Promise<any[]> => {
    try {
      const response = await api.get(`/appointment/patient/${patientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching appointments for patient ${patientId}:`, error);
      throw error;
    }
  },

  // Get appointments by doctor id
  getAppointmentsByDoctor: async (doctorId: number): Promise<any[]> => {
    try {
      const response = await api.get(`/appointment/doctor/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching appointments for doctor ${doctorId}:`, error);
      throw error;
    }
  },

  // Get appointment by id
  getAppointmentById: async (id: number): Promise<any> => {
    try {
      const response = await api.get(`/appointment/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching appointment ${id}:`, error);
      throw error;
    }
  },

  // Update appointment
  updateAppointment: async (id: number, updateData: any): Promise<any> => {
    try {
      const response = await api.put(`/appointment/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Error updating appointment ${id}:`, error);
      throw error;
    }
  },

  // Delete appointment
  deleteAppointment: async (id: number): Promise<void> => {
    try {
      await api.delete(`/appointment/${id}`);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  },

  // Update appointment status
  updateAppointmentStatus: async (id: number, status: string): Promise<any> => {
    try {
      const response = await api.patch(`/appointment/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  },

  // Request appointment cancellation
  requestCancellation: async (id: number, reason?: string): Promise<any> => {
    try {
      const response = await api.post(`/appointment/${id}/request-cancellation`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error requesting appointment cancellation:', error);
      throw error;
    }
  },
};

export const clinicService = {
  // Get all clinics
  getAllClinics: async (): Promise<any[]> => {
    try {
      const response = await api.get('/clinics');
      return response.data.map((clinic: any) => ({
        id: clinic.idClinic,
        name: clinic.nomClinic,
        address: clinic.adresseClinic,
        phone: clinic.telephoneClinic,
        email: clinic.emailClinic,
        isActive: clinic.isActive || true,
        listeMedecins: clinic.listeMedecins || [],
        listePatients: clinic.listePatients || []
      }));
    } catch (error) {
      console.error('Error fetching clinics:', error);
      throw error;
    }
  },

  // Get clinic by ID
  getClinicById: async (id: number): Promise<any> => {
    try {
      const response = await api.get(`/clinics/${id}`);
      const clinic = response.data;
      return {
        id: clinic.idClinic,
        name: clinic.nomClinic,
        address: clinic.adresseClinic,
        phone: clinic.telephoneClinic,
        email: clinic.emailClinic,
        isActive: clinic.isActive || true,
        listeMedecins: clinic.listeMedecins || [],
        listePatients: clinic.listePatients || []
      };
    } catch (error) {
      console.error(`Error fetching clinic with ID ${id}:`, error);
      throw error;
    }
  },

  // clinic methods
  createClinic: async (clinicData: {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}): Promise<any> => {
  try {
    if (!clinicData.name) {
      throw new Error('Clinic name is required');
    }

    const backendData = {
      nomClinic: clinicData.name,
      adresseClinic: clinicData.address || null,
      telephoneClinic: clinicData.phone || null,
      emailClinic: clinicData.email || null,
      isActive: clinicData.isActive !== undefined ? clinicData.isActive : true,
      listeMedecins: '[]',  
      listePatients: '[]'   
    };
    
    console.log('Sending clinic data to backend:', JSON.stringify(backendData, null, 2));
    const response = await api.post('/clinics', backendData);
    
    return {
      id: response.data.idClinic,
      name: response.data.nomClinic,
      address: response.data.adresseClinic,
      phone: response.data.telephoneClinic,
      email: response.data.emailClinic,
      isActive: response.data.isActive || true,
      listeMedecins: response.data.listeMedecins || [],
      listePatients: response.data.listePatients || []
    };
  } catch (error) {
    console.error('Error creating clinic:', error);
    throw error;
  }
},

  updateClinic: async (id: number, updateData: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
  }): Promise<any> => {
    try {
      const backendData: any = {};
      if (updateData.name !== undefined) backendData.nomClinic = updateData.name;
      if (updateData.address !== undefined) backendData.adresseClinic = updateData.address;
      if (updateData.phone !== undefined) backendData.telephoneClinic = updateData.phone;
      if (updateData.email !== undefined) backendData.emailClinic = updateData.email;
      if (updateData.isActive !== undefined) backendData.isActive = updateData.isActive;
      
      const response = await api.put(`/clinics/${id}`, backendData);
      
      return {
        id: response.data.idClinic,
        name: response.data.nomClinic,
        address: response.data.adresseClinic,
        phone: response.data.telephoneClinic,
        email: response.data.emailClinic,
        isActive: response.data.isActive || true,
        listeMedecins: response.data.listeMedecins || [],
        listePatients: response.data.listePatients || []
      };
    } catch (error) {
      console.error(`Error updating clinic with ID ${id}:`, error);
      throw error;
    }
  },

  deleteClinic: async (id: number): Promise<void> => {
    try {
      await api.delete(`/clinics/${id}`);
    } catch (error) {
      console.error(`Error deleting clinic with ID ${id}:`, error);
      throw error;
    }
  },

  toggleClinicStatus: async (id: number, isActive: boolean): Promise<any> => {
    try {
      const response = await api.patch(`/clinics/${id}`, { isActive });
      
      return {
        id: response.data.idClinic,
        name: response.data.nomClinic,
        address: response.data.adresseClinic,
        phone: response.data.telephoneClinic,
        email: response.data.emailClinic,
        isActive: response.data.isActive || true,
        listeMedecins: response.data.listeMedecins || [],
        listePatients: response.data.listePatients || []
      };
    } catch (error) {
      console.error(`Error toggling status for clinic with ID ${id}:`, error);
      throw error;
    }
  },

  addDoctorToClinic: async (clinicId: number, doctorId: string): Promise<any> => {
    try {
      const response = await api.post(`/clinics/${clinicId}/medecins/${doctorId}`);
      
      return {
        id: response.data.idClinic,
        name: response.data.nomClinic,
        address: response.data.adresseClinic,
        phone: response.data.telephoneClinic,
        email: response.data.emailClinic,
        isActive: response.data.isActive || true,
        listeMedecins: response.data.listeMedecins || [],
        listePatients: response.data.listePatients || []
      };
    } catch (error) {
      console.error(`Error adding doctor ${doctorId} to clinic ${clinicId}:`, error);
      throw error;
    }
  },

  removeDoctorFromClinic: async (clinicId: number, doctorId: string): Promise<void> => {
    try {
      await api.delete(`/clinics/${clinicId}/medecins/${doctorId}`);
    } catch (error) {
      console.error(`Error removing doctor ${doctorId} from clinic ${clinicId}:`, error);
      throw error;
    }
  },
};

export const invoiceService = {
  // Create a new invoice
  createInvoice: async (invoiceData: any): Promise<any> => {
    try {
      const response = await api.post('/factures', invoiceData);
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  // Get all invoices
  getInvoices: async (): Promise<any[]> => {
    try {
      const response = await api.get('/factures');
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },

  // Get invoice by ID
  getInvoiceById: async (id: string): Promise<any> => {
    try {
      const response = await api.get(`/factures/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  },

  // Update invoice
  updateInvoice: async (id: string, updateData: any): Promise<any> => {
    try {
      const response = await api.put(`/factures/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  },

  // Delete invoice
  deleteInvoice: async (id: string): Promise<void> => {
    try {
      await api.delete(`/factures/${id}`);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }
};

export const userService = {
  // Get all users (admin only)
  getAllUsers: async (): Promise<any[]> => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get users by role
  getUsersByRole: async (role: string): Promise<any[]> => {
    try {
      const response = await api.get(`/users/role/${role}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching users with role ${role}:`, error);
      throw error;
    }
  },


  getUserById: async (id: number): Promise<any> => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },

  // Get all doctors
  getDoctors: async (): Promise<any[]> => {
    try {
      console.log('[API] Fetching doctors from public endpoint...');
      const response = await api.get('/users/public/doctors');
      
      if (response.data && response.data.success === true && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      console.error('[API] Unexpected response format from public endpoint:', response.data);
      return [];
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        console.error('[API] Error from public endpoint:', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data
        });
      } else if (axiosError.request) {
        console.error('[API] No response received from public endpoint:', axiosError.request);
      } else {
        console.error('[API] Error:', axiosError.message);
      }
      
      return [];
    }
  },
};