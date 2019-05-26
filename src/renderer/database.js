// import Mongo from 'mongodb'
var MongoClient = require('mongodb').MongoClient;
// var MongoClient = Mongo.MongoClient;
var url = "mongodb://localhost:27017/vis";

module.exports = {
    getDB: function (callback) {
        MongoClient.connect(url, {useNewUrlParser: true}, function (err, db) {
            callback(db);
        })
    }
};

// function DB(){
//     this.exec = function (callback) {
//         MongoClient.connect(url, {useNewUrlParser:true},  function (err, db) {
//             callback(db)
//         })
//     }
// }
//
// export default {
//     DB
// };
