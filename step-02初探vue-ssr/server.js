//现在是在nodejs环境下，使用commonjs导入
const Vue = require('vue')
const vueRenderer = require('vue-server-renderer')
const Koa = require('koa')
const KoaRouter = require('koa-router')

const koaApp = new Koa()
const router = new KoaRouter()

const vueApp = new Vue({
    data() {
        return { str: 'hello Vue SSR'}
    },
    template: '<div>{{str}}</div>'
})
router.get('/', async ctx => {
    const renderer = vueRenderer.createRenderer()
    //也可以使用回调函数的方式  renderer.renderToString(app, callback)
    await renderer.renderToString(vueApp).then(html => {
        ctx.body = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>vue ssr</title>
</head>
<body>
    ${html}
</body>
</html>
        `
    }).catch(err => {
        console.log(err)
    })
})

koaApp.use(router.routes())
koaApp.listen(3019, () => { console.log('server started at 3019') })


