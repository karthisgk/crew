var multer  = require('multer');
var path = require('path');
const fs = require('fs');
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		var dir = './application/public/uploads/tmp/';
		if (!fs.existsSync(dir)){
		    fs.mkdirSync(dir);
		}
	    cb(null, dir);
	},
	filename: function (req, file, cb) {
	    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
	}
});
var upload = multer({ storage: storage });
function Routes(app){
	var self = this;
	self.db = require('../config').db;
	app.get('/', function(req, res) {
		self.db.get('settings', {}, function(data){	
			res.render('index', {data : data, baseurl: '52.66.77.98'});
		});
	});

	app.post('/authenticate', function (req, res) {
	    self.db.authenticate(req.body, data => {
	    	res.json(data);
	    });
	});
	app.post('/newprofile', upload.single('pic'), function (req, res) {
		var exetension = path.extname(req.file.path);
		var newFileName = req.body.authId + exetension;
		var targetPath = './application/public/uploads/avatars/' + newFileName;
		fs.rename(req.file.path, targetPath, function(err) {
        	if (err) throw err;
        	req.body.pic = newFileName;
        	req.body.Age = parseInt(req.body.Age);
        	req.body.location = typeof req.body.location == 'string' ? JSON.parse(req.body.location) : req.body.location;
        	req.body.criteria = typeof req.body.criteria == 'string' ? JSON.parse(req.body.criteria) : req.body.criteria;
        	self.db.insert('user', req.body, (err, result) => {
		    	res.json({response: "success", approvedSession: req.body});
		    });
        });
	});

	app.post('/fetch_user', function(req, res){
		self.db.fetchUser(req.body, profiles => {
			res.json(profiles);
		});
	});

	app.post('/trigger_like', function(req, res){
		var cond = {
			first_persion: req.body.persion_b,
			second_persion: req.body.persion_a
		};
		self.db.get('likes', cond, data => {
			var insertData = {};		
			if(data.length > 0){
				self.db.update('likes', cond, {spLiked: 1}, (err, result) => {
					res.json({response: "success", isMatched: data[0].fpLiked, bd: req.body});
				});
			}else{
				var IND = {
					first_persion: req.body.persion_a,
					second_persion: req.body.persion_b,
					fpLiked: 1,
					spLiked: null
				};
				self.db.insert('likes', IND, (err, result) => {
					res.json({response: "success", isMatched: 0, bd: req.body});
				});
			}
		});
	});

	app.post('/trigger_unlike', function(req, res){
		var cond = {
			first_persion: req.body.persion_b,
			second_persion: req.body.persion_a
		};
		self.db.get('likes', cond, data => {
			var insertData = {};		
			if(data.length > 0){
				self.db.update('likes', cond, {spLiked: 0}, (err, result) => {
					res.json({response: "success"});
				});
			}else{
				var IND = {
					first_persion: req.body.persion_a,
					second_persion: req.body.persion_b,
					fpLiked: 0,
					spLiked: null
				};
				self.db.insert('likes', IND, (err, result) => {
					res.json({response: "success"});
				});
			}
		});
	});

	app.post('/get_unlikes', function(req, res){
		var cond = {
			$or: [
				{$and : [
					{first_persion: req.body._id},
					{fpLiked: 0}
				]},
				{$and : [
					{second_persion: req.body._id},
					{spLiked: 0}
				]}
			]
		};
		self.db,get('likes', cond, data => {
			req.json(data);
		});
	});

	app.post('/get_who_liked_u', function(req, res){
		var cond = {
			$and: [
				{second_persion: req.body._id},
				{fpLiked: 1},
				{spLiked: null}
			]
		};
		self.db,get('likes', cond, data => {
			req.json(data);
		});
	});

	self.r = app;
}

/*self.db.delete('user',{},function(err, r){
	res.json(req.body);
});*/

module.exports = Routes;
