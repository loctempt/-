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
            // .attr("transform","translate(-50% 0)")
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
                return (d.y2  - d.y1) * rectWidth / 2;
            })
            .attr('text-anchor', 'middle')
            .text(function (d) {
                return d.name;
            })
    }
    function transparentLayer(){
        let pos=[{'x':marginLeft,'y':marginTop,'floor':1},{'x':marginLeft,'y':(16 * rectWidth + 20)+marginTop,'floor':2}];
        console.log('显示透明图层');
        d3.select('svg')
            .selectAll('.transparent')
            .data(pos)
            .enter()
            .append('rect')
            .attr('class','transparent')
            .attr('y',function (d) {
                if (d.floor === 1)
                    return  d.y;
                else if (d.floor === 2)
                    return  d.y;  // 留出顶边距
            })
            .attr('x',function (d) {
                return d.x ; // 留出左边距
            })
            .attr('width', function (d) {
                return  rectWidth * 30 ;
            })
            .attr('height',function (d) {
                return 16 * rectWidth;
            })
            .attr('fill',function (d) {
                return 'rgba(100,0,0,0.2)';
            })
    }

    function heatMapLayer(heatData) {
        let linear = d3.scale.linear()
            .domain([0,150])
            .range([0,1]);
        let compute=d3.interpolate(d3.rgba(255,0,0,0.1),d3.rgba(0,255,0,0.1));//红色渐变到绿色

        d3.select('svg')
            .selectAll('.heat')
            .remove();

        d3.select('svg')
            .selectAll('.heat')
            .data(heatData)
            .enter()
            .append('rect')
            .attr('class','heat')
            .attr('y',function (d) {
                if (d.route.floor === 1)
                    return d.route.x * (rectWidth) + marginTop;
                else if (d.route.floor === 2)
                    return d.route.x * (rectWidth) + marginTop + (16 * rectWidth + 20);  // 留出顶边距
            })
            .attr('x',function (d) {
                return  d.route.y * (rectWidth) + marginLeft; // 留出左边距
            })
            .attr('width', function (d) {
                return rectWidth;
            })
            .attr('height', function (d) {
                return rectWidth;
            })
            .attr('fill',function (d) {
                return compute(linear(d.frequency));
            })
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

    //===============  for testing  =================
    const idForTest = [18473];
    //===============  for testing  =================

    let svgWidth = 1800, svgHeight = 1400;

    export default {
        name: "SvgMap",
        data() {
            return {}
        },
        mounted() {
            let svg = d3.select('svg')         // 设置svg元素
                .attr('width', svgWidth)       // 设置宽度
                .attr('height', svgHeight);    // 设置高度

            renderFloorMap(floor);        // 渲染地图底图
             renderFloorDetail(floorDetail);    // 显示各个区域
            transparentLayer();
            // renderFloorDetail(floorDetail);    // 显示各个区域

            this.findRouteById(idForTest, 1);  // todo 把写死的第一天 改成动态的
        },
        methods: {
            heatMaplayer:function(day){//传入日期
                this.$db.getDB((db)=>{
                    let a = db.db('vis');
                    // for(){
                    //
                    // } todo 连表思路是：取一条记录 去布置表中外键查对应的id 并将[x][y][z]++

                })
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