export const RANK_POINTS = [3, 2, 1];

export function normalizeCampsiteRankings(rankings, validCampsiteIds) {
  if (!rankings || typeof rankings !== "object") return {};
  return Object.fromEntries(
    Object.entries(rankings).map(([memberId, choices]) => [
      memberId,
      Array.isArray(choices)
        ? [...new Set(choices)].filter((id) => validCampsiteIds.has(id)).slice(0, 3)
        : [],
    ]),
  );
}

export function getCampsiteRank(rankings, memberId, campsiteId) {
  const ranking = Array.isArray(rankings?.[memberId]) ? rankings[memberId] : [];
  const index = ranking.indexOf(campsiteId);
  return index >= 0 ? index + 1 : 0;
}

export function canSetCampsiteRank(rankings, memberId, campsiteId, rank) {
  if (!Number.isInteger(rank) || rank < 1 || rank > 3) return false;
  const currentRanking = Array.isArray(rankings?.[memberId]) ? rankings[memberId] : [];
  const isAlreadyRanked = currentRanking.includes(campsiteId);
  const highestReachableRank = isAlreadyRanked
    ? currentRanking.length
    : Math.min(3, currentRanking.length + 1);
  return rank <= highestReachableRank;
}

export function setMemberCampsiteRank(rankings, memberId, campsiteId, rank) {
  const currentRanking = Array.isArray(rankings?.[memberId]) ? rankings[memberId] : [];
  if (rank > 0 && !canSetCampsiteRank(rankings, memberId, campsiteId, rank)) {
    return rankings ?? {};
  }
  const nextRanking = currentRanking.filter((id) => id !== campsiteId);
  if (rank > 0) nextRanking.splice(rank - 1, 0, campsiteId);

  return {
    ...(rankings ?? {}),
    [memberId]: nextRanking.slice(0, 3),
  };
}

export function getCampsiteRankingStats(rankings, campsiteId, members) {
  const memberRanks = members.map((member) => ({
    member,
    rank: getCampsiteRank(rankings, member.id, campsiteId),
  }));
  return {
    memberRanks,
    score: memberRanks.reduce(
      (total, entry) => total + (entry.rank ? RANK_POINTS[entry.rank - 1] : 0),
      0,
    ),
    firstChoices: memberRanks.filter((entry) => entry.rank === 1).length,
  };
}

export function createVoteSubmissionGuard() {
  let pending = false;

  return {
    isPending: () => pending,
    async run(submit) {
      if (pending) return { accepted: false };
      pending = true;
      try {
        return { accepted: true, value: await submit() };
      } finally {
        pending = false;
      }
    },
  };
}

export function getVoteFailureMessage(status) {
  if (status === 401 || status === 403) {
    return "Your session has expired. Sign in again to vote.";
  }
  if (status === 409) {
    return "Voting is still being prepared. Refresh the page and try again.";
  }
  return "Your vote could not be saved. Your previous choice has been restored.";
}
