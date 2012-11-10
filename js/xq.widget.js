(function (xq, $, _, win, doc) {

	// var Helper = require('./xq.helper.js');

	var Widget = xq.namespace('Widget');


	(function () {
		
		//参数：
		//	[ constructor Function ]
		//	[ events Object ]
		//	[ el Node ]
		//
		//返回：
		//	function Constructor
		//		参数：
		//			最后一个参数永远可以是 optiosn [ options Object ]{[ el Node ],[ events Object ]}
		//
		//实例属性：
		//	el Node
		//	
		//类属性：
		//	
		//
		//类方法：
		//	
		//
		Widget.create = function (protoProps, classProps) {
			var _default = {};

			var cons = $.inherit(_.extend({
				__constructor: function (args, options) {
					var argLen, el, events, elements, instanceMembers, options;
					argLen = arguments.length;
					//instanceMembers = arguments[argLen - 2];
					//options = arguments[argLen - 1];

					//instanceMembers && _.extend(this, instanceMembers);

					if (protoProps && _.has(protoProps,'constructor') && _.isFunction(protoProps.constructor)) {
						protoProps.constructor.apply(this, arguments);
					}

					//events = (options && options.events) || this.events;
					var eventSpliter = /^(\w+)\s*(.*)$/;
					this.el && this.events && _.each(this.events, _.bind(function (handlerName, key) {
						//var split = key.split(' ');
						//var eventName = split.shift();
						//var selector = split.join(' ');
						var match = key.match(eventSpliter);
						var eventName = match[1];
						var selector = match[2];
						var method = _.bind(_.isFunction(handlerName) ? handlerName : this[handlerName], this);
						this.el.find(selector).on(eventName, method);
					}, this));

					this.el && this.elements && _.each(this.elements, _.bind(function (propName, selector) {
						this[propName] = $(selector, this.el);
					}, this));
				}
			}, protoProps),_.extend({}, classProps));

			return cons;
		}

	})();

	/////////////////////////////////////////
	///////////////////////////////////////// BASE BEGIN --- 所有 Widget 的基类
	/////////////////////////////////////////

	(function () {
		var id = 0;

		//参数：
		//	[ options Object ] 由继承者来填写
		//	[ needTmpl = true Boolean ] 是否需要模版

		//对外接口：
		//
		//	方法：
		//		one(eventName, args) --- 因为 Popup 及其子类可能被不同类型的东西用作不同的用途，因此
		//							 --- 每次 show<-->hide 之间为一个周期，可以指定在点击“ok”按钮的时候触发某事件，以及传参；hide的时候即会清除这些数据
		//		getId : 
		//		appendTo: 挂载到 DOM 上
		//		get : //所有的属性都用这个来 获取
		//		set : 
		//		hide :
		//		show :
		//		getBtn : 
		//		getNode: ----- 空方法，子类来重写
		//
		//	事件：
		//		hide
		//		show
		//		[ one ]	------------	参见 one 传递的自定义事件
		//
		Widget.Base = $.inherit(xq._Base, {
			__constructor: function (options, needTmpl) {
				this.__base();
				options = options || {};
				needTmpl = _.isUndefined(needTmpl) ? true : needTmpl;

				if (needTmpl && !options.tmpl) {
					try { console.trace() } catch (ex) { };
					throw "this Widget need 'tmpl' as a property of options";
				}

				this._options = options;
				this._id = 'xq.Widget.' + (id++);

				//this.__addMorePripvateProverty(['_options']);
				this.__self.instances.push(this);

				this.__GetterSetter();
			},
			getNode: function () { return this._node },
			getBtn: function (btnName) {
				return this.getNode().find('.' + btnName);
			},
			one: function (eventName, args) {
				//var args = Array.prototype.slice.call(arguments, 1);
				this.__oneContent__ = arguments;
				return this;
			},
			//在某些情况下执行 用one绑定 的事件，比如：click.ok 的时候
			oneFire: function () {
				if (this.__oneContent__) {
					this.fire.apply(this, this.__oneContent__);
				}
			},
			oneDestroy: function () {
				delete this.__oneContent__;
				return this;
			},
			hide: function () {
				var node = this.getNode();
				if (node) {
					node.stop(true).hide();
					//this._options.onHide && this._options.onHide.call(this, node);
					this.fire('hide', node);
				}

				//销毁 one 传递进来的事件
				this.oneDestroy();

				return this;
			},
			show: function () {
				var node = this.getNode();
				if (node) {
					node.stop(true).show();
					//this._options.onShow && this._options.onShow.call(this, node);
					this.fire('show', node);
				}
				return this;
			},
			appendTo: function (node) {
				$(node || document.body).append(this.getNode());
				return this;
			},
			//可以在 实例化的时候设置，也可以在 pop() 的时候设置
			pop: function (node, isFixedPosition) {
				xq.utils.pop(node || this.getNode(), isFixedPosition || this.getOptions().isFixedPosition);
				return this;
			}
		}, {
			instances: [],
			getInstance: function (id) {
				return _.find(this.instances, function (ins) {
					return ins.getId() == id || ins == id;
				});
			}
		});

	})();

	/////////////////////////////////////////
	///////////////////////////////////////// BASE END
	/////////////////////////////////////////



	/////////////////////////////////////////
	///////////////////////////////////////// Passport 跨城 - 护照 BEGIN --- 继承自：Widget.Base
	/////////////////////////////////////////

	(function () {
		//这个整体的模版是在外面导入，但是这个 印章 的小模版还要再写一次，是不是不太好？
		var __tmpl_stamp = '<div class="stamp <% print((index%4)>1 ? "right" : "") %>"><i class="del"></i><%= stamp %></div>';

		//////////////-------------------------- 类方法...直接写在闭包里面吧
		var getTime = function (dateObj) {
			if (!dateObj) {
				var now = new Date();
				dateObj = {
					year: now.getFullYear(),
					month: now.getMonth() + 1,
					day: now.getDate()
				};
			}
			dateObj = [
				dateObj.year,
				_.string.pad(dateObj.month, 2, '0'),
				dateObj.day ? _.string.pad(dateObj.day, 2, '0') : 'xx'
			];
			return dateObj.join('.');
		}

		var shouldBeRight = function (index) {
			return index % 4 > 1;
		}

		var reposition = function (rootNode) {
			var stamps = rootNode.find('.stamp');
			var btn = rootNode.find('.go-stamp');
			stamps.each(function (i, stamp) {
				shouldBeRight(i) ? ($(stamp).addClass('right')) : ($(stamp).removeClass('right'));
			});
			shouldBeRight(stamps.length) ? (btn.addClass('right')) : (btn.removeClass('right'));
		}

		//================================================= Handler
		function mouseover(e) {
			$(e.currentTarget).children('.del').stop(true).show();
		}
		function mouseout(e) {
			$(e.currentTarget).children('.del').stop(true).hide();
		}



		//参数：
		//		tmpl String 模板文件

		//对外接口：
		//
		//	方法：
		//		addStamps(stamps Array)
		//		getStamps()	
		//		addOneStamp([timeStr = now String]) 参数格式："2012.09.05"
		//		removeOneStamp([index_or_node Number | Node])
		//		removeAllStamps()
		//
		//	事件：
		//		click.add
		//		click.del
		//		click.save
		//		click.cancel
		//		click.quit
		//		click.close
		//
		Widget.Passport = $.inherit(Widget.Base, {
			__constructor: function (options) {
				this.__base(options);
				var self = this;

				options = this._options;

				//目前city数据有问题，暂且先如此来测试
				//options.lineName = '上海 → 北京';

				options.domId = options.domId || 'passport';

				//保存的是字符串形式的："2012.09.05"
				options.stamps = _.map(options.stamps || [], function (value) {
					//value.year 说明格式为：{ year: 2012, month: 12, day: 9 }
					return value.year ? getTime(value) : value;
				});

				var html = _.template(options.tmpl, options);
				var node = $(html);

				var quitBtn = node.find('.quit');
				var cancelBtn = node.find('.cancel');
				var saveBtn = node.find('.save');
				var closeBtn = node.find('.close');
				var addBtn = node.find('.go-stamp');

				//============================================事件区
				node.on('mouseenter', '.stamp', mouseover).on('mouseleave', '.stamp', mouseout).on('click', '.del', delHandler);
				function delHandler(e) {
					var stampNode = $(e.currentTarget).parent();
					//options.onDelClick && options.onDelClick.call(self, e, stampNode);
					self.fire('click.del', e, stampNode);
					self.removeOneStamp(stampNode);
				}

				addBtn.on('click', function (e) {
					//options.onAddClick && options.onAddClick.call(self, e);
					self.fire('click.add', e);
				});
				quitBtn.on('click', function (e) {
					//options.onQuitClick && options.onQuitClick.call(self, e);
					self.fire('click.quit', e);
				});
				cancelBtn.on('click', function (e) {
					self.hide();
					//options.onCancelClick && options.onCancelClick.call(self, e);
					self.fire('click.cancel', e);
				});
				saveBtn.on('click', function (e) {
					//options.onSaveClick && options.onSaveClick.call(self, e);
					self.fire('click.save', e);
				});
				closeBtn.on('click', function (e) {
					self.hide();
					//options.onCloseClick && options.onCloseClick.call(self, e);
					self.fire('click.close', e);
				});


				this.getNode = function () {
					return node;
				}
			},
			setLineName: function (lineName) {
				//TODO: 应该把这个 lineName 写到构造函数中：this._lineName = 'xx'; 然后 __GetterSetter()
				this.set('lineName', lineName);
				this.getNode().find('h3 a').text(lineName);
				return this;
			},
			addStamps: function (stamps) {
				var self = this;
				_.each(stamps, function (stamp) {
					self.addOneStamp(stamp);
				});
				return this;
			},
			getStamps: function () {
				return this._options.stamps;
			},
			addOneStamp: function (timeStr) {
				var btn = this.getNode().find('.go-stamp');
				var btnIndex = btn.index();

				var stamp = $.isPlainObject(timeStr) ? getTime(timeStr) : timeStr;

				btn.before(_.template(__tmpl_stamp, {
					index: btnIndex,
					stamp: stamp
				}));
				this._options.stamps.push(stamp);

				reposition(this.getNode());

				return this;
			},
			removeOneStamp: function (index_or_node) {
				var isNumber = _.isNumber(index_or_node);

				var index = isNumber ? index_or_node : index_or_node.index();
				var node = isNumber ? this.getNode().find('.stamp:eq(' + index_or_node + ')') : index_or_node;
				//data
				this._options.stamps.splice(index, 1);
				//view
				node.remove();
				reposition(this.getNode());

				return this;
			},
			removeAllStamps: function () {
				var node = this.getNode();
				//view
				node.find('.stamp').remove();
				reposition(node);
				//data
				this._options.stamps = [];

				return this;
			}
		});

	})();

	/////////////////////////////////////////
	///////////////////////////////////////// 跨城 - 护照 end
	/////////////////////////////////////////


	/////////////////////////////////////////
	///////////////////////////////////////// Timer 时间选择器 BEGIN --- 
	///////////////////////////////////////// 只有“年”“月”“日” --- 结构同下面的 TimePicker

	(function () {

		Widget.Timer = $.inherit({
			__constructor: function (options) {
				
			}
		})

	})();

	/////////////////////////////////////////
	///////////////////////////////////////// Timer 时间选择器 BEGIN --- 
	/////////////////////////////////////////


	/////////////////////////////////////////
	///////////////////////////////////////// TimePicker 时间选择器 BEGIN --- 继承自：Widget.Base
	/////////////////////////////////////////

	(function () {
		// ========================================== “类”私有成员（通过闭包）【构造函数内的皆为 - 实例 - 成员】
		var config = {
			//从几年前开始可选
			yearAgo: 5,
			//到之后的几年可选
			yearFuture: 1
		};

		var d31 = [1, 3, 5, 7, 8, 10, 12];

		var now = new Date();
		var yearNow = now.getFullYear();
		var monthNow = now.getMonth() + 1;
		var startYear = yearNow - config.yearAgo;
		var endYear = yearNow + config.yearFuture;


		//参数: { ... }
		//		tmpl String --------------------------------- 模版
		//		[ domId = 'time-picker' String ] --------- 容器的ID
		//		[ okBtnName = '确定' String ] --------------- 确定按钮的名字


		//对外接口：
		//
		//	方法：
		//		getNode :	return jQuery DOM
		//		getDate :	return _date
		//		hide :
		//		destroy :
		//		updateInputSingle : type[ year | month | day String], value[ Number ]
		//		updateInput : date[ Object ]
		//
		//	继承：
		//		setId ,		getId ,		
		//
		//	事件：
		//		click.ok
		//		click.cancel
		//		change.date
		//
		//
		Widget.TimePicker = $.inherit(Widget.Base, {
			__constructor: function (options) {
				this.__base(options);

				this._date = { year: yearNow, month: monthNow, day: 0 };

				// ================================== 私有（真正）属性
				options = this._options;
				var html = _.template(options.tmpl, {
					domId: options.domId || 'time-picker',
					yearNow: yearNow,
					monthNow: monthNow,
					startYear: startYear,
					endYear: endYear,
					okBtnName: options.okBtnName || '确定'
				});

				var self = this;

				var node = $(html);
				var okBtn = node.find('.ok');
				var cancelBtn = node.find('.cancel');

				// ================================== 事件处理区
				node.find('h4').on('click', dateSelClickHandler);
				function dateSelClickHandler(e) {
					var h4 = $(e.currentTarget);
					var ul = h4.siblings();
					ul.is(':hidden') ? ul.stop(true).show() : ul.stop(true).hide();
					h4.parent().siblings().children('ul').hide();
				}

				node.find('li').on('click', liClickHandler);
				function liClickHandler(e) {
					var li = $(e.currentTarget);
					var index = li.index();
					var ul = li.parent();
					var h4 = ul.siblings('h4');
					var type = ul.parent().attr('class');

					self.updateInputSingle(type, type == 'year' ? index + startYear : type == 'month' ? index + 1 : index);
					ul.hide();
				}

				xq.onDocClick(docClickHandler);
				function docClickHandler(e) {
					if (node.find('.date>div').find(e.target).length != 0) return;
					node.find('ul').hide();
				}

				okBtn.on('click', okClickHandler);
				function okClickHandler(e) {
					//执行 one 传递进来的事件
					self.oneFire();

					//options.onOkClick && options.onOkClick.call(self, e, self._date);
					self.fire('click.ok', e, self._date);
				}

				cancelBtn.on('click', cancelClickHandler);
				function cancelClickHandler(e) {
					self.hide();
					//options.onCancelClick && options.onCancelClick.call(self, e);
					self.fire('click.cancel', e);
				}


				// =================================== 公共方法
				this.getNode = function () {
					return node;
				};
				this.destroy = function () {
					node.find('h4').off('click', dateSelClickHandler);
					node.find('li').off('click', liClickHandler);
					xq.onDocClick.off(docClickHandler);
					okBtn.off('click', okClickHandler);
					cancelBtn.off('click', cancelClickHandler);

					node.remove();
					//delete this;
				};
			},
			getDate: function () {
				return this._date;
			},
			stringify: function (date) {
				date = date || this.getDate();
				return date.year + '.' + _.string.pad(date.month, 2, '0') + '.' + (date.day == 0 ? 'xx' : _.string.pad(date.day, 2, '0'));
			},
			parse: function (dateStr) {
				var date = dateStr.split('.');
				return {
					year: parseInt(date[0], 10),
					month: parseInt(date[1], 10),
					day: parseInt(date[2], 10) || 0
				};
			},
			updateInputSingle: function (type, value) {
				var node = this.getNode();
				var options = this._options;
				var module = node.find('.' + type);

				//视图改变
				//因为月份没有“某月”了，则index 从 0 开始排，而 日期 是从 1 开始排的
				module.find('h4 a').text(module.find('li:eq(' + (type == 'year' ? value - startYear : type == 'month' ? value - 1 : value) + ')').text());

				//valueChange 事件
				if (this._date[type] != value) {
					if (type != 'day') this._updateDayCount(type, value);
					var oldValue = this._date[type];
					//options.onValueChange && options.onValueChange.apply(this, [type, oldValue, value]);
					this.fire('change.date', type, oldValue, value);
				}

				//数据改变
				this._date[type] = value;
			},
			updateInput: function (date) {
				var self = this;
				_.each(date, function (value, type) {
					self.updateInputSingle(type, value);
				});
			},
			// ===================================================== 私有（约定）方法
			//根据月份和年更新当月的天数
			_updateDayCount: function (type, value) {
				var month, year, dayCount;
				var date = this._date;
				var node = this.getNode();
				var ul = node.find('.day ul');
				var lis = ul.children();
				var count = lis.length - 1;

				month = type == 'month' ? value : date.month;
				year = type == 'year' ? value : date.year;

				dayCount = (month == 2) ? (new Date(year, month, 0).getDate()) : ($.inArray(month, d31) != -1 ? 31 : 30);

				//比如：一共30天，日期却选择了 31日 的话
				if (date.day > dayCount && month > 0) {
					this.updateInputSingle('day', 0);
				}

				if (count < dayCount) {
					var li = lis.last();
					for (; count < dayCount; count++) {
						var el = li.clone(true);
						//['','日']
						var text = el.text().split(/\d+/);
						text[0] = count + 1;
						el.children().text(text.join(''));
						ul.append(el);
					}
				} else if (count > dayCount) {
					//+1 因为 第一条为“某日”，不能算在内
					lis.slice(dayCount + 1).remove();
				}
			}
		});
	})();

	/////////////////////////////////////////
	/////////////////////////////////////////时间选择器 end
	/////////////////////////////////////////





	/////////////////////////////////////////
	/////////////////////////////////////////弹出层的遮罩 Mask BEGIN
	/////////////////////////////////////////

	(function () {

		var __tmpl = '<div></div>';
		var css = {
			position: 'fixed',
			display: 'none',
			width: '100%',
			left: 0,
			top: 0,
			bottom: 0,
			backgroundColor: '#000',
			opacity: 0.35,
			zIndex: 105
		};



		Widget.Mask = $.inherit(Widget.Base, {
			//参数: { ... }
			//		[ zIndex Number ] -- Mask 的 z-index 值
			//
			//对外接口：
			//
			//	方法：
			//		relate(popup Popup) --- 与 Popup 关联起来，一起显示，隐藏，淡出
			//
			//	继承：
			//		setId ,		getId ,		 ...
			//
			//	事件：
			//
			__constructor: function (options) {
				this.__base(options, false);

				this._node = $(__tmpl);
				this._node.css(_.extend(css, options));

				this.__GetterSetter();

				//IE6 -- 不支持 position: fixed
				if ($.browser.msie && parseInt($.browser.version) == 6) {
					var self = this;
					var node = this.getNode();
					node.css('position', 'absolute');
					xq.onScroll(function () {
						node.css('top', xq.utils.getWinScroll('y'));
					});
				}
			},
			relate: function (popup) {
				var mask = this;
				popup.on('show', function () { mask.show(); });
				popup.on('hide', function () { mask.hide(); });
				popup.on('start.fadeOut', function () {
					mask.getNode().fadeOut();
				});
				return this;
			}
		});

	})();

	/////////////////////////////////////////
	/////////////////////////////////////////弹出层的遮罩 Mask BEGIN
	/////////////////////////////////////////




	/////////////////////////////////////////
	///////////////////////////////////////// Wrapper 弹出框 元素包裹提示器 BEGIN --- 继承自：Widget.Base
	///////////////////////////////////////// 主要与 Popup 组合使用
	///////////////////////////////////////// 参考新浪微博新版（2012-11-6）的弹出框，箭头指向的元素被这个 Wrapper 包裹，更显著更友好

	(function () {
		var __tmpl = '<div class="function_guide"><table class="border" border="0" cellspacing="0" cellpadding="0"><tbody>' +
					'<% if(type=="left"||type=="right"){ %>' +
					'<tr><td class="arrow <%= type=="left"?"lt":"rt" %>"></td></tr>' +
					'<tr><td class="line_<%= type %>"></td></tr>' +
					'<tr><td class="arrow <%= type=="right"?"rb":"lb" %>"></td></tr>' +
					'<% } else { %>' +
					'<tr><td class="arrow <%= type=="top"?"lt":"lb" %>"></td>' +
					'<td class="line_<%= type %>"></td>' +
					'<td class="arrow <%= type=="bottom"?"rb":"rt" %>"></td></tr>' +
					'<% } %>'+
					'</tbody></table></div>';

		Widget.Wrapper = $.inherit(Widget.Base, {
			//参数：
			//	type String ['left' | 'right' | 'top' | 'bottom'] --- 选框的类型
			__constructor: function (options) {
				this.options = options;
				this._node = $(_.template(__tmpl, options));
				this._lineNode = this._node.find('.line_' + options.type);

				this.corner = $(this._node.find('.arrow').get(0));
			},
			//围绕一个 node 节点来移动
			//
			//参数：
			//	nodeLeft Number --- 需要移动到的 node 节点的 left 的值
			//	nodeTop Number --- 需要移动到的 node 节点的 top 的值
			//	nodeWidth Number -- 需要移动到的 node 节点的 width 的值
			//	nodeHeight Number -- 需要移动到的 node 节点的 height 的值
			moveTo: function (options) {
				this.cornerWidth = this.cornerWidth || xq.utils.getWidth(this.corner);
				this.cornerHeight = this.cornerHeight || xq.utils.getHeight(this.corner);

				//var options = this.options;
				var type = this.options.type;
				var left, top;
				if (type == 'left' || type == 'top') {
					left = options.nodeLeft - this.cornerWidth;
					top = options.nodeTop - this.cornerHeight;

					type == 'left' ? this._lineNode.css('height', options.nodeHeight) : this._lineNode.css('width', options.nodeWidth);
				} else if (type == 'right') {
					left = options.nodeLeft + options.nodeWidth;
					top = options.nodeTop - this.cornerHeight;

					this._lineNode.css('height', options.nodeHeight);
				} else if (type == 'bottom') {
					left = options.nodeLeft - this.cornerWidth;
					top = options.nodeTop + options.nodeHeight;

					this._lineNode.css('width', options.nodeWidth);
				}

				this.getNode().css({
					top: top,
					left: left
				});
			}
		});
	})();

	/////////////////////////////////////////
	///////////////////////////////////////// Wrapper 弹出框 元素包裹提示器 END
	/////////////////////////////////////////



	/////////////////////////////////////////
	///////////////////////////////////////// Popup 弹出框 BEGIN --- 继承自：Widget.Base --- 子类： Alert, Confirm, Prompt
	/////////////////////////////////////////

	(function () {

		var __tmpl = '<% var haveBtn = needOkBtn || needCancelBtn %>' +
						'<% if(useGrayBorder){ %><div class="<%= domClass %>-outer pop-position"><% } %>' +
						'<div id="<%= domId %>" class="<%= domClass + (useGrayBorder ? "" : " pop-position") %>">' +
							'<% if(arrow){ %><i class="arrow"></i><% } %>' +
							'<%= extendHtml %>' +
							'<% if(haveBtn){ %><div class="clear-net btns"><% } %>' +
							'<% if(needOkBtn){ %><a href="javascript:void(0)" class="ok"><%= okBtnName %></a><% } if(needCancelBtn){ %><a href="javascript:void(0)" class="cancel"><%= cancelBtnName %></a><% } %>' +
							'<% if(haveBtn){ %></div><% } %>' +
						'<% if(useGrayBorder){ %></div><% } %>' +
						'</div>';
		Widget.Popup = $.inherit(Widget.Base, {

			//参数: { ... }
			//		message String ------------------------------ 确认框的提示文字
			//		[ domId = '' String ] ----------------- 容器的 ID
			//		[ domClass = 'pop-up' String ] -------------------- 容器的 ClassName
			//		[ okBtnName = '确定' String ] --------------- 确定按钮的名字
			//		[ cancelBtnName = '取消' String ] ----------- 取消按钮的名字
			//		[ arrow = false Boolean ] ------------------- 是否需要小箭头指向
			//		[ tmpl String ] ----------------------------- 使用实例传进来的模板，而非默认的
			//		[ extendHtml = '' String ] ------------------ 需要扩展的 HTML 
			//		[ needWrapper = false Boolean ] ---------------- 是否需要在箭头指示的地方显示 Wrapper（新浪微博style）
			//		[ needOkBtn = true Boolean ]
			//		[ needCancelBtn = true Boolean ]
			//		[ isFixedPosition = false Boolean ]
			//		[ useGrayBorder = false Boolean] ------------ 类似人人微博的弹出框的边框
			//		[ zIndex Number ]


			//对外接口：
			//
			//	方法：
			//		fillContent(html String) 全部替换内容
			//		popTo: node		挂载到哪个 Node 节点的下面
			//		moveArrow : [ distance Number ], direction = 'center'[ 'center' | 'right' | 'left' String]
			//		getArrow : node | false
			//
			//	继承：
			//		setId ,		getId ,		 ...
			//
			//	事件：
			//		click.ok
			//		click.cancel
			//		click.close
			//
			//	自定义 BUTTON 事件 -- <div class="button" data-eventname="next">xxx</div>
			//		click.next
			//
			__constructor: function (options) {
				this.__cacheHandler = {};
				options = _.extend({
					domId: '',
					domClass: 'pop-up',
					okBtnName: '确定',
					cancelBtnName: '取消',
					arrow: false,
					extendHtml: '',
					needOkBtn: true,
					needCancelBtn: true,
					isFixedPosition: false,
					useGrayBorder: false
				}, options);
				//xq.log(this, this.__base);
				this.__base(options, false);
				var self = this;

				options = this._options;

				var html = _.template(options.tmpl || __tmpl, this._options);
				var node = $(html);
				options.zIndex && node.css('z-index', options.zIndex);

				options.needOkBtn && node.find('.ok').on('click', function (e) {
					//options.onOkClick && options.onOkClick.call(self, e);
					self.fire('click.ok', e);

					//执行 one 传递进来的事件
					self.oneFire();

					self.hide();
				});
				options.needCancelBtn && node.find('.cancel').on('click', function (e) {
					//options.onCancelClick && options.onCancelClick.call(self, e);
					self.fire('click.cancel', e);
					self.hide();
				});
				node.find('.close').on('click', function (e) {
					self.fire('click.close', e);
					self.hide();
				});

				//给所有的 button 绑定 click 事件，并发出
				node.on('click', '.button', _.bind(function (e) {
					var $tar = $(e.currentTarget);
					var eventName = $tar.data('eventname');
					eventName && this.fire('click.' + eventName, e);
				}, this));

				this.getNode = function (e) {
					return node;
				}

				if (options.needWrapper) {
					this.wrapLeft = new Widget.Wrapper({ type: 'left' });
					this.wrapRight = new Widget.Wrapper({ type: 'right' });
					this.wrapTop = new Widget.Wrapper({ type: 'top' });
					this.wrapBottom = new Widget.Wrapper({ type: 'bottom' });

					$(_.bind(function () {
						this.wrapLeft.appendTo();
						this.wrapRight.appendTo();
						this.wrapTop.appendTo();
						this.wrapBottom.appendTo();
					}, this));
				}

				this._node = node;
				this._data = {};

				this.hide();
				node.css('position', options.isFixedPosition ? 'fixed' : 'absolute');
			},
			hide: function () {
				this.__base();
				this.hideWrapper();
				return this;
			},
			hideWrapper: function () {
				if (this._options.needWrapper) {
					this.wrapLeft.hide();
					this.wrapRight.hide();
					this.wrapTop.hide();
					this.wrapBottom.hide();
				}
				return this;
			},
			fillContent: function (html) {
				this.getNode().html(html);
				return this;
			},
			setMessage: function (msgHtml, selector) {
				selector = selector || '.message span';
				this.getNode().find(selector).html(msgHtml);
				return this;
			},
			reg: {
				posLr: /left|center|right/,
				posTb: /top|middle|bottom/
			},
			/*
			* popTo(targetNode);
			* popTo(targetNode, { position, align, arrowAlign, gap });
			*
			* options: { 
			*	position String <'top'|'bottom'|'left'|'right'> --- tip 框位于 node 的哪个方位
			*	align String <'top'|'bottom'|'left'|'right'|'center|middle'> --- tip 框在这个方位上与 node 的对齐方式（上下方应为左右对齐，左右两旁应为上下对齐）
			*	[ arrowAlign String <'top'|'bottom'|'left'|'right'|'center|middle'> ] --- tip 的 arrow 与 node 的对齐方式（上下方应为左右对齐，左右两旁应为上下对齐）--- 默认继承上面 align 的值
			*	[ arrowDisToBorder = 5 Number ] --- 箭头不能一直到边缘，而是与边缘有一定的距离
			*	[ gap = 5 Number ] --- 两个 node 之间的间隔
			*	[ showWrap = true Boolean ] --- 是否显示 wrapper 如果有的话
			*	[ wrapIsVertical Boolean <false == '横向，左右方向' | true == '纵向，上下方向'> ] --- wrap的显示方向
			* }
			*/
			//popTo: function (targetNode, isFixedPosition, options) { -- //popTo(targetNode, false, { dis, pos })
			popTo: function (targetNode, options) {
				options = _.extend({
					position: 'bottom',
					align: 'center',
					arrowDisToBorder: 5,
					gap: 5,
					showWrap: true
				}, options);
				options.arrowAlign = options.arrowAlign || options.align;
				options.wrapIsVertical = !_.isUndefined(options.wrapIsVertical) ?
										options.wrapIsVertical :
										(options.position == 'left' || options.position == 'right') ? true : false;

				targetNode = $(targetNode);
				
				var thisOp = this.options;
				var popLeft, popTop, arrowWidth, arrowHeight;
				var pos = options.position;
				var align = options.align;
				var arrowAlign = options.arrowAlign;
				var gap = options.gap;

				var util = xq.utils;
				var arrow = this.getArrow();
				var haveArrow = arrow.length > 0;
				var popNode = this.getNode();
				var popNodeHeight = util.getHeight(popNode, true, true, false);
				var popNodeWidth = util.getWidth(popNode, true, true, false);
				var targetNodeHeight = util.getHeight(targetNode, true, true, false);
				var targetNodeWidth = util.getWidth(targetNode, true, true, false);
				var targetNodeOffset = targetNode.offset();
				var targetNodeLeft = targetNodeOffset.left;
				var targetNodeTop = targetNodeOffset.top;
				//正方形
				var wrapSize = this.wrapLeft.corner.width();
				var wrapWillShow = thisOp.needWrapper && options.showWrap;

				if ((pos == 'left' || pos == 'right') && (align == 'left' || align == 'right' || arrowAlign == 'left' || arrowAlign == 'right')) throw new Error('if position is "left" or "right", align and arrowAlign should be "top" or "bottom" or "center|middle".');
				if ((pos == 'top' || pos == 'bottom') && (align == 'top' || align == 'bottom' || arrowAlign == 'top' || arrowAlign == 'bottom')) throw new Error('if position is "top" or "bottom", align and arrowAlign should be "left" or "right" or "center|middle".');

				//处理 arrow 的位置
				if (haveArrow) {
					arrowWidth = util.getWidth(arrow);
					arrowHeight = util.getHeight(arrow);

					arrow.css({ 'left': '', 'top': '', 'right': '', 'bottom': '' });
					//'arrow arrow-left' => 'arrow arrow-right'
					var removeClass = arrow.attr('class').match(/arrow\-\w+/);
					removeClass && arrow.removeClass(removeClass[0]);
					arrow.addClass('arrow-' + pos);

					var disToBorder = options.arrowDisToBorder;

					if (arrowAlign == 'center' || arrowAlign == 'middle') {
						if (pos == 'left' || pos == 'right') {
							arrow.css('top', (popNodeHeight - arrowHeight) / 2);
						} else if (pos == 'top' || pos == 'bottom') {
							arrow.css('left', (popNodeWidth - arrowWidth) / 2);
						}
					} else {// else if (pos == 'left' || pos == 'right' || pos == 'top' || pos == 'bottom') {
						arrow.css(arrowAlign, disToBorder);
					}
				}

				//处理 popnode 的位置
				var wrapShowSize = wrapWillShow ? wrapSize : 0;
				if (pos == 'left') {
					popLeft = targetNodeLeft - popNodeWidth - gap - wrapShowSize;
					if (haveArrow) popLeft -= arrowWidth;
				} else if (pos == 'right') {
					popLeft = targetNodeLeft + targetNodeWidth + gap + wrapShowSize;
					if (haveArrow) popLeft += arrowWidth;
				} else if (pos == 'top') {
					popTop = targetNodeTop - popNodeHeight - gap - wrapShowSize;
					if (haveArrow) popTop -= arrowHeight;
				} else if (pos == 'bottom') {
					popTop = targetNodeTop + targetNodeHeight + gap + wrapShowSize;
					if (haveArrow) popTop += arrowHeight;
				}

				if (align == 'top') {
					popTop = targetNodeTop;
				} else if (align == 'bottom') {
					popTop = targetNodeTop + targetNodeHeight - popNodeHeight;
				} else if (align == 'right') {
					popLeft = targetNodeLeft + targetNodeWidth - popNodeWidth;
				} else if (align == 'left') {
					popLeft = targetNodeLeft;
				} else if (align == 'center' || align == 'middle') {
					if (pos == 'left' || pos == 'right') {
						popTop = targetNodeTop + targetNodeHeight / 2 - popNodeHeight / 2;
					} else if (pos == 'top' || pos == 'bottom') {
						popLeft = targetNodeLeft + targetNodeWidth / 2 - popNodeWidth / 2;
					}
				}

				//处理 wrapper 的位置
				if (wrapWillShow) {
					var targetNode = {
						nodeLeft: targetNodeLeft,
						nodeTop: targetNodeTop,
						nodeWidth: targetNodeWidth,
						nodeHeight: targetNodeHeight
					}
					this.wrapLeft.moveTo(targetNode);
					this.wrapTop.moveTo(targetNode);
					this.wrapRight.moveTo(targetNode);
					this.wrapBottom.moveTo(targetNode);
					
					//横向,左右方向
					if (!options.wrapIsVertical) {
						this.wrapLeft.show();
						this.wrapRight.show();
						this.wrapTop.hide();
						this.wrapBottom.hide();
					} else {
						this.wrapLeft.hide();
						this.wrapRight.hide();
						this.wrapTop.show();
						this.wrapBottom.show();
					}
				}

				if (!options.showWrap) {
					this.hideWrapper();
				}

				popNode.css({
					left: popLeft,
					top: popTop
				});

				return this;
			},
			//moveArrow();
			//moveArrow(6);默认为"left"
			//moveArrow(6, 'right');
			moveArrow: function (distance, direction) {
				var arrow = this.getArrow();
				if (!arrow) return;
				if (_.isString(distance)) direction = distance;
				if (arguments.length == 0) direction = 'center';

				var node = this.getNode();
				var nodeWidth = xq.utils.getWidth(node, true, true, false);
				var arrowWidth = xq.utils.getWidth(arrow, true, true, false);

				//必须先清空"left"，才能使"right"生效
				direction == 'right' && (arrow.css('left', ''));
				arrow.css((direction == 'right' ? 'right' : 'left'), (direction == 'center' ? (nodeWidth - arrowWidth) / 2 : distance));
				return this;
			},
			getArrow: function () {
				var arrow = this.getNode().find('.arrow');
				return arrow.length != 0 ? arrow : false;
			}
		});
	})();


	/////////////////////////////////////////
	///////////////////////////////////////// Popup 弹出框 END
	/////////////////////////////////////////



	/////////////////////////////////////////
	///////////////////////////////////////// Tip 弹出框 BEGIN
	/////////////////////////////////////////

	(function () {

		//var __tmpl = '<div id="<%= domId %>" class="<%= domClass %>"><i class="arrow"></i><div class="inner1"><div class="inner2"><%= message %></div></div></div>';
		var __tmpl_extend = '<div class="inner">' +
							'<%= headHtml %>'+
							'<% if(needTitle){ %><div class="title"><%= title %></div><% } %>' +
							'<div class="message"><%= message %></div>' +
							'<% if(needTipBtn){ %><div class="btns "><a href="javascript:void(0);" class="button tip-btn" data-eventname="tip"><%= tipBtnName %></a></div><% } %>' +
							'<%= footHtml %>' +
							'</div>';

		Widget.Tip = $.inherit(Widget.Popup, {
			//参数: { ... }
			//		domId String
			//		domClass String
			//		type String	--------------------------------- 框的类型，默认提供一些样式类型：default, red, yellow
			//		title String -------------------------------- 确认框的title
			//		message String ------------------------------ 确认框的提示文字
			//		tipBtnName String --------------------------- tipBtn 的名字
			//		headHtml String ----------------------------- 需要扩展的 HTML head 部分
			//		footHtml String ----------------------------- 需要扩展的 HTML foot 部分
			//		needTitle Boolean --------------------------- 是否需要title
			//		needTipBtn Boolean -------------------------- 是否需要TipBtn
			//
			//		tmpl String	--------------------------------- 模版
			//		arrowPos String	----------------------------- [左右 上下] { 'center bottom' | 'left middle' | '0 bottom' ... }
			//		arrowDir String	----------------------------- 箭头方向 { 'left' | 'bottom' | 'top' | 'right' | 'left top' | 'left bottom' ... }
			//		arrowSize String ---------------------------- [width height] { '3px 5px'... }
			__constructor: function (options) {
				this.__cacheHandler = {};
				options = _.extend({
					domId: '',
					domClass: 'pop-tip',
					message: '',
					title: '',
					arrow: true,
					headHtml: '',
					footHtml: '',
					tipBtnName: '知道了',
					needTipBtn: false,
					needTitle: false,
					needOkBtn: false,
					needCancelBtn: false
				}, options);
				options.extendHtml = _.template(__tmpl_extend, options);
				
				this.options = options;
				this.__base(options);
				this.moveArrow(6);
			},
			setMessage: function (msgHtml, selector) {
				this.__base(msgHtml, selector || '.message');
				return this;
			},
			setTitle: function (titleHtml, selector) {
				this.getNode().find(selector || '.title').html(titleHtml);
				return this;
			}
		});

	})();

	/////////////////////////////////////////
	///////////////////////////////////////// Tip 弹出框 END
	/////////////////////////////////////////


	/////////////////////////////////////////
	///////////////////////////////////////// Hint(类似 alert ) 提示框 BEGIN
	/////////////////////////////////////////

	(function () {
		var __tmpl_extend = '<div class="title"><span><%= title %></span><% if(needCloseBtn){ %><b class="close"></b><% } %></div>' +
							'<div class="message" style="margin-top:10px;"><span class="<%= iconType %>" <% if(backgroundImage){ %>style="background-image:url(<%= backgroundImage %>)"<% } %>><%= message %></span></div>';

		Widget.Hint = $.inherit(Widget.Popup, {
			//参数: { ... }
			//		[ iconType = 'warn' | 'success' String ]
			//		[ backgroundImage = false [ String | false[ Boolean ] ]]
			//		[ message String ] ------------------------------ 确认框的提示文字
			//		[ domId = 'hint' String ] ----------------- 容器的 ID
			//		[ domClass = 'pop-up' String ] -------------------- 容器的 ClassName
			//		[ zIndex Number ] ------------------------- z-index
			//		[ autoHide = true Boolean] -------------- 是否自动隐藏


			//对外接口：
			//
			//	方法：
			//		
			//
			//	继承：
			//		
			//
			//	事件：
			//		show, hide, start.fadeOut
			//
			__constructor: function (options) {
				this.__cacheHandler = {};
				var _default = {
					domId: 'hint',
					title: '提示信息',
					backgroundImage: false,
					needOkBtn: false,
					needCancelBtn: false,
					needCloseBtn: true,
					iconType: 'warn',
					message: '',
					zIndex: 110,
					showTime: 1000 * 3
				};
				options = _.extend(_default, options);

				options.extendHtml = _.template(__tmpl_extend, options);

				this.__base(options);

				this.on('show', _.bind(this.onShowHandler, this));
			},
			onShowHandler: function (e) {
				var ins = this;
				var node = this.getNode();
				_.delay(function () {
					ins.fire('start.fadeOut');
					node.stop(true).fadeOut(function () {
						ins.fire('end.fadeOut');
					});
				}, this.getOptions().showTime);
			},
			setShowTime: function (mstime) {
				this.getOptions().showTime = mstime;
				return this;
			}
		});
	})();

	/////////////////////////////////////////
	///////////////////////////////////////// Hint 提示框 END
	/////////////////////////////////////////



	/////////////////////////////////////////
	///////////////////////////////////////// Confirm('确定','取消') 确认框 BEGIN --- 继承自：Widget.Popup
	/////////////////////////////////////////

	(function () {
		var __tmpl_extend = '<div class="message"><span class="<%= iconType %>" <% if(backgroundImage){ %>style="background-image:url(<%= backgroundImage %>)"<% } %>><%= message %></span></div>';


		Widget.Confirm = $.inherit(Widget.Popup, {

			//参数: { ... }
			//		message String ------------------------------ 确认框的提示文字
			//		[ iconType = 'warn' | 'success' String ]
			//		[ backgroundImage = false [ String | false[ Boolean ] ]]
			//		[ domClass = '' String ] -------------------- 容器的 ClassName
			//		[ okBtnName = '确定' String ] --------------- 确定按钮的名字
			//		[ arrow = true Boolean ] -------------------- 是否需要小箭头指向
			//		[ template String | Function ] ----------------------------- 覆盖上面默认的 __tmpl_extend
			//								   ----------------------------- 可以传入函数，返回值为 tmpl String 即可，函数第一个参数为 上面的 __tmpl_extend


			//对外接口：
			//
			//	方法：
			//
			//	继承：
			//		setId ,		getId ,		 ...
			//
			//	事件：
			//		click.ok
			//		click.cancel
			//
			//
			__constructor: function (options) {
				this.__cacheHandler = {};
				var _default = {
					message: '',
					iconType: 'warn',
					backgroundImage: false,
					template: __tmpl_extend
				}
				options = _.extend(_default, options);

				_.isFunction(options.template) && (options.template = options.template(__tmpl_extend));

				options.extendHtml = _.template(options.template, options);
				this.__base(options);
			}
		});
	})();

	/////////////////////////////////////////
	///////////////////////////////////////// Confirm 确认框 END
	/////////////////////////////////////////



	/////////////////////////////////////////
	///////////////////////////////////////// Prompt('确定','取消','输入框') 确认框 BEGIN --- 继承自：Widget.Confirm
	/////////////////////////////////////////

	(function () {
		var __tmpl_extend = '<% if(boxType=="input"){ %><input class="message-box" type="text" /><% }else if(boxType=="textarea"){ %><textarea class="message-box"></textarea><% } %>';


		Widget.Prompt = $.inherit(Widget.Confirm, {

			//参数: { ... }
			//		message String ------------------------------ 确认框的提示文字
			//		[ defaultValue = '' String ] ---------------- 框中的默认值
			//		[ domClass = '' String ] -------------------- 容器的 ClassName
			//		[ okBtnName = '确定' String ] --------------- 确定按钮的名字


			//对外接口：
			//
			//	方法：
			//
			//	继承：
			//		setId ,		getId ,		 ...
			//
			//	事件：
			//		click.ok
			//		click.cancel
			//
			//
			__constructor: function (options) {
				this.__cacheHandler = {};
				var _default = {
					// "input" || "textarea"
					boxType: 'input',
					//规则详见 Confirm 的参数说明
					template: function (__Confirm_tmpl) {
						return __Confirm_tmpl + __tmpl_extend;
					}
				};
				options = _.extend(_default, options);
				this.__base(options);

				var node = this.getNode();
				this.messageBox = node.find('.message-box');
			},
			getValue: function () {
				return this.messageBox.val();
			}
		});
	})();

	/////////////////////////////////////////
	///////////////////////////////////////// Prompt 确认框 END
	/////////////////////////////////////////


})(xq, jQuery, _, window, document);