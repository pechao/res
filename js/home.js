$(function () {
	var P = {};
	//1. 发布--关联线路--点击
	//$('.line-sel-inner').toggle(function (e) {
	//	$(this).siblings('.line-sel-pull-down').show();
	//}, function (e) {
	//	$(this).siblings('.line-sel-pull-down').hide();
	//});
	////2. 发布--请选择站点--点击
	//$('.station-sel-inner').toggle(function (e) {
	//	$(this).siblings('.station-sel-pull-down').show();
	//}, function (e) {
	//	$(this).siblings('.station-sel-pull-down').hide();
	//});
	////3. 发布--公共相册--点击
	//$('.public-photo-sel-inner').toggle(function () {
	//	$(this).siblings('.public-photo-sel-pull-down').show();
	//}, function () {
	//	$(this).siblings('.public-photo-sel-pull-down').hide();
	//});
	////4. 发布--特征--点击li:not(".input")
	//$('.msg-form .feature-section').on('click', 'li:not(".input")', function (e) {
	//	$(this).hasClass('clicked') ? $(this).removeClass('clicked') : $(this).addClass('clicked');
	//});
	////.toggle(function (e) {
	////    $(this).addClass('clicked');
	////}, function (e) {
	////    $(this).removeClass('clicked');
	////});
	//$('.msg-form .feature-section li input').on('keydown', function (e) {
	//	if (e.keyCode == 13) {
	//		var val = $.trim($(this).val());
	//		if (val != '') {
	//			$(this).parent().before('<li class="clicked">' + val + '</li>').end().val('');
	//		}
	//	}
	//});



	var friendlyMsg = {
		'default': '分享新鲜事给同路线的朋友，吃遍玩遍整条线~',
		'hangout': '从两点一线间征个人，一起去好吃好玩儿的地方',
		'topic': '沿线也有那么多的喜怒哀乐',
		'encounter': '我们是路人，但不应该只是路人',
		'album': '每一条线路都值得拥有一个图库~'
	}

	//在默认情况下，默认的提示语为default，在点击打开了某类之后，锁定默认为此类型
	var defaultType = 'default';
	var lockType = defaultType;

	function getType(type) {
		//TODO: 直接在源头拦截，替换，之后可以把 （1）城内/跨城页 （2）home页的 HTML 直接也替换了（目前可能后台改起来麻烦（他们的反应））
		if (type == 'need-person') type = 'hangout';
		if (type == 'meeting') type = 'encounter';
		return type;
	}


	$.subscribe('change.friendlyMsg', function (e) {
		$('.msg-panel>.tips').text(friendlyMsg[e.type]);
	});

	$('.post-news .list').on('mouseenter', 'li', function (e) {
		$.publish('change.friendlyMsg', { type: getType($(e.currentTarget).data('type')) });
	});

	$('.post-news .list').on('mouseleave', 'li', function (e) {
		$.publish('change.friendlyMsg', { type: lockType });
	});

	// 点击发布新鲜事
	$('.post-news .list li').on('click', function (e) {
		//未登录
		if (!xq.isLoginUser()) {
			xq.fn.exec('show-pop-log');
			return;
		}

		var $tar = $(e.currentTarget);
		//已经打开，则隐藏
		if ($tar.hasClass('active')) {
			$.publish('postnews-module-hide', e);
			lockType = defaultType;
			return;
		}

		if ($tar.children().hasClass('add-one')) return;
		$tar.addClass('active').siblings().removeClass('active');
		$('.msg-panel .tips').addClass('border-bottom-dot');
		$('.msg-panel .post-tooth').hide();
		e.preventDefault();

		var type = getType($(e.currentTarget).data('type'));

		lockType = type;
		$.publish('change.friendlyMsg', { type: type });

		//这个 侦听器 定义在 postnews_modules.js 中
		$.publish('postnews-module-sel-type', { type: type, formEl: $('.msg-panel').not('#thread-edit') });
	});
	//点击了“取消”发布之后
	$.subscribe('postnews-module-hide', function () {
		$('.msg-panel .tips').removeClass('border-bottom-dot');
		$('.post-news .list li').removeClass('active');
	});


	//================================通知区域
	var notifyManager = {
		prevXhr: null,
		//每页显示3条
		num_show: 3,
		sub: function (num) {
			$('#notify-left').text(this.getLeft() - num);
			this.checkSituation();
		},
		getLeft: function () {
			return parseInt($('#notify-left').text(), 10);
		},
		checkSituation: function () {
			//当页面少于7条，则请求后台更多的通知
			var getWhenLess = 7;
			var pageLeft = $('.new-notes li').length;
			var realLeft = this.getLeft();
			if (realLeft <= 0) {
				$('.new-notes').remove();
			} else if (pageLeft != realLeft && pageLeft < getWhenLess) {
				try {
					//以免连续的请求
					this.prevXhr.abort();
				} catch (e) { };
				this.prevXhr = $.getJSON(xq.config.get('notice-query-news'), $.proxy(function (json) {
					$('.new-notes ul').html(json.news);
					$(xq.f('.new-notes ul li:gt({0})', this.num_show)).hide();
					$('#notify-left').text(json.left);
				}, this));
			}
		}
	}
	$('.main-part .inner-container').on('mouseover', 'li', function (e) {
		$(e.currentTarget).children('.close-btn').show();
	});

	$('.main-part .inner-container').on('mouseout', 'li', function (e) {
		$(e.currentTarget).children('.close-btn').hide();
	});
	//单独设置为已读
	$('.main-part .inner-container').on('click', '.close-btn', function (e) {
		var li = $(e.target).parent();

		//2. ajax
		var formData = {};
		formData[li.data('type')] = JSON.stringify(li.data('id'));
		$.publish('set-to-read-notification', formData);

		//1. 视图更新
		li.siblings('li:hidden').eq(0).show();
		var len = li.length;
		li.remove();

		notifyManager.sub(len);
	});
	//批量设为已读
	$('.main-part .inner-container .btns>a:first').on('click', function (e) {

		var container = $(e.target).parents('.inner-container');
		var lis = container.find('li:visible');

		//2. ajax
		var formData = {};
		lis.each(function (i, li) {
			var type = $(li).data('type');
			var id = $(li).data('id');
			formData[type] = _.union(formData[type] || [], id);
		});
		_.each(formData, function (val, type) {
			formData[type] = JSON.stringify(val);
		});

		$.publish('set-to-read-notification', formData);

		//1. 视图
		var len = lis.length;
		lis.remove();
		container.find(xq.f('li:lt({0})', notifyManager.num_show)).show();

		notifyManager.sub(len);
	});

	$.subscribe('set-to-read-notification', function (e) {
		$.post(xq.config.get('notify-set-to-read'), e, function (json) {
			
		});
	});


	//整个新消息聚合的初始化---每次重新加载后，都要重新初始化
	(function ($, _, exports) {

		if (0) {
			//这两个已经在 module_thread.js 中加载了---此前，home.html　没有加载这个JS文件

			//应征，附加留言弹出窗--处理，“确定”|“取消”
			$.publish('bind-follow-popup-sure-cancel');

			//绑定 点击“应征”按钮
			function bindFollowBtn() {
				// “应征”弹出窗的 事件
				$.publish('bind-follow-btn-click');
			}
		}

		//绑定 添加回复
		//----module_thread 里面已经写好了，而且是改版后的全功能
		if (0) {
			function bindReply() {
				$('.reply-box .reply-box-wrap .editable').on('keypress', function (e) {
					if (e.keyCode === 13) {
						var content = $(this).text();
						$.publish('reply-news', { content: content, $replyLi: $(this).parents('li.reply-box') });
						$(this).text('');
					}
				});

				$('.reply-box .reply-btn').on('click', function (e) {
					var divEl = $(this).siblings('.reply-box-wrap').find('.input-div .editable');
					var content = divEl.text();
					$.publish('reply-news', { content: content, $replyLi: $(this).parents('li.reply-box') });
					divEl.text('');
				});
			}

			$.subscribe('reply-news', function (e) {
				var $photo = e.$replyLi.find('.photo');

				//1. 本地更新
				var tmpl = _.template($('#reply-tmpl').text(), {
					data: {
						photoHtml: $photo.get(0).outerHTML,
						username: $photo.data('username'),
						content: e.content,
						firstReply: (e.$replyLi.parent('ul').data('replynum') === 0)
					}
				});
				e.$replyLi.before($(tmpl));

				//2. Remote发送
				$.post(xq.config.get('replyNews'), {
					content: e.content
				}, function (e) { });
			});
		}

		//提供线索---邂逅类别
		//-------目前，类似“应征”的做法，之后再做更详细的
		if (0) {
			function bindThreadHover() {
				//hover 后显示隐藏
				$('.operates .thread').hover(function () {
					$(this).find('ul').show();
				}, function () {
					$(this).find('ul').hide();
				});
				//点击菜单
				$('.operates .thread').on('click', 'li', function (e) {
					$(this).parent().hide();

					var action = $(this).data('action');
					if (action === 'reply') {
						$.publish('goto-reply', { $news: $(this).parents('.news-wrapper') });
					} else if (action === 'private-mail' || action === 'anonymous') {
						var user = $(this).parents('.operates').siblings('.photo').data('user');
						$.publish('goto-write-mail', { to: { name: user.name, id: user.id }, isAnonymous: (action === 'anonymous') });
					}
				});
			}

			//聚焦到 回复框
			$.subscribe('goto-reply', function (e) {
				e.$news.find('.reply-box-wrap .editable').focus().get(0).click();
			});
			//弹出写私信
			$.subscribe('goto-write-mail', function (e) {
				var $mail = $('#write-mail');
				$mail.show().find('.to-username span').text(e.to.name).end().data('to_id', e.to.id).data('isAnonymous', e.isAnonymous);
				$mail.find('.input-area textarea').focus();
			});
		}



		//因为这个不会动态生成，所以只需在页面初始化时绑定一次即可
		$('#write-mail .send-btn').on('click', function (e) {
			var $mail = $('#write-mail');
			var textarea = $mail.find('.input-area textarea');
			var content = $.trim(textarea.val());

			if (content === '') {
				return;
			}

			$mail.hide();
			textarea.val('');
			$.publish('send-mail', { content: content, to: $mail.data('to_id'), isAnonymous: $mail.data('isAnonymous') });
		});

		//同上，只绑定一次
		$('#write-mail .top .wrap i').on('click', function (e) {
			var $mail = $('#write-mail');
			$.publish('close-mail-pop', { $mail: $mail });
		});

		//发送私信
		$.subscribe('send-mail', function (e) {
			xq.post(xq.config.get('writeMailToUser'), {
				content: e.content,
				to: e.to,
				anonymous: e.isAnonymous
			}, function (json) {
				$.publish('global-remote-success', { content: xq.config.get('tipsText')['mailSuccess'] });
			});
		});
		//关闭私信弹出窗
		$.subscribe('close-mail-pop', function (e) {
			e.$mail.hide();
		});


		function initNewsPart() {
			//bindFollowBtn();
			//bindReply();
			//bindThreadHover();
		}

		initNewsPart();
		exports.initNewsPart = initNewsPart;
	})($, _, P);

	//--------------------------------------------------------------------------我是分割线---------------------------------------------------------------------
	(function () {
		var config = {
			'timeout': 10 * 1000 //10秒钟间隔后再去后台取，而不是每次点击都去后台取
			//type: { timestamp: 312451212012, isFetching: true, html: xxx }
		};
		//先把第一个tab的HTML存储起来
		config['line-news'] = {
			'timestamp': (new Date()).getTime(),
			'isFetching': false,
			'html': $('.news-container .news-wrapper')
		}
		//当标签来回切换，只有最后那个click的tab的html被挂载到文档中
		var version = 0;

		//动态聚合的切换---线路沿线动态、好友动态、消费动态
		$('.news-gallary').on('click', 'li', function (e) {
			//暂时不用AJAX，直接翻页
			return;
			var $tab = $(this);
			var type = $tab.data('tabtype');

			config[type] = config[type] || {};

			$tab.addClass('active').siblings().removeClass('active');
			$('#pop-follow-id').appendTo('body').hide();
			$('.news-container .news-wrapper').remove();

			if (config[type]['isFetching']) {
				$.publish('home-tab-is-fetching', { '$tab': $tab, 'type': type });
				return;
			}
			var timestamp = config[type]['timestamp'];
			if (!timestamp || (new Date()).getTime() - timestamp > config.timeout) {
				$.publish('home-tab-need-fetch', { 'type': type });
			} else {
				$.publish('get-remote-news-success', { 'type': type });
			}
		});

		$.subscribe('home-tab-need-fetch', function (e) {
			config[e.type]['isFetching'] = true;
			config[e.type]['timestamp'] = (new Date).getTime();
			var tempVersion = ++version;

			//$.publish('get-remote-news-start');
			$.publish('home-tab-is-fetching');
			$.get(xq.config.get('getNewsPart'), {
				type: e.type
			}, function (html) {
				config[e.type]['isFetching'] = false;
				config[e.type]['html'] = $(html);

				if (tempVersion !== version) return;
				$.publish('get-remote-news-success', { 'type': e.type });
			});
		});

		//当加载后台新鲜事完成后
		$.subscribe('get-remote-news-success', function (e) {
			$('.news-container .loading').hide();
			var $wrap = $('.news-container');
			var $html = config[e.type]['html'];
			$wrap.append($html);
			P.initNewsPart();
			$.publish('chrome-placeholder-bind', { $el: $html.find('.chrome-placeholder') });
			$.publish('bind-homepage-reply-box', { '$el': $html.find('.focusout') });
			$.publish('bind-new-user-that-has-card', { $el: $html.find('.user-card') });
			$.publish('bind-reply-submit_btn', { $replybox: $html.find('.reply-box') });
			$.publish('bind-reply-replysomebody_btn', { $btn: $html.find('.feed-replies .a-reply .reply-btn') });
			//$.publish('editable-tips-bind', { $el: $('.editable-tips') });
		});

		//当正在加载中的时候
		$.subscribe('home-tab-is-fetching', function (e) {
			$('.news-container .loading').show();
		});
	})();


	//(function ($, _) {

	
	
	//})();


	//可能感兴趣的人 的交互
	(function ($, _) {
		
		$('.may-person li').hover(function (e) {
			$(this).children('b.close').show();
		}, function (e) {
			$(this).children('b.close').hide();
		});


		var len = $('.may-person li').length;
		//页面上只显示2个
		var showNum = 2;

		$('.may-person').on('click', 'li b.close', function (e) {
			var $person = $(this).parent();
			//$('.may-person li')
			var index = $person.index();
			//xq.log(index);
			var $next = $('.may-person li').eq(showNum);

			$next.insertBefore($person).show();
			index === 0 ? $next.removeClass('last') : $next.addClass('last');

			$person.hide().appendTo($('.may-person ul'));
		});

	})($, _);
});