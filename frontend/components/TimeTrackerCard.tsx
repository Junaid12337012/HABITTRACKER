import React, { useState, useMemo } from 'react';
import { TimeLog } from '../types';
import Card from './Card';
import { PlusIcon, TrashIcon, ClockIcon } from './icons';

interface TimeTrackerCardProps {
    timeLogs: TimeLog[];
    onAddTimeLog: (activity: string, minutes: number) => void;
    onDeleteTimeLog: (id: string) => void;
}

const formatDuration = (totalMinutes: number) => {
    if (totalMinutes < 60) {
        return `${totalMinutes}m`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
}

const TimeTrackerCard: React.FC<TimeTrackerCardProps> = ({ timeLogs, onAddTimeLog, onDeleteTimeLog }) => {
    const [activity, setActivity] = useState('');
    const [minutes, setMinutes] = useState('');

    const { todaysLogs, totalMinutesToday } = useMemo(() => {
        const todayStr = new Date().toDateString();
        const todaysLogs = timeLogs.filter(log => new Date(log.createdAt).toDateString() === todayStr)
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const totalMinutesToday = todaysLogs.reduce((sum, log) => sum + log.minutes, 0);
        return { todaysLogs, totalMinutesToday };
    }, [timeLogs]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numMinutes = parseInt(minutes, 10);
        if (!activity.trim() || isNaN(numMinutes) || numMinutes <= 0) return;

        onAddTimeLog(activity, numMinutes);
        setActivity('');
        setMinutes('');
    };

    return (
        <Card title="Time Log" icon={<ClockIcon />}>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2" style={{ maxHeight: '180px' }}>
                {todaysLogs.length > 0 ? (
                    todaysLogs.map(log => (
                        <div key={log.id} className="flex items-center justify-between py-2.5 group border-b border-gray-200 dark:border-dark-border last:border-b-0">
                            <p className="text-gray-800 dark:text-dark-text-primary truncate">{log.activity}</p>
                            <div className="flex items-center">
                                <span className="font-semibold text-gray-600 dark:text-dark-text-secondary">{formatDuration(log.minutes)}</span>
                                <button onClick={() => onDeleteTimeLog(log.id)} className="text-gray-400 dark:text-dark-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 dark:text-dark-text-secondary text-center py-8">No time logged today.</p>
                )}
            </div>
            
             <div className="text-right font-bold text-lg text-gray-800 dark:text-dark-text-primary py-2 border-t border-b border-gray-200 dark:border-dark-border my-4">
                Total Today: {formatDuration(totalMinutesToday)}
            </div>

            <form onSubmit={handleSubmit} className="mt-auto flex flex-col gap-2">
                <input
                    type="text"
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    placeholder="Activity name"
                    className="w-full bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    required
                />
                <input
                    type="number"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    placeholder="Minutes spent"
                    min="1"
                    className="w-full bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    required
                />
                <button type="submit" className="w-full p-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50 flex items-center justify-center gap-2" disabled={!activity.trim() || !minutes}>
                    <PlusIcon /> Log Time
                </button>
            </form>
        </Card>
    );
};

export default TimeTrackerCard;
