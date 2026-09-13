import React, { Suspense } from 'react';
import AppProvider from '@/components/AppProvider';
import TaskDetailScreen from './components/TaskDetailScreen';

export default function TaskDetailPage() {
  return (
    <AppProvider>
      <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>}>
        <TaskDetailScreen />
      </Suspense>
    </AppProvider>
  );
}