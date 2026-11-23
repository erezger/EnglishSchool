'use client';

import { useEffect } from 'react';
import type { KidSettings } from '@/lib/modules';
import type { ProgressData } from '@/lib/use-progress';
import BlendTab from './BlendTab';
import ChallengesTab from './ChallengesTab';
import { Effects } from './Effects';
import { GameProvider, useGame } from './GameContext';
import Header from './Header';
import LearnTab from './LearnTab';
import { LevelBanner, LevelSelector } from './Levels';
import { AbcBoardModal, VoiceModal } from './Modals';
import Notices from './Notices';
import QuizTab from './QuizTab';
import SentencesLevel from './SentencesLevel';
import ShopModal from './ShopModal';
import SpellBuilderTab from './SpellBuilderTab';

const THEMES = ['theme-classic', 'theme-unicorn', 'theme-ocean', 'theme-space', 'theme-neon'];

/** The main game (learn letters, blend, build words, quiz, challenges, sentences, shop). */
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
      <Notices />
      <LevelSelector />
      <main className="bg-white/95 backdrop-blur-md rounded-3xl shadow-lg border border-indigo-100/80 overflow-hidden">
        <LevelBanner />
        <TabContent />
      </main>
      {g.modal === 'abc' && <AbcBoardModal />}
      {g.modal === 'voice' && <VoiceModal />}
      {g.modal === 'shop' && <ShopModal />}
      <Effects />
    </div>
  );
}

function TabContent() {
  const g = useGame();
  if (g.tab === 'challenges') return <ChallengesTab key={g.level.id} />;
  if (g.level.isSentenceLevel) return <SentencesLevel />;
  if (g.tab === 'learn') return <LearnTab />;
  if (g.tab === 'blend') return <BlendTab key={g.level.id} />;
  if (g.tab === 'spell') return <SpellBuilderTab key={g.level.id} />;
  return <QuizTab key={g.level.id} />;
}
