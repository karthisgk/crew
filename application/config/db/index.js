
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const url = 'mongodb://localhost:27017';
const dbName = 'smix';

function DB(){
	this.connect = function(cb){
		MongoClient.connect(url, function(err, client) {
		  	assert.equal(null, err);
		  	const db = client.db(dbName);		  	
		  	cb(db);
		  	client.close();
		});
	};
}

DB.prototype.insert = function(tbName, data, cb) {
	this.connect(function(db){
		if(typeof data.length === "undefined"){
			db.collection(tbName).insertOne(data, function(err, r){
				if(err){
					assert.equal(null, err);
	      			assert.equal(2, r.insertedCount);
	      		}
      			cb(err, r);
			});
		}else{
			if(data.length <= 0){
				cb('Empty data', {});
				return;
			}
			db.collection(tbName).insertMany(data, function(err, r){
				if(err){
					assert.equal(null, err);
	      			assert.equal(2, r.insertedCount);
	      		}
      			cb(err, r);
			});
		}
	});
};

DB.prototype.update = function(tbName, wh, data, cb){
	this.connect(function(db){
		if(typeof data.length === "undefined"){
			db.collection(tbName).updateOne(wh, {$set: data}, function(err, r){
				if(err){
					assert.equal(null, err);
	      			assert.equal(1, r.matchedCount);
	      			assert.equal(1, r.modifiedCount);
	      		}
      			cb(err, r);
			});
		}else{
			if(data.length <= 0){
				cb('Empty data', {});
				return;
			}
			db.collection(tbName).updateMany(wh, {$set: data}, function(err, r){
				if(err){
					assert.equal(null, err);
	      			assert.equal(1, r.matchedCount);
	      			assert.equal(1, r.modifiedCount);
	      		}
      			cb(err, r);
			});
		}
	});
};

DB.prototype.get =  function(tbName, wh, cb){
	this.connect(function(db){
		if(typeof wh.length === "undefined"){
			db.collection(tbName).find(wh).toArray((err, data) => {
				cb(data);
		  	});
		}
	});
};

DB.prototype.delete = function(tbName, wh, cb) {
	this.connect(function(db){
		if(typeof wh.length === "undefined"){
			db.collection(tbName).remove(wh, cb);
		}
	});
};

DB.prototype.authenticate = function(prof, cb) {
	var cond = {
		$or: [
			{email: prof.hasOwnProperty('email') ? prof.email : 'undefined'},
			{$and: [
				{authId: prof.authId},
				{email: 'undefined'},
				{provider: 'fb'}
			]}
		]
	};
	this.get('user', cond, (data) => {
		var rt = prof;
		rt.isNewUser = true;
		if(data.length > 0){
			rt = data[0];
			rt.isNewUser = false;			
		}
		cb(rt);
	});
};

DB.prototype.fetchUser = function(req, cb) {
	var km = req.dist;
	if(req.distType == 'mi')
		km = km * 1.60934; /* km * mi*/
	var distance = km * 0.1 / 11;
	var LatN = req.lat + distance;
  	var LatS = req.lat - distance;
  	var LonE = req.lng + distance;
  	var LonW = req.lng - distance;	

	var self = this;

	this.get('user', {authId: req.authId}, (sesUser) => {

		var interacted = [];
		if(sesUser.length > 0){
			var suser = sesUser[0];
			if(typeof suser.likes == 'object')
				interacted = interacted.concat(suser.likes);

			if(typeof suser.unlikes == 'object')
				interacted = interacted.concat(suser.unlikes);

			var cond = {
				$and: [
					{'location.lat': { $lte: LatN}},
					{'location.lat': { $gte: LatS}},
					{'location.lng': { $lte: LonE}},
					{'location.lng': { $gte: LonW}},
					{'authId': { $nin: interacted}},
					{'gender': req.gender},					
					{$and: [ 
							{'Age': {$gte: req.Age[0]}},
							{'Age': {$lte: req.Age[1]}}
						]
					}
				]
			};

			self.connect(function(newdb){
				newdb.collection('user').find(cond)
				.limit(10).skip(typeof req.offset == 'undefined' ? 0 : req.offset)
				.toArray((err, data) => {
					cb(data);
			  	});
			});
		}
	});
};

module.exports = DB;
