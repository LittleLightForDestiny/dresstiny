export class DestinyApiConfig{
	static APIKey:string;
	static basepath:string = 'https://www.bungie.net';
	apiBasepath:string;
	game:DestinyGame;

	static getConfig(game:DestinyGame = DestinyGame.Destiny2):DestinyApiConfig{
		let config = new DestinyApiConfig();
		if(game == DestinyGame.Destiny){
			config.apiBasepath = `${this.basepath}/d1/Platform/Destiny`;
		}else{
			config.apiBasepath = `${this.basepath}/Platform/Destiny2`;
		}
		return config;
	}
}

export enum DestinyGame {
	Destiny = "destiny",
	Destiny2 = "destiny2"
}
