import {randomString, post, get, encodeQuery} from "./common";
import {MiAccount} from "./miaccount";

interface Conversations {
	bitSet: number[];
	records: {
		bitSet: number[];
		answers: {
			bitSet: number[];
			type: string;
			tts: {
				bitSet: number[];
				text: string;
			};
		}[];
		time: number;
		query: string;
		requestId: string;
	}[];
	nextEndTime: number;
}

export class MiNAService {
	account: MiAccount;

	constructor(account: MiAccount) {
		this.account = account;
	}

	mina_request(uri: string, data?: any): Promise<any> {
		const requestId = "app_ios_" + randomString(30);
		if (data) {
			data["requestId"] = requestId;
		} else {
			uri += "&requestId=" + requestId;
		}
		const headers = {
			"User-Agent":
				"MiHome/6.0.103 (com.xiaomi.mihome; build:6.0.103.1; iOS 14.4.0) Alamofire/6.0.103 MICO/iOSApp/appStore/6.0.103",
			Cookie: `PassportDeviceId=${this.account.deviceId}; serviceToken="${this.account.serviceToken}"; userId=${this.account.userId}`,
		};
		let pms;
		let url = /^https?:/.test(uri) ? uri : "https://api2.mina.mi.com" + uri;
		if (data) {
			headers["Content-Type"] = "application/x-www-form-urlencoded";
			pms = post(url, data && encodeQuery(data), {
				headers: headers,
			});
		} else {
			pms = get(url, {
				headers: headers,
			});
		}
		return pms.then((ret) => {
			if (!ret.data) throw ret;
			if (ret.data.code) throw ret;
			return ret.data.data;
		});
	}

	device_list(master = 0) {
		return this.mina_request("/admin/v2/device_list?master=" + master);
	}

	ubus_request(deviceId: string, method: string, path: string, message: any) {
		message = JSON.stringify(message);
		return this.mina_request("/remote/ubus", {
			deviceId,
			message,
			method,
			path,
		});
	}

	text_to_speech(deviceId: string, text: string) {
		return this.ubus_request(deviceId, "text_to_speech", "mibrain", {
			text: text,
		});
	}

	player_set_volume(deviceId: string, volume: number) {
		return this.ubus_request(deviceId, "player_set_volume", "mediaplayer", {
			volume: volume,
			media: "app_ios",
		});
	}

	player_pause(deviceId: string) {
		return this.ubus_request(deviceId, "player_play_operation", "mediaplayer", {
			action: "pause",
			media: "app_ios",
		});
	}

	player_play(deviceId: string) {
		return this.ubus_request(deviceId, "player_play_operation", "mediaplayer", {
			action: "play",
			media: "app_ios",
		});
	}

	player_get_status(deviceId: string) {
		return this.ubus_request(deviceId, "player_get_play_status", "mediaplayer", {
			media: "app_ios",
		});
	}

	play_by_url(deviceId: string, url: string) {
		return this.ubus_request(deviceId, "player_play_url", "mediaplayer", {
			url: url,
			type: 1,
			media: "app_ios",
		});
	}

	/**
	 * 获取对话记录
	 * deviceId和hardware参数可以通过 device_list 获取到的设备列表中的 deviceId和hardware 字段
	 */
	get_conversations(deviceId: string, hardware: string, limit = 2): Promise<Conversations> {
		const headers = {
			"User-Agent":
				"MiHome/6.0.103 (com.xiaomi.mihome; build:6.0.103.1; iOS 14.4.0) Alamofire/6.0.103 MICO/iOSApp/appStore/6.0.103",
			Cookie: `deviceId=${deviceId}; serviceToken="${this.account.serviceToken}"; userId=${this.account.userId}`,
		};
		let url = `https://userprofile.mina.mi.com/device_profile/v2/conversation?source=dialogu&hardware=${hardware}&timestamp=${Date.now()}&limit=${limit}`;
		return get(url, {
			headers,
		}).then((x) => {
			return x.data.code ? Promise.reject(x.data) : JSON.parse(x.data.data);
		});
	}
}
