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
  };
  rewards: { id: string; title: string; cost: number }[];
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
