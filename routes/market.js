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
	var fulldata = {title:' Today at the market'};
	console.log("reqsession"+req.session);
	var itemcount = 0;
	season="Christmas";
	db.save('_design/farmer', {
		season: {
			map: function (doc) {
				if  (doc.taglist )emit(doc._id, doc); 
			}
		}
	});
	db.view('farmer/season', function (err, doc){
		console.log("1/2 err = "+err);
		console.log("I am in view of index");
		var data = {title:' Today at the market'};
		data.itemimages = [];
		data.itemnames = [];
		data.itemtypes=[];
		data.unitprices=[];
		
		for (var item in doc) {
			console.log("I am in item in doc");
			for (var attachmentName in doc[item].value._attachments) {
				console.log(attachmentName);
				data.itemimages.push('http://localhost:5984/farmersmarket/'+doc[item].id+'/'+attachmentName);
				console.log("itemimageid:"+ doc[item].id);
				data.itemtypes.push(doc[item].value.itemtype);
				console.log("itemtype"+ doc[item].value.itemtype);
				data.itemnames.push(doc[item].itemname);
				console.log("itemitemname"+ doc[item].value.itemname);
				data.unitprices.push(doc[item].value.unitprice);
				console.log("unitprice"+ doc[item].value.unitprice);
				itemcount = itemcount+1;
			}
		}
		data.itemcount = itemcount;
		console.log("itemcount"+itemcount);
		console.log("doc"+doc);
		//res.render('index',data);
		fulldata.data1 = data;
		//res.render('index', { title: ' Farmers Market',sess:req.session });	
		//other items
		db.save('_design/taglist', {
			allitems: {
				map: function (doc2) {
					if (doc2.taglist !=='Christmas')  emit(doc2._id, doc2); 
				}
			}
		});
		

		itemcount = 0;
		db.view('taglist/allitems', function (err, doc2){
			console.log("2/2 err = ",err);
			console.log("I am in view of index- otheritem");
			var data1 = {title:' Today at the market'};
			data1.itemimages = [];
			data1.itemnames = [];
			data1.itemtypes=[];
			data1.unitprices=[];
			
			for (var item in doc2) {
				console.log("I am in item in doc of other items");
				for (var attachmentName in doc2[item].value._attachments) {
					console.log(attachmentName);
					data1.itemimages.push('http://localhost:5984/farmersmarket/'+doc2[item].id+'/'+attachmentName);
					console.log("itemimageid:"+ doc2[item].id);
					data1.itemtypes.push(doc2[item].value.itemtype);
					console.log("itemtype"+ doc2[item].value.itemtype);
					data1.itemnames.push(doc2[item].itemname);
					console.log("itemitemname"+ doc2[item].value.itemname);
					data1.unitprices.push(doc2[item].value.unitprice);
					console.log("unitprice"+ doc2[item].value.unitprice);
					itemcount = itemcount+1;
				}
			}
			data1.itemcount = itemcount;
			console.log("itemcount"+itemcount);
			console.log("doc"+doc2);
			fulldata.data2 = data1;
			console.log("fulldata:"+fulldata);
			res.render('index',fulldata);
			//res.render('index', { title: ' Farmers Market',sess:req.session });	
		});//dbview
	});//dbview
	

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
	simple_recaptcha(privateKey, 
					ip, 
					challenge, 
					response, 
					function(err) {
						if (err) {
							return res.send(err.message);
						}
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
								connection.query(query, 
												function (error, rows, fields) { 
													if(!error && rows.length !== 0)
														found1 = true;
												});
							}
							if ('farmer' == e) {
								var query1 = 'select * from farmer where emailaddr="'+req.body.email+'"';
								console.log(query1);
								connection.query(query1, 
												function (error, rows, fields) { 
													if(!error && rows.length !== 0)
														found2 = true;
												}); 
							}
							if (found1 === true || found2 === true){
								console.log("You already have account with us! Please use 'forgot password' to retrieve your password");
								// redirect to the page with simple sign in and forgot password button
							}
							else {
								if('customer' == e) {
									var query2 = 'insert into customer(name, lastname, emailaddr, password) values ("'+
									req.body.fname +'","'+ req.body.lname +'","'+ req.body.email+'","'+ req.body.passwd + '"'+')';
									console.log(query2);
									connection.query(query2, 
													function (error, rows, fields) {
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
									var query3 = 'insert into farmer(name, lastname, emailaddr, login, password) values ("'+
									req.body.fname +'","'+ req.body.lname +'","'+ req.body.email+'","'+ req.body.userid + '","' + req.body.passwd + 
									'"'+')';
									console.log(query3);
									connection.query(query3, 
													function (error, rows, fields) {
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
								}//iffarmer	
						}//else
					}//else  
	});

};//exports
exports.registersuccess= function(req, res){	
	console.log("registersuccess");
	res.render('registersuccess',{title:'Registered successfully. Please login to continue.....'});
};

exports.authenticate_user=function(req, res){
	console.log("authenticating the user");
	var query1 = '(select name, lastname,id, "customer" as type from customer where emailaddr ="'+req.body.email+'" AND password="'+req.body.passwd+'")';
	var query2 = '(select name, lastname,id, "farmer" as type from farmer where emailaddr="'+req.body.email+'" AND password="'+req.body.passwd+'")';
	var accounttype='';
	//r name='';
	//r lastname='';
	var flag1 = 0;
	//var id='';

	connection.query(query1 + " UNION " + query2, 
						function (error, frows, fields) { 
							flag1 = frows.length;
							console.log("flag1"+flag1);
							if(!error && frows.length !== 0) {
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
							else if (flag1 === 0 ) {
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
		var fulldata = {title:' Today at the market'};
		console.log("reqsession"+req.session);
		var itemcount = 0;
		season="Christmas";
		db.save('_design/farmer', {
			season: {
				map: function (doc) {
					if  (doc.taglist )emit(doc._id, doc); 
				}
			}
		});
		db.view('farmer/season', function (err, doc){
			console.log("1/2 err = "+err);
			console.log("I am in view of index");
			var data = {title:' Today at the market'};
			data.itemimages = [];
			data.itemnames = [];
			data.itemtypes=[];
			data.unitprices=[];
			
			for (var item in doc) {
				console.log("I am in item in doc");
				for (var attachmentName in doc[item].value._attachments) {
					console.log(attachmentName);
					data.itemimages.push('http://localhost:5984/farmersmarket/'+doc[item].id+'/'+attachmentName);
					console.log("itemimageid:"+ doc[item].id);
					data.itemtypes.push(doc[item].value.itemtype);
					console.log("itemtype"+ doc[item].value.itemtype);
					data.itemnames.push(doc[item].itemname);
					console.log("itemitemname"+ doc[item].value.itemname);
					data.unitprices.push(doc[item].value.unitprice);
					console.log("unitprice"+ doc[item].value.unitprice);
					itemcount = itemcount+1;
				}
			}
			data.itemcount = itemcount;
			console.log("itemcount"+itemcount);
			console.log("doc"+doc);
			//res.render('index',data);
			fulldata.data1 = data;
			//res.render('index', { title: ' Farmers Market',sess:req.session });	
			//other items
			db.save('_design/taglist', {
				allitems: {
					map: function (doc2) {
						if (doc2.taglist !=='Christmas')  emit(doc2._id, doc2); 
					}
				}
			});
			

			itemcount = 0;
			db.view('taglist/allitems', function (err, doc2){
				console.log("2/2 err = ",err);
				console.log("I am in view of index- otheritem");
				var data1 = {title:' Today at the market'};
				data1.itemimages = [];
				data1.itemnames = [];
				data1.itemtypes=[];
				data1.unitprices=[];
				
				for (var item in doc2) {
					console.log("I am in item in doc of other items");
					for (var attachmentName in doc2[item].value._attachments) {
						console.log(attachmentName);
						data1.itemimages.push('http://localhost:5984/farmersmarket/'+doc2[item].id+'/'+attachmentName);
						console.log("itemimageid:"+ doc2[item].id);
						data1.itemtypes.push(doc2[item].value.itemtype);
						console.log("itemtype"+ doc2[item].value.itemtype);
						data1.itemnames.push(doc2[item].itemname);
						console.log("itemitemname"+ doc2[item].value.itemname);
						data1.unitprices.push(doc2[item].value.unitprice);
						console.log("unitprice"+ doc2[item].value.unitprice);
						itemcount = itemcount+1;
					}
				}
				data1.itemcount = itemcount;
				console.log("itemcount"+itemcount);
				console.log("doc"+doc2);
				fulldata.data2 = data1;
				console.log("fulldata:"+fulldata);
				
				res.render('welcomefarmer',{title: ' Farmers Market',fulldata:fulldata,session:req.session});
				//res.render('index', { title: ' Farmers Market',sess:req.session });	
			});//dbview
		});//dbview


		//res.render('welcomefarmer', { title: 'Virtual Farmers Market' , session:req.session});
	}
	else{
		res.redirect('/');
	}
		
};
exports.welcomecustomer = function(req, res){
	console.log("I am in welcome customer");	
	console.log("customerid" + req.session.cfid);
	console.log("username"+req.session.username);
	if(typeof req.session.username !=  'undefined') {
		var fulldata = {title:' Today at the market'};
		console.log("reqsession"+req.session);
		var itemcount = 0;
		season="Christmas";
		db.save('_design/farmer', {
			season: {
				map: function (doc) {
					if  (doc.taglist )emit(doc._id, doc); 
				}
			}
		});
		db.view('farmer/season', function (err, doc){
			console.log("1/2 err = "+err);
			console.log("I am in view of index");
			var data = {title:' Today at the market'};
			data.itemimages = [];
			data.itemnames = [];
			data.itemtypes=[];
			data.unitprices=[];
			
			for (var item in doc) {
				console.log("I am in item in doc");
				for (var attachmentName in doc[item].value._attachments) {
					console.log(attachmentName);
					data.itemimages.push('http://localhost:5984/farmersmarket/'+doc[item].id+'/'+attachmentName);
					console.log("itemimageid:"+ doc[item].id);
					data.itemtypes.push(doc[item].value.itemtype);
					console.log("itemtype"+ doc[item].value.itemtype);
					data.itemnames.push(doc[item].itemname);
					console.log("itemitemname"+ doc[item].value.itemname);
					data.unitprices.push(doc[item].value.unitprice);
					console.log("unitprice"+ doc[item].value.unitprice);
					itemcount = itemcount+1;
				}
			}
			data.itemcount = itemcount;
			console.log("itemcount"+itemcount);
			console.log("doc"+doc);
			//res.render('index',data);
			fulldata.data1 = data;
			//res.render('index', { title: ' Farmers Market',sess:req.session });	
			//other items
			db.save('_design/taglist', {
				allitems: {
					map: function (doc2) {
						if (doc2.taglist !=='Christmas')  emit(doc2._id, doc2); 
					}
				}
			});
			

			itemcount = 0;
			db.view('taglist/allitems', function (err, doc2){
				console.log("2/2 err = ",err);
				console.log("I am in view of index- otheritem");
				var data1 = {title:' Today at the market'};
				data1.itemimages = [];
				data1.itemnames = [];
				data1.itemtypes=[];
				data1.unitprices=[];
				
				for (var item in doc2) {
					console.log("I am in item in doc of other items");
					for (var attachmentName in doc2[item].value._attachments) {
						console.log(attachmentName);
						data1.itemimages.push('http://localhost:5984/farmersmarket/'+doc2[item].id+'/'+attachmentName);
						console.log("itemimageid:"+ doc2[item].id);
						data1.itemtypes.push(doc2[item].value.itemtype);
						console.log("itemtype"+ doc2[item].value.itemtype);
						data1.itemnames.push(doc2[item].itemname);
						console.log("itemitemname"+ doc2[item].value.itemname);
						data1.unitprices.push(doc2[item].value.unitprice);
						console.log("unitprice"+ doc2[item].value.unitprice);
						itemcount = itemcount+1;
					}
				}
				data1.itemcount = itemcount;
				console.log("itemcount"+itemcount);
				console.log("doc"+doc2);
				fulldata.data2 = data1;
				console.log("fulldata:"+fulldata);
				
				res.render('welcomecustomer',{title: ' Farmers Market',fulldata:fulldata,session:req.session});
				//res.render('index', { title: ' Farmers Market',sess:req.session });	
			});//dbview
		});//dbview


		//res.render('welcomefarmer', { title: 'Virtual Farmers Market' , session:req.session});
	}
	else{
		res.redirect('/');
	}
		
};
//handler for displaying error in authentication
exports.autherror=function(req,res){
	var fulldata = {title:' Today at the market'};
	console.log("reqsession"+req.session);
	var itemcount = 0;
	season="Christmas";
	db.save('_design/farmer', {
		season: {
			map: function (doc) {
				if  (doc.taglist )emit(doc._id, doc); 
			}
		}
	});
	db.view('farmer/season', function (err, doc){
		console.log("1/2 err = "+err);
		console.log("I am in view of index");
		var data = {title:' Today at the market'};
		data.itemimages = [];
		data.itemnames = [];
		data.itemtypes=[];
		data.unitprices=[];
		
		for (var item in doc) {
			console.log("I am in item in doc");
			for (var attachmentName in doc[item].value._attachments) {
				console.log(attachmentName);
				data.itemimages.push('http://localhost:5984/farmersmarket/'+doc[item].id+'/'+attachmentName);
				console.log("itemimageid:"+ doc[item].id);
				data.itemtypes.push(doc[item].value.itemtype);
				console.log("itemtype"+ doc[item].value.itemtype);
				data.itemnames.push(doc[item].itemname);
				console.log("itemitemname"+ doc[item].value.itemname);
				data.unitprices.push(doc[item].value.unitprice);
				console.log("unitprice"+ doc[item].value.unitprice);
				itemcount = itemcount+1;
			}
		}
		data.itemcount = itemcount;
		console.log("itemcount"+itemcount);
		console.log("doc"+doc);
		//res.render('index',data);
		fulldata.data1 = data;
		//res.render('index', { title: ' Farmers Market',sess:req.session });	
		//other items
		db.save('_design/taglist', {
			allitems: {
				map: function (doc2) {
					if (doc2.taglist !=='Christmas')  emit(doc2._id, doc2); 
				}
			}
		});
		

		itemcount = 0;
		db.view('taglist/allitems', function (err, doc2){
			console.log("2/2 err = ",err);
			console.log("I am in view of index- otheritem");
			var data1 = {title:' Today at the market'};
			data1.itemimages = [];
			data1.itemnames = [];
			data1.itemtypes=[];
			data1.unitprices=[];
			
			for (var item in doc2) {
				console.log("I am in item in doc of other items");
				for (var attachmentName in doc2[item].value._attachments) {
					console.log(attachmentName);
					data1.itemimages.push('http://localhost:5984/farmersmarket/'+doc2[item].id+'/'+attachmentName);
					console.log("itemimageid:"+ doc2[item].id);
					data1.itemtypes.push(doc2[item].value.itemtype);
					console.log("itemtype"+ doc2[item].value.itemtype);
					data1.itemnames.push(doc2[item].itemname);
					console.log("itemitemname"+ doc2[item].value.itemname);
					data1.unitprices.push(doc2[item].value.unitprice);
					console.log("unitprice"+ doc2[item].value.unitprice);
					itemcount = itemcount+1;
				}
			}
			data1.itemcount = itemcount;
			console.log("itemcount"+itemcount);
			console.log("doc"+doc2);
			fulldata.data2 = data1;
			console.log("fulldata:"+fulldata);
			res.render('error',fulldata);
			//res.render('error',{title:'Farmers Market - Error',fulldata:fulldata});
			//res.render('index', { title: ' Farmers Market',sess:req.session });	
		});//dbview
	});//dbview
		
	//res.render('error',{title:'Farmers Market - Error'});
	
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
	//var itemnames = [];
	//var itemimages = [];
	var itemcount = 0;

	db.save('_design/logo', {
		all:{
			map: function (doc) {
				emit(doc._id, doc);
			}
		}

	});
	db.view('logo/all', function (err, doc){

		var data = {title:' Today at the market'};
		data.itemimages = [];
		data.itemnames = [];
		data.displaynames=[];
		
		for (var item in doc) {
			console.log(doc);
			for (var attachmentName in doc[item].value._attachments) {
				console.log(attachmentName);
				data.itemimages.push('http://localhost:5984/farmersmarket/'+doc[item].id+'/'+attachmentName);
				data.itemnames.push(doc[item].id);
				data.displaynames.push(doc[item].value.itemname);
				console.log("displaypush:"+doc[item].value.itemname);
			
				itemcount = itemcount+1;
			}
		}
		data.itemcount = itemcount;
		
		res.render('staffpicks',{title: ' Farmers Market',data:data,session:req.session});        
	});
};

exports.myproduces= function(req, res){	 
	console.log("I am in myproduces"); 
	console.log("sessionusername" + req.session.username);
	console.log("sessionlastname" + req.session.lastname);
	console.log("cfid"+ req.session.cfid);

	//var itemnames = [];
	//var itemimages = [];
	var itemcount = 0;

	//var idfarmer = '34';
  
	db.save('_design/farmer', {
		item: {
			map: function (doc) {
				if  (doc.idfarmer )emit(doc._id, doc); 
			}
		}
	});
	db.view('farmer/item', function (err, doc){
		if (err === null) {	
			var data = {title:'Farmers Market -My Produces'};
			console.log("I am in view of farmeritem");
			data.itemimages = [];
			data.itemids = [];
			data.displaynames=[];
			for (var item in doc) {
				console.log("doc[item].value.idfarmer:"+doc[item].value.idfarmer);
				console.log("req.session.cfid:"+req.session.cfid);
	
				if (doc[item].value.idfarmer == req.session.cfid) {
					console.log("i am inside item in doc");
					console.log("docvalue:"+doc[item].value.idfarmer);
					console.log("doc:"+doc);
					console.log("cfude:"+req.session.cfid);	
					for (var attachmentName in doc[item].value._attachments) {
						console.log("attachmentname:"+attachmentName);
						data.itemimages.push('http://localhost:5984/farmersmarket/'+doc[item].id+'/'+attachmentName);
						data.itemids.push(doc[item].id);
						data.displaynames.push(doc[item].value.itemname);
						console.log("displaypush:"+doc[item].value.itemname);
						itemcount = itemcount+1;
					}
				}//if
			}//for
			data.itemcount = itemcount;
			console.log("itemcount"+itemcount);
			res.render('myproduces',{title: ' Farmers Market',data:data,session:req.session});
		}else{
			console.log("err");
		}
		});//dbview
};//exports
exports.staffpickitem=function(req,res){
	console.log("I am in staffpickitems");
	var videolink1 = "//www.youtube.com/embed/pRGZNR6erhQ";
	var videolink2 = "//www.youtube.com/embed/nPh1S2bN4C8";
	var name1 = req.param("itemid");
	console.log("itemid" + name1);
	var name = req.param("itemname");	
	console.log("itemname"+name);
	db.get(name, function (err, doc) {
		if (err === null) {
			for (var name in doc._attachments) {
				attachmentName = name;	
			}
			console.log(attachmentName);
			itemimage = 'http://localhost:5984/farmersmarket/'+doc.id+'/'+attachmentName;
			if ((doc.videolink1 !== "") && (doc.videolink1 !== undefined))
				videolink1 = doc.videolink1;
			if ((doc.videolink2 !== "") && (doc.videolink2 !== undefined))
				videolink2 = doc.videolink2;

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
				'videolink1':videolink1,
				'videolink2':videolink2	
			};
			res.render('staffpickitem',{title: ' Farmers Market',data:data,session:req.session});    
		}//if errot = null
	}); 
};

//show details of each item 
exports.myproducesitem=function(req,res){
	console.log("I am in myproduceitem");
	var videolink1 = "//www.youtube.com/embed/pRGZNR6erhQ";
	var videolink2 = "//www.youtube.com/embed/nPh1S2bN4C8";
	var itemid= req.param("itemid");
	var attachmentName = "";
	console.log("itemid:"+ itemid);
	db.get(itemid, function (err, doc) {
		console.log("err:"+err);
		console.log("doc:"+doc);
		if (err === null) {
			for (var thisattachmentName in doc._attachments) {
				attachmentName = thisattachmentName;
			}
			console.log("attachmentname:" + attachmentName);
			console.log("ocid"+doc.id);
			itemimage = 'http://localhost:5984/farmersmarket/'+doc.id+'/'+attachmentName;
			if ((doc.videolink1 !== "") && (doc.videolink1 !== undefined))
				videolink1 = doc.videolink1;
			if ((doc.videolink2 !== "") && (doc.videolink2 !== undefined))
				videolink2 = doc.videolink2;

			var data = {title:'Farmers Market - Our staffpicked items', 
				'adddate':doc.adddate,
				'itemtype':doc.itemtype,
				'bestby':doc.bestby, 
				'farmname':doc.farmname,
				'perpack':doc.perpack,
				'unitprice':doc.unitprice,
				'instock':doc.instock,
				'itemimage':itemimage,
				'itemid':doc.id,
				'description':doc.description,
				'farmcode':doc.farmcode,
				'itemname':doc.itemname,
				'taglist':doc.taglist,
				'videolink1':videolink1,
				'videolink2':videolink2
			};
			res.render('myproducesitem',{title: ' Farmers Market',data:data,session:req.session});
		}
	}); 
};
//show item of farmer logged in

exports.buy_item=function(req, res) {
	var itemid='';
	var itemquant='';
	console.log("buy item post method1");
	if(req.session === null) {
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
			console.log("itemname"+itemname);
			var unitprice = doc.unitprice;
			console.log("unitprice" + unitprice);
			var totalprice=itemquant * unitprice;
			console.log("totalprice"+ totalprice);
			var itemname=doc.itemname;
			console.log("itemname:"+ itemname);
			var buydata = {title:'Farmers Market - Invoice', 
				'itemid':itemid,
				'unitprice':unitprice,
				'itemquant':itemquant,
				'totalprice':totalprice,
				'itemname':itemname
			};
			res.render('invoice',{title: ' Farmers Market',buydata:buydata,session:req.session});

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
	
	if(req.session === null) {
		console.log("something went wrong!");
	}
	else {
		console.log(req.session.username);
		var q = 'Select address from customer where name="'+req.session.username+'"';
		console.log(q);
		connection.query(q, function(error, rows, fields) {
			if(!error && rows.length !==0) {
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
	if(req.body.addr !== undefined) {		
		var address = req.body.addr;
		console.log("address:"+ address);
		if(address !== '') {
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
	if(req.session ===null) {
		console.log("something went wrong!");
	}
	else {
		console.log(req.session.username);
		var q = 'Select address from customer where name="'+req.session.username+'"';
		console.log(q);
		connection.query(q, function(error, rows, fields) {
			if(!error && rows.length !==0) {
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
	if(req.session !==undefined) {
		
		var q1 = 'select name, emailaddr from customer where id ='+ req.session.cfid;
		connection.query(q1, function(error, rows, fields) {
			if(!error){
				var cust_name = rows[0].name;
				var cust_email = rows[0].emailaddr;
				var q2 = 'INSERT INTO placed_order (customer_id, customer_name, customer_email,'+
					'shipping_addr, cc_num, cc_expdate, name_cc, billing_address)' +
					'VALUES ("'+ req.session.cfid + '","' +  cust_name + '","' + cust_email + '","' + req.session.shipping_addr + '","' + 
					req.body.ccnum + '","' + req.body.expdate + '","' + req.body.name + '","' + req.body.addr + '")';
					console.log(q2);
					
				connection.query(q2, function(error, rows, fields) {
					if(!error) {
						console.log("Order placed successfully");
						res.redirect('/welcomecustomer');
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



//delete item by farer
exports.delete_item=function(req, res) {
	console.log("delete item post method");
	var action = req.body.action;
	console.log("action:"+action);
	if (action === "delete"){
		if(req.session === null) {
			console.log("please login to buy fresh food!");
		}
		else {
			console.log("sessionid:" + req.session.cfid);	
			console.log("itemid" + req.body.itemid);
			var itemid= req.body.itemid;	
			db.get(itemid, function (err, doc) {
				sys.puts(doc);
				removeId(doc._id, doc._rev);
				function removeId(id, revId)
				{
					db.remove(id, revId, function (err, res) {
						sys.puts(res);
						sys.puts(id+'Kindle removed from gadget database');
					});
				}
			});	
			console.log("going to myproduces after deletion");
			var itemcount = 0;
	
			//var idfarmer = '34';
			db.save('_design/farmer', {
				item: {
					map: function (doc) {
						if  (doc.idfarmer )emit(doc._id, doc); 
					}
				}
			});
			db.view('farmer/item', function (err, doc){
				var data = {title:'Farmers Market -My Produces'};
				data.itemimages = [];
				data.itemids = [];
				for (var item in doc) {	 
					if (doc[item].value.idfarmer == req.session.cfid) {
						console.log("docvalue"+doc[item].value.idfarmer);
						console.log("cfude"+req.session.cfid);	
						for (var attachmentName in doc[item].value._attachments) {
							console.log("attachmentname:"+attachmentName);
							data.itemimages.push('http://localhost:5984/farmersmarket/'+doc[item].id+'/'+attachmentName);
							data.itemids.push(doc[item].id);
							itemcount = itemcount+1;
						}
					}//if
				}//for
				data.itemcount = itemcount;
				console.log("itemcount"+itemcount);
				res.render('myproduces',{title: ' Farmers Market',data:data,session:req.session});
				
			});//dbview		
		}
	}else{
		console.log("i am in update");
		console.log("sessionid:" + req.session.cfid);	
		console.log("itemid" + req.body.itemid);
		itemid1= req.body.itemid;
		var videolink1 = "//www.youtube.com/embed/pRGZNR6erhQ";
		var videolink2 = "//www.youtube.com/embed/nPh1S2bN4C8";
		
		db.get(itemid1, function (err, doc) {
			sys.puts(doc);
			console.log("itemtype:"+ doc.itemtype);
			if (err === null) {
				for (var thisattachmentName in doc._attachments) {
					attachmentName = thisattachmentName;
				}
				console.log("attachmentname:" + attachmentName);
				console.log("ocid"+doc.id);
				itemimage = 'http://localhost:5984/farmersmarket/'+doc.id+'/'+attachmentName;

				if ((doc.videolink1 !== "") && (doc.videolink1 !== undefined))
					videolink1 = doc.videolink1;
				if ((doc.videolink2 !== "") && (doc.videolink2 !== undefined))
					videolink2 = doc.videolink2;
				console.log("vieolink1"+videolink1);
				console.log("vieolink2"+videolink2);
				var data = {title:'Farmers Market - Our staffpicked items', 
					'itemtype':doc.itemtype,
					'adddate':doc.adddate,
					'bestby':doc.bestby, 
					'farmname':doc.farmname,
					'perpack':doc.perpack,
					'unitprice':doc.unitprice,
					'instock':doc.instock,
					'itemimage':itemimage,
					'itemid':doc.id,
					'description':doc.description,
					'farmcode':doc.farmcode,
					'itemname':doc.itemname,
					'taglist':doc.taglist,
					'videolink1':doc.videolink1,
					'videolink2':doc.videolink2
				};
				res.render('updateitem',{title: ' Farmers Market',data:data,session:req.session});

			}
		});
	}

};
//handler for uploading items
exports.updateitem= function(req, res){
	console.log("I am in update items post handler");
	console.log("farmerid" + req.session.cfid);
	
	var adddate= req.param("adddate"); 
	
	var itemtype=req.param("itemtype");
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
	var itemimage1=req.param("itemimage1");
	console.log("itemimage1in one:"+itemimage1);
	var itemtype= req.param("itemtype"); 
	var idfarmer= req.session.cfid;
	var itemid=idfarmer +'_'+ itemname;
	console.log("itemimage1"+itemimage1);
	
	db.save(itemid,{
				itemtype: itemtype,
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
				videolink2:videolink2
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
						var readStream = fs.createReadStream(filePath);
						//console.log("filename"+filename);
						//console.log("filepath"+filepath);
						console.log("itemimage1"+itemimage1);
						console.log("my readstream");
						console.log(readStream);
						//streaming the upload
						var attachmentData = {
								name: filename,
								'Content-Type': mimetype
						};

						//var readStream = fs.createReadStream(filePath);
						var writeStream = db.saveAttachment(idData, 
															attachmentData, 
															function (err, reply) {
																if (err) {
																		console.log("error saving attachment");
																		console.log(err);
																		return;
																}
																else													
																console.dir(reply);
															});	
						console.log("initating write stream");
						readStream.pipe(writeStream);		
						console.log("everything success");
						res.send( {success: true} );
						//res.render('updateitem',data);

				}

	}); 
	res.redirect('/myproduces');
};

exports.updateitemsuccess= function(req, res){	
	res.render('updateitemsuccess',{title:'Farmers Market - Item uploaded successfully. Want to add more......'});
	res.send('Look ma, no HTML!');
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
	//var logoimage=req.param("logoimage");
	var itemtype= req.param("itemtype"); 
	var idfarmer= req.session.cfid;
	var itemid=idfarmer +'_'+ itemname;
	
	db.save(itemid,{
				
				adddate: adddate,
				bestby: bestby,
				description: description,     
				farmname: farmname,
				instock: instock,
				itemname:itemname,
				idfarmer:idfarmer,
				itemtype: itemtype,
				taglist:taglist,
				perpack:perpack,
				unitprice:unitprice,
				videolink1:videolink1,
				videolink2:videolink2
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
						var readStream = fs.createReadStream(filePath);
						console.log("my readstream");
						console.log(readStream);
						//streaming the upload
						var attachmentData = {
								name: filename,
								'Content-Type': mimetype
						};

						//var readStream = fs.createReadStream(filePath);
						var writeStream = db.saveAttachment(idData, 
															attachmentData, 
															function (err, reply) {
																if (err) {
																		console.log("error saving attachment");
																		console.log(err);
																		return;
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
	res.redirect('/myproduces');
};

exports.uploaditemsuccess= function(req, res){	
  res.render('uploaditemsuccess',{title:'Farmers Market - Item uploaded successfully. Want to add more......'});
  res.redirect('/uploaditems');
};


exports.logout=function(req,res){
	//delete the session variable
// redirect user to homepage
	res.redirect('/');	
};

