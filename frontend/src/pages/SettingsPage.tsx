import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

type UpdateUserDto = {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: 'admin' | 'doctor' | 'receptionist' | 'patient';
    isActive?: boolean;
};

const SettingsPage: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [formData, setFormData] = useState<UpdateUserDto>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState({
        newPassword: false,
        confirmPassword: false
    });

    const togglePasswordVisibility = (field: 'newPassword' | 'confirmPassword') => {
        setShowPassword(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isActive: user.isActive
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        try {
            await axios.put(`http://localhost:3001/users/${user.id}`, formData, {
                headers: { 'Content-Type': 'application/json' }
            });

            toast.success('Profil mis à jour avec succès');
            setIsEditing(false);
            // Mettre à jour le contexte d'authentification si nécessaire
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            toast.error('Erreur lors de la mise à jour du profil');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { newPassword, confirmPassword } = passwordData;

        if (newPassword !== confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setIsLoading(true);
        try {
            await axios.put(`http://localhost:3001/users/${user?.id}/password`, {
                newPassword
            });
            toast.success('Mot de passe mis à jour avec succès');
            setPasswordData({
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error: unknown) {
            console.error('Erreur lors du changement de mot de passe:', error);

            let errorMessage = 'Erreur lors du changement de mot de passe';

            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || error.message || errorMessage;
            }

            else if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated || !user) {
        navigate('/login');
        return null;
    }

    const isAdmin = user.role === 'admin';

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Paramètres du compte
                    </h1>
                    <p className="mt-3 text-xl text-gray-500">
                        Gérez vos informations personnelles et votre mot de passe
                    </p>
                </div>

                {isAdmin && (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 transition-all duration-300 hover:shadow-2xl">
                        <div className="px-6 py-5 border-b border-gray-200 sm:px-8 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                <span className="inline-flex items-center">
                                    <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Informations personnelles
                                </span>
                            </h2>
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    type="button"
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    Modifier
                                </button>
                            ) : null}
                        </div>
                        <form onSubmit={handleProfileSubmit}>
                            <div className="px-6 py-5">
                                <div className="space-y-4">
                                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                                            Prénom
                                        </label>
                                        <div className="mt-1 sm:mt-0 sm:col-span-2">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    id="firstName"
                                                    value={formData.firstName || ''}
                                                    onChange={handleChange}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                />
                                            ) : (
                                                <div className="text-sm text-gray-900">{user.firstName}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                                            Nom
                                        </label>
                                        <div className="mt-1 sm:mt-0 sm:col-span-2">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    id="lastName"
                                                    value={formData.lastName || ''}
                                                    onChange={handleChange}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                />
                                            ) : (
                                                <div className="text-sm text-gray-900">{user.lastName}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                                            Email
                                        </label>
                                        <div className="mt-1 sm:mt-0 sm:col-span-2">
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    name="email"
                                                    id="email"
                                                    value={formData.email || ''}
                                                    onChange={handleChange}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                />
                                            ) : (
                                                <div className="text-sm text-gray-900">{user.email}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                                        <dt className="text-sm font-medium text-gray-500">Rôle</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                            {user.role}
                                        </dd>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="mt-6 flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);

                                                setFormData({
                                                    email: user.email,
                                                    firstName: user.firstName,
                                                    lastName: user.lastName,
                                                    role: user.role,
                                                    isActive: user.isActive
                                                });
                                            }}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
                                        >
                                            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
                    <div className="px-6 py-5 border-b border-gray-200 sm:px-8">
                        <h2 className="text-xl font-bold text-gray-900">
                            <span className="inline-flex items-center">
                                <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Sécurité du compte
                            </span>
                        </h2>
                    </div>
                    <div className="px-6 py-5 sm:px-8">
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                                    Nouveau mot de passe
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="relative">
                                        <input
                                            id="new-password"
                                            name="newPassword"
                                            type={showPassword.newPassword ? 'text' : 'password'}
                                            required
                                            minLength={6}
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            className="block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm pr-10 h-10"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('newPassword')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                                            aria-label={showPassword.newPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword.newPassword ? (
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Le mot de passe doit contenir au moins 6 caractères.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                                    Confirmer le mot de passe
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="relative">
                                        <input
                                            id="confirm-password"
                                            name="confirmPassword"
                                            type={showPassword.confirmPassword ? 'text' : 'password'}
                                            required
                                            minLength={6}
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            className="block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:text-sm pr-10 h-10"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('confirmPassword')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                                            aria-label={showPassword.confirmPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword.confirmPassword ? (
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 transition-colors duration-200"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Mise à jour en cours...
                                        </>
                                    ) : (
                                        'Mettre à jour le mot de passe'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;