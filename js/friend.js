jQuery(function ($) {
	//////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////
	//“刷新”当前页面 --- main-part 局部刷新，但是要重新绑定事件
	//好友聚合页 & 关注页 都是 .main-part 整个的全部刷新
	xq.html5load({
		'replacedEl': $('.main-part'),
		'ancherRange': [$('.page-title'), $('.more-group-pulldown'), $('.bottom-page')],
		//'ancherRange': [$('.main-part'), $('.more-group-pulldown')],
		'start': function () {
			$('.main-part').empty();
			$('.loading-page').appendTo('.main-part').show();
		},
		'success': function () {
			$('.loading-page').hide().appendTo('body');

			xq.rebindPage('friend-main-part');
		}
	});

	//线路圈乘客部分的 ajax 刷新页面
	//xq.html5load







	xq.rebindPage.addAndExec('friend-main-part',function () {
		//1. =============== “+ 关注此人”点击
		$('.operates').on('click', '.follow-him', function (e) {
			var $tar = $(e.currentTarget);
			//获取默认分组的 group_id, user_id
			e.group_id = $tar.siblings().children('.group').data('groupid');
			e.user_id = $tar.parents('.each-follower').data('action')['user_id'];

			//把 groupid 保存到这个 用户的元素上，以便在“改变用户组”的时候对比，是否真的有改变，还是点击原来的分组
			$tar.parents('.each-follower').data('groupid', e.group_id);


			$.publish('go-follow-btn-clicked', e);
		});
		//2. =============== “取消关注”点击
		$('.operates .had-followed .unfollow').on('click', function (e) {
			e.user_id = $(e.target).parents('.each-follower').data('action')['user_id'];

			$.publish('cancel-follow-btn-clicked', e);
		});
		//3. =============== 点击打开分组
		$('.operates .had-followed .group').on('click', function (e) {
			//视图
			var elemHeight = 30;
			var elemWidth = 80;
			var $tar = $(e.target);
			var $pop = $('.set-group-pop');
			$pop.css({
				'top': $tar.offset().top + elemHeight,
				'left': $tar.offset().left - ($pop.width() - elemWidth) / 2,
			});
			$pop.find(xq.format('li[data-groupid={0}]', $tar.data('groupid'))).addClass('this-group').siblings().removeClass('this-group');
			$pop.show();

			//当前好友数据挂载到弹出窗，以便操作时调用数据
			$pop.data('user_id', $tar.parents('.each-follower').data('action')['user_id']);
			$pop.data('$group', $tar);
		});
		//4. ============= 分组
		$('.set-group-pop').on('click', 'li', function (e) {
			var $tar = $(e.currentTarget);
			var $pop = $('.set-group-pop');
			e.user_id = $pop.data('user_id');
			e.group_id = $tar.data('groupid');

			if ($pop.data('$group').data('groupid') === e.group_id) return;

			//视图
			$tar.addClass('this-group').siblings().removeClass('this-group');

			$pop.data('$group').text($tar.children('span').text());
			$pop.data('$group').data('groupid', e.group_id);
			$pop.hide();

			//ajax
			xq.getJSON(xq.config.get('follow-someone'), {
				'action': 'follow',
				'follow': 1,
				'user_id': e.user_id,
				'group_id': e.group_id
			}, function (e) { });
		});
		//5. ============== hover 出现“取消关注”
		$('.each-follower').hover(function (e) {
			$(e.currentTarget).find('.unfollow').show();
		}, function (e) {
			$(e.currentTarget).find('.unfollow').hide();
		});
	});
	//->1 “+ 关注此人”
	$.subscribe('go-follow-btn-clicked', function (e) {
		//视图
		$(e.currentTarget).hide().siblings().show();
		//ajax
		xq.getJSON(xq.config.get('follow-someone'), {
			'action': 'follow',
			'follow': 1,
			'user_id': e.user_id,
			'group_id': e.group_id
		}, function (e) { });
	});
	//->2 “取消关注”
	$.subscribe('cancel-follow-btn-clicked', function (e) {
		//视图
		var $p = $(e.target).parent();
		$p.hide().siblings().show();
		//ajax
		xq.getJSON(xq.config.get('follow-someone'), {
			'action': 'follow',
			'follow': 0,
			'user_id': e.user_id
		}, function (e) { });
	});

	//4. ================ 隐藏分组
	xq.onDocClick(function (e) {
		var isbtn = $(e.target).get(0).tagName.toLowerCase() == 'span' && $(e.target).hasClass('group');
		var pop_len = $(e.target).parents('.set-group-pop').length;
		if (!isbtn && pop_len == 0) {
			$.publish('divide-groups-go-hide');
		}
	});
	$.subscribe('divide-groups-go-hide', function (e) {
		$('.set-group-pop').hide();
	});

	//////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////




	//5. ================== 好友页面，顶部的好友分组处理
	var config = {
		defaultGroupNum: 3
	}

	xq.rebindPage.addAndExec('friend-main-part', function () {
		//更多
		$('.page-title .groups .more').on('click', function (e) {
			if ($('.more-group-pulldown').is(':hidden')) {
				$.publish('show-more-group-pop', e);
			} else {
				$.publish('hide-more-group-pop');
			}
		});

		//
		$('.more-group-pulldown .one-group').on('click', function (e) {
			$.publish('hide-more-group-pop');
		});
	});

	//显示 分组下拉 弹出窗
	$.subscribe('show-more-group-pop', function (e) {
		var moreBtnHeight = 20;
		var $tar = $(e.target);
		$('.more-group-pulldown').css({
			'left': $tar.offset().left,
			'top': $tar.offset().top + moreBtnHeight
		}).show();
	});

	//隐藏 分组下拉 弹出窗
	xq.onDocClick(function (e) {
		if($(e.target).is('.page-title .groups b.more')) return;
		if ($(e.target).parents('.more-group-pulldown').length !== 0) return;

		$.publish('hide-more-group-pop');
	});
	$.subscribe('hide-more-group-pop', function () {
		$('.more-group-pulldown').hide();
	});

	//6. =========================================== 好友页面，顶部分组，右侧 扳手 setting 选项
	var config2 = {
		settingBtnHeight: 15,
		settingBtnWidth: 15,
		deleteGroupTip: '你确定要删除分组“{0}”吗'
	};

	xq.rebindPage.addAndExec('friend-main-part', function () {
		//点击 扳手
		$('.page-title .friend-manage').on('click', function (e) {
			//好友聚合页是<a>标签，直接跳转到关注页；关注页是<b>标签，用来管理
			if ($(this).get(0).tagName.toLowerCase() === 'a') return;

			var $pop = $('.setting-group-pulldown');
			if ($pop.is(':hidden')) {
				$.publish('show-group-setting', e);
			} else {
				$.publish('hide-group-setting');
			}
		});
	});

	// li: hover
	$('.setting-group-pulldown .setting-option').hover(function (e) {
		$(e.currentTarget).addClass('hover');
	}, function (e) {
		$(e.currentTarget).removeClass('hover');
	});

	//点击 设置的选项
	$('.setting-group-pulldown .setting-option').on('click', function (e) {
		var $tar = $(e.currentTarget);
		if ($tar.hasClass('add-group')) {
			$.publish('group-setting-add-new');
		} else if ($tar.hasClass('rename-group')) {
			$.publish('group-setting-rename');
		} else {
			var cg = getCurrentGroupInfo();
			if (confirm(xq.format(config2.deleteGroupTip, cg.name))) {
				$.publish('group-setting-delete', {
					'group_id': cg.id
				});
			}
		}

		$.publish('hide-group-setting');
	});

	//保存 --- 目前这个只有 重命名 会用到
	$('#pop-create-common .middle .save').on('click', function (e) {
		var input = $(e.target).siblings('input');
		var group_name = $.trim(input.val());
		if (group_name === '') return;

		var op = $('#pop-create-common').data('operate');
		//目前只有重命名，删除和添加都直接提交表单
		if (op !== 'rename') return;

		var cg = getCurrentGroupInfo();

		//视图
		e.preventDefault();
		$('.page-title .groups a.current').text(group_name);
		//ajax
		var data = {
			'action': 'friend',
			'op': xq.f('group_{0}', op),
			'group_id': cg.id,
			'group_name': group_name
		};
		xq.log(data);
		xq.post($('#pop-create-common form').attr('action'), data, function (e) { });

		$.publish('hide-group-rename-popbox');
	});

	var config3 = {
		cmd: {
			'action':'friend',
			'group_add': {
				'op': 'group_add'
			},
			'group_del': {
				'op': 'group_del'
			},
			'group_rename': {
				'op':'group_rename'
			}
		}
	};

	//取消
	$('#pop-create-common .middle .cancel').on('click', function (e) {
		e.preventDefault();
		$.publish('hide-group-rename-popbox');
	});


	//添加分组
	$.subscribe('group-setting-add-new', function (e) {
		$.publish('show-group-rename-popbox');

		$('#pop-create-common').data('operate','add').find('input[name=group_name]').val('').trigger('keyup').focus();
	});

	//重命名分组
	$.subscribe('group-setting-rename', function (e) {
		$.publish('show-group-rename-popbox');

		$('#pop-create-common').data('operate', 'rename').find('input[name=group_name]').val(getCurrentGroupInfo()['name']).trigger('keyup').select();
	});

	//删除分组
	$.subscribe('group-setting-delete', function (e) {
		
		var form = $('#pop-create-common form');
		form.find('input[name=group_id]').val(getCurrentGroupInfo()['id']);
		form.find('input[name=op]').val(config3.cmd.group_del.op);
		form.submit();
	})

	//==============||||||||||||||=========显示 重命名|添加分组 弹出窗
	$.subscribe('show-group-rename-popbox',function(){
		var $pop = $('#pop-create-common');
		var $setBtn = $('.page-title .friend-manage');
		$pop.css({
			'top': $setBtn.offset().top + config2.settingBtnHeight,
			'left': $setBtn.offset().left - ($pop.width() - config2.settingBtnWidth) / 2
		}).show();
	});

	//==============||||||||||||||=========隐藏 重命名|添加分组 弹出窗
	xq.onDocClick(function (e) {
		//点了设置的选项，则用默认
		if ($(e.target).parents('.setting-group-pulldown').length !== 0) return;
		//点了其他的非弹出框区域，则隐藏
		if ($(e.target).parents('#pop-create-common').length === 0) {
			$.publish('hide-group-rename-popbox');
		}
	});
	$.subscribe('hide-group-rename-popbox', function () {
		$('#pop-create-common').hide();
	});


	//==============||||||||||||||=========显示 分组 设置
	$.subscribe('show-group-setting', function (e) {
		var $tar = $(e.target);
		var currentGroup = getCurrentGroupInfo();
		var $pop = $('.setting-group-pulldown');

		if (currentGroup.id == 0) {
			//“全部”分组，没有任何操作，除了添加分组
			$pop.children(':gt(0)').hide();
		} else {
			//“朋友”分组，没有“删除”操作
			currentGroup.id == 1 ? $pop.children(':gt(1)').hide() : $pop.children(':gt(0)').show()
			$pop.data('groupid', currentGroup.id);
			$pop.find('.group-name').text(currentGroup.name);
		}

		$pop.css({
			'left': $tar.offset().left,
			'top': $tar.offset().top + config2.settingBtnHeight
		}).show();
	});

	//==============||||||||||||||=========隐藏 分组 设置
	xq.onDocClick(function (e) {
		if ($(e.target).is('.page-title .friend-manage')) return;
		if ($(e.target).parents('.setting-group-pulldown').length !== 0) return;

		$.publish('hide-group-setting');
	});
	$.subscribe('hide-group-setting', function (e) {
		$('.setting-group-pulldown').hide();
	});

	function getCurrentGroupInfo(){
		var $cg = $('.page-title .groups .current');
		return {
			name: $cg.text(),
			id: $cg.data('groupid')
		};
	}



	//=====================================偶遇，特征
	//$('.xiehou .feature').hover(function (e) {
	//	$(e.currentTarget).find('ul').removeClass('min-height');
	//}, function (e) {
	//	$(e.currentTarget).find('ul').addClass('min-height');
	//})
});