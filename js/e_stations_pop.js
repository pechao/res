(function ($, _, xq, win) {



	/////////////////////////=======================================================================
	/////////////////////////=======================================================================支线的临时缓存
	/////////////////////////=======================================================================
	/////////////////////////=======================================================================
	//支线的缓存：
	//比如：主线下有4条支线，点击添加主线，4条支线全部保存，但拖拽站点时，把4条支线暂时缓存，
	//点击“取消”，则清空缓存，相当刚才没有任何拖拽动作。点击“保存”，则根据拖拽的情况处理4条支线---因为对后台来说，就只保存支线信息
	//===每个主线的支线的情况，缓存
	//===只是维护一个集合
	//var line_cache;
	xq.page.set('line_cache', []);

	//e.lines -- 主线下面的支线的集合 : Array--其实是个object，后台传过来的json，line_id 作为 键
	$.subscribe('reset-line-cache', function (e) {
		var tmp = [];
		xq.each(e.lines, function (line_id, lineObj, index) {
			tmp.push(line_id);
		});
		xq.page.set('line_cache', tmp);
	});

	//用户取消，之前的拖拽就不算数，缓存清空
	$.subscribe('clear-line-cache', function (e) {
		xq.each(xq.page.get('line_cache'), function (index, line_id) {
			delete win.userLinesPoll[line_id];
		});
	});


	/////////////////////////=======================================================================
	/////////////////////////=======================================================================支线的临时备份
	/////////////////////////=======================================================================
	/////////////////////////=======================================================================
	//拖拽之前的备份，因为有可能用户的拖拽取消，不算数了
	xq.page.set('line_backup', {});

	//设置备份
	//每次缓存是以 master_id 为一个集合来缓存一个 line_id 的数组
	//param e.line_ids:Array of line_id
	$.subscribe('set-line-backup', function (e) {
		//因为 Object 是按地址传递，所以，只能全部复制一遍
		var tmp = {};
		xq.each(e.line_ids, function (index, line_id) {
			tmp[line_id] = xq.utils.deepCopy(win.userLinesPoll[line_id]);
		});
		xq.page.set('line_backup', tmp);
	});

	//还原备份
	$.subscribe('restore-line-backup', function (e) {
		xq.each(xq.page.get('line_backup'), function (line_id, lineObj) {
			win.userLinesPoll[line_id] = lineObj;
		});
	});



	/////////////////////////=======================================================================
	/////////////////////////======================================================================= 发送用户线路信息到后台
	/////////////////////////=======================================================================
	/////////////////////////=======================================================================



	//缓存用户线路的JSON字符串，如果操作后完全没有变动，则不再Ajax发送
	var cache_userLinesPoll;
	//发送用户线路（已加入的）
	$.subscribe('send-lines-to-server', function (callback) {
		var serverUrl = xq.config.get('postUserLinesToServer');
		var userLinesPoll = win.userLinesPoll;
		var cross = xq.Data.Cross.getUserCross();
		var userline = JSON.stringify(switchFormatToServer(userLinesPoll,cross));

		//两个字符串比较
		if (userline === cache_userLinesPoll) return;

		cache_userLinesPoll = userline;

		$.post(serverUrl, { "select": userline }, callback);
	});



	//传到后台之前把格式转换一下：
	//1.提交格式变为：{ master: [12,..], line: { 1: { station_haunt: [111,..], station_interested: [11,..]},..}}
	//2.规则：感兴趣、出没的站点都为空的支线，不必放在 line 里面，只需在 master 里面即可
	//----------------------------其实，很简单，要是刚开始做的时候就这样就简单多了（但是在很扭曲的规则之后，然后也做好了，现在再改回去）：点了“+”添加线路，即（仅）保存主线，当拖动了支线之后（有站点信息了），再保存支线
	function switchFormatToServer(userLinesPoll, cross) {
		var master = _.keys(xq.data.get('userJoinedMasterObject'));
		var line = {};
		_(userLinesPoll).each(function (value, line_id) {
			master.push(value.master_id);
			if (!_.isEmpty(value.station_haunt) || !_.isEmpty(value.station_interested)) {
			//if (!_.isEmpty(value.hauntStations) || !_.isEmpty(value.interestedStations)) {
				line[line_id] = {
					station_haunt: value.station_haunt,
					station_interested: value.station_interested
				}
			}
		});
		master = _(master).uniq();

		var _cross = {};
		_.each(cross, function (cross, crossId) {
			_cross[crossId] = cross.stamp || [];
		});

		return {
			'master': master,
			'line': line,
			'cross': _cross
		}
	}

	/////////////////////////=======================================================================
	/////////////////////////=======================================================================
	/////////////////////////=======================================================================
	/////////////////////////=======================================================================



	//===================修改主线路按钮的显示状态“修改”“添加”
	//btn : emElement || master_id(String)
	$.subscribe('change-master-line-btn-mode', function (e) {
		var btn = e.btn, state = e.state;
		var master_id;
		if ($.type(btn) == 'string') {
			master_id = btn;
		} else {
			master_id = $(btn).data('masterid');
		}
		$('.stations-box li').each(function (index, element) {
			if (master_id != undefined && $(element).data('masterid') == master_id) {
				$(element).find('em').removeClass('add').removeClass('change').addClass(state);
			}
		});
	});

	//===================线路处理（添加、删除等动作）弹出窗 --- 绑定事件 --- “退出线路圈”、“保存”、“取消”等
	$.subscribe('bind-line-popbox-manager-child-events', function (e) {

		//保存 --- 按钮
		e.$popbox.find('.footer .save').on('click', function () {
			//过滤掉没有被拖拽的支线
			$.publish('filter-out-not-draged-line');
			$.publish('send-lines-to-server');
			$.publish('hide-the-line-select-popupbox', { '$popbox': e.$popbox });

			var confirm = xq.Widget.Confirm.getInstance('confirm.quitLine');
			confirm && confirm.hide();
		});

		//关闭 --- 按钮
		e.$popbox.find('.title .close-btn').on('click', function () {
			$.publish('restore-line-backup');
			$.publish('send-lines-to-server');
			$.publish('hide-the-line-select-popupbox', { '$popbox': e.$popbox });

			xq.Widget.Confirm.getInstance('confirm.quitLine').hide();
		});

		//取消 --- 按钮
		e.$popbox.find('.footer .cancle').on('click', function (_e) {
			_e.preventDefault();
			$.publish('restore-line-backup');
			$.publish('send-lines-to-server');
			$.publish('hide-the-line-select-popupbox', { '$popbox': e.$popbox });

			xq.Widget.Confirm.getInstance('confirm.quitLine').hide();
		});

		//退出线路圈 --- 按钮
		e.$popbox.find('.footer .quit-circle').on('click', function (_e) {
			var master_id = e.$popbox.data('masterid');
			var master_name = $('.add-stations-popobx .title b').text();

			var valideOp = xq.fn.exec('check-line-operate', {
				master: xq.fn.exec('getNowUserMaster'),
				cross: xq.Data.Cross.getUserCross()
			}, {
				op: 'quit',
				id: master_id,
				type: 'master'
			})

			if (!valideOp) return;

			var confirm = xq.Widget.Confirm.getInstance('confirm.quitLine');
			confirm.setLineName(master_name).set('lineId', master_id).popTo($(_e.target)).show();

			//var promptBox = $('.prompt-quite');

			//xq.utils.pop(promptBox);
			//promptBox.show();
			////promptBox.attr('master_id', master_id);
			//promptBox.data('masterid', master_id);
			//promptBox.find('h3 b').text(master_name);
		});
	});

	//===================线路处理（添加、删除等动作）弹出窗 --- 显示
	$.subscribe('pop-the-line-select-popupbox', function (e) {
		//btn:点击的那个 添加＋、修改 按钮，popbox：弹出窗
		//var btn = e.btn;
		var popbox = e.popbox;
		var master_id = e.master_id;
		var showExitBtn = e.showExitBtn;
		var lineName = e.lineName;

		var exitBtn = popbox.find('.footer .btns b');

		//是否显示“退出线路圈”按钮
		showExitBtn ? exitBtn.hide() : exitBtn.show();
		//弹出框的标题
		popbox.find('.title b').text(lineName);

		xq.utils.pop(popbox);
		popbox.show().data('masterid', master_id);
	});

	//====================线路处理（添加、删除等动作）弹出窗 --- 隐藏
	$.subscribe('hide-the-line-select-popupbox', function (e) {
		e.$popbox.hide();
	})

	//====================过滤掉没有被拖拽的支线
	//过滤原则:
	//------① 如果都没有拖拽，则支线全部保存
	//------② 如果其中有拖拽的，也有-没有拖拽的，则把没有拖拽的过滤掉！
	$.subscribe('filter-out-not-draged-line', function (e) {
		var draged = [], noDraged = [];
		xq.each(xq.page.get('line_cache'), function (index, line_id) {
			hadDrag(line_id) ? draged.push(line_id) : noDraged.push(line_id);
		});

		(draged.length !== 0) ? _(noDraged).each(function (line_id) { delete userLinesPoll[line_id]; }) : null;

		function hadDrag(line_id) {
			var userLinesPoll = win.userLinesPoll;

			// interest || haunt 有一个拖拽即说明有拖拽了
			return !(userLinesPoll[line_id] ? (userLinesPoll[line_id]['station_interested']['length'] == 0 ? true : false) : false) || //!noInterest => hasInterest
			!(userLinesPoll[line_id] ? (userLinesPoll[line_id]['station_haunt']['length'] == 0 ? true : false) : false); //!noHaunt => hasHaunt
		}
	});


	//淡出并移除元素
	$.subscribe('fade-than-remove', function (e) {
		e.$el.fadeOut(function () {
			e.$el.remove();
			e.callback();
		});
	});

})(jQuery, _, xq, window);