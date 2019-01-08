
function Routes(app){
	var self = this;
	self.db = require('../config').db;
	app.get('/', function(req, res) {
		self.db.get('settings', {}, function(data){
			res.render('index', {data : data});
		});
	});

	app.post('/authenticate', function (req, res) {
	    self.db.authenticate(req.body, data => {
	    	res.json(data);
	    })
	});
	self.r = app;
}

module.exports = Routes;
