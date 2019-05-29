import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'
import db from './database'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;
Vue.prototype.$db = db;     // 将db对象加到Vue原型上，便于使用
Vue.use(ElementUI);

/* eslint-disable no-new */
new Vue({
    components: {App},
    router,
    store,
    template: '<App/>',
    render: h => h(App)
}).$mount('#app');
