export interface AvatarUnlockState {
  hasCompletedOnboarding: boolean;
  totalQuizzesCompleted: number;
  currentStreak: number;
  highestScorePercent: number;
}

export interface CollectibleItem {
  id: string;
  name: string;
  category: 'headwear' | 'eyewear' | 'accessory' | 'badge';
  icon: string;
  conditionDescription: string;
  isUnlocked: boolean;
  color: string;
}

/**
 * Pure function that determines which avatar items are unlocked
 * based on the student's real achievements (Derived State).
 */
export function computeUnlockedItems(stats: AvatarUnlockState): CollectibleItem[] {
  return [
    {
      id: 'headphones',
      name: 'Focus Headphones',
      category: 'accessory',
      icon: 'Headphones',
      color: '#2563eb',
      conditionDescription: 'Complete your first study quiz',
      isUnlocked: stats.totalQuizzesCompleted >= 1,
    },
    {
      id: 'sunglasses',
      name: 'Cool Specs',
      category: 'eyewear',
      icon: 'Glasses',
      color: '#0f172a',
      conditionDescription: 'Reach a 3-day study streak',
      isUnlocked: stats.currentStreak >= 3,
    },
    {
      id: 'cap',
      name: 'Varsity Cap',
      category: 'headwear',
      icon: 'GraduationCap',
      color: '#0891b2',
      conditionDescription: 'Reach a 7-day study streak',
      isUnlocked: stats.currentStreak >= 7,
    },
    {
      id: 'crown',
      name: 'Mastery Crown',
      category: 'headwear',
      icon: 'Crown',
      color: '#f59e0b',
      conditionDescription: 'Score 80% or higher on any quiz',
      isUnlocked: stats.highestScorePercent >= 80,
    },
    {
      id: 'star-badge',
      name: '5-Quiz Veteran',
      category: 'badge',
      icon: 'Sparkles',
      color: '#10b981',
      conditionDescription: 'Complete 5 practice quizzes',
      isUnlocked: stats.totalQuizzesCompleted >= 5,
    },
  ];
}
