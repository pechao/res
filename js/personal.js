jQuery(function ($) {

	//=========================================================================主人个人页面，个性签名部分
	//1. 显示、隐藏 “编辑”按钮
	//$('.personal-info-main .sign .txt').hover(function (e) {
	//	$(e.currentTarget).children('a').show();
	//}, function (e) {
	//	$(e.currentTarget).children('a').hide();
	//});

	var sign_cache;
	var getShowSign = function (sign) { return '(' + sign + ')'; }
	//点击后，转换为编辑状态
	$('.personal-info-main .sign .txt a').on('click', function (e) {
		var $tar = $(e.target);
		sign_cache = $tar.siblings('span').text();

		//去除外层的括号
		var sign = sign_cache.match(/\((.*)\)/);
		sign && (sign_cache = sign[1]);

		var pa = $tar.parent().hide();
		var edit = pa.siblings('.edit-part').show();
		var input = edit.children('input').val(sign_cache).select();
	});

	//保存个性签名
	$('.personal-info-main .sign input').on('keyup', function (e) {
		if (e.keyCode == 13) {
			$(e.target).siblings('button').get(0).click();
		}
	});
	$('.personal-info-main .sign button').on('click', function (e) {
		var $tar = $(e.target);
		var val = $tar.siblings('input').val();
		$.publish('personal-sign-save', { '$txt': $tar.parent().siblings('.txt'), '$edit': $tar.parent(), 'val': val });
		sign_cache = undefined;
	});

	//若点击的不是这个组件，则取消编辑
	xq.onDocClick(function (e) {
		if (_.isUndefined(sign_cache)) return;
		if ($('.personal-info-main .sign').has(e.target).length == 0) {
			$.publish('personal-sign-cancel', { 'cache': sign_cache });
		}
	});

	$.subscribe('personal-sign-save', function (e) {
		var sign = e.val;
		e.$txt.show();
		e.$edit.hide();
		e.$txt.children('span').text(getShowSign(sign));
		xq.getJSON(xq.config.get('personal-change-sign'), {
			'personal_sign': sign
		}, function (e) { });
	});

	//e.cache 刚才的个性签名缓存
	$.subscribe('personal-sign-cancel', function (e) {
		var sign = e.cache;
		if (!sign) return;

		var el = $('.personal-info-main .sign');
		el.children('.txt').show();
		el.children('.edit-part').hide();
		el.find('span').text(getShowSign(sign));
	});

	//=========================================================================更换头像

	var config4 = {
		'uploading': '头像正在上传中...',
		'change_avatar': '更换头像'
	}
	var isOnButton;
	var isLoading;

	var avatarBtn = $('.change-photo');
	if (avatarBtn.length != 0) {
		var avaliable_type = /\.jpg|\.bmp|\.gif|\.png|\.jpeg$/;

		var avatarUpload = new xq.Image.Upload({
			node: avatarBtn,
			action: xq.config.get('upload-avatar'),
			inputName: 'avatar',
			valideFn: function (e, suit) {
				if (!this.defaultValideFn(e, suit)) return false;

				$.publish('selected-avatar', { val: val });
			}
		});
		avatarUpload.on('add.suit', function (suit, upload) {
			suit.input.hide();
		});
		avatarUpload.on('node.moveleave', function (e, upload) {
			isOnButton = false;
		});
		avatarUpload.on('node.mouseenter', function (e, upload) {
			isOnButton = true;
			if (isLoading) {
				upload.nowInput.hide();
			}
		});
		avatarUpload.on('upload.start', function (e, suit, upload) {
			isLoading = true;
			upload.nowInput.hide();
			$('.personal-info-main .change-photo').show().text(config4.uploading);
		});
		avatarUpload.on('upload.success', function (content, suit, upload) {
			//直接刷新页面，因为要更改的 DOM 太多了
			location.reload();

			//isLoading = false;
			//var data = xq.parseJSON(content);
			//if (data.error != 200) return;
			//upload.nowInput.show();
			//$('.personal-info-main .photo img').attr('src', data.url);
			//avatarBtn.hide().text(config4.change_avatar);
		});
	};


	$('.personal-info-main .photo').hover(function (e) {
		avatarBtn.show();
		avatarUpload && avatarUpload.calcNode();
	}, function (e) {
		if (!isOnButton) {
			avatarBtn.hide();
		}
	});

	//=================================关注此人、取消关注
	$('.personal-info-main .follow div').on('click', function (e) {
		//未登录
		if (!xq.isLoginUser()) {
			xq.fn.exec('show-pop-log');
			return;
		}
		var $tar = $(e.currentTarget);
		var action;
		if ($tar.hasClass('go-follow')) {
			action = 'follow'
		} else {
			action = 'unfollow';
			//只有span “取消”两个字可点击
			if ($(e.target).get(0).tagName.toLowerCase() !== 'span')
				return;
		}

		$tar.hide().siblings().show();
		var followData = {
			'action': 'friend',
			'op': action,
			'user_id': $tar.parents('.personal-info-main').data('userid')
		};
		$.post(xq.config.get('followTheUser'), followData, function () { });
	});

	//================================ 私信
	$('.personal-info-main .option .mail').on('click', function (e) {
		//未登录
		if (!xq.isLoginUser()) {
			xq.fn.exec('show-pop-log');
			return;
		}
		//TODO: 剩下的 还没写

	});

	//================================添加图片
	$('.personal-album .add-photo').on('click', function (e) {
		$.publish('personal-add-photo-widget-show');
	});
	
	$('.msg-panel .btn-cancle').on('click', function (e) {
		//已经在 postnews_module.js 里面做了
		//$.publish('personal-add-photo-widget-close');
	});

	$.subscribe('personal-add-photo-widget-show', function () {
		//设置为相册 --- 在 postnews_modules.js 有监听函数，来修改里面的局部变量
		xq.fn.exec('set_isPersonalAlbum', true);

		$('.msg-panel .msg-form').slideDown();
	});

	$.subscribe('personal-add-photo-widget-close', function () {
		$('.msg-panel .msg-form').slideUp();
	});

	//===============================线路显示更多
	$('.personal-circle i.more').on('click', function (e) {
		var container = $('.personal-circle .label-line-wrap');
		if (container.hasClass('line')) {
			$(this).addClass('opened');
			container.removeClass('line');
		} else {
			$(this).removeClass('opened');
			container.addClass('line');
		}
	});
	//==============================标签显示更多
	$('.personal-interest i.more').on('click', function (e) {
		var container = $('.personal-interest .p-inner');
		var maxHeight = container.data('max-height');
		var m = container.css('max-height');
		if (!maxHeight) {
			container.data('max-height', m);
		}
		if (m == 'none') {
			$(this).removeClass('opened');
			container.css('max-height', maxHeight);
		} else {
			$(this).addClass('opened');
			container.css('max-height', 'none');
		}
	});
});