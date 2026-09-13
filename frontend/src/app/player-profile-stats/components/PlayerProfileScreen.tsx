'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, Trophy, LayoutGrid, CheckCircle2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { chessService } from '@/lib/services';
import { useAppContext } from '@/lib/store';
import type { PlayerStats } from '@/lib/types';
import { STAGE_CONFIG, STAGES } from '@/lib/types';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import AppLogo from '@/components/ui/AppLogo';
import StageDistributionChart from './StageDistributionChart';

export default function PlayerProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const currentUser = await chessService.getCurrentUser();
        if (!currentUser) { router.push('/'); return; }
        setUser(currentUser);
        const playerStats = await chessService.getPlayerStats();
        setStats(playerStats);
      } catch {
        toast.error('Failed to load profile stats.');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [router, setUser]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await chessService.logout();
      setUser(null);
      toast.success('Signed out successfully');
      router.push('/');
    } catch {
      toast.error('Logout failed. Please try again.');
      setIsLoggingOut(false);
    }
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function formatTimestamp(ts: string): string {
    const d = new Date(ts);
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  }

  return (
    <div className="min-h-screen bg-background chess-grid-bg">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/main-kanban-board')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Board</span>
          </button>
          <span className="text-border">|</span>
          <div className="flex items-center gap-2">
            <AppLogo size={22} />
            <span className="text-sm font-medium text-foreground hidden sm:block">Player Profile</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:text-danger hover:border-danger/40 hover:bg-danger/10 transition-all duration-150 active:scale-95 disabled:opacity-60"
        >
          <LogOut size={14} />
          {isLoggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : stats ? (
          <>
            {/* Player identity card */}
            <div className="card-elevated p-6 rounded-xl glow-primary">
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-primary/50"
                  style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))' }}
                >
                  <span className="text-3xl font-bold text-primary">
                    {stats.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-foreground mb-0.5 truncate">{stats.user.name}</h1>
                  <p className="text-sm text-muted-foreground mb-3 truncate">{stats.user.email}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-primary text-xl leading-none">♚</span>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Rating</span>
                    <span className="font-mono font-bold text-primary tabular-nums text-hero-rating leading-none">
                      {stats.user.rating}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats grid — 3 cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card-elevated p-4 rounded-xl text-center">
                <CheckCircle2 size={20} className="text-success mx-auto mb-2" />
                <p className="text-2xl font-bold font-mono tabular-nums text-foreground">{stats.totalCompleted}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tasks Completed</p>
                <p className="text-xs text-success mt-1">♚ Reached King</p>
              </div>
              <div className="card-elevated p-4 rounded-xl text-center">
                <LayoutGrid size={20} className="text-knight mx-auto mb-2" />
                <p className="text-2xl font-bold font-mono tabular-nums text-foreground">{stats.totalBoards}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Active Boards</p>
                <p className="text-xs text-muted-foreground mt-1">Independent areas</p>
              </div>
              <div className="card-elevated p-4 rounded-xl text-center">
                <Trophy size={20} className="text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold font-mono tabular-nums text-primary">{stats.user.rating}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Global Rating</p>
                <p className="text-xs text-muted-foreground mt-1">Never below 0</p>
              </div>
            </div>

            {/* Stage distribution chart */}
            <div className="card-elevated p-5 rounded-xl">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Tasks by Stage
              </h2>
              <StageDistributionChart tasksByStage={stats.tasksByStage} />
            </div>

            {/* Stage breakdown bars */}
            <div className="card-elevated p-5 rounded-xl">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Stage Breakdown
              </h2>
              <div className="space-y-3">
                {STAGES.map(stage => {
                  const cfg = STAGE_CONFIG[stage];
                  const count = stats.tasksByStage[stage] || 0;
                  const total = Object.values(stats.tasksByStage).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={`stage-bar-${stage}`} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-32 flex-shrink-0">
                        <span className={`text-base stage-${stage}`}>{cfg.glyph}</span>
                        <span className={`text-xs font-mono font-medium stage-${stage}`}>{cfg.label}</span>
                      </div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-stage-${stage} border border-${stage}/40 transition-all duration-500`}
                          style={{ width: `${pct}%`, backgroundColor: `var(--${stage})` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 w-16 flex-shrink-0 justify-end">
                        <span className="text-xs font-mono text-foreground tabular-nums">{count}</span>
                        <span className="text-xs text-muted-foreground">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent moves activity */}
            <div className="card-elevated p-5 rounded-xl">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Recent Moves
              </h2>
              {stats.recentMoves.length === 0 ? (
                <div className="text-center py-6">
                  <span className="text-3xl opacity-20">♟</span>
                  <p className="text-sm text-muted-foreground mt-2">No moves yet — start moving tasks!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recentMoves.map(move => {
                    const fromCfg = STAGE_CONFIG[move.fromStage];
                    const toCfg = STAGE_CONFIG[move.toStage];
                    const isForward = move.ratingDelta > 0;
                    const isNeutral = move.ratingDelta === 0;
                    return (
                      <div
                        key={`move-${move.id}`}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={`text-sm stage-${move.fromStage}`}>{fromCfg.glyph}</span>
                            <span className="text-xs text-muted-foreground">→</span>
                            <span className={`text-sm stage-${move.toStage}`}>{toCfg.glyph}</span>
                          </div>
                          <span className="text-sm text-foreground truncate">{move.taskTitle}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                          <span className="text-xs text-muted-foreground">{formatTimestamp(move.timestamp)}</span>
                          <span className={`flex items-center gap-0.5 text-xs font-mono font-semibold ${
                            isForward ? 'text-success' : isNeutral ? 'text-muted-foreground' : 'text-danger'
                          }`}>
                            {isForward ? <TrendingUp size={12} /> : isNeutral ? <Minus size={12} /> : <TrendingDown size={12} />}
                            {isForward ? '+1' : isNeutral ? '0' : '−1'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sign out */}
            <div className="pb-6">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-danger hover:border-danger/40 hover:bg-danger/5 transition-all duration-150 active:scale-95 disabled:opacity-60"
              >
                <LogOut size={15} />
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load profile. Please try again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
