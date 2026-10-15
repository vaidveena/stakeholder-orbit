import { buildExecutiveBrief, getStrategy, needsAttention, normalizeStakeholder, summarize } from "./orbit-utils.js";

const STORAGE_KEY = "stakeholder-orbit-v1";
const EXAMPLE = [
  { id: "maya", name: "Maya Chen", role: "VP, Customer Experience", influence: 5, interest: 5, sentiment: "champion", owner: "Jordan", priority: "A launch that reduces support contacts" },
  { id: "dev", name: "Dev Patel", role: "Security Lead", influence: 5, interest: 3, sentiment: "concerned", owner: "Ari", priority: "Evidence that customer data is protected" },
  { id: "sofia", name: "Sofia Reyes", role: "Support Operations", influence: 3, interest: 5, sentiment: "supportive", owner: "Jordan", priority: "Training and a clear escalation path" },
  { id: "liam", name: "Liam Brooks", role: "Finance Partner", influence: 4, interest: 2, sentiment: "neutral", owner: "", priority: "Spend stays within the approved envelope" },
  { id: "nia", name: "Nia Okafor", role: "Pilot Customer", influence: 2, interest: 4, sentiment: "champion", owner: "Sam", priority: "Early access and a fast feedback loop" }
];

const form = document.querySelector("#stakeholder-form");
const byId = (id) => document.querySelector(`#${id}`);
let stakeholders = readStorage();

function readStorage() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeStakeholder) : [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stakeholders));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function pointPosition(score, min, max) {
  return min + ((Number(score) - 1) / 4) * (max - min);
}

function sentimentClass(sentiment) {
  if (["champion", "supportive"].includes(sentiment)) return "champion";
  if (["concerned", "resistant"].includes(sentiment)) return "concerned";
  return "neutral";
}

function renderMap() {
  const points = byId("map-points");
  points.innerHTML = stakeholders.map((item, index) => {
    const x = pointPosition(item.interest, 90, 630) + ((index % 3) - 1) * 9;
    const y = 410 - ((Number(item.influence) - 1) / 4) * 330 + ((index % 2) ? 7 : -7);
    const kind = sentimentClass(item.sentiment);
    return `<g class="map-point ${kind}" data-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="Edit ${escapeHtml(item.name)}" transform="translate(${x} ${y})">
      <circle r="25"></circle><text text-anchor="middle" dy="5">${escapeHtml(initials(item.name))}</text>
      <title>${escapeHtml(item.name)} · ${escapeHtml(getStrategy(item).label)}</title>
    </g>`;
  }).join("");
  byId("map-empty").classList.toggle("hidden", stakeholders.length > 0);
  points.querySelectorAll(".map-point").forEach((point) => {
    const edit = () => startEdit(point.dataset.id);
    point.addEventListener("click", edit);
    point.addEventListener("keydown", (event) => { if (["Enter", " "].includes(event.key)) edit(); });
  });
}

function renderPlan() {
  const list = byId("plan-list");
  list.innerHTML = stakeholders
    .slice()
    .sort((a, b) => Number(needsAttention(b)) - Number(needsAttention(a)) || b.influence - a.influence)
    .map((item) => {
      const strategy = getStrategy(item);
      return `<article class="plan-card ${needsAttention(item) ? "needs-attention" : ""}">
        <div class="person-mark ${sentimentClass(item.sentiment)}">${escapeHtml(initials(item.name))}</div>
        <div class="plan-copy">
          <div class="person-line"><h3>${escapeHtml(item.name)}</h3><span class="strategy ${strategy.key}">${strategy.label}</span></div>
          <p class="role">${escapeHtml(item.role)} · ${escapeHtml(item.sentiment)}</p>
          <p>${escapeHtml(strategy.action)}</p>
          <div class="plan-meta"><span><b>Cadence:</b> ${escapeHtml(strategy.cadence)}</span><span><b>Owner:</b> ${escapeHtml(item.owner || "Unassigned")}</span></div>
          ${item.priority ? `<p class="priority"><b>What matters:</b> ${escapeHtml(item.priority)}</p>` : ""}
        </div>
        <div class="card-actions"><button data-action="edit" data-id="${escapeHtml(item.id)}">Edit</button><button data-action="delete" data-id="${escapeHtml(item.id)}">Remove</button></div>
      </article>`;
    }).join("");
  byId("plan-empty").classList.toggle("hidden", stakeholders.length > 0);

  const attention = stakeholders.filter(needsAttention);
  const banner = byId("attention-banner");
  banner.classList.toggle("hidden", attention.length === 0);
  banner.innerHTML = attention.length ? `<strong>Attention signal:</strong> ${attention.map((item) => escapeHtml(item.name)).join(", ")} ${attention.length === 1 ? "is" : "are"} high-influence and not yet aligned.` : "";
}

