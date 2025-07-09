import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory, Income, IncomeCategory } from '../types';
import Card from './Card';
import { PlusIcon, TrashIcon, CurrencyDollarIcon, ArrowUpCircleIcon, ArrowDownCircleIcon } from './icons';

interface FinanceCardProps {
    expenses: Expense[];
    income: Income[];
    onAddExpense: (amount: number, description: string, category: ExpenseCategory) => void;
    onDeleteExpense: (id: string) => void;
    onAddIncome: (amount: number, description: string, category: IncomeCategory) => void;
    onDeleteIncome: (id: string) => void;
}

type Transaction = (Expense & { type: 'expense' }) | (Income & { type: 'income' });

const TransactionItem: React.FC<{ transaction: Transaction; onDelete: (id: string, type: 'expense' | 'income') => void }> = ({ transaction, onDelete }) => {
    const isExpense = transaction.type === 'expense';
    return (
        <div className="flex items-center justify-between py-2.5 group border-b border-gray-200 dark:border-dark-border last:border-b-0">
            <div className="flex items-center min-w-0">
                <span className={`mr-3 ${isExpense ? 'text-red-500' : 'text-green-500'}`}>
                    {isExpense ? <ArrowDownCircleIcon /> : <ArrowUpCircleIcon />}
                </span>
                <div className="min-w-0">
                    <p className="font-medium text-gray-800 dark:text-dark-text-primary truncate">{transaction.description}</p>
                    <p className="text-sm text-gray-500 dark:text-dark-text-secondary">{transaction.category}</p>
                </div>
            </div>
            <div className="flex items-center flex-shrink-0">
                <span className={`font-semibold ${isExpense ? 'text-red-500' : 'text-green-500'}`}>
                    {isExpense ? '-' : '+'}PKR {transaction.amount.toFixed(0)}
                </span>
                 <button onClick={() => onDelete(transaction.id, transaction.type)} className="text-gray-400 dark:text-dark-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <TrashIcon />
                </button>
            </div>
        </div>
    );
};

const FinanceCard: React.FC<FinanceCardProps> = ({ expenses, income, onAddExpense, onDeleteExpense, onAddIncome, onDeleteIncome }) => {
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<ExpenseCategory | IncomeCategory>(ExpenseCategory.Food);

    const { totalIncome, totalExpenses, netBalance, recentTransactions } = useMemo(() => {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const monthlyExpenses = expenses.filter(e => new Date(e.createdAt) >= monthStart);
        const monthlyIncome = income.filter(i => new Date(i.createdAt) >= monthStart);

        const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalIncome = monthlyIncome.reduce((sum, i) => sum + i.amount, 0);

        const allTransactions: Transaction[] = [
            ...monthlyExpenses.map(e => ({...e, type: 'expense' as const})),
            ...monthlyIncome.map(i => ({...i, type: 'income' as const})),
        ];

        allTransactions.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return {
            totalIncome,
            totalExpenses,
            netBalance: totalIncome - totalExpenses,
            recentTransactions: allTransactions.slice(0, 10), // Show last 10
        };

    }, [expenses, income]);
    
    const spendPercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
    
    const handleTabChange = (tab: 'expense' | 'income') => {
        setActiveTab(tab);
        setAmount('');
        setDescription('');
        setCategory(tab === 'expense' ? ExpenseCategory.Food : IncomeCategory.Salary);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0 || !description.trim()) return;

        if (activeTab === 'expense') {
            onAddExpense(numericAmount, description, category as ExpenseCategory);
        } else {
            onAddIncome(numericAmount, description, category as IncomeCategory);
        }
        setAmount('');
        setDescription('');
    }

    const categoryOptions = activeTab === 'expense' ? Object.values(ExpenseCategory) : Object.values(IncomeCategory);

    return (
        <Card title="Monthly Finances" icon={<CurrencyDollarIcon />}>
            <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-green-500 font-medium">Income</span>
                    <span className="font-semibold text-gray-800 dark:text-dark-text-primary">PKR {totalIncome.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-red-500 font-medium">Expenses</span>
                    <span className="font-semibold text-gray-800 dark:text-dark-text-primary">PKR {totalExpenses.toFixed(0)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${Math.min(spendPercentage, 100)}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-200 dark:border-dark-border">
                    <span className="text-gray-800 dark:text-dark-text-primary">Net Balance</span>
                    <span className={netBalance >= 0 ? 'text-green-500' : 'text-red-500'}>PKR {netBalance.toFixed(0)}</span>
                </div>
            </div>
            
            <div className="mt-auto space-y-4">
                 {/* Transaction List */}
                <div>
                    <h4 className="font-semibold text-gray-600 dark:text-dark-text-secondary mb-1">Recent Transactions</h4>
                    <div className="overflow-y-auto pr-2 -mr-2" style={{maxHeight: '150px'}}>
                        {recentTransactions.length > 0 ? recentTransactions.map(t => (
                            <TransactionItem key={t.id} transaction={t} onDelete={t.type === 'expense' ? onDeleteExpense : onDeleteIncome} />
                        )) : <p className="text-gray-500 dark:text-dark-text-secondary text-center py-2 text-sm">No transactions this month.</p>}
                    </div>
                </div>
                
                {/* Form Section */}
                <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                    <div className="flex border-b border-gray-200 dark:border-dark-border mb-3">
                        <button onClick={() => handleTabChange('expense')} className={`flex-1 py-2 text-center font-medium text-sm ${activeTab === 'expense' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 dark:text-dark-text-secondary'}`}>Add Expense</button>
                        <button onClick={() => handleTabChange('income')} className={`flex-1 py-2 text-center font-medium text-sm ${activeTab === 'income' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 dark:text-dark-text-secondary'}`}>Add Income</button>
                    </div>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" min="0" step="1" className="w-full bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" required />
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none" required />
                        <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none">
                            {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <button type="submit" className="w-full p-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50 flex items-center justify-center gap-2" disabled={!amount || !description}>
                            <PlusIcon /> {activeTab === 'expense' ? 'Add Expense' : 'Add Income'}
                        </button>
                    </form>
                </div>
            </div>
        </Card>
    );
};

export default FinanceCard;