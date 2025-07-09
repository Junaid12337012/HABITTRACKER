
import { DailyData, Goal, Habit, LifeData, Mood, TimeLog, Task, MoodLog } from '../types';

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

const apiCall = async (endpoint: string, token: string | null, body: any) => {
    if (!token) {
        throw new Error("Authentication token not found.");
    }
    const response = await fetch(`/api/ai${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "An error occurred with the AI service.");
    }
    return response.json();
};

export const generateDailySummary = async (lifeData: LifeData, token: string | null): Promise<string> => {
    try {
        const result = await apiCall('/summary', token, { lifeData });
        return result.summary;
    } catch (error) {
        console.error("Error generating summary from backend:", error);
        return "I'm having trouble reflecting on your day right now. Please try again later.";
    }
};

export const generatePeriodicReport = async (
    lifeData: LifeData, 
    startDate: Date, 
    endDate: Date,
    periodData: any,
    keyMetrics: any,
    token: string | null
): Promise<string> => {
    try {
        const result = await apiCall('/report', token, { lifeData, startDate, endDate, periodData, keyMetrics });
        return result.report;
    } catch (error) {
        console.error("Error generating report from backend:", error);
        return "I'm having trouble analyzing your data right now. Please try again later.";
    }
};

export const getInitialChatMessage = async (lifeData: LifeData, token: string | null): Promise<ChatMessage> => {
     try {
        const result = await apiCall('/chat/init', token, { lifeData });
        return { role: 'model', content: result.message };
    } catch (error) {
        console.error("Error getting initial chat message:", error);
        return { role: 'model', content: "Sorry, I'm having trouble connecting right now." };
    }
}

export const getChatResponse = async (history: ChatMessage[], lifeData: LifeData, token: string | null): Promise<ChatMessage> => {
    try {
        const result = await apiCall('/chat/message', token, { history, lifeData });
        return { role: 'model', content: result.message };
    } catch (error) {
        console.error("Error getting chat response:", error);
        return { role: 'model', content: "Sorry, I'm having trouble with that request. Please try again." };
    }
};