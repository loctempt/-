<template>
    <div>
        <div class="select">
            <el-select v-model="dayvalue" placeholder="请选择">
                <el-option
                        v-for="item in options1"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value">
                </el-option>
            </el-select>
            <el-select v-model="timepointvalue" filterable placeholder="请选择">
                <el-option
                        v-for="item in options2"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value">
                </el-option>
            </el-select>
            <el-dialog title="传感器人数统计" :visible.sync="dialogTableVisible">
                传感器：{{sensorId}} <br>
                总人数:{{countPersons}}
                <el-table :data="idList">
                    <el-table-column property="id" label="人员ID" ></el-table-column>
                    <el-table-column property="time" label="时间" ></el-table-column>
                </el-table>
            </el-dialog>
        </div>
        <svg></svg>
    </div>
</template>

<script>
    let d3 = require('d3');
    let db = require('../database');
    let util = require('../util');

    let vm = null;

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
                if (d.floor === 1)
                    return parseInt(i / 30) * (rectWidth) + marginTop;
                else    // 画二楼的底图，与一楼底图相隔20单位距离
                    return parseInt((i - 480) / 30) * (rectWidth) + marginTop + (rectWidth * 16 + 20);
            })
            .attr('width', rectWidth)
            .attr('height', rectWidth)
            .attr('stroke-width', strokeWidth)
            .attr('stroke', strokeColor)
            .attr('fill', function (d, i) {
                if (d.status === 0) return 'rgb(200, 200, 200)';
                else return 'white';
            });
    }

    /**
     * 显示两个楼层中各个场所的信息
     */
    function renderFloorDetail(floorDetail) {
        d3.select('svg')
            .selectAll('.floorDetail')
            .data(floorDetail)
            .enter()
            .append('rect')
            .attr('class', 'floorDetail')
            .attr('y', function (d) {
                if (d.floor === 1)
                    return d.x1 * (rectWidth) + marginTop;  // 留出顶边距
                else
                    return d.x1 * (rectWidth) + marginTop + (16 * rectWidth + 20);  // 留出顶边距
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
            .attr('y', function (d) {
                if (d.floor === 1)
                    return d.x1 * (rectWidth) + marginTop;  // 留出顶边距
                else
                    return d.x1 * (rectWidth) + marginTop + (16 * rectWidth + 20);  // 留出顶边距
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

    /**
     * 显示一个半透明遮罩，辅助热力图的显示
     */
    function transparentLayer() {
        let pos = [{'x': marginLeft, 'y': marginTop, 'floor': 1}, {
            'x': marginLeft,
            'y': (16 * rectWidth + 20) + marginTop,
            'floor': 2
        }];
        console.log('显示透明图层');
        d3.select('svg')
            .selectAll('.transparent')
            .data(pos)
            .enter()
            .append('rect')
            .attr('class', 'transparent')
            .attr('y', function (d) {
                if (d.floor === 1)
                    return d.y;
                else if (d.floor === 2)
                    return d.y;  // 留出顶边距
            })
            .attr('x', function (d) {
                return d.x; // 留出左边距
            })
            .attr('width', function (d) {
                return rectWidth * 30;
            })
            .attr('height', function (d) {
                return 16 * rectWidth;
            })
            .attr('fill', function (d) {
                return 'rgba(100,100,100,0.4)';
            })
    }

    /**
     * 渲染热力图
     * @param heatData 表示热力图的数据
     */
    function renderHeatMap(heatData) {
        console.log(heatData);
        let linear = d3.scaleLinear()
            .domain([0, 500])
            .range([0, 1]);
        let compute = d3.interpolate(d3.rgb(166, 192, 254), d3.rgb(246, 128, 132));//红色渐变到绿色

        removeHeatMap();

        d3.select('svg')
            .selectAll('.heat')
            .data(heatData)
            .enter()
            .append('rect')
            .attr('class', 'heat')
            .attr('y', function (d) {
                if (d.floor === 1)
                    return d.x * (rectWidth) + marginTop;
                else if (d.floor === 2)
                    return d.x * (rectWidth) + marginTop + (16 * rectWidth + 20);  // 留出顶边距
            })
            .attr('x', function (d) {
                return d.y * (rectWidth) + marginLeft; // 留出左边距
            })
            .attr('width', function (d) {
                return rectWidth;
            })
            .attr('height', function (d) {
                return rectWidth;
            })
            .attr('fill', function (d) {
                let rgb = compute(linear(d.cnt));
                return 'rgba' + rgb.substr(3, rgb.length - 4) + ',0.7)';    // 将比例尺计算出的rgb颜色转换成rgba颜色
            })
            .style('cursor', 'pointer')
            .on('mouseup', function (d) {
                console.log(d.sid);
                getIdListBySidAndDayAndTime(d.sid, d.day, d.time, d.cnt);
            })
    }

    /**
     * 根据sid, day和time查询此时此传感器范围中共有多少人，有哪些人
     * @param sid 传感器id
     * @param day 日期
     * @param time 时间（单位：秒）
     * @param cnt 范围内人数
     */
    function getIdListBySidAndDayAndTime(sid, day, time, cnt) {
        db.query(
            'select `id`, `time` from `days` join sensors using(`sid`) where `sid`=? and `day`=? and `time` between ? and ? group by `id`',
            [sid, day, time, time + 600],
            (err, res, field) => {
                if (err) throw err;
                console.log(sid, '在',time, '时刻有人数', cnt);
                vm.sensorId = sid;
                vm.countPersons = cnt;
                vm.dialogTableVisible = true;
                vm.idList = res;
                for (let i = 0; i < res.length; i++) res[i].time = util.parseTime(res[i].time);
                console.log(res);
            }
        )
    }

    /**
     * 移除热力图
     */
    function removeHeatMap() {
        d3.select('svg')
            .selectAll('.heat')
            .remove();
    }

    /**
     * 销毁热力图
     * 销毁热力图操作不仅移除热力图，还移除半透明遮罩，从而使热力图完全从svg中移除
     */
    function destroyHeatMap() {
        removeHeatMap();
        d3.select('svg')
            .selectAll('.transparent')
            .remove();
    }

    /**
     * 隐藏热力图
     */
    function hideHeatMap() {
        d3.select('svg')
            .selectAll('.heat')
            .attr('hidden')
    }

    /**
     * 显示热力图
     */
    function displayHeatMap() {
        d3.select('svg')
            .selectAll('.heat')
            .attr('hidden', null)
    }

    // 在一楼显示人员路径
    function renderRoutes(route, no = 1) {
        d3.select('svg')
            .selectAll('.route' + no)
            .data(route)
            .enter()
            .append('rect')
            .attr('class', 'route')
            .attr('y', function (d) {
                if (d.floor === 1)
                    return d.x * (rectWidth) + marginTop;
                else if (d.floor === 2)
                    return d.x * (rectWidth) + marginTop + (16 * rectWidth + 20);  // 留出顶边距
            })
            .attr('x', function (d) {
                return d.y * (rectWidth) + marginLeft; // 留出左边距
            })
            .transition()                   // 在确定顶点坐标后设置动画
            .delay(function (d, i) {
                // return i * 100;  // 延迟100毫秒
                return d.duration * 1000 / 60 / 2;    // 按比例延迟显示
                // todo 添加手动设置播放速度的功能
            })
            .duration(function (d, i) {
                return 100;  // 时长100毫秒，一个紧接着一个冒出来
            })
            .attr('width', function (d) {   // 仅显示1楼路径
                return rectWidth;
            })
            .attr('height', function (d) {  // 仅显示1楼路径
                return rectWidth;
            })
            .attr('fill', function (d, i) { // 颜色由浅至深
                return 'rgba(' + (23 - parseInt(i / route.length * (23))) + ', '
                    + (195 - parseInt(i / route.length * (195))) + ', '
                    + (41 - parseInt(i / route.length * (41))) + ', 0.9)'
            })
    }

    let floor = [
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 1,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 1
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 1,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        },
        {
            "status": 0,
            "floor": 2
        }
    ];

    let floorDetail = [
        {
            "name": "餐厅",
            "x1": 2,
            "y1": 1,
            "x2": 10,
            "y2": 6,
            "type": "public area",
            "floor": 2
        },
        {
            "name": "room5",
            "x1": 10,
            "y1": 1,
            "x2": 12,
            "y2": 6,
            "type": "public area",
            "floor": 2
        },
        {
            "name": "休闲区",
            "x1": 13,
            "y1": 0,
            "x2": 16,
            "y2": 6,
            "type": "public area",
            "floor": 2
        },
        {
            "name": "room6",
            "x1": 6,
            "y1": 10,
            "x2": 8,
            "y2": 12,
            "type": "public area",
            "floor": 2
        },
        {
            "name": "厕所3",
            "x1": 4,
            "y1": 10,
            "x2": 6,
            "y2": 12,
            "type": "public area",
            "floor": 2
        },
        {
            "name": "扶梯",
            "x1": 1,
            "y1": 10,
            "x2": 2,
            "y2": 12,
            "type": "facility",
            "floor": 2
        },
        {
            "name": "扶梯",
            "x1": 14,
            "y1": 10,
            "x2": 15,
            "y2": 12,
            "type": "facility",
            "floor": 2
        },
        {
            "name": "分会场A",
            "x1": 2,
            "y1": 1,
            "x2": 4,
            "y2": 6,
            "type": "public area",
            "floor": 1
        },
        {
            "name": "分会场B",
            "x1": 4,
            "y1": 1,
            "x2": 6,
            "y2": 6,
            "type": "public area",
            "floor": 1
        },
        {
            "name": "分会场C",
            "x1": 6,
            "y1": 1,
            "x2": 8,
            "y2": 6,
            "type": "public area",
            "floor": 1
        },
        {
            "name": "分会场D",
            "x1": 8,
            "y1": 1,
            "x2": 10,
            "y2": 6,
            "type": "public area",
            "floor": 1
        },
        {
            "name": "签到处",
            "x1": 12,
            "y1": 2,
            "x2": 14,
            "y2": 6,
            "type": "public area",
            "floor": 1
        },
        {
            "name": "海报区",
            "x1": 3,
            "y1": 7,
            "x2": 8,
            "y2": 9,
            "type": "public area",
            "floor": 1
        },
        {
            "name": "厕所1",
            "x1": 4,
            "y1": 10,
            "x2": 6,
            "y2": 12,
            "type": "public area",
            "floor": 1
        },
        {
            "name": "room1",
            "x1": 6,
            "y1": 10,
            "x2": 10,
            "y2": 12,
            "type": "public area",
            "floor": 1
        },
        {
            "name": "room2",
            "x1": 10,
            "y1": 10,
            "x2": 12,
            "y2": 12,
            "type": "public area",
            "floor": 1
        },
        {
            "name": "扶梯",
            "x1": 1,
            "y1": 10,
            "x2": 2,
            "y2": 12,
            "type": "facility",
            "floor": 1
        },
        {
            "name": "扶梯",
            "x1": 14,
            "y1": 10,
            "x2": 15,
            "y2": 12,
            "type": "facility",
            "floor": 1
        },
        {
            "name": "展厅",
            "x1": 2,
            "y1": 15,
            "x2": 12,
            "y2": 19,
            "type": "public area",
            "floor": 1
        },
        {
            "name": "主会场",
            "x1": 2,
            "y1": 19,
            "x2": 12,
            "y2": 29,
            "type": "public area",
            "floor": 1
        },
        {
            "name": "服务台",
            "x1": 14,
            "y1": 19,
            "x2": 16,
            "y2": 21,
            "type": "public area",
            "floor": 1
        },
        {
            "name": "room3",
            "x1": 14,
            "y1": 21,
            "x2": 16,
            "y2": 25,
            "type": "public area",
            "floor": 1
        },
        {
            "name": "room4",
            "x1": 14,
            "y1": 25,
            "x2": 16,
            "y2": 27,
            "type": "public area",
            "floor": 1
        },
        {
            "name": "厕所",
            "x1": 14,
            "y1": 27,
            "x2": 16,
            "y2": 29,
            "type": "public area",
            "floor": 1
        }
    ];

    const rectWidth = 40;   // 方块的边长
    const strokeWidth = 1;  // 边框的宽度
    const strokeColor = "rgb(149, 149, 149)";
    const marginLeft = 10;
    const marginTop = 5;
    const timeInterval = 600;   // 600sec，即十分钟时间间隔
    const baseTime = 6 * 3600;


    //===============  for testing  =================
    const idForTest = [18473];
    //===============  for testing  =================

    let svgWidth = 1800, svgHeight = 1400;

    export default {
        name: "SvgMap",
        data() {
            return {
                dayvalue: 1,
                timepointvalue: "",
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
                options2: [
                    {
                        value: '0',
                        label: '6:00'
                    }, {
                        value: '1',
                        label: '6:10'
                    }, {
                        value: '2',
                        label: '6:20'
                    }, {
                        value: '3',
                        label: '6:30'
                    }, {
                        value: '4',
                        label: '6:40'
                    }, {
                        value: '5',
                        label: '6:50'
                    }, {
                        value: '6',
                        label: '7:00'
                    }, {
                        value: '7',
                        label: '7:10'
                    }, {
                        value: '8',
                        label: '7:20'
                    }, {
                        value: '9',
                        label: '7:30'
                    }, {
                        value: '10',
                        label: '7:40'
                    }, {
                        value: '11',
                        label: '7:50'
                    }, {
                        value: '12',
                        label: '8:00'
                    }, {
                        value: '13',
                        label: '8:10'
                    }, {
                        value: '14',
                        label: '8:20'
                    }, {
                        value: '15',
                        label: '8:30'
                    }, {
                        value: '16',
                        label: '8:40'
                    }, {
                        value: '17',
                        label: '8:50'
                    }, {
                        value: '18',
                        label: '9:00'
                    }, {
                        value: '19',
                        label: '9:10'
                    }, {
                        value: '20',
                        label: '9:20'
                    }, {
                        value: '21',
                        label: '9:30'
                    }, {
                        value: '22',
                        label: '9:40'
                    }, {
                        value: '23',
                        label: '9:50'
                    }, {
                        value: '24',
                        label: '10:00'
                    }, {
                        value: '25',
                        label: '10:10'
                    }, {
                        value: '26',
                        label: '10:20'
                    }, {
                        value: '27',
                        label: '10:30'
                    }, {
                        value: '28',
                        label: '10:40'
                    }, {
                        value: '29',
                        label: '10:50'
                    }, {
                        value: '30',
                        label: '11:00'
                    }, {
                        value: '31',
                        label: '11:10'
                    }, {
                        value: '32',
                        label: '11:20'
                    }, {
                        value: '33',
                        label: '11:30'
                    }, {
                        value: '34',
                        label: '11:40'
                    }, {
                        value: '35',
                        label: '11:50'
                    }, {
                        value: '36',
                        label: '12:00'
                    }, {
                        value: '37',
                        label: '12:10'
                    }, {
                        value: '38',
                        label: '12:20'
                    }, {
                        value: '39',
                        label: '12:30'
                    }, {
                        value: '40',
                        label: '12:40'
                    }, {
                        value: '41',
                        label: '12:50'
                    }, {
                        value: '42',
                        label: '13:00'
                    }, {
                        value: '43',
                        label: '13:10'
                    }, {
                        value: '44',
                        label: '13:20'
                    }, {
                        value: '45',
                        label: '13:30'
                    }, {
                        value: '46',
                        label: '13:40'
                    }, {
                        value: '47',
                        label: '13:50'
                    }, {
                        value: '48',
                        label: '14:00'
                    }, {
                        value: '49',
                        label: '14:10'
                    }, {
                        value: '50',
                        label: '14:20'
                    }, {
                        value: '51',
                        label: '14:30'
                    }, {
                        value: '52',
                        label: '14:40'
                    }, {
                        value: '53',
                        label: '14:50'
                    }, {
                        value: '54',
                        label: '15:00'
                    }, {
                        value: '55',
                        label: '15:10'
                    }, {
                        value: '56',
                        label: '15:20'
                    }, {
                        value: '57',
                        label: '15:30'
                    }, {
                        value: '58',
                        label: '15:40'
                    }, {
                        value: '59',
                        label: '15:50'
                    }, {
                        value: '60',
                        label: '16:00'
                    }, {
                        value: '61',
                        label: '16:10'
                    }, {
                        value: '62',
                        label: '16:20'
                    }, {
                        value: '63',
                        label: '16:30'
                    }, {
                        value: '64',
                        label: '16:40'
                    }, {
                        value: '65',
                        label: '16:50'
                    }, {
                        value: '66',
                        label: '17:00'
                    }, {
                        value: '67',
                        label: '17:10'
                    }, {
                        value: '68',
                        label: '17:20'
                    }, {
                        value: '69',
                        label: '17:30'
                    }, {
                        value: '71',
                        label: '17:40'
                    }, {
                        value: '72',
                        label: '17:50'
                    }, {
                        value: '73',
                        label: '18:00'
                    }, {
                        value: '74',
                        label: '18:10'
                    }, {
                        value: '75',
                        label: '18:20'
                    }, {
                        value: '76',
                        label: '18:30'
                    }, {
                        value: '77',
                        label: '18:40'
                    }, {
                        value: '78',
                        label: '18:50'
                    }, {
                        value: '79',
                        label: '19:00'
                    }, {
                        value: '80',
                        label: '19:10'
                    }, {
                        value: '81',
                        label: '19:20'
                    }, {
                        value: '82',
                        label: '19:30'
                    }, {
                        value: '83',
                        label: '19:40'
                    }, {
                        value: '84',
                        label: '19:50'
                    }, {
                        value: '85',
                        label: '20:00'
                    }, {
                        value: '86',
                        label: '20:10'
                    }, {
                        value: '87',
                        label: '20:20'
                    }, {
                        value: '88',
                        label: '20:30'
                    }, {
                        value: '89',
                        label: '20:40'
                    }, {
                        value: '90',
                        label: '20:50'
                    },
                ],
                dialogTableVisible: false,
                sensorId: null,
                countPersons: 0,
                idList: []
            }
        },
        watch: {
            timepointvalue: function (newTimePoint, oldTimePoint) {
                console.log("dayval: " + this.dayvalue ,"timpointval: " + this.timepointvalue);
                this.showHeatMap(this.dayvalue, this.timepointvalue);
            },
            dayvalue: function (newDay, oldDay) {
                this.showHeatMap(this.dayvalue, this.timepointvalue);
            }
        },
        mounted() {
            vm = this;
            let svg = d3.select('svg')         // 设置svg元素
                .attr('width', svgWidth)       // 设置宽度
                .attr('height', svgHeight);    // 设置高度

            renderFloorMap(floor);        // 渲染地图底图
            renderFloorDetail(floorDetail);    // 显示各个区域
            transparentLayer();
            // renderFloorDetail(floorDetail);    // 显示各个区域

            // this.findRouteById(idForTest, 1);  // todo 把写死的第一天 改成动态的
            // this.showHeatMap(1, 32);
        },
        methods: {
            showHeatMap: function (day, timePoint) {//传入日期
                let startTime = baseTime + timePoint * timeInterval;
                let endTime = startTime + timeInterval;
                console.log(startTime, endTime);
                this.$db.query(
                    'select sid, day, x, y, floor, time, count(*) cnt from `days` join sensors using(`sid`) where `day`=? and `time` between ? and ? group by `sid`',
                    [day, startTime, endTime],    // 取第timePoint个时间间隔内的人数, 此处两个表达式的值单位都为秒
                    (err, res, field) => {
                        if (err) throw err;
                        for (let i = 0; i < res.length; i++)
                            res[i].time = baseTime + timePoint * timeInterval;
                        renderHeatMap(res);
                    }
                )
            },

            findRouteById: function (ids, day) {    // 传入人员id和日期，显示人员行走路径
                for (let idIdx = 0; idIdx < ids.length; idIdx++) {
                    this.$db.query(
                        'select * from days a join sensors using(`sid`) where `id`=? and `day`=? order by `time`',
                        [ids[idIdx], day],
                        (err, res, field) => {
                            if (err) throw err;
                            for (let resIdx = 0; resIdx < res.length; resIdx++) {  // 遍历查出来的每条记录
                                res[resIdx].duration = 0; // 将记录中有用的部分取出，
                            }
                            for (let resIdx = res.length - 1; resIdx >= 0; resIdx--) {  // 计算每个路径点的停留时长
                                res[resIdx].duration = res[resIdx].time - res[0].time;
                            }
                            renderRoutes(res); // 获得路径后显示出来
                        }
                    )
                }

                // this.$db.getDB((db) => {
                //     let dbo = db.db('vis');         // 选择数据库'vis'
                //     for (let idIdx = 0; idIdx < ids.length; idIdx++)    // 遍历每个人员，查出一条路径就画一条路径
                //         dbo.collection('days').aggregate([              // 做连接，查出指定人员的路径信息
                //             {
                //                 $lookup:
                //                     {from: 'sensors', localField: 'sid', foreignField: 'sid', as: 'route'}
                //             },
                //             {
                //                 $match: {"id": ids[idIdx], 'day': day}
                //             },
                //             {
                //                 $project: {'route': 3, 'id': 1, 'time': 2, '_id': 0}    // 数字顺序无关紧要
                //             }])
                //             .toArray((err, res) => {    // 将查询到的记录转成数组
                //                 if (err) throw err;
                //                 console.log('find:', ids[idIdx]);
                //                 let tRoute = [];
                //                 for (let i = 0; i < res.length; i++) {  // 遍历查出来的每条记录
                //                     tRoute.push({time: res[i].time, route: res[i].route[0], duration: 0});  // 将记录中有用的部分取出，
                //                     // 形成新数组
                //                 }
                //                 tRoute.sort((a, b) => {
                //                     return a.time - b.time;
                //                 });
                //                 for (let i = tRoute.length - 1; i >= 0; i--) {  // 计算每个路径点的停留时长
                //                     tRoute[i].duration = tRoute[i].time - tRoute[0].time;
                //                 }
                //                 console.log(tRoute);
                //                 renderRoutes(tRoute); // 获得路径后显示出来
                //             });
                // });
            }
        }
    }
    //    todo 增加删除路径的函数
</script>

<style scoped>

</style>