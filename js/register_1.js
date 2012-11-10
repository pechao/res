xq.config.set('password', {
	'maxlength': 16,
	'minlength': 4
});
xq.config.set('nick', {
	'maxlength': 14,
	'minlength': 4
});
var errorMsg = {
	'email': {
		'normal': '请填写邮箱',
		'isEmpty': '邮箱不能为空',
		'notValid': '邮箱格式有误',
		'hadRegistered': '此邮箱已存在'
	},
	'password': {
		'normal': '请填写密码',
		'isEmpty': '密码不能为空',
		'tooShort': '密码长度至少需' + xq.config.get('password').minlength + '位',
		'tooLong': '密码长度不能超过' + xq.config.get('password').maxlength + '位'
	},
	'nick': {
		'normal': '请填写名字',
		'tooShort': '名字长度至少需' + xq.config.get('nick').minlength / 2 + '个汉字，或' + xq.config.get('nick').minlength + '个英文字母',
		'tooLong': '名字长度不能超过' + xq.config.get('nick').maxlength / 2 + '个汉字，或' + xq.config.get('nick').maxlength + '个英文字母',
		'isEmpty': '名字不能为空'
	},
	'sex': {
		'normal': '',
		'isEmpty': '请选择性别'
	},
	'city_id': {
		'normal': '',
		'isEmpty': '请选择你的常居城市'
	},
	'agreement': '必须同意使用协议才能继续~'
};

var emailIsAvailiable;
//验证已经被注册过的邮箱
var exitEmail = [];

//var 
$.subscribe('registerStep1.check-button-avaliable', function () {
	if (valide(false)) {
		$('.next-btn').addClass('next-btn2').children().addClass('ok2');
	} else {
		$('.next-btn').removeClass('next-btn2').children().removeClass('ok2');
	}
});

$(function () {
	//0. 屏蔽城市选择的 a 标签的默认事件：链接跳转
	$('#city-sel').on('click', 'a', function (e) {
		e.preventDefault();
	});

	//1. 性别的点击切换
	$('.form-data li .sex').on('click', function (e) {
		$(this).find('span').addClass('active').end().siblings().find('span').removeClass('active');
		$(this).siblings('input').val($(this).find('span').attr('value'));
	});
	//1. IE6 性别切换
	$('.form-data li i').on('click', function (e) {
		$(this).css({ 'filter': 'alpha(opacity=0)' });
		$(this).parent().siblings().find('i').css({ 'filter': 'alpha(opacity=50)' });
		$(this).parent().siblings('input').val($(this).siblings('span').attr('value'));
	});

	//2. 城市的选择 弹出框 === 监听都在 common.js 里面
	$('.form-data .city-select').on('click', function (e) {
		$.publish('on-city-sel-click', { 'city_id': $.trim($(this).find('input').val()) });
	});


	//4. 提交事件
	$('#register-form').on('submit', function (e) {
		if (!valide()) {
			e.preventDefault();
		}
	});
	
	//5. 点击“下一步”
	//$('form').validate();
	$('#reg-step1').click(function (e) {
		$('#register-form').submit();
	});
	//6. 验证邮件
	$('.form-data .email input').focusin(function () {
		showError(this, 'normal');
	});
	$('.form-data .email input').focusout(function () {
		if (validEmail()) {
			isRegistered();
		}
		$.publish('registerStep1.check-button-avaliable');
	});
	//7. 验证密码
	$('.form-data .password_re input').focusin(function () {
		showError(this, 'normal');
	});
	$('.form-data .password_re input').focusout(function () {
		validPwd();
		$.publish('registerStep1.check-button-avaliable');
	});
	//8. 验证昵称
	$('.form-data .nick input').focusin(function () {
		showError(this, 'normal');
	});
	$('.form-data .nick input').focusout(function () {
		validNick();
		$.publish('registerStep1.check-button-avaliable');
	});
	//9. 性别
	$('.form-data li.sex').on('click', '.sex', function (e) {
		showError($(this).siblings('input'), 'normal');
		$.publish('registerStep1.check-button-avaliable');
	});
	//10. 使用协议
	$('#agreement').on('change', function () {
		$.publish('registerStep1.check-button-avaliable');
	});

	//validEmail();
});

//邮件尚未注册，可用
$.subscribe('email.remote-available', function (input) {
	inputIsWrong(false, input);
	$(input).parents('li').find('.tips').hide();
	emailIsAvailiable = true;
});
//邮件已注册，不可用
$.subscribe('email.remote-unavailable', function (input) {
	inputIsWrong(true, input);
	showError(input, 'hadRegistered');
	emailIsAvailiable = false;
	var a = $(input).val();
	exitEmail.push($(input).val());

	showError($('.form-data li.email input'), 'hadRegistered');
});



function isRegistered() {
	var email = $.trim($('.form-data .email input').val());
	xq.getJSON(xq.config.get('checkEmailServer'), {
		'email': email
	}, function (json) {
		var input = $('.form-data .email input');
		xq.log(json.available);
		if (json.available) {
			$.publish('email.remote-available', input);
		} else {
			$.publish('email.remote-unavailable', input);
		}
	});
}

//showerr && --------- 这个JB 东西，没有办法，因为之前写的时候，只有检查，并提示正确与否。
//---------------------但是，后来又有一个需求，就是“下一步”按钮是否可点击的状态显示，但是不用提示“错误与否”

