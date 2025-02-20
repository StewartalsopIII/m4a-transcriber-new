'use client';

import React, { useState, useCallback } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { TranscriptionService } from '@/lib/transcription-service';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [speakers, setSpeakers] = useState(['Stewart', 'James']);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'audio/x-m4a') {
      setFile(uploadedFile);
      setError('');
    } else {
      setError('Please upload an M4A file');
      setFile(null);
    }
  }, []);

  const handleAddSpeaker = () => {
    setSpeakers([...speakers, `Speaker ${String.fromCharCode(65 + speakers.length)}`]);
  };

  const handleUpdateSpeaker = (index: number, value: string) => {
    const newSpeakers = [...speakers];
    newSpeakers[index] = value;
    setSpeakers(newSpeakers);
  };

  const handleTranscribe = async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const service = new TranscriptionService(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
      const result = await service.transcribeAudio(file, speakers);
      setTranscription(result);
    } catch (err) {
      setError('Failed to transcribe the file. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    
    if (droppedFile && droppedFile.type === 'audio/x-m4a') {
      setFile(droppedFile);
      setError('');
    } else {
      setError('Please upload an M4A file');
      setFile(null);
    }
  };

  return (
    <main className="container mx-auto p-4 max-w-3xl">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold mb-6">M4A Audio Transcription</h1>
          
          <div className="space-y-6">
            {/* File Upload Section */}
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors duration-200"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".m4a"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <span className="mt-2 block text-sm font-medium text-gray-600">
                  {file ? file.name : 'Drag and drop an M4A file here, or click to upload'}
                </span>
              </label>
            </div>

            {/* Speakers Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Speakers</h3>
                <button 
                  className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
                  onClick={handleAddSpeaker}
                >
                  Add Speaker
                </button>
              </div>
              {speakers.map((speaker, index) => (
                <input
                  key={index}
                  value={speaker}
                  onChange={(e) => handleUpdateSpeaker(index, e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder-gray-500"
                  placeholder={`Speaker ${index + 1}`}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Transcribe Button */}
            <button 
              onClick={handleTranscribe}
              disabled={!file || loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                  Transcribing...
                </>
              ) : (
                'Transcribe'
              )}
            </button>

            {/* Transcription Results */}
            {transcription && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-gray-900">Transcription</h3>
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900 bg-white p-4 rounded-md shadow-sm">
                  {transcription}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}