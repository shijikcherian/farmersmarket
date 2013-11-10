var simple_recaptcha = require('simple-recaptcha');
var filesys = require('fs');
var mysql = require('mysql');
var connection = mysql.createConnection({
host : 'localhost',
user : 'root',
password : 'pwd',
database: 'DB_VFM_v1'
});

var dao = require( '../data/dao' );
var db = dao.db;
var fs = require('fs');

//handler for index page
exports.index = function(req, res){	
	console.log("index"+req.session);
  res.render('index', { title: 'Virtual Farmers Market',sess:req.session });		
};


//handler for displaying the new user form
exports.newuser=function(req,res){
   
    res.render('newuser',{title:'Farmers Market - Guests',sess:req.session});

};

exports.registeruser=function(req,res){

	console.log(req.body.fname);
	console.log(req.ip);
	console.log(req.body.recaptcha_challenge_field);
	console.log(req.body.recaptcha_response_field);
	var privateKey = '6LffFOgSAAAAABuD3YZUrxA-ZYZ64CcABY6bq6l7'; // your private key here
	var ip = req.ip;
	var challenge = req.body.recaptcha_challenge_field;
	var response = req.body.recaptcha_response_field;
	var found1 = false;
	var found2 = false;

    simple_recaptcha(privateKey, ip, challenge, response, function(err) {
    if (err) {return res.send(err.message);}
    else{
    //res.send('verified');
    console.log("verified");
    //connect to DB and insert this user
    var connect = function(connection) {connection.connect();};
    //verify if user already exists
    var e = req.body.custorfarmer;
    console.log("e"+e);
    	   
    if ('customer' == e) {
    	var query = 'select * from customer where emailaddr="'+req.body.email+'"';
    	console.log(query);
    	connection.query(query, function (error, rows, fields) { 
    		 if(!error && rows.length != 0)
    			 found1 = true;    		 
    	});
    }
    if ('farmer' == e) {
    	var query = 'select * from farmer where emailaddr="'+req.body.email+'"';
	    console.log(query);
	    connection.query(query, function (error, rows, fields) { 
    		 if(!error && rows.length != 0)
    			 found2 = true;
    	}); 
    }
    if (found1 == true || found2 == true) {
    	console.log("You already have account with us! Please use 'forgot password' to retrieve your password");
    	// redirect to the page with simple sign in and forgot password button
    }
    else {
    	if('customer' == e) {
    		var query = 'insert into customer(name, lastname, emailaddr, password) values ("'
    			+ req.body.fname +'","'+ req.body.lname +'","'+ req.body.email+'","'+ req.body.passwd + '"'+')';
    			console.log(query);
	    		connection.query(query, function (error, rows, fields) {
	    			if (!error) {
	    				console.log("New user has been created successfully");
	    				
		    			req.session.username = req.body.fname;
		    			req.session.lastname=req.body.lname;
	    				console.log("going to welcome user page");
	    				// redirect to page saying welcome username
	    				res.redirect('/welcomecustomer');
	    				
	    			}
	    			if (error)		    				
	    			    res.redirect('/error');
	    			});
    	}
    	if('farmer' == e) {
    		var query = 'insert into farmer(name, lastname, emailaddr, login, password) values ("' 
    			+ req.body.fname +'","'+ req.body.lname +'","'+ req.body.email+'","'+ req.body.userid + '","' + req.body.passwd + 
    			'"'+')';
    			console.log(query);
	    		connection.query(query, function (error, rows, fields) {
	    			if (!error) {
	    				console.log("New farmer has been created successfully");
	    				
		    			req.session.username = req.body.fname;
		    			req.session.lastname=req.body.lname;
	    				console.log("going to welcome user page");
	    				// redirect to page saying welcome username
	    				 res.redirect('/welcomefarmer');
	    			}
	    			if (error) {
	    				console.log("New farmer couldn't be created");
	    				res.redirect('/error');
	    			}
	    		});
    	}   	
    }
    }  
    
 });
	  	  
};
exports.registersuccess= function(req, res){	
	  console.log("registersuccess");
	  res.render('registersuccess',{title:'Registered successfully. Please login to continue.....'});
	  
	};
