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
      test: new Material(new defs.Phong_Shader(), {
        ambient: 0.4,
        diffusivity: 0.6,
        color: hex_color("#ffffff"),
      }),
    };

    this.initial_camera_location = Mat4.look_at(
      vec3(25, 15, 50),
      vec3(25, 15, 0),
      vec3(0, 1, 0)
    );
    this.game = new Game();
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

  right_scaling(context, program_state, barrier) {
    let x = (barrier.x - 1/3);
    let y = (barrier.y - 1/3);
    let z = barrier.z;
    let x_mod = 0.0;
    let hex = [[0,0,0],
               [0,1,0],
               [0,0,0]];
    
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
    if (barrier.hasBarrierAboveLeft && barrier.hasBarrierAbove && barrier.hasBarrierLeft) {
      hex[0][2] = 1;
    }
    if (barrier.hasBarrierBelowLeft && barrier.hasBarrierBelow && barrier.hasBarrierLeft) {
      hex[0][0] = 1;
    }
    if (barrier.hasBarrierAboveRight && barrier.hasBarrierAbove && barrier.hasBarrierRight) {
      hex[2][2] = 1;
    }
    if (barrier.hasBarrierBelowRight && barrier.hasBarrierBelow && barrier.hasBarrierRight) {
      hex[2][0] = 1;
    }


    for (const i of Array(3).keys()) {
      let y_mod = 0.0;
      for(const j of Array(3).keys()) {
        if (hex[i][j]) {
          this.shapes.box.draw(
            context,
            program_state,
            Mat4.translation((x + x_mod) * 2, (y + y_mod) * 2, z).times(Mat4.scale(1/3, 1/3, 1)),
            this.materials.test.override({ color: barrier.hasBarrierAbove && barrier.hasBarrierBelow && barrier.hasBarrierLeft && barrier.hasBarrierRight ? hex_color("#FF0000") : hex_color("#ffffff") })
          );
        }
        y_mod += 1/3;
      }
      x_mod += 1/3;
    }
  }

  display(context, program_state) {
    super.display(context, program_state);
    // display():  Called once per frame of animation.
    // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
    if (!context.scratchpad.controls) {
      this.children.push(
        (context.scratchpad.controls = new defs.Movement_Controls())
      );
      // Define the global camera and projection matrices, which are stored in program_state.
      program_state.set_camera(this.initial_camera_location);
    }

    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4,
      context.width / context.height,
      0.1,
      1000
    );

    const light_position = vec4(0, 0, 50, 1);
    // The parameters of the Light are: position, color, size
    program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

    // TODO:  Fill in matrix operations and drawing code to draw the solar system scene (Requirements 3 and 4)
    const t = program_state.animation_time / 1000,
      dt = program_state.animation_delta_time / 1000;
    const yellow = hex_color("#fac91a");

    const playerState = this.game.getPacman();

    this.shapes.box.draw(
      context,
      program_state,
      Mat4.translation(
        playerState.position.x * 2,
        playerState.position.y * 2,
        playerState.position.z * 2
      ),
      this.materials.test.override({ color: yellow })
    );

    const colors = ["#FF0000", "#FFC0CB", "#0000FF", "#FFA500"]
    this.game.getGhosts().forEach((ghost, index) => {
      this.shapes.box.draw(
        context,
        program_state,
        Mat4.translation(
          ghost.position.x * 2,
          ghost.position.y * 2,
          ghost.position.z * 2
        ),
        this.materials.test.override({ color: hex_color(colors[index]) })
      );
    });

    this.game.getBarriers().forEach((barrier) => {
      this.right_scaling(context, program_state, barrier);
    });
  }
}
