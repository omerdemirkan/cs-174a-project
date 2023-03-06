import { defs, tiny } from "./examples/common.js";
import { Game, DIRECTIONS } from "./Game.js";

const {
  Vector,
  Vector3,
  vec,
  vec3,
  vec4,
  color,
  hex_color,
  Shader,
  Matrix,
  Mat4,
  Light,
  Shape,
  Material,
  Scene,
} = tiny;
const colors = { blue: hex_color("#00008B"), white: hex_color("#FFFFFF") };
export class GameScene extends Scene {
  constructor() {
    // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
    super();

    // At the beginning of our program, load one of each of these shape definitions onto the GPU.
    this.shapes = {
      box: new defs.Cube(),
      sphere: new defs.Subdivision_Sphere(4),
    };

    // *** Materials
    this.materials = {
      wall_mat: new Material(new defs.Phong_Shader(5), {
        ambient: 0.25,
        diffusivity: 0.5,
        color: hex_color("#ffffff"),
      }),
      pacman_mat: new Material(new defs.Phong_Shader(5), {
        ambient: 0.5,
        diffusivity: 0.5,
        color: hex_color("#ffffff"),
      }),
      ghost_mat: new Material(new defs.Phong_Shader(5), {
        ambient: 1,
        diffusivity: 0,
        color: hex_color("#ffffff"),
      }),
    };

    this.initial_camera_location = Mat4.look_at(
      vec3(25, 15, 50),
      vec3(25, 15, 0),
      vec3(0, 1, 0)
    );
    this.game = new Game();
    this.barrierCubes = wall_cuber(this.game.getBarriers());
    this.colorCube = color_cube(this.barrierCubes);
    console.log(this.colorCube);
    this.CAMERA_ANNEAL_SPEED = 0.1; // Lower = smoother camera movement
    this.PACMAN_CAMERA_WEIGHT = 0.3; // Lower = camera tracks pacman more.
  }

  make_control_panel() {
    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    this.key_triggered_button(
      "Start Game",
      ["Control", "a"],
      this.game.startGame
    );
    this.new_line();
    this.key_triggered_button("Up", ["w"], () =>
      this.game.handleChangeIntendedDirection(DIRECTIONS.UP)
    );
    this.new_line();
    this.key_triggered_button("Left", ["a"], () =>
      this.game.handleChangeIntendedDirection(DIRECTIONS.LEFT)
    );
    this.key_triggered_button("Right", ["d"], () =>
      this.game.handleChangeIntendedDirection(DIRECTIONS.RIGHT)
    );
    this.new_line();
    this.key_triggered_button("Down", ["s"], () =>
      this.game.handleChangeIntendedDirection(DIRECTIONS.DOWN)
    );
    this.key_triggered_button("Jump", [" "], () =>
      this.game.handleJumpPressed()
    );
  }

  color_algo(hex, i, j) {
    let to_paint = colors.blue;
    if (hex[i + 1] != undefined && hex[i - 1] != undefined) {
      if (hex[i + 1][j] == 0 || (hex[i - 1][j] == 0 && !(i == 0 && j == 0))) {
        to_paint = colors.white;
      }
    }
    if (hex[i][j + 1] == 0 || hex[i][j - 1] == 0) {
      to_paint = colors.white;
    }
    if (i == 1 && j == 1) {
      if (
        (hex[i][j + 1] && hex[i + 1][j] && !hex[i + 1][j + 1]) ||
        (hex[i][j - 1] && hex[i + 1][j] && !hex[i - 1][j + 1])
      ) {
        to_paint = colors.white;
      }
    }
    return to_paint;
  }