exports.authenticate_user=function(req, res){
	
	 console.log("authenticating the user");
	 var query1 = '(select name, lastname,id, "customer" as type from customer where emailaddr ="'+req.body.email+'" AND password="'+req.body.passwd+'")';
	 var query2 = '(select name, lastname,id, "farmer" as type from farmer where emailaddr="'+req.body.email+'" AND password="'+req.body.passwd+'")';

	 var accounttype='';
	 var name='';
	 var lastname='';
	 var flag1 = 0;
	 var id='';

	 connection.query(query1 + " UNION " + query2, 
			 			function (error, frows, fields) { 
							 flag1 = frows.length;
							 
							 console.log("flag1"+flag1);
							 if(!error && frows.length != 0) {
								 console.log(query2);
								 accounttype = frows[0].type;
								 req.session.accounttype=accounttype;			 		 
								 req.session.username= frows[0].name;
								 req.session.lastname=frows[0].lastname;
								 req.session.cfid=frows[0].id;
								 console.log('@'+accounttype+'@');
								 console.log('@'+req.session.username+'@');
								 console.log('@'+req.session.lastname+'@');
								 console.log('@'+req.session.cfid+'@');
								 if (accounttype=='farmer'){
											
										console.log("I am a "+ accounttype);										
										res.redirect('/welcomefarmer');
								 }else{
									 console.log("I am a "+ accounttype);
									 res.redirect('/welcomecustomer');				 
								 }
									 
							 }
							 else if (flag1 == 0 ) {
								 console.log('No records found');
								 res.redirect('error');
							 }
							 else{
								console.log('Error');
								res.redirect('error');				 
							 }
	 });			
};
	

exports.welcomefarmer = function(req, res){
	console.log("I am in welcome farmer");
	console.log("farmerid" + req.session.cfid);
	console.log("username"+req.session.username);
	if(typeof req.session.username !=  'undefined') {
		res.render('welcomefarmer', { title: 'Virtual Farmers Market - Welcome' , session:req.session});
	}
	else{
		res.redirect('/');
	}
		
};
exports.welcomecustomer = function(req, res){
	console.log("I am in welcome customer");	
	if(typeof req.session.username !=  'undefined') {
		res.render('welcomefarmer', { title: 'Virtual Farmers Market - Welcome' , session:req.session});
	}
	else{
		res.redirect('/');
	}
		
};
//handler for displaying error in authentication
exports.autherror=function(req,res){
	
	res.render('error',{title:'Farmers Market - Error'});
	
};


//handler for displaying the produces
exports.produces=function(req,res){  
   res.render('produces',{title:'Farmers Market - Our Produces'});
};

//handler for displaying the farmers
exports.farmers=function(req,res){  
   res.render('farmers',{title:'Farmers Market - Our Farmers'});
};

exports.staffpicks= function(req, res){	 
  console.log("I am in staffpicks"); 
  console.log("sessionusername" + req.session.username);
  console.log("cfid"+ req.session.cfid);
  var itemnames = [];
  var itemimages = [];
  var itemcount = 0;
  
  db.save('_design/logo', {
      all: {
          map: function (doc) {
               emit(doc._id, doc);
          }
      },
      
  });
  db.view('logo/all', function (err, doc){
	for (var item in doc) {	    	  
      for (var attachmentName in doc[item].value._attachments) {
        console.log(attachmentName);
        
        itemnames[itemcount] = doc[item].id;
        console.log("docitemid"+ doc[[item].id]);        
        itemimages[itemcount] = 'http://localhost:5984/farmersmarket/'+doc[item].id+'/'+attachmentName;
        itemcount = itemcount+1;
      }
    }
	var data = {title:'Farmers Market - Our staffpicked items', 
      'item1name':itemnames[0],
      'item1image':itemimages[0],
      'item2name':itemnames[1],
      'item2image':itemimages[1],
      'item3name':itemnames[2],
      'item3image':itemimages[2],
      'item4name':itemnames[3],
      'item4image':itemimages[3],
      'item5name':itemnames[4],
      'item5image':itemimages[4],
      'item6name':itemnames[5],
      'item6image':itemimages[5]
    };
    res.render('staffpicks',data);        
  });
};

