import React from 'react';
import { Mood, MoodLog } from '../types';
import { MOOD_OPTIONS } from '../constants';
import Card from './Card';

interface MoodCardProps {
  moodLogs: MoodLog[];
  onAddMoodLog: (mood: Mood) => void;
}

const MoodCard: React.FC<MoodCardProps> = ({ moodLogs, onAddMoodLog }) => {
  const today = new Date().toDateString();
  const todaysMoodLog = moodLogs.find(log => new Date(log.createdAt).toDateString() === today);

  return (
    <Card title="Today's Mood" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
      <div className="flex flex-col justify-center items-center flex-grow">
        {todaysMoodLog ? (
          <div className="text-center">
            <div className="text-6xl mb-2">{MOOD_OPTIONS.find(o => o.mood === todaysMoodLog.mood)?.icon}</div>
            <p className="text-gray-800 dark:text-dark-text-primary text-lg">You're feeling <span className={`font-bold ${MOOD_OPTIONS.find(o => o.mood === todaysMoodLog.mood)?.color}`}>{todaysMoodLog.mood}</span></p>
            <p className="text-gray-500 dark:text-dark-text-secondary text-sm">You can change this by selecting another mood.</p>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-dark-text-secondary">How are you feeling today?</p>
        )}
      </div>
      <div className="flex justify-around items-center mt-auto pt-4 border-t border-gray-200 dark:border-dark-border">
        {MOOD_OPTIONS.map(({ mood, icon }) => (
          <button
            key={mood}
            onClick={() => onAddMoodLog(mood)}
            className={`p-2 rounded-full transform transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-dark-card focus:ring-brand-primary ${todaysMoodLog?.mood === mood ? 'scale-125' : ''}`}
            title={mood}
          >
            {icon}
          </button>
        ))}
      </div>
    </Card>
  );
};

export default MoodCard;