# step-05热重载及路由守卫
由于代码越来越多，每次改动都要重新打包，相当的不方便，我们加入热重载。  
使用webpack-dev-middleware和webpack-hot-middleware实现热重载。
首先搭建浏览器端的热更新  
先看看webpack-dev-middleware包的使用方法
```javascript
const webpack = require('webpack');
const middleware = require('webpack-dev-middleware');
const compiler = webpack({
  // webpack options
});
const express = require('express');
const app = express();

app.use(
  middleware(compiler, {
    // webpack-dev-middleware options
  })
);

app.listen(3000, () => console.log('Example app listening on port 3000!'));
```
发现示例是用于express,我们用的是koa所以需要稍作修改。  
查看webpack-dev-middleware的源代码，发现webpack-dev-middleware导出的是一个函数，函数执行后是返回的middleware(context)和一些属性及方法。
```javascript
  return Object.assign(middleware(context), {
    close(callback) {
        //code
    },
  } 
```
middleware(context)返回的是一个函数，参数是req, res, next, 这里的req,res是nodejs的request和response对象，在koa里应该写为ctx.req和ctx.res
```javascript
return function middleware(req, res, next) {
    //code
}
```
源代码里是通过res.send和res.end发送，我们在第二个参数里将res.end方法修改一下，让它像koa那样返回
```javascript
if (res.send) {
    res.send(content);
} else {
    res.end(content);
}
```
修改后
```javascript
// 其他代码
const devMiddleware = (compiler, option = null) => {
    const middleware = require('webpack-dev-middleware')(compiler, option)
    return async (ctx, next) => {
        await middleware(
            ctx.req, 
            // 这里只用传入修改后的end和setHeader方法
            {
                end: context => {
                    ctx.body = context
                },
                setHeader: (name, value) => {
                    ctx.set(name, value)
                }
            },
            next)
    }
}
koaApp.use(devMiddleware(serverCompiler))
// 其他代码
```
不过有koa-webpack-dev-middleware,我们不用那么麻烦，可以直接像示例那样使用。  
```javascript
const webpackDevMiddleware = require('koa-webpack-dev-middleware')
koaApp.use(webpackDevMiddleware(clientCompiler))
```
这样要简单多了！
热替换用法差不多
```javascript
const webpackHotMiddleware = require('koa-webpack-hot-middleware')
koaApp.use(webpackHotMiddleware(clientCompiler))
```
webpack.client.conf.js里添加插件```new webpack.HotModuleReplacementPlugin()```。
另外还需要在入口改成数组并加上webpack-hot-middleware/client，使包重建后通知客户端。
```javascript
    entry: {
        client: ['webpack-hot-middleware/client', path.resolve(__dirname, '../entry-client.js')]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ]
```
```webpack-hot-middleware/client```后可以带一些参数，详见[https://www.npmjs.com/package/webpack-hot-middleware](https://www.npmjs.com/package/webpack-hot-middleware)  
运行此文件发现打包已经完成，修改内容打包文件会自动重建，浏览器刷新会发现内容已经更新。   
如果将dist下的打包文件删除，会发现dist下没有新生成文件，但是服务正常运行，因为文件是打包到内存里的。   

client-bundle.js现在已经自动更新客户端也能接收变更通知并做出改变，现在要做的只差自动更新服务端的打包文件(vue-ssr-server-bundle.json),
服务端内容更新后并不需要通知浏览器，client-bundle.js更新并通知客户端后会自动重构页面。

### 服务端热重载  
在前面的示例中我们是通过commonjs的方式读取的打包文件，但是文件是打包在内存的,require方式将无法读取，我们要借助内存文件管理包memory-fs。
```javascript
//server.js
const Mfs = require('memory-fs')
const serverConf = require('./config/webpack.server.conf')
const mfs = new Mfs()
const serverCompiler = webpack(serverConf)

serverCompiler.outputFileSystem = mfs
koaApp.use(webpackDevMiddleware(serverConf))
```
运行打包后使用```mfs.readFileSync(process.cwd() + '/dist/vue-ssr-server-bundle.json', 'utf-8')```就可以读取到打包的内容。
重点讲一下这一句:```serverCompiler.outputFileSystem = mfs```   
先看memory-fs源代码
```javascript
function MemoryFileSystem(data) {
    this.data = data || {};
}
module.exports = MemoryFileSystem;
// 其他代码
MemoryFileSystem.prototype.readFileSync = function(_path, encoding) {
    var path = pathToArray(_path);
    var current = this.data;
	for(var i = 0; i < path.length - 1; i++) {
		if(!isDir(current[path[i]]))
			throw new MemoryFileSystemError(errors.code.ENOENT, _path);
		current = current[path[i]];
	}
	if(!isFile(current[path[i]])) {
		if(isDir(current[path[i]]))
			throw new MemoryFileSystemError(errors.code.EISDIR, _path);
		else
			throw new MemoryFileSystemError(errors.code.ENOENT, _path);
	}
	current = current[path[i]];
	return encoding ? current.toString(encoding) : current;
};
```
源代码可以看到实例mfs有一个data属性，在readFileSync方法中会根据这个属性来读取内存中的文件，但是它默认为空以及创建实例的时候也没有赋值,文件打包后使用mfs.readFileSync会读取不到信息。  
运行中间件webpackDevMiddleware过程会将data的值添加到serverCompiler.outputFileSystem对象中，
由于对象是使用堆内存，通过指针来访问，serverCompiler.outputFileSystem能访问到data属性，```serverCompiler.outputFileSystem = mfs```,实例mfs也能访问到，所以mfs.readFileSync能根据data属性访问到内存中的文件。
还有另外一种方法  
在源代码\node_modules\koa-webpack-dev-middleware\node_modules\webpack-dev-middleware\lib\Shared.js中，有这么一段
```javascript
var MemoryFileSystem = require("memory-fs");
    //其他代码
    setFs: function(compiler) {
        if(typeof compiler.outputPath === "string" && !pathIsAbsolute.posix(compiler.outputPath) && !pathIsAbsolute.win32(compiler.outputPath)) {
            throw new Error("`output.path` needs to be an absolute path or `/`.");
        }

        // store our files in memory
        var fs;
        var isMemoryFs = !compiler.compilers && compiler.outputFileSystem instanceof MemoryFileSystem;
        if(isMemoryFs) {
            fs = compiler.outputFileSystem;
        } else {
            fs = compiler.outputFileSystem = new MemoryFileSystem();
        }
        context.fs = fs;
    },
    //其他代码
    share.setFs(context.compiler);
```
可以看到如果compiler.outputFileSystem没赋值memory-fs的实例，也会给你自动创建一个，并且也赋值给了compiler.outputFileSystem，所以如果前面你不添加serverCompiler.outputFileSystem = mfs，读取文件的时候可以直接使用serverCompiler.outputFileSystem.readFileSync方法获取。
当然server.js里不写serverCompiler.outputFileSystem = mfs，mfs.readFileSync是读取不到文件的，因为判断出serverCompiler.outputFileSystem不是memory-fs的实例，会新创建一个memory-fs实例，server.js里的mfs是另外一个实例，mfs.readFileSync当然读取不到，这种情况只能用serverCompiler.outputFileSystem读取。
由于koa-webpack-dev-middleware比较早，它使用的是老版本的webpack-dev-middleware，当时的webpack-dev-middleware的配置对象参数还没有outputFileSystem属性，
所以通过serverCompiler.outputFileSystem = mfs这种方式，
在新版webpack-dev-middleware可以通过参数的方式
```javascript
koaApp.use(webpackDevMiddleware(serverCompiler, {
    outputFileSystem: mfs
}))
```

最终代码， server.js
```javascript
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
            ctx.body = '服务器错误'
        }
    })
})
koaApp.use(koaStatic(process.cwd() + '/dist/'))
koaApp.use(koaStatic(process.cwd() + '/assets/')) 
```

此时运行node server就可以看到效果了，如果你喜欢npm run dev 的方式就将package.json的script.dev 改为 "node server".

现在热重载搭建好了，可以十分方便的进行调试。我们再熟悉一下vue-loader的路由守卫，必须要把路由的顺序弄清楚,因为我们会把数据预取放在路由中。
> 一个完成的路由发生变化的解析流程如下:
> + 导航被触发。
> + 在失活的组件里调用 beforeRouteLeave 守卫。
> + 调用全局的 beforeEach 守卫。
> + 在重用的组件里调用 beforeRouteUpdate 守卫 (2.2+)。
> + 在路由配置里调用 beforeEnter。
> + 解析异步路由组件。
> + 在被激活的组件里调用 beforeRouteEnter。
> + 调用全局的 beforeResolve 守卫 (2.5+)。
> + 导航被确认。
> + 调用全局的 afterEach 钩子。
> + 触发 DOM 更新。
> + 调用 beforeRouteEnter 守卫中传给 next 的回调函数，创建好的组件实例会作为回调函数的参数传入。

路由一共有7个路由守卫,可以分为三类。  
1. 三个全局路由守卫,按照调用顺序分别为beforeEach,beforeResolve,afterEach。  
2. 三个组件内部守卫:
    * beforeRouteLeave：即将离开的组件里调用，比如从foo->bar会调用foo组件里的beforeRouteLeave
    * beforeRouteUpdate：组件被复用时调用，比如动态路由/foo/:id,从/foo/1->/foo/2因为是同一个组件，所以组件会被复用，不会调用组件的生命周期钩子，但会调用此方法
    * beforeRouteEnter: 路由进入需要到达的(to)组件，并获取该组件的数据，会调用该组件beforeRouteEnter方法，但是此组件还没有实例化，获取不到this。  
3. 一个路由配置守卫:
    * beforeEnter: 定义在router.js里，比如：
```{ path: '/foo', component: foo, name: 'foo', beforeEnter:(to, from, next) => { console.log('路由即将读取组件foo的数据'); next() } }```  
这7个路由守卫参数都有3个参数to,from,next(afterEach除外，它没有next参数，因为此时路由已经解析完成)。 

to和from参数表示到达和离开的路由,next是一个函数，参数如下：  
* next(false)表示终止此路由。  
* next('/')或next({ path: '/' }) 终止此路由跳转到其他路由，新的路由会被重新进行一次导航过程，可以在对象中添加其他参数比如params,query等。   
* next(error) 如果参数error是Error的实例,导航会被终止并且将错误传递给用router.onError()注册过的回调。  
* next(callback)) 只有在beforeRouteEnter中才能传入回调函数，因为beforeRouteEnter中访问不到this,所以作者让beforeRouteEnter中的next方法参数支持一个回调函数，回调函数会在路由全部解析完成后调用。
    
