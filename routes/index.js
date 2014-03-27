var crypto = require('crypto');
var Mind = require('../models/mind.js');
var User = require('../models/user.js');
var Comment = require('../models/comment.js');
var nodemailer = require("nodemailer");
//trim方法
function trimStr(str){
	if(str){
		return str.replace(/(^\s*)|(\s*$)/g,"");
	}
}
//生成随机串
function randomString(size) {
	size = size || 6;
	var code_string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var max_num = code_string.length + 1;
	var new_pass = '';
	while (size > 0) {
		new_pass += code_string.charAt(Math.floor(Math.random() * max_num));
		size--;
	}
	return new_pass;
};
module.exports = function(app) {
  app.get('/', function (req, res) {
	  Mind.getAll(function(err, minds) {
		  if(err){
			  minds = [];
		  }
		  res.render('index', {
				title : 'OMinds - 最新',
				user : req.session.user,
				minds : minds });
	  });
  });
  app.get('/login', function (req, res) {
	  var use = req.session.user;
	  if(use){
		  return res.redirect('/');
	  }
	  res.render('ologin', {
		title : 'OMinds - 登录' ,
		user : req.session.user,
		error : req.flash('error').toString()});
  });
  app.get('/regist', function (req, res) {
	  res.render('oregist', {
		title : 'OMinds - 注册',
		user : req.session.user,
		error : req.flash('error').toString()});
  });
  app.get('/logout', function (req, res) {
	  delete req.session.user;
	 return res.redirect('/');
  });
  app.get('/upminds', function (req, res) {
	    res.render('upminds', { title: 'OMinds - 投稿' ,
	    	user : req.session.user,
	    	error : req.flash('error').toString(),
	    	ocontent:req.flash('ocontent').toString()
	    });
  });
  app.post('/doregist',function (req, res){
	  	var email = req.body.reg_email;
		var nickname = req.body.reg_nickname;
	  	var md5 = crypto.createHash('md5'), password = md5.update(req.body.reg_passw).digest('hex');
		var mde = crypto.createHash('md5'), email_MD5 = mde.update(email.toLowerCase()).digest('hex');
		var newUser = new User({
			email : email,
			nickname : nickname,
			password : password,
			photo : "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48"
		});
		User.get(newUser.email, function(err, user) {
			if (user) {
			req.flash('error', '该邮箱已注册，请登录或找回密码。');
			req.flash('email', email);
			req.flash('nickname', nickname);
			req.flash('password', password);
			req.flash('repassword', repassword);
			return res.redirect('/regist');
		}
		// 如果不存在则新增用户
		newUser.save(function(err, user) {
			if (err) {
				req.flash('error', err);
				req.flash('email', email);
				req.flash('nickname', nickname);
				req.flash('password', password);
				req.flash('repassword', repassword);
				return res.redirect('/regist');
			}
			req.session.user = user;
			res.redirect('/');
			});
		});
  });
  app.post('/dologin', function(req, res) {
		var email = req.body.email;
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.passw).digest('hex');
		User.get(email, function(err, user) {
			req.flash('email', email);
			if (!user) {
				req.flash('error', '邮箱或密码错误!');
				return res.redirect('/login');// 用户不存在则跳转到登录页
			}
			// 检查密码是否一致
			if (user.password != password) {
				req.flash('error', '邮箱或密码错误!');
				return res.redirect('/login');// 密码错误则跳转到登录页
			}
			// 用户名密码都匹配后，将用户信息存入 session
			req.session.user = user;
			res.redirect('/');// 登陆成功后跳转到主页
		});
	});
  app.post('/putup',function (req, res) {
	  	var user = req.session.user;
	  	var cont = trimStr(req.body.mind_text);
		if(cont==null||cont.length<40||cont.length>700){
			req.flash('error', "您的投稿不符合条件，请修改后提交。");
			req.flash('ocontent', cont);
			return res.redirect('/upminds');
		}
		var mind;
		var flag = true;
		//no login
		if (!user) {
			mind = new Mind({
				content : cont,
				user : null,
				flag : flag
			});
			mind.save(function(err, mind) {
				if (err) {
					req.flash('error', err);
					return res.redirect('/upminds');
				}
				res.redirect('/');
			});
		} 
		// login
		else {
			User.getById(user._id, function(err, temp) {
				if (!temp) {
					//如果用户不存在，那user就是null
					mind = new Mind({
						content : cont,
						user : null,
						flag : flag
					});
				}
					mind = new Mind({
						content : cont,
						user : temp,
						flag : flag
					});
				mind.save(function(err, mind) {
					if (err) {
						req.flash('error', err);
						return res.redirect('/upminds');
					}
					//不知到为何，测试的时候session中的user时常clear，所以我基本上在每个方法中加入下面这个段
					req.session.user = user;
					res.redirect('/');
				});
			});
		}
  	});
  
  app.post('/addups', function(req, res) {
		var oid=req.body.oid;
		Mind.getById(oid, function(err, mind) {
			if (!mind) {
				req.flash('error', err);
				return res.redirect('/');
			}
			var temp = mind.ups + 1;
			Mind.update(oid, temp, mind.downs, mind.comments,function(err) {
				if (err) {
					req.flash('error', err);
					return res.redirect('/');
				}
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end(temp.toString());
				//res.json({success:1});
				return;
			});
		});
	});
	app.post('/addowns', function(req, res) {
		var eid = req.body.oid;
		Mind.getById(eid, function(err, mind) {
			if (!mind) {
				req.flash('error', err);
				return res.redirect('/');
			}
			var temp = mind.downs + 1;
			Mind.update(eid, mind.ups, temp, mind.comments, function(err) {
				if (err) {
					req.flash('error', err);
					return res.redirect('/');
				}
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end(temp.toString());
				return;
			});
		});
	});
	
	app.get('/comment', function (req, res) {
		var oid=req.query.oid;
		if(!oid){
			return res.redirect('/');
		}
		
		Mind.getById(oid, function(err, mind) {
			if (err||!mind) {
				req.flash('error', err);
				return res.redirect('/');
			}
			Comment.get(mind._id,function(err,comments){
				if (err) {
					req.flash('error', err);
					return res.redirect('/');
				}
				res.render('comments', {
					title : 'OMinds - 评论',
					user : req.session.user,
					mind : mind,
					comments: comments,
					error : req.flash('error').toString()
				});
			});
			
		});
	  });
	app.post('/docomment', function(req, res) {
		var user = req.session.user;
		var cont = trimStr(req.body.comm_text);
		var oid = req.body.oid;
		if(!oid){
			return res.redirect('/');
		}
		Mind.getById(oid, function(err, mind) {
			if (err||!mind) {
				req.flash('error', err);
				return res.redirect('/');
			}
			if(cont==null||cont.length<1||cont.length>159){
				req.flash('error', '您的回复内容过多或太少，请修正后提交。');
				return res.redirect('back');
			}
			var comment;
			if (!user) {
				comment = new Comment({
					content : cont,
					user : null,
					oid : oid
				});
				comment.save(function(err, comment) {
					if (err) {
						req.flash('error', err);
						return res.redirect('back');
					}
					var coms = mind.comments+1;
					Mind.update(oid,mind.ups,mind.downs,coms, function(err) {
						if (err) {
							req.flash('error', err);
							return res.redirect('back');
						}
						return res.redirect('back');
					});
				});
			} else {
				User.getById(user._id, function(err, temp) {
					if (!temp) {
						comment = new Comment({
							content : cont,
							user : null,
							oid : oid
						});
					}else{
						comment = new Comment({
							content : cont,
							user : temp,
							oid : oid
						});
					}
					comment.save(function(err, comment) {
						if (err) {
							req.flash('error', err);
							return res.redirect('back');
						}
						var coms = mind.comments+1;
						Mind.update(oid,mind.ups,mind.downs,coms, function(err) {
							if (err) {
								req.flash('error', err);
								return res.redirect('back');
							}
							req.session.user = user;
							return res.redirect('back');
						});
					});
				});
			}
		});
	});
	app.get('/about', function (req, res) {
		res.render('about', {
			title : 'OMinds - 关于',
			user : req.session.user });
	});
	app.get('/search', function (req, res) {
		var key = req.query.searchkey;
		if (!key) {
			return res.redirect('/');
		}
		var pattern = new RegExp("^.*" + key + ".*$");
		User.searchByKey(pattern, function(err, users) {
			if (err) {
				users = [];
			}
			Mind.searchByKey(users, pattern, function(err, minds) {
				if (err) {
					req.flash('error', err);
					return res.redirect('/');
				}
				res.render('index', {
					title : 'OMinds - 搜索',
					minds : minds,
					user : req.session.user
				});
			});
		});
	});
	app.get('/essence', function (req, res) {
		Mind.getEssence(function(err, minds) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('index', {
				title : 'OMinds - 精华',
				minds : minds,
				user : req.session.user
			});
		});
	});
	app.get('/ucenter', function (req, res) {
		var user = req.session.user;
		if (!user) {
			return res.redirect('/');
		}
		User.getById(user._id, function(err, temp) {
			if (!temp) {
				return res.redirect('/');
			}
			Mind.getUserMinds(temp,function(err, minds) {
				if (err) {
					minds = [];
				}
				res.render('uindex', {
					title : 'OMinds - 我的投稿',
					user : req.session.user,
					minds : minds
				});
			});
		});
	});
	app.get('/forget', function (req, res) {
		var use = req.session.user;
		if(use){
			return res.redirect('/');
		}
		res.render('oforget', {
		title : 'OMinds - 找回密码' ,
		user : req.session.user,
		error : req.flash('error').toString()});
	});
	app.post('/sendmail', function(req, res) {
		var email = req.body.email;
		if (!email) {
			req.flash('error', '请填写邮箱。');
			return res.redirect('/forget');
		}
		User.get(email, function(err, user) {
			req.flash('email', email);
			if (!user) {
				req.flash('error', '不存在的邮箱!');
				return res.redirect('/forget');
			}
			var transport = nodemailer.createTransport("SMTP", {
				host : "smtp.163.com",
				secureConnection : true, // use SSL
				port : 465, // port for secure SMTP
				auth : {
					user : "ominds@163.com",
					pass : "ominds5236652388"
				}
			});
			var newusession = randomString(12);
			user.password = "";
			transport.sendMail({
				from : "ominds@163.com",
				to : email,
				subject : "OMinds用户密码找回",
				generateTextFromHTML : true,
				html : "用户:" + user.nickname
						+ "，请点击（复制）此链接进行密码更新:<a href=http://"
						+ req.headers.host + "/usersetting?usession="
						+ newusession + "  >" + req.headers.host
						+ "/usersetting?usession=" + newusession
						+ "</a><br>请勿回复。"
			}, function(error, response) {
				if (error) {
					return res.redirect('/');
				} else {
					console.log("Message sent: " + response.message);
				}
				transport.close();
			});
			delete req.session.newusession;
			delete req.session.user;
			req.session.newusession = newusession;
			req.session.user = user;
			res.render('forgetsend', {
				title : 'OMinds-邮件发送完成',
				email : email,
				user : null
			});
		});
	});
	app.get('/usersetting', function(req, res) {
		if (!req.session.user) {
			return res.redirect('/');
		}
		var usession = req.session.newusession;
		if (usession) {
			delete req.session.newusession;
			if (usession != req.query.usession) {
				return res.redirect('/');
			}
		}
		res.render('ousersetting', {
			title : 'OMinds - 用户设置',
			error : req.flash('error').toString(),
			user : req.session.user
		});
	});
	app.post('/updateinfor', function(req, res) {
		if (!req.session.user) {
			return res.redirect('/');
		}
		var usession = req.session.newusession;
		if (usession) {
			delete req.session.newusession;
			if (usession != req.query.usession) {
				return res.redirect('/');
			}
		}
		var email = req.body.reg_email;
		var nickname = req.body.reg_nickname;
		var password = req.body.reg_passw;
		var repassword = req.body.reg_repassw;
		if (nickname == null) {
			req.flash('error', '请输入昵称。');
			return res.redirect('/usersetting');
		} else if (nickname.length < 3 || nickname.length > 40) {
			req.flash('error', '昵称长度在3-40位。');
			return res.redirect('/usersetting');
		}
		if (password == null || repassword == null) {
			req.flash('error', '请输入密码。');
			return res.redirect('/usersetting');
		}
		if (password.length < 6 || password.length > 25) {
			req.flash('error', '密码长度在6-25位。');
			return res.redirect('/usersetting');
		}
		// 检查密码是否一致
		if (password != repassword) {
			req.flash('error', '两次密码不一致，请确认。');
			return res.redirect('/usersetting');
		}
		var md5 = crypto.createHash('md5'), 
		password = md5.update(req.body.reg_passw).digest('hex');
		var updateUser = new User({
			email : email,
			nickname : nickname,
			password : password,
			photo:req.session.user.photo
		});
		User.update(updateUser, function(err) {
			if (err) {
				return res.redirect('/');
			}
			delete req.session.user;
			req.session.user = updateUser;
			error = "更新成功！";
			res.render('ousersetting', {
				title : 'OMinds - 用户设置',
				error : req.flash('error').toString(),
				user : updateUser
			});
		});
	});
	app.get('/theuserminds', function(req, res) {
		if (!req.query.uid) {
			return res.redirect('/');
		}
		var puser = null;
		User.getById(req.query.uid, function(err, temp) {
			if (err) {
				return res.redirect('/');
			}
			Mind.getUserMinds(temp,  function(err, minds) {
				if (err) {
					minds = [];
				}
				res.render('index', {
					title : 'OMinds - TA的投稿',
					user : req.session.user,
					minds : minds
				});
			});
		});
	});
};