const vueRenderer = require('vue-server-renderer')
const Koa = require('koa')
const KoaRouter = require('koa-router')
const koaStatic = require('koa-static')
const webpack = require('webpack')
const webpackDevMiddleware = require('koa-webpack-dev-middleware')
const webpackHotMiddleware = require('koa-webpack-hot-middleware')
const clientConf = require('./config/webpack.client.conf')
const serverConf = require('./config/webpack.server.conf')

const koaApp = new Koa()
const clientCompiler = webpack(clientConf)
const serverCompiler = webpack(serverConf)

const clientMiddleware = webpackDevMiddleware(clientCompiler)
const serverMiddleware = webpackDevMiddleware(serverCompiler)
koaApp.use(clientMiddleware)
koaApp.use(webpackHotMiddleware(clientCompiler))
koaApp.use(serverMiddleware)

;(() => {
    // 在打包成功后会调用waitUntilValid方法参数中的回调函数
    const clientDone =  new Promise(resolve => {
        clientMiddleware.waitUntilValid(() => {
            resolve('done')
        })
    })
    const serverDone = new Promise(resolve => {
        serverMiddleware.waitUntilValid(() => {
            resolve('done')
        })
    })
    // 等2个包都打包成功后再监听端口
    Promise.all([clientDone, serverDone]).then(resAll => {
        if (resAll.every(res => res === 'done')) {
            koaApp.listen(3019, () => { console.info('server started at 3019') })
        }
    })
})()

koaApp.use(async (ctx, next) => {
    const ofs = serverCompiler.outputFileSystem
    const template = ofs.readFileSync(process.cwd() + '/dist/index.ssr.html', 'utf-8')
    //bundle是一个js或者json的绝对路径字符串,或者一个js对象，这里需要将读取到的转为对象
    const bundle = JSON.parse(ofs.readFileSync(process.cwd() + '/dist/vue-ssr-server-bundle.json', 'utf-8'))
    const renderer = vueRenderer.createBundleRenderer(bundle, {
        template: template
    })
    const context = {
        url: ctx.path
    }
    await renderer.renderToString(context).then(html => {
        ctx.body = html
    }).catch(async (err) => {
        if (err.code === 404) {
            await next()
        } else {
            console.log('error in port :' + err)
            ctx.body = '服务器错误'
        }
    })
})
koaApp.use(koaStatic(process.cwd() + '/dist/'))
koaApp.use(koaStatic(process.cwd() + '/assets/')) 


