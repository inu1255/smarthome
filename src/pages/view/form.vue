<template>
	<view class="view-form">
		<uni-forms
			ref="form"
			:model-value="formData"
			:rules="rules"
			label-position="top"
			label-width="120"
		>
			<uni-forms-item
				v-for="(item, i) in params"
				:key="i"
				:name="item.key"
				:label="item.label"
				:required="item.required"
			>
				<checkbox-group
					v-if="item.checkboxs"
					class="item-group"
					@change="checkboxChange(item, $event)"
				>
					<label v-for="(check, j) in item.checkboxs" :key="j">
						<checkbox
							style="transform: scale(0.7)"
							:value="j + ''"
							:checked="formData[item.key] && formData[item.key].includes(j + '')"
							color="#FFCC33"
						/>{{ check }}
					</label>
				</checkbox-group>
				<radio-group v-else-if="item.radios" class="item-group" @change="radioChange(item, $event)">
					<label v-for="(radio, j) in item.radios" :key="j">
						<radio
							style="transform: scale(0.7)"
							:value="j + ''"
							:checked="j == formData[item.key]"
							color="#FFCC33"
						/>{{ radio }}
					</label>
				</radio-group>
				<uni-easyinput
					v-else
					v-model="formData[item.key]"
					:type="item.type"
					:placeholder="item.placeholder"
					:disabled="item.disabled"
					:maxlength="item.maxlength"
				/>
			</uni-forms-item>
			<button class="button" type="primary" @click="submit">{{ submitText }}</button>
		</uni-forms>
	</view>
</template>
<script>
export default {
	name: "Form",
	components: {},
	props: {
		name: String,
	},
	data() {
		return {
			formData: {},
			rules: {},
			params: {},
			submitText: "提交",
		};
	},
	computed: {},
	mounted() {},
	methods: {
		checkboxChange(item, e) {
			this.formData[item.key] = e.detail.value.map((x) => +x);
		},
		radioChange(item, e) {
			this.formData[item.key] = +e.detail.value;
		},
		submit() {
			this.$refs.form
				.validate()
				.then((res) => {
					this.$dlg.close(res);
				})
				.catch((err) => {
					console.log("表单错误信息：", err);
				});
		},
	},
	onLoad(par) {
		let {params, title} = this.$dlg.getQuery(par);
		let list = [];
		if (!Array.isArray(params)) {
			for (let key in params) {
				list.push({
					key: key,
					...params[key],
				});
			}
		} else {
			list = params;
		}
		let formData = {};
		let rules = {};
		list.forEach((item) => {
			formData[item.key] = item.value || "";
			let rule = [];
			item.label = item.label || item.lbl;
			item.required = !!(item.required || item.need);
			item.radios = item.radios || item.opts;
			if ("value" in item) formData[item.key] = item.value;
			else if ("def" in item) formData[item.key] = item.def;
			else if (item.checkboxs) formData[item.key] = [];
			else if (item.radios) formData[item.key] = 0;
			else formData[item.key] = "";
			if (item.required) {
				rule.push({required: true, errorMessage: item.label + "不能为空"});
			}
			console.log(item);
			if (item.len) {
				let [min, max] = item.len;
				if (min != null)
					rule.push({
						validateFunction(rule, value, data, callback) {
							if (value.length < min) {
								callback(item.label + "不能少于" + min + "个字符");
							}
							return true;
						},
					});
				if (max != null) {
					item.maxlength = max;
					rule.push({maxLength: max, errorMessage: item.label + "不能超过" + max + "个字符"});
				}
			}
			if (rule.length > 0) {
				rules[item.key] = {rules: rule};
			}
		});
		this.formData = formData;
		this.rules = rules;
		this.params = list;
		if (par.submitText) this.submitText = par.submitText;
		uni.setNavigationBarTitle({title: title || ""});
	},
};
</script>
<style lang="less">
@import "~@/styles/define.less";

.view-form {
	padding: 0 15px 20px 15px;
	.item-group {
		> * {
			margin-left: 15px;
			&:first-child {
				margin-left: 0;
			}
		}
	}
}
</style>
