
import React, { useState, useEffect, useRef } from 'react';
import { LifeData } from '../types';
import { getInitialChatMessage, getChatResponse } from '../services/geminiService';
import { SparklesIcon } from './icons';
import { useAuth } from '../App';


interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n');
    return (
        <div className="prose prose-sm dark:prose-invert max-w-none text-left">
            {lines.map((line, i) => {
                // Basic list item support
                if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                    return <li key={i} className="ml-4">{line.trim().substring(2)}</li>;
                }
                // Basic bold support
                const boldParts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
                return (
                    <p key={i} className="my-1">
                        {boldParts.map((part, j) => {
                            if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('*') && part.endsWith('*'))) {
                                return <strong key={j}>{part.replace(/\*/g, '')}</strong>;
                            }
                            return <span key={j}>{part}</span>;
                        })}
                    </p>
                );
            })}
        </div>
    );
};


const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="flex-shrink-0 bg-brand-primary h-8 w-8 rounded-full flex items-center justify-center text-white mt-1">
                    <SparklesIcon />
                </div>
            )}
            <div className={`max-w-xl p-3 rounded-2xl ${isUser ? 'bg-brand-primary text-white rounded-br-lg' : 'bg-gray-200 dark:bg-dark-card text-gray-800 dark:text-dark-text-primary rounded-bl-lg'}`}>
                <MarkdownRenderer content={message.content} />
            </div>
        </div>
    );
};

const ChatPage: React.FC<{ lifeData: LifeData }> = ({ lifeData }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { token } = useAuth();

    useEffect(() => {
        if (!lifeData || !token) return;
        const initChat = async () => {
            setIsLoading(true);
            const initialMessage = await getInitialChatMessage(lifeData, token);
            setMessages([initialMessage]);
            setIsLoading(false);
        };
        initChat();
    }, [lifeData, token]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', content: userInput };
        const newHistory = [...messages, newUserMessage];
        
        setMessages(newHistory);
        setUserInput('');
        setIsLoading(true);

        const responseMessage = await getChatResponse(newHistory, lifeData, token);
        
        setMessages(prev => [...prev, responseMessage]);
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-dark-border">
            <div className="p-4 border-b border-gray-200 dark:border-dark-border flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">Chat with Your Data</h2>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Ask Momentum AI anything about your logged activity.</p>
            </div>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {messages.map((msg, index) => <ChatBubble key={index} message={msg} />)}
                {isLoading && (
                     <div className="flex items-start gap-3 justify-start">
                        <div className="flex-shrink-0 bg-brand-primary h-8 w-8 rounded-full flex items-center justify-center text-white mt-1">
                            <SparklesIcon />
                        </div>
                        <div className="max-w-xl p-3 rounded-2xl bg-gray-200 dark:bg-dark-card text-gray-800 dark:text-dark-text-primary rounded-bl-lg">
                           <span className="animate-pulse">Typing...</span>
                        </div>
                    </div>
                )}
                 <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-dark-border flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        placeholder="Ask about habits, tasks, finances..."
                        className="flex-grow bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        disabled={isLoading}
                    />
                    <button type="submit" className="bg-brand-primary text-white p-2 rounded-lg hover:bg-brand-secondary disabled:opacity-50 flex-shrink-0" disabled={isLoading || !userInput.trim()}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatPage;
