/*
* 因为每个页面都有可能引用：未登录的时候，会弹出悬浮登录框，登录逻辑就在这里
*
*/



jQuery(function ($) {
	function isValidMail(sText) {
		//sText = 'aa@aa.cc';
		var reMail = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
		//xq.log(sText,reMail.test(sText));
		return reMail.test(sText);
	}


	$.subscribe('valide.please-check', function (e) {
		var $this = $(e.target);
		var val = $.trim($this.val());
		var c = $this.data('valide');
		if ($this.data('valide') === 'email') {
			if (val === '') {
				$.publish('valide.email-is-empty', $this);
				return;
			}
			if (!isValidMail(val)) {
				$.publish('valide.email-not-valide', $this);
				return;
			} else {
				$this.data('isvalide', true);
				$.publish('valide.email-valide', $this);
			}

			//验证邮箱是否已存在
			//请求格式：-------------- { 'email': 'xx@aa.com' }
			//返回格式：-------------- { 'error': 200, 'hadExit': false }
			var url = xq.config.get('isEmailExist');
			//如果已验证，不必重复验证
			//if ($this.data('isvalide-from-server') === true) return;
			//xq.getJSON(url, {
			//	'email': val
			//}, function (json) {
			//	if (json.hadExist) {
			//		$.publish('valide.email-had-exist');
			//		$this.data('isvalide-from-server', false);
			//	} else {
			//		$.publish('valide.email-had-not-exist');
			//		$this.data('isvalide-from-server', true);
			//	}
			//});
		} else if ($this.data('valide') === 'password') {
			var p = e.passLength;
			if (val === '') {
				$.publish('valide.pass-is-empty', $this);
				return;
			} else if (val.length < p[0]) {
				$.publish('valide.pass-too-short', $this);
				return;
			} else if (val.length > p[1]) {
				$.publish('valide.pass-too-long', $this);
				return;
			}
			$.publish('valide.pass-valide', $this);
			$this.data('isvalide', true);
		}
	});

	//1. 聚焦时文字颜色变深。
	$('.form-data').find(':text').add(':password').on('focusin', function (e) {
		$(this).siblings('label').addClass('active');
	});
	$('.form-data').find(':text').add(':password').on('focusout', function (e) {
		$(this).siblings('label').removeClass('active');
	});


	var warnEl = $('.form-data li.warn');
	//最短，最长 位数
	var passLength = [4, 16];
	var errorMsg = {
		'email': {
			'format-error': '邮箱帐号格式有误',
			'not-exist': warnEl.html(),
			'is-empty': '请填写邮箱'
		},
		'pass': {
			'is-empty': '请填写密码',
			'too-short': '密码至少需' + passLength[0] + '位',
			'too-long': '密码最长' + passLength[1] + '位'
		},
		'log': {
			'pass-wrong':'密码错误'
		}
	}

	//$('input[data-valide]').on('focusout', function (e) {
	//	$.publish('valide.please-check', e);
	//});

	$.subscribe('valide.email-not-valide', function ($this) {
		warnEl.html(errorMsg['email']['format-error']);
		$('.form-data li.warn').show();
	});

	$.subscribe('valide.email-is-empty', function(e){
		warnEl.html(errorMsg['email']['is-empty']);
		$('.form-data li.warn').show();
	})

	//邮箱不存在
	$.subscribe('valide.email-had-not-exist', function ($this) {
		warnEl.html(errorMsg['email']['not-exist']);
		$('.form-data li.warn').show();
	});

	$.subscribe('valide.email-valide', function (e) {
		$('.form-data li.warn').hide();
	});

	//密码为空
	$.subscribe('valide.pass-is-empty', function (e) {
		warnEl.html(errorMsg['pass']['is-empty']);
		$('.form-data li.warn').show();
	});

	//密码太短
	$.subscribe('valide.pass-too-short', function (e) {
		warnEl.html(errorMsg['pass']['too-short']);
		$('.form-data li.warn').show();
	});

	//密码太长
	$.subscribe('valide.pass-too-long', function (e) {
		warnEl.html(errorMsg['pass']['too-long']);
		$('.form-data li.warn').show();
	});
	$.subscribe('valide.pass-valide', function (e) {
		$('.form-data li.warn').hide();
	});
	//密码错误
	$.subscribe('valide.pass-wrong', function (e) {
		warnEl.html(errorMsg['log']['pass-wrong']);
		$('.form-data li.warn').show();
	});

	//记住我
	$('.log-funcs span').on('click', function (e) {
		var input = $(this).siblings('input');

		if (input.val() === 'false') {
			$(this).addClass('selected');
			input.val('true');
		} else {
			$(this).removeClass('selected');
			input.val('false');
		}
	});

	//验证密码

	//登录
	//请求格式：----------　{email:xx, pass: xx, remember: true }
	//返回格式：----------　{error: 200, correct: true }
	$('.form-data li.log-btn input').on('click', function (e) {
		var $this = $(this);
		var form = $this.parents('form');
		if (!$this.data('canLog')) {
			e.preventDefault();
			//#bind-already 这个是 绑定到已有帐号 页面特有的
			var emailEl = $('.log-main .form-data .email input').add('#bind-already .email input');
			var email = emailEl.val();
			var passEl = $('.log-main .form-data .password_re input').add('#bind-already .password_re input');
			var pass = passEl.val();
			var remember = $('.form-data li.log-funcs input[name="_remember_me"]').val();
			var csrf_token = $('.form-data input[name="_csrf_token"]').val();

			$.publish('valide.please-check', { target: emailEl });
			//var a = emailEl.data('isvalide');
			if (emailEl.data('isvalide') === false) return;

			$.publish('valide.please-check', { target: passEl, passLength: passLength });
			//var b = passEl.data('isvalide');
			if (passEl.data('isvalide') === false) return;


			$.post(xq.config.get('login'), {
				'_csrf_token': csrf_token,
				'_username': email,
				'_password': pass,
				'_remember_me': remember
			}, function (json) {
				json = xq.parseJSON(json);
				if (json['error'] == 200) {
					$this.data('canLog', 'true');
					$this.get(0).click();
				} else if (json['error'] == 404) {
					$.publish('valide.email-had-not-exist');
				} else if (json['error'] == 401) {
					$.publish('valide.pass-wrong');
				}
			});
		} else {
			form.submit();
		}
	});



	//2. 悬浮登陆窗
	var pop_log = $('.pop-log');
	//xq.utils.pop(pop_log);

	pop_log.find('.close-btn').on('click', function (e) {
		xq.data.set('current_form', undefined);
		pop_log.hide();
	});

	//显示登陆窗 -- 比如，点击“登录”按钮，调用这个函数
	xq.fn.add('show-pop-log', function (e) {
		xq.data.set('current_form', $('.pop-log'));
		pop_log.find('.email input').get(0).focus();
		xq.utils.pop(pop_log.show());
	});

	/////////////////////////////测试用
	//xq.onDocClick(function (e) {
	//	if ($(e.target).parents(pop_log).length == 0)
	//		xq.fn.exec('show-pop-log');
	//});

});