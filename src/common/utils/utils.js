/**
 * 对URL参数进行编码,相当于 encodeURIComponent, 但只会编码 %=?+& 字符, 更加易读
 * @param {string} str
 */
export function encodeURI(str) {
	return (str + "")
		.replace(/%/g, "%25")
		.replace(/=/g, "%3D")
		.replace(/\?/g, "%3F")
		.replace(/\+/g, "%2B")
		.replace(/&/g, "%26");
}

/**
 * 将data编码为URL的query参数
 * @param {{[key:string]:any}} data 要编码的数据。
 * @param {number} [limit] 限制过大的参数
 * @returns {string} 编码后的字符串
 * @example
 * encodeQuery({a: 1, b: 2}) // a=1&b=2
 */
export function encodeQuery(data, limit) {
	var ss = [];
	for (var k in data) {
		var v = data[k];
		if (v == null || typeof v === "function") continue;
		if (v === false) v = "";
		if (typeof v === "object") v = JSON.stringify(v);
		else v = v.toString();
		if (v.length > limit) continue;
		ss.push(encodeURI(k) + "=" + encodeURI(v));
	}
	return ss.join("&");
}

/**
 * 将URL的query参数解码为data
 * @param {string} str 要解码的字符串。
 * @returns {{[key:string]:any}} 解码后的数据。
 * @example
 * decodeQuery("a=1&b=2") // {a: 1, b: 2}
 */
