import React from 'react';
import AppProvider from '@/components/AppProvider';
import KanbanBoardScreen from './components/KanbanBoardScreen';

export default function KanbanBoardPage() {
  return (
    <AppProvider>
      <KanbanBoardScreen />
    </AppProvider>
  );
}