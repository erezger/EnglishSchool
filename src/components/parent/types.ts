export type StudentSummary = {
  id: string;
  username: string;
  displayName: string;
  hasPin: boolean;
  locked: boolean;
  lastLoginAt: string | null;
  progress: {
    coins: number;
    dailyStreak: number;
    lastActiveDate: string | null;
    completedLevels: number;
    learnedLetters: number;
    readWords: number;
    readSentences: number;
    mistakes: number;
    equippedAvatar: string;
    equippedPet: string;
    spellingPracticed: number;
    spellingKnown: number;
    spellingWeak: number;
    reviewLast: string | null;
    reviewStreak: number;
    reviewTracked: number;
    reviewDue: number;
    reviewMastered: number;
  };
  grade: number | null;
  rewards: { id: string; title: string; cost: number }[];
  checks: {
    id: string;
    status: string;
    total: number;
    score: number | null;
    coinsAwarded: number | null;
    createdAt: string;
    finishedAt: string | null;
    failed: string[];
  }[];
  coinAdjustments: { amount: number; reason: string; createdAt: string; seen: boolean }[];
  checkable: { letters: number; words: number; spelling: number };
};

export type Guardian = {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'parent';
  lastLoginAt: string | null;
};

export type RedemptionItem = {
  id: string;
  studentId: string;
  title: string;
  cost: number;
  status: 'pending' | 'fulfilled' | 'cancelled';
  requestedAt: string;
  resolvedAt: string | null;
};

export type FamilyOverview = {
  family: { id: string; name: string };
  students: StudentSummary[];
  guardians: Guardian[];
  redemptions: RedemptionItem[];
};

export type Me = { id: string; displayName: string; username: string; role: 'admin' | 'parent' };
