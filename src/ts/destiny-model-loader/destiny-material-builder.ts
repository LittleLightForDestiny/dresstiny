import { Texture, Color, Material, MeshPhysicalMaterial, DoubleSide, MeshStandardMaterialParameters } from "three";
import { TGXAsset, PlateSet, PlateSetItem, RenderMeshPart } from "./tgx-asset";
import { TGXBinFile } from "./tgx-bin";
import { TGXUtils } from "./tgx-utils";
import { DestinyDye } from "./destiny-gear";
import { DestinyLoaderBundle } from "./destiny-model-loader";
import { get as _get } from "lodash";

export class DestinyMaterialBuilder {
	private static images: { [id: string]: HTMLImageElement } = {};
	private plateSet:RenderedPlateSet;
	private textures: { [id: string]: Texture } = {};
	private geometryFiles:TGXAsset[] = [];
	constructor() {
	}

	buildMaterials(bundle: DestinyLoaderBundle): Promise<DestinyLoaderBundle> {
		return this.loadImages(bundle)
			.then(() => this.buildTexturePlateSets(bundle))
			.then((plateset) => this.buildMaterialsForParts(plateset, bundle))
			.then((materials) => {
				bundle.materials = materials;
				return bundle;
			});
	}

	private loadImages(bundle: DestinyLoaderBundle): Promise<HTMLImageElement[]> {
		let promises: Promise<HTMLImageElement>[] = [];
		for (let i in bundle.tgxTextures) {
			let texture = bundle.tgxTextures[i];
			promises = promises.concat(texture.files.map((file) => {
				return this.loadFromFile(file);
			}));
		}
		return Promise.all(promises);
	}

	private loadFromFile(file: TGXBinFile): Promise<HTMLImageElement> {
		if (DestinyMaterialBuilder.images[file.name]) return Promise.resolve(DestinyMaterialBuilder.images[file.name]);
		let promise = new Promise<HTMLImageElement>((resolve, reject) => {
			let isPng = TGXUtils.string(file.data, 1, 3) == 'PNG';
			var mimeType = 'image/' + (isPng ? 'png' : 'jpeg');
			var urlCreator = window.URL || (<any>window).webkitURL;
			var imageUrl = urlCreator.createObjectURL(new Blob([file.data], { type: mimeType }));
			var image = new Image();
			image.onload = () => {
				DestinyMaterialBuilder.images[file.name] = image;
				image.name = file.name;
				resolve(image);
			};
			image.src = imageUrl;
		});
		return promise;
	}

	private buildTexturePlateSets(bundle: DestinyLoaderBundle): Promise<RenderedPlateSet> {
		let indexSets = bundle.processedGeometryIndexSet;
		for (var i in indexSets) {
			for (var j in indexSets[i]) {
				console.log(i, j);
				let filenames = indexSets[i][j].geometry;
				this.geometryFiles = this.geometryFiles.concat(filenames.map((filename)=>bundle.tgxAssets[filename]));
			}
		}
		let promises = this.geometryFiles.map((file)=>this.buildPlateSet(bundle, file))
		return Promise.all(promises).then((res)=>{
			return this.plateSet;
		});
	}

	private buildPlateSet(bundle: DestinyLoaderBundle, asset:TGXAsset): Promise<RenderedPlateSet> {
		let plateSet:PlateSet = _get(asset, 'texturePlates[0].plate_set');
		if(!plateSet) return Promise.resolve(this.plateSet);
		if(!this.plateSet) {
			let width = plateSet.gearstack.plate_size[0], height = plateSet.gearstack.plate_size[1];
			this.plateSet = {gearstack:new CanvasDrawer(width, height), diffuse: new CanvasDrawer(width, height), normal:new CanvasDrawer(width,height)};
		}
		let promises = ["diffuse", "normal", "gearstack"].map((type) => {
			return this.buildPlate(plateSet[type], this.plateSet[type]).then((rendered) => {
				this.plateSet[type] = rendered;
				return this.plateSet;
			})
		});
		return Promise.all(promises).then((res) => {
			return this.plateSet;
		})
	}

	private buildPlate(plate: PlateSetItem, drawer:CanvasDrawer): Promise<CanvasDrawer> {
		return new Promise((resolve, reject) => {
			plate.texture_placements.forEach((placement, index) => {
				drawer.context.drawImage(DestinyMaterialBuilder.images[placement.texture_tag_name],
					placement.position_x, placement.position_y,
					placement.texture_size_x, placement.texture_size_y);
			});
			resolve(drawer);
		});
	}

