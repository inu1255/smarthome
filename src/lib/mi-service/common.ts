import SHA1 from "crypto-js/sha1";
import sha256 from "crypto-js/sha256";
import Base64 from "crypto-js/enc-base64";
import md5 from "js-md5";
import {inflate} from "pako";

export {md5};

function request(opt) {
	return new Promise((resolve, reject) => {
		uni.request({
			...opt,
			success(res: any) {
				res.headers = {};
				for (let k in res.header) {
					res.headers[k.toLowerCase()] = res.header[k];
				}
				if (res.cookies) {
					res.headers["set-cookie"] = res.cookies.map((x) => x.trim());
				}
				console.log(res);
				resolve(res);
			},
			fail(err) {
				reject(err);
			},
		});
	});
}

export function get(url, config): Promise<any> {
	return request({
		url,
		method: "GET",
		header: config.headers,
	});
}

export function post(url, data, config): Promise<any> {
	return request({
		url,
		method: "POST",
		header: config.headers,
		data,
	});
}

export function sha1(s) {
	return Base64.stringify(SHA1(s));
}

export function gunzip(buf: Uint8Array) {
	if (buf instanceof ArrayBuffer) buf = new Uint8Array(buf);
	return Promise.resolve(inflate(buf, {to: "string"}));
}

export function sign_nonce(ssecurity: string, nonce: string) {
	return Base64.stringify(sha256(Base64.parse(ssecurity).concat(Base64.parse(nonce))));
}

export function randNoice() {
	return Buffer.from(
		Array(12)
			.fill(0)
			.map((x) => Math.floor(Math.random() * 256))
	).toString("base64");
}

export function hash_encode(
	method: string,
	uri: string,
	data: {[x: string]: string},
	ssecurity: string
) {
	var arrayList = [];
	if (method != null) {
		arrayList.push(method.toUpperCase());
	}
	if (uri != null) {
		arrayList.push(uri);
	}
	if (data != null) {
		for (var k in data) {
			arrayList.push(k + "=" + data[k]);
		}
	}
	arrayList.push(ssecurity);
	var sb = arrayList.join("&");
	return Base64.stringify(SHA1(sb));
}

export function miot_encode(method: string, uri: string, data: any, ssecurity: string) {
	let nonce = randNoice();
	const snonce = sign_nonce(ssecurity, nonce);
	let key = Buffer.from(snonce, "base64");
	let rc4 = new RC4(key);
	rc4.update(Buffer.alloc(1024));
	let json = JSON.stringify(data);
	let map: any = {data: json};
	map.rc4_hash__ = hash_encode(method, uri, map, snonce);
	for (let k in map) {
		let v = map[k];
		map[k] = rc4.update(Buffer.from(v)).toString("base64");
	}
	map.signature = hash_encode(method, uri, map, snonce);
	map._nonce = nonce;
	map.ssecurity = ssecurity;
	return map;
}

export function miot_decode(
	ssecurity: string,
	nonce: string,
	data: string,
	gzip?: boolean
): Promise<string> {
	let key = Buffer.from(sign_nonce(ssecurity, nonce), "base64");
	let rc4 = new RC4(key);
	rc4.update(Buffer.alloc(1024));
	let decrypted = rc4.update(Buffer.from(data, "base64"));
	if (gzip) {
		return gunzip(decrypted);
	}
	return Promise.resolve(decrypted.toString());
}

export async function charles_decode(copy_request: string, copy_response: string) {
	let form = decodeQuery(copy_request);
	form.data = await miot_decode(form.ssecurity, form._nonce, form.data);
	form.data = JSON.parse(form.data);
	if (copy_response) {
		form.resp = await miot_decode(form.ssecurity, form._nonce, copy_response, true);
		form.resp = JSON.parse(form.resp);
	}
	return form;
}

export function randomString(len: number): string {
	if (len < 1) return "";
	let s = Math.random().toString(36).slice(2);
	return s + randomString(len - s.length);
}

export function decodeQuery(str: string) {
	var data: any = {};
	if (!str) return data;
	var ss = str.split("&");
	for (var i = 0; i < ss.length; i++) {
		var s = ss[i].split("=");
		if (s.length != 2) continue;
		var k = decodeURIComponent(s[0]);
		var v = decodeURIComponent(s[1]);
		if (/^\[{/.test(v))
			try {
				v = JSON.parse(v);
			} catch (e) {}
		data[k] = v;
	}
	return data;
}

/**
 * 将data编码为URL的query参数
 */
export function encodeQuery(data: {[key: string]: any}, limit?: number): string {
	var ss = [];
	for (var k in data) {
		var v = data[k];
		if (v == null || typeof v === "function") continue;
		if (typeof v === "object") v = JSON.stringify(v);
		else v = v.toString();
		if (v.length > limit) continue;
		ss.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
	}
	return ss.join("&");
}

export class RC4 {
	iii: number;
	jjj: number;
	bytes: Uint8Array;

	constructor(buf: Buffer) {
		this.bytes = new Uint8Array(256);
		const length = buf.length;
		for (let i = 0; i < 256; i++) {
			this.bytes[i] = i;
		}
		let i2 = 0;
		for (let i3 = 0; i3 < 256; i3++) {
			const i4 = i2 + buf[i3 % length];
			const b = this.bytes[i3];
			i2 = (i4 + b) & 255;
			this.bytes[i3] = this.bytes[i2];
			this.bytes[i2] = b;
		}
		this.iii = 0;
		this.jjj = 0;
	}

	update(buf: Buffer) {
		for (let i = 0; i < buf.length; i++) {
			const b = buf[i];
			const i2 = (this.iii + 1) & 255;
			this.iii = i2;
			const i3 = this.jjj;
			const arr = this.bytes;
			const b2 = arr[i2];
			const i4 = (i3 + b2) & 255;
			this.jjj = i4;
			arr[i2] = arr[i4];
			arr[i4] = b2;
			buf[i] = b ^ arr[(arr[i2] + b2) & 255];
		}
		return buf;
	}
}
