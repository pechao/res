var _scrollbarFuckIE6 = window.scrollbar;


(function ($, exports) {
	//此页面内部的全局变量
	var G = {};

	//全部以 xq.Data.Line 取代
	//var masterJSON = {};

	exports.userLinesPoll = {};
	//把object中值为Number的全部变为String...主要是Json解析的id是Number，而从HTML获取的 都是 String
	//返回一个新的对象
	function objNumValueToString(obj) {
		var type = xq.utils.getType(obj),
			__toFn = arguments.callee;
		if (type == 'number') {
			return obj.toString();
		} else if (type == 'object' || type == 'array') {
			var t = type == 'object' ? {} : [];
			xq.each(obj, function (key, value) {
				var temp = __toFn(value);
				t[key] = temp;
			});
			return t;
		} else {
			return obj;
		}
	}

	//用现有的 DOM 更新 跨城的数据 （比如推荐线路的DOM）---- 默认数据只有用户已加入的数据
	$.subscribe('update-cross-data-by-dom', function (e) {
		e.nodes.each(function (i,node) {
			node = $(node);
			var crossId = node.data('crossid');
			xq.Data.Cross.update(crossId, {
				popularity: node.find('.hot b').text(),
				feed: node.find('.news-num b').text()
			});
		});
	});

	//加载完城市之后就更新跨城的数据
	xq.Data.City.event.on('load.data', function (city) {
		$.publish('update-cross-data-by-dom', { 'nodes': $('.suggest li[data-crossid]') });
	});




	var Cross;

	(function () {
		var crossInstances = [];
		Cross = $.inherit(xq._Base, {
			//参数：
			//	html String
			//	crossId [ Number | String ]

			//对外接口：
			//
			//	方法：
			//
			//	事件：
			//
			__constructor: function (options) {
				this._node = $(options.html);
				this._crossId = options.crossId;

				crossInstances.push(this);
				this.__GetterSetter();
			},
			setPopularity: function (num) {
				this.getNode().find('.hot b').text(num);
			},
			changeButtonMode: function (isToAdd) {
				this.getNode().find('.mdl>em').attr('class', isToAdd ? 'add' : 'change');
			},
			destroy: function () {
				var self = this.__self.getInstance(this.getNode());
				var index = _.indexOf(crossInstances, self);

				this.getNode().remove();
				crossInstances.splice(index, 1);
			}
		}, {
			getInstance: function (node) {
				var get;
				$.each(crossInstances, function (i,cross) {
					if (cross.getNode().is(node)) {
						get = cross;
						return false;
					}
				});
				return get;
			}
		});

		$.subscribe('loaded.cross', function (e) {
			$.each(crossInstances, function (i,cross) {
				if (cross.getCrossId() != e.crossId) return;

				cross.setPopularity(e.popularity);
			});
		});

	})();













	$(function () {

		///////////////////////////////// 注册第二步 页面中间的“搜索线路圈子”------之前写到comon.js里面了，其实不应该，这只有注册第二步才有
		//----------------------这个会用到上面搜索的一些函数
		var searhCircle = {
			info: {
				selector: undefined,
				//返回结果的数量
				maxResultNum: {
					master: 4,
					cross: 1
				}
			},
			init: function (selector) {
				var that = this;
				this.info.selector = selector;
				//点击“搜索”按钮
				$(selector).find('.search em').on('click', function () {
					that.confirmInput();
				});
				//用户输入，实时搜索
				$(selector).find('.search-input input').on('keyup', function (e) {
					that.confirmInput();
				});
				//回车 确定搜索
				$(selector).find('input').on('keyup', function (e) {
					if (e.keyCode == 13) {
						that.confirmInput();
					}
				});
			},
			//回车确定
			confirmInput: function () {
				var line = xq.filtInput($(this.info.selector).find('input').val().toLowerCase());
				var matched = [];
				if (line != '') {
					var master = seachLineSuggest.getMatchedMaster(line, this.info.maxResultNum.master);
					var city = seachLineSuggest.getMatchedCross(xq.Data.City.getCity(), line, this.info.maxResultNum.cross);
					var cross = this.getCrossesByCities(city);

					//因为布局的原因，搜索框占了一个高度，所以 +1
					var searchLen = _.keys(master).length + _.keys(cross).length + 1;
					var joinedLen = _.keys(xq.Data.Master.getUserMaster()).length + _.keys(xq.Data.Cross.getUserCross()).length;
					//此处，只做搜索结果框的自适应高度
					//已加入的框，已经有了自适应高度
					if (searchLen > joinedLen) {
						G.setRegLinesWrapHeight(searchLen);
					}

					matched = matched.concat(master, cross);
				}
				this.getHtml(matched);
			},
			//根据结果集生成HTML
			getHtml: function (matched, wrapEl) {
				var that = this, wrapEl = wrapEl || $(that.info.selector);

				this.ifEmpty(matched.length, wrapEl);

				//wrapEl.find('ul li').remove();
				wrapEl.find('ul li').each(function (i, li) {
					var cross = Cross.getInstance(li);
					if (cross) {
						cross.destroy();
					} else {
						$(li).remove();
					}
				});

				//这个 li 元素有“人气”“新鲜事”“交通类型”“线路名称”“是否已加入（‘添加’或‘修改’）”等数据，目前的 json 只有“线路名称”
				var container = wrapEl.find('ul.stations-box');
				$.each(matched, function (index, line) {
					var liEl = G.renderMasterLine(line);
					if (line.cross_id) liEl = (new Cross({ html: liEl, crossId: line.cross_id })).getNode();
					container.append(liEl);
				});
			},
			ifEmpty: function (liNum, wrapEl) {
				if (liNum > 0)
					wrapEl.find('.if-empty').hide();
				else
					wrapEl.find('.if-empty').fadeIn(200);
			},
			getCrossesByCities: function (cities) {
				var cross = [];
				var currentCityId = xq.Data.City.getCurrentCity();
				_.each(cities, function (city) {
					cross.push(xq.Data.Cross.getCross(currentCityId, city.city_id));
				});
				return cross;
			}
		}

		exports.searhCircle = searhCircle;
		searhCircle.init('.search-part');

	});



















	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////





	var han_pin, masters;

	//修改主线路按钮的显示状态“修改”“添加”
	//btn : emElement || master_id(String)
	function chmodBtn(btn, state) {
		var master_id;
		if ($.type(btn) == 'string') {
			master_id = btn;
		} else {
			master_id = $(btn).data('masterid');
		}
		$('.stations-box li').each(function (index, element) {
			if ($(element).data('masterid') == master_id) {
				$(element).find('em').removeClass('add').removeClass('change').addClass(state);
				//return false;--可能有多个
			}
		});
	}





	//删除线路
	$.subscribe('registerStep2.delete-line', function (e) {
		//数据
		//master 对象
		delete xq.data.get('userJoinedMasterObject')[e.master_id];
		//line 对象
		//在  $.publish('clear-line-cache');  的时候已经清除了

		//下一步按钮
		checkNextBtn(false);
	});

	//点击下一步
	$.subscribe('registerStep2.next-step', function (e) {
		if (checkNextBtn(true)) {
			var form = $('#linesForm');
			form.find('input').val(JSON.stringify(userLinesPoll));
			form.submit();
		}
	});

	//页面加载完了，先检查一下“下一步”按钮
	//checkNextBtn(false);
	function checkNextBtn(showError) {
		//var len = _.keys(userLinesPoll).length;
		//xq.log(userLinesPoll);
		//(!xq.data.get('userJoinedMasterObject') && userLinesPoll) && xq.data.set('userJoinedMasterObject', userLinesPoll);
		var userJoinedMasterObj = xq.data.get('userJoinedMasterObject');
		var len = (userJoinedMasterObj && _.keys(userJoinedMasterObj).length) || _.keys(userLinesPoll).length;
		if (len === 0) {
			$('.next-btn div').attr('class', (showError ? 'error' : 'ok'));
			$('.next-btn').removeClass('next-btn2');
			return false;
		} else {
			$('.next-btn div').attr('class', 'ok2');
			$('.next-btn').addClass('next-btn2');
			return true;
		}
	}

	//退出登录
	$.subscribe('registerStep2.logout', function (e) {
		xq.logout(xq.config.get('logoutUrl'), function () { });
	});







	//alert(window.scrollbar);
	$(function () {
		//alert(window.scrollbar);----------------------------------IE6在这里就变成了字符串：.scrollbar-wrap .scroll-bg .btm,.scrollbar-wrap .scroll-bg .top,

		$('.next-btn').on('click', function (e) {
			$.publish('registerStep2.next-step', e);
		});
		$('#logout').on('click', function (e) {
			$.publish('registerStep2.logout', e);
		});

		//0. 首先获取用户的个人线路信息
		var userLinesUrl = xq.config.get('getPersonalLineInfo');
		$.getJSON(userLinesUrl, function (json) {
			
			if (json.error != 200) {
				//同下面的赋值一样，只是在未取得数据的情况下，赋值空对象
				xq.data.set('userJoinedMasterObject', {});
				return;
			}
			json = objNumValueToString(json);
			//因为 json.line 为空时，返回的是个 数组[]，对PHP来说，[]和{}是一样的
			!_(json.line).isEmpty() && (userLinesPoll = json.line);
			//加入的跨城线路
			//xq.data.set('userJoinedCrossLine', json.cross);
			xq.Data.Cross.setUserCross(json.cross);
			try {
				//如果已经加入了（其他城市的）线路，则把这个信息先存储起来
				//TODO:接口变化
				xq.data.set('userJoinedMasterObject', json.master);
				//新接口
				xq.Data.Master.setUserMaster(json.master);
			} catch (e) { };
			xq.multiEvents.fire(Events.UserLinesLoaded);

			//页面加载完了，先检查一下“下一步”按钮
			checkNextBtn(false);
		});

		//格式改变了，详细原因参见函数：switchFormatToServer(e-stations-pop.js)
		function switchFormatFromServer(json) {

		}

		xq.fn.add('getNowUserMaster', function () {
			var justJoined = xq.Data.Master.getMaster(_.map(window.userLinesPoll, function (line) { return line.master_id; }));
			var userMaster = _.extend({}, xq.Data.Master.getUserMaster(), justJoined);
			return userMaster;
		});

		//1. 鼠标hover线路 li 标签 --- 不需要 HOVER 了
		/*$('.stations-box').on('mouseenter', 'li', function () {
			$(this).find('.short-name').hide().end().find('.full-name').show().end().find('.hot').hide().end().find('.news-num').show().end().css('z-index', '10');
		});
		$('.stations-box').on('mouseleave', 'li', function () {
			$(this).find('.full-name').hide().end().find('.short-name').show().end().find('.news-num').hide().end().find('.hot').show().end().css('z-index', '0');
		});*/
		//2. 点击按钮弹出线路圈的选择框
		var popbox = $('.add-stations-popobx');


		$('.stations-box').on('click', 'li em', function (e) {
			var btn = $(e.target);
			var li = btn.parents('li');
			var isAddBtn = btn.hasClass('add');
			var master_id = btn.data('masterid');
			var cross_id = btn.data('crossid');
			var branchNum = btn.attr('num');
			var lineUrl = xq.Data.Line.getLoadLineUrl(master_id);//xq.config.get('addLineServer') + '?master_id=' + master_id;
			var lineName = btn.siblings('.station-name').children('span').text();

			//var userMaster = xq.data.get('userJoinedMasterObject');
			//userLinesPoll -- 这是 支线，需要过滤出 Master 来 -- TODO: 整个线路的存取方式 太（！！！）混乱了，要整改
			var userMaster = xq.fn.exec('getNowUserMaster');
			//var userMaster = xq.Data.Master.getUserMaster();
			var userCross = xq.Data.Cross.getUserCross(); //xq.Data.User.getInstance().getCross();
			var master = xq.data.get('dict-city-master')[xq.data.get('page-city-id')][master_id] || userMaster[master_id];
			var cross = xq.Data.Cross.getCross(cross_id);//xq.data.get('userJoinedCrossLine')[cross_id];
			//var isCross = !!cross;//master.cross_id;

			//验证当前操作是否合法 -- 添加的时候验证，编辑的时候不验证，之后就是在点“退出”的时候再验证
			if (isAddBtn && !xq.fn.exec('check-line-operate', {
				master: userMaster,
				cross: userCross
			}, {
				op: isAddBtn ? 'join' : 'quit',
				id: cross ? cross_id : master_id,
				type: cross ? 'cross' : 'master'
			})) {
				return;
			};

			//1. 首先，从右侧的推荐列表里面删除这条已添加的线路
			btn.parents('.suggest').length != 0 && li.remove();

			xq.fn.exec('manageMasterPopup', btn, li, isAddBtn, master_id, cross_id, branchNum, lineUrl, lineName, userMaster, userCross, master, cross);
		});

		xq.fn.add('manageMasterPopup', function (btn, li, isAddBtn, master_id, cross_id, branchNum, lineUrl, lineName, userMaster, userCross, master, cross) {

			//先检查缓存，若无，则ajax请求后台
			if (!cross) {
				//if (!masterJSON[master_id]) {
				//	xq.getJSON(lineUrl, function (json) {
				//		whenJsonBack(json, master_id);
				//	});
				//} else {
				//	whenJsonBack(masterJSON[master_id]);
				//}
				xq.Data.Line.getLines(master_id, function (lines) {
					whenJsonBack({ line: lines }, master_id);
				});
			} else if (isAddBtn) {
				xq.Data.Cross.join(cross.cross_id, function (cross) {

				});
				addLineToJoinedArea(cross.cross_id, true);

				//检查下一步按钮
				checkNextBtn(false);

				$.publish('send-lines-to-server', function () {
					$.publish('change-master-line-btn-mode', { 'btn': btn, 'state': 'change' });
				});
				var ins = Cross.getInstance(li);
				ins && ins.changeButtonMode(false);
			}


			//在注册第二步都弹出，但是，在线路管理页，添加按钮不需要弹出窗
			if (isAddBtn && xq.data.get('is-add-btn-not-show-pop-manager')) return;

			//处理弹出窗 -- 添加按钮不需要弹出，修改按钮再弹出
			if (!isAddBtn) {
				if (cross) {
					var passport = xq.data.get('passport').set('crossId', cross_id).setLineName(lineName).set('lineId', cross_id);
					passport.removeAllStamps().addStamps(userCross[cross_id].stamp).pop().show();
				} else {
					$.publish('pop-the-line-select-popupbox', {
						//'btn': btn,
						'popbox': popbox,
						'master_id': master_id,
						'showExitBtn': isAddBtn,
						'lineName': lineName
					});
				}
			}

			function whenJsonBack(json, master_id) {

				json = objNumValueToString(json);

				//branchOpt.info.branchNum = branchNum;
				branchOpt.info.branchNum = _(json.line).keys().length;
				branchOpt.info.branches = json.line;
				branchOpt.init('.add-stations-popobx');

				//清空缓存数组
				$.publish('reset-line-cache', { 'lines': json.line });

				var these_lines = [];
				$.each(json.line, function (line_id, lineObj) {
					///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////      从后台取回来不见得是空的      !!!!!!!!!!!!!!
					if (!userLinesPoll[line_id]) {
						//把用户的线路信息保存到全局变量
						userLinesPoll[line_id] = {
							'line_id': line_id,
							///////////////////////////////////////!!!
							'station_haunt': [],
							///////////////////////////////////////!!!
							'station_interested': [],
							'master_id': lineObj['master_id']
						};
					}

					these_lines.push(line_id);
				});

				$.publish('set-line-backup', { 'line_ids': these_lines });

				//如果之前没有加入，则ajax 发送到后台
				if (btn && btn.hasClass('add')) {
					$.publish('send-lines-to-server', function () {
						$.publish('change-master-line-btn-mode', { 'btn': btn, 'state': 'change' });
					});
					addLineToJoinedArea(btn.data('masterid'));
				}

				//已经在 xq.Data.Line.getLines 中缓存了
				//master_id && (masterJSON[master_id] = json);

				//检查下一步按钮
				checkNextBtn(false);
			}
		});

		function addLineToJoinedArea(master_id, isCross) {
			//seachLineSuggest 在 common.js 这个文件中
			var hadin = $(xq.f('#lines-wrap .had-in li[data-' + (isCross ? 'crossid' : 'masterid') + '={0}]', master_id));
			if (hadin.length !== 0) {
				//不重复添加
				return;
			}

			var liHtml = G.renderMasterLine(isCross ? (xq.Data.Cross.getCross(master_id)) : (exports.masters[master_id]));
			$(liHtml).hide().appendTo('#lines-wrap .had-in ul').fadeIn();

			//把搜索框中的结果有“add”状态变为“change”
			$('.search-result li[data-masterid=' + master_id + ']').find('em').removeClass('add').addClass('change');

			var liNum = $('#lines-wrap .had-in li').length;
			searhCircle.ifEmpty(liNum, $('#lines-wrap .had-in'));

			//注册第二步需要设置，但是线路管理页不需要重设高度，则，手动设置这个变量即可
			if (xq.data.get('should-NOT-set-reg-lines-wrap-height')) return;
			G.setRegLinesWrapHeight(liNum);
		}
		function removeLineFromJoinedArea(master_id, isCross) {
			var liElem = $('#lines-wrap .had-in li[data-' + (isCross ? 'crossid' : 'masterid') + '=' + master_id + ']');
			$.publish('fade-than-remove', {
				'$el': liElem,
				'callback': function () {
					var liNum = $('#lines-wrap .had-in li').length;
					//注册第二步需要设置，但是线路管理页不需要重设高度，则，手动设置这个变量即可
					!xq.data.get('should-NOT-set-reg-lines-wrap-height') && G.setRegLinesWrapHeight(liNum);
					searhCircle.ifEmpty(liNum, $('#lines-wrap .had-in'));
				}
			});
		}
		xq.data.set('removeLineFromJoinedArea', removeLineFromJoinedArea);

		//3. 弹出线路选择框，支线的滑动 js
		var branchOpt = {
			info: {
				selector: undefined,
				//每次点击支线滚动的距离
				distance: 30,
				wrapWidth: undefined,
				branchNum: undefined,
				branches: {},
				//当前显示的支线的id
				now_line_id: 0,
				branchAllWidth: undefined,
				branchWrapWidth: undefined,
				branchBarScrollDistance: 100,
				canScroll: false
			},
			/**
			* target 初始化
			*
			*/
			init: function (selector) {
				this.info.selector = selector;
				this.info.wrapWidth = $(selector).find('.branch-line div').width();

				this.fillBranchUlist();
				this.fillStationUlist();

				//生成滚动条，并挂载到DOM 的 data 中
				$('.scroll-area').each(function (index, el) {
					new (xq.page.get('ScrollbarV'))(el)
				});


				this.initBranchView();

				this.bindEvent();
			},
			bindEvent: function () {
				if (arguments.callee.hadBinded === true) {
					//不要重复绑定事件
					return;
				} else {
					arguments.callee.hadBinded = true;
				}


				var selector = this.info.selector;
				var dis = this.info.branchBarScrollDistance;
				var that = this;
				var $popbox = $(selector);

				$popbox.find('.branch-line').on('click', function (e) {
					var tagName = e.target.tagName.toLowerCase(),
						target = e.target,
						nowLeft = parseInt($(this).find('ul').css('margin-left'));
					//←
					if (tagName == 'b') {
						that.scrollBranchView(nowLeft + dis);
					//→
					} else if (tagName == 'i') {
						that.scrollBranchView(nowLeft - dis);
					}
					//点击某条“支线”
					//切换支路的选择
					else if (tagName == 'li') {

						var line_id = $(target).attr('line_id');
						$(target).addClass('now').siblings('li').removeClass('now');
						that.info.now_line_id = line_id;
						that.fillStationUlist();
					}
				});

				$.publish('bind-line-popbox-manager-child-events', { '$popbox': $popbox });
			},
			bindDragDrop: function () {
				var that = this;
				var $popbox = $(this.info.selector);
				//拖
				$popbox.find('.main li').draggable({ helper: 'clone', opacity: 0.5 });
				//放
				$popbox.find('.main .stations-wrap').droppable({
					drop: function (e, ui) {
						var li = $(ui['draggable']['context']);

						if (!li.parent().hasClass('scroll-content')) {
							//只有站点的元素执行此操作
							return;
						}

						li.appendTo($(e.target).find('ul'));

						var master_id = $popbox.data('masterid');

						var key_replace = {
							'haunt-stations': 'station_haunt',
							'interested-stations': 'station_interested'
						}

						//重新计算滚动条
						that.resetScrollbar();
						//把数据保存到线路的缓存对象中
						var type = key_replace[$(e.target).parent().attr('type')];
						var station_id = li.attr('station_id');
						var line_id = li.attr('line_id');

						//把数据保存到全局变量中
						that.addUserStation(line_id, type, station_id);
					}
				});
			},
			addUserStation: function (line_id, type, station_id, master_id) {
				if (line_id === undefined)
					return;
				//先在另一个里面删除
				var user_line = userLinesPoll[line_id];
				if (!user_line) return;

				//先唯一，不排除哪里写的逻辑问题，多次添加...
				user_line['station_interested'] = _.uniq(user_line['station_interested']);
				user_line['station_haunt'] = _.uniq(user_line['station_haunt']);

				//两个地方都删了，以免漏网...
				user_line['station_interested'] = _.without(user_line['station_interested'], station_id);
				user_line['station_haunt'] = _.without(user_line['station_haunt'], station_id);

				//然后添加 --- userLinesPoll[line_id][type]如果是“notFamiliar”，则不管
				user_line[type] && user_line[type].push(station_id);
			},
			scrollBranchView: function (to) {
				var dis = this.info.branchWrapWidth - this.info.branchAllWidth;
				if (to > 0) {
					to = 0;
					$(this.info.selector).find('.branch-line b').removeClass('canclick');
				} else if (to < dis) {
					to = dis;
					$(this.info.selector).find('.branch-line i').removeClass('canclick');
				} else {
					$(this.info.selector).find('.branch-line i').addClass('canclick');
					$(this.info.selector).find('.branch-line b').addClass('canclick');
				}
				if (this.info.canScroll) {
					$(this.info.selector).find('.branch-line ul').stop().animate({ 'margin-left': to }, 'fast');
				}
			},
			/*
			* target
			*/
			initBranchView: function () {
				var selector = this.info.selector, branchView = $(selector).find('.branch-line');
				this.info.branchNum = _.keys(this.info.branches).length;
				//是否显示分支的选择
				parseInt(this.info.branchNum) > 1 ? branchView.show() : branchView.hide();
				var branchAllWidth = this.info.branchAllWidth = this.calcBranchViewWidth();
				var wrapWidth = this.info.branchWrapWidth = parseInt($(this.info.selector).find('.branch-line div').css('width'));
				if (wrapWidth < branchAllWidth) {
					branchView.find('i').addClass('canclick');
					this.info.canScroll = true;
					branchView.find('li:last').css('border-right-width', 0);
				}
			},
			calcBranchViewWidth: function () {
				var that = this,
					width = 0;
				$(this.info.selector).find('.branch-line li').each(function (index, el) {
					width += that.getWidth(el);
				});
				return width;
			},
			/**
			* target 生成 支线信息
			* para branches Array 支线的信息
			*/
			fillBranchUlist: function (/*branches*/) {
				var that = this,
					info = this.info,
					ulList = $(info.selector).find('.branch-line ul');

				this.resetBranchUlist();

				var i = 0;
				var tmpl = xq.getTmpl('branch-line-li-tmpl');
				$.each(info.branches, function (line_id, lineObj) {
					ulList.append(_.template(tmpl, { 'class_name': (i === 0 ? 'now' : ''), 'line_id': line_id, 'line_full_name': lineObj['full_name'] }));
					i++ === 0 && (info.now_line_id = line_id);
				});
			},
			//重置 <ul></ul>
			resetBranchUlist: function () {
				//1. 所有 <li> 全部清空
				//2. 返回顶部（左侧）
				//3. 清除左右点击按钮的“可点击状态”
				$(this.info.selector).find('.branch-line ul').empty().css({ 'margin-left': 0 }).end().find('b').removeClass('canclick').end().find('i').removeClass('canclick');
			},
			fillStationUlist: function () {
				var info = this.info,
					line_id = info.now_line_id;

				this.resetStationUlist();

				$.each(info.branches[line_id]['station'], function (station_id, stationObj) {
					//这个数据还需要后台多加些属性“relation”--用户对此站的关系“感兴趣”“出没”等
					var relation = 'not-familiar';
					if (userLinesPoll[line_id]) {
						var inInterest = $.inArray(station_id, userLinesPoll[line_id]['station_interested']),
							inHaunt = $.inArray(station_id, userLinesPoll[line_id]['station_haunt']);
						if (inInterest != -1) {
							relation = 'interested-stations';
						} else if (inHaunt != -1) {
							relation = 'haunt-stations';
						}
					}

					var __tmpl_station = '<li station_id="<%= station_id %>" line_id="<%= line_id %>" x="<%= x %>" y="<%= y %>" title="<%= name %>"><%= name %></li>';
					stationObj.line_id = line_id;
					var html = _.template(__tmpl_station, stationObj);
					//var html = '<li station_id="' + stationObj['station_id'] + '" line_id="' + line_id + '" x="' + stationObj['x'] + '" y="' + stationObj['y'] + '" title="' + stationObj['name'] + '">' + stationObj['name'] + '</li>';
					$(info.selector).find('.' + relation + ' ul').append(html);
				});

				//重新绑定拖拽
				this.bindDragDrop();
			},
			resetStationUlist: function () {
				//1. 所有的列表全部清空
				//2. 返回顶部
				$(this.info.selector).find('.main ul').empty().css('margin-top', 0);
				//$(this.info.selector).find('.main ul').remove();
			},
			resetScrollbar: function () {
				//scrollbar = _.isString(scrollbar) ? _scrollbarFuckIE6 : scrollbar;

				$('.scroll-area').each(function (index, El) {
					//对IE6来说，scrollbar 是字符串而非对象
					$.publish('reset-scrollbar-v', { '$scrollarea': $(El) });
				});
			},
			//三个模块中都是：只有索引未知的ul列表显示
			showUlIndex: function (index) {
				var wrap = $(this.info.selector);
				wrap.find('.not-familiar ul').eq(index).removeClass('hide').siblings().addClass('hide');
				wrap.find('.interested-stations ul').eq(index).removeClass('hide').siblings().addClass('hide');
				wrap.find('.haunt-stations ul').eq(index).removeClass('hide').siblings().addClass('hide');
			},
			/**
			* target 获取元素的宽度 包括：width + padding-left|right + border-left|right
			* para ele: Element
			*/
			getWidth: function (ele) {
				ele = $(ele);
				return ele.width() + parseInt(ele.css('padding-left')) + parseInt(ele.css('padding-right')) + parseInt(ele.css('border-left-width')) + parseInt(ele.css('border-right-width'));
			}
		}
		//4. 确认退出此线路圈 --- 这个用不着了，因为不用这个弹出框了
		$('.prompt-quite').on('click', 'p', function (e) {
			var promptBox = $('.prompt-quite');
			var target = e.target;
			master_id = promptBox.data('masterid');
			//确认退出 此线路！
			if ($(target).hasClass('sure')) {
				$.publish('sureQuit.master', { master_id: master_id });
			}
			//else if ($(target).hasClass('cancel')) { }
			promptBox.hide();
		});

		//
		$.subscribe('sureQuit.master', function (e) {
			var master_id = e.master_id;
			$.publish('clear-line-cache');

			$.publish('change-master-line-btn-mode', { 'btn': master_id, 'state': 'add' });
			$.publish('hide-the-line-select-popupbox', { '$popbox': popbox });

			//从 “已加入的线路圈” 区域中移除
			removeLineFromJoinedArea(master_id);
			//在搜索结果列表中修改状态
			$(_('.search-result li[data-masterid={0}]').format(master_id)).find('em').removeClass('change').addClass('add');

			$.publish('registerStep2.delete-line', { 'master_id': master_id });

			$.publish('send-lines-to-server');
		});







		(function ($, _exports) {
			//=============================已加入的线路
			var hadJoined = {
				init: function () {
					//接口改了：后台会把当前用户加入的所有的主线都返回，而不是支线了，这样就不需要用支线来合成主线了
					this.getHtml(_.toArray(xq.data.get('userJoinedMasterObject')).concat(_.toArray(xq.Data.Cross.getUserCross())));
				},
				getHtml: function (matched_lines) {
					searhCircle.getHtml(matched_lines, $('#lines-wrap .had-in'));
					var len = $('#lines-wrap .had-in li').length;

					//注册第二步需要设置，但是线路管理页不需要重设高度，则，手动设置这个变量即可
					if (xq.data.get('should-NOT-set-reg-lines-wrap-height')) return;
					G.setRegLinesWrapHeight(len);
				}
			}
			xq.multiEvents.on([Events.UserLinesLoaded, Events.MasterLinesLoaded], function () {
				hadJoined.init();
			});

			//渲染HTML的 线路信息--搜索匹配显示主线路
			function renderMasterLine(masterObj) {
				var master_id = masterObj.master_id;
				var cross_id = masterObj.cross_id;
				var lineName = masterObj.lineName = masterObj.name;
				//masterObj.shortName = lineName.length > maxLineName ? lineName.slice(0, maxLineName) + '...' : lineName;

				//接口更改之后，直接就是master，不全部都用支线来计算出主线了
				masterObj.hadJoined = master_id ? !_.isUndefined(xq.data.get('userJoinedMasterObject')[master_id]) : !!xq.Data.Cross.getUserCross()[cross_id]; //!_.isUndefined(xq.Data.Cross.getCross(cross_id));
				//跨城线路
				//masterObj.is_cross ? masterObj.type = 'cross' : null;

				masterObj.master_id = masterObj.master_id || false;
				masterObj.cross_id = masterObj.cross_id || false;
				masterObj.cross_id && (masterObj.type = 'cross');
				var li = _.template(xq.getTmpl('station-li-tmpl'), masterObj);
				return li;
			}


			//设置 注册第二步的 线路区域的整体高度
			function setRegLinesWrapHeight(liNum) {
				
				var titleHeight = 30;
				var paddingTop = 9;
				var paddingBottom = 5;
				var liHeight = 58;
				var height = liNum * liHeight + paddingTop + paddingBottom + titleHeight;

				var searchHeight = 54, middleMargin = 13, arrowHeight = 9, borderTop = 1;
				var minHeight = 379;
				height = (height < minHeight) ? minHeight : height;
				$('#lines-wrap .had-in').css('height', height);
				$('#lines-wrap .search-part .wrap').css('height', height - searchHeight - middleMargin - arrowHeight + borderTop);
				$('#lines-wrap .suggest').css('height', height);
			}


			_exports.renderMasterLine = renderMasterLine;
			_exports.setRegLinesWrapHeight = setRegLinesWrapHeight;
		})($, G);
	});


})(jQuery, window);