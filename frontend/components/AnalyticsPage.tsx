import React, { useMemo, useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import Card from './Card';
import { useLifeData } from '../hooks/useLifeData';
import { EXPENSE_CATEGORY_COLORS } from '../constants';
import { Mood, DailyData } from '../types';
import { SparklesIcon, ClockIcon, DownloadIcon, BanknotesIcon, ArrowTrendingUpIcon, FaceSmileIcon, TrophyIcon, ArrowPathIcon } from './icons';
import { generatePeriodicReport } from '../services/geminiService';
import { generatePdfReport } from '../services/exportService';
import { useAuth } from '../App';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type AnalyticsPageProps = ReturnType<typeof useLifeData>;
type Period = 'week' | 'month' | 'year';

const moodToValue = (mood: Mood): number => {
  switch (mood) {
    case Mood.Amazing: return 5;
    case Mood.Good: return 4;
    case Mood.Okay: return 3;
    case Mood.Bad: return 2;
    case Mood.Awful: return 1;
    default: return 0;
  }
};
const valueToMood = (value: number): string => {
  const roundedValue = Math.round(value);
  return {1:'Awful', 2:'Bad', 3:'Okay', 4:'Good', 5:'Amazing'}[roundedValue] || 'N/A';
};

const ReportRenderer: React.FC<{ content: string }> = ({ content }) => {
    const sections = content.split('### ').filter(s => s.trim() !== '');

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
            {sections.map((section, index) => {
                const lines = section.split('\n').filter(l => l.trim() !== '');
                const title = lines.shift() || `Section ${index + 1}`;
                return (
                    <div key={index} className="mb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text-primary mt-4 mb-2">{title}</h3>
                        {lines.map((paragraph, pIndex) => (
                            <p key={pIndex}>{paragraph}</p>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};


const StatCard: React.FC<{title: string, value: string, icon: React.ReactNode, subtext?: string}> = ({title, value, icon, subtext}) => (
    <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-lg p-4 flex items-center gap-4">
        <div className="bg-brand-primary/10 text-brand-primary p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary">{title}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">{value}</p>
            {subtext && <p className="text-xs text-gray-400 dark:text-dark-text-secondary">{subtext}</p>}
        </div>
    </div>
);


const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ lifeData, habits, goals }) => {
    const [report, setReport] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [period, setPeriod] = useState<Period>('month');
    const { token } = useAuth();
    
    const moodChartRef = useRef<ChartJS<'line'>>(null);
    const expenseChartRef = useRef<ChartJS<'doughnut'>>(null);
    const timeChartRef = useRef<ChartJS<'bar'>>(null);
    const habitChartRef = useRef<ChartJS<'bar'>>(null);

    const { startDate, endDate, dateLabelFormat } = useMemo(() => {
        const today = new Date();
        const end = new Date(today);
        let start = new Date(today);
        let format: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

        switch (period) {
            case 'week':
                start.setDate(today.getDate() - today.getDay());
                break;
            case 'month':
                start.setDate(1);
                break;
            case 'year':
                start.setMonth(0, 1);
                format = { month: 'short' };
                break;
        }
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { startDate: start, endDate: end, dateLabelFormat: format };
    }, [period]);
    
    const periodData = useMemo(() => {
        if (!lifeData) return null;
        const periodDailyData = Object.entries(lifeData.dailyData)
            .filter(([dateKey]) => {
                const itemDate = new Date(dateKey);
                return itemDate >= startDate && itemDate <= endDate;
            })
            .map(([, dailyData]) => dailyData);

        const moodLogs = periodDailyData.map(d => d.moodLog).filter(Boolean);
        const expenses = periodDailyData.flatMap(d => d.expenses);
        const income = periodDailyData.flatMap(d => d.income);
        const timeLogs = periodDailyData.flatMap(d => d.timeLogs);
        
        const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const netBalance = totalIncome - totalExpenses;
        
        const totalTime = timeLogs.reduce((sum, t) => sum + t.minutes, 0);

        const habitConsistency = habits.map(habit => {
            const daysInRange = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
            const completionsInRange = new Set(
                habit.completions.filter(c => new Date(c) >= startDate && new Date(c) <= endDate).map(c => new Date(c).toDateString())
            ).size;
            return {
                name: habit.name,
                consistency: Math.round((completionsInRange / daysInRange) * 100),
            };
        }).sort((a,b) => b.consistency - a.consistency);

        const topHabit = habitConsistency.length > 0 ? habitConsistency[0] : { name: 'N/A', consistency: 0};

        const averageMoodValue = moodLogs.length > 0 ? moodLogs.reduce((sum, log) => sum + moodToValue(log!.mood), 0) / moodLogs.length : 0;
        
        const expenseByCategory = expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {} as Record<string, number>);

        const timeByActivity = timeLogs.reduce((acc, log) => {
            acc[log.activity] = (acc[log.activity] || 0) + log.minutes;
            return acc;
        }, {} as Record<string, number>);

        const goalProgress = goals.map(g => {
            const completedMilestones = g.milestones.filter(m => m.completed).length;
            const totalMilestones = g.milestones.length;
            return {
                title: g.title,
                progress: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
            };
        });

        return { moodLogs, expenses, income, timeLogs, habitConsistency, expenseByCategory, timeByActivity, goalProgress, totalIncome, totalExpenses, netBalance, totalTime, topHabit, averageMoodValue };
    }, [lifeData, startDate, endDate, habits, goals]);

    const chartData = useMemo(() => {
        if (!periodData) return null;
        return {
        moodChart: {
            labels: periodData.moodLogs.map(log => new Date(log!.createdAt).toLocaleDateString('en-CA', dateLabelFormat)),
            datasets: [{ label: 'Mood Trend', data: periodData.moodLogs.map(log => moodToValue(log!.mood)), borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: true, tension: 0.3 }]
        },
        expenseChart: {
            labels: Object.keys(periodData.expenseByCategory),
            datasets: [{ data: Object.values(periodData.expenseByCategory), backgroundColor: Object.keys(periodData.expenseByCategory).map(cat => EXPENSE_CATEGORY_COLORS[cat as keyof typeof EXPENSE_CATEGORY_COLORS] || '#9ca3af'), borderColor: '#1f2937' }]
        },
        timeChart: {
            labels: Object.keys(periodData.timeByActivity),
            datasets: [{ label: 'Minutes', data: Object.values(periodData.timeByActivity), backgroundColor: '#fb923c' }]
        },
        habitChart: {
            labels: periodData.habitConsistency.map(h => h.name),
            datasets: [{ label: 'Consistency', data: periodData.habitConsistency.map(h => h.consistency), backgroundColor: '#34d399' }]
        }
    }}, [periodData, dateLabelFormat]);

    const keyMetrics = {
        'Net Balance': `PKR ${periodData?.netBalance.toFixed(0) || 0}`,
        'Average Mood': valueToMood(periodData?.averageMoodValue || 0),
        'Top Habit': `${periodData?.topHabit.name || 'N/A'} (${periodData?.topHabit.consistency || 0}%)`,
        'Total Time Tracked': formatDuration(periodData?.totalTime || 0),
    };

    const handleGenerateReport = async () => {
        if (!lifeData || !periodData) return;
        setIsLoading(true);
        setReport('');
        const result = await generatePeriodicReport(lifeData, startDate, endDate, periodData, keyMetrics, token);
        setReport(result);
        setIsLoading(false);
    };

    const handleExport = async () => {
        if (!lifeData || !periodData) return;
        setIsExporting(true);
        const aiSummary = report || await generatePeriodicReport(lifeData, startDate, endDate, periodData, keyMetrics, token);
        if(!report) setReport(aiSummary);

        const charts = {
            mood: moodChartRef.current,
            expense: expenseChartRef.current,
            time: timeChartRef.current,
            habit: habitChartRef.current,
        };
        await generatePdfReport(periodData, aiSummary, charts, keyMetrics, periodData.goalProgress, period);
        setIsExporting(false);
    };
    
    if (!lifeData || !periodData || !chartData) {
        return <p>Loading analytics...</p>;
    }

    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false, labels: { color: '#9ca3af' }}}, scales: { y: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' }}, x: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' }}}};
    const doughnutOptions = {...chartOptions, scales: {}};

    return (
        <main className="space-y-6">
             <div className="lg:col-span-4 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-dark-text-primary">Analytics & Reports</h3>
                    <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Filter data by period and generate AI summaries or PDF reports.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                     <div className="flex space-x-1 bg-gray-100 dark:bg-dark-bg p-1 rounded-lg">
                        {(['week', 'month', 'year'] as Period[]).map(p => (
                            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${period === p ? 'bg-brand-primary text-white shadow' : 'text-gray-600 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{p}</button>
                        ))}
                    </div>
                    <button onClick={handleExport} disabled={isExporting} className="p-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center">
                        <DownloadIcon /> <span className="text-sm font-medium">{isExporting ? 'Exporting...' : 'Generate PDF'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Net Balance" value={keyMetrics['Net Balance']} icon={<BanknotesIcon />} subtext={`PKR ${periodData.totalIncome.toFixed(0)} in / PKR ${periodData.totalExpenses.toFixed(0)} out`} />
                <StatCard title="Top Habit" value={periodData.topHabit.name} icon={<ArrowTrendingUpIcon />} subtext={`${periodData.topHabit.consistency}% consistency`} />
                <StatCard title="Average Mood" value={keyMetrics['Average Mood']} icon={<FaceSmileIcon />} />
                <StatCard title="Total Time Tracked" value={keyMetrics['Total Time Tracked']} icon={<ClockIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card title="AI Analytics Report" icon={<SparklesIcon />} className="h-full">
                         <div className="flex-grow text-gray-600 dark:text-dark-text-secondary leading-relaxed overflow-y-auto pr-2" style={{minHeight: '200px'}}>
                            {isLoading && <p className="flex items-center justify-center gap-2"><ArrowPathIcon className="h-5 w-5 animate-spin" /> Analyzing your data for this period...</p>}
                            {!isLoading && !report && <p>Click the button below to generate a detailed AI report on your trends for the selected period.</p>}
                            {report && !isLoading && <ReportRenderer content={report} />}
                        </div>
                        <button onClick={handleGenerateReport} disabled={isLoading} className="mt-auto w-full p-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-opacity">
                          {isLoading ? (
                            <>
                                <ArrowPathIcon className="h-5 w-5 animate-spin" /> Generating Report...
                            </>
                          ) : (
                            <>
                                <SparklesIcon /> {`Generate ${period.charAt(0).toUpperCase() + period.slice(1)} Report`}
                            </>
                          )}
                        </button>
                    </Card>
                    <Card title="Goal Progress" icon={<TrophyIcon />}>
                         <div className="space-y-4">
                             {periodData.goalProgress.length > 0 ? periodData.goalProgress.map(g => (
                                 <div key={g.title}>
                                     <div className="flex justify-between mb-1">
                                         <span className="text-base font-medium text-gray-800 dark:text-dark-text-primary">{g.title}</span>
                                         <span className="text-sm font-medium text-brand-primary">{g.progress}%</span>
                                     </div>
                                     <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                         <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${g.progress}%` }}></div>
                                     </div>
                                 </div>
                             )) : <p className="text-gray-500 dark:text-dark-text-secondary text-center py-4">No goals are being tracked.</p>}
                         </div>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                     <Card title="Time Allocation" icon={<ClockIcon />}>
                        <div className="relative h-64">
                            {Object.keys(periodData.timeByActivity).length > 0 ? <Bar ref={timeChartRef} data={chartData.timeChart} options={{...chartOptions, indexAxis: 'y', plugins: {...chartOptions.plugins, tooltip: { callbacks: { label: (c) => `${c.label}: ${formatDuration(c.parsed.x)}`}}}}} /> : <p className="text-gray-500 dark:text-dark-text-secondary text-center flex-grow flex items-center justify-center">No time logged.</p>}
                        </div>
                    </Card>
                    <Card title="Expense Breakdown" icon={<BanknotesIcon />}>
                         <div className="relative h-64">
                             {Object.keys(periodData.expenseByCategory).length > 0 ? <Doughnut ref={expenseChartRef} data={chartData.expenseChart} options={{...doughnutOptions, plugins: {...doughnutOptions.plugins, tooltip: { callbacks: { label: (c) => `${c.label}: PKR ${c.parsed.toFixed(0)}` } }}}} /> : <p className="text-gray-500 dark:text-dark-text-secondary text-center flex-grow flex items-center justify-center">No expenses.</p>}
                        </div>
                    </Card>
                </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Mood Trend" icon={<FaceSmileIcon />}>
                    <div className="relative h-64">
                        {periodData.moodLogs.length > 0 ? <Line ref={moodChartRef} data={chartData.moodChart} options={{...chartOptions, scales: {...chartOptions.scales, y: {...chartOptions.scales.y, min:1, max: 5, ticks: { ...chartOptions.scales.y.ticks, stepSize: 1, callback: (v) => ({1:'Awful', 2:'Bad', 3:'Okay', 4:'Good', 5:'Amazing'}[v as number] || '')}}}}}/> : <p className="text-gray-500 dark:text-dark-text-secondary text-center flex-grow flex items-center justify-center">No mood data.</p>}
                    </div>
                </Card>

                 <Card title="Habit Consistency" icon={<ArrowTrendingUpIcon />}>
                     <div className="relative h-64">
                         {periodData.habitConsistency.length > 0 ? <Bar ref={habitChartRef} data={chartData.habitChart} options={{...chartOptions, scales: {...chartOptions.scales, y: {...chartOptions.scales.y, min: 0, max: 100, ticks: {...chartOptions.scales.y.ticks, callback: (v) => `${v}%`}}}}} /> : <p className="text-gray-500 dark:text-dark-text-secondary text-center flex-grow flex items-center justify-center">No habits tracked.</p>}
                    </div>
                </Card>
             </div>
        </main>
    )
}

const formatDuration = (totalMinutes: number) => {
    if(!totalMinutes || totalMinutes < 1) return "0m";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if(hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if(hours > 0) return `${hours}h`;
    return `${minutes}m`;
}


export default AnalyticsPage;