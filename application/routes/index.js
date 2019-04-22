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
var ObjectId = require('mongodb').ObjectId;
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

	this.getInteraction = function(p1, p2, cb){
		var cond = {
			$or: [
				{
					$and: [
						{first_persion: p1},
						{second_persion: p2}
					]
				},
				{
					$and: [
						{first_persion: p2},
						{second_persion: p1}
					]
				}
			]
		};
		self.db.get('likes', cond, data => {
			cb(data.length > 0, data);
		});
	}

	app.post('/fetch_user', function(req, res){
		self.db.fetchUser(req.body, profiles => {
			res.json(profiles);
		});
	});

	app.post('/trigger_like', function(req, res){
		var $wh = {authId: req.body.persion_a};
		self.db.get('user', $wh, (user) => {
			if(user.length > 0){
				user = user[0];
				var likes = typeof user.likes == 'undefined' ? [] : user.likes;
				likes.push(req.body.persion_b);
				self.db.update('user', $wh, {likes: likes}, (err, result) => {

					var isMatched = 0;
					self.db.get('user', {authId: req.body.persion_b, likes: {$all: [req.body.persion_a]}}, (euser) => {
						if(euser.length > 0)
							isMatched = 1;
						res.json({response: "success", isMatched: isMatched, bd: req.body});
					});
					
				});
			}else
				res.json({response: "error"});
		});
	});

	app.post('/trigger_unlike', function(req, res){
		var $wh = {authId: req.body.persion_a};
		self.db.get('user', $wh, (user) => {
			if(user.length > 0){
				user = user[0];
				var unlikes = typeof user.unlikes == 'undefined' ? [] : user.unlikes;
				unlikes.push(req.body.persion_b);
				self.db.update('user', $wh, {unlikes: unlikes}, (err, result) => {

					res.json({response: "success", bd: req.body});
					
				});
			}else
				res.json({response: "error"});
		});
	});

	app.post('/get_unlikes', function(req, res){
		self.db.get('user', {authId: req.body._id}, data => {
			if(data.length > 0){
				var user = data[0];
				var IDS = [];
				var found = false;
				if(typeof user.unlikes != 'undefined'){
					if(typeof user.unlikes.length != 'undefined')
						found = user.unlikes.length > 0;
				}

				if(!found)
					res.json({response: "error", message: 'unlikes not found'});
				else{
					user.unlikes.forEach((id, k) => {
						IDS.push({authId: id});
					});
					self.db.get('user', {$or: IDS}, users => {
						res.json({response: "success", users: users});
					});
				}
			}else
				res.json({response: "error", message: 'user not found'});
		});
	});

	app.post('/updateuser', upload.single('pic'), function(req, res){

		var authId = req.body.authId;
		var UPD = req.body;
		delete UPD.authId;

		if(typeof req.file != 'undefined'){
			if(typeof req.file.path != 'undefined'){
				var avatarDir = './application/public/uploads/avatars/';
				var removeUpload = function(){
					if (fs.existsSync(req.file.path))
						fs.unlinkSync(req.file.path);
				};				
				try {
					if (!fs.existsSync(avatarDir))
					    fs.mkdirSync(avatarDir);
				} catch (err) {
					removeUpload();
					res.json({response: 'error', message: 'file error'});
					return;
				}

				var avatarExt = path.extname(req.file.path);
				/*if(avatarExt == '.pdf'){
					removeUpload();
					res.json(common.getResponses('MNS038', {}));
					return;
				}*/
				avatarFileName = authId + avatarExt;
				avatarTargetPath = avatarDir + avatarFileName;
				UPD.pic = avatarFileName;
				try {
		       		fs.renameSync(req.file.path, avatarTargetPath);
		       	} catch (err) {
		       		res.json({response: 'error', message: 'file error'});
					return;
		       	}
			}
		}

		self.db.update('user', {authId: authId}, UPD, (err, result) => {
			res.json({response: "success"});
		});

	});

	app.post('/get_who_liked_u', function(req, res){
		self.db.get('user', {likes: {$all: [req.body._id]}}, (users) => {
			res.json({response: "success", users: users});
		});
	});

	self.r = app;
}

/*self.db.delete('user',{},function(err, r){
	res.json(req.body);
});*/

module.exports = Routes;
