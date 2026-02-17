import { TILE, idx } from "./state.js";

// Simple deterministic RNG (Mulberry32)
function mulberry32(a) {
    return function () {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function pickUnique(rng, count, max) {
    const set = new Set();
    while (set.size < count) {
        set.add(Math.floor(rng() * max));
    }
    return [...set];
}

export function generate(game, seed) {
    let attempts = 0;
    while (true) {
        attempts++;
        game.seed = seed | 0;
        const rng = mulberry32(game.seed || 1);

        const s = game.size;
        const n = s * s;

        // init
        game.grid = new Array(n).fill(TILE.STABLE);
        game.goals = new Array(n).fill(false);
        game.activated = new Array(n).fill(false);
        game.moves = 0;
        game.mode = "normal";
        game.history = [];

        // goals 3..5
        const goalCount = 3 + Math.floor(rng() * 3);
        for (const i of pickUnique(rng, goalCount, n)) {
            game.goals[i] = true;
        }

        // start locked 0..4 but avoid locking all around start later
        const lockCount = Math.floor(rng() * 5);
        const locked = pickUnique(rng, lockCount, n);
        for (const i of locked) {
            if (game.goals[i]) continue; // avoid locking goals in slice
            game.grid[i] = TILE.LOCKED;
        }

        // place cursor on a non-locked tile
        let cx = 0, cy = 0;
        for (let tries = 0; tries < 200; tries++) {
            cx = Math.floor(rng() * s);
            cy = Math.floor(rng() * s);
            if (game.grid[idx(s, cx, cy)] !== TILE.LOCKED) break;
        }
        game.cursor = { x: cx, y: cy };

        // sanity: ensure at least one legal move OR activate at start
        if (!hasAnyStartAction(game)) {
            // fix by unlocking one neighbor if possible
            const neigh = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]].filter(([x, y]) => x >= 0 && y >= 0 && x < s && y < s);
            for (const [nx, ny] of neigh) {
                const ii = idx(s, nx, ny);
                game.grid[ii] = TILE.STABLE;
                if (hasAnyStartAction(game)) break;
            }
        }

        const score = scoreDifficulty(game);

        // Acceptable difficulty window (tunable)
        if (score >= 20 && score <= 120) return game;

        if (attempts > 50) return game; // fail-safe

        // Try next deterministic seed
        seed += 1;
    }
}

function scoreDifficulty(game) {
    const s = game.size;
    const n = s * s;

    let goalCount = 0;
    let lockedCount = 0;

    for (let i = 0; i < n; i++) {
        if (game.goals[i]) goalCount++;
        if (game.grid[i] === "locked") lockedCount++;
    }

    // Pairwise Manhattan distance between goals
    let goalDist = 0;
    let goals = [];
    for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
            const i = y * s + x;
            if (game.goals[i]) goals.push({ x, y });
        }
    }

    for (let i = 0; i < goals.length; i++) {
        for (let j = i + 1; j < goals.length; j++) {
            goalDist += Math.abs(goals[i].x - goals[j].x) +
                Math.abs(goals[i].y - goals[j].y);
        }
    }

    // Difficulty heuristic (tweakable)
    return (
        goalCount * 10 +
        lockedCount * 15 -
        goalDist * 2
    );
}

function hasAnyStartAction(game) {
    const s = game.size;
    const { x, y } = game.cursor;
    // activate?
    const i = idx(s, x, y);
    if (game.goals[i] && !game.activated[i]) return true;
    // move?
    const neigh = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
    for (const [nx, ny] of neigh) {
        if (nx < 0 || ny < 0 || nx >= s || ny >= s) continue;
        const ii = idx(s, nx, ny);
        if (game.grid[ii] !== TILE.LOCKED) return true;
    }
    return false;
}
