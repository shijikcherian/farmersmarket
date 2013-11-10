var cradle = require('cradle');
var conn = new(cradle.Connection)('http://admin:password@localhost:5984');
var db = conn.database('farmersmarket');

var mysql = require('mysql');
var connection = mysql.createConnection({
host : 'localhost',
user : 'root',
password : 'pwd',
database: 'DB_VFM_v1'
});

db.exists(function (err, exists) {
    if (err) {
      console.log('error', err);
    } else if (exists) {
      console.log('db  exists');
    } else {
      console.log('database  does not exist. Creating...');
      db.create();
      console.log('database created');
    }
});

function get_doc(docName,res){
    db.get(docName,function(err,body){
       if(!err)
       {
           res(body);
       }
    });
};

/*db.save( data, function(err,doc) {
    if ( err ) {
      console.log(err);
       res.send(404, err);
       res.send(500);
    } else {
      console.log(doc);
      res.json(doc);
    }
});*/
exports.db = db;