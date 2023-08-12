<template>
	<view class="i-status-bar" :style="css">
		<view class="i-status-bar__fixed" :style="css"></view>
	</view>
</template>
<script>
export default {
	name: "IStatusBar",
	components: {},
	props: {
		color: {type: String, default: "#fff"},
	},
	data() {
		return {};
	},
	computed: {
		height() {
			return this.$app.system.statusBarHeight;
		},
		css() {
			return `height:${this.height}px;background-color:${this.color}`;
		},
	},
	mounted() {},
	methods: {},
};
</script>
<style lang="less">
@import "~@/styles/define.less";
.i-status-bar {
	width: 100%;
	> .i-status-bar__fixed {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 99999;
	}
}
</style>
