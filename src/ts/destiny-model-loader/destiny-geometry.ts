
import { Geometry, Vector3, Vector2, Color, Face3, Vector4 } from "three";
import { TGXAssetRenderMesh } from "./tgx-asset";

export class DestinyGeometry extends Geometry{
	static fromTGXRenderMeshes(meshes:TGXAssetRenderMesh[], meshIndexes:number[]):DestinyGeometry{
		let vertexOffset = 0;
		let geometry = new DestinyGeometry();
		let materialIndex:number = 0;
		for (let m=0; m<meshes.length; m++) {
			let renderMesh = meshes[m];
			let indexBuffer = renderMesh.indexBuffer;
			let vertexBuffer = renderMesh.vertexBuffer;
			let texcoordOffset = renderMesh.texcoordOffset;
			let texcoordScale = renderMesh.texcoordScale;
			let parts = renderMesh.parts;
			if (parts.length == 0) {
				console.log('Skipped RenderMesh: No parts');
				continue;
			}

			for (let p=0; p<parts.length; p++) {
				let part:any = parts[p];
				part.materialIndex = materialIndex++;
				if (!this.checkRenderPart(part)) continue;
				let increment = 3;
				let start = part.indexStart;
				let count = part.indexCount;
				if (part.primitiveType === 5) {
					increment = 1;
					count -= 2;
				}
				for (let i=0; i<count; i+= increment) {
					let faceVertexNormals = [];
					let faceVertexUvs = [];
					let faceVertex = [];
					let faceColors = [];
					let detailVertexUvs = [];
					let faceIndex = start+i;
					let tri = part.primitiveType === 3 || i & 1 ? [0, 1, 2] : [2, 1, 0];
					for (let j=0; j<3; j++) {
						let index = indexBuffer[faceIndex+tri[j]];
						let vertex:any = vertexBuffer[index];
						if (!vertex) { // Verona Mesh
							i=count;
							break;
						}
						let normal = vertex.normal0;
						let uv = vertex.texcoord0;
						let color = vertex.color0;

						let detailUv = vertex.texcoord2;
						if (!detailUv) detailUv = [0, 0];

						faceVertex.push(index+vertexOffset);
						faceVertexNormals.push(new Vector3(normal[0], normal[1], -normal[2]));

						let uvu = uv[0]*texcoordScale[0]+texcoordOffset[0];
						let uvv = uv[1]*texcoordScale[1]+texcoordOffset[1];
						faceVertexUvs.push(new Vector2(uvu, uvv));
						if (color) {
							faceColors.push(new Color(color[0], color[1], color[2]));
						}

						detailVertexUvs.push(new Vector2(
							uvu*detailUv[0],
							uvv*detailUv[1]
						));
					}
					let face = new Face3(faceVertex[0], faceVertex[1], faceVertex[2], faceVertexNormals);
					face.materialIndex = part.materialIndex;
					if (faceColors.length > 0) face.vertexColors = faceColors;
					geometry.faces.push(face);
					geometry.faceVertexUvs[0].push(faceVertexUvs);

					if (geometry.faceVertexUvs.length < 2) geometry.faceVertexUvs.push([]);
					geometry.faceVertexUvs[1].push(detailVertexUvs);
				}
			}

			for (let v=0; v<vertexBuffer.length; v++) {
				let vertex:any = vertexBuffer[v];
				let position = vertex.position0;
				let x = position[0];
				let y = position[1];
				let z = position[2];
				geometry.vertices.push(new Vector3(x, y, -z));

				// Set bone weights
				let boneIndex = position[3];
				let blendIndices = vertex.blendindices0 ? vertex.blendindices0 : [boneIndex, 255, 255, 255];
				let blendWeights = vertex.blendweight0 ? vertex.blendweight0: [1, 0, 0, 0];

				let skinIndex:any = [0, 0, 0, 0];
				let skinWeight:any = [0, 0, 0, 0];

				for (let w=0; w<blendIndices.length; w++) {
					if (blendIndices[w] == 255) break;
					skinIndex[w] = blendIndices[w];
					skinWeight[w] = blendWeights[w];
				}

				geometry.skinIndices.push(new Vector4().fromArray(skinIndex));
				geometry.skinWeights.push(new Vector4().fromArray(skinWeight));
			}
			vertexOffset += vertexBuffer.length;
		}
		geometry.faceVertexUvs[1] = geometry.faceVertexUvs[0];
		geometry.rotateX(Math.PI/2);
		geometry.scale(1, 1, -1);
		geometry.verticesNeedUpdate = true;
		geometry.normalsNeedUpdate = true;
		// geometry.computeBoundingSphere();
		// geometry.computeFaceNormals();
		geometry.computeVertexNormals();
		return geometry;
	}

	private static checkRenderPart(part:any):boolean {
		let shouldRender = false;
		let renderables = [0,1,2,3];
		shouldRender = renderables.indexOf(part.lodCategory.value) > -1;
		switch(part.shader ? part.shader.type : 7) {
			case -1:
				shouldRender = false;
				break;
		}
		return shouldRender;
	}
}
