const Koa = require('koa')
const KoaRouter = require('koa-router')
const cors = require('koa2-cors')

const app = new Koa()
const router = new KoaRouter()
// 解决跨域问题
app.use(cors({
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    maxAge: 5,
    credentials: true,
    allowMethods: ['GET', 'POST'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

let count = 0
// 具体的数据就不从其他地方获取了，直接返回数据
const fooDate = async ctx => {
    const id = ctx.query.id || ''
    count++
    ctx.body = {
        title: '我是foo'+ id +'的标题' + count,
        content: '我是foo'+ id +'的内容'+ count
    }
}
// 具体的数据就不从其他地方获取了，直接返回数据
const barDate = async ctx => {
    const id = ctx.query.id || ''
    ctx.body = {
        title: '我是bar'+ id +'的标题',
        content: '我是bar'+ id +'的内容'
    }
}

app.use(async (ctx, next) => {
    //稍作区分以/fetch开头为数据请求
    if (!/^\/fetch/.test(ctx.path)) {
        ctx.body = {
            errCode: 404
        }
    } else {
        await next()
    }
})

router.get('/fetch/foo', fooDate)
router.get('/fetch/bar', barDate)
app.use(router.routes())

app.listen(3017, () => {
    console.log('server started at port:3017')
})