  wall_builder(context, program_state, barrier, index) {
    const startMs = Date.now();

    let x = barrier.x - 1 / 3;
    let y = barrier.y - 1 / 3;
    let z = barrier.z;
    if (this.barrierCubes[index][0][0]) {
      this.shapes.box.draw(
        context,
        program_state,
        Mat4.translation((x + 0) * 2, (y + 0) * 2, z).times(
          Mat4.scale(1 / 3, 1 / 3, 1)
        ),
        this.materials.wall_mat.override({
          color: this.colorCube[index][0][0],
        })
      );
    }
    if (this.barrierCubes[index][0][1]) {
      this.shapes.box.draw(
        context,
        program_state,
        Mat4.translation((x + 0) * 2, (y + 1 / 3) * 2, z).times(
          Mat4.scale(1 / 3, 1 / 3, 1)
        ),
        this.materials.wall_mat.override({
          color: this.colorCube[index][0][1],
        })
      );
    }
    if (this.barrierCubes[index][0][2]) {
      this.shapes.box.draw(
        context,
        program_state,
        Mat4.translation((x + 0) * 2, (y + 2 / 3) * 2, z).times(
          Mat4.scale(1 / 3, 1 / 3, 1)
        ),
        this.materials.wall_mat.override({
          color: this.colorCube[index][0][2],
        })
      );
    }

    if (this.barrierCubes[index][1][0]) {
      this.shapes.box.draw(
        context,
        program_state,
        Mat4.translation((x + 1 / 3) * 2, (y + 0) * 2, z).times(
          Mat4.scale(1 / 3, 1 / 3, 1)
        ),
        this.materials.wall_mat.override({
          color: this.colorCube[index][1][0],
        })
      );
    }
    if (this.barrierCubes[index][1][1]) {
      this.shapes.box.draw(
        context,
        program_state,
        Mat4.translation((x + 1 / 3) * 2, (y + 1 / 3) * 2, z).times(
          Mat4.scale(1 / 3, 1 / 3, 1)
        ),
        this.materials.wall_mat.override({
          color: this.colorCube[index][1][1],
        })
      );
    }
    if (this.barrierCubes[index][1][2]) {
      this.shapes.box.draw(
        context,
        program_state,
        Mat4.translation((x + 1 / 3) * 2, (y + 2 / 3) * 2, z).times(
          Mat4.scale(1 / 3, 1 / 3, 1)
        ),
        this.materials.wall_mat.override({
          color: this.colorCube[index][1][2],
        })
      );
    }

    if (this.barrierCubes[index][2][0]) {
      this.shapes.box.draw(
        context,
        program_state,
        Mat4.translation((x + 2 / 3) * 2, (y + 0) * 2, z).times(
          Mat4.scale(1 / 3, 1 / 3, 1)
        ),
        this.materials.wall_mat.override({
          color: this.colorCube[index][2][0],
        })
      );
    }
    if (this.barrierCubes[index][2][1]) {
      this.shapes.box.draw(
        context,
        program_state,
        Mat4.translation((x + 2 / 3) * 2, (y + 1 / 3) * 2, z).times(
          Mat4.scale(1 / 3, 1 / 3, 1)
        ),
        this.materials.wall_mat.override({
          color: this.colorCube[index][2][1],
        })
      );
    }
    if (this.barrierCubes[index][2][2]) {
      this.shapes.box.draw(
        context,
        program_state,
        Mat4.translation((x + 2 / 3) * 2, (y + 2 / 3) * 2, z).times(
          Mat4.scale(1 / 3, 1 / 3, 1)
        ),
        this.materials.wall_mat.override({
          color: this.colorCube[index][2][2],
        })
      );
    }

    const endMs = Date.now();
    //console.log("Rendering Time: ", endMs - startMs, "Ms")
  }

  display(context, program_state) {
    super.display(context, program_state);
    const playerState = this.game.getPacman();

    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4,
      context.width / context.height,
      0.1,
      1000
    );

    const futureCameraX =
      this.PACMAN_CAMERA_WEIGHT * playerState.position.x +
      (1 - this.PACMAN_CAMERA_WEIGHT) * this.game.getBoardCenterPosition().x;
    const futureCameraY =
      this.PACMAN_CAMERA_WEIGHT * playerState.position.y +
      (1 - this.PACMAN_CAMERA_WEIGHT) * this.game.getBoardCenterPosition().y;

    if (!this.currentCameraX) {
      this.currentCameraX = futureCameraX;
      this.currentCameraY = futureCameraY;
    }

    this.currentCameraX =
      this.CAMERA_ANNEAL_SPEED * futureCameraX +
      (1 - this.CAMERA_ANNEAL_SPEED) * this.currentCameraX;
    this.currentCameraY =
      this.CAMERA_ANNEAL_SPEED * futureCameraY +
      (1 - this.CAMERA_ANNEAL_SPEED) * this.currentCameraY;

    const wsToEsTransformation = Mat4.translation(
      // Sorry for these magic numbers, they just seem to work with
      // the camera angle.
      this.currentCameraX + 6,
      this.currentCameraY - 15,
      25
    ).times(Mat4.rotation(0.7, 1, 0, 0));

    program_state.set_camera(Mat4.inverse(wsToEsTransformation));

    const yellow = hex_color("#fac91a");
    const colors = ["#FF0000", "#FFC0CB", "#0000FF", "#FFA500"];
    let player_light = vec4(
      playerState.position.x * 2,
      playerState.position.y * 2,
      playerState.position.z * 2,
      1
    );
    // The parameters of the Light are: position, color, size
    program_state.lights = [new Light(player_light, yellow, 50)];
    this.game.getGhosts().forEach((ghost, index) => {
      let ghost_light = vec4(
        ghost.position.x * 2,
        ghost.position.y * 2,
        ghost.position.z * 2,
        1
      );
      program_state.lights.push(
        new Light(ghost_light, hex_color(colors[index]), 50)
      );
    });

