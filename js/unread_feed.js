//页面期间，实时获取新的feed

//define(function (require, exports, module) {
(function (exports, $, _, win, doc, undefined) {
	
	var __template_popcount = '<b class="unread-item-count"><i><%= count %></i></b>';
	var __template_weiboStyle = '<a id="new-feed-bar" href="javascript:void(0)" onclick="location.reload()"><b>有 <%= count %> 条新动态，点击查看</b></a>';
	
	var getTypeFromClassRe = /tab_([^\s]+)/;
	/*
	* constructor options: { node: jqElem, url: String }
	*/
	var Feed = $.inherit(xq.Update, {
		update: function (json) {
			var liEls = this.node.find('ul>li');
			var currentType = this.node.find('.active').parent().attr('class').match(getTypeFromClassRe)[1];
			var currentCount;
			liEls.each(_.bind(function (i, el) {
				var arg = arguments;
				var node = $(el);
				var type = node.attr('class').match(getTypeFromClassRe)[1];
				var count = json.feed[type];

				if (currentType == type) {
					currentCount = count;
				}else{
					node.find('b').remove();
					if (count == 0) return;
					node.append(_.template(__template_popcount, { count: count }));
				}
			}, this));

			$('#new-feed-bar').remove();
			if (currentCount == 0) return;
			this.node.after(_.template(__template_weiboStyle, { count: currentCount }));
		}
	}, { });



	$(function ($) {
		var unreadFeed = new Feed({
			url: xq.config.get('fetchUnreadFeed'),
			node: $('.main-info-part')
		});
	});

	return Feed;

})({}, jQuery, _, window, document);
//});