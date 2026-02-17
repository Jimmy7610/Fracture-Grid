export const TILE = {
  STABLE: "stable",
  CRACKED: "cracked",
  LOCKED: "locked",
};

export function cloneGame(game){
  return JSON.parse(JSON.stringify(game));
}

export function makeEmptyGame(){
  return {
    size: 5,
    seed: 1,
    grid: [],          // tile states
    goals: [],         // boolean grid: goal tile
    activated: [],     // boolean grid: activated goal
    cursor: { x: 0, y: 0 },
    moves: 0,
    mode: "normal",    // normal | stabilizePick
    history: [],
  };
}

export function idx(size,x,y){ return y*size + x; }

export function pushHistory(game){
  // store snapshot without history to avoid recursion
  const snap = cloneGame({ ...game, history: [] });
  game.history.push(snap);
}

export function undo(game){
  const prev = game.history.pop();
  if(!prev) return false;
  const keepHistory = game.history; // remaining stack
  Object.assign(game, prev);
  game.history = keepHistory;
  return true;
}
