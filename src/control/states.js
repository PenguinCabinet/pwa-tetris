import store from '../vuex/store'
import { want, isClear, isOver } from '../unit/'
import {
        speeds,
        blankLine,
        blankMatrix,
        clearPoints,
        eachLines
} from '../unit/const'
const { fromJS, List } = require('immutable')
import { music } from '../unit/music'

const getStartMatrix = startLines => {
        // 生成startLines
        const getLine = (min, max) => {
                // 返回标亮个数在min~max之间一行方块, (包含边界)
                const count = parseInt((max - min + 1) * Math.random() + min, 10)
                const line = []
                for (let i = 0; i < count; i++) {
                        // 插入高亮
                        line.push(1)
                }
                for (let i = 0, len = 10 - count; i < len; i++) {
                        // 在随机位置插入灰色
                        const index = parseInt((line.length + 1) * Math.random(), 10)
                        line.splice(index, 0, 0)
                }

                return List(line)
        }
        let startMatrix = List([])

        for (let i = 0; i < startLines; i++) {
                if (i <= 2) {
                        // 0-3
                        startMatrix = startMatrix.push(getLine(5, 8))
                } else if (i <= 6) {
                        // 4-6
                        startMatrix = startMatrix.push(getLine(4, 9))
                } else {
                        // 7-9
                        startMatrix = startMatrix.push(getLine(3, 9))
                }
        }
        for (let i = 0, len = 20 - startLines; i < len; i++) {
                // 插入上部分的灰色
                startMatrix = startMatrix.unshift(List(blankLine))
        }
        return startMatrix.toJS()
}

