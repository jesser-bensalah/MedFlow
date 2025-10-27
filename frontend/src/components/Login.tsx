import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@medflow.com');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      console.log('Redirection automatique vers le dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log(' Début de la soumission du formulaire');

    try {
      await login(email, password);
      console.log(' Connexion réussie, redirection...');
    } catch (error: any) {
      console.error(' Erreur capturée dans Login:', error);
      setError(error.message);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirection vers le dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/assets/background-vrai.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay flou */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Carte de connexion */}
      <div className="w-full max-w-4xl flex bg-white/90 rounded-2xl shadow-2xl overflow-hidden relative z-10 backdrop-blur-sm">
        {/* Section de marque avec l'image d'arrière-plan */}
        <div
          className="hidden md:flex md:w-1/2 p-6 flex-col items-center justify-center text-center text-white relative"
          style={{
            backgroundImage: 'url(/assets/background-vrai.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay sombre pour améliorer la lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/55 to-black/35"></div>

          {/* Contenu centré */}
          <div className="relative z-10">
            <div className="mb-4 p-0.5 bg-white/20 backdrop-blur-sm rounded-full inline-block shadow-md ">
              <img
                src="/assets/logo-vertical.png"
                alt="MedFlow Logo"
                className="w-[22rem] h-[22rem] mx-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPgo8cGF0aCBkPSJNMTkgMTRjMS40OS0xLjQ2IDIuMjYtMy41MyAyIDYtLjA5IDEuMzEuMTQgMi4yOCAxIDMgLjg2LjcyIDIuMzYgMSA0LjUgMSIvPgo8cGF0aCBkPSJNMjEgMTVjLjUzLTEuMzUuNS0yLjU5IDAtNC0uMjItLjYtLjYtMS4xLTEtMS41LS40LS40LS45LS43LTEuNS0xLTMtMi00LTUuNS00LTguNSAwLTMgMS01IDMtOCAxLjUgMiAxIDQgMSA1IDAgMS0xIDMtMSA1IDAgMi0yIDMtNSAzLThzLTEtNS41LTQtOC41Yy0zIDAtNC41IDIuNS03IDIuNXMtNC0yLjUtNy0yLjVjLTMgMC00LjUgMi41LTcgMi41LTMgMC00LjUtMi41LTcuNS0yLjUtMyAwLTQuNSAyLjUtNy41IDIuNXMtNC0yLjUtNy0yLjVjLTMgMC00LjUgMi41LTcuNSAyLjVTMiA5IDIgMTJzMSA1LjUgNCA4LjVjMyAwIDQuNS0yLjUgNy41LTIuNXM0LjUgMi41IDcuNSAyLjVjMyAwIDQuUtMi41IDcuNS0yLjVzNC41IDIuNSA3LjUgMi41YzEuMTQgMCAyLjI1LS4xNiAzLjI1LS40NSIvPgo8L3N2Zz4=';
                }}
              />
            </div>
            <h1 className="text-4xl font-bold mb-3 drop-shadow-lg">MedFlow</h1>
            <p className="text-white/90 text-lg drop-shadow">SaaS pour Cliniques & Médecins</p>
            <div className="w-16 h-1 bg-white/80 mt-6 rounded-full mx-auto"></div>
          </div>
        </div>

        {/* Section du formulaire */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Connexion</h2>
            <p className="text-gray-600 mt-2">Accédez à votre espace professionnel</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
              <strong>Erreur:</strong> {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse e-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin@medflow.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Votre mot de passe"
              />
            </div>

            <div className="text-right">
              <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion en cours...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>

            <div className="text-center mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{' '}

              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;