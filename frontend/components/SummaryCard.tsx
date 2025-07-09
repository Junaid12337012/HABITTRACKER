import React, { useState } from 'react';
import { generateDailySummary } from '../services/geminiService';
import { LifeData } from '../types';
import Card from './Card';
import { SparklesIcon } from './icons';
import { useAuth } from '../App';

interface SummaryCardProps {
  lifeData: LifeData;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ lifeData }) => {
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { token } = useAuth();

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError('');
    setSummary('');
    try {
      const result = await generateDailySummary(lifeData, token);
      setSummary(result);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const todayKey = new Date().toISOString().split('T')[0];
  const todayHabitsCompleted = lifeData.habits.some(h => h.completions.some(c => new Date(c).toDateString() === new Date().toDateString()));
  const todaysData = lifeData.dailyData[todayKey];
  const hasDataForToday = !!todaysData || todayHabitsCompleted;


  return (
    <Card title="AI Daily Reflection" icon={<SparklesIcon />}>
      <div className="flex flex-col flex-grow h-full">
        <div className="flex-grow text-gray-600 dark:text-dark-text-secondary leading-relaxed overflow-y-auto pr-2">
          {isLoading && <p>Reflecting on your day...</p>}
          {error && <p className="text-red-400">{error}</p>}
          {summary && !isLoading && summary.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-3 text-gray-700 dark:text-dark-text-primary">{paragraph}</p>
            ))}
          {!summary && !isLoading && <p>Click the button below to generate an AI-powered reflection on your day.</p>}
        </div>
        <button
          onClick={handleGenerateSummary}
          disabled={isLoading || !hasDataForToday}
          className="mt-auto w-full p-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-opacity"
        >
          <SparklesIcon /> {isLoading ? 'Generating...' : 'Generate Reflection'}
        </button>
         {!hasDataForToday && <p className="text-xs text-center text-gray-500 dark:text-dark-text-secondary mt-2">Log at least one item for today to enable reflection.</p>}
      </div>
    </Card>
  );
};

export default SummaryCard;