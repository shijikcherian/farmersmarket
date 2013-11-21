
/**
 * Module dependencies.
 */

var express = require('express');

var market = require('./routes/market');

var http = require('http');
var path = require('path');


var app = express();
var cradle = require('cradle');
sys = require('sys');

//Defaults to 127.0.0.1:5984

var conn = new(cradle.Connection)('http://admin:password@localhost:5984');
//sys.puts('Database Connected');
var db = conn.database('trial1');
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({secret : 'v1rtualfarmersmarket'}));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/',market.index);

//root
app.get('/');

//form for new user
app.get('/newuser',market.newuser);
app.post('/registeruser',market.registeruser);
app.get('/registersuccess',market.registersuccess);

app.post('/authenticate_user',market.authenticate_user);

app.get('/welcomefarmer',market.welcomefarmer);
app.get('/welcomecustomer',market.welcomecustomer);


//app.del('/itemupdatedelete/delete_item',market.delete_item);

app.get('/error',market.autherror);




//display the list of produces
app.get('/produces', market.produces);
//app.get('/itemupdatedelete/:itemname', market.itemupdatedelete);

//display each farmers produce
app.get('/myproduces', market.myproduces);
app.get('/myproduces/:itemid', market.myproducesitem);
app.post('/myproduces/delete_item', market.delete_item);
//app.get('/myproduces/deleteitemsuccess',market.deleteitemsuccess);

app.post('/myproduces/updateitem', market.updateitem);
app.get('/myproduces/updateitemsuccess', market.updateitemsuccess);




//display the list of farmers
app.get('/farmers', market.farmers);

//display the staff picks
app.get('/staffpicks', market.staffpicks);
app.get('/staffpickitem/:itemname', market.staffpickitem);
app.post('/staffpickitem/buy_item',market.buy_item);
app.post('/staffpickitem/place_order',market.place_order);
app.get('/staffpickitem/invoice',market.invoice);
app.post('/staffpickitem/edit_address',market.edit_address);
app.post('/staffpickitem/confirm_addr',market.confirm_addr);
app.post('/staffpickitem/enter_cc_details',market.enter_cc_details);
app.post('/staffpickitem/transactionsuccess',market.transactionsuccess);

//upload items
app.get('/uploaditems',market.uploaditems);
app.post('/uploaditems',market.uploaditems_post_handler);
app.get('/uploaditemsuccess',market.uploaditemsuccess);

//logout
app.get('/logout',market.logout);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});