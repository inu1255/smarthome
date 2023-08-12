<template>
	<view class="mine-mine">
		<i-status-bar></i-status-bar>
		<view v-if="isLogin" class="header">
			<image class="background" src="https://img.paulzzh.com/touhou/random" mode="widthFix" />
			<view class="absfull">
				<view class="nickname">{{ username || "已登录" }}</view>
			</view>
		</view>
		<view v-else class="header" @click="login">
			<image class="background" src="https://img.paulzzh.com/touhou/random" mode="widthFix" />
			<view class="absfull">
				<view class="nickname no-login">未登录</view>
			</view>
		</view>
		<uni-list>
			<uni-list-item
				v-if="isLogin"
				title="复制登录信息"
				show-arrow
				clickable
				@click="copy"
			></uni-list-item>
			<uni-list-item
				title="设置登录信息"
				show-arrow
				clickable
				note="如果不想输入密码,可以将mi.token复制过来使用"
				@click="set"
			></uni-list-item>
			<uni-list-item
				:title="isLogin ? '退出登陆' : '清除账号信息'"
				show-arrow
				clickable
				@click="logout"
			></uni-list-item>
		</uni-list>
	</view>
</template>
<script>
import {logout, readStore, saveStore} from "@/lib/mi-service";
export default {
	name: "Mine",
	components: {},
	props: {
		name: String,
	},
	data() {
		return {};
	},
	computed: {
		isLogin() {
			return this.$app.isLogin;
		},
		username() {
			return this.$local.miuser.username;
		},
	},
	watch: {},
	mounted() {},
	methods: {
		login() {
			this.$dlg.show("/pages/main/mi-login").then((ok) => {
				if (ok) {
					this.$app.isLogin = true;
				}
			});
		},
		logout() {
			if (!this.isLogin) {
				this.$local.miuser = {
					password: "",
					username: "",
				};
				uni.showToast({
					title: "清除成功",
				});
				return;
			}
			this.$dlg.confirm("确定退出登陆吗？").then((ok) => {
				if (!ok) return;
				logout().finally(() => {
					this.$local.miuser = {
						password: "",
						username: "",
					};
					this.$app.isLogin = false;
				});
			});
		},
		copy() {
			readStore().then((store) => {
				uni.setClipboardData({
					data: JSON.stringify(store),
					success: () => {
						uni.showToast({
							title: "复制成功",
						});
					},
				});
			});
		},
		set() {
			this.$dlg
				.show("/pages/view/form", {
					params: {
						data: {lbl: "登录信息", need: true, type: "textarea", maxlength: 1024},
					},
				})
				.then((res) => {
					if (!res || !res.data) return;
					let json = JSON.parse(res.data);
					return saveStore(json);
				})
				.then(() => {
					this.$app.isLogin = true;
					uni.showToast({
						title: "设置成功",
					});
				})
				.catch((err) => {
					console.error(err);
					this.$toast.error(err);
				});
		},
	},
	onShow() {},
};
</script>
<style lang="less">
@import "~@/styles/define.less";
.mine-mine {
	.header {
		flex-direction: column;
		align-items: center;
		position: relative;
		> .background {
			filter: brightness(0.5);
			width: 100%;
		}
		> .absfull {
			top: 100rpx;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.avatar-box {
			display: inline-block;
			position: relative;
			> .crown {
				position: absolute;
				top: -22rpx;
				left: -26rpx;
				transform: rotate(-20deg);
				width: 60rpx;
				height: 40rpx;
			}
		}
		.avatar {
			width: 300rpx;
			height: 300rpx;
			border-radius: 300rpx;
		}
		.nickname {
			text-align: center;
			height: 100rpx;
			line-height: 100rpx;
			font-size: 38rpx;
			color: #fff;
			&.no-login {
				color: #aaa;
			}
		}
	}
}
</style>
