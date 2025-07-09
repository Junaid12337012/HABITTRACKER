import React from 'react';

interface CardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, icon, children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-lg p-6 flex flex-col ${className}`}>
      <div className="flex items-center mb-4">
        <div className="text-brand-primary mr-3">{icon}</div>
        <h3 className="font-bold text-lg text-gray-900 dark:text-dark-text-primary">{title}</h3>
      </div>
      <div className="flex-grow flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default Card;