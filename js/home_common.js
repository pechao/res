$(function () {
	var tip = xq.data.get('globalTip');
	//1. 点击添加回复
	$.subscribe('bind-homepage-reply-box', function (e) {
		e.$el.on('click', function () {
			$(this).removeClass('focusout').addClass('focusin');
		})
	});
	$.publish('bind-homepage-reply-box', { '$el': $('.focusout') });


	//3. 回复中的 @
	$('.feed-replies .reply-box-inner .at-btn').toggle(function (e) {
		$(this).find('i').addClass('active').end().parent().siblings('.reply-at').show();
	}, function (e) {
		$(this).find('i').removeClass('active').end().parent().siblings('.reply-at').hide();
	});


	//4. 绑定 div editable 的辅助信息，输入文字后隐藏，输入为空则显示提示文字
	$.publish('editable-tips-bind', { $el: $('.editable-tips') });


	//5. 顶部发布帖子右侧的“+”--敬请期待更多
	var addon = $('.post-news .list .add-one');
	var defaultThreadWel = '敬请期待更多应用，分享更多沿线精彩';
	addon.on('mouseenter', function (e) {
		var tar = $(e.target);
		tip.setMessage(defaultThreadWel);
		tip.popTo(tar, {
			pos: 'center bottom',
			dis: 4
		}).moveArrow().show();
	});

	addon.on('mouseleave', function (e) {
		tip.hide();
	});

	
});