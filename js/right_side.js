//===========================================================================想去
(function ($, exports, doc) {
	return;
	var PlaneManager = function (planesSelector) {
		//planesSelector 是 每个元素的选择器，或者，已经选择好了的，元素的集合
		var planes = [];
		this.init(planesSelector);

	};
	$.extend(PlaneManager.prototype, {
		init: function (planesSelector) {
			$(planesSelector).each($.proxy(function (index, plane) {
				//xq.log(plane);

			}, this));
		}
	});
	$.extend(PlaneManager, {
		create: function (planesSelector) {
			return new this(planesSelector);
		}
	});

	var Plane = function () {
		
	}


	exports.Classes = exports.Classes || {};
	exports.Classes['PlaneManager'] = PlaneManager;

})(jQuery, window, document);







jQuery(function ($) {
	
	if (0) {
		Classes.PlaneManager.create('.want-go .content-wrap li');

		$('.want-go .content-wrap li').hover(function (e) {
			var plane_id = $(this).data('action');
			$.publish('Plane.someone-mouseenter', {
				'target': e.target,
				'plane_id': plane_id
			});
		}, function (e) { });
	}

	//左右点击滑动门 --- 本来想做成通用的，结构不同的也能用，不过 
	// 1. 在 class 相同的情况下会混淆（可解决）；
	// 2. 每个组件都要生成一个实例（还要多写一遍代码），麻烦
	var SlideLR = $.inherit({
		__constructor: function (btnl, btnr, slideEl, showWidth, totalNum) {
			this.nowPage = 0;
			btnl.on('click', $.proxy(function (e) {
				if (this.nowPage > 0) {
					this.nowPage -= 1;
					this.move(slideEl, showWidth);
				}
			}, this));
			btnr.on('click', $.proxy(function (e) {
				if (this.nowPage < totalNum - 1) {
					this.nowPage += 1;
					this.move(slideEl, showWidth);
				}
			}, this));
		},
		move: function ($el, showWidth) {
			$el.stop().animate({
				'margin-left': showWidth * (-this.nowPage)
			});
		}
	});
	////2. ========================================================
	// 右侧栏的滚动 （模块右上角左右点击滚动） --- 只要结构相同即可
	$('.right-part .title p .left').each(function () {
		var left = $(this);
		var right = left.siblings('.right');
		var wrap = left.parents('.title').siblings('.content-wrap');
		var slideEl = wrap.children();
		var showWidth = wrap.width();
		var totalNum = wrap.find('.content-inner').children().length;
		new SlideLR(left, right, slideEl, showWidth, totalNum);
	});
});
