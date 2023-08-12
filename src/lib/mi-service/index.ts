import {randomString} from "./common";
import {MiAccount, getAccount} from "./miaccount";
import {MiIOService} from "./MiIOService";
import {MiNAService} from "./MiNAService";

interface Store {
	deviceId: string;
	userId: number;
	passToken: string;
	xiaomiio?: string[];
	micoapi?: string[];
}

export function readStore() {
	return new Promise<Store>((resolve, reject) => {
		uni.getStorage({
			key: "mi.token",
			success: function (res) {
				resolve(res.data);
			},
			fail: function () {
				resolve(null);
			},
		});
	});
}

export function saveStore(store) {
	return new Promise((resolve, reject) => {
		uni.setStorage({
			key: "mi.token",
			data: store,
			success: resolve,
			fail: reject,
		});
	});
}

interface Account {
	username: string;
	password: string;
}

export function getService(name: "miio", opt?: Account): Promise<MiIOService>;
export function getService(name: "mina", opt?: Account): Promise<MiNAService>;
export async function getService(
	name: "miio" | "mina",
	opt?: Account
): Promise<MiIOService | MiNAService> {
	let store = await readStore().then((x) => ({
		deviceId: randomString(16).toUpperCase(),
		userId: 0,
		passToken: "",
		...x,
	}));
	console.log("store", store);
	let account: MiAccount;
	let sid: "xiaomiio" | "micoapi" = name == "miio" ? "xiaomiio" : "micoapi";
	if (!store[sid]) {
		if (!opt) throw new Error("need login");
		account = await getAccount({
			deviceId: store.deviceId,
			username: opt.username,
			password: opt.password,
			sid: sid,
		});
		store.userId = account.userId;
		store.passToken = account.passToken;
		store[sid] = [account.ssecurity, account.serviceToken];
		await saveStore(store);
	} else {
		account = {
			deviceId: store.deviceId,
			userId: store.userId,
			passToken: store.passToken,
			ssecurity: store[sid][0],
			serviceToken: store[sid][1],
		};
	}
	return name == "miio" ? new MiIOService(account) : new MiNAService(account);
}

export function logout() {
	return saveStore({});
}

interface SpeakTextOptions {
	mina: MiNAService;
	miio: MiIOService;
	deviceId: string;
	hardware: string;
	did: string;
	text: string;
}

const MAP = {
	LX06: {speak: [5, 1], directive: [5, 5]},
	L05B: {speak: [5, 3], directive: [5, 4]},
	S12A: {speak: [5, 1], directive: [5, 5]},
	LX01: {speak: [5, 1], directive: [5, 5]},
	L06A: {speak: [5, 1], directive: [5, 5]},
	LX04: {speak: [5, 1], directive: [5, 4]},
	L05C: {speak: [5, 3], directive: [5, 4]},
	L17A: {speak: [7, 3], directive: [7, 4]},
	X08E: {speak: [7, 3], directive: [7, 4]},
	LX05A: {speak: [5, 1], directive: [5, 5]}, // 小爱红外版
	LX5A: {speak: [5, 1], directive: [5, 5]}, // 小爱红外版
	L07A: {speak: [5, 1], directive: [5, 5]}, // Redmi小爱音箱Play(l7a)
	L15A: {speak: [7, 3], directive: [7, 4]},
	X6A: {speak: [7, 3], directive: [7, 4]}, // 小米智能家庭屏6
	X10A: {speak: [7, 3], directive: [7, 4]}, // 小米智能家庭屏10
};

export function speakText(opt: SpeakTextOptions) {
	let item = MAP[opt.hardware];
	if (item) {
		return opt.miio.miot_action(opt.did, item.speak, [opt.text]);
	}

	return opt.mina.text_to_speech(opt.deviceId, opt.text);
}

export function wakeup(opt: SpeakTextOptions) {
	let item = MAP[opt.hardware];
	if (item) {
		return opt.miio.miot_action(opt.did, item.wakeup, []);
	}
	throw new Error("not support");
}

export function textDirective(opt: SpeakTextOptions) {
	let item = MAP[opt.hardware];
	if (item) {
		return opt.miio.miot_action(opt.did, item.directive, [opt.text, 0]);
	}
	throw new Error("not support");
}
