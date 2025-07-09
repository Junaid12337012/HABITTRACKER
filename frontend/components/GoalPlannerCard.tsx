import React, { useState, useMemo } from 'react';
import { Goal, Milestone } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, TrophyIcon } from './icons';
import Card from './Card';

interface GoalPlannerCardProps {
    goals: Goal[];
    onAddGoal: (title: string, description?: string, targetDate?: string) => void;
    onUpdateGoal: (goalId: string, title: string, description?: string, targetDate?: string) => void;
    onDeleteGoal: (goalId: string) => void;
    onAddMilestone: (goalId: string, text: string) => void;
    onToggleMilestone: (goalId: string, milestoneId: string) => void;
    onDeleteMilestone: (goalId: string, milestoneId: string) => void;
    className?: string;
}

// --- Goal Form Modal ---
const GoalFormModal: React.FC<{
    goal?: Goal | null;
    onSave: (title: string, description?: string, targetDate?: string) => void;
    onClose: () => void;
}> = ({ goal, onSave, onClose }) => {
    const [title, setTitle] = useState(goal?.title || '');
    const [description, setDescription] = useState(goal?.description || '');
    const [targetDate, setTargetDate] = useState(goal?.targetDate ? goal.targetDate.split('T')[0] : '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(title, description, targetDate);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-6 w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-dark-text-primary">{goal ? 'Edit Goal' : 'Add New Goal'}</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Goal Title" className="w-full bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={3} className="w-full bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none" />
                    <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                    <div className="flex justify-end gap-2 mt-2">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-dark-border rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                        <button type="submit" disabled={!title.trim()} className="py-2 px-4 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50">Save Goal</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Goal Details Modal ---
const GoalDetailsModal: React.FC<{
    goal: Goal;
    onClose: () => void;
    onUpdateGoal: (goalId: string, title: string, description?: string, targetDate?: string) => void;
    onDeleteGoal: (goalId: string) => void;
    onAddMilestone: (goalId: string, text: string) => void;
    onToggleMilestone: (goalId: string, milestoneId: string) => void;
    onDeleteMilestone: (goalId: string, milestoneId: string) => void;
}> = ({ goal, onClose, onUpdateGoal, onDeleteGoal, onAddMilestone, onToggleMilestone, onDeleteMilestone }) => {
    const [newMilestoneText, setNewMilestoneText] = useState('');
    const [isEditingGoal, setIsEditingGoal] = useState(false);

    const progress = useMemo(() => {
        if (goal.milestones.length === 0) return 0;
        const completed = goal.milestones.filter(m => m.completed).length;
        return Math.round((completed / goal.milestones.length) * 100);
    }, [goal.milestones]);

    const handleAddMilestone = (e: React.FormEvent) => {
        e.preventDefault();
        onAddMilestone(goal.id, newMilestoneText);
        setNewMilestoneText('');
    };
    
    return (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-40" onClick={onClose}>
            {isEditingGoal && <GoalFormModal goal={goal} onClose={() => setIsEditingGoal(false)} onSave={(title, desc, date) => onUpdateGoal(goal.id, title, desc, date)} />}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-6 w-full max-w-2xl m-4 flex flex-col" style={{maxHeight: '90vh'}} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{goal.title}</h2>
                        {goal.targetDate && <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Target: {new Date(goal.targetDate).toLocaleDateString()}</p>}
                        {goal.description && <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">{goal.description}</p>}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditingGoal(true)} className="p-2 text-gray-500 hover:text-brand-primary"><PencilIcon /></button>
                         <button onClick={() => { if(confirm('Are you sure you want to delete this entire goal?')) { onDeleteGoal(goal.id); onClose(); }}} className="p-2 text-gray-500 hover:text-red-500"><TrashIcon /></button>
                    </div>
                </div>

                <div className="my-4">
                    <div className="flex justify-between mb-1">
                        <span className="text-base font-medium text-brand-primary">Progress</span>
                        <span className="text-sm font-medium text-brand-primary">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <h3 className="font-semibold mt-4 mb-2 text-gray-800 dark:text-dark-text-primary">Milestones</h3>
                <div className="flex-grow overflow-y-auto -mr-3 pr-3 space-y-2">
                    {goal.milestones.length > 0 ? goal.milestones.map(m => (
                        <div key={m.id} className="flex items-center justify-between group bg-gray-50 dark:bg-dark-bg p-2 rounded-md">
                            <div className="flex items-center">
                                <input type="checkbox" checked={m.completed} onChange={() => onToggleMilestone(goal.id, m.id)} className="h-5 w-5 rounded border-gray-300 dark:border-dark-border text-brand-primary focus:ring-brand-primary" />
                                <span className={`ml-3 ${m.completed ? 'line-through text-gray-500' : ''}`}>{m.text}</span>
                            </div>
                            <button onClick={() => onDeleteMilestone(goal.id, m.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><TrashIcon /></button>
                        </div>
                    )) : <p className="text-gray-500 text-center py-4">No milestones yet. Add one below!</p>}
                </div>
                
                <form onSubmit={handleAddMilestone} className="mt-4 flex gap-2 border-t border-gray-200 dark:border-dark-border pt-4">
                    <input type="text" value={newMilestoneText} onChange={e => setNewMilestoneText(e.target.value)} placeholder="Add a new milestone..." className="flex-grow bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                    <button type="submit" className="py-2 px-4 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50"><PlusIcon /></button>
                </form>
            </div>
        </div>
    );
}

// --- Main Card Component ---
const GoalPlannerCard: React.FC<GoalPlannerCardProps> = (props) => {
    const { goals, onAddGoal, className } = props;
    const [isAdding, setIsAdding] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

    const handleSaveNewGoal = (title: string, description?: string, targetDate?: string) => {
        onAddGoal(title, description, targetDate);
    };

    return (
        <>
            {isAdding && <GoalFormModal onSave={handleSaveNewGoal} onClose={() => setIsAdding(false)} />}
            {selectedGoal && <GoalDetailsModal goal={selectedGoal} onClose={() => setSelectedGoal(null)} {...props} />}

            <Card title="Goal Planner" icon={<TrophyIcon />} className={className}>
                <div className="flex flex-col h-full">
                    <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-3" style={{ maxHeight: '400px' }}>
                        {goals.length > 0 ? goals.map(goal => {
                            const progress = goal.milestones.length > 0 ? Math.round((goal.milestones.filter(m => m.completed).length / goal.milestones.length) * 100) : 0;
                            return (
                                <div key={goal.id} className="p-3 rounded-lg bg-gray-50 dark:bg-dark-bg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setSelectedGoal(goal)}>
                                    <p className="font-semibold text-gray-800 dark:text-dark-text-primary">{goal.title}</p>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-600 mt-2">
                                        <div className="bg-brand-primary h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            )
                        }) : <p className="text-gray-500 dark:text-dark-text-secondary text-center py-12">Define your ambitions. Add a new goal to get started.</p>}
                    </div>
                    <button onClick={() => setIsAdding(true)} className="mt-auto w-full p-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex items-center justify-center gap-2 mt-4 border-t border-gray-200 dark:border-dark-border pt-4">
                        <PlusIcon /> Add New Goal
                    </button>
                </div>
            </Card>
        </>
    );
};

export default GoalPlannerCard;