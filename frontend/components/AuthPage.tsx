
import React, { useState, useEffect } from 'react';
import { SparklesIcon } from './icons';

interface AuthPageProps {
    onAuthSuccess: (token: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
    const [isSetup, setIsSetup] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/auth/status');
                const data = await res.json();
                setIsSetup(data.isSetup);
            } catch (err) {
                setError('Could not connect to the server.');
                // If status endpoint fails we assume setup is already done so show login form
                setIsSetup(true);
            } finally {
                setIsLoading(false);
            }
        };
        checkStatus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isSetup && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setIsLoading(true);
        const endpoint = isSetup ? '/api/auth/login' : '/api/auth/setup';
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Authentication failed.');
            }
            
            onAuthSuccess(data.token);

        } catch (err: any) {
            const msg = err.message || 'Authentication failed.';
            if (msg.includes('already been set up')) {
                // Switch to login mode silently
                setIsSetup(true);
                setError('');
                return;
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !error) {
        return (
             <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg dark:to-gray-900 min-h-screen flex flex-col justify-center items-center p-4">
                 <p className="text-gray-600 dark:text-dark-text-secondary">Checking application status...</p>
             </div>
        )
    }

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg dark:to-gray-900 min-h-screen flex flex-col justify-center items-center p-4">
             <div className="flex items-center space-x-4 mb-8">
              <div className="bg-brand-primary p-4 rounded-xl text-white shadow-lg">
                 <SparklesIcon />
              </div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-dark-text-primary tracking-tight">Welcome to Momentum AI</h1>
            </div>
            <div className="w-full max-w-md bg-white dark:bg-dark-card p-8 rounded-xl shadow-2xl border border-gray-200 dark:border-dark-border">
                <h2 className="font-bold text-2xl mb-2 text-center text-gray-900 dark:text-dark-text-primary">
                    {isSetup ? 'Enter Master Password' : 'Set Master Password'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary mb-6 text-center">
                    {isSetup ? 'Log in to access your dashboard.' : 'Create a password to secure your application.'}
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min. 6 characters)" className="w-full bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border rounded-md py-3 px-4 text-lg focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                    {!isSetup && (
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border rounded-md py-3 px-4 text-lg focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                    )}
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full mt-2 p-3 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50 flex items-center justify-center gap-2 font-semibold text-lg transition-colors">
                        {isLoading ? 'Processing...' : (isSetup ? 'Log In' : 'Set Password & Finish Setup')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AuthPage;
