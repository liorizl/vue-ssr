import axios from 'axios'

export function fetchData(url) {
    return new Promise((resolve, reject) => {
        // 可以加个setTimeou延迟来看看会怎么样
        setTimeout(() => {
            axios.get(url).then(res => {
                if (res.status === 200) {
                    resolve({
                        item: res.data
                    })
                }
            }).catch(err => {
                console.log('获取不到数据！')
                reject(err)
            })
        }, 0)
    })
}