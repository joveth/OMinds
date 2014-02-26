var crypto = require('crypto');
var Mind = require('../models/mind.js');
var User = require('../models/user.js');
var Comment = require('../models/comment.js');
//trim方法
function trimStr(str){
	if(str){
		return str.replace(/(^\s*)|(\s*$)/g,"");
	}
}

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
			console.log(user);
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
				
				console.log(mind);
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
				console.log(temp);
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
	
};