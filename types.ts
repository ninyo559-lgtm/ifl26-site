export type LeagueType = 'premier' | 'national' | 'champions';

export interface Player {
  id: string;
  name: string;
  sonyUsername: string;
  photoUrl?: string;
}

export interface Fixture {
  id: string;
  league: LeagueType;
  homePlayerId: string;
  awayPlayerId: string;
  homeScore: number | null;
  awayScore: number | null;
  completed: boolean;
  date: string;
  groupId?: string; // For Champions League groups
}

export interface PlayoffMatch {
  id: string;
  round: 'quarter' | 'semi' | 'final';
  player1Id: string | null;
  player2Id: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  index: number;
}

export interface PlayoffBrackets {
  premier: PlayoffMatch[];
  national: PlayoffMatch[];
  champions: PlayoffMatch[];
}

export interface PlayerStats {
  id: string;
  name: string;
  team: string;
  gp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export interface CLGroup {
  id: string;
  name: string;
  playerIds: string[];
}

export interface SeasonHistoryEntry {
  id: string;
  seasonName: string;
  premierTable: PlayerStats[];
  nationalTable: PlayerStats[];
  championsWinner?: string;
  premierWinner?: string;
  nationalWinner?: string;
  timestamp: string;
}

export interface HallOfFameEntry {
  id: string;
  playerName: string;
  achievement: string;
  season: string;
  date: string;
}