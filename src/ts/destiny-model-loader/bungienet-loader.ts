import { FileLoader, LoadingManager, Cache } from "three";
import { DestinyApiConfig } from "./destiny-api-config";
import {Promise} from 'es6-promise';

export class BungieNetLoader extends FileLoader {
	constructor(manager?:LoadingManager, private skipAPIKey:boolean = false){
		super(manager);
	}
	loadAsPromise(url: string, onProgress?: (request: ProgressEvent) => void):Promise<any>{
		let promise = new Promise((resolve, reject)=>{
			this.load(url, resolve, onProgress, reject);
		})
		return promise;
	};
	load(url: string, onLoad?: (responseText: string) => void, onProgress?: (request: ProgressEvent) => void, onError?:(event: ErrorEvent) => void): XMLHttpRequest{
		if (url === undefined) url = '';
		if (this.path !== undefined) url = this.path + url;
		var cached = Cache.get(url);
		if (cached !== undefined) {
			this.manager.itemStart(url);
			setTimeout(function() {
				if (onLoad) onLoad(cached);
				this.manager.itemEnd(url);
			}, 0);
			return cached;
		}
		var request = new XMLHttpRequest();
		request.open('GET', url, true);

		// If an API Key is supplied, add it to the request header
		// otherwise assume we want binary data
		if(!this.skipAPIKey) request.setRequestHeader('X-API-Key', DestinyApiConfig.APIKey);
		if (url.indexOf('geometry') != -1) request.responseType = 'arraybuffer';

		request.addEventListener('load', (event:any)=>{
			var response = event.target.response;
			Cache.add(url, response);

			if (request.status === 200) {
				if (onLoad) onLoad(response);
				this.manager.itemEnd(url);
			} else if (request.status === 0) {
				// Some browsers return HTTP Status 0 when using non-http protocol
				// e.g. 'file://' or 'data://'. Handle as success.
				console.warn('THREE.FileLoader: HTTP Status 0 received.');
				if (onLoad) onLoad(response);
				this.manager.itemEnd(url);
			} else {
				if (onError) onError(event);
				this.manager.itemError(url);
			}
		}, false);

		if (onProgress !== undefined) {

			request.addEventListener('progress', (event)=>{
				onProgress(event);
			}, false);

		}

		request.addEventListener('error', (event)=>{
			if (onError) onError(event);
			this.manager.itemError(url);
			this.load(url+"?"+Math.random(), onLoad, onProgress, onError);
		}, false);

		// if (request.responseType !== undefined) request.responseType = this.responseType as any;
		// if (request.withCredentials !== undefined) request.withCredentials = this.withCredentials as any;

		if (request.overrideMimeType) request.overrideMimeType(this.mimeType !== undefined ? this.mimeType.type : 'text/plain');

		request.send(null);

		this.manager.itemStart(url);

		return request;
	};
}
