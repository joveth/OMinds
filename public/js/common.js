$(document).ready(function(){
	var flag = false;
	$("#searckBtn").click(function(){
		if(!flag){
			$("#headbar").append("<li id=searchinput><from id=searchForm method='get' action='/search' ><input type=text id=search_input name=searchkey class=searck_input onkeydown=doSubmit() ></form></li>");
		}else{
			$("#searchinput").remove();
		}
		flag = !flag;
	});
	$("#login_btn").click(function(){
		var email = $("#email").val();
		var passw = $("#passw").val();
		if(email==null||email.trim()==''||passw==null||passw.trim()==''){
			$("#error").text('邮箱或密码不能为空！');
			return;
		}else if(passw!=null&&(passw.length<6||passw.length>40)){
			$("#error").text('您输入的密码不符合要求，密码长度为6-40！');
			return;
		}
		$("#login_form").submit();
	});
	$("#forget_btn").click(function(){
		var email = $("#email").val();
		if(email==null||email.trim()==''){
			$("#error").text('邮箱不能为空！');
			return;
		}
		$("#forget_form").submit();
	});
	$("#regist_btn").click(function(){
		var nickname = $("#reg_nickname").val();
		var email = $("#reg_email").val();
		var passw = $("#reg_passw").val();
		var repassw = $("#reg_repassw").val();
		if(nickname==null||nickname.trim()==''){
			$("#error").text('昵称不能为空！');
			return;
		}else if(email==null||email.trim()==''){
			$("#error").text('邮箱不能为空！');
			return;
		}else if(passw==null||passw.trim()==''){
			$("#error").text('密码不能为空！');
			return;
		}else if(repassw==null||repassw.trim()==''){
			$("#error").text('请确认密码！');
			return;
		}else if(passw!=null&&(passw.length<6||passw.length>40)){
			$("#error").text('您输入的密码不符合要求，密码长度为6-40！');
			return;
		}
		$("#regist_form").submit();
	});
	$("#update_btn").click(function(){
		var nickname = $("#reg_nickname").val();
		var passw = $("#reg_passw").val();
		var repassw = $("#reg_repassw").val();
		if(nickname==null||nickname.trim()==''){
			$("#error").text('昵称不能为空！');
			return;
		}else if(passw==null||passw.trim()==''){
			$("#error").text('密码不能为空！');
			return;
		}else if(repassw==null||repassw.trim()==''){
			$("#error").text('请确认密码！');
			return;
		}else if(passw!=null&&(passw.length<6||passw.length>40)){
			$("#error").text('您输入的密码不符合要求，密码长度为6-40！');
			return;
		}
		$("#usersetting_form").submit();
	});
	
});
function doSubmit(){
	var currentKey = event.which;
	if(currentKey==13){
		if($("#search_input").val()==null||$("#search_input").val()==''){
			return false;
		}
		console.log($("#search_input").val());
		//$("#searchForm").action = '/search';
		window.location.href="/search?searchkey="+$("#search_input").val();
	}
}
