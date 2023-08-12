import {post, get, md5, sha1, encodeQuery} from "./common";

export interface GetAccountOption {
	username: string;
	password: string;
	sid: "xiaomiio" | "micoapi";
	deviceId: string;
}

export interface MiAccount {
	userId: number;
	passToken: string;
	ssecurity: string;
	serviceToken: string;
	deviceId: string;
}

export async function getAccount(opt: GetAccountOption): Promise<MiAccount> {
	let ret = await get(`https://account.xiaomi.com/pass/serviceLogin?sid=${opt.sid}&_json=true`, {
		headers: {
			"User-Agent": "APP/com.xiaomi.mihome APPV/6.0.103 iosPassportSDK/3.9.0 iOS/14.4 miHSTS",
			Cookie: `deviceId=${opt.deviceId}; sdkVersion=3.9`,
		},
	});
	let resp = JSON.parse(ret.data.slice(11));
	if (resp.code != 0) {
		let data = {
			_json: "true",
			qs: resp.qs,
			sid: resp.sid,
			_sign: resp._sign,
			callback: resp.callback,
			user: opt.username,
			hash: md5(opt.password).toUpperCase(),
		};
		let ret = await post("https://account.xiaomi.com/pass/serviceLoginAuth2", encodeQuery(data), {
			headers: {
				"User-Agent": "APP/com.xiaomi.mihome APPV/6.0.103 iosPassportSDK/3.9.0 iOS/14.4 miHSTS",
				Cookie: `deviceId=${opt.deviceId}; pass_ua=web; sdkVersion=3.9; uLocale=zh_CN`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});
		resp = JSON.parse(ret.data.slice(11).replace(/:(\d{16,})/g, ':"$1"'));
		if (resp.code != 0) {
			throw resp;
		}
	}
	let serviceToken = await _securityTokenService(resp.location, resp.nonce, resp.ssecurity);
	return {
		userId: resp.userId,
		passToken: resp.passToken,
		ssecurity: resp.ssecurity,
		serviceToken: serviceToken,
		deviceId: opt.deviceId,
	};
}

async function _securityTokenService(location, nonce, ssecurity) {
	const nsec = `nonce=${nonce}&${ssecurity}`;
	const clientSign = sha1(nsec);
	const res = await get(`${location}&clientSign=${encodeURIComponent(clientSign)}`, {
		headers: {},
	});
	let cookies = res.headers["set-cookie"];
	if (!cookies) {
		throw new Error(res.data);
	}
	for (let cookie of cookies) {
		if (cookie.startsWith("serviceToken")) {
			return cookie.split(";")[0].split("=").slice(1).join("=");
		}
	}
	throw new Error(res.data);
}
