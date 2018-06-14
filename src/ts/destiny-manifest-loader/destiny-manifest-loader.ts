import {getDestinyManifest, DestinyManifest} from 'bungie-api-ts/destiny2';
import * as LocalForage from 'localforage';
import * as Axios from 'axios';
export enum ManifestLanguage{
	German="de",
	English="en",
	Spanish="es",
	MexicanSpanish="es-mx",
	French="fr",
	Italian="it",
	Japanese="ja",
	Polish="pl",
	BrazillianPortuguese="pt-br",
	Russian="ru",
	Chinese="zh-cht"
};

export enum ManifestNodes{
	mobileAsset="mobileAssetContentPath",
	ClanBanner="mobileClanBannerDatabasePath",
	mobileGearAsset="mobileGearAssetDataBases",
	mobileGearCDN="mobileGearCDN",
	mobileWorldContent="mobileWorldContentPaths"
};

export enum ManifestGearCDNSubNode{
	Gear="Gear",
	Geometry="Geometry",
	PlateRegion="PlateRegion",
	Shader="Shader",
	Texture="Texture"
};

export class DestinyManifestLoader {
	// private cache: any;
	private static BASE_URL:string = 'http://www.bungie.net';
	// private static MANIFEST_URL: string = '/Platform/Destiny2/Manifest/';
	private static axios = Axios.default;
	constructor() {
	}

	private static request(options:any){
		return DestinyManifestLoader.axios.request(options).then((response)=>{
			return response.data;
		});
	}

	static load(nodes:ManifestNodes[]=[ManifestNodes.mobileWorldContent], language:ManifestLanguage = ManifestLanguage.English, subNodes:ManifestGearCDNSubNode[] = []){
		let localManifestVersion:string;
		LocalForage.getItem('manifest-version')
		.then((version)=>{
			localManifestVersion = version as string;
			return getDestinyManifest(this.request);
		}).then((manifestInfo)=>{
			if (manifestInfo.Response.version != localManifestVersion){
				return this.download(manifestInfo.Response, nodes, language, subNodes);
			}else{
				return this.loadFromStorage(nodes, subNodes, language).then((res)=>{
					if(res.indexOf(null) > -1){
						return this.download(manifestInfo.Response, nodes, language, subNodes);
					}else{
						return res;
					}
				});
			}
		});
	}

	private static loadFromStorage(nodes:ManifestNodes[], subNodes:ManifestGearCDNSubNode[], language:ManifestLanguage){
		let promises:Promise<any>[] = [];
		nodes.forEach((node)=>{
			if(node == ManifestNodes.mobileWorldContent){
				promises.push(LocalForage.getItem(`${node}-${language}`));
			}else if(node == ManifestNodes.mobileGearCDN){
				subNodes.forEach((subNode)=>{
					promises.push(LocalForage.getItem(`${node}-${subNode}`));
				});
			}else{
				promises.push(LocalForage.getItem(node));
			}
		});
		return this.axios.all(promises).then((res)=>{
			return res;
		});
	}

	private static download(manifestInfo:DestinyManifest, nodes:ManifestNodes[], language:ManifestLanguage, subNodes:ManifestGearCDNSubNode[]){
		let promises:Promise<any>[] = [];
		nodes.forEach((node)=>{
			if(node == ManifestNodes.mobileWorldContent){
				promises.push(this.axios.get(`${this.BASE_URL}${manifestInfo[node][language]}`, {responseType:'arraybuffer'}));
			}else if(node == ManifestNodes.mobileGearCDN){
				subNodes.forEach((subNode)=>{
					promises.push(this.axios.get(`${this.BASE_URL}${manifestInfo[node][subNode]}`, {responseType:'arraybuffer'}));
				});
			}else{
				promises.push(this.axios.get(`${this.BASE_URL}${manifestInfo[node]}`, {responseType:'arraybuffer'}));
			}

		});
		return this.axios.all(promises).then((res)=>{
			this.saveToStorage(nodes, subNodes, language, manifestInfo.version, res);
			return res;
		}).catch(e=>console.log(e));
	}

	private static saveToStorage(nodes:ManifestNodes[], subNodes:ManifestGearCDNSubNode[], language:ManifestLanguage, version:string, responses:any[]){
		nodes.forEach((node=>{
			if(node == ManifestNodes.mobileWorldContent){
				LocalForage.setItem(`${node}-${language}`, responses.shift().data);
			}else if(node == ManifestNodes.mobileGearCDN){
				subNodes.forEach((subNode)=>{
					LocalForage.setItem(`${node}-${subNode}`, responses.shift().data);
				});
			}else{
				LocalForage.setItem(node, responses.shift().data);
			}
		}));
		LocalForage.setItem('manifest-version', version);
		// let response = {};
		// nodes.forEach((res)=>{
		//
		// })
	}

	loadFromStorage(){

	}

	// getItemsByType(type:number){
	// }
	//
	// getItem(hash: number){
	//
	// }

	get(){
	}

	// private getMultiple(){
	// }

	getAll(){
	}

	// private getDomain(){
	// }
}
