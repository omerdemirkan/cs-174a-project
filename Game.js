class Game {
  constructor({
    gameStateRefreshRate = 60,
    pacmanBlocksPerSecondSpeed = 3,
    ghostBlocksPerSecondSpeed = 2,
  } = {}) {
    this._GAME_STATE_REFRESH_MS = 1000 * (1 / gameStateRefreshRate);
    const pacmanBlocksPerMillisecond = pacmanBlocksPerSecondSpeed / 1000;
    this._PACMAN_MOVEMENT_PER_REFRESH =
      pacmanBlocksPerMillisecond * this._GAME_STATE_REFRESH_MS;

    this._GHOST_MOVEMENT_PER_REFRESH = ghostBlocksPerSecondSpeed / 1000;

    this._interval = null;

    this._pacman = {
      position: {
        i: 1,
        j: 1,
        z: 0,
      },
      movementDirection: DIRECTIONS.NONE,
      intendedDirection: DIRECTIONS.NONE,
    };

    // Creating a copy to avoid polluting it for a given game
    this._matrix = INITIAL_MATRIX.map((row) => [...row]);
  }

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

  _handleRefresh = () => {
    // HANDLE PACMAN MOVEMENT

    const pacmanNextPosition = {
      i:
        this._pacman.position.i +
        this._PACMAN_MOVEMENT_PER_REFRESH * this._pacman.movementDirection.i,
      j:
        this._pacman.position.j +
        this._PACMAN_MOVEMENT_PER_REFRESH * this._pacman.movementDirection.j,
      z: this._pacman.position.z,
    };

    const isPacmanEnteringNewBlock =
      Math.floor(this._pacman.position.i) !==
        Math.floor(pacmanNextPosition.i) ||
      Math.floor(this._pacman.position.j) !==
        Math.floor(pacmanNextPosition.j) ||
      Math.ceil(this._pacman.position.i) !== Math.ceil(pacmanNextPosition.i) ||
      Math.ceil(this._pacman.position.j) !== Math.ceil(pacmanNextPosition.j);

    if (isPacmanEnteringNewBlock) {
      const discreteI = Math.round(this._pacman.position.i);
      const discreteJ = Math.round(this._pacman.position.j);

      const isIntendingToTurn =
        this._pacman.movementDirection !== this._pacman.intendedDirection;

      const isMovingInIntendedDirectionPossible =
        this._matrix[discreteI + this._pacman.intendedDirection.i]?.[
          discreteJ + this._pacman.intendedDirection.j
        ] !== OBJECTS.BARRIER;

      const isTurning =
        isIntendingToTurn && isMovingInIntendedDirectionPossible;

      const isPacmanWalkingIntoAWall =
        this._matrix[Math.floor(pacmanNextPosition.i)]?.[
          Math.floor(pacmanNextPosition.j)
        ] === OBJECTS.BARRIER ||
        this._matrix[Math.ceil(pacmanNextPosition.i)]?.[
          Math.ceil(pacmanNextPosition.j)
        ] === OBJECTS.BARRIER;

      if (isTurning) {
        this._pacman.movementDirection = this._pacman.intendedDirection;
        pacmanNextPosition.i = discreteI;
        pacmanNextPosition.j = discreteJ;
      } else if (isPacmanWalkingIntoAWall) {
        // Places pacman up against the wall.
        // This is assuming a short game tick!
        pacmanNextPosition.i = discreteI;
        pacmanNextPosition.j = discreteJ;
      }
    }

    this._pacman.position = pacmanNextPosition;
  };

  _getXfromJ = (j) => {
    return j;
  };

  _getYfromI = (i) => {
    return this._matrix.length - 1 - i;
  };

  getBarriers = () => {
    const barriers = [];
    this._matrix.forEach((row, i) => {
      row.forEach((item, j) => {
        if (item === OBJECTS.BARRIER) {
          barriers.push({
            x: this._getXfromJ(j),
            y: this._getYfromI(i),
            z: 0,
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

  handleChangeIntendedDirection = (direction) => {
    if (!Object.values(DIRECTIONS).includes(direction)) {
      throw new Error(
        "INVALID DIRECTION! Pass in DIRECTION.{direction} into handleChangeIntendedDirection."
      );
    }

    this._pacman.intendedDirection = direction;
    const isIntendedDirectionOppositeToMovementDirection =
      this._pacman.movementDirection.i === -direction.i &&
      this._pacman.movementDirection.j === -direction.j;

    if (
      isIntendedDirectionOppositeToMovementDirection ||
      this._pacman.movementDirection === DIRECTIONS.NONE
    ) {
      this._pacman.movementDirection = direction;
    }
  };
}

const OBJECTS = Object.freeze({
  EMPTY: 0,
  BARRIER: 1,
  FOOD: 2,
  POWER_UP: 3,
});

const DIRECTIONS = Object.freeze({
  UP: Object.freeze({ j: 0, i: -1 }),
  DOWN: Object.freeze({ j: 0, i: 1 }),
  LEFT: Object.freeze({ j: -1, i: 0 }),
  RIGHT: Object.freeze({ j: 1, i: 0 }),
  NONE: Object.freeze({ j: 0, i: 0 }), // at the beginning, pacman doesn't have a direction.
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
