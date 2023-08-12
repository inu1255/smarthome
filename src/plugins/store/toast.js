import {formatError} from "@/common/utils";

export default {
	success(msg) {
		msg = formatError(msg);
		return new Promise(function (resolve, reject) {
			uni.showToast({
				icon: "success",
				title: msg,
				duration: 1e3 + msg.length * 200,
				success: resolve,
				fail: reject,
			});
		});
	},
	error(msg) {
		msg = formatError(msg);
		// #ifdef APP-PLUS
		return uni.we.toast(msg);
		// #endif
		// #ifndef APP-PLUS
		// eslint-disable-next-line no-unreachable
		return new Promise(function (resolve, reject) {
			uni.showToast({
				icon: "none",
				title: msg,
				duration: 1e3 + msg.length * 200,
				success: resolve,
				fail: reject,
			});
		});
		// #endif
	},
};
