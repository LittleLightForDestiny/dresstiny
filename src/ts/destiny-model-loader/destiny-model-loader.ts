import { Material } from "three";
import { DestinyGearAssetManifest, DestinyGearAssetsDefinition, DestinyRegionIndexSetDefinition } from "./destiny-gear-asset-manifest";
import { DestinyGame} from "./destiny-api-config";
import { DestinyGeometry } from "./destiny-geometry";

import { TGXBin } from "./tgx-bin";
import { DestinyGear, DestinyDye } from "./destiny-gear";
import { DestinyMetadataLoader } from "./destiny-metadata-loader";
import {Promise} from "es6-promise";
import {get as _get} from "lodash";
import { TGXAsset, TGXAssetRenderMesh } from "./tgx-asset";
import { DestinyMaterialBuilder } from "./destiny-material-builder";

export class DestinyModelLoader{
	constructor(){
	}

	load(items:DestinyLoaderItem[], game:DestinyGame=DestinyGame.Destiny2, onProgress?: (progress: ProgressEvent) => void):Promise<DestinyLoaderBundle[]> {
		let bundles:DestinyLoaderBundle[] = items;
		return this.loadDefinitions(bundles, game)
		.then((res)=>{
			return this.loadModels(bundles, game, onProgress);
		});
	}

	loadDefinitions(bundles:DestinyLoaderBundle[], game:DestinyGame):Promise<DestinyLoaderBundle[]>{
		let modelHashes = bundles.filter(item=>!!item.itemHash && !item.itemDefinition).map((item)=>item.itemHash);
		let shaderHashes = bundles.filter((item)=>!!item.shaderHash && !item.shaderDefinition).map((item)=>item.shaderHash);
		let definitionHashes:number[] = modelHashes.concat(shaderHashes);
		if(definitionHashes.length == 0) return Promise.resolve(bundles);
		return DestinyGearAssetManifest.getDefinitions(definitionHashes, game).
		then((definitions)=>{
			bundles.forEach((bundle)=>{
				bundle.itemDefinition = definitions[bundle.itemHash];
				bundle.shaderDefinition = definitions[bundle.shaderHash];
			})
			return bundles;
		})
	}

	loadModels(bundles:DestinyLoaderBundle[], game:DestinyGame, onProgress:(event:ProgressEvent)=>any):Promise<DestinyLoaderBundle[]>{
		let promises = bundles.map((bundle)=>this.loadModel(bundle, game));
		return Promise.all(promises);
	}

	loadModel(bundle:DestinyLoaderBundle, game:DestinyGame):Promise<DestinyLoaderBundle> {
		bundle.tgxAssets = {};
		bundle.tgxTextures = {};
		let metadataLoader:DestinyMetadataLoader = new DestinyMetadataLoader();
		return metadataLoader.loadGearDefinitions([_get(bundle, 'itemDefinition.gear[0]'), _get(bundle, 'shaderDefinition.gear[0]')]).then((gears)=>{
			bundle.itemGear = gears[0];
			bundle.shaderGear = gears[1];
			return this.loadTGXAssets(bundle, game);
		}).then(()=>{
			bundle.processedGeometryIndexSet = this.processIndexSet(bundle);
			bundle.processedDyeSet = this.processDyeSets(bundle);
			return this.parseGeometries(bundle)
			.then((res)=>{
				return this.parseMaterials(bundle)
			});
		}).then((res)=>{
			return bundle;
		});
	}

	loadTGXAssets(bundle:DestinyLoaderBundle, game:DestinyGame):Promise<DestinyLoaderBundle>{
		let mixedIndexSets = bundle.processedGeometryIndexSet || this.processIndexSet(bundle);
		let filenames:string[] = [];
		let textureFilenames:string[] = [];
		for(var i in mixedIndexSets){
			filenames = filenames.concat.apply(filenames, mixedIndexSets[i].map((indexSet)=>indexSet.geometry));
			textureFilenames = textureFilenames.concat.apply(textureFilenames, mixedIndexSets[i].map((indexSet)=>indexSet.textures));
		}
		let metadataLoader:DestinyMetadataLoader = new DestinyMetadataLoader();
		let loadingPromises = filenames.map((filename)=>{
			if(bundle.tgxAssets[filename]) return Promise.resolve(bundle);
			return metadataLoader.loadTGXAsset(filename, game).then((asset)=>{
				bundle.tgxAssets[filename] = asset;
				return bundle;
			});
		});
		let textureLoadingPromises = textureFilenames.map((filename)=>{
			if(bundle.tgxTextures[filename]) return Promise.resolve(bundle);
			return metadataLoader.loadTGXTexture(filename, game).then((asset)=>{
				bundle.tgxTextures[filename] = asset;
				return bundle;
			});
		});
		return Promise.all(loadingPromises.concat(textureLoadingPromises)).then((res)=>{
			return bundle;
		});
	}

