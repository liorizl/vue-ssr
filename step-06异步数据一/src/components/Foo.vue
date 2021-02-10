<template>
    <div>
        <p>这是foo页面</p>
        <p>标题:{{item.title}}</p>
        <p>内容:{{item.content}}</p>
    </div>
</template>

<script>
export default {
    asyncData({ store }) {
        return store.dispatch('fetchItem', 'http://localhost:3017/fetch/foo')
    },
    data() {
        return {
        }
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