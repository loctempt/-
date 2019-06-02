<template>

</template>

<script>

    let data = [];
    let assignments = [];
    let means = [[1], [1, 2], [1, 2, 3]];

    export default {
        name: "Cluster",
        data() {
            return {
                idMap: {},
                ids: [],
                idsLength: 0,     // ids数组长度
                progressCnt: 0,    // 由构造idMap进程的计数器
            }
        },
        mounted() {
            this.initIdMap();
        },
        computed: {
            idMapReady: function () {
                return this.idsLength === this.progressCnt;
            }
        },
        watch: {
            progressCnt: function () {
                if (this.progressCnt % 1000 === 0) console.log(this.progressCnt);
                if (this.progressCnt === this.idsLength) {
                    console.log('idMap读取完成');  // idMap构造完成后显示之
                    // console.log('distance:', this.levenshteinDistance(this.idMap[11378], this.idMap[11396]));
                    for(let id in this.idMap) data.push(this.idMap[id]);
                    this.kMeans();
                }
            }
        },
        methods: {
            kMeans: function () {
                let run = true;
                let round = 0;
                while (run) {
                    run = this.moveMeans();
                    round++;
                    console.log(round);
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
                    averages[meanIndex] = Math.round(distanceSums[meanIndex] / counts[meanIndex]);  // 计算平均距离
                    distances.sort((a, b) => {
                        return a.distance - b.distance
                    });
                }
                for (let meanIndex in means) {
                    console.log(distances[meanIndex]);
                    console.log(averages[meanIndex]);
                    console.log(this.upperBound(distances[meanIndex], averages[meanIndex]));
                    let pointItem = distances[meanIndex][this.upperBound(distances[meanIndex], averages[meanIndex])];
                    console.log(pointItem);
                    let pointIndex = pointItem.pointIndex; // 以与聚类中心的距离最接近平均距离的点作为新的聚类中心
                    newMeans[meanIndex] = data[pointIndex];    // 更新聚类中心
                }
                if (newMeans.toString() === means.toString()) {    // 若聚类中心未发生改变，则返回false
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
                    'select distinct id from days',
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
                        'select * from cluster_raw where id=?',
                        [id],
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
</script>

<style scoped>

</style>