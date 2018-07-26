import { MainScene } from './scenes/main.scene';
import { Vector3, Mesh, CubeTextureLoader, CubeTexture } from 'three';
import { DestinyLoaderBundle, DestinyModelLoader } from './destiny-model-loader/destiny-model-loader';
import { MaterialHelper } from './destiny-model-loader/material-helper';
import Axios from 'axios';
import { DestinyGearAssetsDefinition } from './destiny-model-loader/destiny-gear-asset-manifest';
import Vue from 'vue';
export class App {
	params:URLParams;
  envMap: CubeTexture;
  scene: MainScene;
	container: HTMLElement;
	itemDefinitions:ListItem;
	gearDefinition:DestinyGearAssetsDefinition;
	characterClass:number;
	gender:number;
	fps: number = 60;
	itemList:ListItem[];
	gearSelector:Vue;
	meshes:{[id:string]:Mesh} = {};
	constructor() {
		this.init();
	}

	init(){
		this.params = this.extractURLParams();
		if(this.params.noUI) {
			document.body.classList.add('no-ui');
		}else{
		};
		this.buildScene();
		return this.loadGearDefinition(this.params.itemId).then((res)=>{
			this.gearDefinition = res;
			return this.loadEnvMap();
		}).then(()=>{
			return this.loadModel(this.params.itemId);
		}).then((res)=>{
			this.addModels(res);
			this.updateCameraControls();
		});
		this.initEventListeners();
		if(this.params.debug) this.scene.setupDebugger();
	}

	initEventListeners(){
		window.addEventListener("changeClass", (event:CustomEvent)=>{
			this.characterClass = event.detail.classType;
			this.params = {};

			this.loadGearDefinition(this.params.itemId).then((res)=>{
				this.gearDefinition = res;
				return this.loadModel(this.params.itemId);
			}).then((res)=>{
				this.addModels(res);
			})
		})
	}

	buildScene(){
		this.container = document.getElementById('container-3d');
		this.scene = new MainScene(this.container.offsetWidth, this.container.offsetHeight, this.container);
		window.onresize = ()=>{
			this.scene.changeSize(this.container.offsetWidth, this.container.offsetHeight);
		};
		this.container.appendChild(this.scene.renderer.domElement);
		setInterval(()=>{
			this.scene.render();
		},10);
	}

	loadGearDefinition(hash:number):Promise<DestinyGearAssetsDefinition>{
		let promise = Axios.get(`database/gearAssets/${hash}.json`);
		return promise.then((res)=>{
			return res.data as DestinyGearAssetsDefinition;
		});
	}

	loadEnvMap(){
		return new Promise((resolve)=>{
			let textureLoader = new CubeTextureLoader();
			textureLoader.load([
				'assets/cubeleft.jpg','assets/cuberight.jpg',
				'assets/cubeback.jpg','assets/cubefront.jpg',
				'assets/cubedown.jpg','assets/cubeup.jpg',
			], (envMap)=>{
				envMap.generateMipmaps = true;
				this.envMap = envMap;
				resolve(envMap);
			});
		})
	}

	loadModel(id:number) {
		let modelLoader:DestinyModelLoader = new DestinyModelLoader();
		console.log(this.gender);
		let items = [{itemDefinition:this.gearDefinition, female:this.gender == 1}];
		return modelLoader.load(items)
		.then((models)=>{
			let meshes:{[id:number]:Mesh} = {};
			models.forEach((model:DestinyLoaderBundle, index)=>{
				MaterialHelper.addPropertyToAllMaterials(model.materials, 'envMap', this.envMap);
				meshes[id] = new Mesh(model.geometry, model.materials);
			});
			return meshes;
		});
	}

	addModels(meshes:{[id:string]:Mesh}){
		for(let i in meshes){
			if(this.meshes[i]) {
				this.scene.remove(this.meshes[i]);
				this.meshes[i] = null;
			}
			let mesh = meshes[i];
			this.meshes[i] = mesh;
			this.scene.add(mesh);
			mesh.geometry.computeBoundingBox();
		};
	}

	updateCameraControls(){
		let min:Vector3;
		let max:Vector3;
		for(let i in this.meshes){
			let mesh = this.meshes[i];
			if(!min) min = mesh.geometry.boundingBox.min;
			if(!max) max = mesh.geometry.boundingBox.max;
			min.min(mesh.geometry.boundingBox.min);
			max.max(mesh.geometry.boundingBox.max);
		};
		let center = new Vector3(max.x/2 +min.x/2, max.y/2 + min.y/2, max.z/2 + min.z/2);
		let maxDistance:number = 0;
		['x', 'y', 'z'].forEach((prop)=>{
			maxDistance = Math.max(maxDistance, Math.abs(center[prop] - max[prop]));
			maxDistance = Math.max(maxDistance, Math.abs(center[prop] - min[prop]));
		});
		this.scene.updateCameraControls(center, maxDistance);
	}

	extractURLParams(): any {
		try{
			let paramString = window.location.href.split('?')[1];
			let params = paramString.split("&");
			let paramResult = {};
			params.forEach((param)=>{
				let splitted = param.split('=');
				paramResult[splitted[0]] = parseInt(splitted[1]);
			})
	        return paramResult;
		}catch(e){
			return {};
		}
    }
}

interface URLParams{
	itemId?:number;
	gender?:number;
	debug?:number;
	noUI?:number;
}

interface ListItem{
	name:string;
	hash:number;
	icon:string;
	itemType:number;
	itemSubType:number;
	classType:number;
	tierType:number;
}
