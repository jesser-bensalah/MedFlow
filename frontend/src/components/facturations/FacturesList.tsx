import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { invoiceService } from '../../contexts/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PencilIcon, TrashIcon, CurrencyDollarIcon, XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const paymentMethodLabels: Record<'cash' | 'card' | 'check', string> = {
    'cash': 'Espèces',
    'card': 'Carte',
    'check': 'Chèque'
};

interface Service {
    id: string;
    description: string;
    amount: number;
    _isNew?: boolean;
    _modified?: boolean;
    _deleted?: boolean;
}

interface Invoice {
    id: string;
    numeroFacture: string;
    patientName: string;
    patientId?: number;
    appointmentDate: string;
    total: number;
    etat: 'Payée' | 'Non Payée';
    paymentMethod: 'cash' | 'card' | 'check';
    date: string;
    services: Service[];
    email?: string;
    doctorId?: number;
    clinicId?: number;
    notes?: string;
}

const FacturesList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAdminOrReceptionist = user && (user.role === 'admin' || user.role === 'receptionist');
    
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: 'delete' | 'update' | null;
        invoice: Invoice | null;
        qrCodeUrl?: string;
    }>({
        isOpen: false,
        type: null,
        invoice: null,
        qrCodeUrl: ''
    });
    
    const [formData, setFormData] = useState<{
        paymentMethod: 'cash' | 'card' | 'check';
        notes: string;
        etat: 'Payée' | 'Non Payée';
        services: Service[];
    }>({
        paymentMethod: 'cash',
        notes: '',
        etat: 'Non Payée',
        services: []
    });
    
    const [newService, setNewService] = useState<{ description: string; amount: string }>({
        description: '',
        amount: ''
        });

        useEffect(() => {
            const fetchInvoices = async () => {
                if (!user?.id) return;

                try {
                    setLoading(true);
                    setError(null);

                    
                    const allInvoices = await invoiceService.getInvoices();
                    
                    const filteredInvoices = user.role === 'patient' 
                        ? allInvoices.filter((invoice: any) => invoice.patientId === user.id)
                        : allInvoices;

                    setInvoices(filteredInvoices);
                } catch (err) {
                    console.error('Error fetching invoices:', err);
                    setError('Erreur lors du chargement des factures');
                    toast.error('Erreur lors du chargement des factures');
                } finally {
                    setLoading(false);
                }
            };

            fetchInvoices();
        }, [user?.id]);

        const formatDate = (dateString: string) => {
            const options: Intl.DateTimeFormatOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            return new Date(dateString).toLocaleDateString('fr-FR', options);
        };

        if (loading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
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
            );
        }

        const handlePayClick = (invoice: Invoice) => {
            navigate(`/payment?amount=${invoice.total}&invoiceId=${invoice.id}`);
        };

        const handleDeleteClick = (invoice: Invoice) => {
            setModalState({
                isOpen: true,
                type: 'delete',
                invoice
            });
        };

        const handleUpdateClick = async (invoice: any) => {
            try {
                // Reset state
                setNewService({ description: '', amount: '' });
                let services: Service[] = [];
                
                // Check for _services field
                if (invoice._services && Array.isArray(invoice._services)) {
                    services = invoice._services;
                }
                // Create a new array to avoid reference issues
                else if (Array.isArray(invoice.services)) {
                    services = [...invoice.services]; 
                } 
                // Handle case where services is a JSON string
                else if (typeof invoice.services === 'string' && invoice.services.trim() !== '') {
                    try {
                        const parsedServices = JSON.parse(invoice.services);
                        services = Array.isArray(parsedServices) ? [...parsedServices] : [];
                    } catch (e) {
                        console.error('Error parsing services JSON:', e);
                        services = [];
                    }
                }

                console.log('Processed services:', services);

                // clean form data
                const formData = {
                    paymentMethod: invoice.paymentMethod || 'cash',
                    notes: invoice.notes || '',
                    etat: invoice.etat || 'Non Payée',
                    services: services.map(service => ({
                        id: service.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        description: service.description || '',
                        amount: Number(service.amount) || 0,
                        _isNew: !service.id || service.id.toString().startsWith('temp-'),
                        _modified: false,
                        _deleted: false
                    })).filter(service => service.amount > 0)
                };

                // Set the form data
                setFormData(formData);

                // Open the update modal
                setModalState({
                    isOpen: true,
                    type: 'update',
                    invoice: {
                        ...invoice,
                        services: formData.services
                    }
                });
        } catch (error) {
            console.error('Error in handleUpdateClick:', error);
            toast.error('Erreur lors de la préparation de la modification');
        }
    };

        
   const handleDownloadPdf = async (invoice: Invoice) => {
    try {
        // Ensure services is an array
        const services = Array.isArray(invoice.services) ? invoice.services : [];
        
        // Initialize PDF document
        const doc = new jsPDF();
        doc.setTextColor(0, 0, 0); 
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 14;
        const lineHeight = 7;
        let yPos = 20;
        
        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('FACTURE', pageWidth - margin, yPos, { align: 'right' });
        
        // Invoice number and date
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`N°: ${invoice.numeroFacture || 'N/A'}`, pageWidth - margin, yPos + 10, { align: 'right' });
        doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('fr-FR')}`, pageWidth - margin, yPos + 15, { align: 'right' });
        
        // Add payment status
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`STATUT: ${invoice.etat === 'Payée' ? 'PAYÉE' : 'NON PAYÉE'}`, pageWidth - margin, yPos + 30, { 
            align: 'right'
        });
        
        // site info
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('MedFlow', margin, yPos + 20);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('123 Rue de la Santé', margin, yPos + 30);
        doc.text('1002 Tunis, Tunisie', margin, yPos + 38);
        doc.text('Tél: +216 12 345 678', margin, yPos + 46);
        doc.text('Email: contact@medflow.tn', margin, yPos + 54);
        
        // Line separator
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos + 65, pageWidth - margin, yPos + 65);
        
        // Patient info
        yPos += 75;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('FACTURÉ À:', margin, yPos);
        
        doc.setFont('helvetica', 'normal');
        yPos += lineHeight * 1.5;
        doc.text(`Patient: ${invoice.patientName || 'N/A'}`, margin, yPos);
        
        // Add email if available
        if (invoice.email) {
            yPos += lineHeight;
            doc.text(`Email: ${invoice.email}`, margin, yPos);
        }
        yPos += lineHeight * 1.5;
        
        // Services table
        yPos += 20;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('DÉTAIL DES PRESTATIONS', margin, yPos);
        yPos += 10;

        
        const tableData = services
            .filter(service => service && (service.description || service.amount !== undefined))
            .map((service, index) => ({
                id: service.id || `service-${index}`,
                description: service.description || 'Service non spécifié',
                amount: Number(service.amount) || 0
            }));
            
        const totalAmount = Number(invoice.total) || 
            tableData.reduce((sum, service) => sum + (Number(service.amount) || 0), 0);
            
        
        const tableDataFormatted = tableData.map(service => ({
            description: service.description,
            amount: `${service.amount.toFixed(2)} TND`,
            status: invoice.etat === 'Payée' ? 'Payé' : 'Non Payé'
        }));

        // Add total row
        tableDataFormatted.push({
            description: 'TOTAL',
            amount: `${totalAmount.toFixed(2)} TND`,
            status: '' 
        });

        // Generate table
        autoTable(doc, {
            startY: yPos,
            head: [['Description', 'Montant']],
            body: tableDataFormatted.map(row => [row.description, row.amount, row.status]),
            headStyles: {
                fillColor: [240, 240, 240], // Light gray background for header
                textColor: [0, 0, 0], // Black text
                fontStyle: 'bold',
                halign: 'left',
                lineColor: [0, 0, 0],
                lineWidth: 0.3
            },
            styles: {
                fontSize: 10,
                cellPadding: 3,
                halign: 'left',
                textColor: [0, 0, 0], 
                lineColor: [0, 0, 0],
                lineWidth: 0.1
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 'auto', halign: 'right' },
                2: { cellWidth: 'auto', halign: 'center' }
            },
            margin: { left: margin, right: margin }
        });

        // Add payment method if available
        const finalY = (doc as any).lastAutoTable?.finalY || yPos + 50;
        if (invoice.paymentMethod) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('Méthode de paiement:', margin, finalY + 10);
            doc.setFont('helvetica', 'normal');
            doc.text(paymentMethodLabels[invoice.paymentMethod] || invoice.paymentMethod, margin + 60, finalY + 10);
        }

        // Save the PDF
        doc.save(`facture-${invoice.numeroFacture || 'sans-numero'}.pdf`);

    } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Erreur lors de la génération du PDF');
    }
}; //end doanload facture

        const closeModal = () => {
            setModalState({
                isOpen: false,
                type: null,
                invoice: null
            });
        };

        const confirmDelete = async () => {
            if (!modalState.invoice) return;
            
            try {
                await invoiceService.deleteInvoice(modalState.invoice.id);
                setInvoices(invoices.filter(inv => inv.id !== modalState.invoice?.id));
                toast.success('Facture supprimée avec succès');
            } catch (error) {
                console.error('Error deleting invoice:', error);
                toast.error('Erreur lors de la suppression de la facture');
            } finally {
                closeModal();
            }
        };

        const handleUpdateSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!modalState.invoice) return;

            try {
                // filter out deleted services 
                const servicesToUpdate = formData.services
                    .filter(service => !service._deleted && service.description.trim() !== '')
                    .map(({ _isNew, _modified, _deleted, ...service }) => ({
                        ...service,
                        amount: Number(service.amount) || 0, 
                       
                        ...(service.id && service.id.toString().startsWith('temp-') ? { id: undefined } : {})
                    }));


                // Calculate the new total
                const newTotal = servicesToUpdate.reduce((sum, service) => sum + (Number(service.amount) || 0), 0);

                // Prepare the update data
                const updateData = {
                    ...formData,
                    services: servicesToUpdate,
                    total: newTotal,
                    etat: formData.paymentMethod === 'cash' ? 'Payée' : 'Non Payée',
                    _isNew: undefined,
                    _modified: undefined,
                    _deleted: undefined
                };

                console.log('Updating invoice with data:', updateData);

                // Update the invoice
                await invoiceService.updateInvoice(modalState.invoice.id, updateData);
                
                // Refresh the invoices list
                const updatedInvoices = await invoiceService.getInvoices();
                setInvoices(updatedInvoices);
                
                toast.success('Facture mise à jour avec succès');
                closeModal();
            } catch (error) {
                console.error('Error updating invoice:', error);
                toast.error('Erreur lors de la mise à jour de la facture');
            }
        };

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            setFormData(prev => {
                // If payment method is changed, update etat accordingly
                if (name === 'paymentMethod') {
                    const paymentMethod = value as 'cash' | 'card' | 'check';
                    const etat = (paymentMethod === 'cash' || paymentMethod === 'check') ? 'Payée' : 'Non Payée';
                    return {
                        ...prev,
                        paymentMethod,
                        etat
                    };
                }
                return {
                    ...prev,
                    [name]: value
                };
            });
        };

        const handleServiceInputChange = (e: React.ChangeEvent<HTMLInputElement>, serviceId: string) => {
            const { name, value } = e.target;
            setFormData(prev => ({
                ...prev,
                services: prev.services.map(service =>
                    service.id === serviceId
                        ? { 
                            ...service, 
                            [name]: name === 'amount' ? parseFloat(value) || 0 : value,
                            _modified: true
                        }
                        : service
                )
            }));
        };

        const handleNewServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            setNewService(prev => ({
                ...prev,
                [name]: value
            }));
        };

        const addService = () => {
            if (!newService.description.trim() || !newService.amount) return;
            
            setFormData(prev => ({
                ...prev,
                services: [
                    ...prev.services,
                    {
                        id: `temp-${Date.now()}`,
                        description: newService.description.trim(),
                        amount: parseFloat(newService.amount) || 0,
                        _isNew: true
                    }
                ]
            }));
            
            setNewService({ description: '', amount: '' });
        };

        const removeService = (serviceId: string) => {
            setFormData(prev => ({
                ...prev,
                services: prev.services.map(service => 
                    service.id === serviceId 
                        ? { ...service, _deleted: true } 
                        : service
                )
            }));
        };

        
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Mes Factures</h1>

                {invoices.length === 0 ? (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                        <p className="text-gray-500">Aucune facture trouvée</p>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Numéro
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Montant
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Paiement
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="relative hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {invoice.numeroFacture}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(invoice.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {Number(invoice.total).toFixed(2)} TND
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${invoice.etat === 'Payée' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {invoice.etat}
                                            </span>
                                        </td> 
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                            {paymentMethodLabels[invoice.paymentMethod] || invoice.paymentMethod}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <button 
                                                    onClick={() => handlePayClick(invoice)}
                                                    disabled={invoice.etat === 'Payée'}
                                                    className={`p-1.5 rounded-md ${invoice.etat === 'Payée'
                                                        ? 'text-gray-400 cursor-not-allowed'
                                                        : 'text-blue-500 hover:bg-blue-50'}`}
                                                    title="Payer"
                                                >
                                                    <CurrencyDollarIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadPdf(invoice)}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                                                    title="Télécharger la facture"
                                                >
                                                    <DocumentArrowDownIcon className="h-5 w-5" />
                                                </button>
                                                {isAdminOrReceptionist && (
                                                    <>
                                                        <div className="relative">
                                                            <button 
                                                                type="button"
                                                                onClick={() => handleUpdateClick(invoice)}
                                                                className="p-1.5 text-yellow-500 hover:bg-yellow-50 rounded-md relative"
                                                                title="Modifier"
                                                            >
                                                                <PencilIcon className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDeleteClick(invoice);
                                                            }}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md relative"
                                                            title="Supprimer"
                                                        >
                                                            <TrashIcon className="h-5 w-5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal */}
                {modalState.isOpen && modalState.invoice && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {modalState.type === 'delete' ? 'Confirmer la suppression' : 'Modifier la facture'}
                                    </h3>
                                    <button 
                                        type="button"
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>
                                {modalState.type === 'delete' ? (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-600 mb-4">
                                            Êtes-vous sûr de vouloir supprimer cette facture ?
                                        </p>
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="button"
                                                onClick={confirmDelete}
                                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleUpdateSubmit}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Méthode de paiement
                                                </label>
                                                <select
                                                    name="paymentMethod"
                                                    value={formData.paymentMethod}
                                                    onChange={handleInputChange}
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                                >
                                                    <option value="cash">Espèces</option>
                                                    <option value="card">Carte</option>
                                                    <option value="check">Chèque</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Statut
                                                </label>
                                                <select
                                                    name="etat"
                                                    value={formData.etat}
                                                    onChange={handleInputChange}
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                                >
                                                    <option value="Payée">Payée</option>
                                                    <option value="Non Payée">Non Payée</option>
                                                </select>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Services
                                                    </label>
                                                    <div className="mt-4">
                                                        <div className="space-y-2">
                                                            {formData.services
                                                                .filter(service => !service._deleted)
                                                                .map((service) => (
                                                                <div key={service.id} className="flex items-center space-x-2">
                                                                    <input
                                                                        type="text"
                                                                        name="description"
                                                                        value={service.description}
                                                                        onChange={(e) => handleServiceInputChange(e, service.id)}
                                                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                                        placeholder="Description"
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        name="amount"
                                                                        value={service.amount}
                                                                        onChange={(e) => handleServiceInputChange(e, service.id)}
                                                                        className="w-24 px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                                        placeholder="Montant"
                                                                        min="0"
                                                                        step="0.01"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeService(service.id)}
                                                                        className="text-red-500 hover:text-red-700 p-1"
                                                                        title="Supprimer le service"
                                                                    >
                                                                        <XMarkIcon className="h-5 w-5" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="mt-4">
                                                            <div className="flex items-center space-x-2">
                                                                <input
                                                                    type="text"
                                                                    name="description"
                                                                    value={newService.description}
                                                                    onChange={handleNewServiceChange}
                                                                    onKeyPress={(e) => e.key === 'Enter' && addService()}
                                                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                                    placeholder="Description du service"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    name="amount"
                                                                    value={newService.amount}
                                                                    onChange={handleNewServiceChange}
                                                                    onKeyPress={(e) => e.key === 'Enter' && addService()}
                                                                    className="w-24 px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                                    placeholder="Montant"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={addService}
                                                                    disabled={!newService.description.trim() || !newService.amount}
                                                                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${!newService.description.trim() || !newService.amount ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                                                >
                                                                    Ajouter
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 text-sm text-gray-500">
                                                            Total: {formData.services
                                                                .filter(service => !service._deleted)
                                                                .reduce((sum, service) => sum + service.amount, 0)
                                                                .toFixed(2)} TND
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Notes
                                                </label>
                                                <textarea
                                                    name="notes"
                                                    value={formData.notes}
                                                    onChange={handleInputChange}
                                                    rows={3}
                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                                                />
                                            </div>

                                            <div className="flex justify-end space-x-3 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={closeModal}
                                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                                >
                                                    Enregistrer
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    export default FacturesList;