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

  _getEntityUpdatedPositionAndDirection({
    movementDirection,
    currentPosition,
    pickFromPossibleDirectionsOnCrossroads,
    movementAmount,
  }) {
    const nextPosition = {
      i: currentPosition.i + movementAmount * movementDirection.i,
      j: currentPosition.j + movementAmount * movementDirection.j,
      z: currentPosition.z,
    };
    let nextDirection = movementDirection;

    const isPacmanEnteringNewBlock =
      Math.floor(currentPosition.i) !== Math.floor(nextPosition.i) ||
      Math.floor(currentPosition.j) !== Math.floor(nextPosition.j) ||
      Math.ceil(currentPosition.i) !== Math.ceil(nextPosition.i) ||
      Math.ceil(currentPosition.j) !== Math.ceil(nextPosition.j);

    if (isPacmanEnteringNewBlock) {
      const discreteI = Math.round(currentPosition.i);
      const discreteJ = Math.round(currentPosition.j);

      const amountMoved =
        Math.abs(currentPosition.i - discreteI) +
        Math.abs(currentPosition.j - discreteJ);
      const movementRemaining = movementAmount - amountMoved;

      const possibleDirectionsAtCrossroads = Object.values(DIRECTIONS).filter(
        (d) =>
          this._matrix[discreteI + d.i]?.[discreteJ + d.j] !== OBJECTS.BARRIER
      );
      nextDirection = pickFromPossibleDirectionsOnCrossroads(
        possibleDirectionsAtCrossroads
      );
      nextPosition.i = discreteI + movementRemaining * nextDirection.i;
      nextPosition.j = discreteJ + movementRemaining * nextDirection.j;

      if (!possibleDirectionsAtCrossroads.includes(nextDirection)) {
        throw new Error(
          "in _getEntityUpdatedPositionAndDirection: invalid direction picked from pickFromPossibleDirectionsOnCrossroads"
        );
      }
    }
    return [nextPosition, nextDirection];
  }

  _handleRefresh = () => {
    // HANDLE PACMAN MOVEMENT

    const [nextPosition, nextDirection] =
      this._getEntityUpdatedPositionAndDirection({
        movementDirection: this._pacman.movementDirection,
        currentPosition: this._pacman.position,
        movementAmount: this._PACMAN_MOVEMENT_PER_REFRESH,
        pickFromPossibleDirectionsOnCrossroads: (possibleDirections) => {
          console.log(possibleDirections);
          if (possibleDirections.includes(this._pacman.intendedDirection)) {
            this._pacman.movementDirection = this._pacman.intendedDirection;
            return this._pacman.intendedDirection;
          } else if (
            possibleDirections.includes(this._pacman.movementDirection)
          ) {
            return this._pacman.movementDirection;
          }
          return DIRECTIONS.NONE;
        },
      });
    this._pacman.movementDirection = nextDirection;
    this._pacman.position = nextPosition;
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
