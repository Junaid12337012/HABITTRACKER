import React, { useState, useEffect, useMemo } from 'react';
import { PhotoLog } from '../types';
import Card from './Card';
import { CameraIcon, TrashIcon, PlusIcon } from './icons';

interface PhotoJournalCardProps {
  photoLogs: PhotoLog[];
  onAddPhotoLog: (imageDataUrl: string, note?: string) => void;
  onDeletePhotoLog: (id: string) => void;
}

const PhotoJournalCard: React.FC<PhotoJournalCardProps> = ({ photoLogs, onAddPhotoLog, onDeletePhotoLog }) => {
  const todaysLog = useMemo(() => {
    const today = new Date().toDateString();
    return photoLogs.find(log => new Date(log.createdAt).toDateString() === today);
  }, [photoLogs]);

  const [note, setNote] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (todaysLog) {
      setNote(todaysLog.note || '');
      setImagePreview(todaysLog.imageDataUrl);
    } else {
      setNote('');
      setImagePreview(null);
    }
  }, [todaysLog]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        // Automatically save when image is selected
        onAddPhotoLog(dataUrl, note); 
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleNoteSave = () => {
      if(todaysLog) {
          onAddPhotoLog(todaysLog.imageDataUrl, note);
      }
  }

  const handleDelete = () => {
      if (todaysLog && confirm('Are you sure you want to delete today\'s photo?')) {
          onDeletePhotoLog(todaysLog.id);
      }
  }

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <Card title="Photo Journal" icon={<CameraIcon />}>
      <div className="flex flex-col flex-grow h-full">
        {imagePreview ? (
          <div className="relative mb-3 flex-grow">
            <img src={imagePreview} alt="Today's log" className="w-full h-48 object-cover rounded-lg" />
            <button
              onClick={handleDelete}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-red-500"
              aria-label="Delete photo"
            >
              <TrashIcon />
            </button>
          </div>
        ) : (
          <button
            onClick={triggerFileSelect}
            className="w-full flex-grow flex flex-col items-center justify-center bg-gray-100 dark:bg-dark-bg border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg mb-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <CameraIcon />
            <span className="mt-1 text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Add Today's Photo</span>
          </button>
        )}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col gap-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note to your photo..."
              className="w-full bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-md py-2 px-3 text-gray-800 dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none resize-none"
              rows={2}
              disabled={!todaysLog}
            />
             <button
                onClick={handleNoteSave}
                disabled={!todaysLog || note === todaysLog.note}
                className="w-full p-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50 flex items-center justify-center gap-2"
            >
                Save Note
            </button>
        </div>
      </div>
    </Card>
  );
};

export default PhotoJournalCard;
