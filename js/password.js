jQuery(function ($) {
	var canSubmit = false;

	(function () {
		//1. ============================================================ 找回密码 页面
		var submit = $('.find-pass .form-data li.send-email button');
		var emailInput = $('#find-email input');
		var warnEl = $('.form-data li.warn');

		//
		emailInput.on('focusout', function (e) {
			xq.fn.exec('go-valid-email', emailInput.val());
		});

		//邮箱验证成功
		$.subscribe('email-is-valided', function () {
			warnEl.hide();
			canSubmit = true;
			submit.addClass('ok2');
		});
		//邮箱格式有误
		$.subscribe('email-is-not-valided', function () {
			warnEl.show().children('.format-error').show();
			canSubmit = false;
			submit.removeClass('ok2');
		});
		//邮箱为空
		$.subscribe('email-is-empty', function () {
			warnEl.hide();
			canSubmit = false;
			submit.removeClass('ok2');
		});

		//发送表单
		submit.on('click', function (e) {
			if (!canSubmit) e.preventDefault();
		});
	})();


	(function () {
		//2. ============================================================= 重设密码 页面
		var warnEl = $('.form-data li.warn');
		var submit = $('.form-data .send-newpass button');
		var newPassInput = $('#new-pass input');
		var rePassInput = $('#re-pass input');
		var min = xq.config.get('password').minlength;
		var max = xq.config.get('password').maxlength;
		
		submit.on('click', function (e) {
			xq.fn.exec('reset-valid-password', newPassInput.val(), rePassInput.val());

			if (!canSubmit) e.preventDefault();
		});

		//只验证是否正确
		newPassInput.add(rePassInput).on('focusout', function (e) {
			var n = newPassInput.val();
			var r = rePassInput.val();
			if (r == n && r != '' && n.length >= min && n.length <= max) {
				$.publish('pass-is-valid');
			}
		});



		xq.fn.add('reset-valid-password', function (newPass, rePass) {
			if (newPass == '' && rePass == '') {
				$.publish('pass-is-empty');
			}

			if (newPass != '' || rePass != '') {
				if (newPass != rePass) {
					$.publish('pass-is-not-same');
				} else if (newPass.length < min) {
					$.publish('pass-is-too-short');
				} else if (newPass.length > max) {
					$.publish('pass-is-too-long');
				} else {
					$.publish('pass-is-valid');
				}
			}
		});

		$.subscribe('pass-is-valid', function () {
			canSubmit = true;
			warnEl.hide();
			submit.addClass('ok2');
		});

		$.subscribe('pass-is-empty', function () {
			canSubmit = false;
			warnEl.hide();
		});

		$.subscribe('pass-is-too-short', function () {
			canSubmit = false;
			warnEl.show().children('.too-short').show().siblings().hide();
		});

		$.subscribe('pass-is-too-long', function () {
			canSubmit = false;
			warnEl.show().children('.too-long').show().siblings().hide();
		});

		$.subscribe('pass-is-not-same', function () {
			canSubmit = false;
			warnEl.show().children('.not-same').show().siblings().hide();
		});
	})();
});