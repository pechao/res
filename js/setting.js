jQuery(function ($) {
	var hint = new xq.Widget.Hint().appendTo();
	var mask = new xq.Widget.Mask().relate(hint).appendTo();




	//1. 修改密码
	$('.st-cnt .log-name>a').on('click', function (e) {
		$.publish('change-pass-area-show');
	});

	$.subscribe('change-pass-area-show', function (e) {
		$('.st-cnt .log-name .change-pass').show();
	});

	xq.onDocClick(function (e) {
		var t = $(e.target);
		if (t.is('.st-cnt .log-name>a')) return;
		if (!t.is('.log-name-area') && t.parents('.log-name-area').length === 0) {
			$.publish('change-pass-area-hide');
		}
	});

	$.subscribe('change-pass-area-hide', function (e) {
		$('.st-cnt .log-name .change-pass').hide();
	});

	//2. 修改密码
	(function () {
		var pass_error = {
			'wront_old': '旧密码错误',
			'too_short': '密码需要至少4位',
			'not_same': '两次密码输入必须一致',
			'empty': '密码不能为空'
		};
		var config_pass = {
			'min_len': 4,
			'changing': '正在修改，请稍候...'
		}
		//点击“确认修改”按钮
		$('.st-cnt .log-name .op a').on('click', function (e) {
			if (!checkOld() || !checkNew(true)) return;

			var c = $('.st-cnt .log-name');
			$.publish('show_pass_progress', { 'txt': config_pass.changing });
			var formData = {};
			c.find('input').each(function (i, el) {
				formData[$(el).attr('name')] = $(el).val();
			});
			$.post(xq.config.get('change-pass'), formData, function (e) {
				e = xq.parseJSON(e);
				if (e.error == 200) {
					$.publish('show_pass_progress', { 'txt': '修改成功' });
				} else {
					$.publish('show_pass_error', { 'txt': e.error });
				}
			});
		});
		//检查新密码
		$('.st-cnt .log-name .new-pass input').on('focusout', function (e) {
			checkNew();
		});
		//ajax检查旧密码是否正确
		$('.st-cnt .log-name .old-pass input').on('focusout', function (e) {
			checkOld();
		});
		$.subscribe('show_pass_error', function (e) {
			$('.st-cnt .log-name .op p').addClass('error').text(e.txt).show();
		});
		$.subscribe('hide_pass_error', function () {
			$('.st-cnt .log-name .op p').hide();
		});
		$.subscribe('show_pass_progress', function (e) {
			$('.st-cnt .log-name .op p').removeClass('error').text(e.txt).show();
		});

		function checkOld() {
			var val = $('.st-cnt .log-name .old-pass input').val();
			if (val.length < config_pass.min_len) {
				$.publish('show_pass_error', { 'txt': pass_error.too_short });
				return false;
			}
			$.publish('hide_pass_error');
			return true;
		}
		function checkNew(showEmptyError) {
			var one = $('.st-cnt .log-name input[name=newpass]').val();
			var sib = $('.st-cnt .log-name input[name=repass]').val();

			if (showEmptyError && (one === '' || sib === '')) {
				$.publish('show_pass_error', { 'txt': pass_error.empty });
				return false;
			}

			if (one.length < config_pass.min_len || sib.length < config_pass.min_len) {
				if (showEmptyError || (!showEmptyError && one !== '' && sib !== ''))
					$.publish('show_pass_error', { 'txt': pass_error.too_short });
				return false;
			}
			if (one !== sib) {
				$.publish('show_pass_error', { 'txt': pass_error.not_same });
				return false;
			}
			$.publish('hide_pass_error');
			return true;
		}
	})();

	//昵称字数限制
	var nick_limit = 14;
	$('.st-cnt .input-text').on('keyup', function (e) {
		var val = $.trim($(this).val());
		if (xq.str.getLen(val) > nick_limit) {
			$(this).val(xq.str.subStr(val, nick_limit));
		}
	});

	//年月日
	$('.st-cnt .st-item select').on('change', function (e) {
		var year = $('.st-cnt .st-item select[name=year]');
		var month = $('.st-cnt .st-item select[name=month]');
		var day = $('.st-cnt .st-item select[name=day]');

		var d31 = ['1', '3', '5', '7', '8', '10', '12'];
		var day_num;
		//如果改变的是 “年”|“月”
		if ($(e.target).attr('name') !== 'day') {
			var day_prev = day.val();
			var y = year.val(), m = month.val();
			if (m == '') {
				day_num = 31;
			} else {
				if (y == '') {
					if (m == '2') {
						day_num = 29;
					} else if (_(d31).indexOf(m) != -1) {
						day_num = 31;
					} else {
						day_num = 30;
					}
				} else {
					day_num = new Date(y, m, 0).getDate();
				}
			}

			if (day_prev > day_num) day_prev = 1;

			var __tmpl = '<option value="{0}" {1}>{0}</option>';
			day.children('option:gt(0)').remove();
			_.each(_.range(day_num), function (i) {
				var _d = i+1;
				day.append(xq.f(__tmpl, _d, _d == day_prev ? 'selected="selected"' : ''));
			});
		}

		////年月其一为空，则，清空日期
		//if (year.val() === '' || month.val() === '') {
		//	day.children('option:gt(0)').remove();
		//}
		////年月都不为空，且选择的不是日，则，重新计算日的天数
		//if ($(e.target).attr('name') !== 'day' && year.val() !== '' && month.val() !== '') {
		//	//var day_prev = day.val();
		//	var day_num = new Date(year.val(), month.val(), 0).getDate();
		//	if (day.data('day_prev') < day_num || _.isUndefined(day.data('day_prev'))) {
		//		day.data('day_prev', day.val())
		//	}
		//	var __tmpl = '<option value="{0}" {1}>{0}</option>';
			
		//	day.children('option:gt(0)').remove();
		//	_.each(_.range(day_num), function (i) {
		//		var _d = i+1;
		//		day.append(xq.f(__tmpl, _d, _d == day.data('day_prev') ? 'selected="selected"' : ''));
		//	});
		//}
	});

	//当前城市选择 || 家乡选择
	$('.st-cnt .city-sel').add('.st-cnt .home-sel').on('click', function (e) {
		xq.page.set('city-sel-dom', $(e.target));
		$.publish('on-city-sel-click', { 'city_id': $(e.target).siblings('input').val() });
	});

	//在 common.js  发出此事件
	$.subscribe('the-city-was-selected', function (e) {
		if (xq.page.get('city-sel-dom').hasClass('city-sel')) {
			$('.st-cnt .city-sel').text(e.city_name).siblings('input').val(e.city_id);
		} else {
			$('.st-cnt .home-sel').text(e.city_name).siblings('input').val(e.city_id);
		}
	});


	//换头像
	//var avatar_warn = '头像照片必须是jpg,jpeg,png或gif格式';

	//$('.st-cnt .avatar-area a').on('click', function (e) {
	//	$(this).siblings('input').get(0).click();
	//});
	//$('.st-cnt .avatar-area input[type=file]').on('change', function (e) {
	//	var file = e.target.files[0];

	//	if (!xq.utils.isImg(file.name)) {
	//		hint.setMessage(avatar_warn).pop().show();
	//		$(e.target).val('');
	//		return;
	//	}

	//	$.publish('select-one-avatar', { 'name': file.name });
	//});
	//$.subscribe('select-one-avatar', function (e) {
	//	$('.st-cnt .avatar-area .file p').text(e.name);
	//});



	//===============================头像设置 页面
	(function () {
		if (!xq.Image || !xq.Image.Upload) return;
		
		var avatarBtn = $('#sel-photo');
		var avatarNode = $('.avatar-set .big-edit');
		var avatarImg = avatarNode.find('img');
		var avatar160 = $('.avatar-set .middle img');
		var avatar48 = $('.avatar-set .small img');

		var prevAvatarUrl = {
			'200': avatarImg.attr('src'),
			'160': avatarImg.attr('src'),
			'48': avatarImg.attr('src')
		}

		var originWidth, originHeight, originUrl;
		var editUrl;
		var preview160, preview48;
		var minEditSize, editWidth, editHeight;

		var avatarUpload = new xq.Image.Upload({
			node: avatarBtn,
			action: xq.config.get('upload-avatar'),
			inputName: 'avatar',
			extraInputs: {
				needSize: 200,
				//保持原比例，不补白
				keepScale: true
			}
		});

		var editInfo;

		var showPreview = _.throttle(function (coords) {
			var rx = 160 / coords.w;
			var ry = 160 / coords.h;

			avatar160.css({
				width: Math.round(rx * editWidth) + 'px',
				height: Math.round(ry * editHeight) + 'px',
				left: '-' + Math.round(rx * coords.x) + 'px',
				top: '-' + Math.round(ry * coords.y) + 'px'
			});

			var rx = 48 / coords.w;
			var ry = 48 / coords.h;

			avatar48.css({
				width: Math.round(rx * editWidth) + 'px',
				height: Math.round(ry * editHeight) + 'px',
				left: '-' + Math.round(rx * coords.x) + 'px',
				top: '-' + Math.round(ry * coords.y) + 'px'
			});

			editInfo = coords;
		}, 10);

		var defaultPreview = function () {
			showPreview({
				w: minEditSize,
				h: minEditSize,
				x: 0,
				y: 0,
				x2: minEditSize,
				y2: minEditSize
			});
		}

		avatarUpload.on('upload.success', function (data) {
			originHeight = data.originHeight;
			originWidth = data.originWidth;
			originUrl = data.originUrl;
			editUrl = data.url;

			var image = new Image();
			image.onload = function () {
				avatarNode.empty().append('<img src="' + editUrl + '">');
				avatarImg = avatarNode.find('img');

				editWidth = avatarImg.width();
				editHeight = avatarImg.height();
				minEditSize = Math.min(editWidth, editHeight);

				avatarImg.Jcrop({
					setSelect: [0, minEditSize, minEditSize, 0],
					aspectRatio: 1,
					onSelect: showPreview,
					onChange: showPreview,
					onRelease: defaultPreview
				});
				avatar160.attr('src', data.originUrl);
				avatar48.attr('src', data.originUrl);
			}
			image.src = data.url;
		});


		var saveBtn = $('#save');
		var resetBtn = $('#reset');
		
		saveBtn.on('click', function (e) {
			$.post(xq.config.get('avatar-edit'), {
				width: editInfo.w,
				height: editInfo.h,
				x: editInfo.x,
				y: editInfo.y,
				size: 200,
				url: {
					'200': editUrl,
					'origin': originUrl
				}
			}, function (json) {
				json = xq.parseJSON(json);
				var msg;
				msg = json.error == 200 ? '保存成功' : '保存失败';

				hint.setMessage(msg).pop().show();

				resetAvatar(json.url);
			});
		});

		resetBtn.on('click', function (e) {
			resetAvatar(prevAvatarUrl);
		});

		function resetAvatar(urls) {
			avatarImg.attr('src', urls['200']).attr('style', '').siblings().remove();
			avatar160.attr('src', urls['160']);
			avatar48.attr('src', urls['48']);
		}
		
	})();


	//===============================兴趣标签 页面
	(function () {
		$('.label-gy').hover(function (e) {
			$(e.currentTarget).removeClass('label-gy').css('cursor','pointer');
		}, function (e) {
			$(e.currentTarget).addClass('label-gy');
		});
		//tagName 不能直接放到DOM里，比如：'<div>'这样的tag会被解析成 DOM而非字符串
		var __tmpl = '<table data-tag="<%= tagName %>" class="label"><tbody><tr><td class="bg_l"></td><td class="name"><p></p></td><td class="num"><p><strong class="loading"></strong></p></td></tr></tbody></table>';
		//点击热门标签
		$('.label-gy').on('click', function (e) {
			var t = $(e.currentTarget);
			var e = { 'op':'add', 'name': t.find('.name p').text(), 'count': t.find('.num p').text(), 'el': t };
			t.remove();

			$.publish('add-one-custom-tag', e);

			//接受事件在 register_3.js
			$.publish('tag-fetch-remote-start', e);
		});

		//事件在 register_3.js 发出
		$.subscribe('add-one-custom-tag', function (e) {
			var f = _.find(xq.data.get('my-label'), function (label) { return label === e.name });

			if (!_.isUndefined(f)) return;
			xq.data.get('my-label').push(e.name);
			var $label = $(_.template(__tmpl, { 'tagName': e.name }));
			$label.find('.name p').text(e.name);
			$('#my-label').append($label).data('newTag',$label);

			//绑定删除按钮的事件
			$.publish('bindMyLabelHover', { $el: $label });
		});
		$.subscribe('tag-fetch-remote-succeed', function (e) {
			if (e.op === 'remove') return;
			e.tag = $('#my-label').data('newTag');
			$.publish('add-tag-count', e);
		});
		$.subscribe('add-tag-count', function (e) {
			var tag = e.tag;
			xq.log(tag);
			var p = tag.find('.num p');
			//如果有 loading 则替换为数字，若已经是数字了，则不必管了
			if (p.children('.loading').length > 0)
				tag.find('.num p').empty().text(e.count);
		});


		//
		var __tmpl2 = '<b class="close"></b>';
		//bind-mylabel-hover-
		$.subscribe('bindMyLabelHover', function (e) {
			e.$el.hover(function (e) {
				var ct = $(e.currentTarget), p = ct.find('.num p'), el = $(__tmpl2);
				p.css('width', p.width());

				ct.data('count', p.text());
				if ($(e.target).is(p) || $(e.target).is(p.parent())) {
					el.addClass('hover');
				}
				p.empty().append(el);
			}, function (e) {
				var ct = $(e.currentTarget);
				ct.find('.num p').empty().text(ct.data('count'));
				ct.find('.num p').css('width', 'auto');
			});
			e.$el.find('.num').hover(function (e) {
				$(e.currentTarget).find('.close').addClass('hover');
			}, function (e) {
				$(e.currentTarget).find('.close').removeClass('hover');
			});
			//删除
			e.$el.find('.num').on('click', function (e) {
				var ct = $(e.currentTarget);
				//ajax 事件 在　register_3.js 中发出
				$.publish('del-one-tag', { '$el': ct.parents('.label'), 'name': ct.siblings('.name').children('p').text() });
			})
		});
		$.publish('bindMyLabelHover', { $el: $('#my-label .label') });

		$.subscribe('del-one-tag', function (e) {
			e.$el.remove();
		});

	})();

	///======================================线路管理页
	(function () {
		//注册第二步需要，但此页不需要：setRegLinesWrapHeight <-- hadJoined.getHtml <-- hadJoined.init
		xq.data.set('should-NOT-set-reg-lines-wrap-height', true);
		//同上，
		xq.data.set('is-add-btn-not-show-pop-manager', true);

		var config = {
			maxSearch: 5,
			maxLineName: 5
		}

		//右上角搜索线路
		$('#line-search input').on('keyup', function (e) {
			var input = $(this);
			$.publish('fill-search-box-by-result', { 'lineName': input.val() });
		});

		//点击搜索框的添加和修改按钮，则隐藏搜索结果
		$('#line-search .stations-box').on('click', 'em', function (e) {
			xq.fn.exec('hide-search-result-pulldown');
		});

		//点击空白区域隐藏搜索结果
		xq.onDocClick(function (e) {
			if ($('#line-search').has(e.target).length === 0)
				xq.fn.exec('hide-search-result-pulldown');
		});
		//focus input ，若有结果，则显示
		$('#line-search input').on('focusin', function (e) {
			if ($('#line-search .stations-box li').length !== 0)
				$('#line-search .stations-box').show();
		});
		//根据搜索的线路名显示搜索结果
		$.subscribe('fill-search-box-by-result', function (e) {
			var lineName = $.trim(xq.filtInput(e.lineName));
			var pulldown = $('#line-search .stations-box');
			if (lineName === '') {
				xq.fn.exec('hide-search-result-pulldown')
				return;
			}
			var matched = seachLineSuggest.getMatchedMaster(lineName, config.maxSearch);
			var __tmpl = xq.getTmpl('station-li-tmpl');
			var li = '';
			_.each(matched, function (line) {
				line.lineName = line.name;
				line.shortName = line.name.length > config.maxLineName ? line.name.slice(0, config.maxLineName) + '...' : line.name;
				line.hadJoined = !!(_(userLinesPoll).find(function (lineObj) { return lineObj.master_id.toString() === line.master_id.toString(); }));
				li += _.template(__tmpl, line);
			});
			li === '' ? xq.fn.exec('hide-search-result-pulldown') : pulldown.empty().append(li).show();
		});

		xq.fn.add('hide-search-result-pulldown', function () {
			$('#line-search .stations-box').hide();
		});

	})();
});
