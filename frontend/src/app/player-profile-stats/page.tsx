import React from 'react';
import AppProvider from '@/components/AppProvider';
import PlayerProfileScreen from './components/PlayerProfileScreen';

export default function PlayerProfilePage() {
  return (
    <AppProvider>
      <PlayerProfileScreen />
    </AppProvider>
  );
}