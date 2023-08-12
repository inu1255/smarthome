import {post, get, encodeQuery, miot_encode, miot_decode} from "./common";
import {MiAccount} from "./miaccount";

export class MiIOService {
	account: MiAccount;
	server: string;

	constructor(account: MiAccount, region?: "cn" | "de" | "i2" | "ru" | "sg" | "us") {
		this.account = account;
		this.server = `https://${(region || "cn") === "cn" ? "" : region + "."}api.io.mi.com/app`;
	}

	miio_request(uri: string, data: any) {
		if (data) {
			data = miot_encode("POST", uri, data, this.account.ssecurity);
		}
		const headers = {
			"User-Agent":
				"iOS-14.4-6.0.103-iPhone12,3--D7744744F7AF32F0544445285880DD63E47D9BE9-8816080-84A3F44E137B71AE-iPhone",
			"x-xiaomi-protocal-flag-cli": "PROTOCAL-HTTP2",
			"miot-accept-encoding": "GZIP",
			"miot-encrypt-algorithm": "ENCRYPT-RC4",
			Cookie: `PassportDeviceId=${this.account.deviceId}; serviceToken="${this.account.serviceToken}"; userId=${this.account.userId}`,
		};
		let pms;
		if (data) {
			headers["Content-Type"] = "application/x-www-form-urlencoded";
			pms = post(this.server + uri, encodeQuery(data), {
				headers: headers,
				validateStatus: () => true,
			});
		} else {
			pms = get(this.server + uri, {
				headers: headers,
				validateStatus: () => true,
			});
		}
		return pms.then((ret) => {
			if (typeof ret.data != "string") throw ret;
			return miot_decode(
				this.account.ssecurity,
				data._nonce,
				ret.data,
				ret.headers["miot-content-encoding"] == "GZIP"
			).then((x) => {
				return JSON.parse(x).result;
			});
		});
	}

	home_request(did, method, params) {
		return this.miio_request("/home/rpc/" + did, {
			id: 1,
			method: method,
			accessKey: "IOS00026747c5acafc2",
			params: params,
		});
	}

	home_get_props(did, props) {
		return this.home_request(did, "get_prop", props);
	}

	home_set_props(did, props) {
		return Promise.all(props.map((i) => this.home_set_prop(did, i[0], i[1])));
	}

	home_get_prop(did, prop) {
		return this.home_get_props(did, [prop]).then((result) => result[0]);
	}

	home_set_prop(did, prop, value) {
		return this.home_request(did, "set_" + prop, Array.isArray(value) ? value : [value]);
	}

	miot_request(cmd, params) {
		return this.miio_request("/miotspec/" + cmd, {params: params, datasource: 3});
	}

	miot_get_props(did: string, iids: [number, number][]) {
		const params = iids.map((i) => ({
			did: did,
			siid: i[0],
			piid: i[1],
		}));
		return this.miot_request("prop/get", params).then((list) => {
			return list.map((it) => it.value || null);
		});
	}

	miot_set_props(did: string, props: [number, number, any][]) {
		const params = props.map((i) => ({
			did: did,
			siid: i[0],
			piid: i[1],
			value: i[2],
		}));
		return this.miot_request("prop/set", params).then((list) => {
			return list.map((it) => it.code || -1);
		});
	}

	miot_get_prop(did: string, iid: [number, number]) {
		return this.miot_get_props(did, [iid]).then((x) => x[0]);
	}

	miot_set_prop(did: string, iid: number[], value: any) {
		return this.miot_set_props(did, [[iid[0], iid[1], value]]).then((x) => x[0]);
	}

	miot_action(did: string, iid: number[], args = []) {
		return this.miot_request("action", {
			did: did,
			siid: iid[0],
			aiid: iid[1],
			in: args,
		});
	}

	device_list(getVirtualModel = false, getHuamiDevices = 0) {
		return this.miio_request("/home/device_list", {
			getVirtualModel: getVirtualModel,
			getHuamiDevices: getHuamiDevices,
		}).then((data) => {
			return data.list;
		});
	}
}