exports.myproduces= function(req, res){	 
	  console.log("I am in myproduces"); 
	  console.log("sessionusername" + req.session.username);
	  console.log("sessionusername" + req.session.lastname);
	  console.log("cfid"+ req.session.cfid);
	  var itemnames = [];
	  var itemimages = [];
	  var itemcount = 0;
	  
	  db.save('_design/logo', {
	      all: {
	          map: function (doc) {
	               emit(doc._id, doc);
	          }
	      },
	      
	  });
	  db.view('logo/all', function (err, doc){
		for (var item in doc) {	    	  
	      for (var attachmentName in doc[item].value._attachments) {
	        console.log(attachmentName);
	        
	        itemnames[itemcount] = doc[item].id;
	        console.log("docitemid"+ doc[[item].id]);        
	        itemimages[itemcount] = 'http://localhost:5984/farmersmarket/'+doc[item].id+'/'+attachmentName;
	        itemcount = itemcount+1;
	      }
	    }
		var data = {title:'Farmers Market - Our staffpicked items', 
	      'item1name':itemnames[0],
	      'item1image':itemimages[0],
	      'item2name':itemnames[1],
	      'item2image':itemimages[1],
	      'item3name':itemnames[2],
	      'item3image':itemimages[2],
	      'item4name':itemnames[3],
	      'item4image':itemimages[3],
	      'item5name':itemnames[4],
	      'item5image':itemimages[4],
	      'item6name':itemnames[5],
	      'item6image':itemimages[5],
	      'username':req.session.username,
	      'lastname':req.session.lastname
	    };
	    res.render('myproduces',data);        
	  });
	};

exports.staffpickitem=function(req,res){
  console.log("I am in staffpickitems");
  var name = req.param("itemname");	  
  db.get(name, function (err, doc) {	  
    for (name in doc._attachments) {
      attachmentName = name;	
    }
    console.log(attachmentName);
    itemimage = 'http://localhost:5984/farmersmarket/'+doc.id+'/'+attachmentName;
    var data = {title:'Farmers Market - Our staffpicked items', 
      'adddate':doc.adddate,
      'bestby':doc.bestby, 
      'farmname':doc.farmname,
      'perpack':doc.perpack,
      'unitprice':doc.unitprice,
      'instock':doc.instock,
      'itemimage':itemimage,
      'attachmentName':doc.id,
      'description':doc.description,
      'farmcode':doc.farmcode,
      'itemname':doc.itemname,
      'itemtag':doc.itemtag,
      'videolink1':doc.videolink1,
      'videolink2':doc.videolink2      
      
    };    
    res.render('staffpickitem',data);    
  }); 
};

