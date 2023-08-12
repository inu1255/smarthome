import Vue from "vue";
import {deepClone, deepDiff, deepInit} from "./utils";

/**
 * @template T
 * @param {T} v
 * @param {(val: T, old: T) => any} [fn]
 * @returns {T}
 */
export function watch<T>(v: T, fn?: (val: T, old: T) => any): T {
	return new Vue({
		data: {v: v},
		watch: fn && {v: {deep: true, handler: fn}},
	}).v;
}

export class PromisePool {
	list: Promise<any>[];
	fnList: (() => Promise<any>)[];
	constructor() {
		this.list = [];
		this.fnList = [];
	}

	push(pms: Promise<any> | (() => Promise<any>)) {
		if (typeof pms === "function") this.fnList.push(pms);
		else {
			this.list.push(pms);
			pms.finally(() => {
				var idx = this.list.indexOf(pms);
				if (idx > -1) this.list.splice(idx, 1);
			});
		}
	}

	wait() {
		this.push(Promise.all(this.fnList.map((fn) => fn())));
		return Promise.all(this.list);
	}
}

let writePool = new PromisePool();

abstract class WatchAgent<T> {
	protected key: string;
	protected onchange: () => void;
	constructor(key: string, onchange: () => void) {
		this.key = key;
		this.onchange = onchange;
	}

	abstract read(): Promise<[string, T]>;
	abstract write(s: string, data: T): Promise<void>;
}

class UniAgent<T> extends WatchAgent<T> {
	read(): Promise<[string, T]> {
		return new Promise((resolve, reject) => {
			uni.getStorage({
				key: this.key,
				success(data) {
					resolve([JSON.stringify(data), data]);
				},
				fail() {
					resolve(["", null]);
				},
			});
		});
	}

	write(s: string, data: T): Promise<void> {
		return new Promise((resolve, reject) => {
			uni.setStorage({
				key: this.key,
				data: data,
				success() {
					resolve();
				},
				fail() {
					reject();
				},
			});
		});
	}
}

export function getShareObject<T>(
	key: string,
	def: T | (() => T)
): T extends () => any ? ReturnType<T> : T {
	if (!uni[key]) {
		if (typeof def === "function") {
			uni[key] = (def as any)();
		} else {
			uni[key] = def;
		}
	}
	return uni[key];
}

export function watchLocal<T>(key: string, v: T, agent?: WatchAgent<T>): T & {reset: () => void} {
	let watchLocalMap = getShareObject("watchLocalMap", {});
	if (watchLocalMap[key]) {
		return watchLocalMap[key];
	}
	const originV = deepClone(v);
	if ((v as any).reset !== undefined) console.error("local中不能定义reset");
	setTimeout(() => {
		(v as any).reset = () => {
			justCopy(v, deepClone(originV));
		};
	});
	if (!agent) {
		agent = new UniAgent(key, reload);
	}
	let ignore_change = 0; // 记录本机修改次数，防止本机修改引起数据变化的死循环
	let latest = ""; // 最新的数据

	function load() {
		return agent!
			.read()
			.then(([s, data]) => {
				latest = s;
				return data;
			})
			.catch((e) => console.error(e));
	}

	deepInit(v, uni.getStorageSync(key));

	// 初始化加载数据
	function reload() {
		// 初始化完成之后才重新加载数据
		return load().then((x) => {
			if (x) {
				if (process.env.NODE_ENV === "development") {
					deepDiff(v, x, function (paths, val1, val2) {
						if (val1 === val2 || typeof val1 === "function") return false;
						console.log(`${key}.${paths.join(".")}`, val1, "->", val2);
						return false;
					});
				}
				justCopy(v, x);
			}
		});
	}
	function justCopy(def: any, val: any) {
		let change = false;
		if (Array.isArray(def)) {
			def.length = 0;
			def.push.apply(def, val);
			if (val && val.length) change = true;
		} else if (typeof def == "object") {
			for (let k in def) {
				if (def[k] != val[k] && typeof def[k] != "function") {
					def[k] = val[k];
					change = true;
				}
			}
		}
		if (change) ignore_change++;
	}
	return (watchLocalMap[key] = watch(v as any, function (nval) {
		if (process.env.NODE_ENV === "development") {
			// 如果是开发环境，则检查数据类型是否一致
			deepDiff(originV, nval, function (paths, val1, val2) {
				if (val1 == null || val2 === undefined || paths.length > 1) {
					return false;
				}
				if (typeof val2 === "function") return false;
				if (Array.isArray(val1) && !Array.isArray(val2)) {
					console.error(`${key}#${paths.join(".")}由数组变为了(${typeof val2})${val2}`);
					return true;
				}
				if (val1 === undefined) {
					console.error(`${key}#${paths.join(".")}没有定义,变为了(${typeof val2})${val2}`);
					return true;
				}
				if (typeof val1 !== typeof val2) {
					console.error(
						`${key}#${paths.join(
							"."
						)}类型不一致:(${typeof val1})${val1}变为了(${typeof val2})${val2}`
					);
					return true;
				}
				return false;
			});
		}
		let value = JSON.stringify(v, (k, v) => (k[0] == "_" ? undefined : v));
		if (ignore_change > 0) {
			ignore_change--;
			if (latest == value) return console.warn("忽略更新");
		}
		latest = value;
		agent!.write(latest, v);
	}));
}

export function waitLocalWrite() {
	return Vue.nextTick().then(() => writePool.wait());
}

export function loading<T>(name: string, fn: (...args: any[]) => T): T;
export function loading<T>(fn: (...args: any[]) => T): T;
export function loading(
	this: any,
	name: string | ((...args: any[]) => any),
	fn?: (...args: any[]) => any
) {
	if (typeof name === "string") {
		if (this[name]) return;
		this[name] = true;
		return Promise.resolve()
			.then(() => fn!.call(this))
			.then(
				(data) => {
					this[name] = false;
					return data;
				},
				(err) => {
					this[name] = false;
					return Promise.reject(err);
				}
			);
	}
	// @ts-ignore
	return loading.call(this, "loading", name);
}

/**
 * @template T
 * @param {{addEventListener:T}} listener
 * @param {Parameters<T>[0]} eventType
 * @param {Parameters<T>[1]} fn
 * @param {boolean} [options]
 */
export function listen<T extends (type: any, cb: any, options?: any) => void>(
	this: any,
	listener: {addEventListener: T; removeEventListener: (type: any, cb: any) => void},
	eventType: Parameters<T>[0],
	fn: Parameters<T>[1],
	options: boolean
) {
	if (typeof listener === "string") {
		fn = eventType;
		eventType = listener;
		listener = document as any;
	}
	if (/^ctrl\+/.test(eventType)) {
		let key = eventType.slice(5);
		eventType = "keypress";
		fn = (function (fn) {
			return function (e: KeyboardEvent) {
				if (e.ctrlKey && e.key == key) return fn(e);
			};
		})(fn);
	}
	listener.addEventListener(eventType, fn, options);
	if (this.$once)
		this.$once("hook:beforeDestroy", function () {
			listener.removeEventListener(eventType, fn);
		});
	return function () {
		listener.removeEventListener(eventType, fn);
	};
}