**每个卫士都必须调用next(afterEach除外),不然路由不会进入下一步。**  
现在可以测试一下  
在entry.client.js中添加和修改 
```javascript 
router.beforeEach((to, from, next) => {
    console.log('调用全局beforeEach')
    next()
})
router.beforeResolve((to, from, next) => {
    console.log('调用全局beforeResolve')
    next()
})
router.afterEach((to, from, next) => {
    console.log('调用全局afterEach')
})
router.onReady(() => {
    console.log('路由完成最后再调用onReady,我是第一个回调')
}) 
router.onReady(() => {
    console.log('路由完成最后再调用onReady,我是第二个回调')
    vueApp.$mount('#app') 
})
```
router.js修改  
```javascript
{ path: '/foo', component: foo, name: 'foo', beforeEnter:(to, from, next) => { console.log('路由即将读取组件foo的数据'); next() } },
{ path: '/bar', component: bar, name: 'bar', beforeEnter:(to, from, next) =>{ console.log('路由即将读取组件bar的数据'), next() } }
```
在foo和bar组件中分别添加(在bar组件中注意将foo改成bar)  
```javascript
    beforeRouteLeave(to, from, next) {
        console.log('路由触发从foo离开')
        next()
    },
    beforeRouteUpdate(to, from, next) {
        console.log('组件foo复用时调用')
        next()
    },
    beforeRouteEnter(to, from, next) {
        console.log('路由已经激活foo组件，所有组件内守卫都已经调用了')
        next(()=> {
            console.log('这个回调函数在路由完成DOM更新后才会执行')
        })
    },
```
此时运行会出打印出
* 路由即将读取组件foo的数据
* 路由已经激活foo组件，所有组件内守卫都已经调用了
* 调用全局beforeResolve
* 调用全局afterEach
* 路由完成最后再调用onReady,我是第一个回调
* 路由完成最后再调用onReady,我是第二个回调
* 这个回调函数在路由完成DOM更新后才会执行

再点击路由会打印出

* 路由触发从foo离开
* 调用全局beforeEach
* 路由即将读取组件bar的数据
* 路由已经激活bar组件，bar组件内所有守卫都已经调用了
* 调用全局beforeResolve
* 调用全局afterEach
* 这个回调函数在路由完成DOM更新后才会执行
与我们预想中的一样,因为是在组件foo和bar间切换，组件没复用，所以beforeRouteUpdate没有调用。   
这些路由守卫都是异步函数，但是在上一步没有调用next()之前，不会进行下一步，你可以加入setTimeout进行测试。   

router.onReady(cb),在官方介绍和源代码中可以看到，运行到router.onReady时，如果路由导航还没运行完会将回调函数依次排队，并在导航完成后调用。   
在页面首次加载得时候运行了，切换路由的时候看到它并没有再次运行，因为它只会在第一次加载路由的时候运行一次。   
