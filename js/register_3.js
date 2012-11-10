(function ($) {

	var inputElem;

	var TagManager = {
		tags: {},
		element: undefined,
		init: function (selector) {
			this.element = $(selector);
			this.element.find('.label').each($.proxy(function (index, tag) {
				var tagObj = Tag.create(tag);
				this.tags[tagObj.tagName] = tagObj;
			}, this));
		},
		addTag: function(tagName){
			var tagObj = this.find(tagName);
			if (tagObj) {
				if (tagObj.isSelected) {
					return 'had-selected';
				} else {
					tagObj.add();
				}
			} else {
				var tagInfo = {
					"tagName": tagName,
					"tagCount": 0
				};
				var tagObj = Tag.create(tagInfo);
				this.tags[tagName] = tagObj;
				tagObj.add();
				this.element.append(tagObj.element);
			}
		},
		find: function (element) {
			if (typeof element === 'string') {
				return this.tags[element] || false;
			} else {
				var o = _.find(this.tags, function (tagObj) {
					return tagObj.element === element;
				});
				return o || false;
			}
		}
	}

	var Tag = function (element) {
		var __tmpl = '<table class="label"><tbody><tr><td class="bg_l"></td><td class="name"><p></p></td><td class="num"><p class="<%= className %>"><em></em></p></td></tr></tbody></table>';
		//从字符串来创建：①自定义标签 ②从下面添加到上面来
		if (element.tagCount !== undefined) {
			var tagInfo = element;
			var countIsZero = tagInfo.tagCount === 0;
			this.element = $(_.template(__tmpl, {
				'className': countIsZero ? 'loading' : '',
				'count': tagInfo.tagCount
			})).find('.name p').text(tagInfo.tagName).end().get(0);
			this.tagName = tagInfo.tagName;
			this.count = tagInfo.tagCount;
		} else {
			//初始化页面，直接用 Element 传进来
			this.element = element;
			this.tagName = $(element).find('.name p').text();
			//this.count = parseInt($(element).find('.num p').text());
		}

		this.isSelected = false;

		//这一段  click  hover 真TM 纠结啊
		$(this.element).on('click', $.proxy(function (e) {
			if (!this.isSelected) {
				this.add();
			} else {
				var num = $(this.element).find('.num');
				//点击了 x 叉号
				if (num.has(e.target).length != 0 || num.is(e.target)) {
					this.sub();
				}
			}
			//this.isSelected ? this.sub() : this.add();
		}, this));

		var __tmpl_close = '<b class="close"></b>';
		$(this.element).hover($.proxy(function (e) {
			var self = $(this.element);
			self.removeClass('label-gy');
			if (this.isSelected) {
				var p = self.find('.num p');
				p.css('width', p.width()).html(__tmpl_close);
			}
		}, this), $.proxy(function (e) {
			var self = $(this.element);
			if (!this.isSelected) {
				$(e.currentTarget).addClass('label-gy').css('width', 'auto');
			}

			self.find('.num p').text(this.count);
		}, this));

		$(this.element).find('.num').hover($.proxy(function (e) {
			$(e.currentTarget).find('.close').addClass('hover');
		}, this), $.proxy(function (e) {
			$(e.currentTarget).find('.close').removeClass('hover');
		}, this));
	}
	Tag.prototype.upgradeCount = function (count) {
		//var countNow = count;
		this.count = count;
		$(this.element).find('.num p').removeClass('loading').text(count);
		//$(this.element).find('.num').removeClass('loading');
	}
	Tag.prototype.add = function () {
		this.isSelected = true;
		$(this.element).removeClass('label-gy');
		//this.count += 1;
		//$(this.element).find('.num strong').text(this.count);

		$.publish('tag-fetch-remote-start', { 'name': this.tagName, 'op': 'add' });

		dealAncher();
	}
	Tag.prototype.sub = function () {
		this.isSelected = false;
		$(this.element).addClass('label-gy').find('.num p').text(this.count);;
		//this.count -= 1;
		//$(this.element).find('.num strong').text(this.count);

		$.publish('del-one-tag', { 'name': this.tagName });

		dealAncher();
	}
	Tag.create = function(element){
		return new this(element);
	}


	function dealAncher() {
		inputElem = $('.next-btn input');
		var selected = _.filter(TagManager.tags, function (tagObj) {
			return tagObj.isSelected === true;
		});
		selected = _.pluck(selected, 'tagName');
		inputElem.val(JSON.stringify(selected));
	}









	jQuery(function ($) {
		TagManager.init('.tags-area .label-holder');

		//1. 添加自定义标签
		$('.add-custom p input').on('keyup', function (e) {
			checkLen($(this));
			if (e.keyCode !== 13) return;

			addCustomTag($(this));
		});
		$('.add-custom button').on('click',function (e) {
			var input = $(this).siblings('p').find('input');

			addCustomTag(input);
		});

		//限制14个字符7个汉字
		var tag_limit = 14;
		function checkLen(input) {
			var customTag = input.val();

			if (xq.str.getLen(customTag) > tag_limit) {
				input.val(xq.str.subStr(customTag, tag_limit));
			}
		}

		function addCustomTag(input){
			var customTag = $.trim(input.val());
			if (customTag === '') return;

			input.val('').trigger('keyup').focus();
			//if (TagManager.addTag(e.name) == 'had-selected') return;
			TagManager.addTag(customTag);
			//setting.js 设置-兴趣 标签页需要，因为那个页没用 TagManager 这种形式
			$.publish('add-one-custom-tag', { 'name': customTag });
		}
	});

	//$.subscribe('add-one-custom-tag', function (e) {
	//	//如果已经选中了，则不必再发送 Ajax
		

	//	e.op = 'add';
	//	$.publish('tag-fetch-remote-start', e);
	//});

	$.subscribe('del-one-tag', function (e) {
		$.publish('tag-fetch-remote-start', { 'name': e.name, 'op': 'remove' });
	});

	$.subscribe('tag-fetch-remote-start', function (e) {
		var tagName = e.name;
		//$.post(xq.config.get('queryTagNameServer'), {
		//	'tag_name': tagName,
		//	'action': 'tag',
		//	'op': e.op
		//}, function (json) {
		//	if (e.op != 'add') return;
		//	json = xq.parseJSON(json);
		//	json.name = tagName;
		//	$.publish('tag-fetch-remote-succeed', json);
		//});
		if (e.op == 'add')
			$.post(xq.config.get('queryTagNameServer'), {
				tagName: tagName,
				autoAdd: 1
			}, function (json) {
				json = xq.parseJSON(json);
				json.name = tagName;
				$.publish('tag-fetch-remote-succeed', json);
			});
		else
			$.post(xq.config.get('queryTagNameServerDel'), { tagName: tagName });
	});

	$.subscribe('tag-fetch-remote-succeed', function (tagInfo) {
		var tagObj = TagManager.find(tagInfo.name);
		//非注册第三步其他页面可能报错
		try {
			tagObj.upgradeCount(tagInfo.count);
		} catch (e) { };
	});


})(jQuery);