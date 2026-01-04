export enum Screen {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum Role {
  DOUGEN = 'dougen', // The lead actor (AI)
  PENGGEN = 'penggen', // The support actor (User)
}

export interface ChatMessage {
  role: Role;
  text: string;
  isEvaluation?: boolean; // If true, it's a meta-commentary from the system/audience
}

export interface Option {
  id: string;
  text: string;
}

export interface GameState {
  screen: Screen;
  hecai: number; // Cheers
  daocai: number; // Boos
  mood: number; // Audience Mood (0-100)
  messages: ChatMessage[];
  currentOptions: Option[];
  isLoading: boolean;
  lastFeedback: string | null;
  turnCount: number;
  maxTurns: number; // Dynamic max turns (can be increased by Encore)
  consecutiveHecai: number; // Streak of good responses
  consecutiveDaocai: number; // Streak of bad responses
  topic?: string; // The title of the current script/topic
}

// Gemini API Response Schemas

export interface StartGameResponse {
  topic: string;
  firstLine: string;
  options: Option[];
}

export interface TurnEvaluationResponse {
  scoreImpact: {
    hecai: number;
    daocai: number;
  };
  feedback: string; // The "audience" or "master" reaction text
  isGameOver: boolean; // Did the user fail naturally (not just by threshold)?
  isSuccess: boolean; // Was this a good move?
  nextDougenLine?: string; // The next line from the AI
  nextOptions?: Option[]; // The next set of choices
}