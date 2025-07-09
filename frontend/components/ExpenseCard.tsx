import React, { useState } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { PlusIcon } from './icons';
import Card from './Card';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { EXPENSE_CATEGORY_COLORS } from '../constants';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ExpenseCardProps {
  expenses: Expense[];
  onAddExpense: (amount: number, description: string, category: ExpenseCategory) => void;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({ expenses, onAddExpense }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.Food);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      onAddExpense(numericAmount, description, category);
      setAmount('');
      setDescription('');
    }
  };
  
  const today = new Date().toDateString();
  const todaysExpenses = expenses.filter(e => new Date(e.createdAt).toDateString() === today);
  const totalToday = todaysExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const categoryTotals = todaysExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  const chartData = {
    labels: Object.keys(categoryTotals),
    datasets: [{
      data: Object.values(categoryTotals),
      backgroundColor: Object.keys(categoryTotals).map(cat => EXPENSE_CATEGORY_COLORS[cat as ExpenseCategory]),
      borderColor: '#1f2937', // dark-card bg for separation, works on light too
      borderWidth: 2,
    }]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
       tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += `PKR ${context.parsed.toFixed(0)}`;
            }
            return label;
          }
        }
      }
    }
  };

  return (
    <Card title="Today's Expenses" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}>
      <div className="flex-grow">
          {todaysExpenses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              <div className="relative h-32 md:h-40">
                <Doughnut data={chartData} options={chartOptions} />
              </div>
            </div>
           ) : (
            <p className="text-gray-500 dark:text-dark-text-secondary text-center py-8">No expenses logged today.</p>
           )}
      </div>

       <div className="text-right font-bold text-lg text-gray-800 dark:text-dark-text-primary py-2 border-t border-b border-gray-200 dark:border-dark-border my-4">
        Total: PKR {totalToday.toFixed(0)}
       </div>
      <form onSubmit={handleSubmit} className="mt-auto grid grid-cols-2 gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          min="1"
          step="1"
          className="col-span-1 bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
          required
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          className="col-span-1 bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
        >
          {Object.values(ExpenseCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="col-span-2 bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
          required
        />
        <button type="submit" className="col-span-2 p-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex justify-center items-center gap-2">
          <PlusIcon /> Add Expense
        </button>
      </form>
    </Card>
  );
};

export default ExpenseCard;