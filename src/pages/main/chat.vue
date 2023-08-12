<template>
	<view class="main-chat">
		<i-chatbox
			ref="chat"
			class="i-chatbox"
			:list="body.chatlist"
			:disabled="loading"
			:avatar="avatar"
			:selfavatar="selfavatar"
			:mode="mode"
			@send="send"
		>
			<view class="actions">
				<uni-icons
					class="btn"
					type="chatbubble-filled"
					:color="mode == 0 ? '#05c160' : '#000'"
					:size="size"
					@click="setMode(0)"
				></uni-icons>
				<uni-icons
					class="btn"
					type="sound-filled"
					:color="mode == 1 ? '#05c160' : '#000'"
					:size="size"
					@click="setMode(1)"
				></uni-icons>
			</view>
		</i-chatbox>
	</view>
</template>
<script>
import {rpx2px} from "@/common/utils";
import {getService, speakText, textDirective} from "@/lib/mi-service";
export default {
	name: "Main",
	components: {},
	props: {
		name: String,
	},
	data() {
		return {
			loading: false, // 回复中禁止发送
			size: rpx2px(48), // 按钮大小
			avatar: "/static/images/xiaoai.png", // 对方头像
			selfavatar: "/static/images/gift.png", // 自身头像,h5嵌入小程序生成截图时使用
			mode: 0, // 0: 控制 1: 说话
			body: {
				name: "", // 设备名称
				model: "", // 设备模型
				did: "", // 设备ID
				chatlist: [],
			},
		};
	},
	computed: {},
	watch: {},
	mounted() {
		getService("miio").then((miio) => {
			this.miio = miio;
		});
		getService("mina").then((mina) => {
			this.mina = mina;
			return mina.device_list().then((devices) => {
				let device = devices.find((x) => x.miotDID == this.body.did);
				if (!device) return;
				this.deviceID = device.deviceID;
				this.hardware = device.hardware;
				this.loadmore(100);
			});
		});
	},
	beforeDestroy() {
		clearTimeout(this.timer);
	},
	methods: {
		loadmore(limit) {
			let {deviceID, hardware} = this;
			return this.mina.get_conversations(deviceID, hardware, limit).then((res) => {
				let list = res.records.reverse();
				if (this.time) {
					list = list.filter((x) => x.time > this.time);
				}
				list.forEach((x) => {
					this.time = x.time;
					this.body.chatlist.push({
						self: 1,
						type: "text",
						content: x.query,
						time: x.time,
					});
					x.answers.forEach((y) => {
						if (y.tts) {
							this.body.chatlist.push({
								self: 0,
								type: "text",
								content: y.tts.text,
								time: x.time,
							});
						} else if (y.audio) {
							this.body.chatlist.push({
								self: 0,
								type: "audio",
								content:
									"正在播放以下音乐:\n" +
									y.audio.audioInfoList.map((z) => z.title + "@" + z.artist).join("\n"),
								time: x.time,
							});
						} else {
							console.log("unknown answer", y);
						}
					});
				});
				return list;
			});
		},
		waitAnser() {
			clearTimeout(this.timer);
			this.timer = setTimeout(() => {
				this.loadmore(2).then((list) => {
					if (!list.length) {
						this.waitAnser();
					}
				});
			}, 1e3);
		},
		send(text) {
			console.log("text", text);
			this.loading = true;
			let pms;
			if (this.mode) {
				// 说话
				pms = speakText({
					miio: this.miio,
					text: text,
					did: this.body.did,
					deviceID: this.deviceID,
					hardware: this.hardware,
				});
			} else {
				// 发送指令
				this.loading = true;
				pms = textDirective({
					miio: this.miio,
					text: text,
					did: this.body.did,
					deviceID: this.deviceID,
					hardware: this.hardware,
				}).then(() => {
					this.waitAnser();
				});
			}
			pms.finally(() => {
				this.loading = false;
			});
		},
		setMode(mode) {
			this.mode = mode;
		},
	},
	async onLoad(par) {
		if (!par) return;
		this.body.did = par.did;
		this.body.name = par.name;
		this.body.model = par.model;
		uni.setNavigationBarTitle({
			title: this.body.name,
		});
	},
};
</script>
<style lang="less">
@import "~@/styles/define.less";
.main-chat {
	display: flex;
	flex-direction: column;
	height: 100%;
	box-sizing: border-box;
	position: relative;
	.actions {
		> .btn {
			margin-left: 24rpx;
		}
		> .mode {
			font-size: 36rpx;
			position: relative;
			top: -7rpx;
		}
	}
	.i-chatbox {
		flex: 1;
	}
	.drawer-content {
		height: 100%;
		.setting-line {
			display: flex;
			align-items: center;
			padding: 6px 10px;
			.i-avatar {
				margin-right: 10px;
			}
		}
		.icon-line {
			display: flex;
			padding: 6px 10px;
			align-items: center;
			> .name {
				width: 25px;
				text-align: center;
			}
			> .desc {
				margin-left: 6px;
				font-size: 13px;
			}
		}
	}
}
</style>
