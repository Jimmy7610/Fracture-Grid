import { makeEmptyGame, undo } from "./state.js";
import { generate } from "./generator.js";
import { render, screenToCell } from "./render.js";
import { moveCursor, activate, enterStabilizeMode, stabilizePick } from "./rules.js";
import { updatePanel } from "./ui.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const game = makeEmptyGame();

function getSeedFromURL() {
    const u = new URL(location.href);
    const s = u.searchParams.get("seed");
    return s ? (parseInt(s, 10) || 1) : null;
}

function setURLSeed(seed) {
    const u = new URL(location.href);
    u.searchParams.set("seed", String(seed | 0));
    history.replaceState({}, "", u.toString());
}

function newGame(seed) {
    generate(game, seed | 0);
    setURLSeed(game.seed);
    document.getElementById("seedInput").value = String(game.seed);
    tick();
}

function tick() {
    render(ctx, game);
    updatePanel(game);
    requestAnimationFrame(() => { /* keep reactive without heavy loop */ });
}

canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const py = (e.clientY - rect.top) * (canvas.height / rect.height);
    const cell = screenToCell(game, px, py);
    if (!cell) return;

    if (game.mode === "stabilizePick") {
        if (stabilizePick(game, cell.x, cell.y)) tick();
        return;
    }

    // clicking current tile: try activate
    if (cell.x === game.cursor.x && cell.y === game.cursor.y) {
        if (activate(game)) tick();
        return;
    }

    // otherwise move
    if (moveCursor(game, cell.x, cell.y)) tick();
});

document.getElementById("newBtn").addEventListener("click", () => {
    const v = parseInt(document.getElementById("seedInput").value, 10);
    newGame(Number.isFinite(v) ? v : (Math.random() * 1e9) | 0);
});

document.getElementById("undoBtn").addEventListener("click", () => {
    if (undo(game)) tick();
});

document.getElementById("resetBtn").addEventListener("click", () => {
    newGame(game.seed);
});

window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (undo(game)) tick();
        return;
    }
    if (e.key.toLowerCase() === "s") {
        enterStabilizeMode(game);
        // panel hint is enough; no modal
    }
});

// boot
const seed = getSeedFromURL() ?? 12345;
newGame(seed);

console.log("Fracture Grid - vertical slice ready.");
