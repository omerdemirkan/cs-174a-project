export class Game {
  constructor({
    gameStateRefreshRate = 60,
    pacmanBlocksPerSecondSpeed = 4,
    ghostBlocksPerSecondSpeed = 3,
    pacmanHitboxRadius = 0.5,
    ghostHitboxRadius = 0.5,
    gravityAccelleration = -12,
    jumpInitialVelocity = 6,
    directionAnnealingSpeed = 0.2,
    pelletOscillationSpeedMilliseconds = 2000,
    pelletOscillationHeight = 0.1,
  } = {}) {
    this._GAME_STATE_REFRESH_MS = 1000 * (1 / gameStateRefreshRate);

    const pacmanBlocksPerMillisecond = pacmanBlocksPerSecondSpeed / 1000;
    this._PACMAN_MOVEMENT_PER_REFRESH =
      pacmanBlocksPerMillisecond * this._GAME_STATE_REFRESH_MS;

    const ghostBlocksPerMillisecond = ghostBlocksPerSecondSpeed / 1000;
    this._GHOST_MOVEMENT_PER_REFRESH =
      ghostBlocksPerMillisecond * this._GAME_STATE_REFRESH_MS;

    this._PACMAN_HITBOX_RADIUS = pacmanHitboxRadius;
    this._GHOST_HITBOX_RADIUS = ghostHitboxRadius;

    this._GRAVITY_ACCELERATION = gravityAccelleration;
    this._JUMP_INITIAL_VELOCITY = jumpInitialVelocity;

    this._DIRECTION_ANNEALING_SPEED = directionAnnealingSpeed;

    this._PELLET_OSCILLATION_SPEED_MS = pelletOscillationSpeedMilliseconds;
    this._PELLET_OSCILLATION_HEIGHT = pelletOscillationHeight;

    // Stores result of setInterval, which we need to
    // pass into clearInterval on pauseGame.
    this._interval = null;

    this._placePacmanInStartingPosition();
    this._placeGhostsInStartingPosition();

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

  _getEntityUpdatedXYPositionAndDirection({
    movementDirection,
    currentPosition,
    pickFromPossibleDirectionsOnNewBlock,
    movementAmount,
  }) {
    const nextPosition = {
      i: currentPosition.i + movementAmount * movementDirection.i,
      j: currentPosition.j + movementAmount * movementDirection.j,
      z: currentPosition.z,
    };
    let nextDirection = movementDirection;

    const isEnteringNewBlock =
      Math.floor(currentPosition.i) !== Math.floor(nextPosition.i) ||
      Math.floor(currentPosition.j) !== Math.floor(nextPosition.j) ||
      Math.ceil(currentPosition.i) !== Math.ceil(nextPosition.i) ||
      Math.ceil(currentPosition.j) !== Math.ceil(nextPosition.j);

    if (isEnteringNewBlock) {
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
      nextDirection = pickFromPossibleDirectionsOnNewBlock(
        possibleDirectionsAtCrossroads
      );
      nextPosition.i = discreteI + movementRemaining * nextDirection.i;
      nextPosition.j = discreteJ + movementRemaining * nextDirection.j;

      if (!possibleDirectionsAtCrossroads.includes(nextDirection)) {
        throw new Error(
          "in _getEntityUpdatedXYPositionAndDirection: invalid direction picked from pickFromPossibleDirectionsOnNewBlock"
        );
      }
    }
    return [nextPosition, nextDirection];
  }

  _annealDirection({ gameDirection, visualDirection }) {
    // For example, from (3/2)PI to 0.
    const isTurnDirectionCrossingModulo =
      Math.abs(gameDirection - visualDirection) > Math.PI;

    if (isTurnDirectionCrossingModulo && gameDirection < visualDirection) {
      gameDirection += 2 * Math.PI;
    } else if (
      isTurnDirectionCrossingModulo &&
      gameDirection > visualDirection
    ) {
      visualDirection += 2 * Math.PI;
    }

    const annealedDirectionPreModulo =
      this._DIRECTION_ANNEALING_SPEED * gameDirection +
      (1 - this._DIRECTION_ANNEALING_SPEED) * visualDirection;
    return annealedDirectionPreModulo % (2 * Math.PI);
  }

  _handleRefresh = () => {
    // UPDATING PACMAN XY POSITION

    const [nextPosition, nextDirection] =
      this._getEntityUpdatedXYPositionAndDirection({
        movementDirection: this._pacman.movementDirection,
        currentPosition: this._pacman.position,
        movementAmount: this._PACMAN_MOVEMENT_PER_REFRESH,
        pickFromPossibleDirectionsOnNewBlock: (possibleDirections) => {
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

    // UPDATING PACMAN DIRECTION
    this._pacman.rotationAngleInRadians = this._annealDirection({
      gameDirection: this._pacman.movementDirection.rotationAngleInRadians,
      visualDirection: this._pacman.rotationAngleInRadians,
    });

    // UPDATING PACMAN Z POSITION

    const deltaT = this._GAME_STATE_REFRESH_MS / 1000;
    const newZVelocity =
      this._pacman.zVelocity + this._GRAVITY_ACCELERATION * deltaT;
    const deltaZ = ((newZVelocity + this._pacman.zVelocity) / 2) * deltaT;
    const newZ = Math.max(0, this._pacman.position.z + deltaZ);
    this._pacman.zVelocity = newZ === 0 ? 0 : newZVelocity;
    this._pacman.position.z = newZ;

    // UPDATING GHOST POSITIONS
    this._ghosts.forEach((ghost) => {
      const [nextPosition, nextDirection] =
        this._getEntityUpdatedXYPositionAndDirection({
          movementDirection: ghost.movementDirection,
          currentPosition: ghost.position,
          movementAmount: this._GHOST_MOVEMENT_PER_REFRESH,
          pickFromPossibleDirectionsOnNewBlock: (possibleDirections) => {
            if (possibleDirections.length === 2) {
              // NONE is always included.
              return possibleDirections.find(
                (direction) => direction !== DIRECTIONS.NONE
              );
            }

            // Either forward or 90 degree turns
            const possibleNonReversingNonStationaryDirections =
              possibleDirections.filter((direction) => {
                const isStationary = direction === DIRECTIONS.NONE;
                const isOppositeDirection =
                  direction.i === -ghost.movementDirection.i &&
                  direction.j === -ghost.movementDirection.j;
                return !isOppositeDirection && !isStationary;
              });

            const randomIndex = Math.floor(
              Math.random() * possibleNonReversingNonStationaryDirections.length
            );
            return possibleNonReversingNonStationaryDirections[randomIndex];
          },
        });
      ghost.position = nextPosition;
      ghost.movementDirection = nextDirection;

      ghost.rotationAngleInRadians = this._annealDirection({
        gameDirection: ghost.movementDirection.rotationAngleInRadians,
        visualDirection: ghost.rotationAngleInRadians,
      });
    });

    // EATING UP PELLETS
    if (
      this._matrix[Math.floor(this._pacman.position.i)]?.[
        Math.floor(this._pacman.position.j)
      ] === OBJECTS.PELLET
    ) {
      this._matrix[Math.floor(this._pacman.position.i)][
        Math.floor(this._pacman.position.j)
      ] = OBJECTS.EMPTY;
      // TODO: Update score after eating pellet
    }
    if (
      this._matrix[Math.ceil(this._pacman.position.i)]?.[
        Math.ceil(this._pacman.position.j)
      ] === OBJECTS.PELLET
    ) {
      this._matrix[Math.ceil(this._pacman.position.i)][
        Math.ceil(this._pacman.position.j)
      ] = OBJECTS.EMPTY;
      // TODO: Update score after eating pellet
    }

    // PACMAN-GHOST COLLISION DETECTION
    this._ghosts.forEach((ghost) => {
      const euclideanDistanceFromPacman = Math.sqrt(
        Math.pow(ghost.position.i - this._pacman.position.i, 2) +
          Math.pow(ghost.position.j - this._pacman.position.j, 2) +
          Math.pow(ghost.position.z - this._pacman.position.z, 2)
      );
      const isColliding =
        euclideanDistanceFromPacman <=
        this._PACMAN_HITBOX_RADIUS + this._GHOST_HITBOX_RADIUS;
      if (isColliding) {
        this._placePacmanInStartingPosition();
        this._placeGhostsInStartingPosition();
      }
    });
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
            hasBarrierAboveLeft:
              this._matrix[i - 1]?.[j - 1] === OBJECTS.BARRIER,
            hasBarrierAboveRight:
              this._matrix[i - 1]?.[j + 1] === OBJECTS.BARRIER,
            hasBarrierBelow: this._matrix[i + 1]?.[j] === OBJECTS.BARRIER,
            hasBarrierBelowLeft:
              this._matrix[i + 1]?.[j - 1] === OBJECTS.BARRIER,
            hasBarrierBelowRight:
              this._matrix[i + 1]?.[j + 1] === OBJECTS.BARRIER,
            hasBarrierLeft: this._matrix[i]?.[j - 1] === OBJECTS.BARRIER,
            hasBarrierRight: this._matrix[i]?.[j + 1] === OBJECTS.BARRIER,
          });
        }
      });
    });

    return barriers;
  };

  getPellets = () => {
    const pellets = [];
    const nowMs = Date.now();
    this._matrix.forEach((row, i) => {
      row.forEach((item, j) => {
        if (item === OBJECTS.PELLET) {
          // evenly increases 0 to 1 then wraps back to 0.
          const floatingState =
            ((nowMs + i * 100 + j * 100) % this._PELLET_OSCILLATION_SPEED_MS) /
            this._PELLET_OSCILLATION_SPEED_MS;

          // oscillates between 0 and 1.
          const oscillationState = Math.cos(floatingState * 2 * Math.PI);

          pellets.push({
            x: this._getXfromJ(j),
            y: this._getYfromI(i),
            z:
              this._PELLET_OSCILLATION_HEIGHT * oscillationState -
              0.5 * this._PELLET_OSCILLATION_HEIGHT,
          });
        }
      });
    });
    return pellets;
  };

  getPacman = () => {
    return {
      ...this._pacman,
      position: {
        x: this._getXfromJ(this._pacman.position.j),
        y: this._getYfromI(this._pacman.position.i),
        z: this._pacman.position.z,
      },
    };
  };

  getBoardCenterPosition = () => {
    return {
      x: this._getXfromJ(this._matrix[0].length / 2),
      y: this._getYfromI(this._matrix.length / 2),
      z: 0,
    };
  };

  getGhosts = () => {
    return this._ghosts.map((ghost) => ({
      ...ghost,
      position: {
        x: this._getXfromJ(ghost.position.j),
        y: this._getYfromI(ghost.position.i),
        z: 0,
      },
    }));
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

  _placePacmanInStartingPosition = () => {
    this._pacman = {
      position: {
        i: 1,
        j: 1,
        z: 0,
      },
      zVelocity: 0,
      movementDirection: DIRECTIONS.NONE,
      intendedDirection: DIRECTIONS.NONE,
      rotationAngleInRadians: DIRECTIONS.RIGHT.rotationAngleInRadians,
    };
  };

  handleJumpPressed = () => {
    if (this._pacman.position.z === 0) {
      this._pacman.zVelocity = this._JUMP_INITIAL_VELOCITY;
    }
  };

  _placeGhostsInStartingPosition = () => {
    this._ghosts = [
      {
        position: {
          i: 1,
          j: 24,
          z: 0,
        },
        movementDirection: DIRECTIONS.RIGHT,
        rotationAngleInRadians: DIRECTIONS.RIGHT.rotationAngleInRadians,
      },
      {
        position: {
          i: 1,
          j: 24,
          z: 0,
        },
        movementDirection: DIRECTIONS.RIGHT,
        rotationAngleInRadians: DIRECTIONS.RIGHT.rotationAngleInRadians,
      },
      {
        position: {
          i: 1,
          j: 24,
          z: 0,
        },
        movementDirection: DIRECTIONS.RIGHT,
        rotationAngleInRadians: DIRECTIONS.RIGHT.rotationAngleInRadians,
      },
      {
        position: {
          i: 1,
          j: 24,
          z: 0,
        },
        movementDirection: DIRECTIONS.RIGHT,
        rotationAngleInRadians: DIRECTIONS.RIGHT.rotationAngleInRadians,
      },
    ];
  };
}

