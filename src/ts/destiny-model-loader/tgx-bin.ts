import { TGXUtils } from "./tgx-utils";

export class TGXBin{
	url: string;
	fileIdentifier: string;
	files: TGXBinFile[];
	lookup: string[];
	metadata: any;

	static fromUintArray(data:Uint8Array):TGXBin{
		let magic = TGXUtils.string(data, 0x0, 0x4);
		// let version = TGXUtils.uint(data, 0x4);
		let fileOffset = TGXUtils.uint(data, 0x8);
		let fileCount = TGXUtils.uint(data, 0xC);
		if (magic != 'TGXM') {
			console.error('Invalid TGX File');
			return;
		}
		let tgxBin = new TGXBin();
		tgxBin.fileIdentifier = TGXUtils.string(data, 0x10, 0x100);
		tgxBin.files = [];
		tgxBin.lookup = [];
		// let renderMetadata = null;
		for (let f=0; f<fileCount; f++) {
			let headerOffset = fileOffset+0x110*f;
			let name = TGXUtils.string(data, headerOffset, 0x100);
			let offset = TGXUtils.uint(data, headerOffset+0x100);
			let type = TGXUtils.uint(data, headerOffset+0x104);
			let size = TGXUtils.uint(data, headerOffset+0x108);
			let fileData = data.slice(offset, offset+size);
			if (name.indexOf('.js') != -1) {
				fileData = JSON.parse(TGXUtils.string(fileData));
				tgxBin.metadata = fileData;
			}
			tgxBin.files.push({
				name: name,
				offset: offset,
				type: type,
				size: size,
				data: fileData
			});
			tgxBin.lookup.push(name);
		}
		return tgxBin;
	}
}

export class TGXBinFile{
	name: string;
	offset: number;
	type: number;
	size: number;
	data: any;
}
