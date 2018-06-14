import { TGXBin } from "./tgx-bin";
import { TGXUtils } from "./tgx-utils";

export class TGXAsset{
	renderMeshes:TGXAssetRenderMesh[];
	texturePlates:TGXAssetTexturePlate[];

	static fromTGXBin(tgxBin:TGXBin):TGXAsset{
		let metadata = tgxBin.metadata;
		let meshes:TGXAssetRenderMesh[] = [];
		for (let r=0; r<metadata.render_model.render_meshes.length; r++) {
			let renderMeshIndex = r;
			let renderMesh = metadata.render_model.render_meshes[renderMeshIndex];

			// IndexBuffer
			let indexBufferInfo = renderMesh.index_buffer;
			let indexBufferData = tgxBin.files[tgxBin.lookup.indexOf(indexBufferInfo.file_name)].data;

			let indexBuffer = [];
			for (let j=0; j<indexBufferInfo.byte_size; j+=indexBufferInfo.value_byte_size) {
				let indexValue = TGXUtils.ushort(indexBufferData, j);
				indexBuffer.push(indexValue);
			}

			// VertexBuffer
			let vertexBuffer = this.parseVertexBuffers(tgxBin, renderMesh);
			let parts = [];
			let partIndexList = [];
			// let stagesToRender = [0, 7, 15];
			let partOffsets = [];

			let partLimit = renderMesh.stage_part_offsets[4];
			for (let i=0; i<partLimit; i++) {
				partOffsets.push(i);
			}

			for (let i=0; i<partOffsets.length; i++) {
				let partOffset = partOffsets[i];
				let stagePart = renderMesh.stage_part_list[partOffset];
				if (!stagePart) {
					console.warn('MissingStagePart['+renderMeshIndex+':'+partOffset+']');
					continue;
				}
				if (partIndexList.indexOf(stagePart.start_index) != -1) {
					continue;
				}
				partIndexList.push(stagePart.start_index);
				parts.push(this.parseStagePart(stagePart));
			}

			// Spasm.RenderMesh
			meshes.push({
				positionOffset: renderMesh.position_offset,
				positionScale: renderMesh.position_scale,
				texcoordOffset: renderMesh.texcoord_offset,
				texcoordScale: renderMesh.texcoord_scale,
				texcoord0ScaleOffset: renderMesh.texcoord0_scale_offset,
				indexBuffer: indexBuffer,
				vertexBuffer: vertexBuffer,
				parts: parts
			});
		}

		return {renderMeshes:meshes, texturePlates:metadata.texture_plates};
	}

	private static parseStagePart(stagePart:any) {
		let gearDyeSlot = 0;
		let usePrimaryColor = true;
		let useInvestmentDecal = false;
		switch(stagePart.gear_dye_change_color_index) {
			case 0:
				gearDyeSlot = 0;
				break;
			case 1:
				gearDyeSlot = 0;
				usePrimaryColor = false;
				break;
			case 2:
				gearDyeSlot = 1;
				break;
			case 3:
				gearDyeSlot = 1;
				usePrimaryColor = false;
				break;
			case 4:
				gearDyeSlot = 2;
				break;
			case 5:
				gearDyeSlot = 2;
				usePrimaryColor = false;
				break;
			case 6:
				gearDyeSlot = 3;
				useInvestmentDecal = true;
				break;
			case 7:
				gearDyeSlot = 3;
				useInvestmentDecal = true;
				break;
			default:
				console.warn('UnknownDyeChangeColorIndex['+stagePart.gear_dye_change_color_index+']', stagePart);
				break;
		}

		let part:any = {
			gearDyeSlot: gearDyeSlot,
			usePrimaryColor: usePrimaryColor,
			useInvestmentDecal: useInvestmentDecal,
		};

		for (let key in stagePart) {
			var partKey = key;
			let value = stagePart[key];
			switch(key) {
				case 'gear_dye_change_color_index':
					partKey = 'changeColorIndex';
					break;

				case 'start_index': partKey = 'indexStart'; break;

				case 'shader':
					let staticTextures = value.static_textures;
					value = {
						type: value.type
					};
					if (staticTextures) value.staticTextures = staticTextures;
					break;

				default:
					let keyWords = key.split('_');
					partKey = '';
					for (let i=0; i<keyWords.length; i++) {
						let keyWord = keyWords[i];
						partKey += i == 0 ? keyWord : keyWord.slice(0, 1).toUpperCase()+keyWord.slice(1);
					}
					break;
			}
			part[partKey] = value;
		}
		return part;
	}

