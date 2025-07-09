
import React, { useState, useEffect, createContext, useContext } from 'react';
import Dashboard from './components/Dashboard';
import AnalyticsPage from './components/AnalyticsPage';
import CalendarView from './components/CalendarView';
import SettingsPage from './components/SettingsPage';
import ChatPage from './components/ChatPage';
import { useLifeData } from './hooks/useLifeData';
import Header from './components/Header';
import AuthPage from './components/AuthPage';
import { SparklesIcon } from './components/icons';

export type View = 'dashboard' | 'analytics' | 'calendar' | 'chat' | 'settings';

// --- Auth Context ---
interface AuthContextType {
    token: string | null;
    setToken: (token: string | null) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setTokenState] = useState<string | null>(localStorage.getItem('authToken'));

    const setToken = (newToken: string | null) => {
        setTokenState(newToken);
        if (newToken) {
            localStorage.setItem('authToken', newToken);
        } else {
            localStorage.removeItem('authToken');
        }
    };
    
    const logout = () => {
        setToken(null);
    }

    return (
        <AuthContext.Provider value={{ token, setToken, logout }}>
            {children}
        </AuthContext.Provider>
    );
};


// --- Toast Component ---
const Toast: React.FC<{ message: string, onDone: () => void }> = ({ message, onDone }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDone();
        }, 2000);
        return () => clearTimeout(timer);
    }, [onDone]);

    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white py-2 px-5 rounded-full shadow-lg z-50 animate-fade-in-out">
            {message}
        </div>
    );
};

// --- Main App Content ---
const AppContent: React.FC = () => {
    const [theme, setTheme] = useState('dark');
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const { token, logout } = useAuth();
    const lifeDataHook = useLifeData(token);
    const { isLoading, lifeData, refetchData } = lifeDataHook;

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            setTheme(savedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    }, []);
    
    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    const showToast = (message: string) => {
        setToastMessage(message);
    };
    
    const dashboardProps = {...lifeDataHook, showToast, logout };

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return <Dashboard {...dashboardProps} />;
            case 'analytics':
                return <AnalyticsPage {...lifeDataHook} />;
            case 'calendar':
                return <CalendarView lifeData={lifeDataHook.lifeData} />;
            case 'chat':
                return <ChatPage lifeData={lifeDataHook.lifeData} />;
            case 'settings':
                return <SettingsPage {...dashboardProps} refetchData={refetchData} />;
            default:
                return <Dashboard {...dashboardProps} />;
        }
    };
    
    if (isLoading && !lifeData) {
        return (
            <div className="bg-gray-50 dark:bg-dark-bg min-h-screen flex flex-col justify-center items-center">
                 <div className="flex items-center space-x-4 mb-8">
                    <div className="bg-brand-primary p-4 rounded-xl text-white shadow-lg animate-pulse">
                        <SparklesIcon />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-dark-text-primary tracking-tight">Loading Your Dashboard...</h1>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-gray-50 dark:bg-dark-bg min-h-screen">
           {toastMessage && <Toast message={toastMessage} onDone={() => setToastMessage(null)} />}
           <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Header 
              theme={theme} 
              toggleTheme={toggleTheme} 
              activeView={activeView}
              setActiveView={setActiveView}
            />
            {renderView()}
          </div>
        </div>
    );
};

// --- App Wrapper ---
function App() {
    return (
        <AuthProvider>
            <AppWrapper />
        </AuthProvider>
    );
}

const AppWrapper: React.FC = () => {
    const { token, setToken } = useAuth();
    if (!token) {
        return <AuthPage onAuthSuccess={setToken} />;
    }
    return <AppContent />;
}

export default App;
