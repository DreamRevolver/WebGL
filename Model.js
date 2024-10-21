class Model {
	constructor(name) {
		this.name = name;
		this.uLines = [];
		this.vLines = [];
		this.vertexBuffer = null;
	}

	CreateSurfaceData() {
		const uMin = 0;
		const uMax = 14.5;
		const vMin = 0;
		const vMax = 1.5 * Math.PI;
		const uSteps = 150;
		const vSteps = 150;

		const du = (uMax - uMin) / uSteps;
		const dv = (vMax - vMin) / vSteps;

		// Generate U and V lines
		for (let u = uMin; u <= uMax; u += du) {
			const uLine = [];
			for (let v = vMin; v <= vMax; v += dv) {

				//Wellenkugel parameters
				let x = u * Math.cos(Math.cos(u)) * Math.cos(v);
            	let y = u * Math.cos(Math.cos(u)) * Math.sin(v);
            	let z = u * Math.sin(Math.cos(u));

				uLine.push([x, y, z]);
			}
			this.uLines.push(uLine);
		}

		// Generate V lines by transposing the uLines array
		for (let vIndex = 0; vIndex <= vSteps; vIndex++) {
			const vLine = [];
			for (let uIndex = 0; uIndex <= uSteps; uIndex++) {
				vLine.push(this.uLines[uIndex][vIndex]);
			}
			this.vLines.push(vLine);
		}
	}

	getVertices() {
		const vertices = [];
		for (const uLine of this.uLines) {
			for (const point of uLine) {
				vertices.push(...point);
			}
		}
		for (const vLine of this.vLines) {
			for (const point of vLine) {
				vertices.push(...point);
			}
		}
		return vertices;
	}

	BufferData(gl) {
		const vertices = this.getVertices();
		this.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		this.count = vertices.length / 3;
	}

	Draw(gl, program) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(program.vertexAttrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(program.vertexAttrib);

		const pointsPerLine = this.uLines[0].length;
		const totalUPoints = this.uLines.length * pointsPerLine;

		//U lines
		for (let i = 0; i < this.uLines.length; i++) {
			gl.drawArrays(gl.LINE_STRIP, i * pointsPerLine, pointsPerLine);
		}

		//V lines
		for (let i = 0; i < this.vLines.length; i++) {
			gl.drawArrays(
				gl.LINE_STRIP,
				totalUPoints + i * this.uLines.length,
				this.uLines.length,
			);
		}
	}
}