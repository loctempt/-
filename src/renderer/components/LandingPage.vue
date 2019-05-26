<template>
    <div id="wrapper">
        <img id="logo" src="~@/assets/logo.png" alt="electron-vue">
        <svg-map></svg-map>
        <!--<main>-->
        <!--<div class="left-side">-->
        <!--<span class="title">-->
        <!--Welcome to your new project!-->
        <!--</span>-->
        <!--<system-information></system-information>-->
        <!--</div>-->

        <!--<div class="right-side">-->
        <!--<div class="doc">-->
        <!--<div class="title">Getting Started</div>-->
        <!--<p>-->
        <!--electron-vue comes packed with detailed documentation that covers everything from-->
        <!--internal configurations, using the project structure, building your application,-->
        <!--and so much more.-->
        <!--</p>-->
        <!--<button @click="open('https://simulatedgreg.gitbooks.io/electron-vue/content/')">Read the Docs</button><br><br>-->
        <!--</div>-->
        <!--<div class="doc">-->
        <!--<div class="title alt">Other Documentation</div>-->
        <!--<button class="alt" @click="open('https://electron.atom.io/docs/')">Electron</button>-->
        <!--<button class="alt" @click="open('https://vuejs.org/v2/guide/')">Vue.js</button>-->
        <!--<button class="alt">你妈的</button>-->
        <!--<p>{{dbStr}}</p>-->
        <!--</div>-->
        <!--</div>-->
        <!--</main>-->
        <div id="dual_line" style="width: 80%; height: 600px;"></div>
    </div>
