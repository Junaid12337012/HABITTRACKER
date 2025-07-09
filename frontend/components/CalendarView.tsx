import React, { useState, useMemo } from 'react';
import { LifeData, Mood, Task, Habit, JournalEntry, PhotoLog, DailyData } from '../types';
import { MOOD_OPTIONS } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon, BookOpenIcon, CameraIcon, FlameIcon, BellIcon, ArrowDownCircleIcon, ArrowUpCircleIcon } from './icons';

interface CalendarViewProps {
  lifeData: LifeData;
}

interface DaySummary {
  date: Date;
  mood?: Mood;
  taskCount: number;
  hasCompletedHabits: boolean;
  hasJournal: boolean;
  hasPhoto: boolean;
  hasData: boolean;
}

const getDateKey = (date: Date | string) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- Day Detail Modal ---
const DayDetailModal: React.FC<{ dayData: DailyData; date: Date; onClose: () => void; habits: Habit[] }> = ({ dayData, date, onClose, habits }) => {
    const moodInfo = MOOD_OPTIONS.find(m => m.mood === dayData.moodLog?.mood);
    const dateString = date.toDateString();
    const completedHabits = habits.filter(h => h.completions.some(c => new Date(c).toDateString() === dateString));
    const allTransactions = [
        ...(dayData.income || []).map(i => ({ ...i, type: 'income' as const })),
        ...(dayData.expenses || []).map(e => ({ ...e, type: 'expense' as const })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-6 w-full max-w-2xl m-4 flex flex-col" style={{maxHeight: '90vh'}} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">{date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-border text-2xl leading-none">&times;</button>
                </div>

                <div className="overflow-y-auto pr-2 -mr-2 space-y-5">
                    {/* Mood Section */}
                    {moodInfo && (
                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                            <span className="text-4xl">{moodInfo.icon}</span>
                            <div>
                                <p className="font-semibold text-lg text-gray-800 dark:text-dark-text-primary">You felt <span className={moodInfo.color}>{moodInfo.mood}</span></p>
                            </div>
                        </div>
                    )}

                    {/* Photo and Journal Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dayData.photoLog && (
                            <div>
                                <h3 className="font-semibold mb-2 text-gray-800 dark:text-dark-text-primary">Photo of the Day</h3>
                                <img src={dayData.photoLog.imageDataUrl} className="rounded-lg w-full h-auto object-cover" alt="Photo of the day" />
                                {dayData.photoLog.note && <p className="text-sm italic text-gray-600 dark:text-dark-text-secondary mt-2">{dayData.photoLog.note}</p>}
                            </div>
                        )}

                        {dayData.journalEntry && dayData.journalEntry.text.trim() && (
                            <div>
                                <h3 className="font-semibold mb-2 text-gray-800 dark:text-dark-text-primary">Journal Entry</h3>
                                <div className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-dark-bg p-3 rounded-lg h-full">
                                    <p className="whitespace-pre-wrap">{dayData.journalEntry.text}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tasks Section */}
                    {dayData.tasks && dayData.tasks.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 text-gray-800 dark:text-dark-text-primary">Tasks</h3>
                            <ul className="space-y-2">
                                {dayData.tasks.map(task => (
                                    <li key={task.id} className="flex items-center gap-3 text-sm bg-gray-50 dark:bg-dark-bg p-2 rounded-md">
                                        <input type="checkbox" checked={task.completed} readOnly className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary flex-shrink-0" />
                                        <span className={`flex-grow ${task.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-dark-text-primary'}`}>{task.text}</span>
                                        {task.notificationMinutes !== null && <BellIcon />}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Habits Section */}
                    {completedHabits.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 text-gray-800 dark:text-dark-text-primary">Completed Habits</h3>
                            <div className="flex flex-wrap gap-2">
                                {completedHabits.map(habit => (
                                    <li key={habit.id} className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-3 py-1 rounded-full list-none">
                                        <FlameIcon />
                                        <span>{habit.name}</span>
                                    </li>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Finance Section */}
                    {allTransactions.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 text-gray-800 dark:text-dark-text-primary">Finances</h3>
                             <ul className="space-y-2">
                                {allTransactions.map(t => (
                                    <li key={t.id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-dark-bg p-2 rounded-md">
                                        <div className="flex items-center gap-3">
                                            <span className={t.type === 'income' ? 'text-green-500' : 'text-red-500'}>{t.type === 'income' ? <ArrowUpCircleIcon /> : <ArrowDownCircleIcon/>}</span>
                                            <span>{t.description}</span>
                                        </div>
                                        <span className={`font-semibold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{t.type === 'income' ? '+' : '-'}PKR {t.amount.toFixed(0)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const CalendarView: React.FC<CalendarViewProps> = ({ lifeData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<{ date: Date; data: DailyData } | null>(null);

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  const daysInMonth = useMemo((): DaySummary[] => {
    const days: DaySummary[] = [];
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from the Sunday of the first week

    for (let i = 0; i < 42; i++) { // 6 weeks grid
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      const dateKey = getDateKey(day);
      const dayData = lifeData.dailyData[dateKey];
      const dateString = day.toDateString();

      const hasCompletedHabits = lifeData.habits.some(h => h.completions.some(c => new Date(c).toDateString() === dateString));
      const hasData = !!dayData || hasCompletedHabits;

      days.push({
        date: day,
        mood: dayData?.moodLog?.mood,
        taskCount: dayData?.tasks?.length || 0,
        hasCompletedHabits,
        hasJournal: !!(dayData?.journalEntry?.text && dayData.journalEntry.text.trim()),
        hasPhoto: !!dayData?.photoLog,
        hasData
      });
    }
    return days;
  }, [currentDate, lifeData]);

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1); // Set to 1st to avoid month skipping issues
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const handleDayClick = (daySummary: DaySummary) => {
    const dateKey = getDateKey(daySummary.date);
    const data = lifeData.dailyData[dateKey];
    if (data) {
        setSelectedDay({ date: daySummary.date, data });
    }
  };

  const today = new Date();

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-dark-card rounded-xl shadow-lg">
      {selectedDay && <DayDetailModal dayData={selectedDay.data} date={selectedDay.date} onClose={() => setSelectedDay(null)} habits={lifeData.habits} />}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center space-x-2">
           <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-dark-text-secondary bg-gray-100 dark:bg-dark-border rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Today</button>
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-border"><ChevronLeftIcon /></button>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-border"><ChevronRightIcon /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 dark:text-dark-text-secondary border-b border-gray-200 dark:border-dark-border pb-2 mb-2">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day, index) => {
          const isCurrentMonth = day.date.getMonth() === currentDate.getMonth();
          const isToday = day.date.toDateString() === today.toDateString();
          const moodInfo = MOOD_OPTIONS.find(m => m.mood === day.mood);

          return (
            <div
              key={index}
              className={`h-24 sm:h-32 p-1.5 border rounded-lg flex flex-col transition-colors ${
                isCurrentMonth ? 'bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border' : 'bg-gray-50 dark:bg-dark-bg border-gray-100 dark:border-dark-bg'
              } ${day.hasData ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : 'cursor-default'}`}
              onClick={() => day.hasData && handleDayClick(day)}
            >
              <time
                dateTime={getDateKey(day.date)}
                className={`flex items-center justify-center h-7 w-7 text-sm rounded-full ${isToday ? 'bg-brand-primary text-white font-bold' : ''} ${isCurrentMonth ? 'text-gray-900 dark:text-dark-text-primary' : 'text-gray-400 dark:text-dark-text-secondary'}`}
              >
                {day.date.getDate()}
              </time>
              {isCurrentMonth && (
                <div className="mt-1 flex-grow flex flex-col items-center justify-center space-y-1 text-gray-500 dark:text-dark-text-secondary">
                    {moodInfo && <span className="text-xl">{moodInfo.icon}</span>}
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        {day.hasJournal && <BookOpenIcon className="h-4 w-4" />}
                        {day.hasPhoto && <CameraIcon className="h-4 w-4" />}
                        {day.hasCompletedHabits && <FlameIcon className="h-4 w-4 text-orange-400" />}
                        {day.taskCount > 0 && 
                            <span className="text-xs bg-gray-200 dark:bg-dark-border px-1.5 py-0.5 rounded-full">{day.taskCount} tasks</span>
                        }
                    </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;