	private static parseVertexBuffers(tgxBin:any, renderMesh:any) {
		var stagePartVertexStreamLayoutDefinition = renderMesh.stage_part_vertex_stream_layout_definitions[0];
		var formats = stagePartVertexStreamLayoutDefinition.formats;

		var vertexBuffer:any = [];

		for (var vertexBufferIndex in renderMesh.vertex_buffers) {
			var vertexBufferInfo = renderMesh.vertex_buffers[vertexBufferIndex];
			var vertexBufferData = tgxBin.files[tgxBin.lookup.indexOf(vertexBufferInfo.file_name)].data;
			var format = formats[vertexBufferIndex];
			var vertexIndex = 0;
			for (var v=0; v<vertexBufferInfo.byte_size; v+= vertexBufferInfo.stride_byte_size) {
				var vertexOffset = v;
				if (vertexBuffer.length <= vertexIndex) vertexBuffer[vertexIndex] = {};
				for (var e=0; e<format.elements.length; e++) {
					var element = format.elements[e];
					var values:any = [];

					var elementType = element.type.replace('_vertex_format_attribute_', '');
					var types = ["ubyte", "byte", "ushort", "short", "uint", "int", "float"];
					for (var typeIndex in types) {
						var type = types[typeIndex];
						if (elementType.indexOf(type) === 0) {
							var count = parseInt(elementType.replace(type, ''));
							var j, value;
							switch(type) {
								case 'ubyte':
									for (j=0; j<count; j++) {
										value = TGXUtils.ubyte(vertexBufferData, vertexOffset);
										if (element.normalized) value = TGXUtils.unormalize(value, 8);
										values.push(value);
										vertexOffset++;
									}
									break;
								case 'byte':
									for (j=0; j<count; j++) {
										value = TGXUtils.byte(vertexBufferData, vertexOffset);
										if (element.normalized) value = TGXUtils.normalize(value, 8);
										values.push(value);
										vertexOffset++;
									}
									break;
								case 'ushort':
									for(j=0; j<count; j++) {
										value = TGXUtils.ushort(vertexBufferData, vertexOffset);
										if (element.normalized) value = TGXUtils.unormalize(value, 16);
										values.push(value);
										vertexOffset += 2;
									}
									break;
								case 'short':
									for(j=0; j<count; j++) {
										value = TGXUtils.short(vertexBufferData, vertexOffset);
										if (element.normalized) value = TGXUtils.normalize(value, 16);
										values.push(value);
										vertexOffset += 2;
									}
									break;
								case 'uint':
									for(j=0; j<count; j++) {
										value = TGXUtils.uint(vertexBufferData, vertexOffset);
										if (element.normalized) value = TGXUtils.unormalize(value, 32);
										values.push(value);
										vertexOffset += 4;
									}
									break;
								case 'int':
									for(j=0; j<count; j++) {
										value = TGXUtils.int(vertexBufferData, vertexOffset);
										if (element.normalized) value = TGXUtils.normalize(value, 32);
										values.push(value);
										vertexOffset += 4;
									}
									break;
								case 'float':
									values = new Float32Array(vertexBufferData.buffer, vertexOffset, count);
									vertexOffset += count*4;
									break;
							}
							break;
						}
					}

					var semantic = element.semantic.replace('_tfx_vb_semantic_', '');
					switch(semantic) {
						case 'position':
						case 'normal':
						case 'tangent':
						case 'texcoord':
						case 'blendweight':
						case 'blendindices':
						case 'color':
							break;
						default:
							console.warn('Unknown Vertex Semantic', semantic, element.semantic_index, values);
							break;
					}
					vertexBuffer[vertexIndex][semantic+element.semantic_index] = values;
				}
				vertexIndex++;
			}
		}
		return vertexBuffer;
	}
}

export interface TGXAssetRenderMesh{
	positionOffset: number[];
	positionScale: number[];
	texcoordOffset: number[];
	texcoordScale: number[];
	texcoord0ScaleOffset: number[];
	indexBuffer: number[];
	vertexBuffer: number[];
	parts: RenderMeshPart[];
}

export interface RenderMeshPart{
	materialIndex:number;
	changeColorIndex:number;
	externalIdentifier:number;
	flags:number;
	gearDyeSlot:number;
	indexCount:number;
	indexMax:number;
	indexMin:number;
	indexStart:number;
	lodCategory:{name:string, value:number};
	lodRun:number;
	primitiveType:number;
	shader:{type:number};
	useInvestmentDecal:boolean;
	usePrimaryColor:boolean;
	variantShaderIndex:number;
}

export interface TGXAssetTexturePlate{
	gear_decal_dye_index:number;
	gear_slot_requires_plating:boolean;
	number_of_gear_slots:number;
	number_of_plateable:number;
	plate_set:PlateSet;
}
export interface PlateSet{
	diffuse:PlateSetItem;
	normal:PlateSetItem;
	gearstack:PlateSetItem;
}
export interface PlateSetItem{
	plate_index:number;
	plate_size:number[];
	reference_id:string;
	texture_placements:TexturePlacement[];

}
export interface TexturePlacement{
	texture_size_x:number;
	texture_size_y:number;
	position_x:number;
	position_y:number;
	texture_tag_name:string;
}
