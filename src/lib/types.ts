// Core game types

export interface Message {
  role: "them" | "player";
  text: string;
}

export interface ConversationSituation {
  id: string;
  topic: string;
  tone: "casual" | "formal" | "stressed" | "flirty" | "serious" | "playful" | "concerned" | "excited";
  intent: string;
  personName: string;
  personContext: string;
  facts: string[];
  initialTranscript: Message[];
  allowedReplyLength: { min: number; max: number };
  difficultyTags: ("easy" | "medium" | "hard")[];
}

export interface Conversation {
  situation: ConversationSituation;
  transcript: Message[];
  confusion: number; // 0-5
}

export interface JudgeScores {
  coherence: number; // 0-10
  relevance: number; // 0-10
  tone_match: number; // 0-10
  directness: number; // 0-10
  contradiction: boolean;
  unsafe: boolean;
  notes: string[];
}

export interface JudgeResult {
  A: JudgeScores;
  B: JudgeScores;
}

export interface ConfusionDelta {
  A: number;
  B: number;
}

export interface ContinuationResult {
  response: string;
  isEnding: boolean; // true if this is a conversation-ending message
}

export interface ContinuationResponse {
  responseA: string;
  responseB: string;
  endingA: boolean;
  endingB: boolean;
}

export interface RoundResult {
  evaluation: JudgeResult;
  confusionDelta: ConfusionDelta;
  scoreGained: number;
  newConfusionA: number;
  newConfusionB: number;
  gameOver: boolean;
  gameOverReason?: "A" | "B";
}

export interface GameState {
  mode: GameMode;
  round: number;
  score: number;
  conversationA: Conversation;
  conversationB: Conversation;
  hintsRemaining: number;
  usedSituationIds: string[];
  isGameOver: boolean;
  gameOverReason?: "A" | "B";
  completedConversations: number; // count of successfully completed conversations
}

export type GameMode = "classic" | "timer" | "daily" | "endless";

export type Difficulty = "easy" | "medium" | "hard";

export interface RoundData {
  situationA: ConversationSituation;
  situationB: ConversationSituation;
  difficulty: Difficulty;
}

