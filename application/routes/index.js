
function Routes(app){
	var self = this;
	self.db = require('../config').db;
	app.get('/', function(req, res) {
		self.db.get('settings', {}, function(data){
			res.render('index', {data : data});
		});
	});

	app.post('/users', function (req, res) {
	    
	});
	app.get('/session', function(req, res) {
		res.send(JSON.stringify(req.session));
	});
	self.r = app;
}

module.exports = Routes;
