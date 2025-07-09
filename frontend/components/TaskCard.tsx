
import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { PlusIcon, TrashIcon, BellIcon } from './icons';
import Card from './Card';

interface TaskCardProps {
  tasks: Task[];
  onAddTask: (text: string, dueDate: string, notificationMinutes: number | null) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  className?: string;
}

const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const TaskItem: React.FC<{ task: Task; onToggle: () => void; onDelete: () => void }> = ({ task, onToggle, onDelete }) => {
    const dueDate = new Date(task.dueDate);
    const isOverdue = !task.completed && dueDate < new Date();

    return (
        <div className="flex items-center justify-between py-2.5 group border-b border-gray-200 dark:border-dark-border last:border-b-0">
            <div className="flex items-center min-w-0">
                <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={onToggle}
                    className="h-5 w-5 rounded bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border text-brand-primary focus:ring-brand-primary flex-shrink-0"
                />
                <div className="ml-3 min-w-0">
                    <span className={`block truncate ${task.completed ? 'line-through text-gray-500 dark:text-dark-text-secondary' : 'text-gray-800 dark:text-dark-text-primary'}`}>
                        {task.text}
                    </span>
                    <div className={`text-xs flex items-center gap-1.5 ${isOverdue ? 'text-red-500' : 'text-gray-500 dark:text-dark-text-secondary'}`}>
                        <span>{formatDate(dueDate)} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         {task.notificationMinutes !== null && <BellIcon />}
                    </div>
                </div>
            </div>
            <button onClick={onDelete} className="text-gray-400 dark:text-dark-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <TrashIcon />
            </button>
        </div>
    );
};


const TaskCard: React.FC<TaskCardProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask, className }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notificationMinutes, setNotificationMinutes] = useState<string>('null');
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [isSchedulingSupported, setIsSchedulingSupported] = useState(false);

  useEffect(() => {
    // Check for support once on mount
    setIsSchedulingSupported('TimestampTrigger' in window);
    
    const defaultDate = new Date();
    defaultDate.setHours(defaultDate.getHours() + 1);
    defaultDate.setMinutes(0);
    setDueDate(defaultDate.toISOString().slice(0,16));
  }, []);

  const handleRequestPermission = () => {
    Notification.requestPermission().then(permission => {
      setNotificationPermission(permission);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const notifMins = notificationMinutes === 'null' ? null : parseInt(notificationMinutes, 10);
    onAddTask(newTaskText, new Date(dueDate).toISOString(), notifMins);
    setNewTaskText('');
  };
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todaysTasks = tasks
    .filter(t => new Date(t.dueDate) >= todayStart && new Date(t.dueDate) <= todayEnd)
    .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  
  const upcomingTasks = tasks
    .filter(t => new Date(t.dueDate) > todayEnd)
    .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <Card title="Task Planner" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} className={className}>
      {notificationPermission === 'default' && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 text-sm rounded-md p-3 mb-4 flex items-center justify-between">
            <p>Enable notifications to get reminders for your tasks.</p>
            <button onClick={handleRequestPermission} className="bg-yellow-200 dark:bg-yellow-500/50 text-yellow-900 dark:text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-yellow-300 dark:hover:bg-yellow-500/70">Enable</button>
        </div>
      )}
      {notificationPermission === 'granted' && !isSchedulingSupported && (
        <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 text-sm rounded-md p-3 mb-4">
            <p>Your browser doesn't support scheduled notifications. For reminders, please use a browser like Chrome or Edge.</p>
        </div>
      )}
      <div className="flex-grow space-y-4">
        <div>
            <h4 className="font-semibold text-gray-600 dark:text-dark-text-secondary mb-1">Due Today</h4>
            <div className="overflow-y-auto pr-2 -mr-2" style={{maxHeight: '150px'}}>
                {todaysTasks.length > 0 ? todaysTasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={() => onToggleTask(task.id)} onDelete={() => onDeleteTask(task.id)} />
                )) : <p className="text-gray-500 dark:text-dark-text-secondary text-center py-2 text-sm">No tasks due today.</p>}
            </div>
        </div>
        <div>
            <h4 className="font-semibold text-gray-600 dark:text-dark-text-secondary mb-1">Upcoming</h4>
            <div className="overflow-y-auto pr-2 -mr-2" style={{maxHeight: '150px'}}>
                {upcomingTasks.length > 0 ? upcomingTasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={() => onToggleTask(task.id)} onDelete={() => onDeleteTask(task.id)} />
                )) : <p className="text-gray-500 dark:text-dark-text-secondary text-center py-2 text-sm">No upcoming tasks.</p>}
            </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mt-auto flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-dark-border">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new task..."
          className="w-full bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
          required
        />
        <div className="grid grid-cols-2 gap-2">
            <input
                type="datetime-local"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                required
            />
            <select
                value={notificationMinutes}
                onChange={e => setNotificationMinutes(e.target.value)}
                disabled={notificationPermission !== 'granted' || !isSchedulingSupported}
                title={
                    notificationPermission !== 'granted'
                    ? "Enable notifications to set reminders"
                    : !isSchedulingSupported
                    ? "Your browser does not support scheduled notifications"
                    : ""
                }
                className="w-full bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none disabled:opacity-50"
            >
                <option value="null">No notification</option>
                <option value="0">At time of event</option>
                <option value="5">5 minutes before</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
            </select>
        </div>
        <button type="submit" className="w-full p-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50 flex items-center justify-center gap-2" disabled={!newTaskText.trim() || !dueDate}>
          <PlusIcon /> Add Task
        </button>
      </form>
    </Card>
  );
};

export default TaskCard;