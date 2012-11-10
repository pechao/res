var xq = window.xq || (function () {
	var _xq = {
		init: function () {

		},
		E: {
			/*统一一些公用的事件名称*/
			EMPTY_VALUE:'没有输入任何内容'
		},
		getJSON: function (url, data, callback) {
			if (typeof data === 'function') {
				callback = data;
				$.getJSON(url, fn);
			} else {
				data = _xq.detailData(data);
				$.getJSON(url, data, fn);
			}

			function fn(json) {
				try {
					if (parseInt(json.error) !== 200) {
						xq.log('ajax error');
					} else {
						callback(json);
					}
				} catch (e) { };
			}
		},
		post: function (url, data, callback) {
			if (typeof data === 'function') {
				callback = data;
				$.post(url, callback);
			} else {
				data = _xq.detailData(data);
				$.post(url, data, callback);
			}
		},
		getTmpl: function (scriptId) {
			var elem = $('#' + scriptId)
			
			var t = elem.text();
			try {
				if (t === '') t = elem.get(0).innerHTML;
			} catch (e) {
				xq.log('xq.getTmpl("' + scriptId + '") --- but get nothing!');
			};
			return t;
		},
		detailData: function (data) {
			//全部 encodeURI(),去空格
			return data;
		},
		getReplyPreText: function (username) {
			return '回复' + username + '：';
		},
		//goto: function (url) {
		//	var protocol = location.protocol;
		//	var host = location.host;
		//	if (!url.match(host)) {
				
		//	}
		//},
		logout: function (url, callback) {
			if (typeof url === 'function' || url===undefined){
				url = '/passport/logout.do.php';
			}
			callback = typeof url === 'function' ? url : callback;
			var form = $('<form action="' + url + '" method="post"><input name="action" value="logout" /></form>');
			$('body').append(form);
			form.submit();
		},
		focus: function (sel) {
			var start, end;
			start = end = $(sel).val().length;
			//聚焦文本框，并把光标放到最后一个字符
			if (sel.setSelectionRange) {
				sel.focus();
				sel.setSelectionRange(start, end);
			}
			else if (sel.createTextRange) {
				var range = sel.createTextRange();
				range.collapse(true);
				range.moveEnd('character', end);
				range.moveStart('character', start);
				range.select();
			}
		},
		getVal: function (elem) {
			//return $.trim($(elem).val())
			return _.escape($.trim($(elem).val()));
		},
		unifyTimestamp: function (timestamp) {
			if (timestamp.toString().length <= 10) {
				//PHP 按秒算的时间戳
				timestamp = timestamp + '000';
			}
			return parseInt(timestamp);
		},
		getHumanTime: function (timestamp) {
			///<summary>根据时间戳返回可读性的文字描述</summary>
			///<param name="timestamp" type="Number|String">时间戳</param>
			///<return>如：20分钟前</return>
			
			timestamp = this.unifyTimestamp(timestamp);
			var now = (new Date()).getTime();

			//秒
			var dis = Math.ceil((now - timestamp)/1000);
			if (dis < 60) {
				//一分钟内
				return dis + '秒前';
			}

			//分钟
			dis = Math.ceil(dis / 60);
			if (dis < 60) {
				//一小时内
				//return dis + '分钟前';
				return '59秒前';
			}

			//小时
			dis = Math.ceil(dis / 60);
			if (dis < 9) {
				//9小时内
				//return dis + '小时前';
				return '59分钟前';
			}

			if (dis < 24) {
				//24 小时内
				return '9小时前';
			}
			if (dis < 48) {
				return '昨天';
			}
			if (dis < 72) {
				return '前天';
			}

			var date = new Date(timestamp);
			return (date.getMonth() + 1) + '月' + (date.getDate()) + '日';
		},
		loop: function (times, callback) {
			for (var i = 0, l = times; i < l; i++) {
				callback(i);
			}
		},
		//用户输入的过滤
		filtInput: function (val) {
			//输入拼音的时候会有 （'）符号，去掉
			val = val.replace(/\'/g, '');
			//取出空格
			val = val.replace(' ', '');
			return this.escapeHTML(val);
		},
		escapeHTML: function (string) {
			return string.replace(/</g, '&#60;').replace(/"/g, '&#34;');
		},
		parseData: function (str) {
			///<summary>从字符串提取数据</summary>
			///<param name="str" type="String">格式应该为：u=2 (and) n=h</param>
			var d = str.split('&');
			var o = {};
			_.each(d, function (v) {
				var pos = v.indexOf('=');
				var key = v.substring(0, pos);
				var value = v.substring(pos + 1);
				o[key] = value;
			});
			return o;
		},
		//需要jquery
		fadeIn: function (elem, speed, callback) {
			$(elem).css('opacity', 0).show().stop().animate({ 'opacity': 1 }, speed || 200, function () {
				try {
					callback.call(this);
				} catch (e) { };
			});
		},
		fadeOut: function (elem, speed, callback) {
			$(elem).stop().animate({ 'opacity': 0 }, speed || 200, function () {
				$(this).hide();
				try {
					callback.call(elem);
				} catch (e) { };
			});
		},
		events: {
			__cache: {},
			id: 0,
			create: function (eType) {
				/// <signature>
				/// <summary>创建一个事件对象</summary>
				/// <param name="type" type="String">创建一个单一的事件对象，返回这个事件类型的字符串</param>
				/// </signature>

				/// <signature>
				/// <summary>创建一个事件对象（不建议）</summary>
				/// <param name="type" type="Array">创建一组事件对象，返回这个“虚拟集合”事件组的对象</param>
				/// </signature>

				/// <signature>
				/// <summary>创建一个事件对象</summary>
				/// <param name="type" type="Object">创建一套事件对象，返回这个层级关系清晰的事件对象</param>
				/// </signature>

				//var type = _xq.utils.getType(eType),
				//    __create = arguments.callee;
				//if (type === 'array') {
				//    var temp = {};
				//    _xq.each(eType, function (i, type) {
				//        if (_xq.utils.getType(type) !== 'string')
				//            throw new Error('custom:there only can have String in Array of the arguments.');
				//        temp[type] = type;
				//    });
				//    return temp;
				//} else if (type === 'object') {
				//    var temp = {};
				//    _xq.each(eType, function (key, value) {
				//        temp[key] = __create(value);
				//    });
				//    return temp;
				//}else {
				//    return eType.toString();
				//}
			},
			on: function (eventType, callback) {
				/// <summary>listen one Event</summary>
				/// <param name="eventType" type="String">the type of 1 event u are listening</param>
				/// <param name="callback" type="Function">the callback to exec when the event happened</param>
				//var type = _xq.utils.getType(eventType);
				if (!this.__cache[eventType]) {
					this.__cache[eventType] = {};
				}
				var id = this.id++;
				this.__cache[eventType][id] = callback;
				return id;
			},
			fire: function (eventType, datas) {
				if (this.__cache[eventType]) {
					var args = Array.prototype.slice.call(arguments, 1);
					_xq.each(this.__cache[eventType], function (id, fn) {
						fn.apply(window, args);
					});
				}
			},
			off: function () {
				/// <signature>
				/// <summary>argument: id</summary>
				/// <param name="id" type="String">the ID that returned when bind the event</param>
				/// </signature>

				/// <signature>
				/// <summary>argument: eventType</summary>
				/// <param name="eventType" type="String">remove all of the events that bind to this Type</param>
				/// </signature>
				var arg = arguments[0], type = _xq.utils.getType(arg), cache = this.__cache;
				if (type == 'number') {
					var find = false;
					_xq.each(cache, function (eventType, thisTypeObject) {
						_xq.each(thisTypeObject, function (id, fn) {
							if (arg == parseInt(id)) {
								_xq.removeEl(fn, cache[eventType]);
								find = true;
								return false;
							}
						});
						if (find)
							return false;
					});
				} else if (type == 'string') {
					delete cache[arg];
				}
			}
		},
		//$.when($.ajax(), $.ajax()).done().fail(); //$.when 可以等待多个异步操作
		multiEvents: {
			__cache: {},
			id: 0,
			on: function (eventTypes, callback) {
				/// <summary>listen Multy Event,when all the events happened, excute the Callback</summary>
				/// <param name="eventTypes" type="Array">the types of more than one events u want to listen together</param>
				/// <param name="callback" type="Function">the callback to exec when all the events happened</param>
				var that = this, id = that.id++;
				if (_xq.utils.getType(eventTypes) != 'array') {
					throw new Error('custom: the argument should be Array type.');
					return false;
				}
				this.__cache[id] = {},
				this.__cache[id]['types'] = {};
				_xq.each(eventTypes, function (i, type) {
					that.__cache[id]['types'][type] = false;
				})
				this.__cache[id]['callback'] = callback;
				return this.__cache[id];
			},
			off: function () {
			},
			fire: function (eventType) {
				var that = this;
				_xq.each(that.__cache, function (id, entObj) {
					if (that.__cache[id]['types'][eventType] != undefined) {
						that.__cache[id]['types'][eventType] = true;
						var allEventFired = true;
						_xq.each(that.__cache[id]['types'], function (type, fn) {
							if (that.__cache[id]['types'][type] === false)
								allEventFired = false;
						});
						if (allEventFired) {
							that.__cache[id]['callback']();
						}
					}
				});
			},
			reset: function () {
			}
		},
		//addStatementIntoFunction: function (fn, statement) {
		//	//重新编译这个 构造器函数
		//	var fnStr = fn.toString();
		//	var splitPos = (splitPos = fnStr.lastIndexOf('return')) != -1 ? splitPos : fnStr.lastIndexOf('}');
		//	var part1 = fnStr.substr(0, splitPos);
		//	var part2 = fnStr.substr(splitPos);
			
		//	part1 = addSemicolon(part1);
		//	statement = addSemicolon(statement);

		//	fnStr = part1 + statement + part2;
		//	return fn = eval('(' + fnStr + ')');

		//	function addSemicolon(statement) {
		//		var notOnlyWhitespace = /[^\s+]/g;
		//		var lastSemicolon = statement.lastIndexOf(';');
		//		if (lastSemicolon == -1 || statement.substr(lastSemicolon).match(notOnlyWhitespace)) {
		//			//即便是空白语句末尾加上分号也没问题：空语句
		//			statement += ';';
		//		}
		//		return statement;
		//	}
		//},
		complieFn: (function () {
			var append = function (fn, statement) {
				return complie(fn, statement, 'append');
			}
			var prepend = function (fn, statement) {
				return complie(fn, statement, 'prepend');
			}
			var after = function (fn, statement, stmtReg, isReplace) {
				return complie(fn, statement, 'after', stmtReg);
			}
			var before = function (fn, statement, stmtReg) {
				return complie(fn, statement, 'before', stmtReg);
			}
			var replace = function (fn, statement, stmtReg) {
				return complie(fn, statement, 'replace', stmtReg);
			}

			return {
				append: append,
				prepend: prepend,
				after: after,
				before: before,
				replace: replace
			}

			function complie(fn, statement, pos, reg, isReplace) {
				//重新编译这个 构造器函数
				var fnStr = fn.toString();
				var splitPos;
				if (pos == 'append' || pos == 'prepend') {
					splitPos = (pos == 'append') ?
								(splitPos = fnStr.lastIndexOf('return')) != -1 ? splitPos : fnStr.lastIndexOf('}') :
								(splitPos = fnStr.indexOf('{') + 1);

					var part1 = fnStr.substr(0, splitPos);
					var part2 = fnStr.substr(splitPos);

					part1 = addSemicolon(part1);
					statement = addSemicolon(statement);

					fnStr = part1 + statement + part2;

				} else if (pos == 'after' || pos == 'before' || pos == 'replace') {
					fnStr = fnStr.replace(reg, function (match, index, fnStr) {
						statement = ';' + statement + ';';
						var code = (pos == 'replace') ? statement : (pos == 'after' ? match + statement : statement + match)
						return code;
					});
				}
				return fn = eval('(' + fnStr + ')');
			}

			function addSemicolon(statement) {
				var notOnlyWhitespace = /[^\s+]/g;
				var lastSemicolon = statement.lastIndexOf(';');
				if (lastSemicolon == -1 || statement.substr(lastSemicolon).match(notOnlyWhitespace)) {
					//即便是空白语句末尾加上分号也没问题：空语句
					statement += ';';
				}
				return statement;
			}

		})(),
		utils: {
			rand: function (min, max) {
				return Math.floor(min + Math.random() * (max - min));
			},
			//在input,textarea 中 插入字符
			//inputDom: Element [ non-jqNode ]
			insertValue: function (inputDom, value) {
				var selection = document.selection;
				if (selection) {
					var sel = selection.createRange();
					selection.empty();
					sel.text = value;
				} else {
					var oVal = inputDom.value;
					var prev = oVal.substr(0, inputDom.selectionStart);
					var after = oVal.substr(inputDom.selectionEnd);
					var v = prev + value + after;
					inputDom.value = v;
					//return v;
				}
			},
			//autoChangeType 查找的时候是否自动转换类型 : xq.inArray([ 1, 2 ], '1', true)
			inArray: function (item, array, autoChangeType) {
				if (!autoChangeType) {
					return _.indexOf(array, item);
				} else {
					var find = -1;
					$.each(array, function (i, elem) {
						if (elem == item) {
							find = i;
							return false;
						}
					});
					return find;
				}
			},
			//转为驼峰式：
			//如：'my-name-is' --> 'myNameIs'
			toCamelCase: function (hyphenatedValue, spliter) {
				spliter = spliter || '-';
				return hyphenatedValue.replace((new RegExp(spliter + '([a-z])', 'ig')), function (m, w) {
					//return m.slice(1).toUpperCase();
					return w.toUpperCase();
				});
			},
			//从驼峰式转换格式：
			//如：'myNameIs' --> 'my-name-is'
			fromCamelCase: function (value, spliter) {
				spliter = spliter || '-';
				return value.replace(/[A-Z]/g, function (m) {
					return spliter + m.toLowerCase();
				});
			},
			//阿拉伯-->汉字
			//最大到千兆
			toChineseNumber: function (src) {
				var num, _unit, _unitLen, _unit2, _unit2Len, _tmp = [], i, len,_return,toolong;
				//个位数
				var lastNum, splitDis;
				var _floor;
				var _combineZeroReg, _combineReg2;
				//多于17位，js数字转字符串就后面全为0了
				var jsLimit = 17;

				src = src.toString();
				//太长的数字以10进制toString为转为科学计数法，如：1.5203e+25，转回正常的字符串----限制17位，不会出现科学计数法了
				//(toolong = src.match(/([\d\.]+)e\+(\d+)/)) && (src = _.string.pad(toolong[1].replace('.', ''), parseInt(toolong[2]) + 1, '0', 'right'));

				if (src.length > jsLimit) return src;

				num = src.split('');
				_unit = ['十', '百', '千'];
				_unitLen = _unit.length;
				_unit2 = ['万', '亿', '兆', '京', '垓'];
				_combineZeroReg = /(零[十|百千|万])+/g
				_combineReg2 = /零+([万|亿|兆|京|垓])/g;
				_combineReg3 = /([万|亿|兆|京|垓])[万|亿|兆|京|垓]+/g;
				_unit2Len = _unit2.length;

				//先取出个位数，最后补上即可（不在规律中）
				lastNum = toChinese(num.pop());
				//汉语读法，每4位为一个规律
				splitDis = 4;//_unit.length + 1;

				for (i = 0, len = num.length; i < len; i++) {
					_floor = Math.floor(i / splitDis);
					_tmp[_floor] = _tmp[_floor] || [];
					_tmp[_floor].push(toChinese(num[len - i - 1]));
				}

				for (i = 0, len = _tmp.length; i < len; i++) {
					_tmp[i] = dealGroup(_tmp[i], i);
				}

				//_tmp = _tmp.reverse().join('').replace(_combineZeroReg, "零");
				//return _tmp + lastNum;
				return _tmp.length ? _.map(_tmp, function (value, index) {
					var unit = _unit2[index];
					if (index == 0) value += lastNum;
					if (!value.match(/[^零]/)) value = '';
					//if (value.indexOf('零') == 0) value = value.substr(1);

					//究竟什么时候读 一十一？
					//if (value.indexOf('一十') == 0 && index == _tmp.length - 1) value = value.substr(1);
					//value = value.replace(/一(十)/g, '$1');
					//只有二位数十几去掉一，2位以上都可以留着一: 11,111,1011,10011
					value = value.replace(/^一(十)/g, '$1');
					if (index == 0) value = value.replace(/零+$/, '');
					if (value.indexOf(unit) == -1 && index < _tmp.length - 1) value = unit + value;
					return value;
				}).reverse().join('').replace(_combineReg2, '$1').replace(_combineReg3, '$1') : lastNum;


				//除了个位数，每4个一组
				function dealGroup(group, index) {
					var _remainder;
					//len 最大为4
					for (var i = 0, len = group.length; i < len; i++) {
						_remainder = i % splitDis;
						group[i] = group[i] + (_remainder < _unitLen ? _unit[i] : _unit2[index]);
					}
					return group.reverse().join('').replace(_combineZeroReg, "零");
				}

				function toChinese(num) {
					return '零一二三四五六七八九'.charAt(num)
				}
			},
			//零是被忽略掉了的，只看单位
			fromChineseNumber: function (src) {
				var num = [], unit, unit2, unit3, unitReg, unit2Reg, groupCount;
				unit = ['十', '百', '千'];
				unitReg = [/([\u4E00-\u9FA3])十/, /([\u4E00-\u9FA3])百/, /([\u4E00-\u9FA3])千/];
				unit2 = ['万', '亿', '兆', '京', '垓'];
				unit2Reg = /(.*?)(万|亿|兆|京|垓)/g;
				unit3 = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];


				num[0] = src.replace(unit2Reg, function (m, w1, w2) {
					var index = _.indexOf(unit2, w2);
					num[index + 1] = w1;
					return '';
				});
				for (var i = 0, len = num.length; i < len; i++) {
					_.isUndefined(num[i]) && (num[i] = '');
				}

				groupCount = num.length;
				num = _.map(num, function (group, index) {
					group = group.replace('零', '').replace(/([^一|二|三|四|五|六|七|八|九])十|^十()/g, '$1一十');
					var _tmp = [];
					_.each(unitReg, function (reg, index) {
						var _index = index + 1;
						group = group.replace(reg, function (m, w) {
							var _pos = _.indexOf(unit3, w);
							_tmp[_index] = _pos >= 0 ? _pos : 0;
							return '';
						});
						_tmp[_index] || (_tmp[_index] = 0);
					});
					//剩下的数就是个位数
					//console.log(group);
					_tmp[0] = group == '' ? 0 : _.indexOf(unit3, group);
					return _tmp.reverse().join('');
				}).reverse().join('');
				return parseInt(num, 10);
				//return num;
			},
			transLineNumber: function (lineName) {
				var isAlaboReg = /\d+/;
				var chineseNumReg = /(?:[零|一|二|三|四|五|六|七|八|九|十][十|百|千|万]*)+/;
				var num = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
				var util = this;
				
				if (lineName.match(isAlaboReg)) {
					lineName = lineName.replace(isAlaboReg, function (m) {
						return util.toChineseNumber(m);
					});
				} else if (lineName.match(chineseNumReg)) {
					lineName = lineName.replace(chineseNumReg, function (m) {
						return util.fromChineseNumber(m);
					});
				}
				return lineName;
			},
			isImg: function (fileName) {
				return fileName != '' && fileName.match(/\.jpg|\.bmp|\.gif|\.png|\.jpeg$/i);
			},
			getType: function (object) {
				if (object === undefined)
					return 'undefined';
				if (object === null)
					return 'null';
				return Object.prototype.toString.call(object).slice(8, -1).toLowerCase();
			},
			getWidth: function (elem, padding, border, margin) {
				///<summary>计算元素的宽度</summary>
				///<param name="elem" type="Element">要计算的元素的宽度</param>
				///<param name="padding" type="Boolean" value="true">是否计算元素的padding值</param>
				///<param name="border" type="Boolean" value="true">是否计算元素的边框宽度</param>
				///<param name="margin" type="Boolean" value="true">是否计算元素的margin值</param>
				elem = $(elem);
				padding = _.isUndefined(padding) ? true : padding;
				border = _.isUndefined(border) ? true : border;
				margin = _.isUndefined(margin) ? true : margin;

				var width = elem.width();
				if (padding)
					width += parseInt(elem.css('padding-left')) + parseInt(elem.css('padding-right'));
				if (border)
					width += (parseInt(elem.css('border-left-width')) || 0) + (parseInt(elem.css('border-right-width')) || 0);
				if (margin)
					width += parseInt(elem.css('margin-left')) + parseInt(elem.css('margin-right'));
				return width;
			},
			getHeight: function (elem, padding, border, margin) {
				///<summary>计算元素的高度</summary>
				///<param name="elem" type="Element">要计算的元素的高度</param>
				///<param name="padding" type="Boolean" value="true">是否计算元素的padding值</param>
				///<param name="border" type="Boolean" value="true">是否计算元素的边框宽度</param>
				///<param name="margin" type="Boolean" value="true">是否计算元素的margin值</param>
				elem = $(elem);
				padding = _.isUndefined(padding) ? true : padding;
				border = _.isUndefined(border) ? true : border;
				margin = _.isUndefined(margin) ? true : margin;

				var height = elem.height();
				if (padding)
					height += parseInt(elem.css('padding-top')) + parseInt(elem.css('padding-bottom'));
				if (border)
					height += (parseInt(elem.css('border-top-width')) || 0) + (parseInt(elem.css('border-bottom-width')) || 0);
				if (margin)
					height += parseInt(elem.css('margin-top')) + parseInt(elem.css('margin-bottom'));
				return height;
			},
			//即便是object，回调中也有 index
			each: function (object, callback) {
				///<summary>迭代Object,回调返回false则退出循环</summary>
				///<param name="object" type="Object">需要迭代的对象</param>
				///<param name="callback" type="Fuction">回调函数</param>
				var type = _xq.utils.getType(object);
				if (type == 'object') {
					var i = 0;
					for (var key in object) {
						var notbreak = callback.call(object, key, object[key], i++);
						if (notbreak === false)
							break;
					}
				} else if (type == 'array') {
					for (var j = 0, len = object.length; j < len; j++) {
						var notbreak = callback.call(object, j, object[j]);
						if (notbreak === false)
							break;
					}
				}
			},
			removeEl: function (ele, object) {
				var type = _xq.utils.getType(object);
				if (type == 'object') {
					_xq.each(object, function (key, value, index) {
						if (ele == value) {
							//object[key] = null;
							delete object[key];
							return false;
						}
					});
				} else if (type == 'array') {
					_xq.each(object, function (index, value) {
						if (ele == value) {
							object.splice(index, 1);
						}
					});
				}
			},
			//弹出一个层，位置是页面居中的
			pop: (function () {
				var cache = [];

				//[ isFixedPosition Boolean ] -- 是 position: fixed 还是 absolute
				//[ opt: { width, height } ]
				return function (elem, isFixedPosition, opt) {
					popInMiddleCenter(elem, isFixedPosition, opt || {});
				}

				function popInMiddleCenter(elem, isFixedPosition, opt) {
					var winWid = $(window).width(),
					winHgt = $(window).height(),
					elWid = opt.width || $(elem).width(),
					elHgt = opt.height || $(elem).height();
					var scrollY = _xq.utils.getWinScroll('y'); //window.scrollY ? window.scrollY : (window.pageYOffset ? window.pageYOffset : document.documentElement.scrollTop);

					$(elem).css({ 'top': (winHgt - elHgt) / 2 + (isFixedPosition ? 0 : scrollY), 'left': (winWid - elWid) / 2 });
				}
			})(),
			getWinScroll: function (direction) {
				var scrollX, scrollY;
				if (direction == 'x') {
					return scrollX = window.scrollX ? window.scrollX : (window.pageXOffset ? window.pageXOffset : document.documentElement.scrollLeft);
				} else {
					return scrollY = window.scrollY ? window.scrollY : (window.pageYOffset ? window.pageYOffset : document.documentElement.scrollTop); 
				}
			},
			//深拷贝，只深拷贝Object，Array
			deepCopy: function (obj) {
				var _deepCopy = arguments.callee,
					type = _xq.utils.getType(obj),
					temp;
				if (type == 'object') {
					temp = {};
					_xq.each(obj, function (key, value) {
						temp[key] = _deepCopy(value);
					});
				} else if (type == 'array') {
					temp = [];
					_xq.each(obj, function (index, value) {
						temp.push(value);
					});
				} else {
					temp = obj;
				}
				return temp;
			},
			//from：NL.js
			isChildNode: function (childEl, parentsEl) {
				var win = window, doc = document;
				if (childEl === win || childEl === doc)
					throw new TypeError('custom: the first argument must be a child Element of document.');
				while (childEl.parentNode !== doc) {
					if (parentsEl === childEl)
						return true;
					childEl = childEl.parentNode;
				}
				return false;
			}
		}
	};

	function generateGetSetVar(type){
		return (function () {
			var cache = {};
			var _getSingle = function (key) {
				if (!cache[key]) {
					xq.log('xq.' + type + '.get("' + key + '") --- but get nothing! 下面是调用堆栈：');
					try{ console.trace() }catch(ex){};
				}
				var r = {};
				r[key] = cache[key];
				return r;
			}
			var traceList = [];
			return {
				//key : String || Array
				//xq.xxx.get('') --> 返回一个 value 
				//xq.xxx.get(['', ''])-->返回一个 key , value
				'get': function (key) {
					if (traceList.length && xq.inArray(key, traceList) != -1)
						try{
							console.trace();
						} catch (e) { }
					if (_.isString(key)) return _getSingle(key)[key];

					if (_.isArray(key)) {
						var r = {};
						_.each(key, function (v) {
							_.extend(r, _getSingle(v));
						});
						return r;
					}
				},
				//xq.xxx.set('key', 'value');
				//xq.xxx.set({ 'key': 'value', 'key2': 'value2' });
				'set': function (key, value) {
					if (_.isString(key)) cache[key] = value;

					if ($.isPlainObject(key)) _.extend(cache, key);
				},
				'addTraceList': function (list) {
					traceList.concat(arguments);
				}
			}
		})();
	}

	_xq.each = _xq.utils.each;
	_xq.removeEl = _xq.utils.removeEl;
	_xq.inArray = _xq.utils.inArray;

	//后台提供的Ajax接口URL
	_xq.config = generateGetSetVar('config');
	//页面使用的，后台直接挂载到页面上的全局数据
	_xq.data = generateGetSetVar('data');
	//页面内部使用的全局变量
	_xq.global = _xq.page = generateGetSetVar('page');
	
	return _xq;
})();

///================================================================================================== 分割线 ==================================================================================================

(function (xq, $, _, win, doc) {
	var __tmpl_input = '<input type="hidden" name="<%= name %>" value="<%= value %>">';
	var __tmpl_form = '<form action="<%= action %>" method="<%= method %>"></form>';
	xq.Form = $.inherit({
		//参数：
		//	method: get | post
		//	action: url
		//	map: key : value
		__constructor: function (options) {
			options = _.extend({
				//method: 'POST'
			}, options);
			this.form = $(_.template(__tmpl_form, options));
			this.addNameValue(options.map);
		},
		addNameValue: function (map) {
			var _map = [];
			_.each(map, function (value, name) {
				_map.push(_.template(__tmpl_input, { name: name, value: value }));
			});
			this.form.append(_map.join(''));
			return this;
		},
		updateFormAttr: function (key, value) {
			var form = this.form;
			if (_.isString(key)) {
				form.attr(key, value);
			} else {
				_.each(key, function (value, name) {
					form.attr(name, value);
				});
			}
			return this;
		},
		appendTo: function (dom) {
			this.form.appendTo(dom || 'body');
			return this;
		},
		submit: function () {
			this.form.submit();
		}
	}, {
		create: function (options) {
			return new this.prototype.constructor(options);
		}
	});

	//第二批...
	//中文算两个字符
	xq.str = {
		getLen: function (str) {
			var len = 0;
			str.replace(/./g, $.proxy(function (charactor) {
				if (this.isChinese(charactor)) {
					len += 2;
				} else {
					len += 1;
				};
				return '';
			}, this));
			return len;
		},
		//从 0 开始
		subStr: function (str, len) {
			var chars = '';
			$.each(str.split(''), $.proxy(function (i, charactor) {
				if (this.isChinese(charactor)) {
					//真纠结啊，反正效果正确了：subStr('ab三四',4) => 'ab三'...... subStr('ab三四',3) => 'ab'
					if (len > 1) chars += charactor; 
					len -= 2;
				} else {
					chars += charactor;
					len -= 1;
				}
				if (len <= 0) return false;
			}, this));
			return chars;
		},
		isChinese: function (charactor) {
			return !/[^\u4e00-\u9fa5]/.test(charactor);
		}
	};

	xq.resendValidEmail = function (url, data) {
		///<summary>home.php 注册后的验证邮件</summary>

		var config = {
			text: '邮件已发送，请注意查收',
			simulateTimeout: 10
		}
		xq.post(url, data, function () {

		});

		setTimeout(succeed, config.simulateTimeout);

		function succeed() {
			$.publish('fetchRemote-success-pop-tips', { 'text': config.text });
		}
	}



	xq.format = xq.f = function (str, other_args) {
		//格式化字符串
		//如：xq.format('{0} is a {1}','he','boy') => 'he is a boy'
		var args = arguments;
		return str.replace(/\{\d\}/g, function (match) {
			var index = parseInt(match.substr(1), 10);
			return args[index + 1];
		})
	};


	// ===================================== data-timeshow 显示时间
	(function (exports) {
		var iOffset;

		//iOffset
		//serverTime
		function countdown(serverTime) {
			//调用函数：countdown(<?=NOW?> - Math.floor($.now() / 1000)); --- 但实际上，这个 减去，然后在加上，等于不用写啊...
			//var iNow = Math.floor($.now() / 1000) + iOffset;
			//iOffset = iOffset || Math.floor($.now() / 1000);
			if (!iOffset) {
				var now = Math.floor($.now() / 1000);
				iOffset = now - (serverTime || now);
			}

			//现在是服务器的 当前时间，而非本地电脑的 当前时间，因为 data('timeshow') 是用的 服务器的时间
			var iNow = Math.floor($.now() / 1000) - iOffset;

			var iLoopTime = 0;

			$("span[data-timeshow]").each(function () {

				var iTime = $(this).data("timeshow");
				var iDiff = iNow - iTime;

				if (iDiff < 3600) {
					iLoopTime = 1;
				} else if (iDiff < 86400 && !iLoopTime) {
					iLoopTime = 60;
				}

				$(this).text(timetext(iDiff));
			});

			if (iLoopTime) {
				setTimeout(countdown, iLoopTime * 1000);
			}
		}

		function timetext(iDiff) {
			var sText;
			if (iDiff < 10) {
				sText = "几秒前";
			} else if (iDiff < 60) {
				sText = Math.floor(iDiff) + " 秒前";
			} else if (iDiff < 3600) {
				sText = Math.floor(iDiff / 60) + " 分钟前";
			} else {
				sText = Math.floor(iDiff / 3600) + " 小时前";
			}
			return sText;
		}

		exports.countdown = countdown;

	})(xq);

	

	//option { replacedEl, ancherRange, start, success }
	//arg1 replacedEl: Element 此元素是需要替换的区域---ajax加载完成之后
	//arg2 [ancherRange: Element] 此元素是里面的 a 标签是加载 ajax 的触发器；可以是几个范围元素的数组，也可以是单个元素，则不必为数组
	//arg3 [start: Function] ajax 加载开始
	//arg4 [success: Function] ajax 加载完成后的回调
	xq.html5load = function (option) {
		return;
		if (!_.isFunction(window.history.pushState)) return;

		option.ancherRange = option.ancherRange || option.replacedEl;
		option.ancherRange = _.isArray(option.ancherRange) ? option.ancherRange : [option.ancherRange];
		option.start = option.start || new Function();
		option.success = option.success || new Function();

		var state = {
			'replacement': option.replacedEl.html(),
			'href': location.href,
			'title': document.title
		}
		window.history.pushState(state, '');

		//免得重新加载之后还要再次绑定这个事件
		$('body').on('click', 'a', function (e) {
			//如果 a 标签不在范围内，直接返回
			if (_(option.ancherRange).filter(function (el) { return $(el).has(e.currentTarget).length > 0; })['length'] === 0) return;

			//如果 a 标签没有 data-href 属性，直接返回
			if (!$(e.currentTarget).data('href')) return;

			e.preventDefault();
			window.scrollTo(0, 0);
			$('.html5loading').show();
			//ajax start
			option.start();

			var ajaxHref = $(e.currentTarget).data('href');

			$.get(ajaxHref, function (data) {
				//ajax success
				$('.html5loading').hide();

				state.serverData = data;
				window.history.pushState(state, ajaxHref, ajaxHref);

				option.replacedEl.empty().append($(data));

				option.success(data);
			});
		});
		//return;
		window.addEventListener('popstate', function (e) {
			if (arguments.callee.hadbind) return;
			arguments.callee.hadbind = true;

			if (_.isNull(e.state)) return;
			option.replacedEl.empty().append(e.state['replacement']);
			var state = {
				'replacement': option.replacedEl.html(),
				'href': location.href,
				'title': document.title
			}
			window.history.replaceState(state, e.state.title, e.state.href);
			option.success(e.state.serverData);
			option.replacedEl.empty().append(e.state['replacement']);
			option.success(e.state.serverData);
		});
	}

	//局部刷新之后，重新绑定页面上的事件
	xq.rebindPage = (function () {
		var cache = {};
		var _re = function (des) {
			_.each(cache[des], function (fn) {
				fn();
			});
		}

		//添加到缓存并立即执行一次这个函数
		_re.addAndExec = function (des, fn) {
			cache[des] = cache[des] || [];
			cache[des].push(fn);
			fn();
		}

		return _re;
	})();

	xq.log = function () {
		if (window.console)
			try {
				console.log.apply(console, arguments);
				console.trace();
			} catch (ex) {
				console.log(arguments[0]);
			}
	};

	//因为后台传来的有可能：
	//1. { 'au':xx }
	//2. { \n 'au': \n xx\n } -->有换行
	//3. <pre style="xx"> { xx } </pre> -->传到 iframe 里面就会出现 <pre> 标签
	xq.parseJSON = function (json_str) {
		if (!_.isString(json_str)) return json_str;
		//过滤掉 <pre> 标签
		if (/<\/pre>/i.test(json_str)) {
			json_str = $(json_str).text();
		}
		//过滤掉换行符
		json_str = json_str.replace(/\n/g, '');

		var json = '';
		try {
			json = JSON.parse(json_str);
		} catch (e) { };

		return json;
	}

	xq.debug = {
		log_empty: function (jqElem) {
			if (jqElem.length == 0) {
				xq.log('$(' + jqElem.selector + ') --- dont get this Element');
			}
		}
	};

	//获取 线路页面的 URL
	xq.getLineUrl = function (masterid, isCross) {
		var crossid = masterid;
		return _.template(xq.data.get(isCross ? 'cross_url_tmpl' : 'master_url_tmpl'), { master_id: masterid, cross_id: crossid });
	}

	//是否是登录用户
	xq.isLoginUser = function () {
		var login_user = xq.Data.User.getInstance().getInfo();
		var login = login_user && !_.isEmpty(login_user) && !login_user.debug;
		if (!login) xq.log('还没登录，不要惊奇');
		return login;
	}

	// namespace
	xq.namespace = function (ns, rootObject) {
		if (ns == '') return rootObject;
		var domains = ns.split('.');
		var current = rootObject || xq;
		for (var i = 0, len = domains.length; i < len; i++) {
			var domain = domains[i];
			if (current[domain] == undefined) current[domain] = {};
			current = current[domain];
		}
		return current;
	};

	xq.crossCity = {
		eachIdLen: 6,
		parse: function (id) {
			id = id.toString();
			var from = { id: parseInt(id.substr(0, this.eachIdLen)) };
			var to = { id: parseInt(id.substr(this.eachIdLen)) };

			return {
				from: from,
				to: to
			}
		},
		stringify: function (from, to) {
			return from.toString() + to;
		}
	};

	//缓存一些函数来执行---跨页面调用函数，避免添加到全局变量
	xq.fn = (function () {
		var cache = {};
		var waiting = {};
		var fn = {};
		fn.exec = function (name, arg) {
			cache[name] = cache[name] || [];
			arg = Array.prototype.slice.call(arguments, 1)
			var returned = [];
			_.each(cache[name], function (fn) {
				returned.push(fn.apply(window, arg));
			});
			if (waiting[name]) waiting[name].hadExecTimes += 1;
			return returned.length == 1 ? returned[0] : returned;
		};

		fn.add = function (name, fn) {
			cache[name] = cache[name] || [];
			cache[name].push(fn);

			var info = waiting[name];
			if (!info) return;
			this.exec.apply(this, info.args);
		};
		//args, waitTime, execTimes
		//[otherArgs JSON] ↓
		//[args Array arguments]回调函数执行时的参数
		//[execTimes = 0 Number] 执行几次，默认执行一次，0 表示无限次
		fn.execWhenLoad = function (name, otherArgs) {
			if (!waiting[name]) {
				otherArgs = otherArgs || {};
				otherArgs.args = otherArgs.args || [];
				otherArgs.execTimes = otherArgs.execTimes || 0;
				otherArgs.hadExecTimes = 0;
				//把name作为第一个参数
				otherArgs.args.unshift(name);
				waiting[name] = otherArgs;
			}
			if (cache[name] && (waiting[name].execTimes == 0 || waiting[name].execTimes > waiting[name].hadExecTimes))
				this.exec.apply(this, waiting[name].args);
		}

		fn.get = function () { return cache; };

		return fn;
	})();

})(xq, jQuery, _, window, document);

///================================================================================================== 分割线 ==================================================================================================

(function (xq, $, _, win, doc) {

	//异步执行 === 仅仅是对 $.when 的一个包装而已，省略一些代码
	//函数内必须要在执行完毕后添加一个字符串语句“"RESOLVE"”
	//如：...; "RESOLVE" ; ...
	xq.when = function (fn) {
		fn = xq.complieFn.prepend(fn, 'var dfd=new $.Deferred();');
		fn = xq.complieFn.replace(fn, 'dfd.resolve();', /(['"])RESOLVE\1/);
		fn = xq.complieFn.append(fn, 'return dfd.promise();');
		return $.when(fn());
	}

})(xq, jQuery, _, window, document);

///================================================================================================== 分割线 ==================================================================================================

(function (xq, $, _, window, document) {
	//全局点击事件

	var windowEventFactory = function (eventName, waitTime) {
		return (function () {
			var cache = [];
			var wait = waitTime || 100;
			var timeoutId;

			$(window).on(eventName, function (e) {
				clearTimeout(timeoutId);
				timeoutId = setTimeout(function () {
					_.each(cache, function (fn, index) {
						fn(e);
					})
				}, wait);
			});

			var on = function (fn) {
				cache.push(fn);
				return fn;
			}

			on.off = function (fn) {
				cache = _.without(cache, fn);
			};

			return on;
		})();
	}

	//窗口缩放
	xq.onResize = windowEventFactory('resize');

	//窗口滚动条事件
	xq.onScroll = windowEventFactory('scroll', 50);

	//点击文档
	xq.onDocClick = (function () {
		var cache = [];

		jQuery(function ($) {
			$(document).on('click', function (e) {
				_.each(cache, function (fn, index) {
					fn.call(e.target, e);
				});
			});
		});

		var on = function (fn) {
			cache.push(fn);
			return fn;
		}

		on.off = function (fn) {
			cache = _.without(cache, fn);
		}

		return on;
	})();


	//iframe load
	var getIframeContent = function (iframe) {
		var innerHTML;
		try {
			innerHTML = $.trim(iframe.contentWindow.document.body.innerHTML);
		} catch (e) { }
		return innerHTML;
	}
	
	//chrome等可以监听 iframe 的 onload 事件，但是IE,FF在线上（线下本地测试都正常，能正常监听到，没有这些烦人的问题）
	// IE，FF 就用轮询的方式来检测是否 onload 了
	//如果 iframe src="javascript:false" 初始化iframe之后，IE,FF的iframe的body里就会有 false 字符，而chrome为空

	//参数：
	//	iframe IFRAME
	//	callback Function			---	回调的参数为：content, iframe, args...
	//	[ args Array ]				---	需要在执行回调时使用的额外参数（把当时的参数放进这里形成闭包）
	//	[ ignoreRegExp Boolean ]	---	当load后内容匹配这个正则，则忽略
	xq.onIframeLoad = function (options) {
		// 1) <pre>空白</pre> -- iframe会自动给内容包裹 <pre></pre>标签，应该是内容不完整，不是标准的html的原因
		// 2) 空字符串
		// 3) false --- iframe 的 src="javascript:false" -- 在 FF、IE 下 innerHTML 会出现 false
		var ignoreRegExp = options.ignoreRegExp || /<pre>\s*<\/pre>|^$|false/i;
		var iframe = options.iframe;
		var callback = options.callback;
		var args = options.args || [];
		args.unshift(iframe);

		// TODO：至于 mozilla 属于 IE 类型还是 webkit 类型，之后再细看
		if ($.browser.msie || $.browser.mozilla) {
			var _id = setInterval(function () {
				var content = getIframeContent(iframe);
				if (_.isUndefined(content) || content.match(ignoreRegExp)) return;

				//只要真正有内容了，不论是什么，直接发出，具体的处理有监听函数来做
				args.unshift(content);
				callback.apply(iframe, args);
				clearInterval(_id);
			}, 1);
		} else {
			$(iframe).on('load', function (e) {
				if (!e.target) return;
				var content = getIframeContent(e.target);
				if (content.match(ignoreRegExp)) return;

				args.unshift(content);
				callback.apply(iframe, args);
			});
		}
	}

	//xq.onHashchange ----------> xq.Hash.onchange
	
	
})(xq, jQuery, _, window, document);

///================================================================================================== 分割线 ==================================================================================================


/**
* @ target 管理queryString
*
* @ method parse		---	解析
* @ method stringify	---	序列化
* @ method add			---	添加
* @ method del			---	删除
*/
(function (xq, $, _, window, document) {

	xq.queryString = {
		parse: function (href) {
			href = href || location.href;
			return this._parseQS(this._splitHref(href).queryString);
		},
		//dict 会 全部替换 href 里面的 queryString
		//1. .add(key, value, href)
		//2. .add(dict, href)
		stringify: function (dict, href) {
			if (!$.isPlainObject(dict)) {
				var k = dict;
				dict = {};
				dict[k] = arguments[1];
				href = arguments[2];
				isReplace = arguments[3];
			}
			href = href || location.href;
			href = this._splitHref(href);
			href.queryString = this._stringifyQS(dict);

			return href.toString();
		},
		//isReplace 是指：是否替换相同键名的值
		//1. .add(key, value, href, isReplace)
		//2. .add(dict, href, isReplace)
		add: function (dict, href, isReplace) {
			if (!$.isPlainObject(dict)) {
				var k = dict;
				dict = {};
				dict[k] = arguments[1];
				href = arguments[2];
				isReplace = arguments[3];
			}
			(_.isNull(isReplace) || _.isUndefined(isReplace)) && (isReplace = true);

			href = href || location.href;
			href = this._splitHref(href);
			if (isReplace) {
				href.queryString = this._stringifyQS(_.extend(this._parseQS(href.queryString), dict));
			} else {
				href.queryString = href.queryString + '&' + this._stringifyQS(dict);
			}

			return href.toString();
		},
		del: function (key, href) {
			href = href || location.href;
			href = this._splitHref(href);
			href.queryString = this._parseQS(href.queryString);
			delete href.queryString[key];
			return href.toString();
		},
		_splitHref: function (href) {
			var a = href.split('?');
			var b = a[1] && a[1].split('#');
			var that = this;
			href = {
				local: a[0],
				queryString: b && b[0],
				hash: _.isUndefined(b) ? undefined : b[1],
				toString: function () {
					var qs = $.isPlainObject(this.queryString) ? that._stringifyQS(this.queryString) : this.queryString;
					return this.local + (_.isUndefined(qs) ? '' : '?' + qs) + (_.isUndefined(this.hash) ? '' : '#' + this.hash);
				}
			};
			return href;
		},
		_parseQS: function (queryString) {
			if (_.isUndefined(queryString)) return {};
			var qs = queryString.split('&');
			var t = {};

			_.each(qs, function (kv) {
				var a = kv.split('=');
				var key = a[0];
				t[key] = a[1];
			});

			return t;
		},
		_stringifyQS: function (obj) {
			var qs = '';
			var i = 0;
			_.each(obj, function (value, key) {
				i++ == 0 ? null : (qs += '&');
				qs += key;
				if (_.isUndefined(value)) return;
				qs += '=' + value;
			});
			return qs;
		}
	};

})(xq, jQuery, _, window, document);

///================================================================================================== 分割线 ==================================================================================================

//注意：使用 "\" 进行转义，但，在书写源代码的时候， \ 本身就是转义字符，所以，需要写成："\\?" 来表示 "\?"
/**
* @ target 管理 hash --- 默认分隔符为 "?"，格式为：#a=b?c=d?name=david?blog=//goluffy.com/，如果字符中需要有 分隔符(?) ，则用 \ 转义：\(?)
*
* @ method parse		---	解析
* @ method stringify	---	序列化
* @ method add			---	添加
* @ method del			---	删除
*/
(function (xq, $, _, win, doc) {

	var Hash = {};
	// IE6/IE7(包括IE8的IE7兼容模式)需要用到iframe
	var useIframe = (!!window.ActiveXObject && (!window.XMLHttpRequest || (!!window.XMLHttpRequest && (!document.documentMode || document.documentMode === 7))));
	var hashWin, hashDoc, hashBody;
	var blankHTML = '/empty.html';
	var iframe;

	var defaultSeparator = '?';
	var _getLocHash = function () {
		try{
			return hashBody ? hashBody.innerHTML : win.location.hash.substr(1);
		} catch (e) {
			return win.location.hash.substr(1);
		}
	}


	//	例如：
	//	#na\?me=1+2?age=20?url=a.com/blog/\?a=b?link=b.com/index.php\?hold=shit?class=new\?
	//	-> { "na?me": "1+2", "age": "20", "url": "a.com/blog/?a=b", "link": "b.com/index.php?hold=shit", "class": "new?" }

	// [ hashString String ]		---	默认为当前文档的 hash
	// [ separator = '?' String ]	---	hash键值对的分隔符
	Hash.parse = function (hashString, separator) {
		separator = separator || defaultSeparator;
		hashString = hashString || _getLocHash();

		//在正则中需要转义的字符 --- 是不是让它太灵活了？其实限定分隔符为问号(?)就简单多了
		var needChange = ['[', ']', '^', '$', '(', ')', '|', '{', '}', '.', '*', '\\', '?', '', '+'];
		//--/.*?[^\\]\?|.+?$/g
		var splitRe = new RegExp('.*?[^\\\\]' + (_.indexOf(needChange, separator) != -1 ? '\\' : '') + separator + '|.+?$', 'g');
		
		var oHash = {};

		var pares = hashString.match(splitRe);
		var len = pares.length;
		pares = _.each(pares, function (pare, i) {
			if (i != len - 1) pare = pare.substr(0, pare.length - 1);
			pare = pare.replace('\\' + separator, separator);
			//如果里面有多个 "=" ，以第一个为分割
			var cache = pare.split('=');
			var key = cache.shift();
			var value = cache.join('=');
			oHash[key] = value;
		});

		return oHash;
	}

	//完全根据参数来生成 hash
	//1. .stringify(key, value, separator)
	//2. .stringify(dict, separator)
	Hash.stringify = function (dict, separator) {
		if (!$.isPlainObject(dict)) {
			var key = dict;
			dict = {};
			dict[dict] = arguments[1];
			separator = arguments[2];
		}
		separator = separator || defaultSeparator;

		var result = [];
		_.each(dict, function (value, key) {
			value = value.toString().replace(separator, '\\' + separator);
			key = key.toString().replace(separator, '\\' + separator);
			result.push(key, '=', value, separator);
		});
		result.pop();
		return result.join('');
	}

	Hash.add = function (dict, hashString, separator, isReplace) {
		if (!$.isPlainObject(dict)) {
			var key = dict;
			dict = {};
			dict[key] = arguments[1];
			hashString = arguments[2];
			separator = arguments[3];
			isReplace = arguments[4];
		}
		hashString = hashString || _getLocHash();
		separator = separator || defaultSeparator;
		(_.isNull(isReplace) || _.isUndefined(isReplace)) && (isReplace = true);

		if (isReplace) {
			var oHash = hash.parse(hashString, separator);
			_.each(dict, function (value, key) {
				oHash[key] = value;
			});
			return hash.stringify(oHash, separator);
		}

		var temp = [];
		_.each(dict, function (value, key) {
			temp.push(separator, key, '=', value);
		});
		return hashString + temp.join('');
	}

	Hash.del = function (name, hashString, separator) {
		hashString = hashString || _getLocHash();
		separator = separator || defaultSeparator;
		var oHash = hash.parse(hashString, separator);
		delete oHash[name];
		return hash.stringify(oHash, separator);
	}



	//	http:....a.php/?..#a -> a
	//	#a -> a
	//	abc -> abc
	Hash.get = function (string) {
		if (_.isUndefined(string) || _.isNull(string)) return _getLocHash();
		var index = string.indexOf('#');
		return index == -1 ? string : string.substr(index + 1);
	}

	Hash.set = function (hashString) {
		if (hashBody) {
			try{
				hashDoc.open();
				hashDoc.write([
                        '<html>',
                        '<head>',
                        '<meta http-equiv="Pragma" content="no-cache" />',
                        '<meta http-equiv="Expires" content="-1" />',
                        '<script>',
                        (document.domain != location.hostname) ? '       document.domain="' + document.domain + '";' : '',
                        '       function pageLoad() {',
                        '               try { parent.xq.Hash._onhashchange("' + hashString + '");parent.location.hash="' + hashString + '" } catch(e) {}',
                        '       }',
                        '</script>',
                        '</head>',
                        '<body onload="pageLoad()">' + hashString + '</body>',
                        '</html>'
				].join(''));
				hashDoc.title = doc.title;
				hashDoc.close();
			} catch (e) { }
		} else {
			win.location.hash = hashString;
		}
		return Hash;
	}


	var onhashchange;
	//-------------------- TODO: 在 IE67 下还不行，有待再仔细研究---原理明白了，好好再弄弄
	Hash.onchange = (function () {

		var handlers = [];
		Hash._onhashchange = onhashchange = function (e) {
			_.each(handlers, function (handler) {
				handler((e && e.newURL) || e);
			});
		}

		var version = parseInt($.browser.version, 10);
		if (useIframe) {

			var prevHash = _getLocHash();
			if (useIframe) {
				iframe = doc.createElement('iframe');
				iframe.style.display = 'none';
				xq.onIframeLoad({
					iframe: iframe,
					//所有load否触发，而不ignore；因为content是trim过的，所以不可能匹配以空格开头的内容
					ignoreRegExp: /^\s/,
					callback: function (content, iframe) {
						hashWin = iframe.contentWindow;
						hashDoc = hashWin.document;
						hashBody = hashDoc.body;
						Hash.set(prevHash);
					}
				});
				$(function ($) {
					$(doc.body).append(iframe);
					//if (useIframe) Hash.set(prevHash);
				});
			}
		} else {
			if (window.attachEvent) {
				window.attachEvent('onhashchange', onhashchange);
			} else {
				window.addEventListener('hashchange', onhashchange, false); 
			}
		}

		var on = function (handler) {
			handlers.push(handler);
			return handler;
		}
		on.off = function (handler) {
			handlers = _.without(handlers, handler);
		}

		return on;

	})();

	xq.onHashchange = Hash.onchange;
	xq.Hash = Hash;

})(xq, jQuery, _, window, document);


///================================================================================================== 分割线 ==================================================================================================


/**
* @ target 管理cookie
*
* @ method setCookie
* @ method getCookie
* @ method killCookie
*/
(function (xq, $, _, window, document) {
	
	xq.cookie = null;

	//默认十年
	var DEFAULT_HOURS = 24 * 30 * 12 * 10;
	var DEFAULT_DOMAIN = '.zuo.com';
	var COOKE_DOMAIN = 'cookie_domain';
	//去掉 cookie 分号后面的一个空格
	var _trim = function (str) {
		return str.replace(/;\s/g, ';');
	}
	var set = function (name, value, domain, hours, path, secure) {
		hours = hours || DEFAULT_HOURS;
		path = path || '/';
		domain = domain || xq.config.get(COOKE_DOMAIN) || DEFAULT_DOMAIN;

		var numHours = (new Date((new Date()).getTime() + hours * 3600000)).toGMTString();
		var cookie = name + '=' + encodeURIComponent(value) + ((numHours) ? (';expires=' + numHours) : '') + ((path) ? ';path=' + path : '') + ((domain) ? ';domain=' + domain : '') + ((secure && (secure == true)) ? '; secure' : '');
		document.cookie = cookie;
	};
	var get = function (name) {
		var cookies = document.cookie.split('; ');
		for (var i = 0; i < cookies.length; i++) {
			var s = cookies[i].split('=');
			if (s[0] == name) return decodeURIComponent(s[1]);
		};
		return false;
	};
	var kill = function (name, domain, path) {
		var theValue = get(name);
		path = path || '/';
		domain = domain || xq.config.get(COOKE_DOMAIN) || DEFAULT_DOMAIN;

		if (theValue) {
			document.cookie = name + '=' + theValue + '; expires=Fri, 13-Apr-1970 00:00:00 GMT' + ((path) ? ';path=' + path : '') + ((domain) ? ';domain=' + domain : '');
		}
	};

	xq.cookie = {
		set: set,
		get: get,
		kill: kill
	}

})(xq, jQuery, _, window, document);



///================================================================================================== 分割线 ==================================================================================================


// -- Event -- 与 backbone.js 的 Event 相似-----------------------------------------------TODO：BUG: 有严重问题：mixTo 的对象（猜测：应该是在本身没有这个属性的情况下）的 __cacheHandler 会污染到这个原型里面的 __cacheHandler
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////// 说明：
////////////////////////////////////////////////////////////	① 被 mixTo 的构造函数，根据需要添加实例属性：__cacheHandler = { }
////////////////////////////////////////////////////////////		若无，则所有实例都会共享事件，
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
(function (xq, $, _, window, document) {

	xq.Event = $.inherit({
		__constructor: function () {
			//this.__cacheHandler = {};
		},
		__cacheHandler: {},
		// if (eventName == 'all') then : 所有的事件都会触发这个 侦听器
		on: function (eventName, handler, context) {
			var evtDomains = eventName.split('.');
			var root = this.__cacheHandler;
			for (var i = 0; i < evtDomains.length; i++) {
				var eDomain = evtDomains[i];
				root[eDomain] = root[eDomain] || [];

				var cache = root[eDomain];

				var id = {
					handler: handler,
					context: context
				};
				cache.push(id);

				root = (cache.children = cache.children || {});
			}
			//var cache = (this.__cacheHandler[eventName] = this.__cacheHandler[eventName] || []);
			
			//return id;
			return this;
		},
		//任一参数为空代表此参为：全部 ------ TODO: off 还没有针对 'change.title' 中的 "." 进行分割，on 和 fire 已经OK了
		//如：off(null, null, context)
		//		off('click', null, context)
		//		off(null, handler) ... ...
		off: function (eventName, handler, context) {
			var matched;
			var self = this;

			if (eventName) {
				dealCache(eventName);
			} else {
				_.each(this.__cacheHandler, function (handlers, eventName) {
					dealCache(eventName);
				})
			}

			function dealCache(eventName) {
				var cache = self.__cacheHandler[eventName];
				if (!cache) return;

				//获取匹配的侦听器
				matched = _.filter(cache, function (kache) {
					//如果 指定 eventName && handler && ( context ?)
					if (handler) {
						return context ? (handler == kache.handler && context == kache.context) : handler == kache.handler;
					}
						//如果 指定 eventName && !handler && ( context ?)
					else {
						return context ? context == kache.context : true;
					}
				});
				//移除匹配的侦听器
				matched.unshift(cache);
				self.__cacheHandler[eventName] = _.without.apply(_, matched);
			}
		},
		fire: function (eventName, args) {
			var evtDomains = eventName.split('.');
			var root = this.__cacheHandler;
			args = Array.prototype.slice.call(arguments, 1);
			var self = this;
			for (var i = 0, len = evtDomains.length; i < len ; i++) {
				var eventName = evtDomains[i];
				var caches = root[eventName];
				if (!caches) return;
				var cachesCount = caches.length;

				root = caches.children;
				if (!root) return;
				if (i != len - 1) continue;

				var all = self.__cacheHandler['all'];
				if (all) caches = caches.concat(all);
				_.each(caches, function (cache, index) {
					//all 的侦听器的第一个参数为 evenetName
					if (index >= cachesCount) args.unshift(eventName);
					cache.handler.apply(cache.context || self, args);
				});
			}
		}
	}, {
		//把这个 Event 对象 混入到其他 构造器（需有 __cacheHandler 的实例属性） 或者对象实例中
		mixTo: function (obj_or_fn) {
			var isFn = $.isFunction(obj_or_fn)

			var _proto = this.prototype;
			var receiver = (isFn ? obj_or_fn.prototype : obj_or_fn);

			// $.inherit 是通过 【__constructor】来维护原型链的
			var canNotRewrite = ['constructor', '__constructor', '__self', '__cacheHandler'];
			_.each(_proto, function (value, key) {
				($.inArray(key, canNotRewrite) == -1) && (receiver[key] = _proto[key]);
			});
			receiver.__cacheHandler = receiver.__cacheHandler || {};// TODO：尝试修复上面标明的那个BUG，效果未知；参数为函数未解决，为object解决了

			//if (isFn) {
			//	var ins = new obj_or_fn();
			//	if (!(ins.hasOwnProperty('__cacheHandler') && $.isPlainObject(ins.__cacheHandler))) {
			//		//obj_or_fn = _xq.addStatementIntoFunction(obj_or_fn, 'this.__cacheHandler={}');
			//		throw new Error('the Fn to mix Event need has a instance property named "__cacheHandler" with type Object!');
			//	}
			//} else {
			//	obj_or_fn.__cacheHandler = {};
			//}
		}
	});


	//xq 对象本身可以 发送全局事件

	xq.Event.mixTo(xq);

})(xq, jQuery, _, window, document);



///================================================================================================== 分割线 ==================================================================================================

// Classes in xq


///////////////////////////////////////
///////////////////////////////////////
/////////////////////////////////////// 约定：
///////////////////////////////////////		① 所有以“__”开头的成员（方法|属性）禁止被实例调用，只能在类内部使用
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////		② 所有以“_”开头的成员属于【建议不要在实例中存取】，若要使用，参考第③条
///////////////////////////////////////			
///////////////////////////////////////			
///////////////////////////////////////		③ 在构造器的末尾调用 __GetterSetter() 可以自动给私有属性（如：_xxx）生成  getXxx()，setXxx() 方法（设置到类的父级原型上），根据需求调用
///////////////////////////////////////				---- 这个要严格遵守第①条，因为在实例中调用后，产生的getset又在原型上，却把所有实例的this关联到了调用此方法的那个实例上
///////////////////////////////////////
///////////////////////////////////////		④ 所有的实例属性【禁止直接存取】，而要用实例方法：get() set()
///////////////////////////////////////				---- 如：var b = new xq.Widget.Base( { tmpl: 'empty' } ); b.get('node'); b.set({'name': 'peichao', 'age': 20})
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

(function (xq, $, _, window, document) {

	//	属性：
	//		__privateList Array ----- 私有属性列表，列出禁止被 get() set() 存取的成员
	//
	//		__cacheHandler Object ----- 事件侦听器哈希表

	//	方法：
	//		__addMorePrivateProverty( propertyName String | Array ) ---------------- 添加更多的私有属性
	//		__removeSomePrivateProverty( propertyName String | Array )
	//		__GetterSetter() 自动给本构造器的私有属性：_xxx 生成  getXxx() setXxx() ，添加在【本类的直接原型】上
	//		set(name, value)|({ key, value }) --------------------------------------- 动态设置实例属性（利：方便；弊：容易混乱）
	//		get(name)

	//=========================== 写这个所有基类（Widget, Data, Helper 等）的父类的目的: ① MIXIN Event， ② 存取属性 get(), set()
	xq._Base = $.inherit({
		__constructor: function () {
			this.__privateList = ['__privateList', '__cacheHandler'];
			this.__cacheHandler = {};
		},
		//propertyName String | Array
		__addMorePrivateProverty: function (propertyName) {
			this.__privateList = this.__privateList.concat(propertyName);
		},
		//propertyName String | Array
		__removeSomePrivateProverty: function (propertyName) {
			if (_.isArray(propertyName)) {
				propertyName.unshift(this.__privateList);
				this.__privateList = _.without.apply(_, propertyName);
			} else {
				this.__privateList = _.without(this.__privateList, propertyName);
			}
		},
		__GetterSetter: function(ins){
			//var self = this;
			var proto = this.__self.prototype;
			_.each(this, function(prop, key){
				var privateReg = /^_[^_]/;
				var isNotPrivate = !key.match(privateReg);  
				if(isNotPrivate) return;
				var name = xq.utils.toCamelCase(key, '_');
				var get = 'get' + name;
				if (!proto.hasOwnProperty(get))
				    proto[get] = function () {
						return this[key]; 
				    };
				var set = 'set' + name;
				if(!proto.hasOwnProperty(set))
				    proto[set] = function(value){
						this[key] = value;
						return this;
					};
			});
		},
		set: function (name, value) {
			var self = this;
			if ($.isPlainObject(name)) {
				var kv = name;
				$.each(kv, function (k, v) {
					_set(k, v);
				});
			} else {
				_set(name, value);
			}
			return this;

			function _set(name, value) {
				if (_.isUndefined(name)) return;
				if (name.indexOf('_') == 0) {
					throw new Error('private proverty can not be set');
				}
				if ($.inArray(name, self.__privateList) != -1) {
					throw new Error('this property ' + name + ' is private that can not be Setted');
				}
				self[name] = value;
			}
		},
		get: function (name) {
			if (_.isUndefined(name)) return;
			if (name.indexOf('_') == 0) {
				throw new Error('private proverty can not be get');
			}
			if ($.inArray(name, this.__privateList) != -1) {
				throw new Error('this property ' + name + ' is private that can not be Getted');
			}
			return this[name];
		}
	});
	xq.Event.mixTo(xq._Base);

})(xq, jQuery, _, window, document);



///================================================================================================== 分割线 ==================================================================================================


(function (xq, $, _, window, document) {

})(xq, jQuery, _, window, document);