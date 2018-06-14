export class TGXUtils{
	static unormalize(value:number, bits:number) {
		var max = Math.pow(2, bits) - 1;
		return value/max;
	}

	static normalize(value:number, bits:number) {
		var max = Math.pow(2, bits-1) - 1;
		return Math.max(value/max, -1);
	}

	static byte(data:any, offset:number) {
		return this.decodeSigned(data, offset, 1);
	}

	static ubyte(data:any, offset:number) {
		return this.decodeUnsigned(data, offset, 1);
	}

	static short(data:any, offset:number) {
		return this.decodeSigned(data, offset, 2);
	}

	static ushort(data:any, offset:number) {
		return this.decodeUnsigned(data, offset, 2);
	}

	static int(data:any, offset:number) {
		return this.decodeSigned(data, offset, 4);
	}

	static uint(data:any, offset:number) {
		return this.decodeUnsigned(data, offset, 4);
	}

	static float(data:any, offset:number) {
		return this.decodeFloat(this.bytes(data, offset, 4), 1, 8, 23, -126, 127);
	}

	static bytes(data:any, offset:number, length:number) {
		var bytes = [];
		for (var i=0; i<length; i++) {
			bytes.push(this.ubyte(data, offset+i));
		}
		return bytes;
	}

	static string(data:any, offset?:number, length?:number) {
		var str = '';
		if (offset == undefined) offset = 0;
		if (length == undefined) length = data.length-offset;
		for (var i=0; i<length; i++) {
			var chr = data[offset+i];
			if (chr == 0) continue;
			str += String.fromCharCode(chr);
		}
		//var str = data.substr(offset, length);
		//if (str.indexOf("\0") != -1) str = str.substr(0, str.indexOf("\0"));
		return str;
	}

	static bits(value:number, length:number) {
		var str = '';
		for (var i=0; i<length; i++) {
			str = ((value >> i) & 0x1)+str;
		}
		return str;
	}

	static radianToDegrees(value:number) {
		return value * 180 / Math.PI;
	}

	static degreesToRadian(value:number) {
		return value * Math.PI / 180;
	}

	static padNum(num:any, length:number) {
		num = num.toString();
		while(num.length < length) {
			num = '0'+num;
		}
		return num;
	}

	static decodeHex(data:any, offset:number, length:number) {
		var hex = '';

		if (typeof data == 'number') {
			length = offset != undefined ? offset : 4;
			for (var i=0; i<length; i++) {
				var u8 = (data >> (i*8)) & 0xFF;
				hex = this.padNum(u8.toString(16), 2).toUpperCase() + hex;
			}
			return '0x'+hex;
		}

		if (offset == undefined) offset = 0;
		if (length == undefined) length = data.length;
		for (var i=0; i<length; i++) {
			hex = this.padNum(data.charCodeAt(offset+i).toString(16).toUpperCase(), 2) + hex;
		}
		return '0x'+hex;
	}

	static decodeUnsigned(data:any, offset:number, length:number) {
		var int = 0;
		for (var i=0; i<length; i++) {
			int |= data[offset+i] << (i*8);
		}
		return int;
	}

	static decodeSigned(data:any, offset:number, length:number) {
		if (typeof data != 'number') data = this.decodeUnsigned(data, offset, length);
		else length = offset;
		var bits = length * 8;
		var max = (1 << bits) - 1;
		if (data & (1 << (bits - 1))) {
			data = (data & max) - max;
		}
		return data;
	}

	static decodeFloat(bytes:any, signBits:number, exponentBits:number, fractionBits:number, eMin:number, eMax:number, littleEndian?:boolean) {
		if (littleEndian == undefined) littleEndian = true;
		// var totalBits = (signBits + exponentBits + fractionBits);

		var binary = "";
		for (var i = 0, l = bytes.length; i < l; i++) {
			var bits = bytes[i].toString(2);
			while (bits.length < 8)
				bits = "0" + bits;

			if (littleEndian)
				binary = bits + binary;
			else
				binary += bits;
		}

		var sign = (binary.charAt(0) == '1')?-1:1;
		var exponent = parseInt(binary.substr(signBits, exponentBits), 2) - eMax;
		var significandBase = binary.substr(signBits + exponentBits, fractionBits);
		var significandBin = '1'+significandBase;
		var i = 0;
		var val = 1;
		var significand = 0;

		if (exponent == -eMax) {
			if (significandBase.indexOf('1') == -1)
				return 0;
			else {
				exponent = eMin;
				significandBin = '0'+significandBase;
			}
		}

		while (i < significandBin.length) {
			significand += val * parseInt(significandBin.charAt(i));
			val = val / 2;
			i++;
		}

		return sign * significand * Math.pow(2, exponent);
	}
}
