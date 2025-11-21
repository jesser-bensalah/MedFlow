import { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import axios from 'axios';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { invoiceService } from '../../contexts/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatCurrency } from '../../utils/numberUtils';

interface ServiceItem {
  description: string;
  amount: number;
}

interface Facture {
  id: string;
  numeroFacture: string;
  patientName: string;
  appointmentDate: string;
  services: ServiceItem[];
  total: number | string;
  paymentMethod: 'cash' | 'card' | 'check' | 'transfer';
  etat: 'Payée' | 'Non Payée';
  patientId?: number;
  doctorId?: number;
  clinicId?: number;
  notes?: string;
  date: string;
}

interface CheckoutFormProps {
  facture: Facture;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  onProcessing?: (isProcessing: boolean) => void;
}

interface StripePaymentProps {
  factureId?: string;
  amount?: number;
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: string) => void;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || import.meta.env.STRIPE_PUBLIC_KEY || '');

const CheckoutForm = ({ facture, onSuccess, onError, onProcessing }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle');
  const { user } = useAuth();
  const [cardComplete, setCardComplete] = useState(false);
  
  // Card element options
  const cardOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1a1f36',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#e53e3e',
      },
    },
    hidePostalCode: true,
  };


  const handleCardChange = (event: { complete: boolean }) => {
    setCardComplete(event.complete);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe.js has not loaded yet.');
      return;
    }

    if (!cardComplete) {
      setErrorMessage('Please fill in all card details');
      return;
    }

    setIsSubmitting(true);
    onProcessing?.(true);
    setErrorMessage('');

    try {
      // Ensure the amount is a valid number
      console.log('Original facture.total:', facture.total, 'Type:', typeof facture.total);

      let amount: number;
      if (typeof facture.total === 'string') {
        const cleaned = facture.total.replace(/[^0-9.,]/g, '').replace(',', '.');
        amount = parseFloat(cleaned);
        console.log('Cleaned string amount:', cleaned, 'Parsed amount:', amount);
      } else {
        amount = Number(facture.total);
        console.log('Numeric amount:', amount);
      }

      console.log('Final amount to send:', amount, 'Type:', typeof amount);

      if (isNaN(amount) || amount <= 0) {
        const errorMsg = `Invalid payment amount: ${amount}. Please check the total amount.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      // 1. Create a payment intent
      // Convert amount to millimes
      const amountInMillimes = Math.round(amount * 100);

      const paymentData = {
        amount: amountInMillimes, 
        currency: 'usd',
        metadata: {
          factureId: facture.id,
          patientId: facture.patientId,
          doctorId: facture.doctorId,
          clinicId: facture.clinicId,
        },
      };

      console.log('Sending payment data:', paymentData);

      // 2. Create payment intent on the server
      const { data: { clientSecret } } = await axios.post(
        'http://localhost:3000/api/payments/create-payment-intent',
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!clientSecret) {
        throw new Error('Failed to create payment intent: No client secret returned');
      }

      // 3. Confirm the payment with the card element
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
            email: user?.email || '',
          },
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Failed to confirm payment');
      }

    // 4. Handle successful payment
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        // Update invoice status in your database
        await invoiceService.updateInvoice(facture.id, {
          ...facture,
          etat: 'Payée',
          paymentMethod: 'card',
        });

        setStatus('succeeded');
        onSuccess?.(paymentIntent);
      } catch (updateError) {
        console.error('Error updating invoice status:', updateError);
        toast.warning('Payment succeeded but failed to update invoice status');
        onSuccess?.(paymentIntent); // Still consider payment as successful
      }
    }
  } catch (error: unknown) {
    console.error('Payment error:', error);
    setStatus('failed');
    
    let errorMessage = 'Payment failed';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      errorMessage = apiError.response?.data?.message || 'Payment failed';
    }
    
    setErrorMessage(errorMessage);
    onError?.(errorMessage);
  } finally {
    setIsSubmitting(false);
    onProcessing?.(false);
  }
};


  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header with secure checkout */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Sécurisé par Stripe</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Faites vos paiements en toute sécurité avec</span>
            <span className="text-sm font-bold text-gray-800">Stripe</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Card Element */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Informations de la carte
          </label>
          <div className="border border-gray-300 rounded-md p-4 bg-white">
            <CardElement
              options={cardOptions}
              onChange={handleCardChange}
            />
          </div>
        </div>

        {/* Payment amount and submit button */}
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
            <span className="font-medium text-gray-700">Monatant total:</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(facture.total)}</span>
          </div>

          <button
            type="submit"
            disabled={!stripe || !cardComplete || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Traitement en cours...
              </>
            ) : (
              `Payer ${formatCurrency(facture.total)}`
            )}
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="text-red-600 text-sm p-3 bg-red-50 rounded-md border border-red-200">
            {errorMessage}
          </div>
        )}

        {/* Security info and card logos */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center text-xs text-gray-500">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Paiement sécurisé et crypté
          </div>
          
          <div className="flex justify-center space-x-4 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">Nous acceptons</div>
            <div className="flex space-x-2">
              <div className="w-8 h-5 bg-blue-600 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">VISA</span>
              </div>
              <div className="w-8 h-5 bg-red-600 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">MC</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

const OrderSummary = ({ facture }: { facture: Facture }) => {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Récapitulatif de la facture</h2>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
          {facture.numeroFacture}
        </span>
      </div>
      
      <div className="mb-6">
        <h3 className="font-medium text-gray-700 mb-3">Détails du patient</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Nom du patient:</span>
            <span className="font-medium">{facture.patientName}</span>
          </div>
          <div className="flex justify-between">
            <span>Date de la consultation:</span>
            <span>{formatDate(facture.appointmentDate)}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h3 className="font-medium text-gray-700 mb-3">Détails des services</h3>
        <div className="space-y-3">
          {facture.services && facture.services.length > 0 ? (
            facture.services.map((service, index) => {
              const serviceObj = service && typeof service === 'object' ? service : { description: 'Service', amount: 0 };
              return (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{serviceObj.description || 'Service'}</span>
                  <span>{typeof serviceObj.amount === 'number' ? serviceObj.amount.toFixed(2) : '0.00'} TND</span>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-gray-500">Aucun service trouvé</div>
          )}
          
          <div className="border-t border-gray-100 pt-2 mt-3">
            <div className="flex justify-between font-medium text-gray-800">
              <span>Total:</span>
              <span>{formatCurrency(facture.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {facture.notes && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="font-medium text-gray-700 mb-2">Notes</h3>
          <p className="text-sm text-gray-600">{facture.notes}</p>
        </div>
      )}
    </div>
  );
};

export const StripePayment = ({ factureId, onSuccess, onError }: StripePaymentProps) => {
  const [facture, setFacture] = useState<Facture | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams<{ id?: string }>();

  // Function to parse services data
  const parseServices = (services: any): ServiceItem[] => {
    console.log('Raw services data:', services);
    try {
      // If services is already an array of objects with description and amount, return it
      if (Array.isArray(services) && services.every(s => s && typeof s === 'object' && 'description' in s && 'amount' in s)) {
        console.log('Services is already a valid array:', services);
        return services;
      }
      
      // If services is a string, try to parse it as JSON
      if (typeof services === 'string') {
        console.log('Parsing services from string');
        const parsed = JSON.parse(services);
        // If the parsed result is an array, return it, otherwise wrap it in an array
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      
      // If services is an object with a data property
      if (services && typeof services === 'object' && 'data' in services) {
        console.log('Found services in data property');
        return parseServices(services.data);
      }
      
      // If it's a single service object
      if (services && typeof services === 'object' && 'description' in services && 'amount' in services) {
        console.log('Single service object found');
        return [services];
      }
      
      console.log('No valid services found, returning empty array');
      return [];
    } catch (e) {
      console.error('Error parsing services:', e, 'Raw data:', services);
      return [];
    }
  };

  const effectiveFactureId = factureId || params.id || searchParams.get('invoiceId');

  useEffect(() => {
    const fetchFacture = async () => {
      if (!effectiveFactureId) {
        setError('Aucun identifiant de facture fourni');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching invoice with ID:', effectiveFactureId);
        const response = await invoiceService.getInvoiceById(effectiveFactureId);
        console.log('API Response:', response);
        
        if (response) {
          // Parse services data from _services property
          const servicesData = response._services || response.services;
          const parsedServices = parseServices(servicesData);
          console.log('Parsed services:', parsedServices);
          
          // Create a new object with the parsed services
          const factureData = {
            ...response,
            services: parsedServices
          };
          
          console.log('Facture data to set:', factureData);
          setFacture(factureData);
        }
      } catch (err) {
        console.error('Error fetching facture:', err);
        setError('Erreur lors du chargement de la facture');
        toast.error('Impossible de charger les détails de la facture');
      } finally {
        setLoading(false);
      }
    };

    fetchFacture();
  }, [effectiveFactureId]);

  const handlePaymentSuccess = useCallback((paymentIntent: any) => {
    toast.success('Paiement effectué avec succès');
    onSuccess?.(paymentIntent);
    if (effectiveFactureId) {
      navigate(`/factures/${effectiveFactureId}?payment=success`);
    } else {
      navigate('/factures?payment=success');
    }
  }, [onSuccess, navigate, effectiveFactureId]);

  const handlePaymentError = useCallback((error: string) => {
    toast.error(error);
    onError?.(error);
  }, [onError]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !facture) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error || 'Facture introuvable'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (facture.etat === 'Payée') {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Cette facture a déjà été payée le {new Date().toLocaleDateString('fr-FR')}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Paiement en ligne sécurisé</h1>
      
      {/* Order Summary */}
      <OrderSummary facture={facture} />
      
      {/* Payment Form - Now positioned below the order summary */}
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Paiement sécurisé</h2>
          <p className="text-gray-600">
            Remplissez les détails de votre carte pour procéder au paiement.
          </p>
        </div>
        
        <Elements stripe={stripePromise}>
          <CheckoutForm 
            facture={facture} 
            onSuccess={handlePaymentSuccess} 
            onError={handlePaymentError}
            onProcessing={setIsProcessing}
          />
        </Elements>
        
        {isProcessing && (
          <div className="mt-4 p-4 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-200 flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Traitement du paiement en cours...
          </div>
        )}
      </div>
    </div>
  );
};

export default StripePayment;