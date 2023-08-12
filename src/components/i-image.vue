<template>
	<image class="i-image" :src="src" mode="aspectFit" :style="style" @load="onload"> </image>
</template>
<script>
import {limitSize} from "@/common/utils";
import {SYS_INFO} from "@/lib/config";

export default {
	name: "IImage",
	components: {},
	props: {
		src: String,
		limit: Object,
	},
	data() {
		return {
			style: "",
		};
	},
	computed: {},
	mounted() {},
	methods: {
		onload(e) {
			let size = e.detail;
			limitSize(
				size,
				this.limit || {width: SYS_INFO.windowWidth * 0.4, height: SYS_INFO.windowHeight * 0.6}
			);
			this.style = `width:${size.width}px;height:${size.height}px;`;
		},
	},
};
</script>
<style lang="less">
@import "~@/styles/define.less";
.i-image {
}
</style>
