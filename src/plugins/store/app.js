/* eslint-disable vue/no-async-in-computed-properties */
import Vue from "vue";
import {getShareObject, watchLocal} from "@/common/utils";
import Dialog from "./Dialog";
import {SYS_INFO} from "@/lib/config";

export default getShareObject("app", () => {
	const VER = 1;
	let app = new Vue({
		data: {
			loading: 0, // 加载中
			tick: Date.now(), // 当前时间
			networkType: "wifi", // 网络类型
			system: SYS_INFO, // 系统信息
			page__: "", // 当前页面key
			close_page__: "", // 关闭页面key
			pages: [], // 页面列表
			dlg: new Dialog(),
			preventBack: false, // 阻止返回按钮
			/** 本地存储数据, electron项目保存在 electron/local/app.$local, web项目保存在 localstorage['app.$local'] */
			local: watchLocal("app.local", {
				uuid: "", // 客户端唯一标识
				version: 0, // 客户端版本
				user: null, // 用户信息
				miuser: {
					password: "",
					username: "",
				},
				remember: false, // 记住密码
			}),
			isLogin: false, // 是否登录
		},
		computed: {
			online() {
				return this.networkType !== "none";
			},
			isvip() {
				let {user} = this.local;
				return user && user.vip && user.vip.expire_at > Date.now();
			},
			// #ifdef MP-WEIXIN
			openid() {
				return this.local.user && this.local.user.account
					? this.local.user.account.split("/").pop()
					: "";
			},
			// #endif
		},
		methods: {},
	});
	// #ifdef APP-PLUS

	// #endif
	setInterval(() => {
		app.tick = Date.now();
	}, 1e3);
	function onNetworkType(res) {
		app.networkType = res.networkType;
	}
	uni.onNetworkStatusChange(onNetworkType);
	uni.getNetworkType({success: onNetworkType});
	return app;
});
