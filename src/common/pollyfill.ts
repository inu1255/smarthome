declare namespace UniApp {
	interface Uni {
		env: {USER_DATA_PATH: string};
		createOffscreenCanvas(
			option: WechatMiniprogram.CreateOffscreenCanvasOption
		): WechatMiniprogram.OffscreenCanvas;
	}
}

// #ifndef MP-WEIXIN
uni.env = {USER_DATA_PATH: ""};
// #endif

// #ifdef H5
uni.createOffscreenCanvas = function (options?) {
	let canvas = document.createElement("canvas");
	if (options) {
		canvas.width = options.width;
		canvas.height = options.height;
	}
	function createImage() {
		let img = document.createElement("img");
		img.setAttribute("crossOrigin", "anonymous");
		return img;
	}
	function getImageData() {
		if (options.type == "webgl") {
			let gl = canvas.getContext("webgl");
			let pixels = new Uint8ClampedArray(canvas.width * canvas.height * 4);
			gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
			return {data: pixels, width: canvas.width, height: canvas.height};
		}
		return canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
	}
	return Object.assign(canvas, {createImage, getImageData});
};
// #endif
// #ifdef MP-WEIXIN
uni.createOffscreenCanvas = (function (fn) {
	return function (opt?) {
		let canvas = fn.apply(this, arguments);
		if (opt && opt.type == "webgl") {
			canvas.getImageData = function () {
				let gl = canvas.getContext("webgl");
				let pixels = new Uint8ClampedArray(canvas.width * canvas.height * 4);
				gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
				return {data: pixels, width: canvas.width, height: canvas.height};
			};
		}
		return canvas;
	};
})(uni.createOffscreenCanvas);
// #endif
// #ifdef H5
uni.getFileSystemManager = function () {
	const {loadjs} = require("@/common/utils/webtool");
	return {
		access(option) {
			console.error("access", option);
		},
		readFile(option) {
			return loadjs("static/h5/localforage.min.js")
				.then((localforage) => {
					return localforage.getItem(option.filePath);
				})
				.then((data) => {
					option.success && option.success({data, errMsg: null});
				})
				.catch((errMsg) => {
					option.fail && option.fail({errMsg});
				});
		},
		writeFile(option) {
			return loadjs("static/h5/localforage.min.js")
				.then((localforage) => {
					return localforage.setItem(option.filePath, option.data);
				})
				.then(() => {
					option.success && option.success({errMsg: null});
				})
				.catch((errMsg) => {
					option.fail && option.fail({errMsg});
				});
		},
		copyFile(option) {
			console.error("copyFile", option);
		},
		accessSync(path) {
			console.error("accessSync", path);
		},
		readFileSync(filePath, encoding, position, length) {
			console.error("readFileSync", filePath, encoding, position, length);
		},
		writeFileSync(filePath, data, encoding) {
			console.error("writeFileSync", filePath, data, encoding);
		},
	} as UniApp.FileSystemManager;
};
uni.createWorker = function (scriptPath) {
	let worker = new Worker(scriptPath);
	function onMessage(callback) {
		worker.onmessage = function (e) {
			callback(e.data);
		};
	}
	return Object.assign(worker, {onMessage});
};
uni.canvasToTempFilePath = (function (fn) {
	return function (opt) {
		if (opt.canvasId) return fn.apply(this, arguments);
		try {
			let canvas = (opt as any).canvas;
			let type = "image/png";
			if (opt.fileType == "jpg") type = "image/jpeg";
			opt.success && opt.success({tempFilePath: canvas.toDataURL(type)});
		} catch (error) {
			opt.fail && opt.fail({errMsg: error.message});
		}
		opt.complete && opt.complete(null);
	};
})(uni.canvasToTempFilePath);
uni.getImageInfo = function (opt) {
	let src = opt.src;
	let img = new Image();
	img.src = src;
	img.crossOrigin = "anonymous";
	img.referrerPolicy = "no-referrer";
	img.onload = function () {
		let res = {
			width: img.naturalWidth,
			height: img.naturalHeight,
			path: src[0] == "/" ? location.origin + src : src,
		};
		opt.success && opt.success(res);
		opt.complete && opt.complete(res);
	};
	img.onerror = function (e) {
		let res = {errMsg: "getImageInfo:fail"};
		opt.fail && opt.fail(res);
		opt.complete && opt.complete(res);
	};
};
uni.saveImageToPhotosAlbum = function (opt) {
	let a = document.createElement("a");
	a.href = opt.filePath;
	a.download = opt.filePath;
	a.target = "_blank";
	a.click();
};
// #endif
(global as any).uni = uni;
