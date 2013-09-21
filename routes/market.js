
/*
 * GET home page.
 */

//handler for index page
exports.index = function(req, res){
	
res.render('index', { title: 'Virtual Farmers Market' });
		
};

//handler for displaying the produces
exports.produces=function(req,res){
  
   res.render('produces',{title:'Farmers Market - Our Produces'});
};

//handler for displaying the farmers
exports.farmers=function(req,res){
  
   res.render('farmers',{title:'Farmers Market - Our Farmers'});
};