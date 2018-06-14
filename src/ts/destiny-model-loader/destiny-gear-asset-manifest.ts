import { LoadingManager } from "three";
import { BungieNetLoader } from "./bungienet-loader";
import { DestinyGame, DestinyApiConfig } from "./destiny-api-config";
import {Promise} from 'es6-promise';
import * as LocalForage from 'localforage';

export class DestinyGearAssetManifest{
	private static dbs:{[id:string]:any} = {};
	private static manager:LoadingManager;

	static load(game:DestinyGame = DestinyGame.Destiny2, onProgress?: (request: ProgressEvent) => void):Promise<DestinyGearAssetManifest>{
		let config = DestinyApiConfig.getConfig(game);
		var manifestUrl = config.apiBasepath+'/Manifest/';
		var loader = new BungieNetLoader(this.manager);
		return LocalForage.getItem(`${game}_gear_asset_manifest`).then((blob)=>{
			if(blob){
				try{
					let SQL = (window as any).SQL;
					var db = new SQL.Database(blob);
					db.exec("SELECT name FROM sqlite_master WHERE type='table'");
					this.dbs[game] = db;
					return this;
				}catch(error){}
			}

			return loader.load(manifestUrl,(response:string) => {
				let json = JSON.parse(response);
				if (json.ErrorCode == 1) {
					return this.loadDatabase(json, game, onProgress);
				} else {
					console.error('Bungie Error Response', json);
				}
			}, onProgress);
		});
	}

	static getDefinition(id:number, game:DestinyGame = DestinyGame.Destiny2, onProgress?: (request: ProgressEvent) => void):Promise<DestinyGearAssetsDefinition>{
		return this.getDefinitions([id], game, onProgress).then((data)=>{
			return data[id];
		});
	}

	static getDefinitions(ids:number[], game:DestinyGame = DestinyGame.Destiny2, onProgress?: (request: ProgressEvent) => void):Promise<{[id:number]:DestinyGearAssetsDefinition}> {
		if(!ids || !ids.length){
			console.warn('No gear ids specified');
			return;
		}
		if (!this.dbs[game]) {
			return this.load(game, onProgress).then(()=>{
				return this.getDefinitions(ids, game, onProgress);
			});
		}
		let promise = new Promise((resolve, reject)=>{
			let db = this.dbs[game];
			let domain:string = 'DestinyGearAssetsDefinition';
			var queryResult = db.exec(`SELECT * FROM ${domain} where id IN (${ids.join(',')}) OR id + 4294967296 IN (${ids.join(',')})`);
			let objects:any = {};
			if(!queryResult || !queryResult[0] || !queryResult[0].values){
				console.warn ('No results found');
				return;
			}
			let values = queryResult[0].values;
			values.forEach((value:string) => {
				let id:number;
				if(typeof value[0] === 'number'){
					id = value[0] as any as number;
				}else{
					id = parseInt(value[0]);
				}
				if(id < 0){
					id += 4294967296;
				}
				let json = JSON.parse(value[1]);
				objects[id] = json;
			});
			resolve(objects);
		});
		return promise;
	}

	private static loadDatabase(response:any, game:DestinyGame, onProgress:any):Promise<DestinyGearAssetManifest>{
		let promise:Promise = new Promise((resolve, reject)=>{
			var assetDatabases = response.Response.mobileGearAssetDataBases;
			if (assetDatabases.length > 0) {
				var assetDatabase = assetDatabases[assetDatabases.length - 1];
				var assetDatabaseUrl = DestinyApiConfig.basepath+assetDatabase.path;
				var zip:any = (window as any)['zip'];
				zip.useWebWorkers = true;
				zip.workerScripts = {
					inflater: ['./lib/zipjs/z-worker.js', './lib/zipjs/inflate.js']
				};
				zip.createReader(new zip.HttpReader(assetDatabaseUrl), (zipReader:any) => {
					zipReader.getEntries((entries:any) => {
						if (entries.length == 0) {
							console.error('Empty Database');
							return;
						}
						entries[0].getData(new zip.BlobWriter(), (blob:any)=> {
							var blobReader = new FileReader();
							blobReader.addEventListener("error", reject);
							blobReader.addEventListener("load", ()=> {
								zipReader.close(()=> {
									let blob = new Uint8Array(blobReader.result);
									let SQL = (window as any).SQL;
									LocalForage.setItem(`${game}_gear_asset_manifest`, blob);
									var db = new SQL.Database(blob);
									db.exec("SELECT name FROM sqlite_master WHERE type='table'");
									this.dbs[game] = db;
									resolve(this);
								});
							});
							blobReader.readAsArrayBuffer(blob);
						});
					});
				}, reject);
			} else {
				console.error('Empty Database');
				reject();
			}
			return promise;
		});
	}
}

export enum TGXLoaderGame {
	Destiny = "destiny",
	Destiny2 = "destiny2"
}

export class DestinyAssetManifestConfig{
	game: TGXLoaderGame = TGXLoaderGame.Destiny2;
}

export interface DestinyGearAssetsDefinition{
	content:DestinyGearAssetsContentDefinition[];
	gear:string[];
}

export interface DestinyGearAssetsContentDefinition{
	dye_index_set:DestinyRegionIndexSetDefinition;
	female_index_set:{[id:number]:DestinyRegionIndexSetDefinition};
	male_index_set:{[id:number]:DestinyRegionIndexSetDefinition};
	geometry:string[];
	platform:string;
	region_index_sets:{[id:number]:DestinyRegionIndexSetDefinition};
	textures:string[];
}

export interface DestinyRegionIndexSetDefinition{
	geometry:number[];
	textures:number[];
}
