import React from 'react';
import AppProvider from '@/components/AppProvider';
import AuthScreen from './components/AuthScreen';

export default function HomePage() {
  return (
    <AppProvider>
      <AuthScreen />
    </AppProvider>
  );
}