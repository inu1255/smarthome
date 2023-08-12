<template>
	<view class="i-chatbox">
		<scroll-view
			class="i-chatbox__body"
			:scroll-into-view="'v' + scrollId"
			scroll-y
			scroll-anchoring
			show-scrollbar
		>
			<view
				v-for="(item, i) in list"
				:key="item.id"
				class="i-chatbox__item"
				:class="{self: item.self}"
			>
				<view class="i-chatbox__item__avatar" @click="onClickAvatar(i)">
					<image v-if="item.self" class="avatar self" :src="selfavatar || user.avatar" />
					<image v-else class="avatar" :src="item.avatar || avatar" />
				</view>
				<view class="i-chatbox__item__content">
					<view v-if="item.time" class="i-chatbox__item__content__time">{{
						format(item.time)
					}}</view>
					<view
						v-if="item.type == 'image'"
						class="i-chatbox__item__content__image"
						:class="{self: item.self}"
					>
						<i-image :src="item.content"></i-image>
					</view>
					<view
						v-else
						class="i-chatbox__item__content__text"
						:class="{self: item.self}"
						@click="copy(i)"
					>
						<i-stream-text
							v-if="item.loading"
							:text="item.content"
							@change="onchange"
						></i-stream-text>
						<text v-else user-select>{{ item.content }}</text>
						<text v-if="item.loading" class="blink"></text>
					</view>
				</view>
			</view>
			<view :id="'v' + viewId" class="i-chatbox__body_footer"></view>
		</scroll-view>
		<view class="i-chatbox__footer" :class="{focus}">
			<slot></slot>
			<view class="i-chatbox__footer-input">
				<textarea
					v-model="text"
					clearable
					:maxlength="2000"
					:placeholder="placeholder"
					class="textarea"
					:class="{focus}"
					:auto-height="autoHeight"
					trim="none"
					type="textarea"
					confirm-type="return"
					:cursor-spacing="12"
					:show-confirm-bar="false"
					@focus="onfocus(true)"
					@blur="onfocus(false)"
				></textarea>
				<button :disabled="disabled" @click="doSend">{{ sendText || `发送` }}</button>
			</view>
		</view>
	</view>
</template>
<script>
import {parse} from "marked";
import {format} from "@/common/utils";

export default {
	name: "IChatbox",
	components: {},
	props: {
		list: {type: Array, default: () => []},
		send: Function,
		disabled: Boolean,
		avatar: String,
		selfavatar: String,
		mode: {type: Number, default: 0},
	},
	data() {
		return {
			text: "",
			viewId: 0,
			scrollId: 0,
			focus: false,
		};
	},
	computed: {
		len() {
			return this.list.length;
		},
		user() {
			return this.$local.user;
		},
		autoHeight() {
			return this.text.split("\n").length < 10;
		},
		sendText() {
			return this.mode ? "说话" : "发送";
		},
		placeholder() {
			return this.mode ? "让小爱替您说话" : "给小爱发送指令";
		},
	},
	watch: {
		len() {
			console.log("change", this.len);
			this.onchange();
		},
	},
	mounted() {},
	beforeDestroy() {},
	methods: {
		onfocus(flag) {
			this.focus = flag;
			this.$emit("focuschange", flag);
		},
		markdown(text) {
			return parse(text).replace(
				/<code>/g,
				'<code style="word-break:break-all;white-space:pre-wrap;">'
			);
		},
		format(time) {
			return format(null, time);
		},
		setText(text) {
			this.text = text;
		},
		getText() {
			return this.text.trim();
		},
		doSend() {
			let text = this.getText();
			if (!text) return;
			this.$emit("send", text);
			this.text = "";
		},
		onchange() {
			this.viewId++;
			console.log("onchange", this.viewId);
			setTimeout(() => {
				this.scrollId = this.viewId;
			});
		},
		copy(i) {
			let item = this.list[i];
			uni.setClipboardData({
				data: item.content,
				success: () => {
					uni.showToast({
						title: "复制成功",
						icon: "none",
					});
				},
			});
		},
		onClickAvatar(i) {
			this.$emit("click-avatar", i);
		},
	},
};
</script>
<style lang="less">
@import "~@/styles/define.less";
.i-chatbox {
	position: relative;
	display: flex;
	flex-direction: column;
	height: 100%;
	background: #f1f2f3;
	// #ifdef MP-WEIXIN
	height: 100vh;
	// #endif
	.i-chatbox__item {
		display: flex;
		padding: 12px;
		width: 80%;
		margin-top: 10px;
		box-sizing: border-box;
		&:first-child {
			margin-top: 0;
		}
		&.self {
			flex-direction: row-reverse;
			margin-left: 20%;
			.i-chatbox__item__content__time {
				text-align: right;
			}
			> .i-chatbox__item__avatar {
				margin-left: 5px;
				margin-right: 0;
			}
		}
		> .i-chatbox__item__avatar {
			margin-right: 12px;
			> .avatar,
			> .i-svg {
				min-width: 36px;
				min-height: 36px;
				width: 36px;
				height: 36px;
				border-radius: 5px;
				color: #10a37f;
			}
		}
		> .i-chatbox__item__content {
			align-items: center;
			position: relative;
			font-size: 32rpx;
			max-width: calc(100% - 45px);
			> .i-chatbox__item__content__time {
				font-size: 12px;
				color: #999;
			}
			> .i-chatbox__item__content__image {
				border-radius: 8px;
				border: 1px solid #e8eaec;
				background: #fff;
				overflow: hidden;
				&.self {
					background: #95ec69;
				}
			}
			> .i-chatbox__item__content__text {
				padding: 12px 10px;
				border-radius: 8px;
				border-top-left-radius: 4px;
				background: #fff;
				white-space: pre-wrap;
				word-break: break-all;
				&.self {
					border-top-left-radius: 8px;
					border-top-right-radius: 4px;
					background: #95ec69;
				}
				> .blink {
					@keyframes blink {
						0% {
							opacity: 0;
						}
						50% {
							opacity: 1;
						}
						100% {
							opacity: 0;
						}
					}
					display: inline-block;
					width: 2px;
					height: 13px;
					vertical-align: middle;
					background-color: #10a37f;
					animation: blink 1s infinite;
				}
			}
		}
	}
	> .i-chatbox__body {
		flex: 1;
		height: 1px;
		.i-chatbox__body_footer {
			height: 15px;
		}
		/deep/ .uni-scroll-view-content {
			height: unset;
		}
	}
	> .i-chatbox__footer {
		&.focus {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
		}
		> .i-chatbox__footer-input {
			display: flex;
			align-items: flex-end;
			padding: 6px;
			padding-bottom: 24rpx;
			position: relative;
			> .textarea {
				flex: 1;
				width: 1px;
				padding: 6px;
				border-radius: 5px;
				border: 1px solid #ccc;
				font-size: 28rpx;
				background-color: #fff;
				&.focus {
					border-color: #2979ff;
				}
			}
			button {
				margin-left: 5px;
				margin-bottom: 2px;
				padding: 7px 12px;
				.background3(#05c160);
				border: none;
				color: #fff;
				line-height: 1;
				font-size: 28rpx;
			}
		}
	}
}
</style>
