import { apiFetch } from "./api";

export function getComments(challengeId: string, page = 1) {
  return apiFetch(`/challenges/${challengeId}/comments?page=${page}&limit=20`);
}

export function postComment(challengeId: string, content: string) {
  return apiFetch(
    `/challenges/${challengeId}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
    true
  );
}