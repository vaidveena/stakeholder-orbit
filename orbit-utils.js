const STRATEGIES = {
  "manage-closely": {
    label: "Manage closely",
    cadence: "Weekly 1:1 or working session",
    action: "Co-create decisions, surface tradeoffs early, and close the loop on their feedback."
  },
  "keep-satisfied": {
    label: "Keep satisfied",
    cadence: "Biweekly executive update",
    action: "Lead with outcomes and exceptions; ask for help only when their influence can unblock progress."
  },
  "keep-informed": {
    label: "Keep informed",
    cadence: "Weekly digest or demo",
    action: "Share visible progress, invite practical feedback, and equip them to advocate for the work."
  },
  monitor: {
    label: "Monitor",
    cadence: "Monthly summary",
    action: "Keep communication lightweight and watch for changes in interest or influence."
  }
};

export function classifyStakeholder(influence, interest) {
  const highInfluence = Number(influence) >= 4;
  const highInterest = Number(interest) >= 4;
  if (highInfluence && highInterest) return "manage-closely";
  if (highInfluence) return "keep-satisfied";
  if (highInterest) return "keep-informed";
  return "monitor";
}

export function getStrategy(stakeholder) {
  const key = classifyStakeholder(stakeholder.influence, stakeholder.interest);
  return { key, ...STRATEGIES[key] };
}

export function needsAttention(stakeholder) {
  return Number(stakeholder.influence) >= 4 && ["concerned", "resistant"].includes(stakeholder.sentiment);
}

export function summarize(stakeholders) {
  const total = stakeholders.length;
  const owned = stakeholders.filter((item) => item.owner?.trim()).length;
  return {
    total,
    manageClosely: stakeholders.filter((item) => classifyStakeholder(item.influence, item.interest) === "manage-closely").length,
    attention: stakeholders.filter(needsAttention).length,
    ownerCoverage: total ? Math.round((owned / total) * 100) : 0
  };
}

export function buildExecutiveBrief(stakeholders, date = new Date()) {
  const summary = summarize(stakeholders);
  const attention = stakeholders.filter(needsAttention);
  const close = stakeholders.filter((item) => classifyStakeholder(item.influence, item.interest) === "manage-closely");
  const lines = [
    "# Stakeholder Orbit — Executive Brief",
    `Generated ${date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    "",
    "## Snapshot",
    `- ${summary.total} stakeholders mapped`,
    `- ${summary.manageClosely} require close management`,
    `- ${summary.attention} high-influence relationships need attention`,
    `- ${summary.ownerCoverage}% have a named relationship owner`,
    "",
    "## Priority relationships"
  ];

  if (!close.length) lines.push("- No stakeholders currently fall in the manage-closely quadrant.");
  close.forEach((item) => lines.push(`- **${item.name} (${item.role})** — ${item.sentiment}; owner: ${item.owner || "unassigned"}. Focus: ${item.priority || "confirm priorities"}.`));

  lines.push("", "## Attention needed");
  if (!attention.length) lines.push("- No high-influence stakeholders are currently concerned or resistant.");
  attention.forEach((item) => lines.push(`- **${item.name}** is ${item.sentiment}. Schedule a direct conversation and agree on a concrete next step.`));

  lines.push("", "## Engagement plan");
  stakeholders.forEach((item) => {
    const strategy = getStrategy(item);
    lines.push(`- **${item.name} — ${strategy.label}:** ${strategy.cadence}. ${strategy.action} Owner: ${item.owner || "TBD"}.`);
  });
  return lines.join("\n");
}

export function normalizeStakeholder(raw) {
  return {
    id: String(raw.id || crypto.randomUUID()),
    name: String(raw.name || "").trim(),
    role: String(raw.role || "").trim(),
    influence: Math.min(5, Math.max(1, Number(raw.influence) || 1)),
    interest: Math.min(5, Math.max(1, Number(raw.interest) || 1)),
    sentiment: ["champion", "supportive", "neutral", "concerned", "resistant"].includes(raw.sentiment) ? raw.sentiment : "neutral",
    owner: String(raw.owner || "").trim(),
    priority: String(raw.priority || "").trim()
  };
}
