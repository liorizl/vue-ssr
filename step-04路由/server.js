const vueRenderer = require('vue-server-renderer')
const Koa = require('koa')
const fs = require('fs')
const koaStatic = require('koa-static')

const koaApp = new Koa()

// 不再使用koa-router让所有请求都运行此中间件
koaApp.use(async (ctx, next) => {
    const template = fs.readFileSync('./dist/index.ssr.html', 'utf-8')
    const bundle = require('./dist/vue-ssr-server-bundle.json')
    const renderer = vueRenderer.createBundleRenderer(bundle, {
        template: template
    })
    const context = {
        // entery-server.js里参数context有url属性
        // 你还可以传入其他自定义属性，在模版文件index.ssr.html中使用{{}}(转义)或{{{}}}(不转义)获取，
        // 当然也可定义到entry.server.js的context中
        url: ctx.path,
        title: 'vue-ssr step-04路由'
    }
    // context将会作为entry-server.js导出函数的参数，并且在renderToString的回调函数中还会在context中注入一些其他信息，比如解析过程收集到的css
    await renderer.renderToString(context).then(html => {
        ctx.body = html
    }).catch(async (err) => {
        // entry-server中没匹配到路由会reject{code:404},如果是404的话执行下一个中间件（也就是koaStatic），
        // 因为此地址可能是一个静态地址如：/client.bundle.js需要koaStatic进行处理
        if (err.code === 404) {
            await next()
        } else {
            ctx.body = '服务器错误'
        }
    })
})

koaApp.use(koaStatic(process.cwd() + '/dist/')) 
koaApp.listen(3019, () => { console.log('server started at 3019') })

