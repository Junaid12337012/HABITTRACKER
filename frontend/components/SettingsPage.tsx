
import React, { useRef } from 'react';
import Card from './Card';
import { useLifeData } from '../hooks/useLifeData';
import { CogIcon, ArchiveBoxArrowDownIcon, ExclamationTriangleIcon, ArrowUpTrayIcon, ShieldCheckIcon, KeyIcon } from './icons';
import { useAuth } from '../App';

type SettingsPageProps = ReturnType<typeof useLifeData> & {
    showToast: (message: string) => void;
    logout: () => void;
    refetchData: () => void;
};

const SettingsPage: React.FC<SettingsPageProps> = ({ lifeData, importData, showToast, logout, refetchData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();
  
  const handleExportData = () => {
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(lifeData, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `momentum-ai-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } catch (error) {
      console.error("Failed to export data", error);
      alert("There was an error exporting your data.");
    }
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (window.confirm("Are you sure you want to import this file? This will overwrite all your current data on the server. It is recommended to export your current data first.")) {
          const reader = new FileReader();
          reader.onload = async (e) => {
              const text = e.target?.result;
              if (typeof text === 'string') {
                  try {
                      await importData(text);
                      showToast("Data imported and saved successfully!");
                      refetchData();
                  } catch (error: any) {
                      showToast(`Import failed: ${error.message}`);
                  }
              }
          };
          reader.readAsText(file);
      }
      event.target.value = '';
  };
  
  const handleResetApplication = async () => {
    if (window.prompt("This will permanently delete your account and ALL associated data from the server. This is irreversible. To proceed, type 'DELETE' in the box below.") === 'DELETE') {
        try {
            const res = await fetch('/api/auth/delete-account', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to delete account on server.");
            logout();
            alert("Your account has been deleted. The application will now reload.");
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("An error occurred while deleting your account.");
        }
    } else {
        alert("Reset cancelled. Your data is safe.");
    }
  };

  return (
    <main className="max-w-4xl mx-auto grid grid-cols-1 gap-8">
      
      <div className="flex items-center gap-3">
        <CogIcon />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-dark-text-primary">Settings</h1>
      </div>
      
      <Card title="Data Management" icon={<ArchiveBoxArrowDownIcon />}>
        <div className="space-y-4 divide-y divide-gray-200 dark:divide-dark-border">
            <div className="pt-4 first:pt-0 flex flex-col sm:flex-row items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-dark-text-primary">Export All Data</h4>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">Download a JSON file of all your application data. Keep it safe!</p>
              </div>
              <button
                onClick={handleExportData}
                disabled={!lifeData}
                className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 flex items-center gap-2 justify-center disabled:opacity-50"
              >
                <ArchiveBoxArrowDownIcon /> Export Data
              </button>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between">
               <div>
                <h4 className="font-semibold text-gray-800 dark:text-dark-text-primary">Import Data</h4>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">Import data from a backup file. <strong className="text-orange-500">This will overwrite current data.</strong></p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
              <button
                onClick={handleImportClick}
                className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 flex items-center gap-2 justify-center"
              >
                <ArrowUpTrayIcon /> Import Data
              </button>
            </div>
        </div>
      </Card>
      
      <Card title="Account Security" icon={<ShieldCheckIcon />}>
         <div className="space-y-4 divide-y divide-gray-200 dark:divide-dark-border">
            <div className="pt-4 first:pt-0 flex flex-col sm:flex-row items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-dark-text-primary">Log Out</h4>
                  <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">Sign out of your current session.</p>
                </div>
                <button
                  onClick={logout}
                  className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 flex items-center gap-2 justify-center"
                >
                  <KeyIcon /> Log Out
                </button>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-dark-text-primary">Change Password</h4>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">Update your master password.</p>
              </div>
              <button
                onClick={() => {
                    const currentPassword = prompt('Enter current password');
                    if (!currentPassword) return;
                    const newPassword = prompt('Enter new password (min 6 chars)');
                    if (!newPassword || newPassword.length < 6) {
                        alert('Password too short');
                        return;
                    }
                    const confirmPassword = prompt('Confirm new password');
                    if (newPassword !== confirmPassword) {
                        alert('Passwords do not match');
                        return;
                    }
                    fetch('/api/auth/change-password', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ currentPassword, newPassword })
                    }).then(async res => {
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.message || 'Failed');
                        showToast('Password updated');
                    }).catch(err => {
                        alert(err.message);
                    });
                }}
                className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 flex items-center gap-2 justify-center"
              >
                <KeyIcon /> Change Password
              </button>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between">
              <div>
                <h4 className="font-semibold text-red-500">Delete Account & Data</h4>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">Permanently delete your account and all associated data.</p>
              </div>
              <button
                onClick={handleResetApplication}
                className="mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 flex items-center gap-2 justify-center"
              >
                <ExclamationTriangleIcon /> Delete Account
              </button>
            </div>
         </div>
      </Card>

    </main>
  );
};

export default SettingsPage;
