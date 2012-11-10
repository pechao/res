jQuery(function ($) {
	
	xq.onDocClick(function (e) {
		var $tar = $(e.target);
		var clear_all_pop = $('.pop-follow');
		if (clear_all_pop.has($tar).length == 0 && !$('.op>.btn').is($tar)) {
			clear_all_pop.hide();
		}
	});

	//为什么写这一段代码？
	//var citySel = $('#city-sel');
	//$('.sixin-wrap .title .btn').click(function (e) {
	//	xq.utils.pop(citySel);
	//	citySel.show();
	//});

	//$('#city-sel .top i').click(function (e) {
	//	citySel.hide();
	//});

	//===================================================私信，列表页
	//hover 效果背景色
	$('.reply-single').hover(function (e) {
		$(e.currentTarget).addClass('on').find('.reply-btn').css('display','block');
	}, function (e) {
		$(e.currentTarget).removeClass('on').find('.reply-btn').css('display', 'none');
	});
	//查看私信详细
	$('.reply-single').on('click', function (e) {
		$(e.currentTarget).find('.open-detail').get(0).click();
	});
	//$('#aa').trigger('click');
	//===================================================私信，详细页
	$('.friend-reply .reply-btn').on('click', function (e) {
		$.publish('reply-btn-in-mail-detail-page');
	});
	$.subscribe('reply-btn-in-mail-detail-page', function (e) {
		$('.reply-area .input-area textarea').focus();
	});
	//自动聚焦到回复框
	$.publish('reply-btn-in-mail-detail-page');

	//字数限定 
	var str_limit = 300;
	$('.input-area textarea').on('keyup', function (e) {
		var val = $.trim($(this).val());
		if (val.length > 300) {
			val = val.substr(0, str_limit);
			$(this).val(val);
		}

		$('#char_left').text(str_limit - val.length);
	});

	//点击发送按钮
	$('button.send-btn').on('click', function (e) {
		var $textarea = $('.reply-area .input-area textarea');
		var val = $textarea.val();
		if ($.trim(val) === '') {
			$.publish(xq.E.EMPTY_VALUE, { $target: $textarea });

			e.preventDefault();
		}
	});


	$.subscribe(xq.E.EMPTY_VALUE, function (e) { });


	//===================================================通知，列表页

	$('.op .btn').on('click', function (e) {
		$(e.target).siblings('.pop-follow').show();
	});

	//$('.pop-follow .sure').on('click', function (e) {});

	$('.pop-follow .cancel').on('click', function (e) {
		e.preventDefault();
		$.publish('clear-all-unread-hide');
	});

	$.subscribe('clear-all-unread-hide', function (e) {
		$('.pop-follow').hide();
	});

});