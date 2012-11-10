//垂直滚动条
(function () {
	var ScrollbarV = function(scrollarea){
		var percent = 0;
		var distance = 20;
		var totalHeight;
		var $scrollarea;

		$scrollarea = $(scrollarea);
		this.$scrollarea = $scrollarea;

		//把实例都绑定到DOM上去，免得找不着了
		$scrollarea.data('scroll-object', this);

		//首先计算滚动条的高度
		$.publish('calculate-scrollbar-height', { '$scrollarea': $scrollarea });
		

		$scrollarea.find('.scrollbar').draggable({
			'containment': 'parent',
			'start': function (e, ui) {
				var barHeight = $(e.target).height();
				var bgHeight = $(e.target).parent().height();
				totalHeight = bgHeight - barHeight;
			},
			'drag': function (e, ui) {
				percent = ui.position.top / totalHeight;
				scrollContent(percent);
			}
		});
		//$scrollarea.find('.scrollbar-wrap').droppable({ drop: function (e, ui) { } });
		//绑定滚动条的鼠标滚轮事件
		$scrollarea.on('mousewheel', function (e, delta) {
			e.preventDefault();
			var containerHeight = $(this).height();
			var contentHeight = $(this).find('.scroll-content').height();
			var distanceInPercent = distance / (contentHeight - containerHeight);

			percent -= distanceInPercent * delta;
			percent = percent < 0 ? 0 : (percent > 1 ? 1 : percent);
			scrollContent(percent);
			scrollThebar(percent);
		});

		//滑动 内容区域
		function scrollContent(percent) {
			var content = $scrollarea.find('.scroll-content');
			var totalHeight = $scrollarea.height() - content.height();
			var distance = Math.round(totalHeight * percent);

			if (totalHeight < 0) {
				content.css('margin-top', distance + 'px');
			} else {
				content.css('margin-top', '0px');
			}
		};
		//滑动 滚动条 //percent = 1 表示滚动到底
		function scrollThebar(percent) {
			var content = $scrollarea.find('.scrollbar');
			var totalHeight = $scrollarea.find('.scrollbar-wrap').height() - content.height();
			var distance = Math.round(totalHeight * percent);
			content.css('top', distance + 'px');
		}
	};


	xq.page.set('ScrollbarV', ScrollbarV);


	
	$.subscribe('check-and-bind-custom-scrollbar-in-first-time', function (e) {
		//e.$scrollarea.data('scroll-object') === undefined ? new (xq.page.get('ScrollbarV'))(e.$scrollarea) : null;
		var hadBind = !!e.$scrollarea.data('scroll-object');
		hadBind || new ScrollbarV(e.$scrollarea);
	});

	//重置滚动条
	$.subscribe('reset-scrollbar-v', function (e) {
		e.$scrollarea.find('.scrollbar').css('top', 0);
	});
	
	//根据滚动的这个内容和容器大小来计算 滚动条 的高度 ===> 目前的滚动条并没有做成组件，只是一种配置
	$.subscribe('calculate-scrollbar-height', function (e) {
		var content = e.$scrollarea.find('.scroll-content');
		var scrollbarWrap = e.$scrollarea.find('.scrollbar-wrap');

		var contentHeight = content.height();
		var containerHeight = e.$scrollarea.height();

		//xq.log(scrollbarWrap.height());
		//xq.log(containerHeight);
		//xq.log($('.station-sel-pull-down .scroll-area').height());

		if (containerHeight < contentHeight) {
			var percent = containerHeight / contentHeight;
			var scrollbarHeight = scrollbarWrap.height() * percent;

			$.publish('set-scrollbar-height', { 'height': scrollbarHeight, '$scrollbar': scrollbarWrap.find('.scrollbar') });

			scrollbarWrap.find('.scrollbar').show();
		} else {
			scrollbarWrap.find('.scrollbar').hide();
		}
	});

	//设置滚动条高度
	$.subscribe('set-scrollbar-height', function (e) {
		//e.$scrollbar , e.height
		e.$scrollbar.find('.mdl').css({
			'height': Math.round(e.height - e.$scrollbar.find('top').height() - e.$scrollbar.find('btm').height())
		});
	});
})();