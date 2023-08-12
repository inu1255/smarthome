import app from "./store/app";
import Vue from "vue";
import {loading, getCurrentPage} from "@/common/utils";
import toast from "./store/toast";

uni.Vue = Vue;

const vue = {};
vue.$app = app;
vue.$local = app.local;
vue.$toast = toast;
vue.$dlg = app.dlg;

vue.$listen = function (listener, eventType, fn) {
	if (typeof listener === "string") {
		fn = eventType;
		eventType = listener;
		listener = null;
	}
	if (!listener || typeof listener.on != "function") return;
	let that = this;
	let page = getCurrentPage();
	listener.on(eventType, function () {
		if (getCurrentPage() !== page)
			return console.log(`$listen: page changed, ${eventType} ignored`);
		return fn.apply(that, arguments);
	});
	this.$once("hook:beforeDestroy", function () {
		listener.off(eventType, fn);
	});
};
vue.$with = loading;

const computed = {};
for (let k in vue) {
	computed[k] = {
		get() {
			return vue[k];
		},
	};
}

Object.assign(Vue.prototype, vue);

export default vue;
export {computed};