</template>
<script type="text/javascript">
    import SystemInformation from './LandingPage/SystemInformation'
    import SvgMap from './SvgMap'
    import echarts from 'echarts';

    const baseTime = 6 * 60;

    /**
     * 二分查找
     * 返回大于等于tgt的第一个元素的下标，如果不存在这样的元素，返回-1
     */
    function upperBound(arr, tgt) {
        tgt = (baseTime + tgt * 10) * 60;         // tgt转化成秒格式
        let s = 0, e = arr.length - 1, m;
        while (s <= e) {
            m = s + parseInt((e - s) / 2);
            if (arr[m].time === tgt) return m;    // 找到了
            if (arr[m].time > tgt)
                e = m - 1;
            else
                s = m + 1;
        }
        if (s >= arr.length) return -1;            // 不存在大于等于目标的元素
        return m;                                 // 大于等于目标的第一个元素
    }

    /**
     * 创建时间轴文字描述，91个点
     * @returns {Array}
     */
    function timeDataGen() {
        let ret = [];
        for (let timePoint = 0; timePoint <= 90; timePoint++) {
            let str = '';
            str += parseInt((baseTime + timePoint * 10) / 60);
            str += ':';
            let minute = (baseTime + timePoint * 10) % 60;
            str += (minute === 0 ? '00' : minute);
            ret.push(str);
        }
        console.log(ret);
        return ret;
    }

    /**
     * 确认time对应的时间是否与timePoint相差小于10分钟
     * @param timePoint 时间点（分钟）
     * @param time 二分查找得到的时间点
     * @returns {boolean}
     */
    function isTimeValid(timePoint, time) {
        // console.log('time and timePoint ', time.time, timePoint);
        return (time.time - (timePoint * 10 + baseTime) * 60 < 600);
    }

    let option = {
        title: {
            text: '出入场人数统计',
            subtext: '数据从天上来',
            x: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                animation: false
            }
        },
        legend: {
            data: ['入场人数', '出场人数'],
            x: 'left'
        },
        axisPointer: {
            link: {xAxisIndex: 'all'}
        },
        dataZoom: [
            {
                show: true,
                realtime: true,
                start: 0,
                end: 100,
                xAxisIndex: [0, 1]
            },
            {
                type: 'inside',
                realtime: true,
                start: 0,
                end: 100,
                xAxisIndex: [0, 1]
            }
        ],
        grid: [{
            left: 50,
            right: 50,
            height: '35%'
        }, {
            left: 50,
            right: 50,
            top: '55%',
            height: '35%'
        }],
        xAxis: [
            {
                type: 'category',
                boundaryGap: false,
                axisLine: {onZero: true},
                data: []
            },
            {
                gridIndex: 1,
                type: 'category',
                boundaryGap: false,
                axisLine: {onZero: true},
                data: [],
                position: 'top'
            }
        ],
        yAxis: [
            {
                name: '人数(人)',
                type: 'value',
                // max : 500
            },
            {
                gridIndex: 1,
                name: '人数(人)',
                type: 'value',
                inverse: true
            }
        ],
        series: [
            {
                name: '入场人数',
                type: 'line',
                symbolSize: 8,
                hoverAnimation: false,
                data: []
            },
            {
                name: '出场人数',
                type: 'line',
                xAxisIndex: 1,
                yAxisIndex: 1,
                symbolSize: 8,
                hoverAnimation: false,
                data: []
            }
        ]
    };

    export default {
        name: 'landing-page',
        data() {
            return {
                day: 2,
                myChart: null
            }
        },
        components: {SvgMap, SystemInformation},
        mounted() {

            // // 查询数据库
            // this.$db.getDB((db) => {
            //     let dbo = db.db('vis');
            //     let res = dbo.collection('days').find({id: 15367, day: 1}).toArray((err, result) => {
            //         if (err) throw err;
            //         console.log(result);
            //         db.close();
            //     });
            //     // this.dbStr = res.toString();
            // });

            // 生成echarts
            this.myChart = echarts.init(document.getElementById('dual_line'));
            option.xAxis[0].data = option.xAxis[1].data = timeDataGen();  // 设置坐标轴文字
            // this.myChart.setOption(option);
            this.getEntranceCount();
            this.getDepartureCount();
        },
        methods: {
            open(link) {
                this.$electron.shell.openExternal(link)
            },
            getEntranceCount() {
                this.$db.getDB((db) => {
                    let dbo = db.db('vis');
                    dbo.collection('days').find(  // 查询入场记录
                        {day: this.day, $or: [{sid: 11502}, {sid: 11504}, {sid: 11507}, {sid: 11300}]})
                        .toArray((err, timeArr) => {
                            if (err) throw err;
                            timeArr.sort((a, b) => {    // 将入场记录按时间排序
                                return a.time - b.time;
                            });
                            // console.log('timeArr:', timeArr);
                            let entranceData = [];
                            for (let timePoint = 0; timePoint <= 90; timePoint++) {
                                let timeIdx = upperBound(timeArr, timePoint);
                                if (timeIdx === -1) entranceData.push(0);    // 若未查到数据，给这个时刻赋个零人
                                else {
                                    let cnt = 0;
                                    for (; timeIdx < timeArr.length; timeIdx++) {  // 统计10分钟内所有的入场人数
                                        // console.log(timeIdx ,'valid?', isTimeValid(timePoint, timeArr[timeIdx]));
                                        if (isTimeValid(timePoint, timeArr[timeIdx])) cnt++; // 遍历到的时间与timePoint差距小于10分钟，计数器加一
                                        else break;
                                    }
                                    entranceData.push(cnt);

                                }
                            }
                            // console.log('entranceData:', entranceData);
                            option.series[0].data = entranceData;
                            this.myChart.setOption(option);
                        })
                })
            },
            getDepartureCount() {
                this.$db.getDB((db) => {
                    let dbo = db.db('vis');
                    dbo.collection('days').find(  // 查询出场记录
                        {day: this.day, $or: [{sid: 10019}, {sid: 11505}, {sid: 11515}, {sid: 11517}]})
                        .toArray((err, timeArr) => {
                            if (err) throw err;
                            timeArr.sort((a, b) => {    // 将出场记录按时间排序
                                return a.time - b.time;
                            });
                            // console.log('timeArr:', timeArr);
                            let departureData = [];
                            for (let timePoint = 0; timePoint <= 90; timePoint++) {
                                let timeIdx = upperBound(timeArr, timePoint);
                                if (timeIdx === -1) departureData.push(0);    // 若未查到数据，给这个时刻赋个零人
                                else {
                                    let cnt = 0;
                                    for (; timeIdx < timeArr.length; timeIdx++) {  // 统计10分钟内所有的入场人数
                                        // console.log(timeIdx ,'valid?', isTimeValid(timePoint, timeArr[timeIdx]));
                                        if (isTimeValid(timePoint, timeArr[timeIdx])) cnt++; // 遍历到的时间与timePoint差距小于10分钟，计数器加一
                                        else break;
                                    }
                                    departureData.push(cnt);

                                }
                            }
                            // console.log('departureData:', departureData);
                            option.series[1].data = departureData;
                            this.myChart.setOption(option);
                        })
                })
            }
        }
    }
</script>

<style>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    body {
        font-family: 'Source Sans Pro', sans-serif;
    }

    #wrapper {
        /*background:*/
        /*radial-gradient(*/
        /*ellipse at top left,*/
        /*rgba(255, 255, 255, 1) 40%,*/
        /*rgba(229, 229, 229, .9) 100%*/
        /*);*/
        height: 100vh;
        padding: 60px 80px;
        width: 100vw;
    }

    #logo {
        height: auto;
        margin-bottom: 20px;
        width: 420px;
    }

    main {
        display: flex;
        justify-content: space-between;
    }

    main > div {
        flex-basis: 50%;
    }

    .left-side {
        display: flex;
        flex-direction: column;
    }

    .welcome {
        color: #555;
        font-size: 23px;
        margin-bottom: 10px;
    }

    .title {
        color: #2c3e50;
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 6px;
    }

    .title.alt {
        font-size: 18px;
        margin-bottom: 10px;
    }

    .doc p {
        color: black;
        margin-bottom: 10px;
    }

    .doc button {
        font-size: .8em;
        cursor: pointer;
        outline: none;
        padding: 0.75em 2em;
        border-radius: 2em;
        display: inline-block;
        color: #fff;
        background-color: #4fc08d;
        transition: all 0.15s ease;
        box-sizing: border-box;
        border: 1px solid #4fc08d;
    }

    .doc button.alt {
        color: #42b983;
        background-color: transparent;
    }
</style>
