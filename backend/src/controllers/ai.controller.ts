
// @ts-nocheck
import { Request, Response } from 'express';
import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
// @ts-nocheck
// Types imported from frontend are not needed for runtime. We disable type checking to avoid build errors.
const DAYS_OF_WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  console.warn("GEMINI_API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Helper Functions (copied from original frontend service) ---

const generateDailySummaryPrompt = (
    todayData: DailyData | undefined, 
    upcomingTasks: Task[], 
    habits: Habit[],
    goals: Goal[],
    monthlyFinance: { totalIncome: number, totalExpenses: number, netBalance: number }
): string => {
  const today = new Date();
  const todaysHabitsStatus = habits.map(h => ({
      name: h.name,
      description: h.description,
      completed: h.completions.some(c => new Date(c).toDateString() === today.toDateString())
  }));
  
  const activeGoals = goals.map(g => {
    const completedMilestones = g.milestones.filter(m => m.completed).length;
    const totalMilestones = g.milestones.length;
    const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    return `${g.title} (${progress}% complete)`;
  }).join('; ') || 'No goals set';


  let prompt = `
You are a compassionate and insightful personal AI assistant called Momentum AI. 
Your goal is to provide a brief, reflective, and encouraging end-of-day summary based on the user's logged data. 
Analyze the provided data for today and generate a summary in 3-4 short, easy-to-read paragraphs.
Use a friendly and supportive tone. Do not use markdown formatting, just plain text paragraphs. The currency is PKR.

IMPORTANT: The user has written a journal entry and possibly added a photo with a note. These are the most important pieces of data. Base your reflection primarily on their written thoughts, using the other data points as context. If there is no journal, focus on mood, tasks, and habits.

Today's Data:
- Journal Entry: ${todayData?.journalEntry?.text || 'Not written yet.'}
- Photo Journal Note: ${todayData?.photoLog?.note || 'No photo note.'}
- Mood: ${todayData?.moodLog?.mood || 'Not logged'}
- Completed Tasks Today: ${todayData?.tasks?.filter(t => t.completed).map(t => t.text).join(', ') || 'None'}
- Pending Tasks Today: ${todayData?.tasks?.filter(t => !t.completed).map(t => t.text).join(', ') || 'None'}
- Upcoming Tasks (Next few): ${upcomingTasks.slice(0, 5).map(t => t.text).join(', ') || 'None'}
- Habits Status: ${todaysHabitsStatus.map(h => `${h.name}${h.description ? ` (${h.description})` : ''} (${h.completed ? 'Done' : 'Pending'})`).join('; ') || 'No habits tracked'}
- This Month's Finances: Total Income: PKR ${monthlyFinance.totalIncome.toFixed(0)}, Total Expenses: PKR ${monthlyFinance.totalExpenses.toFixed(0)}, Net Balance: PKR ${monthlyFinance.netBalance.toFixed(0)}
- Active Goals: ${activeGoals}

Based on this data, provide a reflection covering:
1. Start by directly addressing the user's journal entry and photo note. Connect their feelings and events described there with their logged mood.
2. Weave in their task accomplishments and completed habits. If any of these align with their active goals, mention it as positive progress.
3. Offer gentle encouragement about pending tasks or habits, linking back to their journal entry or their larger goals if possible.
4. Briefly comment on their financial situation (income vs. expenses in PKR) if it seems relevant to their journaled thoughts or goals.
5. End with a positive and forward-looking statement for tomorrow, inspired by their journal and goals.
`;
  return prompt.trim();
};


const generatePeriodicReportPrompt = (data: {
    period: string,
    keyMetrics: any,
    moodData: any,
    habitData: any,
    financialData: any,
    timeData: any,
    goalData: any
}): string => {
    
    return `
You are an expert data analyst and personal coach AI for a life dashboard app.
Your tone is insightful, encouraging, and data-driven. The currency is PKR.
Analyze the user's data for the specified period and provide a clear, insightful, and actionable report.
The user wants a well-structured report. Use simple markdown for formatting. 
- Use '### ' for section headings.
- Use a single newline for paragraphs.
- Do not use any other markdown.

Here are the required sections:
### 📈 Overall Summary
Provide a brief, high-level overview of the user's period based on the key metrics. What was the general trend?

### 😊 Mood & Well-being
Analyze the mood distribution and the average mood. Are there any noticeable patterns? For example, did their mood dip on days with high spending on 'Junk Food' or improve when they completed a 'Workout' habit? Mention the most frequent mood.

### 💰 Financial Health
Analyze their income vs. expenses in PKR. Highlight the top spending categories. Provide a brief comment on their financial discipline for the period. Mention the net balance (positive or negative).

### 💪 Habit & Goal Momentum
Comment on the user's habit consistency. Which habits are they sticking to, and which need more attention? Then, review their goal progress. Are their activities (like time logs and completed habits) aligning with their long-term ambitions?

### ⏱️ Time Management
Analyze how the user has spent their time based on their time logs. Which activities dominate? Are they investing time in activities that align with their goals, or are there potential time sinks they might want to review?

### 🚀 Actionable Advice
Based on all the data, provide 2-3 concrete, encouraging, and actionable suggestions for the user to improve or continue their great work in the next period.

Here is the data for the period:
- **Period:** ${data.period}
- **Key Metrics:** ${JSON.stringify(data.keyMetrics)}
- **Mood Distribution (count of days):** ${JSON.stringify(data.moodData.distribution)}
- **Habit Consistency (%):** ${JSON.stringify(data.habitData.consistency)}
- **Goal Progress (%):** ${JSON.stringify(data.goalData.progress)}
- **Financials:**
    - Total Income: PKR ${data.financialData.totalIncome}
    - Total Expenses: PKR ${data.financialData.totalExpenses}
    - Expenses by Category (PKR): ${JSON.stringify(data.financialData.expenseByCategory)}
- **Time Logs:**
    - Total Time Logged (minutes): ${data.timeData.totalMinutes}
    - Time by Activity (minutes): ${JSON.stringify(data.timeData.timeByActivity)}

Generate the report following the specified markdown rules.
`.trim();
}

const getChatSystemInstruction = (lifeDataForPrompt: any) => `You are a helpful and friendly AI assistant called Momentum AI. Your purpose is to help the user understand and query their personal data.
You must answer questions based *only* on the provided JSON data context. Do not make up information or answer questions outside of this context.
If you don't know the answer from the data, say so.
The current date is: ${new Date().toISOString()}.
The user's data is provided below in JSON format. The currency is PKR.
<data>
${JSON.stringify(lifeDataForPrompt, null, 2)}
</data>`;

// --- Controller Functions ---

export const generateSummary = async (req: Request, res: Response) => {
    const { lifeData }: { lifeData: LifeData } = req.body;
    try {
        const today = new Date();
        const todayKey = today.toISOString().split('T')[0];
        const todayData = lifeData.dailyData[todayKey];

        const upcomingTasks = Object.values(lifeData.dailyData)
            .flatMap(d => d.tasks)
            .filter(t => new Date(t.dueDate) > today && !t.completed)
            .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthlyExpenses = Object.values(lifeData.dailyData)
            .flatMap(d => d.expenses)
            .filter(e => new Date(e.createdAt) >= monthStart && new Date(e.createdAt) <= monthEnd);
        
        const monthlyIncome = Object.values(lifeData.dailyData)
            .flatMap(d => d.income)
            .filter(i => new Date(i.createdAt) >= monthStart && new Date(i.createdAt) <= monthEnd);

        const monthlyFinance = {
            totalIncome: monthlyIncome.reduce((sum, i) => sum + i.amount, 0),
            totalExpenses: monthlyExpenses.reduce((sum, e) => sum + e.amount, 0),
            netBalance: monthlyIncome.reduce((sum, i) => sum + i.amount, 0) - monthlyExpenses.reduce((sum, e) => sum + e.amount, 0),
        }
        
        const prompt = generateDailySummaryPrompt(todayData, upcomingTasks, lifeData.habits, lifeData.goals, monthlyFinance);

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        res.json({ summary: response.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to generate AI summary." });
    }
};

export const generateReport = async (req: Request, res: Response) => {
    const { lifeData, startDate, endDate, periodData, keyMetrics } = req.body;
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    try {
        const moodLogs = Object.values(lifeData.dailyData)
            .map((d: any) => d.moodLog).filter((log: any): log is MoodLog => !!log)
            .filter((log: any) => new Date(log.createdAt) >= sDate && new Date(log.createdAt) <= eDate);

        const goalProgress = lifeData.goals.map((g: any) => {
            const completedMilestones = g.milestones.filter((m: any) => m.completed).length;
            const totalMilestones = g.milestones.length;
            return {
                title: g.title,
                progress: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
            };
        });

        const promptData = {
            period: `${sDate.toLocaleDateString()} to ${eDate.toLocaleDateString()}`,
            keyMetrics,
            moodData: {
                distribution: moodLogs.reduce((acc: any, log: any) => {
                    acc[log.mood] = (acc[log.mood] || 0) + 1;
                    return acc;
                }, {} as Record<Mood, number>),
            },
            habitData: { consistency: periodData.habitConsistency },
            financialData: { totalIncome: periodData.totalIncome, totalExpenses: periodData.totalExpenses, expenseByCategory: periodData.expenseByCategory },
            timeData: { totalMinutes: periodData.totalTime, timeByActivity: periodData.timeByActivity },
            goalData: { progress: goalProgress }
        };

        const prompt = generatePeriodicReportPrompt(promptData);
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        res.json({ report: response.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to generate AI report." });
    }
};

const sanitizeLifeDataForPrompt = (lifeData: LifeData) => ({
    ...lifeData,
    dailyData: Object.fromEntries(
        Object.entries(lifeData.dailyData).map(([key, value]) => [
            key,
            { ...value, photoLog: value.photoLog ? { ...value.photoLog, imageDataUrl: '...image data present...' } : undefined }
        ])
    ),
    credentials: '...credentials hidden...' // Hide credentials
});


export const initChat = async (req: Request, res: Response) => {
    const { lifeData } = req.body;
    try {
        const sanitizedData = sanitizeLifeDataForPrompt(lifeData);
        const systemInstruction = getChatSystemInstruction(sanitizedData);
        const initialPrompt = `Begin the conversation by introducing yourself and suggesting a few questions the user could ask, for example: "How much did I spend last month?", "List my tasks for tomorrow.", or "What was my mood like last week?".`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: initialPrompt }] }],
            config: { systemInstruction }
        });
        
        res.json({ message: response.text });

    } catch (error) {
        console.error("Chat init error:", error);
        res.status(500).json({ message: "Failed to initialize chat." });
    }
};

export const continueChat = async (req: Request, res: Response) => {
    const { history, lifeData } = req.body;

    try {
        const sanitizedData = sanitizeLifeDataForPrompt(lifeData);
        const systemInstruction = getChatSystemInstruction(sanitizedData);
        
        // Convert frontend message format to Gemini's Content format
        const contents: Content[] = history.map((msg: { role: 'user' | 'model', content: string }) => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: { systemInstruction }
        });

        res.json({ message: response.text });

    } catch (error) {
        console.error("Chat continuation error:", error);
        res.status(500).json({ message: "Failed to get chat response." });
    }
};