	private buildMaterialsForParts(plateset: RenderedPlateSet, bundle: DestinyLoaderBundle): Promise<Material[]> {
		let promises = [];
		this.geometryFiles.forEach((file)=>{
			file.renderMeshes.forEach((mesh)=>{
				let partsPromises = mesh.parts.map((part) => this.buildMaterialForPart(part, bundle, plateset));
				promises = promises.concat(partsPromises);
			});
		})
		return Promise.all(promises);
	}

	private buildMaterialForPart(part: RenderMeshPart, bundle: DestinyLoaderBundle, plateset: RenderedPlateSet): Promise<Material> {
		let dye = bundle.processedDyeSet[part.gearDyeSlot];
		return this.buildMaps(plateset, part, dye)
			.then((res) => {
				let material = new MeshPhysicalMaterial(res);
				material.side = DoubleSide;
				material.userData = {
					part:part,
					dye:dye
				};
				// part.flags == 8 // should be transparent or not ?

				material.transparent = part.flags == 13 || part.flags == 10 || part.flags == 32 || part.flags == 34 || (part.flags == 8 && !part.usePrimaryColor);
				material.emissive = new Color().fromArray(dye.material_properties.emissive_tint_color_and_intensity_bias);
				material.roughness = 1;
				material.metalness = 1;
				return material;
			});
	}

	private buildMaps(plateset: RenderedPlateSet, part: RenderMeshPart, dye: DestinyDye): Promise<MeshStandardMaterialParameters> {
		return Promise.all([
			this.getDiffuseTexture(plateset, part, dye),
			this.getNormalTexture(plateset, part, dye),
			this.getAoTexture(plateset, part, dye),
			this.getRoughnessTexture(plateset, part, dye),
			this.getMetalnessTexture(plateset, part, dye),
			this.getAlphaTexture(plateset, part, dye),
			this.getEmissiveTexture(plateset, part, dye)
		]).then(([diffuse, normal, ao, roughness, metalness, alpha, emissive]) => {
			return { map: diffuse, normalMap: normal, aoMap:ao, roughnessMap:roughness, metalnessMap:metalness, alphaMap:alpha, emissiveMap:emissive};
		})
	}

	private getMetalnessTexture(plateset: RenderedPlateSet, part: RenderMeshPart, dye: DestinyDye): Promise<Texture> {
		let id = `metalness`;
		if (this.textures[id]) {
			return Promise.resolve(this.textures[id]);
		};
		if(!plateset.gearstack) return Promise.resolve(null);
		return new Promise((resolve, reject) => {
			this.textures[id] = new Texture();
			let width = plateset.gearstack.width, height = plateset.gearstack.height;
			let gearstackData = plateset.gearstack.context.getImageData(0, 0, width, height);
			let metalnessData = new ImageData(width, height);
			let params = part.usePrimaryColor ? dye.material_properties.primary_material_params : dye.material_properties.secondary_material_params;
			for (let i = 0; i < gearstackData.data.length; i += 4) {
				let b = i + 2, a = i + 3;
				if(gearstackData.data[a] > 32){
					metalnessData.data[b] = params[2]*255;
				}else{
					metalnessData.data[b] = this.getRange(gearstackData.data[a], 0, 32)*255;
				}
				metalnessData.data[a] = 255;
			}
			resolve(metalnessData);
		}).then((data:ImageData) => {
			return this.dataToImage(data)
			.then((metalness) => {
				return this.imageToTexture(metalness, this.textures[id]);
			});
		});

	}

	private getRoughnessTexture(plateset: RenderedPlateSet, part: RenderMeshPart, dye: DestinyDye): Promise<Texture> {
		let id = `roughness`;
		if (this.textures[id]) {
			return Promise.resolve(this.textures[id]);
		};
		if(!plateset.gearstack) return Promise.resolve(null);
		return new Promise((resolve, reject) => {
			this.textures[id] = new Texture();
			let width = plateset.gearstack.width, height = plateset.gearstack.height;
			let gearstackData = plateset.gearstack.context.getImageData(0, 0, width, height);
			let roughnessData = new ImageData(width, height);
			for (let i = 0; i < gearstackData.data.length; i += 4) {
				let g = i + 1, a = i + 3;
				roughnessData.data[g] = gearstackData.data[g];
				roughnessData.data[a] = 255;
			}
			resolve(roughnessData);
		}).then((data:ImageData) => {
			return this.dataToImage(data)
			.then((roughness) => {
				return this.imageToTexture(roughness, this.textures[id]);
			});
		});
	}

