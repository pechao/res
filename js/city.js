jQuery(function ($) {
	
	//刷新线路之后需要重新绑定
	xq.fn.add('bind-each-line-in-one-time', function (lineDom) {
		//1. 活动信息 的 hover（生活，娱乐，美食等）
		lineDom.find('.event li').not('.hangout').hover(function (e) {
			var $tar = $(e.currentTarget);
			var data = $tar.data('action');
			$tar.addClass('active');
			if (!$tar.hasClass('more')) {
				var hangout = $tar.siblings('.hangout');
				//有可能其他的event正在加载中，不过先隐藏，反正数据是存储了的
				hangout.find('.refresh').removeClass('loading');
				hangout.find('.cnt span').text(data.station);
				hangout.find('.cnt a').text(data.content).attr('href', data.url);
				$tar.after(hangout).siblings().removeClass('active');
			}
		}, function (e) {
			var $tar = $(e.currentTarget);
			$tar.hasClass('more') && $tar.removeClass('active');
		});

		//2. 刷新 活动信息
		lineDom.find('.event .refresh').on('click', function (e) {
			xq.fn.exec('load-new-event', $(e.target));
		});

		//3. 点击显示线路下拉 --- 下拉三角形
		lineDom.find('.line-change b').on('click', function (e) {
			var list = $(e.target).siblings('ul');
			list.is(':hidden') ? list.show() : list.hide();
		});

		//4. 点击具体的某条线路
		lineDom.find('.line-change li').on('click', function (e) {
			var $tar = $(e.currentTarget);
			$tar.parent().hide();
			xq.fn.exec('load-new-line', $tar);
		});
		//5. 随机查看某条线路
		lineDom.find('.line-title .refresh').on('click', function (e) {
			xq.fn.exec('load-new-line', $(e.target));
		});

		//6. 发布征人
		lineDom.find('.event .pub-btn').on('click', function (e) {
			//未登录
			if (!xq.isLoginUser()) {
				xq.fn.exec('show-pop-log');
				return;
			}
			xq.fn.exec('post-hangout-handler', e);
		});
	});
	xq.fn.exec('bind-each-line-in-one-time', $('.line-block'));

	//点击整页右上角的“换一批”按钮
	$('#city-info .refresh-lines a').on('click', function (e) {
		$.get(xq.config.get('refresh-all-line'), $(this).data('qs'), function (html) {
			var bigBrother = $('#city-info');
			var $h = $(html);
			xq.fn.exec('bind-each-line-in-one-time', $h.find('.line-block'));
			bigBrother.siblings().remove().end().after($h);
		});
	});

	//II. 取消发布
	$('#post-hangout .btn-cancle').on('click', function (e) {
		$('#post-hangout').hide();
	});

	//隐藏线路选择的下拉框--每个block的左上角
	xq.onDocClick(function (e) {
		var $tar = $(e.target);
		var len = $('.line-change ul').has($tar).length;
		if (len != 0 || $tar.is('.line-change b')) {
			//点击了 <li>
			var ul_li = $tar.parents('ul');
			//点击了 <b>
			var ul_b = $tar.siblings('ul');
			$('.line-change ul').not(ul_b).not(ul_li).hide();
		} else {
			$('.line-change ul').hide();
		}
	});

	//加载其他线路的信息
	xq.fn.add('load-new-line', function (dom) {
		//现在没有“随机看看”的按钮了，只有li直接选中某线路
		var masterid = dom.data('masterid');
		dom.parents('.line-block').hide();
		$(xq.f('.line-block[data-masterid={0}]', masterid)).show();
		
		return;
		//----------现在把所有的线路都放到页面上隐藏，不用ajax了
		var isRefresh = dom.hasClass('refresh');
		var refresh = isRefresh ? dom : dom.parents('.line-change').siblings('.refresh');
		//start
		refresh.addClass('loading');
		$.get(xq.config.get('refresh-city-line'), {
			action: 'refresh',
			type: refresh.siblings('h4').attr('class'),
			master_id: isRefresh ? 0 : dom.data('masterid')
		}, function (html) {
			//success
			refresh.removeClass('loading');
			var line_block = $(html);
			xq.fn.exec('bind-each-line-in-one-time', line_block);
			dom.parents('.line-block').before(line_block).remove();

		});
	});

	//

	//加载其他 类型的 event
	xq.fn.add('load-new-event', function (btn) {
		//start
		btn.addClass('loading');
		var target = btn.parents('li').prev();
		$.getJSON(xq.config.get('refresh-city-event'), {
			type: target.data('action').type,
			master_id: btn.parents('.line-block').data('masterid')
		}, function (json) {
			//success
			target.data('action', _.extend(target.data('action'), json));
			btn.removeClass('loading');
			if (btn.parents('li').prev().is(target)) { //有可能在加载的过程中去看别的 event 了
				btn.siblings('span').text(json.station);
				btn.siblings('a').text(json.content).attr('href', json.url)
			}
		});
	});

	//==============================================================
	//==============================================================发布征人新鲜事
	//==============================================================
	//==============================================================
	
	xq.fn.add('post-hangout-handler', function (e) {
		var $tar = $(e.target);
		var block = $tar.parents('.line-block');
		var master = {
			master_id: block.data('masterid'),
			master_name: block.find('h4 a').text()
		}
		var widget = $('#post-hangout').show();
		widget.children().show()

		xq.fn.exec('line-select-update-setdata', master);
		$.publish('whereUrl.fetchRemote', { url: $tar.siblings('.cnt').children('a').attr('href'), isRandom: false });
		xq.utils.pop(widget);
	});

});