exports.buy_item=function(req, res) {
	var itemid='';
	var itemquant='';
	console.log("buy item post method1");
	if(req.session == null) {
		console.log("please login to buy fresh food!");
	}
	else {
		console.log("sessionid:" + req.session.cfid);
	
		console.log("itemid" + req.body.itemid);
		
		
		console.log("quant"+ req.body.quant);
		
		//console.log(req.body.itemid+"@"+req.body.quant+"@");
		var idcustomer= req.session.cfid;
		 itemid= req.body.itemid;
	    
		itemquant= req.body.quant;
		console.log("idcustomer"+ idcustomer);
		
		console.log("itemid"+ itemid);
	
		db.get(itemid, function (err, doc) {
		    sys.puts(doc);
			console.log("itemid"+ itemid);
			console.log("itemquantity"+ itemquant);
			var unitprice = doc.unitprice;
			console.log("unitprice" + unitprice);
			var totalprice=itemquant * unitprice;
			console.log("totalprice"+ totalprice);
			var buydata = {title:'Farmers Market - Invoice', 
				      'itemid':itemid,				      
				      'unitprice':unitprice,
				      'itemquant':itemquant,
				      'totalprice':totalprice			           
			};    
			res.render('invoice',buydata);    
	
		});
	}
	
};
exports.invoice= function(req, res){ 
	  console.log("I am in invoice");
	  res.render('invoice',{title:'Farmers Market - Invoice', session:req.session});

	};


exports.uploaditems= function(req, res){ 
  res.render('uploaditems',{title:'Farmers Market - Our Farmers', session:req.session});

};

exports.place_order=function(req,res) {
	
	console.log("place_order: place order post method");
	
	if(req.session == null) {
		console.log("something went wrong!");
	}
	else {
		console.log(req.session.username);
		var q = 'Select address from customer where name="'+req.session.username+'"';
		console.log(q);
		connection.query(q, function(error, rows, fields) {
			if(!error && rows.length !=0) {
				var address = rows[0].address;
				console.log(address);
				req.session.shipping_addr = address;
				res.render('confirm_addr',{title: 'Virtual Farmers Market - Confirm address', address:address, session:req.session});
				
				
			}
			else {
				
				console.log("Error occured");
			}
			
		});
	}
	
	
};

exports.edit_address=function(req, res) {
	
	console.log("edit address post method");
	console.log("id:"+ req.session.cfid);
	//var q1 = 'select id from customer where name = "'+req.session.username+ '"';
	var cust_id = -1;
	if(req.body.addr != undefined) {		
		var address = req.body.addr;
		console.log("address:"+ address);
		if(address != '') {
			console.log("I am inside address is not null");
			req.session.shipping_addr = address;
			//connection.query(q1, function(error, rows, fields) {
				//if(!error){
					console.log("I am inside not error");
					//cust_id = rows[0].idcustomer;
					cust_id=req.session.cfid;
					console.log("cust_id"+cust_id);
					//req.session.userid = cust_id;
					var q = 'UPDATE customer SET address="'+ address +'" WHERE id = '+ cust_id;
					console.log(q);
					connection.query(q, function(error, rows, fields) {
						if(!error){
							
							console.log("Shipping address is saved successfully");
							// confirm the credit card details
							res.render('confirm_cc', {title: 'Virtual Farmers Market - credit card details', session:req.session});
						}			
	
					});
				//}
	
			//});
			
	}
	else {
			console.log("customer didn't enter any address!");
		}
	}
	else {
		console.log("customer shipping address is already entered");
		//connection.query(q1, function(error, rows, fields) {
			//if(!error){
				//cust_id = rows[0].idcustomer;
				//req.session.userid = cust_id;
				res.render('confirm_cc', {title: 'Virtual Farmers Market - credit card details', session:req.session});
			//}
				
		//});
	}
	
};
exports.confirm_addr=function(req,res) {
	
	console.log("confirm_address:place order post method");
	
	if(req.session == null) {
		console.log("something went wrong!");
	}
	else {
		console.log(req.session.username);
		var q = 'Select address from customer where name="'+req.session.username+'"';
		console.log(q);
		connection.query(q, function(error, rows, fields) {
			if(!error && rows.length !=0) {
				var address = rows[0].address;
				console.log(address);
				req.session.shipping_addr = address;
				res.render('confirm_addr',{title: 'Virtual Farmers Market - Confirm address', address:address, session:req.session});
				
				
			}
			else {
				
				console.log("Error occured");
			}
			
		});
	}
	
	
};
exports.enter_cc_details=function(req,res) {
	
	console.log("credit card details post method");
	if(req.session != undefined) {
		
		var q1 = 'select name, emailaddr from customer where id ='+ req.session.cfid;
		connection.query(q1, function(error, rows, fields) {
			if(!error){
				var cust_name = rows[0].name;
				var cust_email = rows[0].emailaddr;
				var q2 = 'INSERT INTO placed_order (customer_id, customer_name, customer_email,'
					+ 'shipping_addr, cc_num, cc_expdate, name_cc, billing_address)' +
					'VALUES ("'+ req.session.cfid + '","' +  cust_name + '","' + cust_email + '","' + req.session.shipping_addr + '","' + 
					 req.body.ccnum + '","' + req.body.expdate + '","' + req.body.name + '","' + req.body.addr + '")';
					 console.log(q2);
					 
				connection.query(q2, function(error, rows, fields) {
					if(!error) {
						console.log("Order placed successfully");
						res.redirect('/');
					}
				});
			}
		});

	}
	
};
exports.transactionsuccess= function(req, res){	
	  res.render('transactionsuccess',{title:'Farmers Market - Transaction completed successfully. You will receive your order on the third day'});
	  res.redirect('/staffpickitem');
	};