const OBJECTS = Object.freeze({
  EMPTY: 0,
  BARRIER: 1,
  PELLET: 2,
  POWER_UP: 3,
});

export const DIRECTIONS = Object.freeze({
  UP: Object.freeze({ j: 0, i: -1, rotationAngleInRadians: Math.PI }),
  DOWN: Object.freeze({ j: 0, i: 1, rotationAngleInRadians: 0 }),
  LEFT: Object.freeze({ j: -1, i: 0, rotationAngleInRadians: 1.5 * Math.PI }),
  RIGHT: Object.freeze({ j: 1, i: 0, rotationAngleInRadians: 0.5 * Math.PI }),
  NONE: Object.freeze({ j: 0, i: 0, rotationAngleInRadians: 0 }), // at the beginning, pacman doesn't have a direction.
});

const INITIAL_MATRIX = [
  new Array(28).fill(OBJECTS.BARRIER),
  [
    OBJECTS.BARRIER,
    ...new Array(12).fill(OBJECTS.PELLET),
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(12).fill(OBJECTS.PELLET),
    OBJECTS.BARRIER,
  ],
  [
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
  ],
  [
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
  ],
  [
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
  ],

  [OBJECTS.BARRIER, ...new Array(26).fill(OBJECTS.PELLET), OBJECTS.BARRIER],

  [
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(8).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
  ],
  [
    OBJECTS.BARRIER,
    ...new Array(6).fill(OBJECTS.PELLET),
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(4).fill(OBJECTS.PELLET),
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(4).fill(OBJECTS.PELLET),
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(6).fill(OBJECTS.PELLET),
    OBJECTS.BARRIER,
  ],
  [
    ...new Array(6).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(6).fill(OBJECTS.BARRIER),
  ],
  [
    ...new Array(5).fill(OBJECTS.EMPTY),
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
    ...new Array(5).fill(OBJECTS.EMPTY),
  ],
  [
    ...new Array(5).fill(OBJECTS.EMPTY),
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(10).fill(OBJECTS.EMPTY),
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
    ...new Array(5).fill(OBJECTS.EMPTY),
  ],
  [
    ...new Array(5).fill(OBJECTS.EMPTY),
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(10).fill(OBJECTS.EMPTY),
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
    ...new Array(5).fill(OBJECTS.EMPTY),
  ],
  [
    ...new Array(5).fill(OBJECTS.EMPTY),
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(10).fill(OBJECTS.EMPTY),
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
    ...new Array(5).fill(OBJECTS.EMPTY),
  ],
  [
    ...new Array(5).fill(OBJECTS.EMPTY),
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(14).fill(OBJECTS.EMPTY),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
    ...new Array(5).fill(OBJECTS.EMPTY),
  ],
  [
    ...new Array(5).fill(OBJECTS.EMPTY),
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(14).fill(OBJECTS.EMPTY),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
    ...new Array(5).fill(OBJECTS.EMPTY),
  ],
  [
    ...new Array(5).fill(OBJECTS.EMPTY),
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(10).fill(OBJECTS.EMPTY),
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
    ...new Array(5).fill(OBJECTS.EMPTY),
  ],
  [
    ...new Array(5).fill(OBJECTS.EMPTY),
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(10).fill(OBJECTS.EMPTY),
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
    ...new Array(5).fill(OBJECTS.EMPTY),
  ],
  [
    ...new Array(5).fill(OBJECTS.EMPTY),
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(10).fill(OBJECTS.EMPTY),
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
    ...new Array(5).fill(OBJECTS.EMPTY),
  ],
  [
    ...new Array(5).fill(OBJECTS.EMPTY),
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
    ...new Array(5).fill(OBJECTS.EMPTY),
  ],
  [
    ...new Array(6).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(6).fill(OBJECTS.BARRIER),
  ],
  [
    OBJECTS.BARRIER,
    ...new Array(6).fill(OBJECTS.PELLET),
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(4).fill(OBJECTS.PELLET),
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(4).fill(OBJECTS.PELLET),
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(6).fill(OBJECTS.PELLET),
    OBJECTS.BARRIER,
  ],
  [
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(8).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
  ],
  [OBJECTS.BARRIER, ...new Array(26).fill(OBJECTS.PELLET), OBJECTS.BARRIER],
  [
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
  ],
  [
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
  ],
  [
    OBJECTS.BARRIER,
    OBJECTS.PELLET,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(2).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(5).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    ...new Array(4).fill(OBJECTS.BARRIER),
    OBJECTS.PELLET,
    OBJECTS.BARRIER,
  ],
  [
    OBJECTS.BARRIER,
    ...new Array(12).fill(OBJECTS.PELLET),
    ...new Array(2).fill(OBJECTS.BARRIER),
    ...new Array(12).fill(OBJECTS.PELLET),
    OBJECTS.BARRIER,
  ],
  new Array(28).fill(OBJECTS.BARRIER),
];
