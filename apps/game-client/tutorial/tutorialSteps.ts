export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector or identifier
  actionRequired?: 'click' | 'none';
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Project Trinity',
    description: 'Prepare for a high-stakes match of memory and strategy. Let\'s learn how to play.',
    actionRequired: 'none',
  },
  {
    id: 'click-board',
    title: 'Reveal a Card',
    description: 'Click on any card in the central board to reveal its value. Your goal is to find three matching cards.',
    target: '[data-tutorial="board-card"]',
    actionRequired: 'click',
  },
  {
    id: 'click-opponent',
    title: 'Challenge an Opponent',
    description: 'You can also reveal cards from your opponents\' hands. Click on an opponent\'s avatar to see one of their cards.',
    target: '[data-tutorial="opponent-avatar"]',
    actionRequired: 'click',
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    description: 'That\'s the spirit! Find trios to win the match. Good luck, Operator.',
    actionRequired: 'none',
  },
];