function valide(showerr) {
	var now_email = $('.form-data .email input').val();
	var can_email = emailIsAvailiable !== false || $.inArray(now_email, exitEmail) == -1;
	xq.log(now_email, exitEmail, $.inArray(now_email, exitEmail) == -1);
	try{
		showerr = showerr === false ? false : true;
		
		var email = validEmail(showerr),
		passwd = validPwd(showerr),
		nick = validNick(showerr),
		sex = validSex(showerr),
		city = validCity(showerr),
		agree = validAgreement(showerr);
		//明确指定 emailIsAvailiable 为 false，undefined 也是可行的（说明网络有延迟，但不应该阻碍用户的填写表单）
		return email && passwd && nick && sex && city && agree && can_email;
	} catch (e) {
		xq.log('你若不是在注册第一步，则不用在意这个错误');
	}
}
xq.fn.add('go-valid-email', function (email) {
	return validEmail(email);
});
function validEmail(showerr, email) {
	//没有传第一个参数，或者两个参数都没传
	if (!_.isBoolean(arguments[0])) {
		email = showerr;
		showerr = undefined;
	}
	showerr = showerr === false ? false : true;
	var input = $('.form-data .email input');
	email = email || input.val();
	
	if ($.trim(email) == '') {
		showerr && showError && showError(input, 'isEmpty');
		showerr && inputIsWrong(true, input);
		$.publish('email-is-empty');
		return false;
	} else if (!isValidMail(email)) {
		showerr && showError(input, 'notValid');
		showerr && inputIsWrong(true, input);
		$.publish('email-is-not-valided');
		return false;
	} else {
		if (emailIsAvailiable !== false) {
			showerr && inputIsWrong(false, input);
			showerr && $(input).parents('li').find('.tips').hide();
		}
		$.publish('email-is-valided');
		return true;
	}
}
function validPwd(showerr) {
	showerr = showerr === false ? false : true;
	var input = $('.form-data .password_re input'), pwd = input.val();
	if (pwd.length < xq.config.get('password').minlength) {
		showerr && showError(input, 'tooShort');
		showerr && inputIsWrong(true, input);
		return false;
	} else if (pwd.length > xq.config.get('password').maxlength) {
		showerr && showError(input, 'tooLong');
		showerr && inputIsWrong(true, input);
		return false;
	} else {
		showerr && inputIsWrong(false, input);
		showerr && $(input).parents('li').find('.tips').hide();
		return true;
	}
}
function validNick(showerr) {
	showerr = showerr === false ? false : true;
	var input = $('.form-data .nick input'), nick = $.trim(input.val());
	var length = getLength(nick);
	if (length < xq.config.get('nick').minlength) {
		showerr && showError(input, 'tooShort');
		showerr && inputIsWrong(true, input);
		return false;
	} else if (length > xq.config.get('nick').maxlength) {
		showerr && showError(input, 'tooLong');
		showerr && inputIsWrong(true, input);
		return false;
	}else {
		showerr && inputIsWrong(false, input);
		showerr && $(input).parents('li').find('.tips').hide();
		return true;
	}
}
function validSex(showerr) {
	showerr = showerr === false ? false : true;
	var input = $('.form-data .sex input'), sex = input.val();
	//未知
	if (sex === '1' || sex === '0') {
		return true;
	} else {
		showerr && showError(input, 'isEmpty');
		return false;
	}
	
}
function validCity(showerr) {
	showerr = showerr === false ? false : true;
	var input = $('.form-data .city input'), city_id = input.val();
	if (city_id === '') {
		showerr && showError(input, 'isEmpty');
		showerr && inputIsWrong(true, input);
		return false;
	} else {
		showerr && showError(input, 'normal');
		showerr && inputIsWrong(false, input);
		return true;
	}
}
function validAgreement(showerr) {
	var checked = $('#agreement').attr('checked');
	if (checked) return true;

	if (showerr) {
		alert(errorMsg.agreement);
		return false;
	}
}
function isValidMail(sText) {
	//sText = 'aa@aa.cc';
	var reMail = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	//xq.log(sText,reMail.test(sText));
	return reMail.test(sText);
}
//errorPos 位置:email,nick,password
function showError(elem, errorType) {
	var errorPos = $(elem).attr('name'),
			tips = $(elem).parents('li').find('.tips');
	if (errorType == 'normal') {
		tips.removeClass('error');
	} else {
		tips.addClass('error');
	}
	try {
		tips.text(errorMsg[errorPos][errorType]).show();
	} catch (e) {
		xq.log('你若不是在注册第一步，则不用在意这个错误');
	};
}
function inputIsWrong(bool, inputEl) {
	var emIcon = $(inputEl).siblings('em').show();
	if (bool) {
		emIcon.removeClass('ok').addClass('wrong');
	} else {
		emIcon.removeClass('wrong').addClass('ok');
	}
}




function getLength(str){
	var len = 0;
	for(var i=0,l=str.length; i<l;i++){
		len += isChinese(str[i]) ? 2:1;
	}
	return len;
}
function isChinese(temp) {
	var re = /[^\u4e00-\u9fa5]/;
	return !(re.test(temp));
}


/////////////////////////=========================== 注册第1步，
jQuery(function ($) {
	//可能有时候性别有预设值，比如，表单页面点击后退按钮
	var alreadySex = $('.form-data .sex input').val();
	alreadySex == 0 && (alreadySex='female');
	alreadySex == 1 && (alreadySex='male');
	if (!_.isEmpty(alreadySex)) {
		$('.form-data .' + alreadySex).get(0).click();
	}
});



/////////////////////////=========================== 注册第1.5步，验证邮箱
jQuery(function ($) {
	$('#resend-email').on('click', function (e) {
		var user_id = xq.config.get('user_id');
		$.post(xq.config.get('resend-email'), {
			'action': 'resend_email',
			'user_id': user_id
		}, function () { });

		alert("确认信已经重发到你的邮箱 " + $('.check-email .note b').text() + "，请查收。");
	});
});