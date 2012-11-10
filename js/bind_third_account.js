jQuery(function ($) {
	
	$('.bind-body>div[class^=bind-tab]').on('click', 'span', function (e) {
		var index = $(this).index();
		$('')
		//$(this).parent().attr('class', 'bind-tab' + (index + 1));
		//$('form').eq(index).removeClass('hide').siblings().addClass('hide');
	});

	//切换到：绑定到新帐号
	$('.bind-tab-l').on('click', function (e) {
		$('.bind-body').addClass('bind-to-new').removeClass('bind-to-already');
	});
	//切换到：绑定到已有帐号
	$('.bind-tab-r').on('click', function (e) {
		$('.bind-body').addClass('bind-to-already').removeClass('bind-to-new');
	});

	
});