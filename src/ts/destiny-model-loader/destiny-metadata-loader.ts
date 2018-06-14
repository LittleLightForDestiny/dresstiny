import { BungieNetLoader } from "./bungienet-loader";
import { LoadingManager, DefaultLoadingManager } from "three";
import { DestinyApiConfig, DestinyGame } from "./destiny-api-config";
import { DestinyGear } from "./destiny-gear";
import {Promise} from 'es6-promise';
import { TGXUtils } from "./tgx-utils";
import { TGXAsset } from "./tgx-asset";
import { TGXBin } from "./tgx-bin";
export class DestinyMetadataLoader{
	private loader:BungieNetLoader;
	static cache:{[url:string]:DestinyGear} = {};
	constructor(manager:LoadingManager = DefaultLoadingManager){
		this.loader = new BungieNetLoader(manager, true);
	}
	loadGearDefinitions(urls:string[], game:DestinyGame = DestinyGame.Destiny2):Promise<DestinyGear[]>{
		return Promise.all(urls.map((url)=>this.loadGearDefinition(url, game)));
	}
	loadGearDefinition(url:string, game:DestinyGame = DestinyGame.Destiny2):Promise<DestinyGear>{
		if(!url) return Promise.resolve(null);
		let baseURL:string = `${DestinyApiConfig.basepath}/common/${game}_content/geometry/gear`;
		let absoluteUrl = `${baseURL}/${url}`;
		if(DestinyMetadataLoader.cache[absoluteUrl]){
			return Promise.resolve(DestinyMetadataLoader.cache[absoluteUrl]);
		};
		return this.loader.loadAsPromise(absoluteUrl).then((res)=>{
			let arrayBuffer:Uint8Array = new Uint8Array(res as any);
			let json = JSON.parse(TGXUtils.string(arrayBuffer));
			return json;
		});
	}

	loadTGXAsset(url:string, game:DestinyGame):Promise<TGXAsset>{
		let baseURL = `${DestinyApiConfig.basepath}/common/${game}_content/geometry/platform/mobile/geometry`;
		return this.loader.loadAsPromise(`${baseURL}/${url}`).then((data)=>{
			let arrayBuffer:Uint8Array = new Uint8Array(data as any);
			let tgxBin = TGXBin.fromUintArray(arrayBuffer);
			let tgxAsset = TGXAsset.fromTGXBin(tgxBin);
			return tgxAsset;
		})
	}

	loadTGXTexture(url:string, game:DestinyGame):Promise<TGXBin>{
		let baseURL = `${DestinyApiConfig.basepath}/common/${game}_content/geometry/platform/mobile/textures`;
		return this.loader.loadAsPromise(`${baseURL}/${url}`).then((data)=>{
			let arrayBuffer:Uint8Array = new Uint8Array(data as any);
			let tgxBin:TGXBin = TGXBin.fromUintArray(arrayBuffer);
			return tgxBin;
		})
	}
}
