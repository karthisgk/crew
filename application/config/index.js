
var DB = require('./db');

var main = {
	development: {
		name: 'Node App',
		port: process.env.PORT || 3500
	},
	production: {
		name: 'Node App',
		port: process.env.PORT || 3500
	},
	db: new DB(),
	session_time: 999999999999,
	initApp: function(dir){
		main.app_dir = dir;
		return main;
	}
};

module.exports = main;
