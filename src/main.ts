import Vue from "vue";
import App from "./App.vue";
import "@/common/pollyfill";
import {iMix} from "./lib/mixins";
import uView from "uview-ui";
Vue.use(uView);
Vue.mixin(iMix);

Vue.config.productionTip = false;

new App().$mount();
