jQuery(function ($) {
	var s = '.search-friend-widget';

	try {
		var tmpl = xq.getTmpl('search-friend-item-tmpl');
	} catch (e) { };

	var $pull = $('.search-friend-pulldown');
	var ajax_wait = 100;

	var currentInput;
	var prevVal;

	var throttledAjax = _.throttle(function (val) {
		$.publish('search-friend-fetch-remote-start');
		$.getJSON(xq.config.get('search-friend'), {
			'q': val
		}, function (e) {
			$pull.find('.one-search-user').remove();

			$pull.find('.title b').text(val);

			_(e.friend).each(function (f) {
				$pull.find('.is-friend').append(_.template(tmpl, f));
			});
			_(e.other).each(function (f) {
				$pull.find('.is-other').append(_.template(tmpl, f));
			});

			$.publish('show-search-friend-pulldown');
			$.publish('bind-new-user-that-has-card', { $el: $pull.find('.user-card') });
			xq.rebindPage('s-f-item-hover');

			$.publish('search-friend-fetch-remote-success', e);
		});
	}, ajax_wait);

	$(s).on('focus','input',function(e){
		var input = $(this);
		var val = $.trim(input.val());

		if (!input.is(currentInput)) {
			currentInput = input.get(0);

			var rel = input.parents(s).offset();

			$pull.css({
				'top': input.offset().top + input.height(),
				'left': input.offset().left
			});
		}

		if (val !== '') {
			$pull.find('.title b').text(val);
			$.publish('show-search-friend-pulldown');
		}
	});

	$(s).on('keyup', 'input', function (e) {
		var input = $(this);
		var val = $.trim($(this).val());
		if (val === '') {
			$.publish('hide-search-friend-pulldown');
			return;
		}

		if (val === prevVal) return;
		prevVal = val;
		//ajax
		throttledAjax(val);
	});

	xq.rebindPage.addAndExec('s-f-item-hover', function () {
		$pull.find('.one-search-user').hover(function (e) {
			$(e.currentTarget).addClass('hover');
		}, function (e) {
			$(e.currentTarget).removeClass('hover');
		});

		$pull.find('.one-search-user').on('click', function (e) {
			$(e.currentTarget).find('h4 a').get(0).click();
		});
	});

	xq.onDocClick(function (e) {
		if ($(e.target).is(currentInput)) return;
		if ($pull.has(e.target).length > 0) return;

		$.publish('hide-search-friend-pulldown');
	});

	$.subscribe('show-search-friend-pulldown', function () {
		$pull.show();
	});

	$.subscribe('hide-search-friend-pulldown', function () {
		$pull.hide();
	});

});