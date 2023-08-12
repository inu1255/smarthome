import {getCurrentPage} from "@/common/utils";
import app from "@/plugins/store/app";
import {computed} from "../plugins/index";
import {APP_NAME} from "./config";

(() => {
	const success = (e) => {
		app.page__ = getCurrentPage();
		console.log(e.errMsg, app.page__);
	};
	uni.addInterceptor("navigateTo", {success});
	uni.addInterceptor("redirectTo", {success});
	uni.addInterceptor("switchTab", {success});
	uni.addInterceptor("navigateBack", {success});
})();

/** @type {VueMixin} */
export const iMix = {
	data() {
		return {
			/** 当前组件实例所在路由 2:pages/main/broswer */
			page__: null,
			destroyed: false,
		};
	},
	computed: {
		// #ifdef APP-NVUE
		...computed,
		// #endif
		istop() {
			return this.page__ === this.$app.page__;
		},
	},
	created() {
		this.page__ = getCurrentPage();
		if (!app.page__) app.page__ = this.page__;
		// 组件文件名
		this.__file = this.$options && (this.$options.__file || this.$options._componentTag);
		// 是否页面组件
		this.__ispage = this.mpType == "page";
		if (this.__ispage) {
			app.pages.push(this);
			console.log("created", app.pages.length);
		}
	},
	mounted() {},
	beforeDestroy() {
		this.destroyed = true;
		this.page__ = null;
		app.close_page__ = app.page__;
		if (this.__ispage) {
			app.pages.pop();
			this.$dlg.onclose(this.return_data);
			console.log("destroy", app.pages.length);
		}
	},
	onShareAppMessage(par) {
		return {title: APP_NAME};
	},
	onShareTimeline() {
		return {title: APP_NAME};
	},
};
