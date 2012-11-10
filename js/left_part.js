jQuery(function ($) {
	//1. 浏览历史
	(function () {
		$('.browse-history').find('li:gt(2)').not('.more').hide();
		$('.browse-history li.more a').on('click', function (e) {
			e.preventDefault();
			$('.browse-history li').show();
			$('.browse-history li.more').hide();
		});
	})();
});