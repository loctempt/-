<template>
    <div class="chartContainer">
        <div>
            <el-row :gutter="20">
                <el-col :span="4">
                    <el-select v-model="dayValue" placeholder="选择日期">
                        <el-option
                                v-for="item in options1"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value">
                        </el-option>
                    </el-select>
                </el-col>
            </el-row>
            <div id="dual_line" style="width: 1200px; height: 900px; margin-top: 10px"></div>
        </div>
    </div>
</template>

<script>
    import echarts from 'echarts';

    let util = require('../util');

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
            data: ['11300入', '11502入', '11504入', '11507入', '10019出', '11505出', '11515出', '11517出', '总入场人数', '总出场人数'],
            orient: 'vertical',
            right: 10,
            top: 20,
            bottom: 20
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
            right: 120,
            height: '35%'
        }, {
            left: 50,
            right: 120,
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
                name: '入场人数(人)',
                type: 'value',
                // max : 500
            },
            {
                gridIndex: 1,
                name: '出场人数(人)',
                type: 'value',
                inverse: true
            }
        ],
        series: [
            {
                name: '11300入',
                type: 'line',
                symbolSize: 4,
                hoverAnimation: false,
                data: [],
                lineStyle: {opacity: 0.5}
            },
            {
                name: '11502入',
                type: 'line',
                symbolSize: 4,
                hoverAnimation: false,
                data: [],
                lineStyle: {opacity: 0.5}
            },
            {
                name: '11504入',
                type: 'line',
                symbolSize: 4,
                hoverAnimation: false,
                data: [],
                lineStyle: {opacity: 0.5}
            },
            {
                name: '11507入',
                type: 'line',
                symbolSize: 4,
                hoverAnimation: false,
                data: [],
                lineStyle: {opacity: 0.5}
            },

            {
                name: '10019出',
                type: 'line',
                xAxisIndex: 1,
                yAxisIndex: 1,
                symbolSize: 4,
                hoverAnimation: false,
                data: [],
                lineStyle: {opacity: 0.5}
            },
            {
                name: '11505出',
                type: 'line',
                xAxisIndex: 1,
                yAxisIndex: 1,
                symbolSize: 4,
                hoverAnimation: false,
                data: [],
                lineStyle: {opacity: 0.5}
            },
            {
                name: '11515出',
                type: 'line',
                xAxisIndex: 1,
                yAxisIndex: 1,
                symbolSize: 4,
                hoverAnimation: false,
                data: [],
                lineStyle: {opacity: 0.5}
            },
            {
                name: '11517出',
                type: 'line',
                xAxisIndex: 1,
                yAxisIndex: 1,
                symbolSize: 4,
                hoverAnimation: false,
                data: [],
                lineStyle: {opacity: 0.5}
            },
            {
                name: '总入场人数',
                type: 'line',
                symbolSize: 8,
                hoverAnimation: false,
                data: []
            },
            {
                name: '总出场人数',
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
        name: "EntranceLeaveFigure",
        data() {
            return {
                myChart: null,
                dayValue: null,
                options1: [
                    {
                        value: '1',
                        label: 'day1'
                    }, {
                        value: '2',
                        label: 'day2'
                    }, {
                        value: '3',
                        label: 'day3'
                    }
                ],
                gateReference: [11300, 11502, 11504, 11507, 10019, 11505, 11515, 11517],    // sid与数组位置的映射表
            }
        },
        mounted() {
            // 生成echarts
            this.myChart = echarts.init(document.getElementById('dual_line'));  // 在#dual_line中初始化图像
            option.xAxis[0].data = option.xAxis[1].data = util.timeDataGen();   // 设置坐标轴文字
            this.myChart.setOption(option);                                     // 设置初始数据，刷新图像
        },
        watch: {
            dayValue: function () {
                this.getStatisticData(this.dayValue);   // 日期选项改变时从数据库查询元统计数据
            },
        },
        methods: {
            getStatisticData(day) {
                console.log('获取统计数据');
                this.$db.query(
                    "select * from `ent_dep` where `day` = ? order by `time`;",
                    [day],
                    (err, timeArr, field) => {
                        if (err) throw err;
                        let statisticData = [[], [], [], [], [], [], [], [], [], []];   // 用来保存十个91元素的子数组
                        for (let timePoint = 0; timePoint <= 90; timePoint++) {         // 遍历91个时间点
                            let tmpData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];               // 某时间点每个传感器范围内的人数计数器
                            let timeIdx = util.upperBound(timeArr, timePoint);          // 搜索大于等于当前时间点的第一个时刻
                            if (timeIdx !== -1) {                                       // 找到大于等于当前时间点的第一个时刻
                                for (; timeIdx < timeArr.length; timeIdx++) {           // 统计10分钟内所有的入场人数
                                    if (util.isTimeValid(timePoint, timeArr[timeIdx])) {// 遍历到的时间与timePoint差距小于10分钟，计数器加一
                                        let sid = timeArr[timeIdx].sid;                 // 暂存一条记录中的sid
                                        let sidIndex = this.gateReference.indexOf(sid); // 查找sid在tmpData中对应的下标
                                        tmpData[sidIndex]++;                     // 对应传感器的计数
                                        if (sidIndex < 4) tmpData[8]++;          // 入场总计
                                        else tmpData[9]++;                       // 离场总计
                                    } else break;
                                }
                            }
                            for (let tmpDataIdx = 0; tmpDataIdx < tmpData.length; tmpDataIdx++)
                                statisticData[tmpDataIdx].push(tmpData[tmpDataIdx]);    // 将本轮遍历的结果压入statisticData的子数组
                        }
                        for (let statisticDataIdx = 0; statisticDataIdx < statisticData.length; statisticDataIdx++)
                            option.series[statisticDataIdx].data = statisticData[statisticDataIdx]; // 按映射关系设置图表数据
                        this.myChart.setOption(option); // 显示图像
                    }
                );
            },
        }
    }
</script>

<style scoped>
    .chartContainer {
        padding-left: 10%;
        /*display: flex;*/
        /*align-items: center;*/
        /*justify-content: center;*/
    }
</style>
