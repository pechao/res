//城内线路|跨城线路 需要请求
$.getJSON(xq.config.get('getPersonalLineInfo'), function (json) {
	//console.log('aaa------------------------------------------>>>>>>>>>>>>>>>>>>>>>>>>>>');
	xq.Data.Master.setUserMaster(json.master);
	xq.Data.Cross.setUserCross(json.cross);
});


//ajax 翻页
jQuery(function ($) {
	//城内线路 等类似的  新闻区部分+翻页区替换
	xq.rebindPage.addAndExec('news-type4-rebind', function () {
		xq.html5load({
			'replacedEl': $('.news-type4-replacement'),
			'ancherRange': $('.news-type4-page'),
			'start': function () {

			},
			'success': function () {
				xq.rebindPage('news-type4-rebind');
				//$.publish('chrome-placeholder-bind', { $el: $('.falls-style').find('.chrome-placeholder') });
			}
		});
	});
})

jQuery(function ($) {
	
	
	//0.5 线路全乘客 圈友列表翻页
	//插件式
	var config = {
		wrapElem:$('.line-passengers .content .inner'),
		countPage:18
	};

	//0.6 加入和管理此线路
	var config3 = {
		'joined': '已加入',
		'not-join': '加入'
	}
	var cache_joined_btn_hover; //<span class="joined-station">0</span>/20
	var __tmpl_join_btn = '<span class="joined-station">{0}</span>/{1}';

	
	$('.page-title .about-line .joined').on('click', function (e) {
		//1. 未登录
		if (!xq.isLoginUser()) {
			xq.fn.exec('show-pop-log');
			return;
		}

		var $tar = $(e.currentTarget);
		var notJoin = $tar.hasClass('not-join');
		var master_id = xq.data.get('master_id');
		var cross_id = xq.data.get('cross_id');
		var lineUrl = xq.Data.Line.getLoadLineUrl(master_id);

		//2. 查看是否在允许的数量范围内 -- 只在想要“加入”的时候检查
		var userMaster = xq.Data.Master.getUserMaster();
		var userCross = xq.Data.Cross.getUserCross();
		if (notJoin && !xq.fn.exec('check-line-operate', {
			master: userMaster,
			cross: userCross
		}, {
			op: notJoin ? 'join' : 'quit',
			id: master_id || cross_id,
			type: master_id ? 'master' : 'cross'
		})) {
			return;
		}

		//加入
		if (notJoin) {
			$.publish('join-this-line-in-linepage', { $btn: $tar });
		}
		//退出
		else {
			//城内线路
			if (xq.data.get('master_id')) {
				//$.publish('exit-this-line-in-linepage', { $btn: $tar });
				xq.fn.exec('manageMasterPopup', null, null, false, master_id, cross_id, xq.Data.Master.getMaster(master_id), lineUrl, xq.data.get('master_name'), userMaster, userCross, xq.Data.Master.getMaster(master_id));
			}
			//跨城线路
			else {
				xq.data.get('passport').pop().show();
				xq.data.get('confirm').set({ $btn: $tar });
			}
		}
	});

	//只能城内线路
	if (xq.data.get('master_id')) {
		$('.page-title .about-line .joined').hover(function (e) {
			var $tar = $(e.currentTarget);
			//未加入则不需要hover
			if ($tar.hasClass('not-join')) return;

			var span = $tar.children('span');
			cache_joined_btn_hover ? span.html(cache_joined_btn_hover) : span.html(xq.f(__tmpl_join_btn, span.data('stationjoined'), span.data('stationcount')));
		}, function (e) {
			var $tar = $(e.currentTarget);
			//未加入则不需要hover
			if ($tar.hasClass('not-join')) return;

			$tar.children('span').html(config3.joined);
		});
	}

	$.subscribe('sureQuit.master', function (e) {
		var masterId = e.master_id;
		$.publish('exit-this-line-in-linepage', { $btn: $('.page-title .about-line .joined') });
	});

	$.subscribe('join-this-line-in-linepage', function (e) {
		//2. ajax
		joinMasterAjax(true, e.$btn);
	});

	$.subscribe('exit-this-line-in-linepage', function (e) {
		if (!e.$btn) return;
		//1. 视图
		e.$btn.addClass('not-join').children('span').text(config3['not-join']);
		//2. ajax
		joinMasterAjax(false, e.$btn);
	});

	function joinMasterAjax(isJoin, join_btn) {
		//loading 图标最少显示多长时间，网络请求时间更短，则按这个时间来显示图片
		var least_loading = 0.5 * 1000;
		
		//ajax start
		var start_t = new Date().getTime();
		//加入的时候需要loading
		isJoin && join_btn.children('i').addClass('loading');

		var master_id = xq.data.get('master_id');
		var cross_id = xq.data.get('cross_id')

		$.post(xq.config.get('join-exit-page-master'), {
			'action': master_id ? 'join_master' : 'join_cross',
			'join': (isJoin ? 1 : 0),
			//若为undefined，也不会被发送
			'master_id': master_id,
			'cross_id': cross_id
		}, function (json) {
			json = xq.parseJSON(json);
			var dis = new Date().getTime() - start_t;
			setTimeout(function () {
				//ajax success
				if (isJoin) {
					//1. 视图 -- 加入的时候，视图更改是延迟的
					join_btn.removeClass('not-join').children('span').text(config3['joined']);
					join_btn.children('i').removeClass('loading');
					var stationCount = json.count;
					//var stationJoined = json.joined;
					var stationJoined = 0;
					cache_joined_btn_hover = xq.f(__tmpl_join_btn, stationJoined, stationCount);
				}

			}, dis > least_loading ? 0 : least_loading - dis);
		});
	}

	//管理此线路，不过，目前先不做，直接“加入”和“退出”
	$.subscribe('manage-this-line-in-linepage', function (e) { });





	//翻页 =========== 线路圈乘客 的 翻页 === 但类名已改为：.pages => .page-number
	//$('.line-passengers .page-number').pages(xq.config.get('getCircleUser'), config.countPage);

	(function () {
		var View = {
			tpl: undefined,
			updatePanel: function (users) {
				this.destroy();
				_.each(users, function (user, index) {
					user.online_str = xq.getHumanTime(user.last_online);
					View.tpl = View.tpl || xq.getTmpl('circle-passenger-tmpl');
					var $li = $(_.template(View.tpl, { 'user': user }));
					config.wrapElem.append($li);
					$.publish('bind-new-user-that-has-card', { $el: $li.find('.user-card') });
				});
			},
			destroy: function () {
				config.wrapElem.empty();
			}
		};

		$.subscribe('click.pages', function (o) {
			var e = o.event;
			var page = o.fetchPage;
			try{
				e.preventDefault();
			} catch (e) { }
		});

		$.subscribe('fetchRemote.pages.begin', function () {
			
		});

		$.subscribe('fetchRemote.pages.succeed', function (json) {
			View.updatePanel(json.users);
		});
	})();

	////////////////////////////////////////////// IE7,人物的定位---因为无法用css相对定位（会引发其他的BUG），故此，用JS来重新定位
	if (0 && $.browser.msie && parseInt($.browser.version) === 7) {
		var configPersonIcon = {
			top: 89,
			ulLeft: 10,
			liWidth: 103
		};
		$.subscribe('reposition-person-icon', function (e) {
			var $person = e.$el;
			
			$person.css('top', parseInt($person.css('top')) + configPersonIcon.top);
			$person.css('left', parseInt($person.css('left')) + configPersonIcon.ulLeft + e.index * configPersonIcon.liWidth);
		});

		$('.station-graphics li i').each(function (index, el) {
			var $el = $(el);
			$.publish('reposition-person-icon', { $el: $el, index: $el.parent().index() });
		});
	}

	//0.9 像素风小人，站点获取新鲜事
	/* ----------------------------------- 目前只刷新页面
	(function ($) {
		var config = {
			interval: 1000 * 30
		}
		setInterval(function () {
			xq.getJSON(xq.config.get('pxNews'), function (json) {
				if (_.keys(json.news).length === 0) return;

				$.each(json.news, function (stationid, _news) {
					$.each(_news, function (newsid, sex) {
						//这个新消息将显示的人物是 “ 男 | 女 ” 
						$.publish('there-are-some-news-come', { 'stationid': stationid, 'newsid': newsid, 'sex': sex });
					});
				});
			});
		}, config.interval);
	})($);
	*/

	//0.91 如果有新的新鲜事
	//更新视图的人物显示
	$.subscribe('there-are-some-news-come', function (e) {
		//e.stationid, e.newsid, e.sex
	});

	//0.92 像素风站点的 UL 宽度
	(function () {
		
		var ul = $('.station-graphics ul');
		var liWidth = ul.children('li:eq(0)').width() || 103;

		ul.css('width', ul.children('li').length * liWidth);

	})();


	//1. 小人hover弹出气泡
	(function ($) {
		var version = 0;
		var config = {
			inWait: 100,
			outWait: 300
		}
		var shouldShow = false;
		function temp() {
			return function (customEventName, jqEvent, timeout) {
				version++;
				var tempVersion = version;
				setTimeout(function () {
					if (tempVersion === version) {
						$.publish(customEventName, jqEvent);
					}
				}, timeout);
			}
		}

		function posThePop(x, y, $pop) {
			$pop.css({
				'left': x,
				'top': y
			});
		}

		$.subscribe('need-pop-show', function (e) {
			shouldShow = true;
			var $pop = $('.msg-pop');
			var news_data = xq.data.get('pxNews')[e.stationid][e.newsid];
			if (news_data) {
				//发布图片的格式特殊，数据多一个字段，为避免undefined套模版出错，设为false
				news_data.album_url = news_data.album_url || false;
				e.data = news_data;
				$.publish('news-pop-fetchRemote-finish', e);
			} else {
				$.publish('news-pop-fetchRemote-start', e);
				xq.getJSON(xq.config.get('getPxNews'), { news_id: JSON.stringify([e.newsid]) }, function (json) {
					e.data = json.contents[e.newsid];
					//理由同上↑
					e.data.album_url = e.data.album_url || false;
					//同时缓存加载的这条新闻详情
					xq.data.get('pxNews')[e.stationid][e.newsid] = e.data;
					$.publish('news-pop-fetchRemote-finish', e);
				});
			}
		});

		$.subscribe('need-pop-hide', function (e) {
			shouldShow = false;
			var $pop = $('.msg-pop').hide();
		});

		$.subscribe('news-pop-fetchRemote-start', function (e) {
			var $pop = $('.msg-pop');
			posThePop(e.x, e.y, $pop);
			$pop.children('.loading').show().end().children('.content').empty();
			shouldShow && $pop.show();
		});

		$.subscribe('news-pop-fetchRemote-finish', function (e) {
			var $pop = $('.msg-pop');
			var $cnt = $(_.template(xq.getTmpl('news-charactor-pop-tmpl'), e.data));
			posThePop(e.x, e.y, $pop);
			$pop.children('.loading').hide();
			$pop.children('.content').empty().html($cnt);
			shouldShow && $pop.show();

			$.publish('bind-new-user-that-has-card', { $el: $cnt.find('.user-card') });
		});

		$('.station-graphics').on('mouseenter', 'li i', function (e) {
			var $tar = $(e.target)
			var klass = $tar.attr('class').substr(0, 4) + 'b';
			$tar.attr('class', klass);

			temp()('charactor-mousein', e, config.inWait);
		});

		$('.station-graphics').on('mouseout', 'li i', function (e) {
			var $tar = $(e.target)
			var klass = $tar.attr('class').substr(0, 4) + 'a';
			$tar.attr('class', klass);

			temp()('charactor-mouseout', e, config.outWait);
		});

		$('.msg-pop').hover(function (e) {
			temp()('news-pop-mousein', e, config.inWait);
		}, function (e) {
			temp()('news-pop-mouseout', e, config.outWait);
		});

		$.subscribe('charactor-mousein', function (e) {
			var $tar = $(e.target);
			var elemX = $tar.offset().left;
			var elemY = $tar.offset().top;
			var elemWidth = 22;
			var popwidth = 200;
			var popheight = 50;
			var x = elemX + (elemWidth - popwidth) / 2;
			var y = elemY - popheight;

			var stationid = $tar.parent().data('stationid');
			var newsid = $tar.data('newsid');
			
			$.publish('need-pop-show', {x: x, y: y, stationid: stationid, newsid: newsid });
		});
		$.subscribe('charactor-mouseout', function (e) {
			$.publish('need-pop-hide');
		});
		$.subscribe('news-pop-mousein',function(e){
			
		});
		$.subscribe('news-pop-mouseout',function(e){
			$.publish('need-pop-hide');
		});
	})($);

	//1.6 这里的大家也做... 左右点击
	var btnNum = 0;
	$('.people-zuo .title p b').on('click', function (e) {
		var content = $(this).parents('.title').siblings('.content-wrap'),
					contentLeft = parseInt(content.css('margin-left')),
					ulLen = content.children('ul').length,
					ulWidth = 198;
		if ($(this).hasClass('left')) {
			if (btnNum >= 0)
				return;
			btnNum++;
		} else {
			if (btnNum <= 1 - ulLen)
				return;
			btnNum--;
		}

		content.stop().animate({
			'margin-left': parseInt(btnNum * ulWidth)
		}, 200);
	});


	//4.像素风新鲜事查看过滤 --- 目前直接翻页
	$('.post-news .title-list li').on('click', function (e) {
		$(e.currentTarget).children('p').addClass('active');
		$(e.currentTarget).siblings().children('p').removeClass('active');
	});


	//--------------------------------------------------------------------------------- hover 悬浮效果
	//IE6 不支持非 a 标签的 :hover ，故此用 js 实现
	if ($.browser.msie && parseInt($.browser.version) === 6) {
		$('.line-sel-pull-down dd').add('.station-sel-pull-down ul li').add('.label-sel-pull-down ul li').hover(function (e) {
			$(this).addClass('even');
		}, function (e) {
			$(this).removeClass('even');
		});
	}
});