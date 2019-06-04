<template>
    <div class="chartContainer">
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
        <div id="cluster_chart" style="width: 1200px; height: 1200px; margin-top: 10px"></div>
    </div>
</template>

<script>
    let echarts = require('echarts');

    let data = [];
    let assignments = [];
    let means = [[1], [1, 2], [1, 2, 3]];
    let dbscanResult = {};
    let globalVarDay = 1;
    let myChart;
    let chartData = {
        name: "Day" + globalVarDay,
        children: []
    };
    let option = {
        title: {
            text: '人员类型聚类',
            subtext: '数据从地下来',
            x: 'center'
        },
        tooltip: {
            trigger: 'item',
            triggerOn: 'mousemove'
        },
        series: [
            {
                type: 'tree',
                data: [chartData],
                top: '18%',
                bottom: '14%',
                layout: 'radial',
                symbol: 'emptyCircle',
                symbolSize: 7,
                initialTreeDepth: 1,
                animationDurationUpdate: 750,
                roam: true
            }
        ],
        // dataZoom:[
        //     {type: 'inside'}
        // ]
    };

    function setChartOption(clusterData) {
        chartData.name = 'Day' + globalVarDay;
        chartData.children = [];
        let tmp = {};
        for (let clusterDataIndex in clusterData) {
            let clusterItem = clusterData[clusterDataIndex];
            let k = clusterItem.cluster;
            let id = clusterItem.id;
            if (!tmp[k]) tmp[k] = {name: k, children: []};
            tmp[k].children.push({name: id});
        }
        for (let attrIndex in tmp) {
            chartData.children.push(tmp[attrIndex]);
        }
        option.series[0].data.push(chartData);
        console.log(chartData);
        myChart.setOption(option);
    }

    export default {
        name: "Cluster",
        data() {
            return {
                idMap: {},
                ids: [],
                idsLength: 0,     // ids数组长度
                progressCnt: 0,    // 由构造idMap进程的计数器
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
                dayValue: null,
            }
        },
        mounted() {
            // this.initIdMap();
            myChart = echarts.init(document.getElementById('cluster_chart'));
            myChart.setOption(option);
        },
        computed: {
            idMapReady: function () {
                return this.idsLength === this.progressCnt;
            }
        },
        watch: {
            dayValue: function(newDayValue){
                console.log('dayValue:', newDayValue);
                globalVarDay = newDayValue;
                this.getClusterData();
            },
            progressCnt: function () {
                if (this.progressCnt % 1000 === 0) console.log(this.progressCnt);
                if (this.progressCnt === this.idsLength) {
                    console.log('idMap读取完成');  // idMap构造完成后显示之
                    // console.log('distance:', this.levenshteinDistance(this.idMap[11378], this.idMap[11396]));
                    // console.log('distance:', this.levenshteinDistance([1,2,3,4,5],[2,3,4,5]));
                    // for(let id in this.idMap) data.push(this.idMap[id]);
                    // data = data.slice(0, 500);
                    data = this.idMap;
                    console.log(data[5]);
                    console.log(data[6]);
                    console.log(data[7]);
                    // this.kMeans();

                    // 聚类并输出
                    // dbscanResult = this.dbscan(2, 10);
                    // console.log(dbscanResult);
                    // let cluster = [];
                    // for (let cIndex in dbscanResult.cluster) {
                    //     for (let pointIndex in dbscanResult.cluster[cIndex]) {
                    //         cluster.push([dbscanResult.cluster[cIndex][pointIndex], cIndex]);
                    //     }
                    // }
                    // for (let pointIndex in dbscanResult.noise) {
                    //     cluster.push([dbscanResult.noise[pointIndex], -1]);
                    // }
                    // writeJson(cluster);
                }
            }
        },
        methods: {
            getClusterData: function(){
              this.$db.query(
                  'SELECT * FROM cluster_day'+globalVarDay,
                  (err, clusterData)=>{
                      if(err) throw err;
                      console.log(clusterData);
                      setChartOption(clusterData);
                  }
              );
            },
            /**
             * 计算点x的epsilon-邻域中有多少个其他点
             * @return {number}
             */
            N_epsilon: function (epsilon, x) {
                let cnt = 0;
                let point = data[x];
                for (let pointIndex in data) {
                    if (pointIndex === x) continue;
                    let pointTmp = data[pointIndex];
                    if (this.levenshteinDistance(point, pointTmp) <= epsilon) cnt++;
                }
                return cnt;
            },
            dbscan: function (epsilon, minPts) {
                console.log('构造Omega');
                let Omega = [];                     // 核心对象集合
                for (let pointIndex in data) {        // 找出所有核心对象
                    console.log('pointIndex:', pointIndex);
                    if (this.N_epsilon(epsilon, pointIndex) >= minPts)
                        Omega.push(pointIndex);
                }
                console.log('完成构造Omega');
                let C = {};                         // 聚类簇集合
                let k = 0;                          // 初始聚类簇数
                let Gamma = [];                     // 未访问样本集合
                for (let pointIndex in data) Gamma.push(pointIndex); // 初始化未访问样本集合
                console.log('开始聚类');
                while (Omega.length > 0) {
                    console.log('k:', k);
                    console.log('Gamma:');
                    console.log(Gamma);
                    console.log('Omega:');
                    console.log(Omega);
                    let Gamma_old = [...Gamma];
                    let Q = [];
                    let o = Omega[0];
                    console.log('o:', o, 'o连接的点数：', this.N_epsilon(epsilon, o));
                    Q.push(o);
                    Gamma.splice(Gamma.indexOf(o), 1);
                    while (Q.length > 0) {
                        let q = Q.shift();
                        let point = data[q];
                        if (this.N_epsilon(epsilon, q) >= minPts) {   // 如果q是个核心元素，计算Delta
                            // console.log('核心对象q：', q);
                            let Delta = [];                         // 临时数组，保存点的下标pointIndex
                            for (let GammaIndex in Gamma) {           // 构造Delta
                                let pointTmp = data[Gamma[GammaIndex]];    // Gamma中不会含有队列Q中弹出的元素，故无需设置continue条件
                                if (this.levenshteinDistance(point, pointTmp) <= epsilon) Delta.push(Gamma[GammaIndex]);
                            }
                            Q = [...Q, ...Delta];                   // 将Delta中的元素放入q中
                            for (let i in Delta) {
                                Gamma.splice(Gamma.indexOf(Delta[i]), 1);   // 从Gamma中去掉Delta中的元素
                            }
                        }
                    }
                    k += 1;                                         // 聚类簇编号更新
                    for (let i in Gamma) {
                        Gamma_old.splice(Gamma_old.indexOf(Gamma[i]), 1);   // 得到聚类簇
                    }
                    C[k] = Gamma_old;                               // 记录聚类簇
                    console.log('Gamma_old:');
                    console.log(Gamma_old);
                    for (let i in Gamma_old) {
                        let coreObjectIndex = Omega.indexOf(Gamma_old[i]);
                        if (coreObjectIndex >= 0)                    // 找到聚类簇C[k]中的核心对象
                            Omega.splice(coreObjectIndex, 1);       // 将该核心对象从核心对象集合Omega中移除
                    }
                }
                return {cluster: C, noise: Gamma};                  // 最后Gamma中剩下的元素就是噪声对象
            },
            kMeans: function () {
                let run = true;
                let round = 1;
                while (run) {
                    console.log('round', round);
                    run = this.moveMeans();
                    round++;
                }
                console.log('聚类完成');
                console.log(assignments);
            },
            upperBound: function (arr, tgt) {
                let s = 0, e = arr.length - 1, m;
                while (s <= e) {
                    m = s + parseInt((e - s) / 2);
                    if (arr[m].distance === tgt) return m;    // 找到了
                    if (arr[m].distance > tgt)
                        e = m - 1;
                    else
                        s = m + 1;
                }
                if (s >= arr.length) return -1;           // 不存在大于等于目标的元素
                return m;                                 // 大于等于目标的第一个元素
            },
            moveMeans: function () {
                function mostCommonVal(distance) {      // 取众数
                    let cntVal = {};
                    let max = 0;                        // 最大计数
                    let mostCommonDist = -1;            // 众数距离
                    for (let pointIndex in distance) {    // 遍历距离
                        let dist = distance[pointIndex].distance;
                        if (!cntVal[dist]) cntVal[dist] = 1; // 桶排序
                        else cntVal[dist]++;
                        if (cntVal[dist] > max) {         // 记录最大
                            max = cntVal[dist];
                            mostCommonDist = dist;
                        }
                    }
                    return mostCommonDist;
                }

                this.makeAssignment();
                let moved = false;
                let distanceSums = Array(means.length);   // 每个聚类中点到中心的距离和
                let distances = Array(means.length);
                let counts = Array(means.length);      // 每个聚类的大小

                for (let j in means) {
                    distanceSums[j] = counts[j] = 0;
                    distances[j] = [];
                }

                for (let pointIndex in assignments) {    // 计算每个聚类中点到中心的距离和，以及聚类的大小
                    let meanIndex = assignments[pointIndex];
                    let mean = means[meanIndex];
                    let point = data[pointIndex];
                    let distance = this.levenshteinDistance(point, mean);
                    distanceSums[meanIndex] += distance;
                    distances[meanIndex].push({pointIndex: pointIndex, distance: distance});
                    counts[meanIndex] += 1;
                }

                let averages = Array(means.length);
                let newMeans = Array(means.length);
                for (let meanIndex in means) {
                    // averages[meanIndex] = Math.round(distanceSums[meanIndex] / counts[meanIndex]);  // 计算平均距离
                    averages[meanIndex] = mostCommonVal(distances[meanIndex]);
                    distances.sort((a, b) => {
                        return a.distance - b.distance
                    });
                }
                console.log('---- move mean ----');
                for (let meanIndex in means) {
                    console.log(distances[meanIndex]);
                    // console.log(averages[meanIndex]);
                    console.log(this.upperBound(distances[meanIndex], averages[meanIndex]));
                    let pointItem = distances[meanIndex][this.upperBound(distances[meanIndex], averages[meanIndex])];
                    // console.log(pointItem);
                    let pointIndex = pointItem.pointIndex;      // 以与聚类中心的距离最接近平均距离的点作为新的聚类中心
                    newMeans[meanIndex] = data[pointIndex];     // 更新聚类中心
                }
                console.log(newMeans);

                function checkVariance(vm) {
                    for (let meanIndex in means) {
                        if (vm.levenshteinDistance(newMeans[meanIndex], means[meanIndex]) > 20) return false;
                    }
                    return true;
                }

                if (checkVariance(this)/*newMeans.toString() === means.toString()*/) {    // 若聚类中心未发生改变，则返回false
                    return false;
                } else {
                    means = newMeans;                          // 聚类中心发生改变，用新值覆盖老值，并返回true
                    return true;
                }
            },
            makeAssignment: function () {
                for (let pointIndex in data) {
                    let point = data[pointIndex];
                    let distances = [];
                    for (let meanIndex in means) {
                        let mean = means[meanIndex];
                        distances[meanIndex] = this.levenshteinDistance(point, mean);        // 计算每个节点到中心的距离
                    }
                    assignments[pointIndex] = distances.indexOf(Math.min.apply(null, distances));    // 划归到某一类中
                }
                // console.log(assignments);
            },
            levenshteinDistance: function (arrA, arrB) {
                let lenA = arrA.length, lenB = arrB.length;
                let dp = [];
                for (let i = 0; i <= lenA; i++) dp.push([]);    // 构建数组
                for (let i = 0; i <= lenA; i++)
                    for (let j = 0; j <= lenB; j++)
                        dp[i].push(0);
                for (let i = 0; i <= lenA; i++) dp[i][0] = i;   // 初始化数组
                for (let j = 0; j <= lenB; j++) dp[0][j] = j;
                for (let i = 1; i <= lenA; i++)
                    for (let j = 1; j <= lenB; j++) {
                        let cost = 0;
                        if (arrA[i - 1] !== arrB[j - 1]) cost = 1;
                        dp[i][j] = Math.min(
                            dp[i][j - 1] + 1,
                            dp[i - 1][j] + 1,
                            dp[i - 1][j - 1] + cost
                        )
                    }
                return dp[lenA][lenB];
            },
            initIdMap: function () {
                this.$db.query(
                    'select id from id_day' + globalVarDay,
                    (err, res) => {
                        if (err) throw err;
                        for (let i = 0; i < res.length; i++) this.ids.push(res[i].id);   // 获得所有id的列表
                        this.idsLength = res.length;
                        this.queryAll();
                    }
                )
            },
            queryAll: function () {
                for (let i = 0; i < this.ids.length; i++) {          // 遍历ids，查找每个id对应的路径序列
                    let id = this.ids[i];
                    this.$db.query(
                        'select * from cluster_raw where id=? and `day`=?',
                        [id, globalVarDay],
                        (err, res) => {
                            if (err) throw err;
                            this.idMap[id] = [];
                            for (let j = 0; j < res.length; j++)
                                this.idMap[id].push(res[j].detail_id);   // 将路径序列放入映射表中
                            this.progressCnt++;                     // 进程计数器加一
                        }
                    )
                }
            }
        }
    }

    var fs = require('fs');

    /**
     * 将data保存至json文件中
     * @param params
     */
    function writeJson(params) {
        //现将json文件读出来
        fs.readFile('./data.json', function (err, data) {
            if (err) {
                return console.error(err);
            }
            var person = data.toString();//将二进制的数据转换为字符串
            person = JSON.parse(person);//将字符串转换为json对象
            person.data = params;//将传来的对象push进数组对象中
            console.log(person.data);
            var str = JSON.stringify(person);//因为nodejs的写入文件只认识字符串或者二进制数，所以把json对象转换成字符串重新写入json文件中
            fs.writeFile('./data.json', str, function (err) {
                if (err) {
                    console.error(err);
                }
                console.log('----------新增成功-------------');
            })
        })
    }
</script>

<style scoped>
    .chartContainer {
        padding-left: 10%;
        margin-top: 100px;
        /*display: flex;*/
        /*align-items: center;*/
        /*justify-content: center;*/
    }
</style>