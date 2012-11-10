$(function () {
	$('.tongzhi-wrap .reply-single').toggle(function () {
		$(this).find('.content-part').show().end().find('.options i').addClass('up');
	}, function () {
		$(this).find('.content-part').hide().end().find('.options i').removeClass('up');
	});
});