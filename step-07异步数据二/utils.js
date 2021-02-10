export default {
    registerStore(store, compName, compData) {
        if (!store.hasModule(compName)) {
            let mutationObj = {}
            Object.keys(compData).forEach(prop => {
                mutationObj[prop] = (state, payload) => {
                    state[prop] = payload[prop]
                }
            })
            store.registerModule(compName, {
                namespaced: true,
                state: () => {
                    return compData
                },
                mutations: mutationObj
            })
        } else {
            Object.keys(compData).forEach(prop => {
                store.commit(compName + '/' + prop, compData)
            })
        }
    }
}