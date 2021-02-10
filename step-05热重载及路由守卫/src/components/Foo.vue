<template>
    <div>
        这是foo页面
    </div>
</template>

<script>
import axios from 'axios'
export default {
    data() {
        return {
            title: ''
        }
    },
    created(){
    },
    beforeRouteLeave(to, from, next) {
        console.log('路由触发从foo离开')
        next()
    },
    beforeRouteUpdate(to, from, next) {
        console.log('组件foo复用时调用')
        next()
    },
    beforeRouteEnter(to, from, next) {
        console.log('路由已经激活foo组件，foo组件内所有守卫都已经调用了')
        next(()=> {
            console.log('这个回调函数在路由完成DOM更新后才会执行')
        })
    },
  created() {},

  methods: {}
}
</script>
<style  scoped>
</style>