let env = require('../env-config.js');
let axios = require('axios');
let zip = new require('node-zip');
let Database = require('better-sqlite3');
let fs = require('fs');
let mkdirp = require('mkdirp');
let basepath = 'http://bungie.net/';

axios.get(`${basepath}Platform/Destiny2/Manifest`, {
	headers: {
		'X-API-Key': env.apiKey
	}
}).then((res) => {
	let contentPaths = res.data.Response.mobileWorldContentPaths;
	let assetDatabases = res.data.Response.mobileGearAssetDataBases;
	let assetDatabasePath = assetDatabases[assetDatabases.length - 1].path;
	let langs = [];
	for (let lang in contentPaths) {
		langs.push(lang);
	}
	downloadWorldContents(langs, contentPaths)
	.then((res)=>{
		downloadGearAssets(assetDatabasePath);
	});
});

function downloadWorldContents(langs, contentPaths) {
	let lang = langs.shift();
	console.log(`Downloading world content: ${lang}`);
	return downloadWorldContent(lang, contentPaths[lang])
		.then((res) => {
			if (langs.length > 0) {
				return downloadWorldContents(langs, contentPaths);
			} else {
				return res;
			}
		});
}

function downloadWorldContent(lang, filename) {
	return axios.get(`${basepath}${filename}`, {
		responseType: 'arraybuffer'
	}).then((zipfile) => {
		let unzipped = zip(zipfile.data);
		let files = unzipped.files;
		let file;
		for (let i in files) {
			file = files[i];
		}
		return file;
	}).then((file) => {
		mkdirp.sync(`database/files`);
		fs.writeFileSync(`database/files/${file.name}`, file._data.getContent(), 'binary');
		let db = new Database(`database/files/${file.name}`);
		let query = db.prepare('SELECT * FROM DestinyInventoryItemDefinition').all();
		db.close();
		return query;
	}).then((query)=>{
		return saveData(`manifest/${lang}`, query)
		.then((data)=>{
			return saveList(`manifest/${lang}`, query);
		})
	});
}

function downloadGearAssets(filename) {
	console.log(`Downloading 3d gear assets manifest`);
	axios.get(`${basepath}${filename}`, {
		responseType: 'arraybuffer'
	}).then((zipfile) => {
		let unzipped = zip(zipfile.data);
		let files = unzipped.files;
		let file;
		for (let i in files) {
			file = files[i];
		}
		return file;
	}).then((file) => {
		mkdirp.sync(`database/files`);
		fs.writeFileSync(`database/files/${file.name}`, file._data.getContent(), 'binary');
		let db = new Database(`database/files/${file.name}`);
		let query = db.prepare('SELECT * FROM DestinyGearAssetsDefinition').all();
		saveData(`gearAssets`, query);
	});
}

function saveData(path, data, onlyEquippable) {
	mkdirp.sync(`./database/${path}`);
	let files = [];
	for (let i in data) {
		let id = data[i].id;
		if (id < 0) id += 4294967296;
		let str = data[i].json;
		let json = JSON.parse(str);
		if (onlyEquippable && !json.equippable) continue;
		files.push({path:`./database/${path}/${id}.json`, content:str});
	}
	return saveFiles(files);
}

function saveFiles(files){
	let file = files.shift();
	return saveFile(file.path, file.content).then(()=>{
		if(files.length > 0){
			return saveFiles(files);
		}else{
			return files;
		}
	})
}

function saveFile(filename, data) {
	return new Promise((resolve, reject) => {
		fs.writeFile(filename, data, 'utf-8', (error) => {
			if (error) {
				reject(error);
				console.log(error);
			} else {
				resolve('success');
				console.log(`Saved ${filename}`);
			}
		});
	})
}

function saveList(path, data) {
	mkdirp.sync(`./database/${path}`);
	let list = [];
	for (let i in data) {
		let str = data[i].json;
		let json = JSON.parse(str);
		let obj = {
			hash: json.hash,
			name: json.displayProperties.name,
			icon: json.displayProperties.icon,
			itemType: json.itemType,
			itemSubType: json.itemSubType,
			classType: json.classType,
			tierType: json.inventory.tierType
		};
		if (obj.name && obj.icon) list.push(obj);
	}
	let str = JSON.stringify(list);
	return saveFile(`./database/${path}/list.json`, str);
}
