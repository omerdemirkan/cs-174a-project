class Game {
  constructor({
    gameStateRefreshRate = 60,
    pacmanBlocksPerSecondSpeed = 3,
    ghostBlocksPerSecondSpeed = 2,
  } = {}) {
    this._GAME_STATE_REFRESH_MS = 1000 * (1 / gameStateRefreshRate);
    const pacmanBlocksPerMillisecond = pacmanBlocksPerSecondSpeed * 1000;
    this._PACMAN_MOVEMENT_PER_REFRESH =
      pacmanBlocksPerMillisecond / this._GAME_STATE_REFRESH_MS;

    this._GHOST_MOVEMENT_PER_REFRESH = ghostBlocksPerSecondSpeed / 1000;

    this._interval = null;

    this._pacman = {
      x: 1,
      y: 1,
      direction: DIRECTIONS.NONE,
      intendedDirection: DIRECTIONS.NONE,
    };

    // Creating a copy to avoid polluting it for a given game
    this._matrix = INITIAL_MATRIX.map((row) => [...row]);
  }

  _handleRefresh = () => {
    const isPacmanIntendingToMove =
      this._pacman.intendedDirection !== DIRECTIONS.NONE;
    if (isPacmanIntendingToMove) {
    }
  };

  startGame = () => {
    if (!this._interval) {
      this._interval = setInterval(
        this._handleRefresh,
        this._GAME_STATE_REFRESH_MS
      );
    }
  };

  pauseGame = () => {
    clearInterval(this.interval);
    this.interval = null;
  };

  getBarriers = () => {
    const barriers = [];
    this._matrix.forEach((row, i) => {
      row.forEach((item, j) => {
        if (item === OBJECTS.BARRIER) {
          barriers.push({
            x: j,
            y: i,
            hasBarrierAbove: this._matrix[i - 1]?.[j] === OBJECTS.BARRIER,
            hasBarrierBelow: this._matrix[i + 1]?.[j] === OBJECTS.BARRIER,
            hasBarrierLeft: this._matrix[i]?.[j - 1] === OBJECTS.BARRIER,
            hasBarrierRight: this._matrix[i]?.[j + 1] === OBJECTS.BARRIER,
          });
        }
      });
    });

    return barriers;
  };
}

const OBJECTS = Object.freeze({
  EMPTY: 0,
  BARRIER: 1,
  FOOD: 2,
  POWER_UP: 3,
});

const DIRECTIONS = Object.freeze({
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3,
  NONE: 4, // at the beginning, pacman doesn't have a direction.
});

const INITIAL_MATRIX = [
  new Array(28).fill(OBJECTS.BARRIER),
  [
    OBJECTS.BARRIER,
    ...new Array(12).fill(OBJECTS.FOOD),
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(12).fill(OBJECTS.FOOD),
    OBJECTS.BARRIER,
  ],
  [
    OBJECTS.BARRIER,
    OBJECTS.FOOD,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    OBJECTS.BARRIER,
  ],
  [
    OBJECTS.BARRIER,
    OBJECTS.FOOD,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    OBJECTS.BARRIER,
  ],
  [
    OBJECTS.BARRIER,
    OBJECTS.FOOD,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    OBJECTS.BARRIER,
  ],

  [OBJECTS.BARRIER, ...new Array(26).fill(OBJECTS.FOOD), OBJECTS.BARRIER],

  [
    OBJECTS.BARRIER,
    OBJECTS.FOOD,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(8).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    OBJECTS.BARRIER,
  ],

  [
    OBJECTS.BARRIER,
    ...new Array(6).fill(OBJECTS.FOOD),
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(4).fill(OBJECTS.FOOD),
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(4).fill(OBJECTS.FOOD),
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(6).fill(OBJECTS.FOOD),
    OBJECTS.BARRIER,
  ],
  [
    ...new Array(6).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.FOOD,
    ...new Array(6).fill(OBJECTS.BARRIER),
  ],
  new Array(28).fill(OBJECTS.BARRIER),
];
