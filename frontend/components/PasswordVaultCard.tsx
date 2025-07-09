

import React, { useState, useEffect } from 'react';
import { Credential } from '../types';
import Card from './Card';
import { KeyIcon, LockClosedIcon, PlusIcon, EyeIcon, EyeOffIcon, ClipboardCopyIcon, TrashIcon } from './icons';

interface PasswordVaultCardProps {
    className?: string;
    credentials: Credential[];
    onLogout: () => void;
    onAddCredential: (credential: Omit<Credential, 'id'>) => Promise<void>;
    onDeleteCredential: (id: string) => Promise<void>;
    showToast: (message: string) => void;
}

const UnlockedView: React.FC<Omit<PasswordVaultCardProps, 'className'>> = 
({ credentials, onLogout, onAddCredential, onDeleteCredential, showToast }) => {
    const [form, setForm] = useState({ website: '', username: '', password: '', note: '' });
    const [revealedId, setRevealedId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        showToast("Password Copied!");
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onAddCredential(form);
        setForm({ website: '', username: '', password: '', note: '' });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-md text-gray-800 dark:text-dark-text-primary">Your Credentials</h4>
                <button onClick={onLogout} className="px-3 py-1.5 bg-gray-200 dark:bg-dark-border rounded-md text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-1.5">
                    <LockClosedIcon /> Log Out
                </button>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2" style={{ maxHeight: '250px' }}>
                {credentials && credentials.length > 0 ? credentials.map(cred => (
                    <div key={cred.id} className="bg-gray-50 dark:bg-dark-bg p-3 rounded-lg group">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-gray-900 dark:text-dark-text-primary">{cred.website}</p>
                            <button onClick={() => onDeleteCredential(cred.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><TrashIcon /></button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-dark-text-secondary">{cred.username}</p>
                        {cred.password && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-sm text-gray-800 dark:text-dark-text-primary">{revealedId === cred.id ? cred.password : '••••••••'}</span>
                                <button onClick={() => setRevealedId(revealedId === cred.id ? null : cred.id)} className="text-gray-600 dark:text-dark-text-secondary">{revealedId === cred.id ? <EyeOffIcon/> : <EyeIcon />}</button>
                                <button onClick={() => handleCopy(cred.password!, cred.id)} className="text-gray-600 dark:text-dark-text-secondary"><ClipboardCopyIcon /></button>
                                {copiedId === cred.id && <span className="text-xs text-brand-primary font-semibold">Copied!</span>}
                            </div>
                        )}
                        {cred.note && <p className="text-xs font-mono bg-gray-100 dark:bg-gray-700 p-1.5 rounded mt-2 text-gray-800 dark:text-dark-text-primary">{cred.note}</p>}
                    </div>
                )) : <p className="text-center text-gray-500 dark:text-dark-text-secondary py-8">Your vault is empty. Add a credential below.</p>}
            </div>
            <form onSubmit={handleSubmit} className="mt-auto flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-dark-border">
                <h4 className="font-semibold text-md text-gray-800 dark:text-dark-text-primary">Add New Credential</h4>
                <div className="grid grid-cols-2 gap-2">
                    <input name="website" value={form.website} onChange={handleFormChange} placeholder="Website or App" className="col-span-1 w-full bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                    <input name="username" value={form.username} onChange={handleFormChange} placeholder="Username or Email" className="col-span-1 w-full bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                </div>
                <input name="password" type="text" value={form.password} onChange={handleFormChange} placeholder="Password" className="w-full bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                <textarea name="note" value={form.note} onChange={handleFormChange} placeholder="Secret key or note (optional)" rows={2} className="w-full bg-gray-100 dark:bg-dark-bg border-gray-300 dark:border-dark-border rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                 <button type="submit" className="w-full p-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50 flex items-center justify-center gap-2" disabled={!form.website.trim() || !form.username.trim()}>
                    <PlusIcon /> Add Credential
                </button>
            </form>
        </div>
    );
}

const PasswordVaultCard: React.FC<PasswordVaultCardProps> = (props) => {
    return (
        <Card title="Password Vault" icon={<KeyIcon />} className={props.className}>
           <UnlockedView {...props} />
        </Card>
    );
};

export default PasswordVaultCard;
