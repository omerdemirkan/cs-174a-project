class Game {
  constructor({
    gameStateRefreshRate = 60,
    pacmanBlocksPerSecondSpeed = 3,
    ghostBlocksPerSecondSpeed = 2,
  }) {
    this._GAME_STATE_REFRESH_MS = 1000 * (1 / gameStateRefreshRate);
    this._PACMAN_MOVEMENT_PER_REFRESH = pacmanBlocksPerSecondSpeed / 1000;
    this._GHOST_MOVEMENT_PER_REFRESH = ghostBlocksPerSecondSpeed / 1000;

    this._timeout = null;
  }

  _handleRefresh = () => {
    // TODO: handle refreshing
  };

  startGame = () => {
    if (!this.timeout) {
      this.timeout = setTimeout(
        this._handleRefresh,
        this._GAME_STATE_REFRESH_MS
      );
    }
  };

  pauseGame = () => {
    clearTimeout(this.timeout);
    this.timeout = null;
  };
}
