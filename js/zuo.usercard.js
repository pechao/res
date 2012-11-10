jQuery(function ($) {
	var $usercard = $('.user-detail-wrap');
	if ($usercard.length === 0) $usercard = $('<div class="user-detail-wrap"></div>').appendTo('body');

	//标签高度是固定的，目前的样式中，高度如下
	var _labelLineHeight = 31, _labelInterestHeight = 30, _needLabelLineArrow, _needLabelInterestArrow, _labelLineEl, _labelInterestEl;

	//格式 { userid: {/后台返回的json} }
	xq.data.set('usercard', {});
	
	//用户卡片的显示和隐藏
	//用唯一的版本号
	var usercardVersion = 0;
	var usercardConfig = {
		timeout: 500
	};
	var operated_card = { //已经操作过的 user_card ，比如：follow( true )，unfollow( false )
		//id: true | false 
	};

	//是否关注
	var f_config = {
		'follow': '+关注此人',
		'unfollow': '已关注<span> | 取消</span>'
	};

	//用户卡片的 mousein 事件
	$.subscribe('user-card-mousein', function (e) {
		usercardVersion += 1;
		$usercard.data('version', usercardVersion);

		var userid = $(e.currentTarget).data('usercard');
		var $photo = $(e.target);
		var usercardHtml = xq.data.get('usercard')[userid];

		//则不必重复ajax，加载完成后直接缓存到内存中
		if (usercardHtml) {
			$.publish('user-card-load-success', { $photo: $photo, $usercard: $(usercardHtml), userid: userid });
			return;
		}

		$.publish('user-card-load-begin', { $photo: $photo, userid: userid });

		$.get(xq.config.get('getUserProfile'), {
			userid: userid
		}, function (html) {
			xq.data.get('usercard')[userid] = html;
			$.publish('user-card-load-success', { $photo: $photo, $usercard: $(html), userid: userid });
		});
	});

	//用户卡片的 mouseout 事件
	$.subscribe('user-card-mouseout', function (e) {
		usercardVersion += 1;
		$usercard.data('version', usercardVersion);

		$.publish('user-card-hide');
	});

	$.subscribe('user-detail-card-mousein', function (e) {
		usercardVersion += 1;
	});

	$.subscribe('user-detail-card-mouseout', function (e) {
		usercardVersion += 1;
		$usercard.hide();
	});

	//用户卡片加载成功
	$.subscribe('user-card-load-success', function (e) {
		//e.$usercard 是 $usercard 的 innerHTML
		var config = {
			usercardWidth: 366,
			usercardPaddingTop: 9
		}

		$usercard.css({
			left: e.$photo.offset().left - config.usercardWidth,
			top: e.$photo.offset().top - config.usercardPaddingTop
		});

		
		$usercard.empty().append(e.$usercard).show();
		//非 undefined 说明用户操作过，就不能完全用 缓存的原始的HTML 了
		if (!_.isUndefined(operated_card[e.userid])) {
			var hadFollow = operated_card[e.userid];
			var t = hadFollow ? f_config.unfollow : f_config.follow;
			$usercard.find('.follow').html(t);
		}
		
		isLabelNeedArrow($usercard);
		bindUsercardEvent(e.$usercard, e.userid);
	});

	//销毁
	$.subscribe('user-card-hide', function (e) {
		$usercard.hide();
	});
	
	//用户卡片的 hover 
	$usercard.hover(function (e) {
		usercardTempFn()(e, 'user-detail-card-mousein', usercardConfig.timeout);
	}, function (e) {
		usercardTempFn()(e, 'user-detail-card-mouseout', usercardConfig.timeout);
	});

	//最近来访 用户名片
	$.subscribe('bind-new-user-that-has-card', function(e){
		e.$el.hover(function (e) {
			usercardTempFn()(e, 'user-card-mousein', usercardConfig.timeout);
		}, function (e) {
			usercardTempFn()(e, 'user-card-mouseout', usercardConfig.timeout);
		});
	});
	//------------------------------------------------------------------------------给用户绑定卡片的事件
	$.publish('bind-new-user-that-has-card',{ $el: $('.user-card')});

	function usercardTempFn() {
		return function (jqEvent, customEvenetName, timeout) {
			usercardVersion += 1;
			var tempVersion = usercardVersion;
			setTimeout(function () {
				if (tempVersion === usercardVersion) {
					$.publish(customEvenetName, jqEvent);
				}
			}, timeout);
		}
	}

	//卡片标签是否需要 展开|折叠 的小箭头
	function isLabelNeedArrow($usercard) {
		//TODO: 之后再做
		return;

		_labelLineElFirst = $usercard.find('.label-line-wrap>li:first');
		_labelLineElLast = $usercard.find('.label-line-wrap>li:last');



		_labelInterestEl = $usercard.find('.interests>.label:eq(0)');


	}

	function bindUsercardEvent($el, userid) {
		//var userid = $el.data('userid');
		//发私信
		$el.find('.mail').on('click', function (e) {
			if (!xq.isLoginUser()) {
				xq.fn.exec('show-pop-log');
				$.publish('user-card-hide');
				return;
			}
			$.publish('goto-write-mail', { to: { name: $el.find('.title-part h3').text(), id: userid }, isAnonymous: false });
		});

		$el.find('.follow').add($el.find('.unfollow')).on('click', function (e) {
			if (!xq.isLoginUser()) {
				xq.fn.exec('show-pop-log');
				$.publish('user-card-hide');
				return;
			}

			var hadFollow = _.isUndefined(operated_card[userid]) ? $(this).hasClass('unfollow') : operated_card[userid];
			var btn = $(e.currentTarget);
			//已关注的情况下，只有确切的点击“取消”才能取消，而非整个按钮
			if (hadFollow && !$(e.target).is(btn.children('span'))) {
				return;
			}

			btn.attr('class', hadFollow ? 'follow' : 'unfollow');
			
			$(this).html(hadFollow ? f_config.follow : f_config.unfollow);
			$.publish('goto-about-follow', {
				url: xq.config.get('followTheUser'),
				operate: (hadFollow ? 'unfollow' : 'follow'),
				user_id: userid
			});
			//$(this).data('hadfollow', !hadFollow);
			operated_card[userid] = !hadFollow;
		});

		//兴趣模块，展开
		$el.find('.interests .more').on('click', function (e) {
			var $el = $(this).parent();
			$el.hasClass('close') ? $el.removeClass('close') : $el.addClass('close');
		});

		//共同线路模块，展开
		$el.find('.line .more').on('click', function (e) {
			var $el = $(this).parent();
			$el.hasClass('close') ? $el.removeClass('close') : $el.addClass('close');
		});
	}
});