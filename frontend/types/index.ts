import type { LucideIcon } from "lucide-react";

export interface Group {
  id: string;
  groupAddress?: string;
  name: string;
  currentRound: number;
  totalRounds: number;
  members: number;
  maxMembers: number;
  poolValue: number;
  nextPayoutDate: string;
  status: "forming" | "active" | "completed";
  contributionAmount: number;
  interval: "weekly" | "monthly";
  isPrivate?: boolean;
}

export interface GroupMember {
  id: string;
  name: string;
  wallet: string;
  avatar: string;
  hasPaid: boolean;
  hasReceived: boolean;
  isCurrentWinner?: boolean;
  joinedAt: string;
}

export interface Winner {
  round: number;
  name: string;
  wallet: string;
  amount: number;
  paidAt: string;
}

export interface GroupDetail {
  id: string;
  name: string;
  dagnaName: string;
  dagnaAvatar: string;
  currentRound: number;
  totalRounds: number;
  contributionAmount: number;
  interval: "weekly" | "monthly";
  maxMembers: number;
  poolValue: number;
  members: GroupMember[];
  winners: Winner[];
}

export interface Member {
  id: string;
  address: string;
  joinedAt: string;
  hasPaid: boolean;
  hasReceived: boolean;
}

export interface Round {
  id: string;
  roundNumber: number;
  winner: string;
  paidAt: string;
  poolAmount: number;
}

export interface ActivityItem {
  id: string;
  type: "joined" | "paid" | "received" | "member_joined";
  description: string;
  amount: number | null;
  date: string;
  groupName: string;
}

export interface AnalyticsStat {
  label: string;
  value: string;
  icon: LucideIcon;
  description: string;
}
