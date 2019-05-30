module.exports = {

    baseTime: 6 * 60,

    /**
     * 将秒转化为h:mm:ss格式
     * @param second
     * @returns {string}
     */
    parseTime: function (second) {
        let hh = parseInt(second / 3600);
        let mm = parseInt(second / 60) % 60;
        let ss = second % 60;
        if (mm < 10) mm = '0' + mm;
        if (ss < 10) ss = '0' + ss;
        return hh + ':' + mm + ':' + ss;
    },

    /**
     * 二分查找
     * 返回大于等于tgt的第一个元素的下标，如果不存在这样的元素，返回-1
     * @param arr sql返回的原始时间序列
     * @param tgt 欲查询的时间点
     */
    upperBound: function (arr, tgt) {
        tgt = (this.baseTime + tgt * 10) * 60;         // tgt转化成秒格式
        let s = 0, e = arr.length - 1, m;
        while (s <= e) {
            m = s + parseInt((e - s) / 2);
            if (arr[m].time === tgt) return m;    // 找到了
            if (arr[m].time > tgt)
                e = m - 1;
            else
                s = m + 1;
        }
        if (s >= arr.length) return -1;           // 不存在大于等于目标的元素
        return m;                                 // 大于等于目标的第一个元素
    },

    /**
     * 确认time对应的时间是否与timePoint相差小于10分钟
     * @param timePoint 时间点（分钟）
     * @param time 二分查找得到的时间点
     * @returns {boolean}
     */
    isTimeValid: function (timePoint, time) {
        return (time.time - (timePoint * 10 + this.baseTime) * 60 < 600);
    },

    /**
     * 以十分钟为一个区间统计一天内各个区间的人数
     * @param timeArr 带有time属性的对象数组
     */
    getTimePointArray: function (timeArr) {
        let activityData = [];
        for (let timePoint = 0; timePoint <= 90; timePoint++) {
            let timeIdx = this.upperBound(timeArr, timePoint);
            if (timeIdx === -1) activityData.push(0);    // 若未查到数据，给这个时刻赋个零人
            else {
                let cnt = 0;
                for (; timeIdx < timeArr.length; timeIdx++) {  // 统计10分钟内所有的入场人数
                    if (this.isTimeValid(timePoint, timeArr[timeIdx])) cnt++; // 遍历到的时间与timePoint差距小于10分钟，计数器加一
                    else break;
                }
                activityData.push(cnt);
            }
        }
        return activityData;
    },

    /**
     * 创建时间轴文字描述，91个点
     * @returns {Array}
     */
    timeDataGen: function () {
        let ret = [];
        for (let timePoint = 0; timePoint <= 90; timePoint++) {
            let str = '';
            str += parseInt((this.baseTime + timePoint * 10) / 60);
            str += ':';
            let minute = (this.baseTime + timePoint * 10) % 60;
            str += (minute === 0 ? '00' : minute);
            ret.push(str);
        }
        console.log(ret);
        return ret;
    }
};