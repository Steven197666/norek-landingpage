import { apiFetch } from "@/lib/api";

export type VoteValue = 1 | -1;

export async function voteForChallenge(challengeId: string, value: VoteValue) {
  // Wir versuchen erst den wahrscheinlichsten Payload.
  // Falls dein Backend anders erwartet, fangen wir es ab und probieren eine Alternative.
  const tryA = async () =>
    apiFetch(
      `/votes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, value }),
      },
      true
    );

  const tryB = async () =>
    apiFetch(
      `/votes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          type: value === 1 ? "up" : "down",
        }),
      },
      true
    );

  let res = await tryA();

  // Wenn Backend DTO anders ist, kommt oft 400.
  if (!res.ok && res.status === 400) {
    res = await tryB();
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Vote failed (${res.status})`);
  }

  return res.json();
}