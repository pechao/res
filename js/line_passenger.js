jQuery(function ($) {

	//0. 线路圈乘客，点击显示面板 --- 好友聚合页 | 城内线路页 需要
	//$('.line-passengers .title-info').toggle(function () {
	//	var content = $(this).siblings('.content');
	//	content.find('.page-number').show();
	//	content.find('.li:gt(5)').show();
	//}, function () {
	//	var content = $(this).siblings('.content');
	//	content.find('.page-number').hide();
	//	content.find('.li:gt(5)').hide();
	//});
	$('.line-passengers .title-info').on('click', function (e) {
		var $tar = $(e.currentTarget);
		var $wrap = $tar.siblings('.content');
		if ($wrap.hasClass('mode1')) {
			$wrap.removeClass('mode1');
		} else {
			$wrap.addClass('mode1');
		}
	});

	//翻页查看后，缓存下来，不必在下次翻页时请求相同的ajax
	var linePassenger = {};
	var container = $('.line-passengers .content');

	//之前的这个翻页使用的 zuo.pages.js 一个jQuery插件形式，但翻页拆开来写吧，不同地方的翻页分开写
	//此处就是 线路圈乘客的 小翻页
	$.subscribe('bind-line-passengers', function (e) {
		$('.line-passengers .page-number').on('click', 'a', function (e) {
			var $tar = $(e.target);
			var page = parseInt($tar.text(), 10);
			var $current = $tar.siblings('.current');
			if ($tar.hasClass('prev')) {
				page = parseInt($current.text(), 10) - 1;
			} else if ($tar.hasClass('next')) {
				page = parseInt($current.text(), 10) + 1;
			}

			var formData = _.extend({
				'page': page
			}, $tar.parent().data('page'));

			if (linePassenger[page]) {
				loadSucess(linePassenger[page]);
			} else {
				//加载中
				$.publish('load-line-passengers-start');
				$.get(xq.config.get('getMembers'), formData, function (html) {
					linePassenger[page] = html;
					loadSucess(html);
				});
			}

			function loadSucess(html) {
				var $dom = $(html);
				container.empty().append($dom);

				$.publish('bind-new-user-that-has-card', { $el: $dom.find('.user-card') });
				$.publish('bind-line-passengers');

				$.publish('load-line-passengers-success');
			}
		});
	});
	$.publish('bind-line-passengers');

	$.subscribe('load-line-passengers-start', function () {
		$('.html5loading').slideDown();
	});

	$.subscribe('load-line-passengers-success', function (e) {
		$('.html5loading').slideUp();
	});

	//
});