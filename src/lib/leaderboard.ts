import { apiJson } from "./api";

export type LeaderboardRow = {
  username: string;
  challengesCompleted: number;
  totalEarned: number;
};

export function getLeaderboard(limit = 20) {
  return apiJson<LeaderboardRow[]>(`/leaderboard?limit=${limit}`);
}