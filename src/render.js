import { TILE, idx } from "./state.js";

export function render(ctx, game) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const s = game.size;
    const pad = 30;
    const gridSize = Math.min(w, h) - pad * 2;
    const cell = gridSize / s;
    const ox = (w - gridSize) / 2;
    const oy = (h - gridSize) / 2;

    // draw cells
    for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
            const i = idx(s, x, y);
            const st = game.grid[i];
            const isGoal = game.goals[i];
            const isAct = game.activated[i];

            // base fill
            ctx.fillStyle = "#0f1420";
            if (st === TILE.STABLE) ctx.fillStyle = "#0f1420";
            if (st === TILE.CRACKED) ctx.fillStyle = "#151b2b";
            if (st === TILE.FRACTURED) ctx.fillStyle = "#121829";
            if (st === TILE.LOCKED) ctx.fillStyle = "#080a10";
            ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);

            // goal marker (minimal): small square
            if (isGoal) {
                ctx.fillStyle = isAct ? "#9aa3b2" : "#e6e8ee";
                const m = cell * 0.22;
                ctx.fillRect(ox + x * cell + cell / 2 - m / 2, oy + y * cell + cell / 2 - m / 2, m, m);
            }

            // cracked line
            if (st === TILE.CRACKED) {
                ctx.strokeStyle = "#e6e8ee";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(ox + x * cell + cell * 0.2, oy + y * cell + cell * 0.8);
                ctx.lineTo(ox + x * cell + cell * 0.8, oy + y * cell + cell * 0.2);
                ctx.stroke();
            }

            // fractured split (minimal offset impression)
            if (st === TILE.FRACTURED) {
                ctx.strokeStyle = "#e6e8ee";
                ctx.lineWidth = 1;

                const x0 = ox + x * cell;
                const y0 = oy + y * cell;
                const off = cell * 0.08;

                // a subtle “step” split: two parallel segments with a small offset
                ctx.beginPath();
                ctx.moveTo(x0 + cell * 0.15, y0 + cell * 0.55);
                ctx.lineTo(x0 + cell * 0.55, y0 + cell * 0.15);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x0 + cell * 0.15 + off, y0 + cell * 0.55 + off);
                ctx.lineTo(x0 + cell * 0.55 + off, y0 + cell * 0.15 + off);
                ctx.stroke();
            }

            // locked frame
            if (st === TILE.LOCKED) {
                ctx.strokeStyle = "#2a3142";
                ctx.lineWidth = 2;
                ctx.strokeRect(ox + x * cell + 2, oy + y * cell + 2, cell - 4, cell - 4);
            }

            // cell border
            ctx.strokeStyle = "#2a3142";
            ctx.lineWidth = 1;
            ctx.strokeRect(ox + x * cell, oy + y * cell, cell, cell);
        }
    }

    // cursor highlight
    const cx = game.cursor.x, cy = game.cursor.y;
    ctx.strokeStyle = "#e6e8ee";
    ctx.lineWidth = 3;
    ctx.strokeRect(ox + cx * cell + 3, oy + cy * cell + 3, cell - 6, cell - 6);

    // store geometry for input mapping
    game._geom = { ox, oy, cell, pad, gridSize };
}

export function screenToCell(game, px, py) {
    const g = game._geom;
    if (!g) return null;
    const { ox, oy, cell } = g;
    const x = Math.floor((px - ox) / cell);
    const y = Math.floor((py - oy) / cell);
    if (x < 0 || y < 0 || x >= game.size || y >= game.size) return null;
    return { x, y };
}
