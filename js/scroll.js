$(function () {
	//----------------------目前这种用 config 配置的方法，在页面上只有一个滚动条的时候能正常工作，超过一个的话，共用一个配置，肯定会出错。到时候需要修改为  ： new Function(); 的方式来实现。
	//----------------------还有发布的自定义事件，也要注意命名空间以便区分。
	var scrollbar = {
		//水平滚动条
		hor: {
			config: {
				speed: 200,
				stationWidth: undefined,
				scrollbarElem: undefined,
				scrollbarWidth: undefined,
				scrollbarWrapElem: undefined,
				scrollbarWrapWidth: undefined,
				contextElem: undefined,
				contextWrapElem: undefined,
				contextWidth: undefined,
				contextWrapWidth: undefined
			},
			initialize: function (elem) {
				elem = $(elem);

				var c = this.config,
					contextWrap = c.contextWrapElem = $('#' + elem.attr('for')),
					context = c.contextElem = contextWrap.find('.scroll-content'),
					contextWrapWidth = c.contextWrapWidth = xq.utils.getWidth(contextWrap, false, false, false),
					contextWidth = c.contextWidth = this._getContentWidth(context),
					scrollWrapWidth = c.scrollbarWrapWidth = xq.utils.getWidth(elem, false, false, false),
					barWidth = c.scrollbarWidth = contextWidth > contextWrapWidth ? parseInt(contextWrapWidth / contextWidth * scrollWrapWidth) : false;

				c.scrollbarWrapElem = elem;
				c.scrollbarElem = elem.find('.scrollbar');
				c.stationWidth = xq.utils.getWidth(c.contextElem.find('li').eq(0));

				this.recalcWidth();
			},
			recalcWidth: function () {
				///<summary>计算水平滚动条的宽度</summary>
				///<param name="elem" type="Element">滚动条区域 .scrollbarWrap 元素</param>
				var c = this.config;
				this._setBarWidth(c.scrollbarWidth, c.scrollbarElem);
			},
			animate: function (percent) {
				///<summary>缓动滚动到</summary>
				///<param name="to" type="Number">0-1的值</param>
				var c = this.config,
					thebarLeft = (c.scrollbarWrapWidth - c.scrollbarWidth) * percent,
					contextLeft = (c.contextWrapWidth - c.contextWidth) * percent;

				if (thebarLeft <= 0)
					return;
				c.contextElem.stop().animate({ 'margin-left': contextLeft }, this.config.speed);
				c.scrollbarElem.stop().animate({ 'left': thebarLeft }, this.config.speed);

			},
			animateByStationIndex: function (index) {
				///<summary>缓动滚动到</summary>
				///<param name="to" type="Number">0-1的值</param>
				var c = this.config,
					left = index * c.stationWidth,
					percent = left / (c.contextWidth - c.contextWrapWidth);
				percent = percent > 1 ? 1 : (percent < 0 ? 0 : percent);
				xq.log(percent);
				this.animate(percent);
			},
			_getScrollPercent: function (elem) {
				///<summary>根据滚动条的位置，获取滚动的百分比</summary>
				///<param name="elem" type="Element">scrollbarWrap 这个元素</param>
				///<returns type="Number" />
				elem = $(elem);
				var thebar = elem.find('.scrollbar'),
					///<var>可滚动区域的长度</var>
					scrollableWidth = this.config.scrollbarWrapWidth - this.config.scrollbarWidth;

				return parseInt(thebar.css('left')) / scrollableWidth;
			},
			_scrollThebar: function (percent) {
				///<summary>滚动-滚动条</summary>
				///<param name="percent" type="Number">0--1,滚动的百分比</param>
				//--------------------------------------------------------------------暂时无用
				var c = this.config,
					thebarLeft = (c.scrollbarWrapWidth - c.scrollbarWidth) * percent;

				if (thebarLeft <= 0)
					return;
				c.scrollbarElem.css({ 'left': thebarLeft });
			},
			_scrollContent: function (percent) {
				///<summary>滚动-内容区域</summary>
				///<param name="percent" type="Number">0--1,滚动的百分比</param>
				var c = this.config,
					contextLeft = (c.contextWrapWidth - c.contextWidth) * percent;

				if (contextLeft >= 0)
					return;
				c.contextElem.css({ 'margin-left': contextLeft });
			},
			_getBarWidth: function (elem) {
				///<summary>获取bar的宽度</summary>
				///<param name="elem" type="Element">scrollbarWrap元素</param>
				///<returns type="Number" />
				return $(elem).find('.scrollbar').width();
			},
			_setBarWidth: function (width, elem) {
				///<summary>设置滚动条bar的宽度，因为左右两侧圆角有宽度，函数内部会处理这些事情</summary>
				///<param name="width" type="Number">整个 scrollbar 的宽度值</param>
				///<param name="elem" type="Element">.scrollbar 这个元素</param>
				elem = $(elem);
				var leftWidth = $(elem).find('.left').width(),
						rightWidth = $(elem).find('.right').width();
				if (width) {
					elem.find('.middle').width(width - leftWidth - rightWidth);
					elem.show();
				} else {
					elem.hide();
				}
			},
			_getContentWidth: function (elem, ignoreLastMPB) {
				///<summary>计算滚动区域 .scrollContent（一般为ul元素）的宽度</summary>
				///<param name="elem" type="Element">.scroll-content 元素</param>
				///<param name="ignoreLastMPB" type="Boolean">忽略最后一个元素的 margin,padding,border宽度，默认为真</param>
				elem = $(elem);
				if (undefined === ignoreLastMPB)
					ignoreLastMPB = true;

				var paddingL = parseInt(elem.css('padding-left')),
						paddingR = parseInt(elem.css('padding-right')),
						childWidth = 0,
						children = elem.children();
				children.each(function (index, ele) {
					//ele = $(ele);
					//childWidth += (ele.width() + parseInt(ele.css('padding-left')) + parseInt(ele.css('padding-right')) + parseInt(ele.css('border-left-width')) + parseInt(ele.css('border-right-width')));
					childWidth += (ignoreLastMPB && index !== children.length - 1) ?
									   xq.utils.getWidth($(ele)) :
									   xq.utils.getWidth($(ele), false, false, false);
				});
				return paddingL + paddingR + childWidth;
			}
		},
		/// <field type = 'Object'>垂直滚动条.</field>
		ver: {
		}
	};

	//2. 横向滚动条
	scrollbar.hor.initialize($('.scrollbar-wrap-hor'));
	
	$('.scrollbar-wrap-hor .scrollbar').draggable({
		'containment': 'parent',
		'start': function (e, ui) {
			$.publish('scrollbar.horizontal.drag.start', e, ui);
		},
		'drag': function (e, ui) {
			$.publish('scrollbar.horizontal.drag.ing', { 'event': e, 'scrollElement': ui.helper });
		}
	});

	//监听拖拽事件
	$.subscribe('scrollbar.horizontal.drag.ing', function (e) {
		var elem = e.scrollElement.parent(), that = scrollbar.hor;
		var percent = that._getScrollPercent(elem);

		that._scrollContent(percent, elem);
	});

	//测试，动画滚动
	//setTimeout(function () {
	//    //scrollbar.hor.animate(0.2);
	//    scrollbar.hor.animateByStationIndex(1);
	//}, 1000);
});