	parseGeometries(bundle:DestinyLoaderBundle):Promise<DestinyLoaderBundle>{
		let indexSets = bundle.processedGeometryIndexSet;
		let renderMeshes: TGXAssetRenderMesh[] = [];
		let meshIndexes:number[] = [];
		for(var i in indexSets){
			for(var j in indexSets[i]){
				let filenames = indexSets[i][j].geometry;
				let meshes = filenames.map((filename)=>bundle.tgxAssets[filename].renderMeshes);
				renderMeshes = renderMeshes.concat.apply(renderMeshes, meshes);
				meshIndexes = meshIndexes.concat.apply(meshIndexes, meshes.map((mesh)=> mesh.map(()=>i as any)));
			}
		}
		bundle.geometry = DestinyGeometry.fromTGXRenderMeshes(renderMeshes, meshIndexes);
		return Promise.resolve(bundle);
	}
	parseMaterials(bundle:DestinyLoaderBundle):Promise<DestinyLoaderBundle>{
		let builder:DestinyMaterialBuilder = new DestinyMaterialBuilder();
		return builder.buildMaterials(bundle);
	}

	processIndexSet(bundle:DestinyLoaderBundle):{[id:number]:ProcessedIndexSet[]}{
		let itemIndexSets:DestinyRegionIndexSetDefinition[][];
		let itemIndexSet:DestinyRegionIndexSetDefinition = bundle.female ? _get(bundle, 'itemDefinition.content[0].female_index_set') : _get(bundle, 'itemDefinition.content[0].male_index_set');
		let itemGeometries:string[] = _get(bundle , 'itemDefinition.content[0].geometry');
		let itemTextures:string[] = _get(bundle , 'itemDefinition.content[0].textures');
		if(!itemIndexSet){
			itemIndexSets = _get(bundle, 'itemDefinition.content[0].region_index_sets');
		}else{
			itemIndexSets = [[itemIndexSet]];
		}
		let mixedIndexSets:{[id:string]:ProcessedIndexSet[]} = {};
		for(let i in itemIndexSets){
			mixedIndexSets[i] = itemIndexSets[i].map((indexSet)=>{
				return {
					geometry:indexSet.geometry.map((index)=>itemGeometries[index]),
					textures:indexSet.textures.map((index)=>itemTextures[index])
				};
			});
		}
		bundle.processedGeometryIndexSet = mixedIndexSets;
		return mixedIndexSets;
	}

	processDyeSets(bundle:DestinyLoaderBundle):DestinyDye[]{
		let dyeset:DestinyDye[] = [];
		let itemDefault:DestinyDye[] = _get(bundle, 'itemGear.default_dyes') || [];
		let itemCustom:DestinyDye[] = _get(bundle, 'itemGear.custom_dyes') || [];
		let itemLocked:DestinyDye[] = _get(bundle, 'itemGear.locked_dyes') || [];
		let shaderDefault:DestinyDye[] = _get(bundle, 'shaderGear.default_dyes') || [];
		let shaderCustom:DestinyDye[] = _get(bundle, 'shaderGear.custom_dyes') || [];
		let shaderLocked:DestinyDye[] = _get(bundle, 'shaderGear.locked_dyes') || [];
		this.setDyes(shaderLocked, dyeset);
		this.setDyes(itemLocked, dyeset);
		this.setDyes(shaderCustom, dyeset);
		this.setDyes(itemCustom, dyeset);
		this.setDyes(shaderDefault, dyeset);
		this.setDyes(itemDefault, dyeset);
		return dyeset;
	}

	setDyes(source:DestinyDye[], destination:DestinyDye[]){
		source.forEach((dye, index)=>{
			if(!destination[index]){
				destination[index] = dye;	
			}
		});
	}

}

export interface DestinyLoaderItem{
	itemHash?:number;
	shaderHash?:number;
	itemDefinition?:DestinyGearAssetsDefinition;
	shaderDefinition?:DestinyGearAssetsDefinition;
	female?:boolean;
}

export interface DestinyLoaderBundle{
	itemHash?:number;
	shaderHash?:number;
	female?:boolean;
	itemDefinition?:DestinyGearAssetsDefinition;
	shaderDefinition?:DestinyGearAssetsDefinition;
	itemGear?:DestinyGear;
	shaderGear?:DestinyGear;
	geometry?:DestinyGeometry;
	materials?:Material[];
	processedGeometryIndexSet?:{[id:number]:ProcessedIndexSet[]};
	processedDyeSet?:DestinyDye[];
	tgxAssets?:{[filename:string]:TGXAsset};
	tgxTextures?:{[filename:string]:TGXBin};
}

export interface ProcessedIndexSet{
	textures:string[];
	geometry:string[];
}
