import React, { useEffect, useState } from 'react';
import { clinicService, userService } from '../contexts/api';

const AdminDashboard: React.FC = () => {
  const [clinicCount, setClinicCount] = useState<number>(0);
  const [doctorCount, setDoctorCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorError, setDoctorError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClinicCount = async () => {
      try {
        const clinics = await clinicService.getAllClinics();
        setClinicCount(clinics.length);
      } catch (err) {
        console.error('Failed to fetch clinics:', err);
        setError('Impossible de charger le nombre de cliniques');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchDoctorCount = async () => {
      try {
        const doctors = await userService.getDoctors();
        setDoctorCount(doctors.length);
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
        setDoctorError('Impossible de charger le nombre de médecins');
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    fetchClinicCount();
    fetchDoctorCount();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de board Admin</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Cliniques */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Cliniques</h3>
              {isLoading ? (
                <div className="mt-2 h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : error ? (
                <div className="text-red-500 text-sm mt-1">{error}</div>
              ) : (
                <div className="mt-2 text-3xl font-bold text-gray-900">{clinicCount}</div>
              )}
            </div>
          </div>

          {/* Médecins */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Médecins</h3>
              {isLoadingDoctors ? (
                <div className="mt-2 h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : doctorError ? (
                <div className="text-red-500 text-sm mt-1">{doctorError}</div>
              ) : (
                <div className="mt-2 text-3xl font-bold text-gray-900">{doctorCount}</div>
              )}
            </div>
          </div>

          {/* Revenus Totaux */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Revenus Totaux</h3>
              <div className="mt-2 text-3xl font-bold text-gray-900">150,000 TND</div>
            </div>
          </div>

          {/* Taux d'occupation */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Taux d'occupation</h3>
              <div className="mt-2 text-3xl font-bold text-gray-900">85%</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenus par clinique */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Revenus par clinique (Annuel)
            </h3>
            <div className="h-64 flex items-end justify-between px-4">
              {[5000, 3000, 2000, 1000].map((value, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="bg-blue-500 w-12 rounded-t"
                    style={{ height: `${value / 50}px` }}
                  ></div>
                  <span className="text-xs mt-2">{value}TND</span>
                </div>
              ))}
            </div>
          </div>

          {/* Consultations par spécialité */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Consultations par spécialité (mensuel)
            </h3>
            <div className="space-y-3">
              {[
                { specialty: 'Cardiologie', value: 30 },
                { specialty: 'Pédiatrie', value: 20 },
                { specialty: 'Dermatologie', value: 30 },
                { specialty: 'Neurologie', value: 20 },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.specialty}</span>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alertes récentes */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Alertes récentes</h3>
          <div className="space-y-3">
            {[
              'Nombre clinique appliqué : Hégitald, B., Pivil - 2024-05-01',
              'Présenter recul - 2023-06-02',
              'Possuerir recul : Leur AM202-400 - 2023-06-02',
              'Fermer les recules tardive - 2023-06-02',
            ].map((alert, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                {alert}
              </div>
            ))}
          </div>
        </div>

        {/* Actions Rapides */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Actions Rapides</h3>
          <div className="flex gap-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
              Ajouter un personnel
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
              Générer un rapport financier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;