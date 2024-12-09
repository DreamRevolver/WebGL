import { Model } from "./Model.js";
import { ShaderProgram } from "./ShaderProgram.js";

let gl;
let surface;
let program;
let ball;

// Retrieves U and V step values from the UI controls.
function getUVSteps() {
	return {
		u: Number.parseInt(document.getElementById("u-stepper").value, 10),
		v: Number.parseInt(document.getElementById("v-stepper").value, 10),
	};
}

// Initializes the surface model with the current U and V steps.
function initSurface() {
	const { u, v } = getUVSteps();
	surface = new Model("Surface", u, v);
	surface.CreateSurfaceData();
	surface.initBuffer(gl);
}

// Initializes the shader program with vertex and fragment shaders.
function initShaderProgram() {
	program = new ShaderProgram("Basic");
	program.init(gl, vertexShaderSource, fragmentShaderSource);
	program.use(gl);
}

// Sets up UI controls for stepper inputs and their behavior.
function setupUIControls() {
	const stepperTypes = ["u", "v"];

	stepperTypes.forEach((type) => {
		const stepper = document.getElementById(`${type}-stepper`);
		const counter = document.getElementById(`${type}-counter`);

		if (!stepper) {
			console.error(`Stepper element with id '${type}-stepper' not found`);
			return;
		}

		// Updates step value display and reinitializes the surface on input change.
		stepper.addEventListener("input", (e) => {
			if (counter) {
				counter.textContent = e.target.value;
			} else {
				console.warn(`Counter element with id '${type}-counter' not found`);
			}
			initSurface();
			draw();
		});
	});
}

// Animates the light source over time in a circular motion.
function animateLight(time) {
	const radius = 10.0;
	const speed = 0.001;
	const x = radius * Math.cos(time * speed); // Light's X position
	const z = radius * Math.sin(time * speed); // Light's Z position
	const y = 5.0; // Light's Y position

	if (program) {
		gl.uniform3f(program.lightDirectionUni, x, y, z); // Update light direction
		draw();
	}
	requestAnimationFrame(animateLight); // Request next animation frame
}

// Draws the scene, including setting up projection and model-view matrices.
function draw() {
	gl.clearColor(1, 1, 1, 1); // Set background color to white
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear buffers

	const projection = m4.perspective(Math.PI / 8, 1, 1, 100); // Perspective projection matrix
	const modelView = ball.getViewMatrix(); // View matrix from trackball interaction

	const rotateToPointZero = m4.axisRotation(
		[Math.SQRT1_2, Math.SQRT1_2, 0],
		0.7,
	); // Rotation matrix for alignment
	const translateToPointZero = m4.translation(0, 0, -80); // Translation matrix

	const matAcc0 = m4.multiply(rotateToPointZero, modelView); // Combined rotation and view matrix
	const matAcc1 = m4.multiply(translateToPointZero, matAcc0); // Final model-view matrix

	const modelViewProjection = m4.multiply(projection, matAcc1); // Model-view-projection matrix
	gl.uniformMatrix4fv(program.matrixUni, false, modelViewProjection); // Pass to shader

	const normalMatrix = m4.transpose(m4.inverse(matAcc1)); // Normal matrix
	gl.uniformMatrix4fv(program.normalMatrixUni, false, normalMatrix); // Pass to shader

	// Set lighting and material properties
	gl.uniform3fv(program.viewPositionUni, [0.0, 0.0, 5.0]); // Camera position
	gl.uniform3f(program.ambientColorUni, 0.2, 0.2, 0.2); // Ambient light
	gl.uniform3f(program.diffuseColorUni, 0.7, 0.7, 0.7); // Diffuse light
	gl.uniform3f(program.specularColorUni, 1.0, 1.0, 1.0); // Specular light
	gl.uniform1f(program.shininessUni, 32.0); // Shininess factor

	surface.Draw(gl, program); // Draw the surface
}

// Initializes WebGL, the shader program, surface model, and UI controls.
function init() {
	try {
		const canvas = document.querySelector("canvas");
		gl = canvas.getContext("webgl");
		if (!gl) {
			throw "Browser does not support WebGL";
		}
		ball = new TrackballRotator(canvas, draw, 0); // Enable trackball rotation

		initShaderProgram(); // Initialize shaders
		initSurface(); // Initialize the surface model
		gl.enable(gl.DEPTH_TEST); // Enable depth testing

		setupUIControls(); // Set up UI controls
		draw(); // Initial draw
		animateLight(0); // Start light animation
	} catch (e) {
		console.error(`Initialization error: ${e}`); // Log initialization errors
		const errorMessage = document.createElement("p");
		errorMessage.textContent = `Sorry, could not initialize the WebGL graphics context: ${e}`;
		document.body.appendChild(errorMessage); // Display error message
	}
}

// Waits for the DOM to fully load before initializing.
document.addEventListener("DOMContentLoaded", init);
