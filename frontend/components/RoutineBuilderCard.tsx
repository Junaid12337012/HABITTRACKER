import React, { useState } from 'react';
import { DayOfWeek, RoutineTask, WeeklyRoutine } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { PlusIcon, TrashIcon, PencilIcon, CalendarDaysIcon } from './icons';
import Card from './Card';

interface RoutineBuilderCardProps {
    weeklyRoutine: WeeklyRoutine;
    onAddTask: (day: DayOfWeek, time: string, text:string) => void;
    onUpdateTask: (day: DayOfWeek, taskId: string, time: string, text: string) => void;
    onDeleteTask: (day: DayOfWeek, taskId: string) => void;
    onApplyRoutine: () => Promise<number>;
    showToast: (message: string) => void;
    className?: string;
}

const RoutineBuilderCard: React.FC<RoutineBuilderCardProps> = ({ weeklyRoutine, onAddTask, onUpdateTask, onDeleteTask, onApplyRoutine, showToast, className }) => {
    const todayDayIndex = new Date().getDay();
    const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DAYS_OF_WEEK[todayDayIndex]);
    const [taskToEdit, setTaskToEdit] = useState<RoutineTask | null>(null);
    const [time, setTime] = useState('09:00');
    const [text, setText] = useState('');

    const handleSelectDay = (day: DayOfWeek) => {
        setSelectedDay(day);
        setTaskToEdit(null);
        setText('');
        setTime('09:00');
    }

    const handleEditClick = (task: RoutineTask) => {
        setTaskToEdit(task);
        setTime(task.time);
        setText(task.text);
    }

    const handleCancelEdit = () => {
        setTaskToEdit(null);
        setText('');
        setTime('09:00');
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (taskToEdit) {
            onUpdateTask(selectedDay, taskToEdit.id, time, text);
        } else {
            onAddTask(selectedDay, time, text);
        }
        handleCancelEdit();
    }
    
    const handleApplyRoutine = async () => {
        const count = await onApplyRoutine();
        if (count > 0) {
            showToast(`Applied ${count} new task${count > 1 ? 's' : ''} from your routine.`);
        } else {
            showToast("All routine tasks for today are already present or in the past.");
        }
    }

    const tasksForSelectedDay = weeklyRoutine[selectedDay] || [];

    return (
        <Card title="Weekly Routine" icon={<CalendarDaysIcon />} className={className}>
            <div className="flex flex-col h-full">
                {/* Day Tabs */}
                <div className="border-b border-gray-200 dark:border-dark-border mb-4">
                    <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
                        {DAYS_OF_WEEK.map((day, index) => (
                            <button
                                key={day}
                                onClick={() => handleSelectDay(day)}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    selectedDay === day
                                    ? 'border-brand-primary text-brand-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-dark-text-secondary dark:hover:text-dark-text-primary hover:border-gray-300'
                                } ${ index === todayDayIndex ? 'font-bold' : '' }`}
                            >
                                {day}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Apply Routine Button */}
                {selectedDay === DAYS_OF_WEEK[todayDayIndex] && (
                     <button
                        onClick={handleApplyRoutine}
                        disabled={tasksForSelectedDay.length === 0}
                        className="w-full p-2 mb-4 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        Apply Today's Routine to Tasks
                    </button>
                )}


                {/* Task List */}
                <div className="flex-grow overflow-y-auto pr-2 -mr-2" style={{ maxHeight: '200px' }}>
                     {tasksForSelectedDay.length > 0 ? (
                        tasksForSelectedDay.map(task => (
                            <div key={task.id} className="flex items-center justify-between py-2.5 group border-b border-gray-200 dark:border-dark-border last:border-b-0">
                                <div className="flex items-center">
                                    <span className="font-mono bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-text-secondary text-sm py-1 px-2 rounded-md">{task.time}</span>
                                    <p className="ml-4 text-gray-800 dark:text-dark-text-primary">{task.text}</p>
                                </div>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditClick(task)} className="p-2 text-gray-400 hover:text-brand-primary rounded-full"><PencilIcon /></button>
                                    <button onClick={() => onDeleteTask(selectedDay, task.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full"><TrashIcon /></button>
                                </div>
                            </div>
                        ))
                     ) : (
                        <p className="text-gray-500 dark:text-dark-text-secondary text-center py-8">No routine set for {selectedDay}.</p>
                     )}
                </div>

                {/* Add/Edit Form */}
                <form onSubmit={handleSubmit} className="mt-auto flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-dark-border">
                    <h4 className="font-semibold text-md text-gray-700 dark:text-dark-text-primary">{taskToEdit ? 'Edit Task' : 'Add New Task to Routine'}</h4>
                    <div className="grid grid-cols-3 gap-2">
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="col-span-1 w-full bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                            required
                        />
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Task description..."
                            className="col-span-2 w-full bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
                            required
                        />
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="submit" className="flex-grow p-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50 flex items-center justify-center gap-2" disabled={!text.trim()}>
                        <PlusIcon /> {taskToEdit ? 'Update Task' : 'Add Task'}
                      </button>
                      {taskToEdit && (
                        <button type="button" onClick={handleCancelEdit} className="p-2 bg-gray-200 dark:bg-dark-border text-gray-800 dark:text-dark-text-primary rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                          Cancel
                        </button>
                      )}
                    </div>
                </form>
            </div>
        </Card>
    );
};

export default RoutineBuilderCard;