<template>
    <div id="wrapper">
        <img id="logo" src="~@/assets/logo.png" alt="electron-vue">
        <svg-map></svg-map>
        <entrance-departure-figure></entrance-departure-figure>
        <cluster></cluster>
    </div>
</template>
<script type="text/javascript">
    import SystemInformation from './LandingPage/SystemInformation'
    import SvgMap from './SvgMap'
    import EntranceDepartureFigure from './EntranceDepartureFigure'
    import Cluster from './Cluster'
    let XLSX = require('xlsx');

    export default {
        name: 'landing-page',
        data() {
            return {
                cnt: 0,         // 用于聚类预处理
                total: -1,      // 用于聚类预处理
                resData: []     // 用于聚类预处理
            }
        },
        components: {SvgMap, SystemInformation, EntranceDepartureFigure, Cluster},
        mounted() {
            // this.haha();        // 用于聚类预处理
        },
        watch: {
            cnt: function () {  // 用于聚类预处理
                if (this.cnt % 100 === 0) console.log(this.cnt);
                if (this.cnt % 300 === 0) writeJson(this.resData);
                if (this.cnt === this.total) writeJson(this.resData);
            }
        },
        methods: {
            open(link) {
                this.$electron.shell.openExternal(link)
            },
            /**
             * 对每个人的路径序列进行子序列去重，用于聚类预处理
             */
            haha() {
                // let workbook = new XLSX.Wor
                this.$db.query(
                    'select distinct `id` from `days`',
                    (err, ids) => {
                        if (err) throw err;
                        console.log(ids);
                        this.total = ids.length;
                        for (let i = 0; i < ids.length; i++) {  // 遍历id
                            let id = ids[i].id;
                            this.$db.query(                     // 查询这个id走过的场所序号
                                'select `id`, `detail_id`, `name` from `days_detail` a, `floor_detail` b where `id`=? and a.x between b.x1 and b.x2 and a.y between b.y1 and b.y2 and a.floor = b.floor order by `day`, `time`',
                                [id],
                                (err, seq) => {
                                    // console.log(seq);
                                    if (err) throw err;
                                    let prev = -1, t_cnt = 1;
                                    for (let j = 0; j < seq.length; j++)    // 子序列去重
                                        if (seq[j].detail_id !== prev) {
                                            this.resData.push([id, seq[j].detail_id, t_cnt]);
                                            // result.push(seq[j]);
                                            // this.$db.query(
                                            //     'INSERT INTO `cluster_raw` values (?, ?, ?)',
                                            //     [id, seq[j].detail_id, t_cnt],
                                            //     ()=>{}
                                            // );
                                            prev = seq[j].detail_id;
                                            t_cnt++;
                                        }
                                    // if (this.cnt % 100 === 0) console.log(this.resData);
                                    this.cnt++;
                                }
                            )
                        }
                    }
                )
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
        /*background: radial-gradient(*/
        /*        ellipse at top left,*/
        /*        rgba(255, 255, 255, 1) 40%,*/
        /*        rgba(229, 229, 229, .9) 100%*/
        /*) no-repeat fixed;*/
        background: url("../assets/background.png") repeat fixed;
        /*height: 100vh;*/
        padding: 20px 80px;
        /*width: 100vw;*/
    }

    #logo {
        height: auto;
        margin-bottom: 20px;
        width: 260px;
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
