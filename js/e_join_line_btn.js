/*
如：城内线路顶部显示，是否已加入此条线路，并：点击加入，点击修改
*/
jQuery(function ($) {

	$('.page-title .about-line .joined').on('click', function (e) {
		var $tar = $(e.target);
		e.$tar = $tar;
		if ($tar.hasClass('not-join')) {
			$.publish('go-join-the-line', e);
		} else {
			$.publish('go-edit-the-line', e);
		}
	});

});

$.subscribe('go-join-the-line', function (e) {
	//View
	e.$tar.removeClass('not-join');

	//Ajax
	xq.getJSON(xq.config.get('join-the-line'), {
		'action': 'join'
	}, function (e) {});

	//
});

$.subscribe('go-edit-the-line', function (e) {
	
});