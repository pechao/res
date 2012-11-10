//页面期间，实时获取新通知

//define(function (require, exports, module) {
(function (exports, $, _, xq, win, doc, undefined) {

	/*
	* constructor options: { node: jqElem, url: String }
	*/
	var Notify = $.inherit(xq.Update, {
		update: function (json) {
			var notify = json.notify;
			var message = notify.message;
			var notify = notify.notify;
			var total = message + notify;
			var numEl = this.node.find('.nums');
			var notifyEl = this.node.find('p.last span');
			var messageEl = this.node.find('p.first span');

			total == 0 ?
			numEl.addClass('nonews').find('span').text('') :
			(total > 99 && (total = 99), numEl.removeClass('nonews').find('span').text(total));
			notifyEl.text(notify);
			messageEl.text(message);
		}
	}, {});

	$(function ($) {
		var notify = new Notify({
			node: $('#notify'),
			url: xq.config.get('fetchUnreadNotify')
		});
	});

})({}, jQuery, _, xq, window, document);
//})