const states = {
        // 自动下落setTimeout变量
        fallInterval: null,
        
        fallFInterval: null,

        // 游戏开始
        start: () => {
                if (music.start) {
                        music.start()
                }
                const state = store.state
                states.dispatchPoints(0)
                store.commit('speedRun', state.speedStart)
                const startLines = state.startLines
                const startMatrix = getStartMatrix(startLines)
                store.commit('matrix', startMatrix)
                store.commit('moveBlock', { type: state.next })
                store.commit('nextBlock', '')
                states.auto()
        },

        // 自动下落
        auto: timeout => {
                const out = timeout < 0 ? 0 : timeout
                let state = store.state
                let cur = state.cur

                const draw_fall_future=()=>{
                                console.log(state.lock)
                        /*
                        if(state.lock){
                                return
                        }
                        */
                        //let next_f = cur.fall()
                        state = store.state
                        cur = state.cur
                        if(cur.fall===null){
                                return
                        }
                        const next = cur.fall()
                        let next_f = cur.fall()
                        if (want(next, state.matrix)) {
                                let matrix = fromJS(state.matrix)                         
                                const shape = cur && cur.shape
                                while(want(next_f, state.matrix)){
                                        //console.log(next)
                                        //next_f=next_f.fall()
                                        next_f.xy[0]+=1
                                }
                                next_f.xy[0]-=1
                                

                                matrix=matrix.map(e1 => {
                                        return e1.map(e2=>{
                                                if (e2==3){
                                                        return 0
                                                }
                                                return e2
                                        })
                                })

                                shape.forEach((m, k1) =>
                                        m.forEach((n, k2) => {
                                                if (n && next_f.xy[0] + k1 >= 0) {
                                                        // 竖坐标可以为负
                                                        let line = matrix.get(next_f.xy[0] + k1)
                                                        line = line.set(next_f.xy[1] + k2, 3)
                                                        matrix = matrix.set(next_f.xy[0] + k1, line)
                                                }
                                        })
                                ) 
                                //let true_matrix= fromJS(JSON.parse(JSON.stringify(matrix.toJS())))

                                 
                                store.commit('matrix', matrix)
                                states.fallFInterval=setTimeout(
                                        draw_fall_future,
                                        10
                                )
                        } 
                }

                const fall = () => {
                        state = store.state
                        cur = state.cur
                        const next = cur.fall()
                        if (want(next, state.matrix)) {
                                let matrix = fromJS(state.matrix)
                                //const cxy = fromJS(cur && cur.xy)
                              
                                store.commit('moveBlock', next) 
                                //matrix=true_matrix
                                console.log(matrix.get(10).get(1))
                                states.fallInterval = setTimeout(fall, speeds[state.speedRun - 1])
                        } else {
                                let matrix = fromJS(state.matrix)
                                const shape = cur && cur.shape
                                const xy = fromJS(cur && cur.xy)
                                shape.forEach((m, k1) =>
                                        m.forEach((n, k2) => {
                                                if (n && xy.get(0) + k1 >= 0) {
                                                        // 竖坐标可以为负
                                                        let line = matrix.get(xy.get(0) + k1)
                                                        line = line.set(xy.get(1) + k2, 1)
                                                        matrix = matrix.set(xy.get(0) + k1, line)
                                                }
                                        })
                                )
                                states.nextAround(matrix)
                        }
                }
                clearTimeout(states.fallInterval)
                states.fallInterval = setTimeout(
                        fall,
                        out === undefined ? speeds[state.speedRun - 1] : out
                )
                
                clearTimeout(states.fallFInterval)
                states.fallFInterval=setTimeout(
                        draw_fall_future,
                        10
                )
        },

        // 一个方块结束, 触发下一个
        nextAround: (matrix, stopDownTrigger) => {
                clearTimeout(states.fallFInterval)
                clearTimeout(states.fallInterval)
                store.commit('lock', true)
                store.commit('matrix', matrix)
                if (typeof stopDownTrigger === 'function') {
                        stopDownTrigger()
                }

                const addPoints = store.state.points + 10 + (store.state.speedRun - 1) * 2 // 速度越快, 得分越高

                states.dispatchPoints(addPoints)

                if (isClear(matrix)) {
                        if (music.clear) {
                                music.clear()
                        }
                        return
                }
                if (isOver(matrix)) {
                        if (music.gameover) {
                                music.gameover()
                        }
                        states.overStart()
                        return
                }
                setTimeout(() => {
                        store.commit('lock', false)
                        store.commit('moveBlock', { type: store.state.next })
                        store.commit('nextBlock', '')
                        states.auto()
                }, 100)
        },

        // 页面焦点变换
        focus: isFocus => {
                store.commit('focus', isFocus)
                if (!isFocus) {
                        clearTimeout(states.fallInterval)
                        return
                }
                const state = store.state
                if (state.cur && !state.reset && !state.pause) {
                        states.auto()
                }
        },

        // 暂停
        pause: isPause => {
                store.commit('pause', isPause)
                if (isPause) {
                        clearTimeout(states.fallInterval)
                        return
                }
                states.auto()
        },

        // 消除行
        clearLines: (matrix, lines) => {
                'use strict';
                //(null).A;
                /*
                if(lines===undefined){
                }
                if(lines.forEach===undefined){
                }
                */
                console.log(lines)
                const state = store.state
                let newMatrix = fromJS(matrix)
                lines.forEach(n => {
                        newMatrix = newMatrix.splice(n, 1)
                        newMatrix = newMatrix.unshift(List(blankLine))
                })
                
                store.commit('matrix', newMatrix.toJS())
                store.commit('moveBlock', { type: state.next })
                store.commit('nextBlock', '')
                states.auto()
                store.commit('lock', false)
                const clearLines = state.clearLines + lines.length
                store.commit('clearLines', clearLines)

                const addPoints = store.state.points + clearPoints[lines.length - 1] // 一次消除的行越多, 加分越多
                states.dispatchPoints(addPoints)

                const speedAdd = Math.floor(clearLines / eachLines) // 消除行数, 增加对应速度
                let speedNow = state.speedStart + speedAdd
                speedNow = speedNow > 6 ? 6 : speedNow
                store.commit('speedRun', speedNow)
        },

        // 游戏结束, 触发动画
        overStart: () => {
                clearTimeout(states.fallInterval)
                store.commit('lock', true)
                store.commit('reset', true)
                store.commit('pause', false)
        },

        // 游戏结束动画完成
        overEnd: () => {
                store.commit('matrix', blankMatrix)
                store.commit('moveBlock', { reset: true })
                store.commit('reset', false)
                store.commit('lock', false)
                store.commit('clearLines', 0)
        },

        // 写入分数
        dispatchPoints: point => {
                // 写入分数, 同时判断是否创造最高分
                store.commit('points', point)
                if (point > 0 && point > store.state.max) {
                        store.commit('max', point)
                }
        }
}

export default states
