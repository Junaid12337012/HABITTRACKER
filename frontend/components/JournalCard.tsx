import React, { useState, useEffect, useMemo } from 'react';
import { JournalEntry } from '../types';
import Card from './Card';
import { BookOpenIcon } from './icons';

interface JournalCardProps {
  journalEntries: JournalEntry[];
  onSaveEntry: (text: string) => void;
}

const JournalCard: React.FC<JournalCardProps> = ({ journalEntries, onSaveEntry }) => {
  const todaysEntry = useMemo(() => {
    const today = new Date().toDateString();
    return journalEntries.find(entry => new Date(entry.createdAt).toDateString() === today);
  }, [journalEntries]);

  const [text, setText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');

  useEffect(() => {
    if (todaysEntry) {
      setText(todaysEntry.text);
      setSaveStatus('saved');
    } else {
      setText('');
      setSaveStatus('saved');
    }
  }, [todaysEntry]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setSaveStatus('unsaved');
  };

  const handleSave = () => {
    if (text.trim() === '' && !todaysEntry) return; // Don't save empty new entries
    setSaveStatus('saving');
    onSaveEntry(text);
    // The parent's state update will trigger useEffect and set status to 'saved'
    setTimeout(() => { 
        setSaveStatus('saved');
    }, 500);
  };

  return (
    <Card title="Daily Journal" icon={<BookOpenIcon />}>
      <div className="flex flex-col flex-grow h-full">
        <p className="text-sm text-gray-500 dark:text-dark-text-secondary mb-3">
          What happened today? What did you learn? How are you feeling?
        </p>
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Write your thoughts here..."
          className="w-full flex-grow bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none resize-none"
          rows={10}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-500 dark:text-dark-text-secondary">
            {saveStatus === 'unsaved' && 'You have unsaved changes.'}
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && todaysEntry && `Last saved at ${new Date(todaysEntry.createdAt).toLocaleTimeString()}`}
          </span>
          <button
            onClick={handleSave}
            disabled={saveStatus !== 'unsaved' || text.trim() === todaysEntry?.text}
            className="p-2 px-4 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
          >
            Save Entry
          </button>
        </div>
      </div>
    </Card>
  );
};

export default JournalCard;
