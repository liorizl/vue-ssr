<template>
    <div id="app">
        <h1>这是一个Vue页面的首页</h1>
        <h3 class="red">{{str}}</h3>
        <p>
            <router-link to="/foo">foo</router-link>
            <router-link to="/bar">bar</router-link>
        </p>
        <router-view></router-view>
    </div>
</template>

<script>
export default {
    data() {
        return {
            str: 'hello vue'
        }
    },

  created() {},

  methods: {}
}
</script>
<style scoped>
.red {
    color: #f00;
}
</style>