//handler for uploading items
exports.uploaditems_post_handler= function(req, res){
	console.log("I am in upload items post handler");
	console.log("farmerid" + req.session.cfid);

	var adddate= req.param("adddate"); 
	var bestby=req.param("bestby"); 
	var description=req.param("description"); 
	var farmname=req.param("farmname");
	var instock= req.param("instock"); 
	var itemname=req.param("itemname"); 
	var taglist=req.param("taglist"); 
	var perpack=req.param("perpack");
	var unitprice= req.param("unitprice"); 
	var videolink1=req.param("videolink1"); 
	var videolink2=req.param("videolink2"); 
	var logoimage=req.param("logoimage");
	var itemtype= req.param("itemtype"); 
	
	
	var idfarmer= req.session.cfid;
	var itemid=idfarmer +'_'+ itemname;
	
	db.save(itemid,{
		type: 'itemtype',
	    adddate: adddate,
	    bestby: bestby,
	    description: description,    
	    farmname: farmname,
	    instock: instock,
	    itemname:itemname,
	    idfarmer:idfarmer,
	    taglist:taglist,
	    perpack:perpack,
	    unitprice:unitprice,
	    videolink1:videolink1,
	    videolink2:videolink2,	    
	    
	 },function( err, doc ) {
	    console.log( err, doc );
		if ( err ) {
			console.log("save error");
			res.send(500, err );
	    } else {
	    	console.log("save success");
			var mimetype=req.files.logoImage.type; 
			var idData = {
			  id: doc._id,
			  rev: doc._rev
			};
			var filename = req.files.logoImage.name; 
			var filePath = req.files.logoImage.path;
			var readStream = fs.createReadStream(filePath);;
			console.log("my readstream");
			console.log(readStream);
			//streaming the upload
			var attachmentData = {
			  name: filename,
			  'Content-Type': mimetype
			};        
        
	        var readStream = fs.createReadStream(filePath);
			var writeStream = db.saveAttachment(idData, 
												attachmentData, 
												function (err, reply) {
													  if (err) {
																console.log("error saving attachment");
															    console.log(err);
															    return
													  }
													  else													
													  console.dir(reply);
												});	
			console.log("initating write stream");
			readStream.pipe(writeStream);		
	        console.log("everything success");                 
	        res.send( {success: true} );
	     }
	   }); 
	res.redirect('/uploaditemsuccess');
};

exports.uploaditemsuccess= function(req, res){	
  res.render('uploaditemsuccess',{title:'Farmers Market - Item uploaded successfully. Want to add more......'});
  res.redirect('/uploaditems');
};

exports.logout=function(req,res){
	   // delete the session variable
    req.session.destroy();
    // redirect user to homepage
    res.redirect('/');
	
};

