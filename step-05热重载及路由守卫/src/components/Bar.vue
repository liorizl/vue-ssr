<template>
    <div>这是Bar页面</div>
</template>

<script>
export default {
    data() {
        return {
        }
    },

    created() { },
    beforeRouteLeave(to, from, next) {
        console.log('路由触发从bar,离开')
        next()
    },
    beforeRouteUpdate(to, from, next) {
        console.log('组件bar复用时调用')
        next()
    },
    beforeRouteEnter(to, from, next) {
        console.log('路由已经激活bar组件，bar组件内所有守卫都已经调用了')
        next(() => {
            console.log('这个回调函数在路由完成DOM更新后才会执行')
        })
    },
    methods: {}
}
</script>
<style  scoped>
</style>