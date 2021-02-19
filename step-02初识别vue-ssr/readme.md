# step-02初探vue-ssr
在vue-ssr中，vue会运行在客户端和服务端，首先安装vue-server-renderer和vue，它们版本必须匹配。
先在根目录创建server.js  
```javascript
//现在是在nodejs环境下，使用commonjs导入 
const Vue = require('vue')
const vueRenderer = require('vue-server-renderer')

const vueApp = new Vue({
    data() {
        return { str: 'Hello Vue SSR'}
    },
    template: '<div>{{str}}</div>'
})

const renderer = vueRenderer.createRenderer()

renderer.renderToString(vueApp).then(html => {
    console.log(html)
}).catch(err => {
    console.log(err)
})
```

这时执行改文件(node server.js)可以发现打印出了```<div data-server-rendered="true">Hello Vue SSR</div>```  ,vue-server-renderer已经将vue的template解析成了html。
将它加入到服务器，我使用的是koa,server.js的代码为   
```javascript
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
```
浏览器打开localhost:3019 可以发现服务器返回的是html代码  

vue-server-renderer 内有2个方法，分别是createRenderer和createBundleRenderer，具体的参数和返回值可以查看源码vue-server-renderer的index.d.ts文件。  
createRenderer参数是一个可省略的对象，对象的属性有template、cache等也可省略。  
createBundleRenderer接收2个参数bundle和options，bundle为一个字符串或者对象，字符串必须是一个js或者json的绝对路径，或者由webpack + vue-server-renderer/server-plugin生成的bundle对象(JavaScript代码字符串也行，官方不推荐)，第二个参数是一个可以选对象，属性包括createRenderer参数的属性外还有clientManifest，runInNewContext等属性，所有属性都是可省略的。  
```javascript
//源码index.d.ts
export declare function createRenderer(options?: RendererOptions): Renderer;
export declare function createBundleRenderer(bundle: string | object, options?: BundleRendererOptions): BundleRenderer;
```
源代码对createBundleRenderer参数bundle的判断
```javascript
    if (
      typeof bundle === 'string' &&
      /\.js(on)?$/.test(bundle) &&
      path$2.isAbsolute(bundle)    //var path$2 = require('path');
    ) {
      if (fs.existsSync(bundle)) {
        var isJSON = /\.json$/.test(bundle);
        basedir = basedir || path$2.dirname(bundle);
        bundle = fs.readFileSync(bundle, 'utf-8');
        if (isJSON) {
          try {
            bundle = JSON.parse(bundle);
          } catch (e) {
            throw new Error(("Invalid JSON bundle file: " + bundle))
          }
        }
      } else {
        throw new Error(("Cannot locate bundle file: " + bundle))
      }
    }

    if (typeof bundle === 'object') {
      entry = bundle.entry;
      files = bundle.files;
      basedir = basedir || bundle.basedir;
      maps = createSourceMapConsumers(bundle.maps);
      if (typeof entry !== 'string' || typeof files !== 'object') {
        throw new Error(INVALID_MSG)
      }
    } else if (typeof bundle === 'string') {
      entry = '__vue_ssr_bundle__';
      files = { '__vue_ssr_bundle__': bundle };
      maps = {};
    } else {
      throw new Error(INVALID_MSG)
    }
```
这2个方法都将返回renderToString和renderToStream方法，从命名就可以看出renderToString返回的是html字符串，renderToStream返回的是Node.js Stream（流）。  
createRenderer返回的renderToString第一个参数是一个Vue实例，第二个参数可以为context对象或者回调函数(可选)，当第二个参数为context时，第三个参数为回调函数(可选)。当没有回调函数作为参数时将返回一个promise对象。  
```javascript
//源码index.d.ts
type RenderCallback = (err: Error | null, html: string) => void;
interface Renderer {
  renderToString(vm: Vue, callback: RenderCallback): void;
  renderToString(vm: Vue, context: object, callback: RenderCallback): void;
  renderToString(vm: Vue): Promise<string>;
  renderToString(vm: Vue, context: object): Promise<string>;

  renderToStream(vm: Vue, context?: object): Readable;
}
```
createBundleRenderer返回的renderToString第一个参数为context或者回调函数，当第一个参数时context时回调函数为第二参数，参数都是可选的。
当没有回调函数作为参数时将返回一个promise对象。  
```javascript
interface BundleRenderer {
  renderToString(callback: RenderCallback): void;
  renderToString(context: object, callback: RenderCallback): void;
  renderToString(): Promise<string>;
  renderToString(context: object): Promise<string>;

  renderToStream(context?: object): Readable;
}
```

