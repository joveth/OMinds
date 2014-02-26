//var mongodb = require('./db');
var mongodb = require('mongodb').Db
var ObjectID = require('mongodb').ObjectID;
var settings = require('../settings');
function Comment(comment) {
	this.content = comment.content;
	this.cdate = comment.cdate;
	this.user =comment.user;
	this.oid = comment.oid;
	this._id =comment._id;
} ;
module.exports = Comment;
// 增
Comment.prototype.save = function(callback) {
	var date = new Date();
	var time = {
		second : date.getFullYear()+ "-"+ (date.getMonth() + 1)+ "-"+ date.getDate()+ " "+ date.getHours()+ ":"+ (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())+ ":"+ (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds())
	};
	var comment = {
		content : this.content,
		cdate : time,
		oid : this.oid,
		user :this.user
	};
	mongodb.connect(settings.url,function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('comments', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			collection.insert(comment, {
				safe : true
			}, function(err, comment) {
				db.close();
				if (err) {
					return callback(err);
				}
				callback(null, comment[0]);
			});
		});
	});
};

// 查(通过mind的id查找comments)
Comment.get = function(oid,callback) {
	mongodb.connect(settings.url,function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('comments', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			collection.find({oid : oid.toString()}).toArray(function(err, comments) {
				db.close();
				if (err) {
					return callback(err);
				}
				callback(null, comments);
			});
		});
	});
};