	private getAlphaTexture(plateset: RenderedPlateSet, part: RenderMeshPart, dye: DestinyDye): Promise<Texture> {
		let id = `alphatest`;
		if(!plateset.gearstack) return Promise.resolve(null);
		if (this.textures[id]) {
			return Promise.resolve(this.textures[id]);
		};
		this.textures[id] = new Texture();
		return new Promise((resolve, reject) => {
			this.textures[id] = new Texture();
			let width = plateset.gearstack.width, height = plateset.gearstack.height;
			let gearstackData = plateset.gearstack.context.getImageData(0, 0, width, height);
			let alphatestData = new ImageData(width, height);
			for (let i = 0; i < gearstackData.data.length; i += 4) {
				let r = i, g = i + 1, b = i + 2, a = i + 3;
				alphatestData.data[r] = alphatestData.data[g] = alphatestData.data[b] = this.getRange(gearstackData.data[b], 0, 32)*255;
				alphatestData.data[a] = 255;
			}
			resolve(alphatestData);
		}).then((data:ImageData) => {
			return this.dataToImage(data)
			.then((alphatest) => {
				return this.imageToTexture(alphatest, this.textures[id]);
			});
		});
	};
	private getEmissiveTexture(plateset: RenderedPlateSet, part: RenderMeshPart, dye: DestinyDye): Promise<Texture> {
		let id = `emissive`;
		if(!plateset.gearstack) return Promise.resolve(null);
		if (this.textures[id]) {
			return Promise.resolve(this.textures[id]);
		};
		this.textures[id] = new Texture();
		return new Promise((resolve, reject) => {
			this.textures[id] = new Texture();
			let width = plateset.gearstack.width, height = plateset.gearstack.height;
			let gearstackData = plateset.gearstack.context.getImageData(0, 0, width, height);
			let emissiveData = new ImageData(width, height);
			for (let i = 0; i < gearstackData.data.length; i += 4) {
				let r = i, g = i + 1, b = i + 2, a = i + 3;
				emissiveData.data[r] = emissiveData.data[g] = emissiveData.data[b] = this.getRange(gearstackData.data[b], 32, 255)*255;
				emissiveData.data[a] = 255;
			}
			resolve(emissiveData);
		}).then((data:ImageData) => {
			return this.dataToImage(data)
			.then((emissive) => {
				return this.imageToTexture(emissive, this.textures[id]);
			});
		});
	};

	private getAoTexture(plateset: RenderedPlateSet, part: RenderMeshPart, dye: DestinyDye): Promise<Texture> {
		let id = `ao`;
		if (this.textures[id]) {
			return Promise.resolve(this.textures[id]);
		};
		if(!plateset.gearstack) return Promise.resolve(null);
		return new Promise((resolve, reject) => {
			this.textures[id] = new Texture();
			let width = plateset.gearstack.width, height = plateset.gearstack.height;
			let gearstackData = plateset.gearstack.context.getImageData(0, 0, width, height);
			let aoData = new ImageData(width, height);
			for (let i = 0; i < gearstackData.data.length; i += 4) {
				let r = i, g = i + 1, b = i + 2, a = i + 3;
				aoData.data[r] = aoData.data[g] = aoData.data[b] = gearstackData.data[r];
				aoData.data[a] = 255;
			}
			resolve(aoData);
		}).then((data:ImageData) => {
			return this.dataToImage(data)
			.then((ao) => {
				return this.imageToTexture(ao, this.textures[id]);
			});
		});
	};

	private getNormalTexture(plateset: RenderedPlateSet, part: RenderMeshPart, dye: DestinyDye): Promise<Texture> {
		let id = `normal`;
		if(!plateset.normal) return Promise.resolve(null);
		if (this.textures[id]) {
			return Promise.resolve(this.textures[id]);
		};
		return plateset.normal.loadAsImage()
		.then((normal) => {
			return this.imageToTexture(normal, this.textures[id]);
		});
	};

