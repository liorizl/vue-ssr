const Koa = require('koa')
const koaStatic = require('koa-static')
const webpack = require('webpack')
const webpackDevMiddleware = require('koa-webpack-dev-middleware')
const webpackHotMiddleware = require('koa-webpack-hot-middleware')
// const clientConf = require('./config/webpack.client.conf')
// const serverConf = require('./config/webpack.server.conf')
const hotConf = require('./config/webpack.hot.conf')
const app =  new Koa()
const hotCompiler = webpack(hotConf)
// const clientCompiler = webpack(clientConf)
// const serverCompiler = webpack(serverConf)

// serverCompiler.options.optimization.splitChunks = false
// console.log(serverCompiler.options)

// const devMiddleware = (compiler, option = null) => {
//     const middleware = require('webpack-dev-middleware')(compiler, option)
//     return async (ctx, next) => {
//         await middleware(
//             ctx.req, 
//             // 这里只用传入修改后的end和setHeader方法
//             {
//                 end: context => {
//                     ctx.body = context
//                 },
//                 setHeader: (name, value) => {
//                     ctx.set(name, value)
//                 }
//             },
//             next)
//     }
// }

// console.log(serverCompiler)
// app.use(webpackDevMiddleware(clientCompiler))
// app.use(webpackHotMiddleware(clientCompiler));
// app.use(webpackDevMiddleware(serverCompiler, { 
//     serverSideRender: true,
//     publicPath: serverConf.output.publicPath
// }))
// app.use(async (ctx, next) => {
//     // const { devMiddleware } = ctx.res.locals.webpack
//     console.log(ctx.res.locals)
// })
// app.use(webpackHotMiddleware(serverCompiler, { serverSideRender: true }));
app.use(webpackDevMiddleware(hotCompiler))
app.use(webpackHotMiddleware(hotCompiler))
app.use(koaStatic(process.cwd() + '/dist/'))

app.listen(3016, () => {
    console.log('server start at port 3016')
})