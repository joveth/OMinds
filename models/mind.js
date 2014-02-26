//var mongodb = require('./db');
var mongodb = require('mongodb').Db
var ObjectID = require('mongodb').ObjectID;
var settings = require('../db-set');

function Mind(mind) {
	this.content = mind.content;
	this.ups = mind.ups;
	this.downs = mind.downs;
	this.cdate = mind.cdate;
	this.user =mind.user;
	this.comments = mind.comments;
	this.flag = mind.flag;
	this._id =mind._id;
}; 
module.exports = Mind;
//save 方法（增）
Mind.prototype.save = function(callback) {
	var date = new Date();
	var time = date.getFullYear()+ "-"+ (date.getMonth() + 1)+ "-"+ date.getDate()+ " "+ date.getHours()+ ":"+ (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())+ ":"+ (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
	var mind = {
		content : this.content,
		ups : 0,
		downs : 0,
		cdate : time,
		user :this.user,
		comments : 0,
		flag : this.flag
	};
	// 打开数据库
	mongodb.connect(settings.url,function(err, db) {
		if (err) {
			return callback(err);// 错误，返回 err 信息
		}
		// 读取 minds 集合
		db.collection('minds', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			// insert
			collection.insert(mind, {
				safe : true
			}, function(err, mind) {
				db.close();
				if (err) {
					return callback(err);
				}
				callback(null, mind[0]);// 成功！err 为 null，并返回存储后的用户文档
			});
		});
	});
};
// 查詢 （查）
Mind.getAll = function(callback) {
	mongodb.connect(settings.url,function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('minds', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			// 查詢 所有的minds，以cdate降序排序，最后转换为数组。
			collection.find().sort({cdate: -1}).toArray(function(err, minds) {
				db.close();
				if (err) {
					return callback(err);
				}
				callback(null, minds);
			});
		});
	});
};

//update 更改（改）
Mind.update = function(id,ups,downs,comments,callback) {
	mongodb.connect(settings.url,function(err, db) {
		if (err) {
			return callback(err);//错误，返回 err 信息
		}
		db.collection('minds', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			collection.update({
				_id :new  ObjectID(id)
			}, {
				$set: {ups: ups,downs:downs,comments:comments}
			},function(err, mind) {
				db.close();
				if (err) {
					return callback(err);
				}
				callback(null, mind);
			});
		});
	});
};
//delete 删除（删）
Mind.removeById = function(id,callback) {
	mongodb.connect(settings.url,function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('minds', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			collection.remove({
				_id :new  ObjectID(id)
			},function(err) {
				db.close();
				if (err) {
					return callback(err);// 失败！返回 err 信息
				}
				callback(null);
			});
		});
	});
};

//通过id查找
Mind.getById = function(id, callback) {
	mongodb.connect(settings.url,function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('minds', function(err, collection) {
			if (err) {
				db.close();
				return callback(err);
			}
			collection.findOne({
				_id : new  ObjectID(id)
			}, function(err, mind) {
				db.close();
				if (err) {
					return callback(err);
				}
				callback(null, mind);
			});
		});
	});
};
