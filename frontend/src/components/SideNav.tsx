import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const SideNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const adminLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Gestion des Utilisateurs', path: '/users', icon: '👥' },
    { name: 'Gestion des Cliniques', path: '/clinics', icon: '🏥' },
    { name: 'Facturation', path: '/billing', icon: '💰' },
    { name: 'Paramètres', path: '/settings', icon: '⚙️' },
  ];

  const receptionistLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Gestion des Patients', path: '/patients', icon: '👤' },
    { name: 'Prise de Rendez-vous', path: '/specialities', icon: '📅' },
    { name: 'Facturation', path: '/billing', icon: '💰' },
  ];

  const doctorLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Consultations', path: '/consultations', icon: '🩺' },
    { name: 'Rendez-vous', path: '/rdv', icon: '📅' },
    { name: 'Ordonnances', path: '/prescriptions', icon: '📝' },
  ];

  const patientLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Mes Consultations', path: '/consultations', icon: '🩺' },
    { name: 'Facturation', path: '/billing', icon: '💰' },
  ];

  const getLinks = () => {
    switch (user?.role) {
      case 'admin':
        return adminLinks;
      case 'receptionist':
        return receptionistLinks;
      case 'doctor':
        return doctorLinks;
      case 'patient':
        return patientLinks;
      default:
        return [];
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-gray-800 w-64 min-h-screen">
      <div className="p-4">
        <h1 className="text-white text-xl font-bold">MedFlow</h1>
      </div>
      
      <nav className="mt-8">
        <div className="px-4 space-y-2">
          {getLinks().map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`w-full text-left flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                isActive(link.path)
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="mr-3 text-base">{link.icon}</span>
              {link.name}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default SideNav;