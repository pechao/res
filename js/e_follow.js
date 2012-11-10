/*
处理“应征”点击后的弹出窗（附加留言 弹出窗）
*/
$.subscribe('bind-follow-popup-sure-cancel',function(){
	$('#pop-follow-id').on('click', function (e) {
		$el = $(this);
		var $tar = $(e.target);
		var b_s = $tar.hasClass('sure');
		var b_c = $tar.hasClass('cancel');
		if (b_s) {
			var content = $.trim($el.find('input').val());
			var type = $el.data('type');

			if (content == '' && type == 'clew') return;

			$el.find('input').val('');
			$.publish('pop-follow-sure', { content: content, $tar: $el.data('$tar'), type: type });
			$.publish('pop-follow-send');
		}
		if (b_s || b_c) {
			$.publish('pop-follow-hide', { target: $el });
		}
	});
})



/*
处理“应征”按钮
*/
$.subscribe('bind-follow-btn-click',function(){
	$('.operates .follow>a').on('click', function (e) {
		//未登录
		if (!xq.isLoginUser()) {
			xq.fn.exec('show-pop-log');
			return;
		}
		var $tar = $(e.target);
		var $el = $('#pop-follow-id').show();
		$el.data('$tar', $tar).data('type', $tar.data('type'));
		var $btn = $(this);
		//var num = parseInt($btn.children('span').text());
		$btn.after($el);
		$el.find('input').focus().trigger('keyup');
	});
});


//弹出的“应征”留言框消失
$.subscribe('pop-follow-hide', function (e) {
	$(e.target).hide();
});

//确认“应征”
$.subscribe('pop-follow-sure', function (e) {
	var $tar = e.$tar;
	var num = $tar.data('num');
	//$tar.children('span').text(num + 1);
	var url = e.type === "follow" ? xq.config.get('followThisAction') :
				e.type === "clew" ? xq.config.get('provideClew') : null;
	var thread_id = $tar.parents('.news-list').data('threadid') || //所有的列表页的应征按钮
					$('.thread-reply input[name=thread_id]').val(); //征人详细页访客视角

	$.post(url, {
		'content': e.content,
		'thread_id': thread_id
	}, function (json) {
		json = xq.parseJSON(json);

		//后台返回当前的人数，然后，更改视图
		e.$tar.children('span').text(json.count);
	});
});