import React from 'react';
import { Mood, ExpenseCategory, DayOfWeek } from './types';
import { MoodAmazingIcon, MoodGoodIcon, MoodOkayIcon, MoodBadIcon, MoodAwfulIcon } from './components/icons';

export const MOOD_OPTIONS: { mood: Mood; icon: React.ReactNode; color: string }[] = [
  { mood: Mood.Amazing, icon: <MoodAmazingIcon />, color: 'text-green-400' },
  { mood: Mood.Good, icon: <MoodGoodIcon />, color: 'text-lime-400' },
  { mood: Mood.Okay, icon: <MoodOkayIcon />, color: 'text-yellow-400' },
  { mood: Mood.Bad, icon: <MoodBadIcon />, color: 'text-orange-400' },
  { mood: Mood.Awful, icon: <MoodAwfulIcon />, color: 'text-red-400' },
];

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.Food]: '#f87171', // red-400
  [ExpenseCategory.Transport]: '#60a5fa', // blue-400
  [ExpenseCategory.Shopping]: '#fb923c', // orange-400
  [ExpenseCategory.Entertainment]: '#a78bfa', // violet-400
  [ExpenseCategory.Health]: '#4ade80', // green-400
  [ExpenseCategory.Utilities]: '#2dd4bf', // teal-400
  [ExpenseCategory.Investment]: '#34d399', // emerald-400
  [ExpenseCategory.JunkFood]: '#f472b6', // pink-400
  [ExpenseCategory.Other]: '#9ca3af', // gray-400
};

export const DAYS_OF_WEEK: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];