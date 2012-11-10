//define(function (require, exports, module) {
(function (exports, $, _, win, doc, undefined) {

	//var $ = require('jquery');
	//var _ = require('_');

	var Update = $.inherit({
		start: null,
		node: null,
		url: null,
		/*
		* options: { node: jqElem, url: String }
		*/
		__constructor: function (options) {
			this.start = (new Date()).getTime();
			this.node = options.node;
			this.url = options.url;
			//边界值
			this.defaultTimeout = options.defaultTimeout || 10;
			//minute
			this.minuteBorder = options.minuteBorder || 10;

			//目前后台接口还未完成
			this.url && this.frequency();
		},
		frequency: function () {
			var now = (new Date()).getTime();

			var minutes = (now - this.start) / 60000;

			//10分钟内10秒取一次，之后，多少分钟就多少秒取一次
			var timeout = parseInt(minutes <= this.minuteBorder ? this.defaultTimeout : minutes) * 1000;
			//console.log('timeout:' + timeout / 1000 + '秒', 'now: ' + (aaa = new Date).getHours() + '点' + aaa.getMinutes() + '分' + aaa.getSeconds() + '秒');
			setTimeout(_.bind(function () {
				this.fetch(now);
				this.frequency();
			}, this), timeout)
		},
		fetch: function (now) {
			$.getJSON(this.url, {rand: now}, _.bind(function (json) {
				if (json.error != 200) return;
				this.update(json);
			}, this));
		},
		update: function () {
			//各个子类来具体实现
		}
	}, {});

	xq.Update = Update;



	return Update;

})({}, jQuery, _, window, document);
//});