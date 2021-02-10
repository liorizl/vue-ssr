<template>
    <div>
        <p>这是Bar页面</p>
        <p>标题:{{item.title}}</p>
        <p>内容:{{item.content}}</p>
        <p>我才你是假的吧</p>
    </div>
</template>

<script>
export default {
    asyncData({ store }) {
        return store.dispatch('fetchItem', 'http://localhost:3017/fetch/bar')
    },
    data() {
        return {
        }
    },
    created() {
    },
    computed: {
        item() {
            return this.$store.state.item
        }
    }

}
</script>
<style  scoped>
</style>