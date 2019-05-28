// var MongoClient = require('mongodb').MongoClient;
// var url = "mongodb://localhost:27017/vis";
//
// // 导出getDB()方法
// module.exports = {
//     /**
//      * 接受一个回调函数，在与MongoDB建立连接后，就执行该函数
//      * 回调函数接受一个db实例，通过该实例可以操作MongoDB
//      * @param callback
//      */
//     getDB: function (callback) {
//         MongoClient.connect(url, {useNewUrlParser: true}, function (err, db) {
//             callback(db);
//         })
//     }
// };
// import mysql from 'mysql';
let mysql = require('mysql');
let connection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'mysql123',
    database: 'vis'
});
connection.connect(function(err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('connected as id ' + connection.threadId);
});
module.exports = connection;