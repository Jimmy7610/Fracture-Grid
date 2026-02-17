import { makeEmptyGame, undo } from "./state.js";
import { generate } from "./generator.js";
import { render, screenToCell } from "./render.js";
import { moveCursor, activate, enterStabilizeMode, stabilizePick } from "./rules.js";
import { updatePanel, toggleDevPanel } from "./ui.js";

const GOLDEN_SEEDS = [
    { name: "G1 Easy", seed: 101 },
    { name: "G2 Medium", seed: 202 },
    { name: "G3 Hard", seed: 303 },
    { name: "G4 Weird", seed: 404 },
    { name: "G5 Stress", seed: 505 }
];

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
    game.mode = "normal"; // reset mode on new level
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
        const success = stabilizePick(game, cell.x, cell.y);
        if (success) {
            tick();
        } else {
            // Subtle feedback for no-op
            const original = document.getElementById("modeStatus").textContent;
            document.getElementById("modeStatus").textContent = "CAN'T STABILIZE";
            setTimeout(() => { if (game.mode === "stabilizePick") updatePanel(game); }, 1000);
        }
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
    if (undo(game)) {
        game.mode = "normal"; // turn off stabilize on undo
        tick();
    }
});

document.getElementById("resetBtn").addEventListener("click", () => {
    newGame(game.seed);
});

window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === "z") {
        e.preventDefault();
        if (undo(game)) {
            game.mode = "normal";
            tick();
        }
        return;
    }
    if (k === "s") {
        enterStabilizeMode(game);
        tick();
    }
    if (k === "d") {
        toggleDevPanel();
    }
    // Shift+1..5
    if (e.shiftKey && e.key >= "1" && e.key <= "5") {
        const idx = parseInt(e.key) - 1;
        newGame(GOLDEN_SEEDS[idx].seed);
    }
});

// Golden seed buttons
document.querySelectorAll(".seed-btn").forEach((btn, i) => {
    btn.addEventListener("click", () => {
        newGame(GOLDEN_SEEDS[i].seed);
    });
});

// boot
const seed = getSeedFromURL() ?? 12345;
newGame(seed);

console.log("Fracture Grid - vertical slice ready.");
