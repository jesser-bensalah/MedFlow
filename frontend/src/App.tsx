import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import AdminDashboard from './dashboards/AdminDashboard';
import ReceptionistDashboard from './dashboards/ReceptionistDashboard';
import DoctorDashboard from './dashboards/DoctorDashboard';
import PatientDashboard from './dashboards/PatientDashboard';
import UserManagement from './components/users/UserManagement';
import PatientManagement from './components/patients/PatientManagement';
import DoctorSpecialtiesList from './components/specialities/DoctorSpecialtiesList';
import ListRendezVous from './components/rendezvous/ListRendezVous';
import HistoriqueConsultations from './components/patients/HistoriqueConsultations';
import ClinicPage from './components/clinics/ClinicPage';
import Consultation from './components/Consultations/Consultation';
import EditionFacture from './components/facturations/EditionFacture';
import FacturesList from './components/facturations/FacturesList';
import { StripePayment } from './components/payments/StripePayment';


const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

const AppRoutes: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const getDashboard = () => {
    if (!user) return <Navigate to="/login" replace />;
    
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'receptionist':
        return <ReceptionistDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'patient':
        return <PatientDashboard />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } 
      />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            {getDashboard()}
          </ProtectedRoute>
        } 
      />
      
      {/* Routes Admin */}
      <Route 
        path="/users" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        } 
      />
      
      {/* Routes Réceptionniste */}
      <Route 
        path="/patients" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
            <PatientManagement />
          </ProtectedRoute>
        } 
      />
      
      {/* Routes Médecin */}
      <Route 
        path="/specialities" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist']}>
            <DoctorSpecialtiesList />
          </ProtectedRoute>
        } 
      />
      
      
      {/* Routes communes */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <Navigate to="/login" replace />
        } 
      />

      <Route 
        path="/rdv" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'receptionist', 'doctor']}>
            <ListRendezVous />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/historique-consultations" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'patient', 'doctor', 'receptionist']}>
            <HistoriqueConsultations />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/clinics" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'receptionist', 'doctor', 'patient']}> 
            <ClinicPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/consultation" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'patient', 'doctor', 'receptionist']}>
            <Consultation />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/edition-facture" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'receptionist', 'patient']}> 
            <EditionFacture />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/factures-list" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'receptionist', 'patient']}> 
            <FacturesList />
          </ProtectedRoute>
        } 
      />  

     <Route 
        path="/payment" 
        element={
          <ProtectedRoute>
            <PaymentWrapper />
          </ProtectedRoute>
        } 
      />

      {/* Route fallback pour les URLs inconnues */}
      <Route 
        path="*" 
        element={
          <ProtectedRoute>
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <div className="px-4 py-6 sm:px-0">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Page non trouvée</h1>
                  <p className="text-red-700">La page que vous recherchez n'existe pas.</p>
                </div>
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </Router>
  );
};

// Wrapper component to handle URL parameters for payment
const PaymentWrapper = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const amount = parseFloat(searchParams.get('amount') || '0');
  const invoiceId = searchParams.get('invoiceId') || '';

  const handlePaymentSuccess = (paymentIntent: any) => {
    //update the invoice status in your backend
    console.log('Payment successful:', { paymentIntent, invoiceId });
    // Redirect to a success page or back to invoices
    navigate('/factures', { state: { payment: 'success' } });
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    //show toast error
    navigate('/factures', { state: { payment: 'error', error } });
  };

  if (!amount || amount <= 0) {
    return <Navigate to="/factures" />;
  }

  return (
    <StripePayment 
      amount={amount} 
      onSuccess={handlePaymentSuccess} 
      onError={handlePaymentError} 
    />
  );
};

export default App;