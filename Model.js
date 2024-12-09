export class Model {
	// Constructor: initializes the model object with the given parameters.
	constructor(name, uSteps, vSteps) {
		this.name = name; // Model name
		this.uSteps = uSteps || 50; // Number of steps in U (default is 50)
		this.vSteps = vSteps || 50; // Number of steps in V (default is 50)
		this.uLines = []; // U lines
		this.vLines = []; // V lines
		this.vertices = []; // Model vertices
		this.indices = []; // Indices for connecting vertices
		this.normals = []; // Surface normals
	}

	CreateSurfaceData() {
		this.generateUVLines();
		this.generateVertices();
		this.generateIndices();
		this.generateNormals();
	}

	// Generates UV lines (reference points for the surface).
	generateUVLines() {
		const uMin = 0;
		const uMax = 14.5;
		const vMin = 0;
		const vMax = 1.5 * Math.PI;

		const du = (uMax - uMin) / this.uSteps; // Step size in U
		const dv = (vMax - vMin) / this.vSteps; // Step size in V

		// Generate U lines
		for (let u = uMin; u <= uMax; u += du) {
			const uLine = [];
			for (let v = vMin; v <= vMax; v += dv) {
				// Calculate Wellenkugel coordinates
				let x = u * Math.cos(Math.cos(u)) * Math.cos(v);
				let y = u * Math.cos(Math.cos(u)) * Math.sin(v);
				let z = u * Math.sin(Math.cos(u));

				uLine.push([x, y, z]);
			}
			this.uLines.push(uLine); // Add U line
		}

		// Generate V lines
		for (let vIndex = 0; vIndex <= this.vSteps; vIndex++) {
			const vLine = [];
			for (let uIndex = 0; uIndex <= this.uSteps; uIndex++) {
				vLine.push(this.uLines[uIndex][vIndex]);
			}
			this.vLines.push(vLine); // Add V line
		}
	}

	// Converts UV lines into a vertex array.
	generateVertices() {
		this.vertices = this.uLines.flat(2); // Flatten into a 1D array
	}

	// Generates indices to connect vertices into triangles.
	generateIndices() {
		this.indices = [];
		for (let u = 0; u < this.uSteps; u++) {
			for (let v = 0; v < this.vSteps; v++) {
				const topLeft = u * (this.vSteps + 1) + v;
				const topRight = topLeft + 1;
				const bottomLeft = (u + 1) * (this.vSteps + 1) + v;
				const bottomRight = bottomLeft + 1;

				this.indices.push(topLeft, bottomLeft, topRight); // First triangle
				this.indices.push(topRight, bottomLeft, bottomRight); // Second triangle
			}
		}
	}

	// Generates normals for the surface.
	generateNormals() {
		const normals = new Array(this.vertices.length).fill(0); // Initialize normals array

		for (let i = 0; i < this.indices.length; i += 3) {
			const i1 = this.indices[i] * 3;
			const i2 = this.indices[i + 1] * 3;
			const i3 = this.indices[i + 2] * 3;

			const v1 = this.vertices.slice(i1, i1 + 3);
			const v2 = this.vertices.slice(i2, i2 + 3);
			const v3 = this.vertices.slice(i3, i3 + 3);

			const normal = this.calculateFaceNormal(v1, v2, v3); // Calculate face normal

			for (let j = 0; j < 3; j++) {
				const idx = this.indices[i + j] * 3;
				normals[idx] += normal[0];
				normals[idx + 1] += normal[1];
				normals[idx + 2] += normal[2];
			}
		}

		this.normals = this.normalizeVectors(normals); // Normalize the normals
	}

	// Calculates the normal of a triangular face.
	calculateFaceNormal(v1, v2, v3) {
		const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]]; // First edge
		const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]]; // Second edge

		// Cross product to get the normal
		return [
			edge1[1] * edge2[2] - edge1[2] * edge2[1],
			edge1[2] * edge2[0] - edge1[0] * edge2[2],
			edge1[0] * edge2[1] - edge1[1] * edge2[0],
		];
	}

	// Normalizes a vector array.
	normalizeVectors(vectors) {
		const normalized = [];
		for (let i = 0; i < vectors.length; i += 3) {
			const length = Math.sqrt(
				vectors[i] ** 2 + vectors[i + 1] ** 2 + vectors[i + 2] ** 2,
			);
			if (length > 0) {
				normalized.push(
					vectors[i] / length,
					vectors[i + 1] / length,
					vectors[i + 2] / length,
				);
			} else {
				normalized.push(0, 0, 0); // Handle zero-length vectors
			}
		}
		return normalized;
	}

	// Initializes WebGL buffers.
	initBuffer(gl) {
		this.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(this.vertices),
			gl.STATIC_DRAW,
		);

		this.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(
			gl.ELEMENT_ARRAY_BUFFER,
			new Uint16Array(this.indices),
			gl.STATIC_DRAW,
		);

		this.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(this.normals),
			gl.STATIC_DRAW,
		);
	}

	// Draws the model.
	Draw(gl, program) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(program.vertexAttrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(program.vertexAttrib);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.vertexAttribPointer(program.normalAttrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(program.normalAttrib);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
	}
}