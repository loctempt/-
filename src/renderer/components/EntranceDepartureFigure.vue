<template>
    <div>
        <el-row :gutter="20">
            <el-col :span="4">
                <el-select v-model="dayValue" placeholder="选择日期" :disabled="selectionDisabled">
                    <el-option
                            v-for="item in options1"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value">
                    </el-option>
                </el-select>
            </el-col>
        </el-row>
        <div>
            <div style="margin: 10px 0;"></div>
            <div style="display: inline-block; margin-right: 20px">
                入口：
                <el-checkbox-group v-model="checkedEntranceList">
                    <el-checkbox v-for="sid in entranceList" :label="sid" :key="sid">{{sid}}</el-checkbox>
                </el-checkbox-group>
            </div>
            <div style="display: inline-block; margin: 0 40px">
                出口：
                <el-checkbox-group v-model="checkedExitList">
                    <el-checkbox v-for="sid in exitList" :label="sid" :key="sid">{{sid}}</el-checkbox>
                </el-checkbox-group>
            </div>
            <el-button @click="handleCheckedListChange">更新</el-button>
        </div>
        <div id="dual_line" style="width: 1200px; height: 600px; margin-top: 10px"></div>
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
        name: "EntranceLeaveFigure",
        data() {
            return {
                myChart: null,
                dayValue: null,
                tmpOptions1: [
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
                entranceData: [[], [], [], []],     // 子数组个数为4，便于从1开始计算下标，从而与取值范围1、2、3的dayValue对应
                departureData: [[], [], [], []],    // 子数组个数为4，便于从1开始计算下标，从而与取值范围1、2、3的dayValue对应
                chartReady: 0,                      // 用来表示查询状态，0为初态——无数据；6为末态——数据齐全
                checkedEntranceList: [11300, 11502, 11504, 11507],  // 默认入口全选中
                checkedExitList: [10019, 11505, 11515, 11517],      // 默认出口全选中
                entranceList: [11300, 11502, 11504, 11507],         // 入口候选列表
                exitList: [10019, 11505, 11515, 11517]              // 出口候选列表
            }
        },
        mounted() {
            // 生成echarts
            this.myChart = echarts.init(document.getElementById('dual_line'));  // 在#dual_line中初始化图像
            option.xAxis[0].data = option.xAxis[1].data = util.timeDataGen();   // 设置坐标轴文字
            this.myChart.setOption(option);                                     // 设置初始数据，刷新图像
            this.getChartData();                                                // 获取统计数据
        },
        watch: {
            dayValue: function () {
                option.series[0].data = this.entranceData[this.dayValue];
                option.series[1].data = this.departureData[this.dayValue];
                this.myChart.setOption(option);
            },
        },
        computed: {
            selectionDisabled: function () {
                return parseInt(this.chartReady / 2) === 0;
            },
            options1: function () {
                if (this.chartReady === 6) console.log('出入场数据读取完成');
                let options = [];
                for (let opt = 0; opt < parseInt(this.chartReady / 2); opt++)
                    options.push(this.tmpOptions1[opt]);    // 从数据库中取回哪些天的数据就令这些天可选
                return options;
            }
        },
        methods: {
            getChartData() {
                for (let day = 1; day <= 3; day++) {
                    this.getEntranceCount(day);    // 查询入场人数
                    this.getDepartureCount(day);   // 查询出场人数
                }
            },
            handleCheckedListChange() {
                this.chartReady = 0;
                this.dayValue = null;
                this.entranceData = [[], [], [], []];
                this.departureData = [[], [], [], []];
                this.getChartData();
            },
            getEntranceCount(day) {
                this.$db.query(
                    "select `time` from days where `day` = ? and `sid` in (?) order by `time`",
                    [day, (this.checkedEntranceList.length === 0 ? [0] : this.checkedEntranceList)],
                    (err, timeArr, field) => {
                        if (err) throw err;
                        this.entranceData[day] = util.getTimePointArray(timeArr);   // 将原始数据转化为时间点数组
                        this.chartReady++;                                          // 查到数据后更新计数器
                    }
                );
            },
            getDepartureCount(day) {
                this.$db.query(
                    "select `time` from days where `day` = ? and `sid` in (?) order by `time`",
                    [day, (this.checkedExitList.length === 0 ? [0] : this.checkedExitList)],
                    (err, timeArr, field) => {
                        if (err) throw err;
                        this.departureData[day] = util.getTimePointArray(timeArr);  // 将原始数据转化为时间点数组
                        this.chartReady++;                                          // 查到数据后更新计数器
                    }
                );
            }
        }
    }
</script>

<style scoped>

</style>