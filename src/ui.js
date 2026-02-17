import { TILE } from "./state.js";
import { allGoalsActivated } from "./rules.js";

export function computeScore(game) {
    const base = 1000;
    let locked = 0;
    for (const t of game.grid) if (t === TILE.LOCKED) locked++;
    const score = base - (game.moves * 10) - (locked * 25);
    return Math.max(0, score);
}

export function computeRank(score) {
    if (score >= 850) return "S";
    if (score >= 700) return "A";
    if (score >= 550) return "B";
    return "C";
}

let devVisible = false;
export function toggleDevPanel() {
    devVisible = !devVisible;
    document.getElementById("devPanel").style.display = devVisible ? "block" : "none";
}

export function updatePanel(game) {
    const goalsTotal = game.goals.filter(Boolean).length;
    const goalsDone = game.activated.filter(Boolean).length;
    document.getElementById("goalStatus").textContent = `${goalsDone}/${goalsTotal}`;
    document.getElementById("moveCount").textContent = String(game.moves);

    // Mode indicator
    const modeEl = document.getElementById("modeStatus");
    modeEl.textContent = game.mode.toUpperCase();
    if (game.mode === "stabilizePick") {
        modeEl.style.color = "#ffcc00";
        modeEl.style.fontWeight = "bold";
    } else {
        modeEl.style.color = "";
        modeEl.style.fontWeight = "";
    }

    if (allGoalsActivated(game)) {
        const score = computeScore(game);
        document.getElementById("score").textContent = String(score);
        document.getElementById("rank").textContent = computeRank(score);
    } else {
        document.getElementById("score").textContent = "-";
        document.getElementById("rank").textContent = "-";
    }

    // Dev updates
    if (game.meta) {
        document.getElementById("devSeed").textContent = String(game.meta.seed);
        const b = game.meta.scoreBreakdown;
        document.getElementById("devScore").textContent = `${b.total} (G:${b.goalCount * 10} L:${b.lockedCount * 15} D:-${b.goalDistScore})`;
        document.getElementById("devRetries").textContent = String(game.meta.retriesUsed);
        document.getElementById("devFallback").style.display = game.meta.fallbackAccepted ? "block" : "none";
    }
}
