


import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

// The module augmentation for 'jspdf' was causing errors in the build environment.
// It has been removed. Calls to the `autoTable` plugin now use a type assertion `(doc as any)`
// to bypass TypeScript's type checking for this dynamic property.

const captureChartAsImage = async (chart: any | null): Promise<string | null> => {
    if (!chart?.canvas) return null;
    try {
        const canvas = await html2canvas(chart.canvas, { backgroundColor: '#1f2937' }); // Use dark card color for bg
        return canvas.toDataURL('image/png', 1.0);
    } catch (error) {
        console.error("html2canvas failed:", error);
        return null;
    }
};

export const generatePdfReport = async (
    periodData: any,
    aiSummary: string,
    charts: { mood: any; expense: any; time: any, habit: any },
    keyMetrics: any,
    goalProgress: any[],
    period: string
) => {
    const doc = new jsPDF();
    const today = new Date();
    const periodTitle = period.charAt(0).toUpperCase() + period.slice(1);
    
    // --- Title Page ---
    doc.setFontSize(22);
    doc.setTextColor('#4f46e5');
    doc.text('Momentum AI Analytics Report', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text(`${periodTitle} Summary`, 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Report Generated on: ${today.toLocaleDateString()}`, 105, 40, { align: 'center' });
    doc.setDrawColor('#4f46e5');
    doc.line(20, 45, 190, 45);

    // --- Key Metrics & Goal Progress ---
    doc.setFontSize(16);
    doc.setTextColor('#4f46e5');
    doc.text('Key Metrics', 20, 60);
    (doc as any).autoTable({
        startY: 65,
        head: [['Metric', 'Value']],
        body: Object.entries(keyMetrics),
        theme: 'striped',
        headStyles: { fillColor: '#4f46e5' }
    });

    if (goalProgress.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor('#4f46e5');
        const goalsY = (doc as any).autoTable.previous.finalY + 15;
        doc.text('Goal Progress', 20, goalsY);
        (doc as any).autoTable({
            startY: goalsY + 5,
            head: [['Goal', 'Progress']],
            body: goalProgress.map(g => [g.title, `${g.progress}%`]),
            theme: 'striped',
            headStyles: { fillColor: '#4f46e5' }
        });
    }

    // --- AI Summary ---
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor('#4f46e5');
    doc.text('AI-Powered Insights', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(40);
    const summaryLines = doc.splitTextToSize(aiSummary.replace(/### (.*?)\n/g, '**$1**\n').replace(/\n/g, ' '), 170);
    doc.text(summaryLines, 20, 30);


    // --- Charts ---
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor('#4f46e5');
    doc.text('Data Visualization', 105, 20, { align: 'center' });
    
    const moodImg = await captureChartAsImage(charts.mood);
    if (moodImg) {
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text('Mood Trend', 20, 35);
        doc.addImage(moodImg, 'PNG', 20, 40, 170, 80);
    }
    
    const habitImg = await captureChartAsImage(charts.habit);
    if(habitImg) {
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text('Habit Consistency', 20, 135);
        doc.addImage(habitImg, 'PNG', 20, 140, 170, 80);
    }
    
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor('#4f46e5');
    doc.text('Financial & Time Analysis', 105, 20, { align: 'center' });

    const expenseImg = await captureChartAsImage(charts.expense);
    if (expenseImg) {
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text('Expense Breakdown', 20, 35);
        doc.addImage(expenseImg, 'PNG', 20, 40, 80, 80);
    }

    const timeImg = await captureChartAsImage(charts.time);
    if (timeImg) {
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text('Time Allocation', 110, 35);
        doc.addImage(timeImg, 'PNG', 110, 40, 80, 80);
    }

    // --- Data Tables ---
    if (periodData.expenses.length > 0) {
        doc.addPage();
        doc.setFontSize(18);
        doc.setTextColor('#4f46e5');
        doc.text('Detailed Expense Log', 105, 20, { align: 'center' });
        (doc as any).autoTable({
            startY: 30,
            head: [['Date', 'Category', 'Description', 'Amount (PKR)']],
            body: periodData.expenses.map((e: any) => [
                new Date(e.createdAt).toLocaleDateString(),
                e.category,
                e.description,
                e.amount.toFixed(0)
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: '#4f46e5' }
        });
    }

    if (periodData.timeLogs.length > 0) {
        if(periodData.expenses.length === 0) doc.addPage();
        const previousTable = (doc as any).autoTable.previous;
        const textY = periodData.expenses.length > 0 && previousTable ? previousTable.finalY + 20 : 20;

        doc.setFontSize(18);
        doc.setTextColor('#4f46e5');
        doc.text('Detailed Time Log', 105, textY, { align: 'center' });
        (doc as any).autoTable({
            startY: textY + 10,
            head: [['Date', 'Activity', 'Duration (minutes)']],
            body: periodData.timeLogs.map((t: any) => [
                new Date(t.createdAt).toLocaleDateString(),
                t.activity,
                t.minutes
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: '#4f46e5' }
        });
    }

    doc.save(`MomentumAI_Report_${period}_${today.toISOString().split('T')[0]}.pdf`);
};