    // TODO:  Fill in matrix operations and drawing code to draw the solar system scene (Requirements 3 and 4)
    const t = program_state.animation_time / 1000,
      dt = program_state.animation_delta_time / 1000;

    this.shapes.box.draw(
      context,
      program_state,
      Mat4.translation(
        playerState.position.x * 2,
        playerState.position.y * 2,
        playerState.position.z * 2
      ).times(Mat4.rotation(playerState.rotationAngleInRadians, 0, 0, 1)),
      this.materials.pacman_mat.override({ color: yellow })
    );

    this.game.getGhosts().forEach((ghost, index) => {
      this.shapes.box.draw(
        context,
        program_state,
        Mat4.translation(
          ghost.position.x * 2,
          ghost.position.y * 2,
          ghost.position.z * 2
        ).times(Mat4.rotation(ghost.rotationAngleInRadians, 0, 0, 1)),
        this.materials.ghost_mat.override({ color: hex_color(colors[index]) })
      );
    });
    this.game.getBarriers().forEach((barrier, index) => {
      // NOTE: This seemed to cause a pretty big performance hit.
      // Let's troubleshoot it and re-introduce it. For now,
      // I've replaced it with scaled down blocks.
      this.wall_builder(context, program_state, barrier, index);
    });

    this.game.getPellets().forEach((pellet) => {
      this.shapes.box.draw(
        context,
        program_state,
        Mat4.translation(pellet.x * 2, pellet.y * 2, pellet.z * 2).times(
          Mat4.scale(0.1, 0.1, 0.1)
        ),
        this.materials.ghost_mat
      );
    });
  }
}

function wall_cuber(barriers) {
  let barrierCubes = [];
  barriers.forEach((barrier) => {
    let hex = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ];
    if (barrier.hasBarrierAbove) {
      hex[1][2] = 1;
    }
    if (barrier.hasBarrierRight) {
      hex[2][1] = 1;
    }
    if (barrier.hasBarrierBelow) {
      hex[1][0] = 1;
    }
    if (barrier.hasBarrierLeft) {
      hex[0][1] = 1;
    }
    if (
      barrier.hasBarrierAboveLeft &&
      barrier.hasBarrierAbove &&
      barrier.hasBarrierLeft
    ) {
      hex[0][2] = 1;
    }
    if (
      barrier.hasBarrierBelowLeft &&
      barrier.hasBarrierBelow &&
      barrier.hasBarrierLeft
    ) {
      hex[0][0] = 1;
    }
    if (
      barrier.hasBarrierAboveRight &&
      barrier.hasBarrierAbove &&
      barrier.hasBarrierRight
    ) {
      hex[2][2] = 1;
    }
    if (
      barrier.hasBarrierBelowRight &&
      barrier.hasBarrierBelow &&
      barrier.hasBarrierRight
    ) {
      hex[2][0] = 1;
    }
    barrierCubes.push(hex);
  });
  return barrierCubes;
}

function color_cube(barrierCube) {
  let color_cube = [];
  barrierCube.forEach((barrier) => {
    let hex = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (const i of Array(3).keys()) {
      for (const j of Array(3).keys()) {
        hex[i][j] = color_algo(barrier, i, j);
      }
    }
    color_cube.push(hex);
  });
  return color_cube;
}

function color_algo(hex, i, j) {
  let to_paint = colors.blue;
  if (hex[i + 1] != undefined && hex[i - 1] != undefined) {
    if (hex[i + 1][j] == 0 || (hex[i - 1][j] == 0 && !(i == 0 && j == 0))) {
      to_paint = colors.white;
    }
  }
  if (hex[i][j + 1] == 0 || hex[i][j - 1] == 0) {
    to_paint = colors.white;
  }
  if (i == 1 && j == 1) {
    if (
      (hex[i][j + 1] && hex[i + 1][j] && !hex[i + 1][j + 1]) ||
      (hex[i][j - 1] && hex[i + 1][j] && !hex[i - 1][j + 1]) ||
      (hex[i][j - 1] && hex[i - 1][j] && !hex[i - 1][j - 1]) ||
      (hex[i][j - 1] && hex[i + 1][j] && !hex[i + 1][j - 1])
    ) {
      to_paint = colors.white;
    }
  }
  return to_paint;
}
