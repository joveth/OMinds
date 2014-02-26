//var mongodb = require('./db');
var mongodb = require('mongodb').Db
var ObjectID = require('mongodb').ObjectID;
var settings = require('../db-set');

function User(user) {
	this.email = user.email;
	this.password = user.password;
	this.nickname = user.nickname;
	this.photo = user.photo;
	this.cdate = user.cdate;
	this._id = user._id;
};
module.exports = User;
// C(增)
User.prototype.save = function(callback) {
	var date = new Date();
	var time = date.getFullYear()+ "-"+ (date.getMonth() + 1)+ "-"+ date.getDate()+ " "+ date.getHours()+ ":"+ (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())+ ":"+ (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
	var user = {
		email : this.email,
		password : this.password,
		nickname : this.nickname,
		photo : this.photo,
		cdate : time
	};
	mongodb.connect(settings.url,function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('users', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			collection.insert(user, {
				safe : true
			}, function(err, user) {
				db.close();
				if (err) {
					return callback(err);
				}
				callback(null, user[0]);
			});
		});
	});
};

// R（查）
User.get = function(email, callback) {
	mongodb.connect(settings.url,function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('users', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			collection.findOne({
				email : email
			}, function(err, user) {
				db.close();
				if (err) {
					return callback(err);
				}
				callback(null, user);
			});
		});
	});
};
// R（查，通过ID）
User.getById = function(id, callback) {
	mongodb.connect(settings.url,function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('users', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			collection.findOne({
				_id : new ObjectID(id)
			}, function(err, user) {
				db.close();
				if (err) {
					return callback(err);
				}
				callback(null, user);
			});
		});
	});
};
// U (改)
User.update = function(user, callback) {
	mongodb.connect(settings.url,function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('users', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			collection.update({
				"email" : user.email}, {
				$set : {
					nickname : user.nickname,
					password : user.password,
					photo : user.photo
				}
			}, function(err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
};