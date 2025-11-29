import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'doctor' | 'receptionist' | 'patient';
  isActive: boolean;
  clinicId?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  checkTokenValidity: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Token invalide ou expiré, déconnexion...');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  const checkTokenValidity = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return false;

      await axios.get('http://localhost:3001/auth/verify');
      return true;
    } catch (error) {
      console.log('Token invalide');
      return false;
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');

      console.log(' Vérification du statut auth - Token:', !!token, 'User:', !!userData);

      if (token && userData) {
        const isValid = await checkTokenValidity();

        if (isValid) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log(' Utilisateur restauré:', parsedUser.email);
        } else {
          console.log(' Token invalide, déconnexion...');
          logout();
        }
      } else {
        console.log(' Aucune session trouvée');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error(' Erreur lors de la restauration:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log(' Tentative de connexion avec:', email);

      const response = await axios.post('http://localhost:3001/auth/login', {
        email,
        password,
      });

      console.log('Réponse du serveur reçue');

      const { access_token, user: userData } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);

      console.log(' Connexion réussie, utilisateur:', userData);
    } catch (error: any) {
      console.error(' Erreur de connexion:', error);
      setIsAuthenticated(false);

      let errorMessage = 'Erreur de connexion';
      if (error.response) {
        errorMessage = error.response.data?.message || `Erreur ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Serveur inaccessible. Vérifiez que le backend est démarré.';
      } else {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log(' Déconnexion');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated,
    checkTokenValidity
  };

  console.log(' AuthContext rendu - authenticated:', value.isAuthenticated, 'loading:', value.loading);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};