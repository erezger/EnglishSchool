'use client';

import { useEffect } from 'react';
import type { KidSettings } from '@/lib/modules';
import type { ProgressData } from '@/lib/use-progress';
import BlendTab from './BlendTab';
import { Effects } from './Effects';
import { GameProvider, useGame } from './GameContext';
import Header from './Header';
import LearnTab from './LearnTab';
import { LevelBanner, LevelSelector } from './Levels';
import { AbcBoardModal, VoiceModal } from './Modals';
import SpellBuilderTab from './SpellBuilderTab';

const THEMES = ['theme-classic', 'theme-unicorn', 'theme-ocean', 'theme-space', 'theme-neon'];

/** The main game, rebuilt in React (replaces src/legacy step by step). */
export default function GameApp(props: {
  user: { id: string; displayName: string };
  settings: KidSettings;
  progress: { data: ProgressData; version: number };
}) {
  return (
    <GameProvider {...props}>
      <Shell />
    </GameProvider>
  );
}

function Shell() {
  const g = useGame();
  const theme = typeof g.data.equippedTheme === 'string' && THEMES.includes(g.data.equippedTheme) ? g.data.equippedTheme : 'theme-classic';

  useEffect(() => {
    document.body.classList.remove(...THEMES);
    document.body.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    g.toast(`שלום ${g.user.displayName}! 🌟`, '👋');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-5 py-4 sm:py-6 pb-20">
      <Header />
      <LevelSelector />
      <main className="bg-white/95 backdrop-blur-md rounded-3xl shadow-lg border border-indigo-100/80 overflow-hidden">
        <LevelBanner />
        <TabContent />
      </main>
      {g.modal === 'abc' && <AbcBoardModal />}
      {g.modal === 'voice' && <VoiceModal />}
      {g.modal === 'shop' && <ComingSoon what="החנות" />}
      <Effects />
    </div>
  );
}

function TabContent() {
  const g = useGame();
  if (g.level.isSentenceLevel && g.tab !== 'challenges') return <Placeholder what="שלב המשפטים" />;
  if (g.tab === 'learn') return <LearnTab />;
  if (g.tab === 'blend') return <BlendTab key={g.level.id} />;
  if (g.tab === 'spell') return <SpellBuilderTab key={g.level.id} />;
  return <Placeholder what="הלשונית הזו" />;
}

/* Temporary while the remaining parts move over (the /play page isn't linked from anywhere yet). */
function Placeholder({ what }: { what: string }) {
  return (
    <div className="p-10 text-center text-slate-500 font-bold" data-testid="placeholder">
      🚧 {what} עוברת לגרסה החדשה בשלב הבא
    </div>
  );
}

function ComingSoon({ what }: { what: string }) {
  const g = useGame();
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4" onMouseDown={() => g.setModal(null)}>
      <div className="bg-white rounded-3xl p-6 text-center font-bold text-slate-600">🚧 {what} עוברת לגרסה החדשה בשלב הבא</div>
    </div>
  );
}
