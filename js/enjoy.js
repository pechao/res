//var threadForm, mask;
jQuery(function ($) {
	//在页面上最多显示几条线路（其他的放在“更多”的下拉里面）
	var maxLineShown = 3;

	//目前，页面是保证最少显示5条线路的，也就意味着，线路肯定会大于 maxLineShow，并且其他的在 “更多”里面
	var nowLineAll = maxLineShown + $('#enjoy-line-pulldown>li').length;

	var threadForm, mask;


	//发布表单处理区
	(function () {
		
		threadForm = new xq.Widget.Popup({
			domId: 'threadForm',
			needOkBtn: false,
			needCancelBtn: false
		}).appendTo().hide();

		var formNode = threadForm.getNode();

		threadForm.setProperty = function (eventId) {
			var event = xq.data.get('propertyOfEvent')[eventId];
			var isMaster = event.master;
			var lineData = event.master || event.cross;
			lineData[isMaster ? 'master_id' : 'cross_id'] = lineData.id;
			xq.fn.exec('set_selected_line', lineData);

			var dealData = event.event;
			var imgDom = formNode.find('.intro-l');
			dealData.src ? imgDom.show().find('img').attr('src', dealData.src) : imgDom.hide();
			formNode.find('h3 a').text(dealData.title);
			formNode.find('.intro-r p').text(dealData.content);

			this.addInput('event_id', eventId);

			return this;
		}

		threadForm.addInput = function (key, value) {
			xq.fn.exec('add_form_keyvalue', key, value);
		}

		mask = new xq.Widget.Mask({ zIndex: 100 }).appendTo();
		
		formNode.append($('.msg-panel').children().show().parent()).css('z-index', 105);
		formNode.find('.station-sel').show();


		mask.getNode().on('click', function () {
			threadForm.hide();
		});

		threadForm.on('show', function () {
			formNode.find('.msg-form').stop(true).show();
			mask.show();
		}).on('hide', function () {
			mask.hide();
		});
		formNode.find('.btn-cancle').on('click', function () {
			threadForm.hide();
		});
	})();






	//管理 cookie line
	//		-------------	线路之间用“,”（半角逗号）分割
	var cookieLineManager = {
		add: function (masterid) {
			var lines = this.get();
			if (!_.isUndefined(_.find(lines, function (line) { return line == masterid }))) return;
			lines.push(masterid);
			this._set(lines);
		},
		del: function (masterid) {
			//加进去之后永远都是 字符串，故此，删除也要用字符串
			masterid = masterid.toString();
			var lines = this.get();
			if (_.isUndefined(_.find(lines, function (line) { return line == masterid }))) return;
			lines = _.without(lines, masterid);
			this._set(lines);
		},
		_set: function (lines) {
			xq.cookie.set(xq.data.get('cookie_line_name'), lines.join(','));
		},
		get: function () {
			var line_str = xq.cookie.get(xq.data.get('cookie_line_name'));
			return line_str == false ? [] : line_str.split(',');
		}
	}
	xq.data.set('cookieLineManager', cookieLineManager);

	var __tmpl = {
		//切换线路的那些线路 的 模板
		line_shown: '<li class="<%= type %> removable" data-value="<%= master_id %>">'+
						'<p><a href="javascript:void(0)"><%= name %><b class="remove"></b></a></p>' +
					'</li>',
		//线路搜索 下拉菜单 title 
		s_title: '<div class="title">含 "<b><%= keyword %></b>" 的线路圈</div>',
		//线路搜索 下拉菜单 内容item
		s_item: '<% var index = fullName.indexOf(keyword) %>' +
				'<div class="result-item clear-net" data-masterid="<%= master_id %>">' +
					'<div class="desc">' +
						'<h5><% print(fullName.substr(0,index)) %><b><% print(index != -1 ? keyword : "") %></b><% print(index != -1 ? fullName.substr(index + keyword.length) : fullName) %></h5>' +
						'<p><%= start %> - <%= end %></p>' +
					'</div>' +
					'<div class="num loading"></div>' +
				'</div>'
	};

	var urlPair = (function(){
		var typeEl = $('.type-all');
		var tagEl = $('.f-tags');

		//部分 过滤 条件，提取出来方便使用
		return {
			type:{
				key: typeEl.parent().data('name'),
				all: typeEl.eq(0).data('value'),
				deal: typeEl.eq(1).data('value'),
				event: typeEl.eq(2).data('value')
			},
			tag: {
				key: tagEl.parent().data('name'),
				dealAll: tagEl.eq(0).find('li:eq(0)').data('value'),
				eventAll: tagEl.eq(1).find('li:eq(0)').data('value')
			}
		};
	})();

	//0. ================================= 线路选择，点击“某条线路”================================= begin
	xq.fn.add('bind-filter-by-line-click', function (liLineDom) {
		liLineDom.children().on('click', function (e) {
			var tar = $(e.currentTarget);
			var masterid = tar.parent().data('value');
			xq.fn.exec('reload-page-by-new-querystring', tar.parents('.title-list').data('name'), masterid, function (url) {
				return xq.queryString.del('station', url);
			});
		});
	});
	//线路选择
	xq.fn.exec('bind-filter-by-line-click', $('#enjoy-line-switch .title-list li[data-value]'));
	

	//0. ================================= 线路选择，点击“某条线路”================================= end



	//1. ================================= 线路选择，点击“更多”--像素风显示区域 ============ begin

	//$('#enjoy-line-switch .more>p').on('click', function (e) {
	//	var pulldown = $('#enjoy-line-pulldown');
	//	pulldown.is(':hidden') ? pulldown.show() : xq.fn.exec('hide_line_sel_pulldown');
	//});
	////隐藏线路选择(“更多”)下拉
	//xq.onDocClick(function (e) {
	//	if ($('#enjoy-line-switch .more').has(e.target).length == 0) {
	//		xq.fn.exec('hide_line_sel_pulldown');
	//	}
	//});

	$('#enjoy-line-switch .more').hover(function (e) {
		$('#enjoy-line-pulldown').show();
	}, function (e) {
		$('#enjoy-line-pulldown').hide();
	});

	//隐藏线路选择(“更多”)下拉
	xq.fn.add('hide_line_sel_pulldown', function (e) {
		$('#enjoy-line-pulldown').hide();
	});

	//绑定可移除的线路的 事件，如hover, click 等 -- :删除线路
	xq.fn.add('bind-remove-line', function (removableDom) {
		removableDom.hover(function (e) {
			$(e.currentTarget).find('.remove').show();
		}, function (e) {
			$(e.currentTarget).find('.remove').hide();
		});

		removableDom.find('.remove').hover(function (e) {
			$(this).addClass('remove_h');
		}, function (e) {
			$(this).removeClass('remove_h');
		}).
		on('click', function (e) {
			nowLineAll -= 1;
			e.preventDefault();
			var line = $(this).parents('.removable');
			var master_id = line.data('value').toString();
			var moreList = $('#enjoy-line-pulldown');
			//如果删除的是外面的，还要从下拉里面提取一个到外面
			if (!line.parent().is(moreList)) {
				xq.fn.exec('move-line-up', moreList.children(':eq(0)'));
			}
			line.remove();
			xq.fn.exec("check-morebtn's-needable");

			//如果是 cookie 线路
			if ($.inArray(master_id, cookieLineManager.get()) != -1) {
				cookieLineManager.del(master_id);
			} else { //是后台推荐线路
				$.post(xq.config.get('remove_system_line'), {
					action: 'remove_system_line',
					master_id: master_id
				});
			}
		});

	});
	xq.fn.exec('bind-remove-line', $('#enjoy-line-switch .removable'));

	//检查目前线路的条数，是否需要显示“更多”按钮
	xq.fn.add("check-morebtn's-needable", function () {
		var morebtn = $('#enjoy-line-switch .title-list .more');
		if (nowLineAll > maxLineShown) {
			morebtn.show();
		} else {
			morebtn.hide();
		}
	});

	//把线路移到“更多”里面
	xq.fn.add('move-line-down', function (liDom) {
		var moreList = $('#enjoy-line-switch .title-list .more ul');
		moreList.prepend(liDom);
	});
	//把线路从“更多”里面移到外面显示
	xq.fn.add('move-line-up', function (liDom_masterid) {
		var more = $('#enjoy-line-switch .title-list .more');
		var master_id = parseInt(liDom_masterid, 10);
		//传入 masterid
		if (master_id) {
			var city_id = xq.Data.City.getCurrentCity();//xq.config.get('city_id');
			var masters = xq.data.get('dict-city-master');
			liDom_masterid = $(_.template(__tmpl.line_shown, masters[city_id][master_id]));
			xq.fn.exec('bind-remove-line', liDom_masterid);
			xq.fn.exec('bind-filter-by-line-click', liDom_masterid);
		}

		more.before(liDom_masterid);
	});
	//1. ================================= 线路选择，点击“更多”--像素风显示区域 ============ end



	//2.  ================== 点击添加按钮（添加线路） ======================== 搜索线路相关 =========== begin
	var config = {
		maxSearch: 5,
		start: '马陆',
		end: '永康路'
	}
	//点击“添加”按钮
	$('#enjoy-line-switch .add-enjoy-line a').on('click', function (e) {
		$(this).hide().siblings('.input-holder').show().find('input').focus();
	});
	//搜索线路
	$('#enjoy-line-switch .add-enjoy-line input').on('keyup', function (e) {
		var lineName = $.trim($(e.target).val()).replace(/</g, '&lt;');
		if (lineName == '') {
			xq.fn.exec('hide-search-result');
			return;
		}
		var info = { keyword: lineName };
		var matched = seachLineSuggest.getMatchedMaster(lineName, config.maxSearch);
		//xq.log(matched);
		var html = [];
		html.push(_.template(__tmpl.s_title, info));
		_.each(matched, function (match) {
			info.fullName = match.name;
			info.start = config.start;
			info.end = config.end;
			info.master_id = match.master_id;
			html.push(_.template(__tmpl.s_item, info));
			
		});
		
		var $html = $(html.join(''));
		$('#enjoy-line-switch .search-enjoy-line').html($html).show();
		xq.fn.exec('bind_search_result');
		//$.getJSON(xq.config.get()
	});
	xq.onDocClick(function (e) {
		if ($('#enjoy-line-switch .add-enjoy-line').has(e.target).length != 0) return;

		//如果下拉还没隐藏，则隐藏；若已经隐藏，则把搜索框也隐藏
		if ($('#enjoy-line-switch .search-enjoy-line').is(':hidden')) {
			$('#enjoy-line-switch .title-list .add-enjoy-line a').show().siblings('.input-holder').hide();
		}else{
			xq.fn.exec('hide-search-result');
		}
		
	});
	//隐藏搜索下拉框
	xq.fn.add('hide-search-result', function () {
		$('#enjoy-line-switch .add-enjoy-line .search-enjoy-line').hide();
	});
	//显示搜索下拉框
	xq.fn.add('show-search-result', function () {
		var pulldown = $('#enjoy-line-switch .add-enjoy-line .search-enjoy-line');
		pulldown.show();
	});
	//新绑定搜索结果的事件
	xq.fn.add('bind_search_result', function () {
		var result = $('#enjoy-line-switch .search-enjoy-line').find('.result-item');
		result.
		on('mouseover', function (e) {
			$(e.currentTarget).addClass('hover');
		}).
		on('mouseout', function (e) {
			$(e.currentTarget).removeClass('hover');
		}).
		on('click', function (e) {
			xq.fn.exec('add-search-result-to-line', $(e.currentTarget));
		});
	});

	xq.fn.add('add-search-result-to-line', function (item) {
		var masterid = item.data('masterid');
		cookieLineManager.add(masterid); // -- 把这条线路增加到cookie中
		xq.fn.exec('reload-page-by-new-querystring', $('#enjoy-line-switch .title-list').data('name'), masterid);

		//不需要下面这么样处理了
		//xq.fn.exec('move-line-down', $('#enjoy-line-switch .title-list .more').prev());
		//xq.fn.exec('move-line-up', item.data('masterid'));
		//xq.fn.exec("check-morebtn's-needable");
	});

	//2.  ================== 点击添加按钮（添加线路） ======================== 搜索线路相关 =========== end

	//3.  ================== 点击选择站点（过滤） ================== begin
	var stationUrlKey = $('#station-g').data('name');
	var qsStation = xq.queryString.parse()[stationUrlKey];
	var stations = (qsStation && qsStation.split(',')) || [];
	var lastStation = stations[stations.length - 1];
	var hoveredStations;

	$('.info-list .station-graphics li').hover(function (e) {
		var li = $(e.currentTarget);
		li.addClass('hovered');

		//只有不是全选的情况下，才能用
		if (lastStation && e.shiftKey) {
			var prev = li.siblings('[data-stationid=' + lastStation + ']');
			var prevIndex = prev.index();
			var thisIndex = li.index();
			var big, small;
			prevIndex > thisIndex ? (big = prev, small = li) : (big = li, small = prev);
			hoveredStations = small.nextUntil(big).add(small).add(big);
			hoveredStations.addClass('hovered');//.siblings().removeClass('hovered');
		}

	}, function (e) {
		var li = $(e.currentTarget);
		if (!hoveredStations) hoveredStations = li;
		hoveredStations.add(li).removeClass('hovered');
		hoveredStations = undefined;
	}).on('click', function (e) {
		var li = $(e.currentTarget);
		var stationid = li.data('stationid').toString();
		
		// 集中处理 要选中的站点的 列表
		if (e.ctrlKey) {
			//ctrl 的作用，选中，或取消选中
			if (li.hasClass('selected')) {
				stations = _.without(stations, stationid);
			} else {
				stations.push(stationid);
			};
		} else if (e.shiftKey) {
			if (!hoveredStations) {
				stations = [stationid];
			} else {

				var newStations = [];
				//因为 hover 的时候，已经把该做的工作都做好了（添加 hovered 类）
				hoveredStations.each(function (i, li) {
					newStations.push($(li).data('stationid'));
				});
				stations = newStations;
			}
		} else {
			stations = [stationid];
		}
		
		//根据数据刷新页面
		xq.fn.exec('reload-page-by-new-querystring', stationUrlKey, stations.join(','));
	});

	//xq.fn.add();

	//3.  ================== 点击选择站点（过滤） ================== end


	//4. =================== 点击类型（团购、活动等）|| 排序 =============== begin
	//这部分 & tag 的关系：
	//这里的全部对应的是：tag的全部；
	//这里的团购对应的是：tag 团购的全部；
	//这里的活动对应的是：tag活动的全部；
	$('.filter li').on('click', function (e) {
		var li = $(e.currentTarget);
		var value = li.data('value');
		var name = li.parent().data('name');

		var index = li.index();
		xq.fn.exec('reload-page-by-new-querystring', name, value, function (url) {
			var tag = urlPair.tag;
			var key = tag.key;
			var deal = tag.dealAll;
			var event = tag.eventAll;

			//第一个，即，“全部”
			if (index == 0) {
				return xq.queryString.del(key, url);
			}
			//第二个，即，“团购”
			else if (index == 1) {
				return xq.queryString.add(key, deal, url, true);
			}
			//第三个，即，“活动”
			else {
				return xq.queryString.add(key, event, url, true);
			}
			
		});
	});
	//4. =================== 点击类型（团购、活动等）|| 排序 =============== end


	//5. =================== 发布征人 =================================== begin

	$('.hangout-list').on('click', 'a', function (e) {
		//未登录
		if (!xq.isLoginUser()) {
			xq.fn.exec('show-pop-log');
			return;
		}

		threadForm.setProperty($(e.target).parents('.news-list').data('eventid')).pop().show()
	});

	//5. =================== 发布征人 =================================== end

	//6. =================== 标签 =================================== begin
	$('.f-tags li').on('click', function (e) {
		var tar = $(e.currentTarget);
		var name = tar.parents('.cnt-r').data('name');
		var value = tar.data('value');
		xq.fn.exec('reload-page-by-new-querystring', name, value, function (url) {
			var isDeal = tar.parents('.f-tags').index() == 0;
			var type = urlPair.type;
			var key = type.key;
			if (isDeal) {
				return xq.queryString.add(key, type.deal, url, true);
			} else {
				return xq.queryString.add(key, type.event, url, true);
			}
		});
	});
	//6. =================== 标签 =================================== end

	//7. =================== 征人列表“去看看” =================================== begin
	//其他浏览器能CSS实现 li:hover 效果
	if ($.browser.msie && parseInt($.browser.version) == 6) {
		$('.pl-content .a-reply').hover(function (e) {
			$(e.currentTarget).children('.open').show();
		}, function (e) {
			$(e.currentTarget).children('.open').hide();
		});
	}
	//7. =================== 征人列表“去看看” =================================== begin


	//通过 添加修改 URL 参数来刷新页面
	xq.fn.add('reload-page-by-new-querystring', function (key, value, beforeReloadFn) {
		var url = xq.queryString.add(key, value, location.href, true);

		//回调可以增加一个修改url的机会
		if (beforeReloadFn) {
			url = beforeReloadFn(url);
		}

		//alert(url);
		location = url;
	});
	
});