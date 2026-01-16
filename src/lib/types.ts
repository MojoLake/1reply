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
  difficultyTags: ("easy" | "medium" | "hard")[];
}

export interface GamePair {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  theme?: "confusable" | "contrast" | "narrative";
  situationA: ConversationSituation;
  situationB: ConversationSituation;
  situationC?: ConversationSituation; // Only present for trios in extreme mode
}

/** @deprecated Use GamePair instead - kept for migration reference */
export interface SituationPair {
  id: string;
  situationIds: [string, string] | [string, string, string];
  difficulty: "easy" | "medium" | "hard";
  theme?: string;
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
  C?: JudgeScores; // Only present in extreme mode
}

export interface ConfusionDelta {
  A: number;
  B: number;
  C?: number; // Only present in extreme mode
}

export interface ContinuationResult {
  response: string;
  isEnding: boolean; // true if this is a conversation-ending message
}

export interface ContinuationResponse {
  responseA: string;
  responseB: string;
  responseC?: string; // Only present in extreme mode
  endingA: boolean;
  endingB: boolean;
  endingC?: boolean; // Only present in extreme mode
}

export interface RoundResult {
  evaluation: JudgeResult;
  confusionDelta: ConfusionDelta;
  scoreGained: number;
  newConfusionA: number;
  newConfusionB: number;
  newConfusionC?: number; // Only present in extreme mode
  gameOver: boolean;
  gameOverReason?: "A" | "B" | "C";
}

export interface GameState {
  mode: GameMode;
  round: number;
  score: number;
  conversationA: Conversation;
  conversationB: Conversation;
  conversationC?: Conversation; // Only present in extreme mode
  usedSituationIds: string[];
  usedPairIds: string[];
  isGameOver: boolean;
  gameOverReason?: "A" | "B" | "C" | "survived"; // "survived" when player completes all 30 rounds
  completedConversations: number; // count of successfully completed conversations
}

export type GameMode = "classic" | "timer" | "daily" | "extreme";

export interface RoundData {
  pairId: string;
  situationA: ConversationSituation;
  situationB: ConversationSituation;
  situationC?: ConversationSituation; // Only present for trios in extreme mode
}

