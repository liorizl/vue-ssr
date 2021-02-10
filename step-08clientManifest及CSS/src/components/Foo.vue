<template>
    <div>
        <p>这是foo页面</p>
        <p>
            <span @click="go(1)">页面1</span>
            <span @click="go(2)">页面2</span>
            <span @click="go(3)">页面3</span>
            <router-link :to="{name: 'foo', params: {id:1}}">页面1</router-link>
            <router-link :to="{name: 'foo', params: {id:2}}">页面2</router-link>
            <router-link :to="{name: 'foo', params: {id:3}}">页面3</router-link>
        </p>
        <p>标题:{{itemFoo.title}}</p>
        <p>内容:{{itemFoo.content}}</p>
    </div>
</template>

<script>

export default {
    name: 'foo',
    asyncData({ store, route, axios }) {
        const { id } = route.params
        const url = id ? 
            'http://localhost:3017/fetch/foo?id=' + id : 
            'http://localhost:3017/fetch/foo'
        return axios.get(url).then(res => {
            return {
                itemFoo: res.data
            }
        })
    },
    data() {
        return {
        }
    },
    created() {
        // console.log(this.$data)
    },
    methods: {
        go(id) {
            this.$router.push({ name: 'foo', params: { id: id } })
        }
    },
    computed: {
        itemFoo() {
            return this.$store.state.foo.itemFoo
        }
    }
}
</script>
<style  scoped>
</style>