import { SYS_INFO } from "@/lib/config";
import { getSvgSize, svg2dataurl, cacheFirst } from "../utils";
export function isReadable(data) {
    return data.readable && typeof data.on === "function";
}
export function loadImage(src) {
    if (/^\s*<svg/i.test(src))
        return Promise.resolve({
            path: svg2dataurl(src),
            ...getSvgSize(src),
        });
    if (src.endsWith(".svg")) {
        return uni.request({ url: src }).then((x) => {
            return loadImage(x.data);
        });
    }
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
export function createCanvasImage(canvas, url) {
    const image = canvas.createImage();
    return new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
    });
}
export function getImageData(url) {
    return loadImage(url).then(function (info) {
        const canvas = uni.createOffscreenCanvas({ type: "2d", width: info.width, height: info.height });
        const ctx = canvas.getContext("2d");
        const img = createCanvasImage(canvas, url);
        return img.then(function (img) {
            ctx.drawImage(img, 0, 0);
            return ctx.getImageData(0, 0, info.width, info.height);
        });
    });
}
export function saveImageData(imageData) {
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
        });
    });
}
export function drawImage(ctx, img, x, y, width, height) {
    return loadImage(img).then(function (info) {
        ctx.drawImage(info.path, x, y, width, height);
    });
}
function promisify(fn) {
    return function (options) {
        return new Promise(function (resolve, reject) {
            fn(Object.assign({}, options, {
                success(res) {
                    resolve(res);
                    if (options && options.success)
                        options.success(res);
                },
                fail(err) {
                    reject(err);
                    if (options && options.fail)
                        options.fail(err);
                },
            }));
        });
    };
}
export const getSystemInfo = cacheFirst(promisify(uni.getSystemInfo));
export function getSystemSize() {
    return getSystemInfo({}).then((info) => {
        return {
            width: info.windowWidth,
            height: info.windowHeight,
        };
    });
}
export const getSetting = promisify(uni.getSetting);
export const getUserProfile = promisify(uni.getUserProfile);
let back_at = 0;
export function exitConfirm(msg) {
    if (Date.now() - back_at < 1000) {
        plus.runtime.quit();
    }
    else {
        back_at = Date.now();
        uni.showToast({
            title: msg || "再按一次退出应用",
            icon: "none",
            duration: 2000,
        });
    }
}
export function getCurrentPage(n = -1) {
    let pages = getCurrentPages();
    n = n >= 0 ? n : pages.length + n;
    let page = pages[n];
    if (!page)
        return "";
    return n + ":" + page.route;
}
export function goBack() {
    let pages = getCurrentPages();
    if (pages.length > 1)
        uni.navigateBack({});
    else if (pages[0].route != "pages/main/main")
        uni.redirectTo({ url: "/pages/main/main" });
}
export function isPage(page) {
    let pages = getCurrentPages();
    return pages[0] && pages[0].route == page;
}
export function showActionSheet(sheets) {
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
export function withLoading(fn, options) {
    return function () {
        uni.showLoading(options);
        let pms = fn.apply(this, arguments);
        pms.finally(() => {
            uni.hideLoading();
        });
        return pms;
    };
}
export function rpx2px(rpx) {
    return (SYS_INFO.screenWidth * Number.parseInt(rpx)) / 750;
}
export function querySelector(sel, inst) {
    return new Promise((resolve, reject) => {
        uni
            .createSelectorQuery()
            .in(inst)
            .select(sel)
            .fields({ node: true }, null)
            .exec((res) => {
            resolve(res[0].node);
        });
    });
    let el = (inst?.$el || document).querySelector(sel);
    if (/uni-canvas/i.test(el.tagName)) {
        el = el.querySelector("canvas") || el;
    }
    return Promise.resolve(el);
}
