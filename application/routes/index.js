var multer  = require('multer');
var path = require('path');
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
	    cb(null, './application/public/uploads/tmp/')
	},
	filename: function (req, file, cb) {
	    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
	}
});
var upload = multer({ storage: storage });
const fs = require('fs');
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
	    });
	});
	app.post('/newprofile', upload.single('pic'), function (req, res) {
		var exetension = path.extname(req.file.path);
		var newFileName = req.body.authId + exetension;
		var targetPath = './application/public/uploads/avatars/' + newFileName;
		fs.rename(req.file.path, targetPath, function(err) {
        	if (err) throw err;
        	req.body.pic = newFileName;
        	/*self.db.insert('user', req.body, (err, result) => {
		    	res.json(result);
		    });*/
		    self.db.delete('user',{},function(err, r){
				res.json(req.body);
			});
        });
	});
	self.r = app;
}

module.exports = Routes;