export function decodeQuery(str) {
	var data = {};
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
 * 获取距离1970-01-04(星期日)的天数, 可以用于判断是否同一天, 返回值 % 7 可以得到星期几(0-6 代表星期日到星期六)
 * @param {Date|string|number} date
 * @returns {number}
 */
export function getDay(date) {
	if (date == null) date = new Date();
	else date = new Date(date);
	getDay.t = getDay.t || new Date("1970-01-04 00:00").getTime();
	return Math.floor((+date - getDay.t) / 86400e3);
}

/**
 * 格式化时间显示
 * - YY: 年份(2位)
 * - YYYY: 年份(4位)
 * - MM: 月份(2位)
 * - DD: 日期(2位)
 * - hh: 小时(2位)
 * - mm: 分钟(2位)
 * - ss: 秒(2位)
 * @param {string} format
 * @param {number|Date} t
 * @example
 * format("YYYY-MM-DD hh:mm:ss", new Date()) // "2019-01-01 00:00:00"
 */
export function format(format, t) {
	t = t == null ? new Date() : new Date(t);
	if (!format) {
		let now = new Date();
		if (getDay(now) - getDay(t) == 1) format = "昨天 hh:mm";
		else if (t.getFullYear() != now.getFullYear()) format = "YYYY-MM-DD hh:mm";
		else if (t.getMonth() != now.getMonth() || t.getDate() != now.getDate()) format = "MM-DD hh:mm";
		else format = "hh:mm";
	}
	let year = t.getFullYear().toString();
	var month = (t.getMonth() + 1).toString();
	if (month.length < 2) month = "0" + month;
	var date = t.getDate().toString();
	if (date.length < 2) date = "0" + date;
	var hours = t.getHours().toString();
	if (hours.length < 2) hours = "0" + hours;
	var mintues = t.getMinutes().toString();
	if (mintues.length < 2) mintues = "0" + mintues;
	var seconds = t.getSeconds().toString();
	if (seconds.length < 2) seconds = "0" + seconds;
	return format
		.replace(/YYYY/g, year)
		.replace(/YY/g, year.slice(2))
		.replace(/MM/g, month)
		.replace(/DD/g, date)
		.replace(/hh/g, hours)
		.replace(/mm/g, mintues)
		.replace(/ss/g, seconds);
}

/**
 * 用对旧数据优化的方式从保存的数据中恢复配置项
 * - 用v初始化def, 第一层只保留def的key，如果v中有相同的key, 则会覆盖def中的值
 * - 之后会合并def和v的key, 如果v中有相同的key, 则会覆盖def中的值
 * @template T
 * @param {T} def
 * @param {any} v
 * @param {boolean} [copyAllKeys]
 * @returns {T}
 * @example
 * deepInit({a: 1, b: {}}, {a: 3, b: {d: 1}, c: 4}) // {a: 3, b: {d: 1}}
 */
export function deepInit(def, v, copyAllKeys) {
	if (Array.isArray(def) && !Array.isArray(v)) return def;
	if (def != undefined && v == undefined) return def;
	if (def == null || v === null) return v;
	if (Array.isArray(def)) {
		def.length = 0;
		def.push.apply(def, v);
	} else if (typeof def === "object") {
		for (let k in def) {
			def[k] = deepInit(def[k], v[k], true);
			delete v[k];
		}
		if (copyAllKeys)
			for (let k in v) {
				def[k] = v[k];
			}
		return def;
	}
	return v;
}

/**
 * 深拷贝一个对象或数组
 * @template T
 * @param {T} obj
 * @returns {T}
 */
export function deepClone(obj) {
	if (obj == null) return obj;
	if (Array.isArray(obj)) {
		return obj.map(deepClone);
	}
	if (obj instanceof ArrayBuffer) return obj;
	if (obj instanceof Uint8Array) return obj;
	if (typeof obj === "object") {
		let o = {};
		for (let k in obj) {
			o[k] = deepClone(obj[k]);
		}
		return o;
	}
	return obj;
}

/**
 * 深度比较两个对象是否相等
 * @param {any} def
 * @param {any} v
 * @param {(paths:string[],val1:any,val2:any)=>boolean} fn 比较函数,paths是路径,val1是def中的值,val2是v中的值
 * @param {string[]} [paths] 请忽略,内部递归使用
 * @returns {boolean}
 */
export function deepDiff(def, v, fn, paths = []) {
	if (Array.isArray(def) && !Array.isArray(v)) return fn(paths, def, v);
	if ((def == null || v == null) && (def !== null || v !== null)) return fn(paths, def, v);
	if (Array.isArray(def)) {
		if (def.length != v.length) return fn(paths, def, v);
		for (let i = 0; i < def.length; i++) {
			if (deepDiff(def[i], v[i], fn, paths.concat(i))) return true;
		}
		return false;
	}
	if (typeof def === "object") {
		let set = new Set();
		for (let k in def) {
			if (deepDiff(def[k], v[k], fn, paths.concat(k))) return true;
			set.add(k);
		}
		for (let k in v) {
			if (!set.has(k) && deepDiff(def[k], v[k], fn, paths.concat(k))) return true;
		}
		return false;
	}
	return fn(paths, def, v);
}

/**
 * 通过文件路径获取文件夹路径
 * @param {string} filepath
 * @returns {string} 返回文件夹路径
 * @example
 * dirname("/foo/bar") // "/foo"
 */
export function dirname(filepath) {
	var i = filepath.length - 1;
	while ((filepath[i] == "/" || filepath[i] == "\\") && i > 0) i--;
	for (; i >= 0; i--) {
		if (filepath[i] == "/" || filepath[i] == "\\") return i ? filepath.slice(0, i) : filepath[i];
	}
	return "";
}

/**
 * 调整src高宽, 如果超过dst则使其刚好不超出dst,否则保持原样
 * @param {Size} src
 * @param {Size} dst
 */
export function limitSize(src, dst) {
	let ratio = 1;
	if (src.width > dst.width) {
		ratio = dst.width / src.width;
		src.width = dst.width;
		src.height = src.height * ratio;
	}
	if (src.height > dst.height) {
		ratio = dst.height / src.height;
		src.height = dst.height;
		src.width = src.width * ratio;
	}
	return src;
}

/**
 * 等待ms毫秒
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms);
	});
}

/**
 * 限制字符串长度, 如果超出，则显示...
 * @param {string} s 字符串
 * @param {number} n 限制长度(包含...)
 * @param {number} [m=0] 末尾要保留的字符数
 * @returns {string}
 */
export function limit(s, n, m = 0) {
	let tail = s && m ? s.slice(-m) : "";
	return s ? (s.length <= n + m ? s : s.slice(0, n - 3) + "..." + tail) : "";
}

/**
 * 生成随机字符串,包含小写字母和数字
 * @param {number} len
 * @returns {string}
 */
export function randomString(len) {
	if (len < 1) return "";
	let s = Math.random()
		.toString(36)
		.slice(2, len + 2);
	return s + randomString(len - s.length);
}

/**
 * 判断对象是否为空
 * @param {any} obj
 * @returns {boolean}
 * @example
 * isEmpty({}) // true
 * isEmpty({a: 1}) // false
 * isEmpty(null) // true
 */
export function isEmpty(obj) {
	if (!obj) return true;
	let ok = true;
	// eslint-disable-next-line no-unreachable-loop
	for (let _ in obj) {
		ok = false;
		break;
	}
	return ok;
}

/**
 * 创建一个Promise实例，可以在在外部调用resolve或reject
 * @template T
 * @param {(resolve:(v?:T)=>void, reject:(r?:any)=>void)=>void} [fn]
 * @return {IPromise<T>}
 * @example
 * const p = createPromise()
 * p.then(()=>{
 *  console.log('resolved');
 * });
 * // 其他地方
 * console.log(p.pending, p.resolved, p.rejected) // 判断Promise状态
 * setTimeout(()=>p.resolve(), 1000);
 */
export function newPromise(fn) {
	let a, b;
	var tmp = {
		resolve(x) {
			if (this.pending) {
				a(x);
				this.resolved = true;
				this.pending = false;
			}
		},
		reject(e) {
			if (this.pending) {
				b(e);
				this.rejectd = true;
				this.pending = false;
			}
		},
		pending: true,
		resolved: false,
		rejected: false,
	};
	/** @type {Promise<T>} */
	var pms = new Promise(function (resolve, reject) {
		a = resolve;
		b = reject;
		if (fn) fn(tmp.resolve, tmp.reject);
	});
	return Object.assign(pms, tmp);
}


/**
 * 生成svg图片的DataURL
 * @param {string} svg svg内容,可以是<svg>标签或者<svg>的内容
 * @param {Size} [size] svg的尺寸,当svg是<svg>的内容时生效
 * @returns {string}
 * @example
 * const svg = `<svg width="100" height="100"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red"/></svg>`;
 * const image = document.createElement('img');
 * image.src = svgToDataURL(svg);
 * document.body.appendChild(image);
 */
export function svg2dataurl(svg, size) {
	if (!/^<svg/.test(svg)) {
		size = Object.assign({width: 1000, height: 1000}, size);
		svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${
			size.w || size.width
		}" height="${size.h || size.height}" viewBox="0 0 ${size.width} ${size.height}">${svg}</svg>`;
	}
	return `data:image/svg+xml;utf8,${svg
		.replace(/>\s+</g, "><")
		.replace(/\r?\n/g, "")
		.replace(/%/g, "%25")
		.replace(/#/g, "%23")}`;
}

/**
 * 通过svg字符串获取svg大小
 * @param {string} svg
 * @returns {Size}
 * @example
 * getSvgSize(`<svg width="100" height="100"></svg>`) //=> {width: 100, height: 100}
 */
export function getSvgSize(svg) {
	let m = /<svg[^>]+>/.exec(svg);
	svg = m && m[0];
	m = /width=['"]([^'"]+)['"]/.exec(svg);
	let width, height, viewBox;
	if (m) {
		width = parseFloat(m[1]);
	} else {
		width = 0;
	}
	m = /height=['"]([^'"]+)['"]/.exec(svg);
	if (m) {
		height = parseFloat(m[1]);
	} else {
		height = 0;
	}
	if (width && height) return {width, height};
	m = /viewBox=['"]([^'"]+)['"]/.exec(svg);
	if (m) {
		viewBox = m[1].split(/\s+/).map((x) => parseFloat(x));
		if (viewBox.length === 4) {
			if (width) {
				height = (viewBox[3] * width) / viewBox[2];
			} else if (height) {
				width = (viewBox[2] * height) / viewBox[3];
			} else {
				width = viewBox[2];
				height = viewBox[3];
			}
		}
	}
	return {width, height};
}

/**
 * 传入一个返回Promise的函数fn,生成一个带缓存的函数
 * - 如果没有缓存或缓存过期，则调用fn获取数据
 * - 如果有缓存则返回缓存
 * - 调用新函数时第一个参数会作为缓存的key
 * - 调用新函数时传入参数大于1则禁用缓存,直接调用fn
 * - 注意fn的第一个参数必须是string或number,否则可能导致缓存错乱
 * @template {(...args:any[])=>any} T
 * @param {T} fn 缓存目标函数
 * @param {number} [maxAge=5e3] 最大缓存时间
 * @returns {T} 返回一个带缓存功能的新函数
 * @example
 * const getOrders = cacheFirst((user_id) => axios.get(`/api/orders/${user_id}`));
 * getOrders(1); // 调用接口并生成缓存,缓存key为 1
 * getOrders(1); // 找到key为1的缓存,不调用接口直接返回缓存
 * getOrders(2); // 由于没有key为2的缓存,调用接口并生成缓存,缓存key为 2
 * getOrders(2, 'payed'); // 由于有两个参数,不查找缓存直接调用接口,不会生成缓存
 */
export function cacheFirst(fn, maxAge = 5e3) {
	let cache = new Map();
	let tmap = new Map();
	return function (key) {
		if (
			Array.from(arguments)
				.slice(1)
				.filter((x) => x != null).length
		)
			return fn.apply(this, arguments);
		let t = tmap.get(key) || 0;
		if (t + maxAge < Date.now()) {
			let pms = fn.call(this, key);
			if (pms && typeof pms.then === "function") {
				let ret = cache.get(key);
				if (ret) pms = pms.catch(() => ret);
			}
			cache.set(key, pms);
			tmap.set(key, Date.now());
			return pms;
		}
		return cache.get(key);
	};
}
