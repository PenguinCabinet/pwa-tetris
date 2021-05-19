import Vue from 'vue'
import App from './App.vue'
import store from './vuex/store'
import './registerServiceWorker'

import './unit/const';
import './control';
import { subscribeRecord } from './unit';
subscribeRecord(store); // 将更新的状态记录到localStorage
Vue.config.productionTip = false
/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(App),
  store: store//,

        /*
  name: 'Tetris ペンギン内閣 Edition',
  metaInfo: {
      // if no subcomponents specify a metaInfo.title, this title will be used
      title: 'Tetris ペンギン内閣 Edition'//,
      // all titles will be injected into this template
      //titleTemplate: '%s | My Awesome Webapp'
  }
  */
})
