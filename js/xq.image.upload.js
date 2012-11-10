(function (xq, $, _, win, doc) {

	var _Image_ = xq.namespace('Image');

	var id = 0;
	var getId = function () { return 'xq-image-upload-' + id++; }


	var iframeSrc = '/proxy.html';


	var __tmpl_iframe = '<iframe id="<%= id %>" name="<%= name %>" src="<%= src %>" style="display:none;"></iframe>';
	var __tmpl_form = '<form target="<%= iframeName %>" action="<%= action %>" enctype="multipart/form-data" method="post">' +
											//如果是 JSONP 方式，需要多发送一个 字段 iframe=1 ，以便于 后台根据参数返回合适格式的数据
											'<% if(isJSONP){ %><input type="hidden" name="iframe" value="1"><% } %>' +
											'<input class="file" style="position:absolute;z-index:<%= zIndex %>;display:none;user-select:none;' +
											'-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:pointer;" ' +
											'hidefocus="true" type="file" name="<%= fileName %>" />' +
											'<% _.each(extraInputs, function(value, name){ %>' +
											'<input type="hidden" name="<%= name %>" value="<%= typeof value == "object" ? xq.escapeHTML(JSON.stringify(value)) : value %>" />' +
											'<% }) %>'+
											'</form>';

	//注意：1) suit 提供服务的时间很短暂，当 input 选择文件之后，会触发 change 事件，此时，此 suit 会隐藏，并等待 form 的上传， iframe 的获取内容，并生成新的 suit 来提供服务。一旦得到内容，则，此 suit 的任务完成，就被销毁


	//示例：var upload = new xq.Image.Upload({
	//                              node: $('#button'),
	//                              action: action,
	//                              inputName: 'upload'
	//              });
	//              upload.on('load.iframe', function (content, suit) { });
	//
	//              JSONP方式需要后台配合，发送格式：top.xq.fire('iframe.load', data, this);
	//              非JSONP方式，后台只需发送数据(data)即可
	//						---	PHP 如：if($iframe){  echo '<script>top.xq.fire("iframe.load",{}, this)</script>';  }else{  echo '{}';  }

	_Image_.Upload = $.inherit(xq._Base, {

		//参数：
		//      node Element | Node --- 需要绑定自动上传的按钮
		//      action String --- 后台接受的php页面
		//      inputName String --- input 的 name
		//		[ iframeSrc String ] --- proxy.html
		//		[ extraInputs = {} Object ] --- 需要传到后台的额外的键值对
		//      [ isJSONP = true Boolean ] --- 是否使用 JSONP 格式来传输 iframe --- JSONP 在返回的数据 主动发布事件给 top window | 非 JSONP 用 onload 事件或 setInterval(IE) 来监听 onload 情况 --- TODO: 非JSOP尚未完成
		//      [ valideFn Function ]   ---     验证选择的文件是否合法，返回：true | false
		//      [ zIndex = 1000 Number ]
		//

		//对外接口：
		//
		//      方法：
		//              calcNode        ---     （重新）计算 Node 的位置信息 -- 当 node 的位置改变之后，需要重新计算
		//				defaultValideFn	---		验证函数，详见函数注释
		//              _showInput
		//              _hideInput
		//              _getSuit        ---
		//              _addOneSuit     ---
		//              _removeOneSuit  ---
		//              _use    ---
		//              _unuse  ---
		//              _isOnNode       ---     判断鼠标是否在 Node 上
		//              _opacityInput   ---
		//
		//      侦听器：
		//              _onNodeMousemove
		//              _onNodeMouseenter
		//              _onInputMousemove
		//              _onInputChange
		//              _onLoad
		//
		//      事件：
		//              add.suit
		//              remove.suit
		//              use.suit
		//              unuse.suit
		//              upload.start
		//              upload.success
		//              change.input
		//              load.iframe
		//              node.mouseenter ---     真实
		//              node.mousemove
		//              node.moveleave  ---     模拟
		//
		__constructor: function (options) {
			this.__cacheHandler = {};
			_.extend(this, options);

			_.isUndefined(this.isJSONP) && (this.isJSONP = true);
			_.isUndefined(this.extraInputs) && (this.extraInputs = {});

			this.suits = [];

			var suit = this._addOneSuit();

			this.nodeInfo = {};
			//先计算一次位置
			this.calcNode();

			this.node.on('mousemove', _.bind(this._onNodeMousemove, this));
			this.node.on('mouseenter', _.bind(this._onNodeMouseenter, this));

			//偏移位置保证按钮的中心位于鼠标下方
			this.offset = [35, 10];
			if ($.browser.msie) {
				this.offset[0] = 160;//200;
			} else if ($.browser.mozilla) {
				this.offset[0] = 160;
			}

			//JSONP格式会在返回给iframe的内容中发出事件： parent.xq.fire('iframe.loaded', data, this);
			//JSONP 和 非JSONP 方式的 load 处理函数相同，但获得 load 的方式不同
			this.isJSONP && xq.on('iframe.load', _.bind(function (data, iWin) {
				var _suit;
				$.each(this.suits, function (i, suit) {
					if (suit.iframe.get(0).contentWindow == iWin) {
						_suit = suit;
						return false;
					}
				});
				_suit && _suit.fire('load', data, _suit);
			}, this));
		},
		calcNode: function () {
			//jQuery 默认获取元素宽高是不计算padding, border, margin 的
			var w = xq.utils.getWidth(this.node, true, false, false);
			var h = xq.utils.getHeight(this.node, true, false, false);
			var offset = this.node.offset();
			var x = offset.left;
			var y = offset.top;

			this.nodeInfo = {
				width: w,
				height: h,
				x1: x,
				y1: y,
				x2: w + x,
				y2: h + y
			};
		},
		//默认提供一个验证图片格式的函数
		//还可以在构造函数中另外提供一个验证函数（需同名）
		//在自定义的函数中可以用：this.defaultValideFn(e, suit) 来调用这个默认的函数
		defaultValideFn: function (e, suit) {
			var $tar = suit.input;
			var val = $tar.val();

			if (val == '') return false;

			if (!xq.utils.isImg(val)) {
				alert('不支持的图片格式，请重选');
				return false;
			}
			return true;
		},
		//addInput('age', 20);
		//addInput({ 'name': 'David', 'age': 20 });
		addInput: function (name, value) {
			var kv;
			$.isPlainObject(name) ? (kv = name) : (kv = {}, kv[name] = value);
			_.each(this.suits, function (suit) {
				_.each(kv, function (value, name) {
					suit.form.append('<input type="hidden" name="' + name + '" value="' + (typeof value == 'object' ? xq.escapeHTML(JSON.stringify(value)) : value) + '">');
				});
			});
			_.extend(this.extraInputs, kv);
		},
		//removeInput('age');
		//removeInput(['name', 'age']);
		removeInput: function (name) {
			!_.isArray(name) && (name = [name]);
			var suits = this.suits;
			_.each(name, function (n) {
				_.each(suits, function (suit) {
					suit.form.find('input[name=' + n + ']').remove();
				});
				if (this.extraInputs.hasOwnProperty(n)) delete this.extraInputs[n];
			});
		},
		_getSuit: function (id) {
			return _.find(this.suits, function (suit) {
				return suit.id == id;
			});
		},
		_addOneSuit: function () {
			var isJSONP = this.isJSONP;
			var suitId = getId();

			// iframe 的 src 属性的值究竟是什么好，还没有敲定，不过就目前的这个解决方案来看，用 src="javascript:false" 应该不会再有问题了
			var iframe = $(_.template(__tmpl_iframe, { id: suitId, name: suitId, src: this.iframeSrc || iframeSrc }));
			var form = $(_.template(__tmpl_form, {
				iframeName: suitId,
				action: this.action,
				isJSONP: isJSONP,
				zIndex: this.zIndex || 1000,
				fileName: this.inputName,
				extraInputs: this.extraInputs
			}));
			var input = form.children('.file');

			//目前的解决方案中应该已经不需要 isUsing 了
			var suit = { id: suitId, isUsing: false, iframe: iframe, form: form, input: input };
			//给每一个 suit 添加事件的能力
			xq.Event.mixTo(suit);

			this.nowInput = input;
			this._isNowInputShown = false;
			this._opacityInput(0);

			if (isJSONP) {
				//JSONP 方式只需监听在构造函数中发出的 'load' 事件即可
				suit.on('load', _.bind(this._onLoad, this));
			} else {
				//非JSONP 方式
				xq.onIframeLoad({
					iframe: iframe.get(0),
					args: [suit],
					callback: _.bind(function (content, iframe, suit) {
						this._onLoad.call(this, content, suit);
					}, this)
				});
			}

			input.on('mousemove', _.bind(this._onInputMousemove, this));
			input.on('change', _.bind(this._onInputChange, this));

			//便于：根据任何一个元素来获取对应的suit
			iframe.data('suitId', suitId);
			form.data('suitId', suitId);
			input.data('suitId', suitId);
			this.suits.push(suit);

			$(doc.body).append(iframe).append(form);

			this.fire('add.suit', suit, this);

			return suit;
		},
		_removeOneSuit: function (id) {
			var suit = id.id ? id : this._getSuit(id);

			this.fire('remove.suit', suit, this);

			//移除绑定的事件--其实不移除也没问题，因为这个 suit 再也不会被找到了，也不会发出 on 事件了
			suit.off('load');
			//从DOM中移除
			suit.iframe.remove();
			suit.form.remove();
			//从维护列表中移除
			_.without(this.suits, suit);
		},
		//正在使用这个 IFRAME
		_use: function (suit) {
			suit.isUsing = true;
			this.fire('use.suit', suit, this);

			this._hideInput();
			var suit = this._addOneSuit();
		},
		//使用完毕这个IFRAME
		_unuse: function (suit) {
			suit.isUsing = false;
			this.fire('unuse.suit', suit, this);

			this._removeOneSuit(suit);
		},
		_isOnNode: function (x, y) {
			var info = this.nodeInfo;
			return x >= info.x1 && x < info.x2 && y >= info.y1 && y <= info.y2;
		},
		_opacityInput: function (number) {
			this.nowInput.css('opacity', number);
			return this;
		},
		_showInput: function () {
			this.nowInput.show();
			this._isNowInputShown = true;
			return this;
		},
		_hideInput: function () {
			this.nowInput.hide();
			this._isNowInputShown = false;
			return this;
		},
		_onNodeMousemove: function (e, xy) {
			var x = e.x = (e.clientX || xy.x) + xq.utils.getWinScroll('x');
			var y = e.y = (e.clientY || xy.y) + xq.utils.getWinScroll('y');

			if (!this._isOnNode(x, y)) {
				this._hideInput();
				this.fire('node.moveleave', e, this);
			} else if (!this._isNowInputShown) {
				this._showInput();
			}

			this.nowInput.css({
				left: x - this.offset[0],
				top: y - this.offset[1]
			});

			this.fire('node.mousemove', e, this);
		},
		_onNodeMouseenter: function (e) {
			this._showInput();

			//enter 即重新计算位置
			this.calcNode();
			//默认 enter 即显示
			//最后发出事件，以便进行任何操作，包括再隐藏input
			this.fire('node.mouseenter', e, this);
		},
		_onInputMousemove: function (e) {
			this.node.trigger('mousemove', { x: e.clientX, y: e.clientY });
		},
		_onInputChange: function (e) {
			var suit = this._getSuit($(e.target).data('suitId'));

			var valideFn = this.valideFn || this.defaultValideFn;
			if (valideFn(e, suit) === false) {
				suit.input.val('');
				return;
			}

			this._use(suit);
			this.fire('change.input', e, suit, this);
			this.fire('upload.start', e, suit, this);

			suit.form.submit();
		},
		_onLoad: function (data, suit) {
			this.fire('load.iframe', data, suit, this);
			this.fire('upload.success', data, suit, this);

			this._unuse(suit);
		}
	});


})(xq, jQuery, _, window, document);