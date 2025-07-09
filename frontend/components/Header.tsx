import React from 'react';
import { SparklesIcon, SunIcon, MoonIcon } from './icons';
import { View } from '../App';

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
  activeView: View;
  setActiveView: (view: View) => void;
}

const NavLink: React.FC<{
  view: View, 
  activeView: View, 
  setActiveView: (view: View) => void,
  children: React.ReactNode
}> = ({ view, activeView, setActiveView, children }) => (
  <button 
    onClick={() => setActiveView(view)}
    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      activeView === view
      ? 'bg-brand-primary text-white shadow-md'
      : 'text-gray-600 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-card'
    }`}
  >
    {children}
  </button>
);

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, activeView, setActiveView }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="mb-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 self-start sm:self-center">
          <div className="bg-brand-primary p-2 rounded-lg text-white">
             <SparklesIcon />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary">Momentum AI</h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
           <nav className="flex space-x-1 sm:space-x-2 bg-gray-100 dark:bg-dark-bg p-1 rounded-lg">
            <NavLink view="dashboard" activeView={activeView} setActiveView={setActiveView}>Dashboard</NavLink>
            <NavLink view="calendar" activeView={activeView} setActiveView={setActiveView}>Calendar</NavLink>
            <NavLink view="chat" activeView={activeView} setActiveView={setActiveView}>Chat</NavLink>
            <NavLink view="analytics" activeView={activeView} setActiveView={setActiveView}>Analytics</NavLink>
            <NavLink view="settings" activeView={activeView} setActiveView={setActiveView}>Settings</NavLink>
          </nav>
           <button onClick={toggleTheme} className="p-2 rounded-full text-gray-600 dark:text-dark-text-secondary bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
       <p className="text-md text-center sm:text-right text-gray-500 dark:text-dark-text-secondary mt-2 sm:hidden">{currentDate}</p>
    </header>
  );
};

export default Header;