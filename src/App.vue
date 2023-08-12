<script>
import Vue from "vue";

export default Vue.extend({
	mpType: "app",
	// #ifdef H5
	created() {
		window.vue = this;
	},
	// #endif
	async onLaunch(opt) {
		console.log("App Launch", opt);
		// #ifdef APP-PLUS
		plus.screen.lockOrientation("portrait-primary");
		// #endif
	},
	methods: {},
	onShow() {
		console.log("App Show");
		this.$app.show = true;
		// #ifdef APP-PLUS
		if (plus.runtime.arguments) {
			(async (args) => {
				console.log("onArgs", args);
			})(plus.runtime.arguments);
		}
		plus.runtime.arguments = "";
		// #endif
	},
	onHide() {
		console.log("App Hide");
		this.$app.show = false;
	},
});
</script>

<style lang="less">
@import "@/styles/common.less";
page {
	height: 100%;
	font-size: 32rpx;
}
</style>

<style lang="scss">
/*每个页面公共css */
@import "uview-ui/index.scss";
</style>
