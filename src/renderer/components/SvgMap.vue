<template>
    <svg></svg>
</template>

<script>
    import * as d3 from 'd3';

    function renderFloorMap(floor) {
        d3.select('svg')
            .selectAll('.floor')   // 显示方块
            .data(floor)
            .enter()
            .append('rect')
            .attr('class', 'floor')
            .attr('i', function (d, i) {
                return i;
            })
            .attr('x', function (d, i) {
                return i % 30 * (rectWidth) + marginLeft;
            })
            .attr('y', function (d, i) {
                return parseInt(i / 30) * (rectWidth) + marginTop;
            })
            .attr('width', rectWidth)
            .attr('height', rectWidth)
            .attr('stroke-width', strokeWidth)
            .attr('stroke', strokeColor)
            .attr('fill', function (d, i) {
                if (d === 0) return 'rgb(200, 200, 200)';
                else return 'white';
            });
    }

    function renderFloorDetail(floorDetail) {
        d3.select('svg')
            .selectAll('.floorDetail')
            .data(floorDetail)
            .enter()
            .append('rect')
            .attr('class', 'floorDetail')
            .attr('y', function (d) {
                return d.x1 * (rectWidth) + marginTop;  // 留出顶边距
            })
            .attr('x', function (d) {
                return d.y1 * (rectWidth) + marginLeft; // 留出左边距
            })
            .attr('height', function (d) {
                return (d.x2 - d.x1) * rectWidth;       // 计算高度
            })
            .attr('width', function (d) {
                return (d.y2 - d.y1) * rectWidth;       // 计算宽度
            })
            .attr('stroke', 'black')        // 边框黑色
            .attr('stroke-width', 3)        // 边框线宽为3
            .attr('fill', function (d, i) { // 根据区域类型填充颜色
                switch (d.type) {
                    case 'public area':
                        return "rgba(97, 149, 214, 0.7)";
                    case 'facility':
                        return "rgba(249, 167, 13, 0.7)";
                }
            })
            .on('mouseover', function () {
                d3.select(this)
                    .attr('fill', function (d) {
                        switch (d.type) {
                            case 'public area':
                                return "rgba(97, 149, 214, 0.9)";
                            case 'facility':
                                return "rgba(249, 167, 13, 0.9)";
                        }
                    })
            })
            .on('mouseout', function () {
                d3.select(this)
                    .attr('fill', function (d) {
                        switch (d.type) {
                            case 'public area':
                                return "rgba(97, 149, 214, 0.7)";
                            case 'facility':
                                return "rgba(249, 167, 13, 0.7)";
                        }
                    })
            });
        d3.select('svg')
            .selectAll('.detailText')
            .data(floorDetail)
            .enter()
            .append('text')
            .attr('class', 'detailText')
            // .attr("transform","translate(-50% 0)")
            .attr('y', function (d) {
                return d.x1 * (rectWidth) + marginTop;  // 留出顶边距
            })
            .attr('x', function (d) {
                return d.y1 * (rectWidth) + marginLeft; // 留出左边距
            })
            .attr('dy', function (d) {
                return (d.x2 - d.x1) * rectWidth / 2 + 5;
            })
            .attr('dx', function (d) {
                return (d.y2 - d.y1) * rectWidth / 2;
            })
            .attr('text-anchor', 'middle')
            .text(function (d) {
                return d.name;
            })
    }

    // 在一楼显示人员路径
    function renderRoutesFirstFloor(route) {
        d3.select('svg')
            .selectAll('.route' + '1')
            .data(route)
            .enter()
            .append('rect')
            .attr('class', 'route')
            .attr('y', function (d) {
                if (d.route.floor === 1)
                    return d.route.x * (rectWidth) + marginTop;  // 留出顶边距
                return 0;
            })
            .attr('x', function (d) {
                if (d.route.floor === 1)
                    return d.route.y * (rectWidth) + marginLeft; // 留出左边距
                return 0;
            })
            .transition()                   // 在确定顶点坐标后设置动画
            .delay(function (d, i) {        // 延迟100毫秒
                return i * 100;
            })
            .duration(function (d, i) {     // 时长100毫秒，一个紧接着一个冒出来
                return 100;
            })
            .attr('width', function (d) {   // 仅显示1楼路径
                if (d.route.floor === 1)
                    return rectWidth;
                return 0;
            })
            .attr('height', function (d) {  // 仅显示1楼路径
                if (d.route.floor === 1)
                    return rectWidth;
                return 0;
            })
            .attr('fill', function (d, i) { // 颜色由浅至深
                return 'rgba(' + (23 - parseInt(i / route.length * (23))) + ', '
                    + (195 - parseInt(i / route.length * (195))) + ', '
                    + (41 - parseInt(i / route.length * (41))) + ', 0.5)'
            })
    }

    let firstFloor = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0
    ];
    let firstFloorDetail = [
        {name: '分会场A', x1: 2, y1: 1, x2: 4, y2: 6, type: 'public area'},
        {name: '分会场B', x1: 4, y1: 1, x2: 6, y2: 6, type: 'public area'},
        {name: '分会场C', x1: 6, y1: 1, x2: 8, y2: 6, type: 'public area'},
        {name: '分会场D', x1: 8, y1: 1, x2: 10, y2: 6, type: 'public area'},
        {name: '签到处', x1: 12, y1: 2, x2: 14, y2: 6, type: 'public area'},
        {name: '海报区', x1: 3, y1: 7, x2: 8, y2: 9, type: 'public area'},
        {name: '厕所1', x1: 4, y1: 10, x2: 6, y2: 12, type: 'public area'},
        {name: 'room1', x1: 6, y1: 10, x2: 10, y2: 12, type: 'public area'},
        {name: 'room2', x1: 10, y1: 10, x2: 12, y2: 12, type: 'public area'},
        {name: '扶梯', x1: 1, y1: 10, x2: 2, y2: 12, type: 'facility'},
        {name: '扶梯', x1: 14, y1: 10, x2: 15, y2: 12, type: 'facility'},
        {name: '展厅', x1: 2, y1: 15, x2: 12, y2: 19, type: 'public area'},
        {name: '主会场', x1: 2, y1: 19, x2: 12, y2: 29, type: 'public area'},
        {name: '服务台', x1: 14, y1: 19, x2: 16, y2: 21, type: 'public area'},
        {name: 'room3', x1: 14, y1: 21, x2: 16, y2: 25, type: 'public area'},
        {name: 'room4', x1: 14, y1: 25, x2: 16, y2: 27, type: 'public area'},
        {name: '厕所', x1: 14, y1: 27, x2: 16, y2: 29, type: 'public area'},
    ];

    // for (let i = 0; i < 30; i++) dataset.push(10);
    const rectWidth = 40;   // 方块的边长
    const strokeWidth = 1;  // 边框的宽度
    const strokeColor = "rgb(149, 149, 149)";
    const marginLeft = 10;
    const marginTop = 5;

    //===============  for testing  =================
    const idForTest = [11396];
    //===============  for testing  =================

    // console.log(firstFloor);
    let svgWidth = 1800, svgHeight = 1200;

    export default {
        name: "SvgMap",
        data() {
            return {}
        },
        mounted() {
            let svg = d3.select('svg')         // 设置svg元素
                .attr('width', svgWidth)       // 设置宽度
                .attr('height', svgHeight);    // 设置高度

            renderFloorMap(firstFloor);        // 渲染地图底图
            renderFloorDetail(firstFloorDetail);    // 显示各个区域
            this.findRouteById(idForTest, 1);
        },
        methods: {
            findRouteById: function (ids, day) {    // 传入人员id和日期，显示人员行走路径
                this.$db.getDB((db) => {
                    let dbo = db.db('vis');         // 选择数据库'vis'
                    for (let idIdx = 0; idIdx < ids.length; idIdx++)    // 遍历每个人员，查出一条路径就画一条路径
                        dbo.collection('days').aggregate([              // 做连接，查出指定人员的路径信息
                            {
                                $lookup:
                                    {from: 'sensors', localField: 'sid', foreignField: 'sid', as: 'route'}
                            },
                            {
                                $match: {"id": ids[idIdx], 'day': day}
                            },
                            {
                                $project: {'route': 3, 'id': 1, 'time': 2, '_id': 0}    // 数字顺序无关紧要
                            }])
                            .toArray((err, res) => {    // 将查询到的记录转成数组
                                if (err) throw err;
                                let tRoute = [];
                                for (let i = 0; i < res.length; i++) {  // 遍历查出来的每条记录
                                    tRoute.push({time: res[i].time, route: res[i].route[0]});  // 将记录中有用的部分取出，
                                    // 形成新数组
                                }
                                tRoute.sort((a, b) => {
                                    return a.time - b.time;
                                });
                                renderRoutesFirstFloor(tRoute); // 获得路径后显示出来
                            });
                });
            }
        }
    }
//    todo 增加删除路径的函数
</script>

<style scoped>

</style>