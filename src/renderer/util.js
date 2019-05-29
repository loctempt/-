module.exports = {
    parseTime: function (second) {
        let hh = parseInt(second / 3600);
        let mm = parseInt(second / 60) % 60;
        let ss = second % 60;
        if(mm < 10) mm = '0' + mm;
        if(ss < 10) ss = '0' + ss;
        return hh + ':' + mm + ':' + ss;
    }
};