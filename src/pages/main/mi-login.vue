<!-- 账号密码登录页 -->
<template>
	<view class="login-login-withpwd">
		<!-- 顶部文字 -->
		<uni-forms>
			<uni-forms-item name="username">
				<uni-easyinput
					v-model="miuser.username"
					:focus="focusAccount"
					class="input-box"
					:input-border="false"
					placeholder="请输入小米账号"
					@blur="focusAccount = false"
				/>
			</uni-forms-item>
			<uni-forms-item name="password">
				<uni-easyinput
					v-model="miuser.password"
					:focus="focusPassword"
					class="input-box"
					clearable
					type="password"
					:input-border="false"
					placeholder="请输入密码"
					@blur="focusPassword = false"
				/>
			</uni-forms-item>
		</uni-forms>
		<view class="root">
			<checkbox-group @change="setRemember">
				<label class="checkbox-box">
					<checkbox :checked="$local.remember" style="transform: scale(0.5); margin-right: -6px" />
					<text class="text">记住密码</text>
				</label>
			</checkbox-group>
		</view>
		<button class="uni-btn" type="primary" @click="pwdLogin">登录</button>
		<!-- 忘记密码 -->
		<view class="link-box">
			<view>
				<text class="forget">您的账号密码仅保存在本地用于模拟米家登录,不会上传到我们的服务器</text>
			</view>
		</view>
	</view>
</template>

<script>
import {getService} from "@/lib/mi-service/index";

export default {
	components: {},
	data() {
		return {
			miuser: {},
			// 图片验证码
			captcha: null,
			focusAccount: false,
			focusPassword: false,
			logo: "/static/logo.png",
		};
	},
	onShow() {
		let {username, password} = this.$local.miuser;
		this.miuser = {username, password};
		// #ifdef H5
		document.onkeydown = (event) => {
			var e = event || window.event;
			if (e && e.keyCode == 13) {
				// 回车键的键值为13
				this.pwdLogin();
			}
		};
		// #endif
	},
	methods: {
		/**
		 * 密码登录
		 */
		async pwdLogin() {
			let {username, password} = this.miuser;
			if (!password.length) {
				this.focusPassword = true;
				return uni.showToast({
					title: "请输入密码",
					icon: "none",
				});
			}
			if (!username.length) {
				this.focusAccount = true;
				return uni.showToast({
					title: "请输入小米账号",
					icon: "none",
				});
			}
			this.$local.miuser.username = username;
			if (this.$local.remember) this.$local.miuser.password = password;
			else this.$local.miuser.password = "";
			let params = {username, password};
			try {
				let miio = await getService("miio", params);
				let mina = await getService("mina", params);
				this.$dlg.close({miio, mina});
			} catch (error) {
				console.error(error);
				this.$toast.error(error.desc || error);
			}
		},
		setRemember(e) {
			this.$local.remember = !this.$local.remember;
		},
	},
};
</script>

<style lang="less">
.login-login-withpwd {
	padding: 0 30px;
	padding-top: 15px;
	/* #ifndef APP-NVUE */
	display: flex;
	flex-direction: column;
	/* #endif */
	> .title {
		display: flex;
		padding: 18px 0;
		font-weight: 800;
		flex-direction: column;
	}

	> .tip {
		display: flex;
		color: #bdbdc0;
		font-size: 11px;
		margin: 6px 0;
		margin-top: -15px;
		margin-bottom: 20px;
	}

	> .phone-box {
		position: relative;
		display: flex;
		> .area {
			position: absolute;
			left: 10px;
			z-index: 9;
			top: 12px;
			font-size: 14px;
			&::after {
				content: "";
				border: 3px solid transparent;
				border-top-color: #000;
				top: 12px;
				left: 3px;
				position: relative;
			}
		}
	}

	.input-box {
		height: 44px;
		background-color: #f8f8f8 !important;
		border-radius: 0;
		font-size: 14px;
		display: flex;
		flex: 1;
	}

	> .uni-btn {
		text-align: center;
		height: 40px;
		line-height: 40px;
		margin: 15px 0 0 0;
		color: #fff !important;
		border-radius: 5px;
	}

	.forget {
		font-size: 12px;
		color: #8a8f8b;
	}

	.link-box {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		justify-content: space-between;
		margin-top: 20px;
	}

	.link {
		font-size: 12px;
	}
}
</style>
