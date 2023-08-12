import {SYS_INFO} from "@/lib/config";
import {getSvgSize, svg2dataurl, cacheFirst} from "../utils";

export interface Readable {
	name?: string;
	size?: number;
	paused?: boolean;
	on(type: "data", fn: (data: Uint8Array) => void);
	on(type: "end", fn: () => void);
	on(type: "error", fn: (err: any) => void);
	pipe<T>(ws: T, opt?: {end?: boolean}): T;
	pause?();
	resume?();
	close?();
	write?(data: Uint8Array);
	error?(e);
	end?();
}

export function isReadable(data: any): data is Readable {
	return data.readable && typeof data.on === "function";
}

export function loadImage(src: string): Promise<UniApp.GetImageInfoSuccessData> {
	if (/^\s*<svg/i.test(src))
		return Promise.resolve({
			path: svg2dataurl(src),
			...getSvgSize(src),
		});
	// #ifdef APP
	if (src.endsWith(".svg")) {
		return (uni.request({url: src}) as any).then((x) => {
			return loadImage(x.data);
		});
	}
	// #endif
	return new Promise(function (resolve, reject) {
		uni.getImageInfo({
			src,
			success(info) {
				resolve(info);
			},
			fail: reject,
		});
	});
}

export function createCanvasImage(canvas: WechatMiniprogram.OffscreenCanvas, url: string) {
	const image = canvas.createImage();
	return new Promise<WechatMiniprogram.Image>((resolve, reject) => {
		image.onload = () => resolve(image);
		image.onerror = reject;
		image.src = url;
	});
}

export function getImageData(url: string): Promise<ImageData> {
	return loadImage(url).then(function (info) {
		const canvas = uni.createOffscreenCanvas({type: "2d", width: info.width, height: info.height});
		const ctx = canvas.getContext("2d");
		const img = createCanvasImage(canvas, url);
		return img.then(function (img) {
			ctx.drawImage(img, 0, 0);
			return ctx.getImageData(0, 0, info.width, info.height);
		});
	});
}

export function saveImageData(imageData: ImageData) {
	const canvas = uni.createOffscreenCanvas({
		type: "2d",
		width: imageData.width,
		height: imageData.height,
	});
	const ctx = canvas.getContext("2d");
	ctx.putImageData(imageData, 0, 0);
	return new Promise((resolve, reject) => {
		uni.canvasToTempFilePath({
			canvas,
			success(res) {
				resolve(res.tempFilePath);
			},
			fail: reject,
		} as any);
	});
}

export function drawImage(
	ctx: UniApp.CanvasContext,
	img: string,
	x: number,
	y: number,
	width: number,
	height: number
) {
	return loadImage(img).then(function (info) {
		ctx.drawImage(info.path, x, y, width, height);
	});
}

interface UniOption<T> {
	success?: (result: T) => void;
	fail?: (result: any) => void;
}

function promisify<P extends UniOption<R>, R>(
	fn: (options: P) => void
): (options: P) => Promise<R> {
	return function (options: P) {
		return new Promise<R>(function (resolve, reject) {
			fn(
				Object.assign({}, options, {
					success(res) {
						resolve(res);
						if (options && options.success) options.success(res);
					},
					fail(err) {
						reject(err);
						if (options && options.fail) options.fail(err);
					},
				})
			);
		});
	};
}

export const getSystemInfo: (
	options: UniApp.GetSystemInfoOptions
) => Promise<UniApp.GetSystemInfoResult> = cacheFirst(promisify(uni.getSystemInfo) as any);

export function getSystemSize() {
	return getSystemInfo({}).then((info) => {
		return {
			width: info.windowWidth,
			height: info.windowHeight,
		};
	});
}

export const getSetting: (
	options: UniApp.GetSettingOptions
) => Promise<UniApp.GetSettingSuccessResult> = promisify(uni.getSetting) as any;

export const getUserProfile: (
	options: UniApp.GetUserProfileOptions
) => Promise<UniApp.GetUserProfileRes> = promisify(uni.getUserProfile) as any;

let back_at = 0;
export function exitConfirm(msg?: string) {
	if (Date.now() - back_at < 1000) {
		plus.runtime.quit();
	} else {
		back_at = Date.now();
		uni.showToast({
			title: msg || "再按一次退出应用",
			icon: "none",
			duration: 2000,
		});
	}
}

/**
 * 获取当前页面 hash
 */
export function getCurrentPage(n = -1) {
	let pages = getCurrentPages();
	n = n >= 0 ? n : pages.length + n;
	let page = pages[n];
	if (!page) return "";
	return n + ":" + page.route;
}

export function goBack() {
	let pages = getCurrentPages();
	if (pages.length > 1) uni.navigateBack({});
	else if (pages[0].route != "pages/main/main") uni.redirectTo({url: "/pages/main/main"});
}

export function isPage(page: string) {
	let pages = getCurrentPages();
	return pages[0] && pages[0].route == page;
}

export function showActionSheet(sheets: Array<{label: string; handler: () => any}>) {
	sheets = sheets.filter((x) => x && x.label);
	let itemList = sheets.map((x) => x.label);
	uni.showActionSheet({
		itemList,
		success(res) {
			let index = res.tapIndex;
			if (index >= 0 && index < sheets.length) {
				sheets[index].handler();
			}
		},
	});
}

export function withLoading<T extends (...args: any[]) => Promise<any>>(
	fn: T,
	options?: UniApp.ShowLoadingOptions
): T {
	return function () {
		uni.showLoading(options);
		let pms: Promise<any> = fn.apply(this, arguments);
		pms.finally(() => {
			uni.hideLoading();
		});
		return pms;
	} as any;
}

export function rpx2px(rpx) {
	return (SYS_INFO.screenWidth * Number.parseInt(rpx)) / 750;
}

export function querySelector(sel, inst) {
	// #ifdef MP-WEIXIN
	return new Promise((resolve, reject) => {
		uni
			.createSelectorQuery()
			.in(inst)
			.select(sel)
			.fields({node: true} as any, null)
			.exec((res) => {
				resolve(res[0].node);
			});
	});
	// #endif
	// #ifdef H5
	// eslint-disable-next-line no-unreachable
	let el = (inst?.$el || document).querySelector(sel);
	if (/uni-canvas/i.test(el.tagName)) {
		el = el.querySelector("canvas") || el;
	}
	return Promise.resolve(el);
	// #endif
}
