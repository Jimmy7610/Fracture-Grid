import { TILE, idx, pushHistory } from "./state.js";

export function inBounds(game, x, y) {
    return x >= 0 && y >= 0 && x < game.size && y < game.size;
}

export function isLocked(game, x, y) {
    return game.grid[idx(game.size, x, y)] === TILE.LOCKED;
}

export function canMoveTo(game, x, y) {
    if (!inBounds(game, x, y)) return false;
    if (isLocked(game, x, y)) return false;
    const dx = Math.abs(x - game.cursor.x);
    const dy = Math.abs(y - game.cursor.y);
    return (dx + dy) === 1;
}

export function moveCursor(game, x, y) {
    if (!canMoveTo(game, x, y)) return false;
    pushHistory(game);
    game.cursor.x = x;
    game.cursor.y = y;
    game.moves += 1;
    return true;
}

export function isGoalHere(game) {
    const i = idx(game.size, game.cursor.x, game.cursor.y);
    return !!game.goals[i] && !game.activated[i];
}

export function activate(game) {
    if (!isGoalHere(game)) return false;
    pushHistory(game);

    const s = game.size;
    const x = game.cursor.x, y = game.cursor.y;
    const center = idx(s, x, y);
    game.activated[center] = true;

    // Fracture rule (slice):
    // Activate -> orthogonal neighbors become CRACKED unless LOCKED.
    // If already CRACKED and would become CRACKED again -> becomes LOCKED.
    const neigh = [
        [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
    ];

    for (const [nx, ny] of neigh) {
        if (nx < 0 || ny < 0 || nx >= s || ny >= s) continue;
        const ii = idx(s, nx, ny);
        if (game.grid[ii] === TILE.LOCKED) continue;

        // New progression:
        // STABLE -> CRACKED -> FRACTURED -> LOCKED
        if (game.grid[ii] === TILE.FRACTURED) game.grid[ii] = TILE.LOCKED;
        else if (game.grid[ii] === TILE.CRACKED) game.grid[ii] = TILE.FRACTURED;
        else game.grid[ii] = TILE.CRACKED;
    }

    game.moves += 1;
    return true;
}

export function enterStabilizeMode(game) {
    game.mode = "stabilizePick";
}

export function stabilizePick(game, x, y) {
    const i = idx(game.size, x, y);
    if (game.grid[i] !== TILE.CRACKED && game.grid[i] !== TILE.FRACTURED) return false;
    pushHistory(game);

    // Repair ladder:
    // FRACTURED -> CRACKED (partial repair)
    // CRACKED -> STABLE (full repair)
    if (game.grid[i] === TILE.FRACTURED) game.grid[i] = TILE.CRACKED;
    else game.grid[i] = TILE.STABLE;

    game.moves += 1;
    game.mode = "normal";
    return true;
}

export function allGoalsActivated(game) {
    for (let i = 0; i < game.goals.length; i++) {
        if (game.goals[i] && !game.activated[i]) return false;
    }
    return true;
}
