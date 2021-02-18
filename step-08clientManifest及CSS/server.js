const vueRenderer = require('vue-server-renderer')
const Koa = require('koa2')
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
    const serverOfs = serverCompiler.outputFileSystem
    const template = serverOfs.readFileSync(process.cwd() + '/dist/index.ssr.html', 'utf-8')
    // bundle是一个js或者json的绝对路径字符串,或者一个js对象，这里需要将读取到的转为对象
    const bundle = JSON.parse(serverOfs.readFileSync(process.cwd() + '/dist/vue-ssr-server-bundle.json', 'utf-8'))
    // 注意要用clientCompiler.outputFileSystem读取客户端打包的文件
    const clientManifest = JSON.parse(clientCompiler.outputFileSystem.readFileSync(process.cwd() + '/dist/vue-ssr-client-manifest.json', 'utf-8'))
    const renderer = vueRenderer.createBundleRenderer(bundle, {
        runInNewContext: false,
        template: template,
        clientManifest
    })
    const context = {
        url: ctx.path,
        title: 'vue-ssr step-08 clientManifest及CSS'
    }
    await renderer.renderToString(context).then(html => {
        // 此时的context将会有renderStyles,renderState等方法
        // console.log(context)
        ctx.body = html
    }).catch(async (err) => {
        if (err.code === 404) {
            await next()
        } else {
            console.error(err)
            ctx.body = '服务器错误'
        }
    })
})
koaApp.use(koaStatic(process.cwd() + '/dist/'))
koaApp.use(koaStatic(process.cwd() + '/assets/')) 