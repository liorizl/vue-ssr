const Vue = require('vue')
const vueRenderer = require('vue-server-renderer')
const Koa = require('koa')
const KoaRouter = require('koa-router')
const fs = require('fs')
const koaStatic = require('koa-static')

const koaApp = new Koa()
const router = new KoaRouter()

const template = fs.readFileSync('./dist/index.ssr.html', 'utf-8')
// 这里访问的是webpack + vue-server-renderer打包的对象所以要使用createBundleRenderer
const bundle = require('./dist/vue-ssr-server-bundle.json')
const renderer = vueRenderer.createBundleRenderer(bundle, {
    runInNewContext: false,
    template: template
})
router.get('/', async ctx => {
    await renderer.renderToString().then(html => {
        ctx.body = html
    }).catch(err => {
        console.log(err)
    })
})
//koa-static 访问静态文件，将页面的src="client.bundle.js"转到/dist/client.bundle.js
koaApp.use(koaStatic(process.cwd() + '/dist/')) 
koaApp.use(router.routes())
koaApp.listen(3019, () => { console.log('server started at 3019') })

