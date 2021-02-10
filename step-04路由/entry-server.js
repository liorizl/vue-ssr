import { createApp } from './src/main.js'

export default context => {
    return new Promise((resolve, reject) => {
        const { vueApp, router } = createApp()
        router.push(context.url)
        router.onReady(()=> {
            const matchedComponents = router.getMatchedComponents()
            //当前路由没匹配到组件则返回404
            if (!matchedComponents.length) {
                reject({
                    code: 404
                })
            } else {
                resolve(vueApp)
            }
        }, reject)
    })
} 
// 导出一个函数，并在每次渲染中重复调用此函数，此函数参数context是renderToString传入的context并添加了一些其他属性