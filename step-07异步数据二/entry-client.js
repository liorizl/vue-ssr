import { createApp } from './src/main.js'
import Vue from 'vue'
import axios from 'axios'
const { vueApp, router, store, utils } = createApp()
if (window.__INITIAL_STATE__) {
    // 这里也将数据通过store.registerModule注册到store中，不再将数据放在store.state中
    const compName = window.__INITIAL_STATE__.route.name
    const compData = window.__INITIAL_STATE__[compName]
    utils.registerStore(store, compName, compData)
}
Vue.mixin({
    beforeRouteUpdate(to, from, next) {
        const { asyncData, name } = this.$options
        if (asyncData) {
            asyncData({ store, route: to, axios }).then((compData) => {
                Object.keys(compData).forEach(prop => {
                    store.commit(name + '/' + prop, compData)
                })
                next()
            }).catch(err => {
                console.log(err)
                next()
            })
        } else {
            next()
        }
    },
    destroyed() {
        // Vue.mixin是全局注入，所有的vue实例都会注入，但不是所以的实例里面都有store，要进行判断
        if (this.$store) {
            let compName = this.$options.name
            if (this.$store.state[compName] && this.$store.hasModule(compName)) {
                this.$store.unregisterModule(compName)
            }
        }

    }
})

router.onReady(() => {
    router.beforeResolve(async (to, from, next) => {
        // 检查to和from的组件是否有相同的，不同的组件才获取数据
        const matched = router.getMatchedComponents(to)
        const prevMatched = router.getMatchedComponents(from)
        let diffed = false
        const activated = matched.filter((c, i) => {
            return diffed || (diffed = (prevMatched[i] !== c))
        })
        if (!activated.length) {
            next()
        } else {
            for (let i = 0; i < activated.length; i++) {
                const actComp = activated[i]
                if (actComp.asyncData) {
                    await actComp.asyncData({ store, route: to, axios })
                    .then(compData => {
                        if (!actComp.name) {
                            console.error('组件必须要有名称')
                            return
                        }
                        const compName = actComp.name
                        // 判断store是否存在该模块没有就注册一个
                        utils.registerStore(store, compName, compData)
                        next()
                    })
                    .catch(err => {
                        console.error('读取组'+ actComp.name +'件异步数据失败')
                        next()
                    })
                }
            }
        }
    })
    vueApp.$mount('#app') 
}) 