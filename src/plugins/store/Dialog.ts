import {encodeQuery, getCurrentPage, isEmpty, newPromise} from "@/common/utils";

export default class Dialog {
	data: any[];
	layouts: any[];
	constructor() {
		this.data = [];
		this.layouts = [];
	}

	/**
	 * @param {string} url
	 * @param {string|any} [transition]
	 * @param {any} [props]
	 * @returns
	 */
	show(url: string, transition?: string | any, props?: any) {
		if (typeof transition === "object") {
			props = transition;
			transition = "pop-in";
		}
		props = Object.assign({}, props);
		if (!isEmpty(props)) url += (url.indexOf("?") > 0 ? "&" : "?") + encodeQuery(props, 128);
		let pms = newPromise();
		this.data.push({url, props, pms, page: getCurrentPage()});
		uni.navigateTo({url, animationType: transition});
		return pms;
	}

	getQuery(query: any) {
		let last = this.data[this.data.length - 1];
		if (last) {
			return last.props;
		}
		for (let k in query) {
			try {
				query[k] = decodeURIComponent(query[k]);
				query[k] = JSON.parse(query[k]);
			} catch (error) {}
		}
		return query;
	}

	onBack(v: any) {
		let last = this.data.pop();
		if (last) {
			console.log("dialog onBack", v);
			last.pms.resolve(v);
		}
	}

	close(v: any) {
		this.onBack(v);
		uni.navigateBack({});
	}

	onclose(v) {
		let last = this.data[this.data.length - 1];
		// !不能同一个页面 同时打开多个dialog
		if (last && last.page == getCurrentPage(-2)) {
			last.pms.resolve(v);
			this.data.pop();
		}
	}

	open(opt) {
		let layout = this.layouts[this.layouts.length - 1];
		if (layout && layout.show) {
			return layout.show(opt);
		}
		return new Promise((resolve, reject) => {
			uni.showModal({
				title: opt.title,
				content: opt.content,
				editable: opt.value != null,
				showCancel: opt.btns.length > 1,
				confirmText: opt.btns[opt.btns.length - 1],
				success: (res) => {
					resolve(res.confirm ? 1 : 0);
				},
				fail: (err) => {
					reject(err);
				},
			});
		});
	}

	alert(msg: string, opt?: any) {
		opt = Object.assign({title: "温馨提示", btns: ["确定"]}, opt);
		opt.content = msg;
		return this.open(opt);
	}

	confirm(msg: string, opt?: any) {
		opt = Object.assign({title: "温馨提示", btns: ["取消", "确定"]}, opt);
		opt.content = msg;
		return this.open(opt);
	}

	prompt(msg: string, value: string, opt: any) {
		opt = Object.assign({title: "温馨提示", btns: ["取消", "确定"]}, opt);
		opt.content = msg;
		opt.value = value || "";
		return this.open(opt);
	}

	toast(opt?: any) {
		let layout = this.layouts[this.layouts.length - 1];
		if (layout && layout.toast) {
			opt.position = opt.position || "top";
			return layout.toast(opt);
		}
		return new Promise((resolve, reject) => {
			uni.showToast({
				title: opt.msg,
				icon: opt.type == "success" ? "success" : "none",
				duration: opt.duration,
				success: (res) => {
					resolve(res);
				},
				fail: (err) => {
					reject(err);
				},
			});
		});
	}

	success(msg: string, opt?: any) {
		opt = Object.assign({type: "success"}, opt);
		opt.message = msg;
		return this.toast(opt);
	}

	error(msg: string, opt?: any) {
		opt = Object.assign({type: "error"}, opt);
		opt.message = msg;
		return this.toast(opt);
	}
}
