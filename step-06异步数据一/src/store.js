import Vue from 'vue'
import Vuex from 'vuex'
//fetch-data.js封装了一个获取数据的promise
import { fetchData } from './fetch-data.js'

Vue.use(Vuex)

export function createStore() {
    return  new Vuex.Store({
        state: {
            item: {
            }
        },
        mutations: {
            setItem(state, { title, content }) {
                Vue.set(state.item, 'title', title)
                Vue.set(state.item, 'content', content)
            }
        },
        actions: {
            fetchItem(context, url) {
                return fetchData(url).then(res => {
                    context.commit('setItem', res.item)
                })
            }
        }
    })
}