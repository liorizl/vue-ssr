<template>
    <div>
        <p class="red">这是Bar页面</p>
        <p>
            <span @click="go(1)">页面11</span>
            <span @click="go(2)">页面2</span>
            <span @click="go(3)">页面3</span>
            <router-link :to="{name: 'bar', params: {id:1}}">页面1</router-link>
            <router-link :to="{name: 'bar', params: {id:2}}">页面2</router-link>
            <router-link :to="{name: 'bar', params: {id:3}}">页面3</router-link>
        </p>
        <p>标题:{{itemBar.title}}</p>
        <p>内容:{{itemBar.content}}</p>
    </div>
</template>

<script>
export default {
    name: 'bar',
    asyncData({ store, route, axios }) {
        const { id } = route.params
        const url = id ? 
            'http://localhost:3017/fetch/bar?id=' + id : 
            'http://localhost:3017/fetch/bar'
        return axios.get(url).then(res => {
            return {
                itemBar: res.data
            }
        })
    },
    data() {
        return {
        }
    },
    created() {
    },
    methods: {
        go(id) {
            this.$router.push({ name: 'bar', params: { id: id } })
        }
    },
    computed: {
        itemBar() {
            return this.$store.state.bar.itemBar
        }
    }

}
</script>
<style  scoped>
.red {
    color: #f00;
}
</style>