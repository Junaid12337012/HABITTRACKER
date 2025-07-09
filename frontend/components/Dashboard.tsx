

import React from 'react';
import TaskCard from './TaskCard';
import MoodCard from './MoodCard';
import SummaryCard from './SummaryCard';
import HabitTrackerCard from './HabitTrackerCard';
import RoutineBuilderCard from './RoutineBuilderCard';
import JournalCard from './JournalCard';
import GoalPlannerCard from './GoalPlannerCard';
import FinanceCard from './FinanceCard';
import TimeTrackerCard from './TimeTrackerCard';
import PhotoJournalCard from './PhotoJournalCard';
import PasswordVaultCard from './PasswordVaultCard';
import { useLifeData } from '../hooks/useLifeData';
import { useAuth } from '../App';

type DashboardProps = ReturnType<typeof useLifeData> & {
    showToast: (message: string) => void;
    logout: () => void;
};

const Dashboard: React.FC<DashboardProps> = (props) => {
  const { 
    // Data arrays
    tasks, expenses, income, moodLogs, habits, journalEntries, photoLogs, goals, timeLogs, credentials,
    // Data objects
    lifeData,
    // Actions
    addTask, toggleTask, deleteTask, 
    addExpense, deleteExpense,
    addIncome, deleteIncome,
    addMoodLog, 
    addHabit, updateHabit, toggleHabitCompletionForToday, deleteHabit, 
    addRoutineTask, updateRoutineTask, deleteRoutineTask, applyRoutineForToday, 
    saveJournalEntry,
    addPhotoLog, deletePhotoLog,
    addGoal, updateGoal, deleteGoal, addMilestone, toggleMilestone, deleteMilestone,
    addTimeLog, deleteTimeLog,
    addCredential, deleteCredential,
    // UI
    showToast,
    logout,
  } = props;
  
  if (!lifeData) {
      return null; // or a loading state
  }

  return (
        <main className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Planning */}
            <div className="space-y-6">
              <TaskCard 
                tasks={tasks} 
                onAddTask={addTask} 
                onToggleTask={toggleTask} 
                onDeleteTask={deleteTask} 
              />
              <FinanceCard
                expenses={expenses}
                income={income}
                onAddExpense={addExpense}
                onDeleteExpense={deleteExpense}
                onAddIncome={addIncome}
                onDeleteIncome={deleteIncome}
              />
            </div>
            {/* Column 2: Tracking */}
            <div className="space-y-6">
              <HabitTrackerCard
                habits={habits}
                onAddHabit={addHabit}
                onUpdateHabit={updateHabit}
                onToggleHabit={toggleHabitCompletionForToday}
                onDeleteHabit={deleteHabit}
              />
              <GoalPlannerCard
                goals={goals}
                onAddGoal={addGoal}
                onUpdateGoal={updateGoal}
                onDeleteGoal={deleteGoal}
                onAddMilestone={addMilestone}
                onToggleMilestone={toggleMilestone}
                onDeleteMilestone={deleteMilestone}
              />
               <TimeTrackerCard 
                timeLogs={timeLogs}
                onAddTimeLog={addTimeLog}
                onDeleteTimeLog={deleteTimeLog}
              />
            </div>
            {/* Column 3: Reflection */}
            <div className="space-y-6">
              <MoodCard
                moodLogs={moodLogs}
                onAddMoodLog={addMoodLog}
              />
              <PhotoJournalCard 
                photoLogs={photoLogs}
                onAddPhotoLog={addPhotoLog}
                onDeletePhotoLog={deletePhotoLog}
              />
              <JournalCard
                journalEntries={journalEntries}
                onSaveEntry={saveJournalEntry}
              />
              <SummaryCard lifeData={lifeData} />
            </div>
          </div>
           {/* Full-width section for larger, less-frequent components */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PasswordVaultCard
                credentials={credentials}
                onLogout={logout}
                onAddCredential={addCredential}
                onDeleteCredential={deleteCredential}
                showToast={showToast}
              />
              <RoutineBuilderCard
                weeklyRoutine={lifeData.weeklyRoutine}
                onAddTask={addRoutineTask}
                onUpdateTask={updateRoutineTask}
                onDeleteTask={deleteRoutineTask}
                onApplyRoutine={applyRoutineForToday}
                showToast={showToast}
              />
          </div>
        </main>
  );
};

export default Dashboard;
