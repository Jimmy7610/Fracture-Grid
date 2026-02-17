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

export function updatePanel(game) {
    const goalsTotal = game.goals.filter(Boolean).length;
    const goalsDone = game.activated.filter(Boolean).length;
    document.getElementById("goalStatus").textContent = `${goalsDone}/${goalsTotal}`;
    document.getElementById("moveCount").textContent = String(game.moves);

    if (allGoalsActivated(game)) {
        const score = computeScore(game);
        document.getElementById("score").textContent = String(score);
        document.getElementById("rank").textContent = computeRank(score);
    } else {
        document.getElementById("score").textContent = "-";
        document.getElementById("rank").textContent = "-";
    }
}
