<template>
	<view class="main-main">
		<view v-if="!isLogin" class="no-login">
			<swiper class="swiper-box" autoplay indicator-dots circular>
				<swiper-item v-for="(item, index) in images" :key="index">
					<image :src="item" mode="widthFix"></image>
				</swiper-item>
			</swiper>
			<button @click="login">登录米家</button>
		</view>
		<view v-else class="logined">
			<uni-list>
				<uni-list-item
					v-for="(item, i) in speakers"
					:key="i"
					:title="item.name"
					show-arrow
					clickable
					:note="item.isOnline ? '' : '离线'"
					:disabled="!item.isOnline"
					@click="speakWith(item)"
				></uni-list-item>
			</uni-list>
		</view>
	</view>
</template>
<script>
import {getService} from "@/lib/mi-service";

export default {
	name: "Main",
	components: {},
	props: {
		name: String,
	},
	data() {
		return {
			images: [
				"/static/images/header.png",
				"/static/images/header1.png",
				"/static/images/header2.png",
			],
			devices: [],
		};
	},
	computed: {
		isLogin() {
			return this.$app.isLogin;
		},
		speakers() {
			return this.devices.filter((x) => x.model.startsWith("xiaomi.wifispeaker"));
		},
	},
	onShow() {
		this.refresh();
	},
	mounted() {},
	methods: {
		refresh() {
			getService("miio")
				.then((miio) => {
					return miio.device_list();
				})
				.then((devices) => {
					console.log(devices);
					this.devices = devices;
					this.$app.isLogin = true;
				})
				.catch((err) => {
					console.error(err);
					this.$app.isLogin = false;
				});
		},
		login() {
			this.$dlg.show("/pages/main/mi-login").then((ok) => {
				if (ok) {
					this.$app.isLogin = true;
				}
			});
		},
		speakWith(item) {
			this.$dlg.show("/pages/main/chat", {
				name: item.name,
				did: item.did,
				model: item.model,
			});
		},
	},
};
</script>
<style lang="less">
@import "~@/styles/define.less";
.main-main {
	padding: 30rpx;
	swiper {
		height: 400rpx;
		image {
			width: 100%;
		}
	}
	button {
		margin-top: 20px;
	}
}
.webview {
	height: 400px;
}
</style>
