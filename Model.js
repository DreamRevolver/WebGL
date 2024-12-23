export class Model {
	constructor(name, uSteps, vSteps) {
		this.name = name;
		this.uSteps = uSteps || 50; // Default to 50 if not provided
		this.vSteps = vSteps || 50; // Default to 50 if not provided
		this.uLines = [];
		this.vLines = [];
		this.vertices = [];
		this.indices = [];
		this.normals = [];
		this.texCoords = [];
		this.tangents = [];
		this.textures = {};
		this.rotationCenter = { u: 0.5, v: 0.5 };
		this.rotationAngle = 0;
	}

	createSurfaceData() {
		this.generateUVLines();
		this.generateVertices();
		this.generateIndices();
		this.generateNormals();
		this.generateTexCoords();
		this.generateTangents();
	}

	generateUVLines() {
		const uMin = 0;
		const uMax = 14.5;
		const vMin = 0;
		const vMax = 1.5 * Math.PI;

		const du = (uMax - uMin) / this.uSteps; // Step size in U
		const dv = (vMax - vMin) / this.vSteps; // Step size in V

		// Generate U lines
		for (let uIndex = 0; uIndex <= this.uSteps; uIndex++) {
			const u = uMin + uIndex * du;
			const uLine = [];
			for (let vIndex = 0; vIndex <= this.vSteps; vIndex++) {
				const v = vMin + vIndex * dv;
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
			const vLine = this.uLines.map((uLine) => uLine[vIndex]);
			this.vLines.push(vLine);
		}
	}

	generateVertices() {
		this.vertices = this.uLines.flat(2);
	}

	generateIndices() {
		this.indices = [];
		for (let u = 0; u < this.uSteps; u++) {
			for (let v = 0; v < this.vSteps; v++) {
				const topLeft = u * (this.vSteps + 1) + v;
				const topRight = topLeft + 1;
				const bottomLeft = (u + 1) * (this.vSteps + 1) + v;
				const bottomRight = bottomLeft + 1;

				this.indices.push(topLeft, bottomLeft, topRight);
				this.indices.push(topRight, bottomLeft, bottomRight);
			}
		}
	}

	generateNormals() {
		const normals = new Array(this.vertices.length).fill(0);

		for (let i = 0; i < this.indices.length; i += 3) {
			const i1 = this.indices[i] * 3;
			const i2 = this.indices[i + 1] * 3;
			const i3 = this.indices[i + 2] * 3;

			const v1 = this.vertices.slice(i1, i1 + 3);
			const v2 = this.vertices.slice(i2, i2 + 3);
			const v3 = this.vertices.slice(i3, i3 + 3);

			const normal = this.calculateFaceNormal(v1, v2, v3);

			for (let j = 0; j < 3; j++) {
				const idx = this.indices[i + j] * 3;
				normals[idx] += normal[0];
				normals[idx + 1] += normal[1];
				normals[idx + 2] += normal[2];
			}
		}

		this.normals = this.normalizeVectors(normals);
	}

	calculateFaceNormal(v1, v2, v3) {
		const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
		const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];

		return [
			edge1[1] * edge2[2] - edge1[2] * edge2[1],
			edge1[2] * edge2[0] - edge1[0] * edge2[2],
			edge1[0] * edge2[1] - edge1[1] * edge2[0],
		];
	}

	generateTexCoords() {
		for (let uIndex = 0; uIndex <= this.uSteps; uIndex++) {
			for (let vIndex = 0; vIndex <= this.vSteps; vIndex++) {
				this.texCoords.push(uIndex / this.uSteps, vIndex / this.vSteps);
			}
		}
	}

	generateTangents() {
		for (let uIndex = 0; uIndex <= this.uSteps; uIndex++) {
			for (let vIndex = 0; vIndex <= this.vSteps; vIndex++) {
				this.tangents.push(1, 0, 0);
			}
		}
	}

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
				normalized.push(0, 0, 0);
			}
		}
		return normalized;
	}

	loadTexture(gl, url) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		const level = 0;
		const internalFormat = gl.RGBA;
		const width = 1;
		const height = 1;
		const border = 0;
		const srcFormat = gl.RGBA;
		const srcType = gl.UNSIGNED_BYTE;
		const pixel = new Uint8Array([0, 0, 0, 0]);
		gl.texImage2D(
			gl.TEXTURE_2D,
			level,
			internalFormat,
			width,
			height,
			border,
			srcFormat,
			srcType,
			pixel,
		);

		const image = new Image();
		image.onload = () => {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(
				gl.TEXTURE_2D,
				level,
				internalFormat,
				srcFormat,
				srcType,
				image,
			);

			if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
				gl.generateMipmap(gl.TEXTURE_2D);
			} else {
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			}
		};
		image.src = url;

		return texture;
	}

	loadTextures(gl) {
		this.textures.diffuse = this.loadTexture(
			gl,
			"assets/Stylized_Cliff_Rock_006_basecolor.png",
		);
		this.textures.specular = this.loadTexture(
			gl,
			"assets/Stylized_Cliff_Rock_006_height.png",
		);
		this.textures.normal = this.loadTexture(gl, "assets/Stylized_Cliff_Rock_006_normal.png");
	}

	bindTextures(gl, program) {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.textures.diffuse);
		gl.uniform1i(program.diffuseTextureUni, 0);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.textures.specular);
		gl.uniform1i(program.specularTextureUni, 1);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, this.textures.normal);
		gl.uniform1i(program.normalTextureUni, 2);
	}

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

		this.texCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(this.texCoords),
			gl.STATIC_DRAW,
		);

		this.tangentBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(this.tangents),
			gl.STATIC_DRAW,
		);
	}

	draw(gl, program) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(program.vertexAttrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(program.vertexAttrib);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.vertexAttribPointer(program.normalAttrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(program.normalAttrib);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.vertexAttribPointer(program.texCoordAttrib, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(program.texCoordAttrib);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
		gl.vertexAttribPointer(program.tangentAttrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(program.tangentAttrib);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
	}

	rotateTextureCoordinates(angle) {
		this.rotationAngle = angle;
		const cosAngle = Math.cos(angle);
		const sinAngle = Math.sin(angle);
		const { u: centerU, v: centerV } = this.rotationCenter;
		for (let i = 0; i < this.texCoords.length; i += 2) {
			const u = this.texCoords[i] - centerU;
			const v = this.texCoords[i + 1] - centerV;
			this.texCoords[i] = u * cosAngle - v * sinAngle + centerU;
			this.texCoords[i + 1] = u * sinAngle + v * cosAngle + centerV;
		}
	}
	moveRotationCenter(deltaU, deltaV) {
		this.rotationCenter.u += deltaU;
		this.rotationCenter.v += deltaV;
		this.rotationCenter.u = Math.max(0, Math.min(1, this.rotationCenter.u));
		this.rotationCenter.v = Math.max(0, Math.min(1, this.rotationCenter.v));
	}
	updateTexCoordBuffer(gl) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(this.texCoords),
			gl.STATIC_DRAW,
		);
	}
}

function isPowerOf2(value) {
	return (value & (value - 1)) === 0;
}