	private getDiffuseTexture(plateset: RenderedPlateSet, part: RenderMeshPart, dye: DestinyDye): Promise<Texture> {
		let id = `diffuse_${part.gearDyeSlot}_${part.usePrimaryColor}`;
		if(!plateset.gearstack) return Promise.resolve(null);
		if (this.textures[id]) {
			return Promise.resolve(this.textures[id]);
		};
		return new Promise((resolve, reject) => {
			this.textures[id] = new Texture();
			let width = plateset.gearstack.width, height = plateset.gearstack.height;
			let diffuseData = plateset.diffuse.context.getImageData(0, 0, width, height);
			let gearstackData = plateset.gearstack.context.getImageData(0, 0, width, height);
			let wornData = new ImageData(width, height);
			let dyedDrawer = new CanvasDrawer(width, height);
			let color = part.usePrimaryColor ? dye.material_properties.primary_albedo_tint : dye.material_properties.secondary_albedo_tint;
			let wornColor = dye.material_properties.worn_albedo_tint;
			// let dyeParams = part.usePrimaryColor ? dye.material_properties.primary_material_params : dye.material_properties.secondary_material_params;
			// let wornParams = dye.material_properties.worn_material_parameters;
			dyedDrawer.context.fillStyle = new Color().fromArray(color).getStyle();
			dyedDrawer.context.fillRect(0, 0, width, height);
			let dyeData = dyedDrawer.context.getImageData(0, 0, width, height);
			for (let i = 0; i < gearstackData.data.length; i += 4) {
				let r = i, g = i + 1, b = i + 2, a = i + 3;
				let dyeMask = gearstackData.data[a] > 40 ? 255 : 0;
				let wornMask = this.getRange(gearstackData.data[a], 48, 255)*255;
				dyeData.data[r] = this.blend(diffuseData.data[r]/255, color[0])*255;
				dyeData.data[g] = this.blend(diffuseData.data[g]/255, color[1])*255;
				dyeData.data[b] = this.blend(diffuseData.data[b]/255, color[2])*255;
				dyeData.data[a] = dyeMask;
				wornData.data[r] = wornColor[0]*255;
				wornData.data[g] = wornColor[1]*255;
				wornData.data[b] = wornColor[2]*255;
				wornData.data[a] = 0;
				wornData.data[a] = wornMask;
			}
			dyedDrawer.context.putImageData(dyeData, 0, 0);
			resolve([dyeData, wornData]);
		}).then(([dyeData, wornData]) => {
			return Promise.all([this.dataToImage(dyeData), this.dataToImage(wornData)])
				.then(([dye, worn]) => {
					let drawer: CanvasDrawer = new CanvasDrawer(dye.width, dye.height);
					drawer.context.drawImage(plateset.diffuse.canvas, 0, 0);
					drawer.context.drawImage(dye, 0, 0);
					drawer.context.globalCompositeOperation = "multiply";
					drawer.context.drawImage(worn, 0, 0);
					return drawer.loadAsImage();
				}).then((diffuse) => {
					return this.imageToTexture(diffuse, this.textures[id]);
				});
		});

	}

	blend(blend:number, target:number){
		return this.overlay(blend, target);
	}

	overlay2(a:number, b:number){
		return (a > 0.5 ? 1 : 0) * (1 - (1-2*(a-0.5)) * (1-b)) +
		(a <= 0.5 ? 1 : 0) * ((2*a) * b)
	}

	lighten(blend:number, base:number, amount:number){
		return Math.max(blend, base)*amount + (1-amount)*base;
	}

	overlay(a:number, b:number){
		return b * this.saturate(a * 4.0) + this.saturate(a - 0.25);
	}

	saturate(a:number){
		return  Math.max(0, Math.min(a, 1));
	}

	private getRange(number: number, min: number, max: number): number {
		let value = (number - min) / (max - min);
		return this.saturate(value);
	}

	private dataToImage(data: ImageData): Promise<HTMLImageElement> {
		let drawer = new CanvasDrawer(data.width, data.height);
		drawer.data = data;
		drawer.putData();
		return drawer.loadAsImage();
	}

	private imageToTexture(image: HTMLImageElement, texture: Texture = new Texture()): Texture {
		texture.flipY = false;
		texture.image = image;
		texture.needsUpdate = true;
		return texture;
	}
}

class CanvasDrawer {
	context: CanvasRenderingContext2D;
	canvas: HTMLCanvasElement;
	data: ImageData;
	constructor(public width: number, public height: number) {
		this.canvas = document.createElement('canvas');
		this.canvas.width = width;
		this.canvas.height = height;
		this.context = this.canvas.getContext('2d');
		this.data = new ImageData(width, height);
	}

	putData() {
		this.context.putImageData(this.data, 0, 0);
	}

	loadAsImage(): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			let image = new Image();
			image.onload = () => {
				resolve(image);
			};
			image.src = this.canvas.toDataURL();
		});
	}
}

interface RenderedPlateSet {
	diffuse?: CanvasDrawer;
	normal?: CanvasDrawer;
	gearstack?: CanvasDrawer;
}
