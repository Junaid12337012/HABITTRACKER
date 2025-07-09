import React, { useState, useEffect } from 'react';
import { Habit } from '../types';
import { PlusIcon, TrashIcon, FlameIcon, PencilIcon } from './icons';
import Card from './Card';

interface HabitTrackerCardProps {
  habits: Habit[];
  onAddHabit: (name: string, description: string) => void;
  onUpdateHabit: (id: string, name: string, description: string) => void;
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
}

const calculateStreak = (completions: string[]): number => {
    if (completions.length === 0) return 0;
    
    const completionDates = new Set(completions.map(c => new Date(c).toDateString()));
    let streak = 0;
    const checkDate = new Date();
    
    if (!completionDates.has(checkDate.toDateString())) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while(completionDates.has(checkDate.toDateString())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return streak;
};

const HabitItem: React.FC<{ habit: Habit; onToggle: () => void; onDelete: () => void; onEdit: () => void; }> = ({ habit, onToggle, onDelete, onEdit }) => {
    const today = new Date().toDateString();
    const isCompletedToday = habit.completions.some(c => new Date(c).toDateString() === today);
    const streak = calculateStreak(habit.completions);

    return (
        <div className="flex items-center justify-between py-3 group border-b border-gray-200 dark:border-dark-border last:border-b-0">
            <div className="flex items-start flex-1 min-w-0">
                 <button 
                    onClick={onToggle}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-colors flex-shrink-0 mt-1 ${isCompletedToday ? 'bg-green-500 border-green-600 text-white' : 'bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                 >
                    ✓
                 </button>
                <div className="ml-4 min-w-0">
                    <span className="font-medium text-gray-800 dark:text-dark-text-primary truncate block">{habit.name}</span>
                    {habit.description && <p className="text-sm text-gray-500 dark:text-dark-text-secondary truncate">{habit.description}</p>}
                </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                <div className="flex items-center text-orange-400">
                    <FlameIcon />
                    <span className="ml-1 font-semibold">{streak}</span>
                </div>
                 <button onClick={onEdit} className="text-gray-400 dark:text-dark-text-secondary hover:text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity p-1">
                    <PencilIcon />
                </button>
                <button onClick={onDelete} className="text-gray-400 dark:text-dark-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                    <TrashIcon />
                </button>
            </div>
        </div>
    );
};

const HabitTrackerCard: React.FC<HabitTrackerCardProps> = ({ habits, onAddHabit, onUpdateHabit, onToggleHabit, onDeleteHabit }) => {
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setDescription(habitToEdit.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [habitToEdit]);

  const handleCancelEdit = () => {
    setHabitToEdit(null);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (habitToEdit) {
      onUpdateHabit(habitToEdit.id, name, description);
    } else {
      onAddHabit(name, description);
    }
    setHabitToEdit(null); // Resets form via useEffect
  };
  
  return (
    <Card title="Today's Habits" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M4 12h16M4 20h16m-7-8v8m-4-4h.01" /></svg>}>
      <div className="flex-grow overflow-y-auto pr-2 -mr-2 mb-4" style={{maxHeight: '220px'}}>
        {habits.length > 0 ? (
          habits.map(habit => (
            <HabitItem 
              key={habit.id} 
              habit={habit} 
              onToggle={() => onToggleHabit(habit.id)} 
              onDelete={() => onDeleteHabit(habit.id)}
              onEdit={() => setHabitToEdit(habit)}
            />
          ))
        ) : (
          <p className="text-gray-500 dark:text-dark-text-secondary text-center py-4">No habits defined yet. Add one!</p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="mt-auto flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-dark-border">
         <h4 className="font-semibold text-md text-gray-700 dark:text-dark-text-primary">{habitToEdit ? 'Edit Habit' : 'Add New Habit'}</h4>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Habit name (e.g., Read a book)"
          className="w-full bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
          required
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (e.g., 'for 15 minutes')"
          className="w-full bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <button type="submit" className="flex-grow p-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50 flex items-center justify-center gap-2" disabled={!name.trim()}>
            <PlusIcon /> {habitToEdit ? 'Update Habit' : 'Add Habit'}
          </button>
          {habitToEdit && (
            <button type="button" onClick={handleCancelEdit} className="p-2 bg-gray-200 dark:bg-dark-border text-gray-800 dark:text-dark-text-primary rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
              Cancel
            </button>
          )}
        </div>
      </form>
    </Card>
  );
};

export default HabitTrackerCard;