function renderMetrics() {
  const stats = summarize(stakeholders);
  byId("metric-total").textContent = stats.total;
  byId("metric-close").textContent = stats.manageClosely;
  byId("metric-watch").textContent = stats.attention;
  byId("metric-coverage").textContent = `${stats.ownerCoverage}%`;
}

function render() {
  renderMetrics();
  renderMap();
  renderPlan();
  save();
}

function resetForm() {
  form.reset();
  byId("stakeholder-id").value = "";
  byId("form-title").textContent = "Add a stakeholder";
  byId("submit-label").textContent = "Add to orbit";
  byId("cancel-edit").classList.add("hidden");
}

function startEdit(id) {
  const item = stakeholders.find((candidate) => candidate.id === id);
  if (!item) return;
  Object.entries(item).forEach(([key, value]) => { const input = byId(key === "id" ? "stakeholder-id" : key); if (input) input.value = value; });
  byId("form-title").textContent = `Edit ${item.name}`;
  byId("submit-label").textContent = "Save changes";
  byId("cancel-edit").classList.remove("hidden");
  document.querySelector(".form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function notify(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const existingId = byId("stakeholder-id").value;
  const item = normalizeStakeholder({
    id: existingId || crypto.randomUUID(), name: byId("name").value, role: byId("role").value,
    influence: byId("influence").value, interest: byId("interest").value,
    sentiment: byId("sentiment").value, owner: byId("owner").value, priority: byId("priority").value
  });
  if (existingId) stakeholders = stakeholders.map((candidate) => candidate.id === existingId ? item : candidate);
  else stakeholders.push(item);
  resetForm(); render(); notify(existingId ? "Stakeholder updated" : "Stakeholder added to orbit");
});

byId("cancel-edit").addEventListener("click", resetForm);
byId("load-example").addEventListener("click", () => {
  if (stakeholders.length && !confirm("Replace your current map with the example?")) return;
  stakeholders = EXAMPLE.map(normalizeStakeholder); resetForm(); render(); notify("Example map loaded");
});

byId("plan-list").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "edit") startEdit(button.dataset.id);
  if (button.dataset.action === "delete") {
    const item = stakeholders.find((candidate) => candidate.id === button.dataset.id);
    if (item && confirm(`Remove ${item.name} from the map?`)) { stakeholders = stakeholders.filter((candidate) => candidate.id !== item.id); render(); notify("Stakeholder removed"); }
  }
});

byId("copy-brief").addEventListener("click", async () => {
  if (!stakeholders.length) return notify("Add stakeholders before creating a brief");
  await navigator.clipboard.writeText(buildExecutiveBrief(stakeholders)); notify("Executive brief copied");
});

byId("download-plan").addEventListener("click", () => {
  if (!stakeholders.length) return notify("Add stakeholders before exporting");
  const blob = new Blob([buildExecutiveBrief(stakeholders)], { type: "text/markdown" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "stakeholder-engagement-plan.md"; link.click(); URL.revokeObjectURL(link.href);
  notify("Engagement plan exported");
});

render();
