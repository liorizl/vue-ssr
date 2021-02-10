import { createApp } from './src/main.js'
import Vue from 'vue'
import axios from 'axios'
const { vueApp, router, store } = createApp()
// 先获取数据再渲染视图
if (window.__INITIAL_STATE__) {
    store.replaceState(window.__INITIAL_STATE__)
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
})
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
                    if (!store.hasModule(compName)) {
                        let mutationObj = {}
                        Object.keys(compData).forEach(prop => {
                            mutationObj[prop] = (state, payload) => {
                                state[prop] = payload[prop]
                            }
                        })
                        store.registerModule(compName, {
                            namespaced: true,
                            state: () => {
                                return compData
                            },
                            mutations: mutationObj
                        })
                    } else {
                        Object.keys(compData).forEach(prop => {
                            store.commit(compName + '/' + prop, compData)
                        })
                    }
                    actComp.destroyed = function destroyed() {
                        if (compName) {
                            this.$store.unregisterModule(compName)
                        }
                    }
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
router.onReady(() => {
    vueApp.$mount('#app') 
}) 