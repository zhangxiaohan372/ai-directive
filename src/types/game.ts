export type GamePhase =
  | 'LOBBY'
  | 'BRIEFING'
  | 'INVESTIGATION'
  | 'INTERROGATION'
  | 'DISCUSSION'
  | 'VOTING'
  | 'TRUTH_REVEAL';

export type SuspectId = 'lin_lan' | 'zhou_heng' | 'xu_ning' | 'zhao_lei';

export type RoomLocationId = 'main_hall' | 'restoration_room' | 'curator_office' | 'security_room';

export type SuspectEmotion = 'calm' | 'nervous' | 'defensive' | 'agitated' | 'broken';

export interface Suspect {
  id: SuspectId;
  name: string;
  title: string;
  age: number;
  avatarColor: string;
  avatarImage?: string;
  portrait: string; // low-poly styled CSS / 3D theme
  bio: string;
  alibi: string;
  secret: string; // unlocked when certain clues presented
  initialEmotion: SuspectEmotion;
  isCulprit: boolean;
  motiveSummary: string;
}

export interface Clue {
  id: string;
  name: string;
  locationId: RoomLocationId;
  category: 'physical' | 'document' | 'forensic' | 'digital';
  icon: string;
  imageUrl?: string;
  modelType: 'pocket_watch' | 'champagne_flute' | 'shredded_paper' | 'keycard' | 'pigment_cloth' | 'patrol_log' | 'encrypted_journal' | 'window_latch';
  shortDesc: string;
  detail: string;
  forensicNote: string;
  discoveredAt?: string;
  discoveredBy?: string;
  connectedSuspects: SuspectId[];
  isCrucial: boolean;
  tags: string[];
}

export interface GalleryRoom {
  id: RoomLocationId;
  name: string;
  englishName: string;
  color: string;
  desc: string;
  position: [number, number, number];
  size: [number, number, number];
  availableClues: string[];
  searchDifficulty: 'easy' | 'medium' | 'deep';
  isCrimeScene: boolean;
}

export interface TimelineEntry {
  time: string;
  title: string;
  desc: string;
  verified: boolean;
  relatedSuspectId?: SuspectId;
  relatedClueId?: string;
  isContradiction?: boolean;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isBot: boolean;
  ready: boolean;
  votedSuspectId?: SuspectId;
  votedReason?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderRole: 'system' | 'host' | 'suspect' | 'player' | 'referee';
  suspectId?: SuspectId;
  text: string;
  timestamp: string;
  emotion?: SuspectEmotion;
  clueRef?: string;
  isSpoilerWarning?: boolean;
}

export interface ClueLink {
  clueId: string;
  targetId: string; // suspectId or timeline index
  note: string;
}

export interface RoomState {
  roomId: string;
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  discoveredClueIds: string[];
  chatHistory: ChatMessage[];
  currentSuspectId?: SuspectId;
  clueLinks: ClueLink[];
  playerNotes: Record<string, string>; // playerId -> markdown notes
  hintLevel: number;
  hintsRevealed: string[];
  inspectedLocations: RoomLocationId[];
  votes: Record<string, { suspectId: SuspectId; reason: string; timestamp: string }>;
  auditLogs: { time: string; action: string; actor: string; details?: string }[];
  spoilerInterceptions: { time: string; originalText: string; riskScore: number; reason: string }[];
  mcpCallHistory: MCPToolLog[];
}

export interface MCPToolLog {
  id: string;
  timestamp: string;
  toolName: string;
  args: Record<string, any>;
  result: Record<string, any>;
  status: 'success' | 'blocked' | 'error';
}

export interface StructuredAIOutput {
  message: string;
  emotion: SuspectEmotion;
  newClues: string[];
  gameStateChanges: Record<string, any>;
  confidence: number;
  spoilerRisk: number; // 0.0 - 1.0
  interceptionReason?: string;
}
