<template>
	<text class="i-stream-text">{{ content }}</text>
</template>
<script>
export default {
	name: "IStreamText",
	components: {},
	props: {
		text: String,
	},
	data() {
		return {
			content: "",
		};
	},
	computed: {},
	watch: {
		text() {
			this.setText(this.text);
		},
		content() {
			this.$emit("change", this.content);
		},
	},
	mounted() {
		this.setText(this.text);
	},
	beforeDestroy() {
		clearInterval(this.timer);
	},
	methods: {
		setText(text) {
			clearInterval(this.timer);
			let n = Math.min(text.length, this.content.length);
			for (let i = 0; i < n; i++) {
				if (text[i] != this.content[i]) {
					this.content = text.slice(0, i);
					break;
				}
			}
			this.timer = setInterval(() => {
				if (this.content.length < text.length) {
					this.content += text[this.content.length];
				} else {
					clearInterval(this.timer);
				}
			}, 10);
		},
	},
};
</script>
<style lang="less">
@import "~@/styles/define.less";
.i-stream-text {
}
</style>
