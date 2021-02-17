# step-08clientManifest及CSS
## css
前面示例中我们使用css的时候style-loader弹出错误,document is not defined,因为style-loader在将CSS注入html时使用了document对象，而在服务端是没有document对象的。将style-loader换成vue-style-loader,vue-style-loader会将获取到的css通过style的方式注入到html中。
由于css-loader的版本问题(我的是5.01),还是不生效。
在vue-style-loader源代码中测试看出，vue-style-loader接收到css-loader的数据是对象，而vue-style-loader是用数组的方式处理，从而获取不到样式。
```javascript
export default function listToStyles (parentId, list) {
  var styles = []
  var newStyles = {}
  //css-loader返回的样式list是对象
  console.log(list)
  for (var i = 0; i < list.length; i++) {
    var item = list[i]
    var id = item[0]
    var css = item[1]
    var media = item[2]
    var sourceMap = item[3]
    var part = {
      id: parentId + ':' + i,
      css: css,
      media: media,
      sourceMap: sourceMap
    }
    if (!newStyles[id]) {
      styles.push(newStyles[id] = { id: id, parts: [part] })
    } else {
      newStyles[id].parts.push(part)
    }
  }
  console.log(styles)
  return styles
}
```
插入图片
重新安装3.X版本的css-loader后正常。  

从上图可以看到服务端已经将样式注入到html中。

要让服务端自动注入css，需要使用createBundleRenderer方法，并且在在参数中传入template.
```javascript
    const renderer = vueRenderer.createBundleRenderer(bundle, {
        runInNewContext: false,
        template: template,
        clientManifest,
    })
```
如果不想自动注入css可以添加inject: false并进行手动注入。
在renderToString的回调函数中(promise则是在then中)，传入的context参数将会被注入renderStyles()方法获取到渲染过程中收集到的css，以及一些其他作用的方法。
```javascript
const context = {
    url: ctx.path
}
await renderer.renderToString(context).then(html => {
    // 此时的context将会有renderStyles,renderState等方法
    // console.log(context)
    ctx.body = html
})
```
此时在main.js中引入的global.less和.vue组件中的样式都被注入到style标签中，在开发模式下因为我们要使用热重载功能这样做是很好的，但是在生产模式下应该将共用的样式如：global.less通过引入的方式加载```<style src="/assets/global.css">```以便于缓存重复使用。
使用插件extract-text-webpack-plugin可以实现我们想要的东西。

```Chunk.entrypoints: Use Chunks.groupsIterable and filter by instanceof Entrypoint instead```  
如果出现此错误，就重新安装下一版的extract-text-webpack-plugin  
```npm i extract-text-webpack-plugin@next```  

## client manifest
客户端打包时生成clientManifest,后端调用createBundleRenderer时候将其添加到参数，vue-server-renderer可以自动推断出哪些需要预加载和预取(preload,prefetch),
从而提高打开页面的速度。  
webpack.client.conf.js中添加
```javascript
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')
    optimization: {
        runtimeChunk: {
            // 别名
            name: 'manifest'
        },
        splitChunks: {
            chunks: 'all',
            minChunks: Infinity
        }
    },
    plugins: [
        //将manifest生成为json格式
        new VueSSRClientPlugin(), 
        new webpack.HotModuleReplacementPlugin()
    ]
```
optimization的设置见[https://webpack.docschina.org/configuration/optimization/#optimizationsplitchunks](https://webpack.docschina.org/configuration/optimization/#optimizationsplitchunks)。

vue-ssr-client-manifest.json同样是打包在内存中，需要使用memery-fs来读取
```javascript
//server.js
 // 注意要用clientCompiler.outputFileSystem读取客户端打包的文件,serverCompiler.outputFileSystem是读取不到的。
const clientManifest = JSON.parse(clientCompiler.outputFileSystem.readFileSync(process.cwd() + '/dist/vue-ssr-client-manifest.json', 'utf-8'))
const renderer = vueRenderer.createBundleRenderer(bundle, {
    runInNewContext: false,
    template: template,
    clientManifest
})
```
此时服务端返回的html代码中就加入了proload

vue-ssr就先聊到这，如果要运行到实际项目中，还需要做一些其他的配置，如生产模式，head管理等。现在nuxt也比较完善了，推荐大家使用！

