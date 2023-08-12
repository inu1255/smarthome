const manifest = require("./bin/manifest");
const fs = require("fs");

process.env.VUE_WX_APPID = manifest["mp-weixin"].appid;
process.env.VUE_APPNAME = manifest.name;

let filepath = "node_modules/@dcloudio/uni-ui/lib/uni-easyinput/uni-easyinput.vue";
let text = fs.readFileSync(filepath, "utf8");
let text1 = text.replace(
	'placeholder-class="uni-easyinput__placeholder-class"\n',
	`placeholder-class="uni-easyinput__placeholder-class" :show-confirm-bar="false"\n`
);
if (text1 != text) {
	console.log("hack uni-easyinput.vue");
	fs.writeFileSync(filepath, text1);
}

/** @type {import('@vue/cli-service').ProjectOptions} */
module.exports = {
	devServer: {
		disableHostCheck: true,
	},
	configureWebpack: (config) => {
		// 纯文本加载 glsl
		config.module.rules.push({
			test: /\.(glsl)$/,
			use: "raw-loader",
		});
	},
	transpileDependencies: ["@dcloudio/uni-ui", "uview-ui"],
};
