
import { useState, useEffect, useCallback, useMemo } from 'react';
import { LifeData, Task, Expense, MoodLog, ExpenseCategory, Mood, Habit, WeeklyRoutine, DayOfWeek, RoutineTask, JournalEntry, Goal, Milestone, Income, IncomeCategory, TimeLog, PhotoLog, Credential, DailyData } from '../types';
import { DAYS_OF_WEEK } from '../constants';

const getDateKey = (date: Date | string) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const initialRoutine = Object.fromEntries(
  DAYS_OF_WEEK.map(day => [day, []])
) as WeeklyRoutine;

// --- START NOTIFICATION HELPERS ---
declare global {
  interface NotificationOptions {
    showTrigger?: unknown;
  }
  interface Window {
    TimestampTrigger?: { new (timestamp: number): unknown };
  }
}

const scheduleNotification = async (task: Task) => {
  if (task.notificationMinutes === null || !task.dueDate || !window.TimestampTrigger) return;
  
  const registration = await navigator.serviceWorker.ready;
  const notificationTime = new Date(task.dueDate).getTime() - task.notificationMinutes * 60 * 1000;

  if (notificationTime <= Date.now()) return;

  try {
    const iconUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%234f46e5'/%3E%3Cpath d='M25 70 V30 L50 50 L75 30 V70' stroke='white' stroke-width='10' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E";
    
    await registration.showNotification(task.text, {
      body: `Due at ${new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      tag: task.id,
      icon: iconUrl,
      showTrigger: new window.TimestampTrigger(notificationTime),
    });
  } catch (e) {
    console.error('Failed to schedule notification:', e);
  }
};

const cancelNotification = async (taskId: string) => {
    const registration = await navigator.serviceWorker.ready;
    const notifications = await registration.getNotifications({ tag: taskId });
    notifications.forEach(notification => notification.close());
};
// --- END NOTIFICATION HELPERS ---

const buildLifeDataObject = (apiData: { [key: string]: any }): LifeData => {
    const lifeData: LifeData = {
        dailyData: {},
        habits: apiData.habits || [],
        goals: apiData.goals || [],
        credentials: apiData.credentials || [],
        weeklyRoutine: (apiData.routine && apiData.routine.weeklyRoutine) ? apiData.routine.weeklyRoutine : initialRoutine,
    };
    
    const processItems = (items: any[], type: keyof DailyData | 'moodLog' | 'journalEntry' | 'photoLog') => {
        if (!items) return;
        items.forEach((item: any) => {
            const dateKey = getDateKey(item.createdAt || item.dueDate);
            if (!lifeData.dailyData[dateKey]) {
                lifeData.dailyData[dateKey] = { tasks: [], expenses: [], income: [], timeLogs: [] };
            }

            if (type === 'moodLog' || type === 'journalEntry' || type === 'photoLog') {
                 (lifeData.dailyData[dateKey] as any)[type] = item;
            } else if (Array.isArray((lifeData.dailyData[dateKey] as any)[type])) {
                (lifeData.dailyData[dateKey] as any)[type].push(item);
            }
        });
    };
    
    processItems(apiData.tasks, 'tasks');
    processItems(apiData.expenses, 'expenses');
    processItems(apiData.income, 'income');
    processItems(apiData['mood-logs'], 'moodLog');
    processItems(apiData['journal-entries'], 'journalEntry');
    processItems(apiData['photo-logs'], 'photoLog');
    processItems(apiData['time-logs'], 'timeLogs');

    return lifeData;
};


export const useLifeData = (token: string | null) => {
  const [lifeData, setLifeData] = useState<LifeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiAction = useCallback(async <T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any): Promise<T> => {
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`/api${endpoint}`, {
          method,
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: body ? JSON.stringify(body) : undefined
      });
      if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || `Request failed with status ${res.status}`);
      }
      return res.status === 204 ? ({} as T) : await res.json();
  }, [token]);

  const fetchData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const endpoints = ['tasks', 'habits', 'goals', 'expenses', 'income', 'mood-logs', 'journal-entries', 'photo-logs', 'time-logs', 'credentials', 'routine'];
      const requests = endpoints.map(e => apiAction<any>(`/${e}`, 'GET'));
      
      const results = await Promise.all(requests);
      
      const apiData = endpoints.reduce((acc, current, index) => {
        acc[current] = results[index];
        return acc;
      }, {} as {[key: string]: any});

      const assembledData = buildLifeDataObject(apiData);
      setLifeData(assembledData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      console.error("Fetch data error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, apiAction]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const optimisticallyUpdate = (updater: (prev: LifeData) => LifeData) => {
    setLifeData(prev => prev ? updater(prev) : null);
  };

  const tasks = useMemo(() => lifeData ? Object.values(lifeData.dailyData).flatMap(d => d.tasks || []) : [], [lifeData]);
  const expenses = useMemo(() => lifeData ? Object.values(lifeData.dailyData).flatMap(d => d.expenses || []) : [], [lifeData]);
  const income = useMemo(() => lifeData ? Object.values(lifeData.dailyData).flatMap(d => d.income || []) : [], [lifeData]);
  const moodLogs = useMemo(() => lifeData ? Object.values(lifeData.dailyData).map(d => d.moodLog).filter((l): l is MoodLog => !!l) : [], [lifeData]);
  const journalEntries = useMemo(() => lifeData ? Object.values(lifeData.dailyData).map(d => d.journalEntry).filter((l): l is JournalEntry => !!l) : [], [lifeData]);
  const photoLogs = useMemo(() => lifeData ? Object.values(lifeData.dailyData).map(d => d.photoLog).filter((l): l is PhotoLog => !!l) : [], [lifeData]);
  const timeLogs = useMemo(() => lifeData ? Object.values(lifeData.dailyData).flatMap(d => d.timeLogs || []) : [], [lifeData]);
  const habits = useMemo(() => lifeData?.habits || [], [lifeData]);
  const goals = useMemo(() => lifeData?.goals || [], [lifeData]);
  const credentials = useMemo(() => lifeData?.credentials || [], [lifeData]);

  // --- Daily Data Operations ---
  const updateDailyData = (dateKey: string, updater: (day: DailyData) => DailyData) => {
      optimisticallyUpdate(prev => {
          const newDailyData = { ...prev.dailyData };
          const currentDay = newDailyData[dateKey] || { tasks: [], expenses: [], income: [], timeLogs: [] };
          newDailyData[dateKey] = updater(currentDay);
          return { ...prev, dailyData: newDailyData };
      });
  };

  const addTask = useCallback(async (text: string, dueDate: string, notificationMinutes: number | null) => {
    const newTaskData = { text, completed: false, dueDate, notificationMinutes, createdAt: getDateKey(dueDate) };
    const newTask = await apiAction<Task>('/tasks', 'POST', newTaskData);
    if (Notification.permission === 'granted') await scheduleNotification(newTask);
    updateDailyData(getDateKey(dueDate), day => ({ ...day, tasks: [...day.tasks, newTask] }));
  }, [apiAction]);

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updatedTask = { ...task, completed: !task.completed };
    updateDailyData(getDateKey(task.dueDate), day => ({ ...day, tasks: day.tasks.map(t => t.id === id ? updatedTask : t) }));
    await apiAction(`/tasks/${id}`, 'PUT', { completed: updatedTask.completed });
    if (updatedTask.completed) await cancelNotification(id);
    else if (Notification.permission === 'granted') await scheduleNotification(updatedTask);
  }, [apiAction, tasks]);

  const deleteTask = useCallback(async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;
    await cancelNotification(id);
    updateDailyData(getDateKey(taskToDelete.dueDate), day => ({...day, tasks: day.tasks.filter(t => t.id !== id)}));
    await apiAction(`/tasks/${id}`, 'DELETE');
  }, [apiAction, tasks]);

  const addExpense = useCallback(async (amount: number, description: string, category: ExpenseCategory) => {
    const dateKey = getDateKey(new Date());
    const newExpenseData = { amount, description, category, createdAt: new Date().toISOString() };
    const newExpense = await apiAction<Expense>('/expenses', 'POST', newExpenseData);
    updateDailyData(dateKey, day => ({...day, expenses: [...day.expenses, newExpense]}));
  }, [apiAction]);

  const deleteExpense = useCallback(async (id: string) => {
    const expenseToDelete = expenses.find(e => e.id === id);
    if (!expenseToDelete) return;
    updateDailyData(getDateKey(expenseToDelete.createdAt), day => ({...day, expenses: day.expenses.filter(e => e.id !== id)}));
    await apiAction(`/expenses/${id}`, 'DELETE');
  }, [apiAction, expenses]);

  const addIncome = useCallback(async (amount: number, description: string, category: IncomeCategory) => {
    const dateKey = getDateKey(new Date());
    const newIncomeData = { amount, description, category, createdAt: new Date().toISOString() };
    const newIncome = await apiAction<Income>('/income', 'POST', newIncomeData);
    updateDailyData(dateKey, day => ({...day, income: [...day.income, newIncome]}));
  }, [apiAction]);
  
  const deleteIncome = useCallback(async (id: string) => {
    const incomeToDelete = income.find(i => i.id === id);
    if (!incomeToDelete) return;
    updateDailyData(getDateKey(incomeToDelete.createdAt), day => ({...day, income: day.income.filter(i => i.id !== id)}));
    await apiAction(`/income/${id}`, 'DELETE');
  }, [apiAction, income]);

  const addMoodLog = useCallback(async (mood: Mood) => {
    const dateKey = getDateKey(new Date());
    const existingLog = lifeData?.dailyData[dateKey]?.moodLog;
    if (existingLog) {
      const updatedLog = await apiAction<MoodLog>(`/mood-logs/${existingLog.id}`, 'PUT', { mood });
      updateDailyData(dateKey, day => ({...day, moodLog: updatedLog}));
    } else {
      const newLog = await apiAction<MoodLog>('/mood-logs', 'POST', { mood, createdAt: new Date().toISOString() });
      updateDailyData(dateKey, day => ({...day, moodLog: newLog}));
    }
  }, [apiAction, lifeData]);
  
  const saveJournalEntry = useCallback(async (text: string) => {
    const dateKey = getDateKey(new Date());
    const existingEntry = lifeData?.dailyData[dateKey]?.journalEntry;
    if (existingEntry) {
      const updatedEntry = await apiAction<JournalEntry>(`/journal-entries/${existingEntry.id}`, 'PUT', { text });
      updateDailyData(dateKey, day => ({...day, journalEntry: updatedEntry}));
    } else {
      if(!text.trim()) return;
      const newEntry = await apiAction<JournalEntry>('/journal-entries', 'POST', { text, createdAt: new Date().toISOString() });
      updateDailyData(dateKey, day => ({...day, journalEntry: newEntry}));
    }
  }, [apiAction, lifeData]);

  const addPhotoLog = useCallback(async (imageDataUrl: string, note?: string) => {
    const dateKey = getDateKey(new Date());
    const existingLog = lifeData?.dailyData[dateKey]?.photoLog;
    const logData = { imageDataUrl, note, createdAt: new Date().toISOString() };
    if(existingLog) {
        const updatedLog = await apiAction<PhotoLog>(`/photo-logs/${existingLog.id}`, 'PUT', logData);
        updateDailyData(dateKey, day => ({...day, photoLog: updatedLog}));
    } else {
        const newLog = await apiAction<PhotoLog>('/photo-logs', 'POST', logData);
        updateDailyData(dateKey, day => ({...day, photoLog: newLog}));
    }
  }, [apiAction, lifeData]);

  const deletePhotoLog = useCallback(async(id: string) => {
      const logToDelete = photoLogs.find(p => p.id === id);
      if (!logToDelete) return;
      updateDailyData(getDateKey(logToDelete.createdAt), day => ({...day, photoLog: undefined}));
      await apiAction(`/photo-logs/${id}`, 'DELETE');
  }, [apiAction, photoLogs]);

  const addTimeLog = useCallback(async (activity: string, minutes: number) => {
      const dateKey = getDateKey(new Date());
      const newLogData = { activity, minutes, createdAt: new Date().toISOString() };
      const newLog = await apiAction<TimeLog>('/time-logs', 'POST', newLogData);
      updateDailyData(dateKey, day => ({...day, timeLogs: [...day.timeLogs, newLog]}));
  }, [apiAction]);

  const deleteTimeLog = useCallback(async (id: string) => {
      const logToDelete = timeLogs.find(t => t.id === id);
      if (!logToDelete) return;
      updateDailyData(getDateKey(logToDelete.createdAt), day => ({...day, timeLogs: day.timeLogs.filter(t => t.id !== id)}));
      await apiAction(`/time-logs/${id}`, 'DELETE');
  }, [apiAction, timeLogs]);

  // --- Global Data Operations ---

  const addHabit = useCallback(async (name: string, description: string) => {
    const newHabit = await apiAction<Habit>('/habits', 'POST', { name, description, completions: [], createdAt: new Date().toISOString() });
    optimisticallyUpdate(prev => ({...prev, habits: [...prev.habits, newHabit]}));
  }, [apiAction]);
  
  const updateHabit = useCallback(async (id: string, name: string, description: string) => {
    const updatedHabitData = { name, description };
    const habitToUpdate = habits.find(h => h.id === id);
    optimisticallyUpdate(prev => ({...prev, habits: prev.habits.map(h => h.id === id ? {...h, ...updatedHabitData } : h)}));
    await apiAction<Habit>(`/habits/${id}`, 'PUT', updatedHabitData);
  }, [apiAction, habits]);
  
  const toggleHabitCompletionForToday = useCallback(async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const todayDateString = new Date().toDateString();
    const isCompletedToday = habit.completions.some(c => new Date(c).toDateString() === todayDateString);
    const newCompletions = isCompletedToday 
        ? habit.completions.filter(c => new Date(c).toDateString() !== todayDateString)
        : [...habit.completions, new Date().toISOString()];
    
    optimisticallyUpdate(prev => ({ ...prev, habits: prev.habits.map(h => h.id === habitId ? { ...h, completions: newCompletions } : h) }));
    await apiAction(`/habits/${habitId}`, 'PUT', { completions: newCompletions });
  }, [apiAction, habits]);

  const deleteHabit = useCallback(async (id: string) => {
    optimisticallyUpdate(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id)}));
    await apiAction(`/habits/${id}`, 'DELETE');
  }, [apiAction]);
  
  const addGoal = useCallback(async (title: string, description?: string, targetDate?: string) => {
    const newGoalData = { title, description, targetDate, milestones: [], createdAt: new Date().toISOString() };
    const newGoal = await apiAction<Goal>('/goals', 'POST', newGoalData);
    optimisticallyUpdate(prev => ({ ...prev, goals: [...prev.goals, newGoal] }));
  }, [apiAction]);

  const updateGoal = useCallback(async (goalId: string, title: string, description?: string, targetDate?: string) => {
      const updatedGoalData = { title, description, targetDate };
      optimisticallyUpdate(prev => ({...prev, goals: prev.goals.map(g => g.id === goalId ? {...g, ...updatedGoalData} : g)}));
      await apiAction<Goal>(`/goals/${goalId}`, 'PUT', updatedGoalData);
  }, [apiAction]);

  const deleteGoal = useCallback(async (goalId: string) => {
      optimisticallyUpdate(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== goalId)}));
      await apiAction(`/goals/${goalId}`, 'DELETE');
  }, [apiAction]);

  const addMilestone = useCallback(async (goalId: string, text: string) => {
      const newMilestone: Milestone = { id: crypto.randomUUID(), text, completed: false, createdAt: new Date().toISOString() };
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;
      const updatedMilestones = [...goal.milestones, newMilestone];
      optimisticallyUpdate(prev => ({...prev, goals: prev.goals.map(g => g.id === goalId ? {...g, milestones: updatedMilestones} : g)}));
      await apiAction(`/goals/${goalId}`, 'PUT', { milestones: updatedMilestones });
  }, [apiAction, goals]);

  const toggleMilestone = useCallback(async (goalId: string, milestoneId: string) => {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;
      const updatedMilestones = goal.milestones.map(m => m.id === milestoneId ? {...m, completed: !m.completed} : m);
      optimisticallyUpdate(prev => ({...prev, goals: prev.goals.map(g => g.id === goalId ? {...g, milestones: updatedMilestones} : g)}));
      await apiAction(`/goals/${goalId}`, 'PUT', { milestones: updatedMilestones });
  }, [apiAction, goals]);

  const deleteMilestone = useCallback(async (goalId: string, milestoneId: string) => {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;
      const updatedMilestones = goal.milestones.filter(m => m.id !== milestoneId);
      optimisticallyUpdate(prev => ({...prev, goals: prev.goals.map(g => g.id === goalId ? {...g, milestones: updatedMilestones} : g)}));
      await apiAction(`/goals/${goalId}`, 'PUT', { milestones: updatedMilestones });
  }, [apiAction, goals]);

  const addCredential = useCallback(async (credential: Omit<Credential, 'id'>) => {
    const newCredential = await apiAction<Credential>('/credentials', 'POST', credential);
    optimisticallyUpdate(prev => ({ ...prev, credentials: [...prev.credentials, newCredential] }));
  }, [apiAction]);

  const deleteCredential = useCallback(async (id: string) => {
    optimisticallyUpdate(prev => ({ ...prev, credentials: prev.credentials.filter(c => c.id !== id) }));
    await apiAction(`/credentials/${id}`, 'DELETE');
  }, [apiAction]);

  const saveWeeklyRoutine = useCallback(async (routine: WeeklyRoutine) => {
      const updatedRoutine = await apiAction<{weeklyRoutine: WeeklyRoutine}>('/routine', 'POST', { weeklyRoutine: routine });
      optimisticallyUpdate(prev => ({ ...prev, weeklyRoutine: updatedRoutine.weeklyRoutine }));
  }, [apiAction]);

  const addRoutineTask = useCallback((day: DayOfWeek, time: string, text: string) => {
    if (!lifeData) return;
    const newRoutineTask: RoutineTask = { id: crypto.randomUUID(), time, text };
    const newWeeklyRoutine = { ...lifeData.weeklyRoutine };
    newWeeklyRoutine[day] = [...(newWeeklyRoutine[day] || []), newRoutineTask].sort((a,b) => a.time.localeCompare(b.time));
    saveWeeklyRoutine(newWeeklyRoutine);
  }, [lifeData, saveWeeklyRoutine]);

  const updateRoutineTask = useCallback((day: DayOfWeek, taskId: string, time: string, text: string) => {
      if (!lifeData) return;
      const newWeeklyRoutine = { ...lifeData.weeklyRoutine };
      newWeeklyRoutine[day] = (newWeeklyRoutine[day] || []).map(t => t.id === taskId ? { ...t, time, text } : t).sort((a,b) => a.time.localeCompare(b.time));
      saveWeeklyRoutine(newWeeklyRoutine);
  }, [lifeData, saveWeeklyRoutine]);
  
  const deleteRoutineTask = useCallback((day: DayOfWeek, taskId: string) => {
      if (!lifeData) return;
      const newWeeklyRoutine = { ...lifeData.weeklyRoutine };
      newWeeklyRoutine[day] = (newWeeklyRoutine[day] || []).filter(t => t.id !== taskId);
      saveWeeklyRoutine(newWeeklyRoutine);
  }, [lifeData, saveWeeklyRoutine]);

  const applyRoutineForToday = useCallback(async () => {
    if (!lifeData) return 0;
    const todayDayName = DAYS_OF_WEEK[new Date().getDay()];
    const routineTasksForToday = lifeData.weeklyRoutine[todayDayName] || [];
    const now = new Date();

    const tasksToAdd = routineTasksForToday.filter(routineTask => {
        const [hours, minutes] = routineTask.time.split(':').map(Number);
        const taskTime = new Date();
        taskTime.setHours(hours, minutes, 0, 0);

        // Don't add tasks from the past today
        if (taskTime < now) return false;
        
        // Don't add if a task with the same text and due date already exists
        return !tasks.some(t => 
            t.text === routineTask.text && 
            getDateKey(t.dueDate) === getDateKey(taskTime)
        );
    });

    for (const routineTask of tasksToAdd) {
        const [hours, minutes] = routineTask.time.split(':').map(Number);
        const dueDate = new Date();
        dueDate.setHours(hours, minutes, 0, 0);
        await addTask(routineTask.text, dueDate.toISOString(), null);
    }
    return tasksToAdd.length;
  }, [lifeData, tasks, addTask]);

  const importData = useCallback(async (jsonString: string) => {
      const dataToImport = JSON.parse(jsonString);
      await apiAction('/import', 'POST', dataToImport);
  }, [apiAction]);


  return {
    lifeData,
    isLoading,
    error,
    refetchData: fetchData,
    tasks, expenses, income, moodLogs, habits, journalEntries, photoLogs, goals, timeLogs, credentials,
    addTask, toggleTask, deleteTask,
    addExpense, deleteExpense,
    addIncome, deleteIncome,
    addMoodLog,
    saveJournalEntry,
    addPhotoLog, deletePhotoLog,
    addTimeLog, deleteTimeLog,
    addHabit, updateHabit, toggleHabitCompletionForToday, deleteHabit,
    addGoal, updateGoal, deleteGoal,
    addMilestone, toggleMilestone, deleteMilestone,
    addCredential, deleteCredential,
    saveWeeklyRoutine, addRoutineTask, updateRoutineTask, deleteRoutineTask, applyRoutineForToday,
    importData,
  };
};
