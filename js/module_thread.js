//ajax 翻页
jQuery(function ($) {
	//瀑布流--相册列表2 页面
	xq.rebindPage.addAndExec('l_album_list2', function () {
		xq.html5load({
			'replacedEl': $('.fall-style-replacement'),
			'ancherRange': $('.l-a-l2-pages'),
			'start': function () {

			},
			'success': function () {
				//$('.falls-style').masonry('destroy');
				xq.rebindPage('l_album_list2');
				$.publish('chrome-placeholder-bind', { $el: $('.falls-style').find('.chrome-placeholder') });
			}
		});
	});
})

jQuery(function ($) {
	
	xq.onDocClick(function (e) {
		var $tar = $(e.target);
		var pop_follow = $('#pop-follow-id');
		if (pop_follow.has($tar).length == 0 && $('.operates .follow').has($tar).length == 0) {
			pop_follow.hide();
		}
		
	});
});


//帖子的一些js，“应征”“回复”等
jQuery(function ($) {
	var P = {};
	P.currentPage = 1;

	var globalConfirm = xq.data.get('globalConfirm');

	//var module = xq.data.get('module');

	//1. div 版本的 chrome-placeholder
	//$.publish('editable-tips-bind', { $el: $('.editable-tips') });

	//==============================================所有的 订阅事件都放在这里，以免在翻页的时候重复处理
	(function ($) {
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//（ 翻页）翻页加载中
		$.subscribe('inner-city-line-page-loading', function () {
			$('.loading-page').show();
		});
		//（ 翻页）翻页加载完毕
		$.subscribe('inner-city-line-page-load-success', function (e) {
			$('.loading-page').hide();
			var $html = $(e.html);

			$('.main-part').append($html);
			$.publish('chrome-placeholder-bind', { $el: $html.find('.chrome-placeholder') });
			$.publish('bind-new-user-that-has-card', { $el: $html.find('.user-card') });
			bindAllModuleEvents();
		});
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//（绑定 点击“应征”按钮）----------弹出的“应征”留言框消失
		//$.subscribe('pop-follow-hide', function (e) {
		//	$(e.target).hide();
		//});

		////（绑定 点击“应征”按钮）----------确认“应征”
		//$.subscribe('pop-follow-sure', function (e) {
		//	var $tar = e.$tar;
		//	var num = $tar.data('num');
		//	$tar.children('span').text(num + 1);

		//	$.post(xq.config.get('followThisAction'), {
		//		'content': e.content
		//	}, function (json) { });
		//});

		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//（绑定 点击“添加回复”区域）
		$.subscribe('reply-input-focusin', function (e) {
			var login_user = xq.Data.User.getInstance().getInfo();
			//.reply-area 是相册列表2瀑布流那页，但是此页不需要添加 模板
			if (e.$tar.find('.photo').length == 0 && !e.$tar.hasClass('reply-area')) {
				//这是 激活回复框之后 显示自己的头像 的模板
				var __tmpl = '<p class="photo" data-username="<%= nick %>"><a href="<%= space_url %>"><img src="<%= avatar_img["32"] %>" title="" class="user-card" data-usercard="id"></a></p>';
				var $p = $(_.template(__tmpl, login_user));
				e.$tar.prepend($p);

				$.publish('bind-new-user-that-has-card', { $el: $p.find('.user-card') });
			}

			e.$tar.removeClass('focusout').addClass('focusin');
			//可以添加比如“回复小强：”
			//var $edit = e.$tar.find('.input-div .editable').focus();
			var $edit = (e.$edit || e.$tar.find('.input-div input')).focus();
			if (e.preText) {
				$edit.val(e.preText);
				$edit.trigger('keyup');
				return;
			}
			//if ($edit.text() === '') $edit.text(e.preText || '');
		});
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
		//（绑定 “回复”（submit）帖子）绑定 回复按钮(submit button) 
		$.subscribe('bind-reply-submit_btn', function (e) {
			e.$replybox.find('.reply-box-wrap input').on('keypress', function (e) {
				if (e.keyCode === 13) {
					var content = $(this).text();

					$.publish('reply-news', { content: content, $replyLi: $(this).parents('li.reply-box') });
					//xq.log('reply-news');
					$(this).text('');
					return false;
				}
			});
			e.$replybox.find('.reply-btn').on('click', function (e) {
				//if (!xq.isLoginUser()) {
				//	xq.fn.exec('show-pop-log');
				//	return;
				//}
				var divEl = $(this).siblings('.reply-box-wrap').find('.input-div input');
				var content = $.trim(divEl.val()).replace(/</g, '&lt;');

				var $replyLi = $(this).parents('li.reply-box');
				var $photo = $replyLi.find('.photo');
				var $newsList = $replyLi.parents('.news-list');
				$.publish('reply-news', {
					content: content,
					$replyLi: $replyLi,
					$input: divEl,
					thread_id: $newsList.data('threadid'),
					event_id: $newsList.data('eventid'),
					//$willPrev: $replyLi.prev(),
					//插在这个元素后面
					tmpl: _.template(xq.getTmpl('reply-list-page-tmpl'), {
						data: {
							photoHtml: $photo.get(0).outerHTML,
							username: $photo.data('username'),
							content: content,
							firstReply: ($replyLi.parent('ul').data('replynum') === 0)
						}
					})
				});
			});
		});
		//（绑定 “回复”（submit）帖子）
		$.subscribe('reply-news', function (e) {
			//e 对象必须包含的字段： content, $input, $replyLi, tmpl,$willPrev, thread_id
			//xq.log(e.content, '-----', xq.getReplyPreText(P.commentname), e.content.indexOf(xq.getReplyPreText(P.commentname)) !== 0);
			e.tmpl = xq.Emotion.filtString(e.tmpl);
			//console.log(e.content);
			(e.content.indexOf(xq.getReplyPreText(P.commentname)) !== 0) ? (P.commentid = undefined) : (e.content = e.content.substr((xq.getReplyPreText(P.commentname)).length));
			//xq.log(e.content);
			if ($.trim(e.content) === '') return;

			e.$input.val('');

			//1. 本地更新
			var $tmpl = $(e.tmpl);
			//e.$willPrev.after($tmpl);

			// .first 没有 border-top:0;
			if (e.$replyLi.hasClass('first')) {
				e.$replyLi.removeClass('first');
				$tmpl.addClass('first');
			}
			e.$replyLi.before($tmpl);
			$.publish('bind-new-user-that-has-card', { $el: $tmpl.find('.user-card') });

			//2. Remote发送
			var xqFormData = xq.data.get('replyFormData');
			var formData = {
				'action': (xqFormData && xqFormData.actionValue) || 'thread_comment',
				'content': e.content,
				//comment_id: P.commentid,
				//'thread_id': e.thread_id,
				//'event_id': e.event_id,
				'reply_id': P.commentid
			};
			var idKey = (xqFormData && xqFormData.idKey) || 'thread_id';
			formData[idKey] = e[idKey];

			var server = xq.config.get('replyNews');
			$.post(server, formData, function (data) {
				var json = xq.parseJSON(data);
				$.publish('reply-remote-back-list', { $el: $tmpl, comment_id: json.comment_id });
			});

			//用完了就清空，以免缓存到下一个
			P.commentid = undefined;
			//绑定新生成html的事件
			$.publish('bind-fallstyle-reply-btn', { $el: $tmpl });
			$.publish('bind-reply-replysomebody_btn', { $btn: $tmpl.find('.reply-btn') });
		});
		//（绑定 “回复”（submit）帖子）
		$.subscribe('reply-remote-back-list', function (e) {
			e.$el.data('commentid', e.comment_id);
			e.$el.find('.reply-btn').show();
		})
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//（绑定 “回复”某条评论）回复某人的那个按钮
		$.subscribe('bind-reply-replysomebody_btn', function (e) {
			e.$btn.on('click', function (e) {
				//未登录
				if (!xq.isLoginUser()) {
					xq.fn.exec('show-pop-log');
					return;
				}
				var $tar = $(e.target);
				var $thisLi = $tar.parents('li');
				$.publish('reply-user-comment', { commentid: $thisLi.data('commentid'), username: $tar.siblings('.username').text(), $replyLi: $thisLi.siblings('.reply-box') });
			});
		});
		//（绑定 “回复”某条评论）把要回复的那条评论的信息保存下来
		$.subscribe('reply-user-comment', function (e) {
			P.commentid = e.commentid;
			P.commentname = e.username;
			$.publish('reply-input-focusin', { $tar: e.$replyLi.children('div'), preText: xq.getReplyPreText(e.username) });
			//e.$replyLi.find('.editable').trigger('keyup');
		});
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//（给应征者“写私信” --- 后几段完全来自于“home.js”）弹出写私信
		$.subscribe('goto-write-mail', function (e) {
			var $mail = $('#write-mail');
			xq.utils.pop($mail.show());
			$mail.find('.to-username span').text(e.to.name).end().data('to_id', e.to.id).data('isAnonymous', e.isAnonymous);
			$mail.find('.input-area textarea').focus();
		});
		//（给应征者“写私信” --- 后几段完全来自于“home.js”）发送私信
		$.subscribe('send-mail', function (e) {
			xq.post(xq.config.get('writeMailToUser'), {
				//anonymous: e.isAnonymous ? 1 : 0,
				content: e.content,
				user_id: e.to
			}, function (json) {
				$.publish('global-remote-success', { content: xq.config.get('tipsText')['mailSuccess'] });
			});
		});
		//（给应征者“写私信” --- 后几段完全来自于“home.js”）关闭私信弹出窗
		$.subscribe('close-mail-pop', function (e) {
			e.$mail.hide();
		});
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//（回复“帖子”或“某楼层”）
		$.subscribe('thread-detail-reply', function (e) {
			//首先清空之前打开的回复框
			//$('.reply-part').remove();
			e.login_user = xq.Data.User.getInstance().getInfo();
			var $replyPart = $('.reply-part');
			$replyPart.find('.blockquote').remove();
			var $textarea = $replyPart.find('textarea');
			var $quoteInput = $replyPart.find('input[name=reply_id]');

			if (e.quote) {
				//$replyPart.data('quote', true);
				$quoteInput.val(e.comment_id);

				//P.commentid = e.comment_id;
				//只能是只为页面全局变量了---目前使用页面直接跳转

				//删除引用按钮的显示、隐藏
				var $blockquote = $(_.template(xq.getTmpl('reply-quote-tmpl'), { data: e })).insertAfter($replyPart.find('.title'));
				$blockquote.hover(function (e) {
					if ($(e.target).parents('.thread-reply').hasClass('reply-part')) {
						$(e.target).children('.close').show();
					}
				}, function (e) {
					$(e.target).children('.close').hide();
				});

				//点击删除引用
				$blockquote.children('.close').on('click', function (_e) {
					$blockquote.remove();
					$textarea.focus();
					//$replyPart.data('quote', false);
					$quoteInput.val('');
				});
			}

			//$('.main-part').append($tmpl);
			$textarea.focus();

			//$.publish('chrome-placeholder-bind', { $el: $textarea });
		});
		//（回复“帖子”或“某楼层”）
		$.subscribe('reply-submit-go', function (e) {
			var $textarea = $('.reply-part textarea');
			var content = $.trim($textarea.val());
			if (content === '') {
				e.preventDefault();
				$.publish('the-input-is-empty', { $el: $textarea });

				return;
			}

			if ($('.reply-part').find('.blockquote').length === 0) {
				//提交表单之后再后退，value还在，但是引用没有了。对用户来说，他只看是否显示了“引用xx”这个提示
				$textarea.siblings('input[name=reply_id]').val('');
			}

			if (0) { //--目前直接表单提交，跳转页面，故不需这些

				var thisLayer = $('.main-part').data('layernum') + 1
				var $_tar = $(e.target);
				var $replylayerOrigin = $_tar.parents('.thread-reply');
				var $replylayer = $replylayerOrigin.clone();
				var $replyarea = $replylayer.find('.reply-area');
				var $cnt = $replyarea.siblings('.reply-cnt');
				var $replymsg = $replyarea.siblings('.reply-msg');

				//当前页面的显示更新
				$cnt.text(content);
				$cnt.removeClass('hide');
				//-----------此处“1秒钟前”有时间戳，到时候一块处理
				$replyarea.siblings('.title').children('p').removeClass('hide');
				$replymsg.removeClass('hide').children('.layer').text(thisLayer + ' 楼');
				$replylayer.removeClass('reply-part');
				$replyarea.remove();
				$replylayer.insertBefore('.pages-v2');
				$('.main-part').data('layernum', thisLayer);
				//"回复 85"按钮里面的数字 +1
				var $replybtn = $('.thread-main .reply-btn');
				$replybtn.data('num', $replybtn.data('num') + 1);
				$replybtn.children('span').text($replybtn.data('num'));

				//bindThreadReply($replylayer);
				//然后ajax到后台
				var data = {
					'action': 'thread_comment',
					"content": content,
					"thread_id": xq.data.get('thread_id')
				};

				$('.reply-part').data('quote') && (data['reply_id'] = P.commentid);
				xq.post(xq.config.get('replyNews'), data, function (json) {
					$.publish('reply-remote-success', { $btn: $replymsg.children('.btn'), $layer: $replylayer, comment_id: json.comment_id });
				});

				//善后处理
				P.commentid = undefined;
				$textarea.val('');
			}
		});
		//（回复“帖子”或“某楼层”）
		$.subscribe('reply-remote-success', function (e) {
			//发表回复，并成功返回后
			//1. 显示回复按钮
			e.$btn.show();
			//2. 给这个回复按钮绑定事件
			bindThreadReply(e.$layer);
			//3. 添加这个回复的comment_id
			e.$layer.data('commentid', e.comment_id);
		});

		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//（瀑布流显示）
		//$.subscribe('falls-style-relayout', function (e) {
		//	e.$container.masonry('reload');
		//});

		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//（添加“回复”）瀑布流页面的那个回复按钮
		$.subscribe('bind-fallstyle-reply-btn', function (e) {
			e.$el.find('.reply-btn').on('click', function (e) {
				//未登录
				if (!xq.isLoginUser()) {
					xq.fn.exec('show-pop-log');
					return;
				}
				var $area = $(e.target).parents('.comments').siblings('.reply-area');
				P.commentid = $(e.target).parents('.photo-comment').data('commentid');
				P.commentname = $(e.target).parents('.photo-comment').find('.title a').text();
				$.publish('reply-input-focusin', {
					$tar: $area,
					$edit: $area.children('textarea'),
					preText: xq.getReplyPreText(P.commentname)
				});
			});
		});

		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//（发布新鲜事的 data 处理）
		//_.each(['line', 'station', 'album'], function (type) {
		//	$.subscribe('post-news-' + type + '-select', function (e) {
		//		var selector = '.' + type + '-sel input';
		//		type === 'line' ? (e.line_id = e.master_id) : null;
		//		type === 'album' ? (selector = '.public-photo-sel input') : null;
		//		$(selector).val(e[type + '_id']);
		//	})
		//});
		$.subscribe('post-news-line-select', function (e) {
			//isforminput只有在某些场合（比如，把这个ajax提交换成form表单提交，则，改变隐藏input的value，但，还有其他的input就不能改变）
			$('.line-sel input[data-isforminput!=false]').val(e.master_id);
		});
		$.subscribe('post-news-station-select', function (e) {
			$('.station-sel input[data-isforminput!=false]').val(e.station_id);
		});
		$.subscribe('post-news-album-select', function (e) {
			$('.public-photo-sel input[data-isforminput!=false]').val(e.album_id);
		});

		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//（赞/已赞）
		$.subscribe('photo_like_click', function (e) {
			xq.getJSON(xq.config.get('likeServer'), {
				'thread_id': e.thread_id,
				'action': 'like'
			}, function (json) { });

			liked_num++;
			$('.photo-detail .the-photo .operates .like span').text(liked_num);
			$('.photo-detail .like-user .likecount span').text(liked_num);
			$('.photo-detail .the-photo .operates .like p').text(xq.config.get('like-text')['hadlike']['text']);
			$likeBtn.attr('title', xq.config.get('like-text')['hadlike']['title']);

			var likeUser = $('.photo-detail .like-user');
			var $me = $(_.template(xq.getTmpl('like-user-tmpl'), { data: xq.Data.User.getInstance().getInfo() })).hide().insertBefore(likeUser.children('a:first'));
			$me.next().stop().animate({
				'margin-left': xq.config.get('like-user-width')
			}, function () {
				$(this).css('margin-left', 0);
				$me.stop().fadeIn(function () {
					$likeBtn.data('canclick', true);
				});
				likeUser.children('a:visible').length > xq.config.get('like-show-max') ? likeUser.children('a:visible').last().stop().fadeOut() : null;
			});
		});
		//（赞/已赞）
		$.subscribe('photo_unlike_click', function (e) {
			xq.getJSON(xq.config.get('likeServer'), {
				'thread_id': e.thread_id,
				'action': 'unlike'
			}, function (json) { });

			liked_num--;
			$('.photo-detail .the-photo .operates .like span').text(liked_num);
			$('.photo-detail .like-user .likecount span').text(liked_num);
			$('.photo-detail .the-photo .operates .like p').text(xq.config.get('like-text')['like']['text']);
			$likeBtn.attr('title', xq.config.get('like-text')['like']['title']);

			var likeUser = $('.photo-detail .like-user');
			var me = _.find(likeUser.children('a'), function (el) {
				return $(el).data('usercard') === xq.Data.User.getInstance().getInfo().id;
			});
			if (!me) {
				$likeBtn.data('canclick', true);
				return;
			}

			var $me = $(me);
			likeUser.children('a:hidden').first().stop().fadeIn();
			$me.stop().fadeOut(function () {
				$me.next().css('margin-left', xq.config.get('like-user-width')).stop().animate({ 'margin-left': 0 }, function () {
					$likeBtn.data('canclick', true);
				});
				$me.remove();
			});
		});

		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		var config2 = {
			next: '点击查看下一张',
			prev: '点击查看上一张'
		}
		//（左右切换图）
		$.subscribe('img-curser-prev', function (e) {
			$('.photo-detail .the-photo table img').attr('title', config2.prev).addClass('cursor-prev').removeClass('cursor-next');
		});
		//（左右切换图）
		$.subscribe('img-curser-next', function (e) {
			$('.photo-detail .the-photo table img').attr('title', config2.next).addClass('cursor-next').removeClass('cursor-prev');
		});
		//（左右切换图）
		$.subscribe('img-goto-prev', function () {
			var $c = $('.current-img');
			var $prev = ($c.index() !== 0) ? $c.prev() : null;
			if (!$prev) return;
			var url = $prev.find('table a').attr('href');
			if (_.isUndefined(url)) {
				return;
			}
			location = url;
		});
		//（左右切换图）
		$.subscribe('img-goto-next', function () {
			var $c = $('.current-img');
			var $next = ($c.index() !== $c.siblings().length) ? $c.next() : null;
			if (!$next) return;
			var url = $next.find('table a').attr('href');
			if (_.isUndefined(url)) {
				return;
			}
			location = url;
		});
	})($);

	//页面发出事件区域
	(function () {
		//应征，附加留言弹出窗--处理，“确定”|“取消”
		$.publish('bind-follow-popup-sure-cancel');


	})();


	var EditFormView, EditFormModel, EditFormController;
	var editFormView, editFormModel, editFormController;
	var editFormPopup, editUpload;


	var itemByType = {
		'hangout': ['post-line', 'give-title', 'content-section'],
		'topic': ['post-line', 'give-title', 'content-section', 'add-pic-placeholder', 'btn-area'],
		'encounter': ['post-line', 'give-meeting-title', 'sex-section', 'meet-time', 'feature-section', 'meet-content-section', 'add-pic-placeholder', 'btn-area']
	}

	$(function () {

		editFormPopup = new xq.Widget.Popup({
			domId: 'thread-edit-form',
			needOkBtn: false,
			needCancelBtn: false,
			useGrayBorder: true
		}).appendTo();
		editFormPopup.getNode().children().append($('#thread-edit'));


		EditFormView = xq.Widget.create({
			constructor: function () {
				this.tmpl_feature = '<li class="clicked"><%= feature %></li>';
				this.tmpl_picture = xq.getTmpl('add-photo-part');
			},
			el: editFormPopup.getNode(),
			elements: {
				'.line-sel-inner span': 'lineText',
				'.station-sel-inner span': 'stationText',
				'.time-sel-inner span': 'crossTimeText',
				'.station-sel-pull-down .scroll-area': 'stationScroll',
				'.give-title .input input': 'titleInput',
				'.give-meeting-title .input input': 'encountTitleInput',
				'.label-sel-inner span': 'labelText',
				'.label-sel-pull-down .scroll-area': 'labelScroll',
				'.content-section textarea': 'contentArea',
				'.meet-content-section textarea': 'encountContentArea',
				'.sex-section .content b:eq(0)': 'sexMale',
				'.sex-section .content b:eq(1)': 'sexFemale',
				'.feature-section ul': 'featureUl',
				'.btn-area ul': 'pictureUl',
				'.btn-area .add-btn': 'pictureBtn',
				'.meet-time .year': 'timeYear',
				'.meet-time .month': 'timeMonth',
				'.meet-time .day': 'timeDay'
			}
		});
		EditFormModel = xq.Data.create({
			constructor: function (defaultValues) {
				this.defaultValues = defaultValues;
			} 
		});

		editFormView = new EditFormView();
		editFormModel = new EditFormModel({
			stationName: '请选择站点'
		});

		EditFormController = xq.Controller.create({
			view: editFormView,
			model: editFormModel,
			url: function () {
				return xq.config.get('getThread');
			},
			threadCache: {},
			show: function (data) {
				var type = data.type;
				var threadId = data.thread_id;
				var node = this.view.el;
				var wrap = node.find('.ul-area');
				var list = wrap.children();
				var crossTimeEl = node.find('.time-sel');
				var stationEl = node.find('.station-sel');
				list.hide();
				//视图显示
				_.each(itemByType[type], function (className) {
					wrap.find('.' + className).show();
				});
				data.master_id ? (stationEl.show(),crossTimeEl.hide()) : (stationEl.hide(), crossTimeEl.show());
				//if (data.master_id) {
				//	stationEl.show();
				//	crossTimeEl.hide();
				//} else {
				//	stationEl.hide();
				//	crossTimeEl.show();
				//}

				//只能限于数据显示，比如站点的重渲染，需要在视图显示的时候进行
				node.show();

				//根据数据有无，还要再次确认视图是否需要显示
				data = this.threadCache[threadId] || data;

				if (!data._complete) {
					var newModel = {};
					this.threadCache[threadId] = _.extend(newModel, data);
					this.model.set(this.threadCache[threadId]);

					$.getJSON(this.url(), {
						thread_id: threadId
					}, _.bind(function (json) {
						if (json.error != 200) return;
						json = json.thread;
						json._complete = true;
						this.threadCache[threadId] = _.extend(this.threadCache[threadId], json);
						this.model.set(this.threadCache[threadId]);
					}, this));
				} else {
					this.model.set(data);
				}
				return this;
			},
			viewEvents: {
				'click .station-sel-inner': function (e) {
					//绑定滚动条
					$.publish('check-and-bind-custom-scrollbar-in-first-time', { '$scrollarea': this.view.stationScroll });
				},
				//选择跨城出发时间
				'click .time-sel': function (e) {
					var timepicker = xq.data.get('timepicker');
					//监听器在 cross_passport.js
					timepicker.one('threadEdit.click.ok', this);
				},
				//选择城内站点
				'click .station-sel-pull-down': function (e) {
					var tar = $(e.target);
					var data = tar.data('action');
					tar.parents('.station-sel-pull-down').hide();
					//tar.hide();

					this.model.set({
						station_name: data.name,
						station_id: data.station_id
					})
				},
				'click .label-sel-inner': function (e) {
					var tar = $(e.currentTarget);
					tar.siblings().show();
					//绑定滚动条
					$.publish('check-and-bind-custom-scrollbar-in-first-time', { '$scrollarea': this.view.labelScroll });
				},
				//选择标签
				'click .label-sel-pull-down li': function (e) {
					var tar = $(e.target);
					var label = tar.text();
					tar.parents('.label-sel-pull-down').hide();

					this.model.set({ label: label });
				},
				//自定义标签
				'keyup .add-label input': function (e) {
					if (e.keyCode != 13) return;
					var tar = $(e.target);
					var label = tar.val();
					var labelPulldown = tar.parents('.label-sel-pull-down');
					labelPulldown.hide();

					this.model.set({ label: label });
				},
				'click .sex-section b': function (e) {
					this.model.set({ sex: $(e.target).data('sex') });
				},
				//删除图片
				'click .btn-area .close-type-1': function (e) {
					this.view.pictureBtn.show();
					//不需对数据做任何临时操作，因为，点击“取消”，即取消之前的操作；点击“发布”，刷新页面了
				},
				//取消
				'click .btn-cancle a': function (e) {
					editFormPopup.hide();

					this.model.empty();
				},
				//提交
				'click .btn-post a': function (e) {
					//console.log(this.model.get('label'));
					var type = this.model.type;
					this.model.set({
						title: (type == 'encounter' ? this.view.encountTitleInput : this.view.titleInput).val(),
						content: (type == 'encounter' ? this.view.encountContentArea : this.view.contentArea).val(),
						feature: _.map(this.view.featureUl.find('li.clicked'), function (li) { return $(li).text(); }),
						picture: _.map(this.view.pictureUl.find('li:not(.add-btn)'), function (li) { li = $(li); return { description: li.find('textarea').val(), upload_id: li.data('photoid') }; }),
						year: parseInt(this.view.timeYear.text()),
						month: parseInt(this.view.timeMonth.text()),
						day: parseInt(this.view.timeDay.text())
					});

					//editFormPopup.hide();
					var form = this.view.el.find('form');//$('<form action="" encode')
					var un_need_now = form.find('input[class!=non-remove]');
					un_need_now.attr('name', '');
					var inputs = _.map(this.model.get(), function (value, key) {
						return _.template('<input type="hidden" name="<%= name %>" value="<%= value %>">', { name: key, value: ($.isArray(value) || $.isPlainObject(value)) ? xq.escapeHTML(JSON.stringify(value)) : value });
					});
					inputs = inputs.join('');
					form.append(inputs);
					form.submit();
				}
			},
			modelEvents: {
				'change.line_name': function (e) {
					this.view.lineText.text(e.newValue);
				},
				//cross_id 不需要
				'change.master_id': function (e) {
					if (!e.newValue) return;
					//加载站点
					$.publish('load-stations-by-master', { master_id: e.newValue, formEl: this.view.el });
					//console.log('shit');
				},
				'change.cross_time': function (e) {
					this.view.crossTimeText.text(e.newValue);
				},
				'change.station_name': function (e) {
					if (e.newValue == false) e.newValue = this.model.defaultValues.stationName;
					this.view.stationText.text(e.newValue);
				},
				'change.title': function (e) {
					this.view.titleInput.val(e.newValue).keyup();
					this.view.encountTitleInput.val(e.newValue).keyup();
				},
				'change.label': function (e) {
					if (e.newValue == '') return;
					this.view.labelText.text(e.newValue);
				},
				'change.content': function (e) {
					this.view.contentArea.val(e.newValue).keyup();
					this.view.encountContentArea.val(e.newValue).keyup();
				},
				'change.sex': function (e) {
					e.newValue == 'male' ?
					this.view.sexMale.addClass('hovered') && editFormView.sexFemale.removeClass('hovered') :
					this.view.sexFemale.addClass('hovered') && editFormView.sexMale.removeClass('hovered');
				},
				'change.feature': function (e) {
					this.view.featureUl.find('li:not(.input)').remove();
					if (!e.newValue) return;
					var features = _.map(e.newValue, _.bind(function (feature) {
						return _.template(this.view.tmpl_feature, { feature: feature });
					}, this));
					this.view.featureUl.prepend(features.join(''));
				},
				'change.year': function (e) {
					var li = this.view.timeYear.find('li')
					this._yearStart || (this._yearStart = parseInt(li.eq(0).text()));
					var index = this._yearStart - e.newValue;
					li.eq(index).click();
				},
				'change.month': function (e) {
					var li = this.view.timeMonth.find('li');
					li.eq(e.newValue - 1).click();
				},
				'change.day': function (e) {
					var li = this.view.timeDay.find('li');
					li.eq(e.newValue - 1).click();
				},
				'change.picture': function (e) {
					var ul = this.view.pictureUl;
					ul.find('li:not(.add-btn)').remove();
					if (!e.newValue) return;

					var pictures = _.map(e.newValue, _.bind(function (photo) {
						return _.template(this.view.tmpl_picture, { photo: photo });
					}, this));
					pictures = $(pictures.join(''));

					$.publish('chrome-placeholder-bind', { $el: pictures.find('.chrome-placeholder') });
					ul.prepend(pictures);
				},
				'picture.upload.start': function (id) {
					var holderNode = $(xq.getTmpl('upload-pic-placeholder'));
					holderNode.insertBefore(this.view.pictureBtn);
					(this.cachePicture = this.cachePicture || []).push({ id: id, node: holderNode });

					var modelPic = this.model.get('picture');
					var countPic = (modelPic && modelPic.length) || 0 + this.cachePicture.length;
					if (countPic >= 4) {
						this.view.pictureBtn.hide();
					}
				},
				'picture.upload.success': function (e) {
					var cache = _.find(this.cachePicture, function (cache) { return cache.id == e.suitid; });
					//this.cachePicture = _.without(this.cachePicture, cache);

					var picture = $(_.template(this.view.tmpl_picture, { photo: e }));
					$.publish('chrome-placeholder-bind', { $el: picture.find('.chrome-placeholder') });
					picture.insertBefore(cache.node);
					cache.node.remove();
				}
			}
		});
		editFormController = new EditFormController();


		if (editFormView.pictureBtn.length) {
			editUpload = new xq.Image.Upload({
				node: editFormView.pictureBtn,
				action: xq.config.get('post-pic-server'),
				inputName: 'picture',
				isJSONP: false,
				//临时的
				iframeSrc: '/tmp_peichao/proxy.html',
				valideFn: function (e, suit) {
					var val = $.trim(suit.input.val());
					if (!xq.utils.isImg(val)) {
						var warn_msg = '请上传正确格式的图片';
						xq.data.get('globalHint').setMessage(warn_msg).pop().show();
						return false;
					}
				}
			});
			editUpload.on('upload.start', function (e, suit, upload) {
				editFormModel.fire('picture.upload.start', suit.id);
			});
			editUpload.on('upload.success', function (e, suit, upload) {
				//console.log(e, suit, upload);

				editFormModel.fire('picture.upload.success', _.extend(xq.parseJSON(e), { suitid: suit.id }));
			});
		}

	});


	var deleteMsg = {
		'reply': '确认要删除这条回复吗？',
		'thread': '你确认要删除这条新鲜事吗？'
	}

	//删除回复
	globalConfirm.on('delete.reply', function (e) {
		//视图
		e.commentNode.remove();
		//ajax
		$.post(xq.config.get('delComment'), {
			comment_id: e.commentId
		}, function () { });
	});
	//删除thread
	globalConfirm.on('delete.thread', function (e) {
		//视图
		e.threadNode && e.threadNode.remove();
		//ajax
		$.post(xq.config.get('delThread'), {
			thread_id: e.threadId
		}, function (json) {
			//详情页才需要跳页
			if (e.threadNode) return;
			//try { json = JSON.parse(json); } catch (e) { };
			//删除之后跳页
			//location = json.url;
			location.reload();
		});
	});

	
	function getType(type){
		return type == 'xiehou' ? 'encounter' :
				type == 'zhengren' ? 'hangout' :
				type == 'picture' ? 'album' :
				'topic';
	}



	//thread详细页的编辑删除
	bindEditDetailPage();
	function bindEditDetailPage() {
		$('#del-thread').on('click', function (e) {
			var threadId = xq.data.get('thread_id');
			var type = xq.data.get('thread_type');

			globalConfirm.setMessage(deleteMsg.thread);
			globalConfirm.one('delete.thread', {
				threadId: threadId
			});
			globalConfirm.pop().show();
		});

		$('#edit-thread').on('click', function (e) {
			var threadId = xq.data.get('thread_id');
			var type = xq.data.get('thread_type');
			if (type == 'album') return;

			var masterId = xq.data.get('master_id');
			var crossId = xq.data.get('cross_id');
			editFormController.show({
				type: type,
				thread_id: threadId,
				line_name: masterId ? xq.Data.Master.getMaster(masterId).name : xq.Data.Cross.getCross(crossId).name,
				master_id: masterId,
				cross_id: crossId
			});
			editFormPopup.pop();
		});
	}


	bindAllModuleEvents();
	function bindAllModuleEvents() {
		//=========================================================================================================================== 翻页 --- pages-v2 改成 pages-number 了
		//var page_holder = $('.pages-v2');
		var page_holder = $('.news-type4-page');
		page_holder.on('click', 'a', function (e) {
			e.preventDefault();
			var getPage = parseInt($(e.target).text(), 10);
			//if (getPage === P.currentPage) return;
			$('.news-container').find('.pop-follow').appendTo('body');

			//.thread-reply --> 详细页的评论；.news-container --> 列表页的内容；.album-container --> 相册大列表内容
			$('.news-container').add('.thread-reply').add('.album-container').add('.pages-v2').remove();

			$.publish('inner-city-line-page-loading');
			$.get(xq.config.get('getPage'), {
				"page": getPage
			}, function (html) {
				$.publish('inner-city-line-page-load-success', { 'html': html });
			});
		});


		//=========================================================================================================================== 发一个新鲜事：当还没有任何新鲜事的时候
		$('#non-news a').on('click', function (e) {
			
		});

		bindThreadAction();
		function bindThreadAction() {
			$('.news-wrapper .msg-date').on('click', '.edit-btn', function (e) {
				var threadNode = $(e.target).parents('.news-wrapper');
				var threadId = threadNode.find('.news-list').data('threadid');
				//class = "news-wrapper xiehou"
				var type = getType(threadNode.attr('class').split(' ')[1]);
				if (type == 'album') return;
				
				var msgLineEl = threadNode.find('.msg-line');
				editFormController.show({
					type: type,
					thread_id: threadId,
					line_name: msgLineEl.find('a').text(),
					master_id: msgLineEl.data('masterid'),
					cross_id: msgLineEl.data('crossid'),
					station_name: threadNode.find('.msg-station').text()
				});
				editFormPopup.pop();
			});
			$('.news-wrapper .msg-date').on('click', '.del-btn', function (e) {
				var threadNode = $(e.target).parents('.news-wrapper');
				var threadId = threadNode.find('.news-list').data('threadid');
				var type = getType(threadNode.attr('class').split(' ')[1]);

				globalConfirm.setMessage(deleteMsg.thread);
				globalConfirm.one('delete.thread', {
					threadNode: threadNode,
					threadId: threadId
				});
				globalConfirm.pop().show();
			});
		}

		bindCommentDelete();
		function bindCommentDelete() {
			$('.a-reply').hover(function (e) {
				$(e.currentTarget).find('.action').show();
			}, function (e) {
				$(e.currentTarget).find('.action').hide();
			});
			$('.a-reply').on('click', '.delete', function (e) {
				var commentNode = $(e.currentTarget).parents('.a-reply');
				var commentId = commentNode.data('commentid');
				globalConfirm.setMessage(deleteMsg.reply);
				globalConfirm.one('delete.reply', {
					commentNode: commentNode,
					commentId: commentId
				});
				globalConfirm.pop().show();
			});
		}

		//===========================================================================================================================
		//===========================================================================================================================
		//=========================================================================================================================== 征人列表页
		//===========================================================================================================================
		//===========================================================================================================================


		//===============================================================================绑定 点击“应征”按钮
		// “应征”弹出窗的 事件
		$.publish('bind-follow-btn-click');


		//===============================================================================绑定 点击“添加回复”区域
		bindAddReply();
		function bindAddReply() {
			//1. 点击添加回复
			$('.focusout .input-div').on('click', function () {
				//未登录
				if (!xq.isLoginUser()) {
					xq.fn.exec('show-pop-log');
					return;
				}
				$.publish('reply-input-focusin', { $tar: $(this).parents('.focusout') });
			});
			//2. tab focusin 一样 ↑
			$('.focusout .input-div input').on('focusin', function () {
				if (!xq.isLoginUser()) {
					xq.fn.exec('show-pop-log');
					return;
				}
				$.publish('reply-input-focusin', { $tar: $(this).parents('.focusout') });
			});
		}
		//===============================================================================绑定 “回复”（submit）帖子
		
		$.publish('bind-reply-submit_btn', { $replybox: $('.reply-box') });

		//===============================================================================绑定 “回复”某条评论
		//
		$.publish('bind-reply-replysomebody_btn', { $btn: $('.feed-replies .a-reply .reply-btn') });



		//===========================================================================================================================
		//===========================================================================================================================
		//=========================================================================================================================== 征人详细页
		//===========================================================================================================================
		//===========================================================================================================================

		//=============================================================================== 给应征者“写私信” --- 后几段完全来自于“home.js”
		$('.hangouter .a-reply button').on('click', function (e) {
			var $tar = $(e.target);
			var userid = $tar.parent().data('userid');
			var username = $tar.siblings('.info').find('.username').text();
			$.publish('goto-write-mail', { to: { name: username, id: userid }, isAnonymous: false });
		});
		//

		//因为这个不会动态生成，所以只需在页面初始化时绑定一次即可
		$('#write-mail .send-btn').on('click', function (e) {
			var $mail = $('#write-mail');
			var textarea = $mail.find('.input-area textarea');
			var content = $.trim(textarea.val());

			if (content === '') {
				return;
			}

			$mail.hide();
			textarea.val('');
			$.publish('send-mail', { content: content, to: $mail.data('to_id'), isAnonymous: $mail.data('isAnonymous') });
		});

		//同上，只绑定一次
		$('#write-mail .top .wrap i').on('click', function (e) {
			var $mail = $('#write-mail');
			$.publish('close-mail-pop', { $mail: $mail });
		});

		//===============================================================================回复“帖子”或“某楼层”
		//直接回复帖子
		$('.thread-main .operates .reply-btn').on('click', function (e) {
			if (!xq.isLoginUser()) {
				xq.fn.exec('show-pop-log');
				return;
			}
			$.publish('thread-detail-reply', {
				quote: false
			});
		});
		//回复楼层
		bindThreadReply($('.thread-reply'));

		function bindThreadReply($el) {
			//$el.find('.reply-msg .btn').on('click', function (e) {
			//var btn = $el.find('.btn');
			var op = $el.find('.reply-msg');
			var replyBtn = op.find('.reply');
			var delBtn = op.find('.del-btn');

			replyBtn.on('click', function (e) {
				var $tar = $(e.target);
				var commentOp = $tar.parents('.reply-msg');

				$.publish('thread-detail-reply', {
					quote: true,
					quote_layer: commentOp.find('.layer').text(),
					quote_name: commentOp.siblings('.title').children('a').text(),
					quote_content: xq.escapeHTML(commentOp.siblings('.reply-cnt').text()),
					comment_id: $tar.parents('.thread-reply').data('commentid')
				});
			});

			delBtn.on('click', function (e) {
				var commentNode = $(e.currentTarget).parents('.thread-reply');
				var commentId = commentNode.data('commentid');
				globalConfirm.setMessage(deleteMsg.reply);
				globalConfirm.one('delete.reply', {
					commentNode: commentNode,
					commentId: commentId
				});
				globalConfirm.pop().show();
			});

		}
		//点击“发布”按钮
		$('.reply-part .reply-area button').on('click', function (e) {
			$.publish('reply-submit-go', e);
		});
		




		//===========================================================================================================================
		//===========================================================================================================================
		//=========================================================================================================================== 相册大列表页（所有相册的列表）
		//===========================================================================================================================
		//===========================================================================================================================
		//===============================================================================相册hover
		$('.album-container .pics-info').hover(function (e) {
			$(this).addClass('album-hover');
		}, function (e) {
			$(this).removeClass('album-hover');
		});

		//===============================================================================相册搜索
		var __tmpl = '<li><a href="<%= url %>"><%= name %></a></li>';
		var search_cache = {};
			
		$('.album-container .options .search-input input').on('keyup', function (e) {
			var keyword = $.trim($(this).val());
			if (keyword === '') {
				$.publish('hide-search-result');
				return;
			}

			if (search_cache[keyword]) {
				$.publish('show-search-result', { keyword: keyword, 'result': search_cache[keyword] });
			} else {
				$.getJSON(xq.config.get('search-album'), { 'keyword': keyword }, function (json) {
					search_cache[keyword] = json;
					$.publish('show-search-result', { keyword: keyword, 'result': search_cache[keyword] });
				});
			}
		}).on('focusin', function (e) {
			if($.trim($(this).val())!=='')
			$('.album-container .options .search-result ul').show();
		});

		xq.onDocClick(function (e) {
			if($('.album-container .options .search-input').has(e.target).length == 0)
				$.publish('hide-search-result');
		});

		$.subscribe('hide-search-result', function () {
			$('.album-container .options .search-result ul').hide();
		});
		$.subscribe('show-search-result', function (e) {
			var html = '';
			_(e.result).each(function (album) {
				html += _.template(__tmpl, {
					'name': genAlbumName(e.keyword, album.name, album.num),
					'url':album.url
				});
			});

			$('.album-container .options .search-result ul').empty().append(html).show();

			function genAlbumName(key, fullName, num) {
				var index = fullName.indexOf(key);
				num = ' (' + num + ')';
				if (index === -1) return fullName + num;
				return fullName.substr(0, index) + '<b>' + key + '</b>' + fullName.substr(index + key.length) + num;
			}
		});

		

		//===========================================================================================================================
		//===========================================================================================================================
		//=========================================================================================================================== 相册小列表页（单个相册的图片列表 --- 瀑布流）
		//===========================================================================================================================
		//===========================================================================================================================
		xq.config.set('like-text', {
			'like': {
				'text': '赞',
				'title': '喜欢这个'
			},
			'hadlike': {
				'text': '已赞',
				'title': '取消“赞”此项'
			}
		});
		xq.rebindPage.addAndExec('l_album_list2', function () {
			//===============================================================================瀑布流显示
			//if ($.fn.masonry) {
			//	var $container = $('.falls-style');
			//	$container.imagesLoaded(function () {
			//		$container.masonry({
			//			itemSelector: '.single-photo'
			//		});
			//	});
			//}

			//===============================================================================添加图片
			$('.page-title2 .add-pic-btn').on('click', function (e) {
				//未登录
				if (!xq.isLoginUser()) {
					//xq.fn.exec('show-pop-log');
					xq.fn.execWhenLoad('show-pop-log');
					return;
				}
				$('.msg-panel .msg-form').slideDown();

				//如果已经设置过，则不用再次设置
				if (xq.data.get('master_id') && !xq.fn.exec('get_selected_master_id')) {
					xq.fn.exec('line-select-update-setdata', xq.data.get(['master_id', 'master_name']));
				} else if (xq.data.get('cross_id') && !xq.fn.exec('get_selected_cross_id')) {
					xq.fn.exec('cross-select-update-setdata', xq.data.get(['cross_id', 'cross_name']));
				}
			});
			//“取消”按钮在其他页面
			//$('.msg-panel .btn-cancle').on('click', function (e) { });
			//===============================================================================发布新鲜事的 data 处理

			//===============================================================================添加“回复”
			$.publish('bind-fallstyle-reply-btn', { $el: $('.photo-comment') });


			$('.single-photo .reply-area textarea').on('focus', function (e) {
				//未登录
				if (!xq.isLoginUser()) {
					xq.fn.exec('show-pop-log');
					return;
				}
			});
			$('.single-photo .reply-area textarea').on('keypress', function (e) {
				if (e.keyCode !== 13) return;
				var $tar = $(e.target);
				var content = $.trim($tar.val());
				var $col = $tar.parents('.single-photo');
				var tmpl = _.template(xq.getTmpl('reply-list-album-page-tmpl'),{
					data:{
						content: content 
					}
				});
				$.publish('reply-news', {
					content: content,
					$input: $tar,
					$replyLi: $tar.parent(),
					tmpl: tmpl,
					//$willPrev: $tar.parent().siblings('.comments').children().last(),
					thread_id: $col.data('threadid')
				});
				e.preventDefault();
				$(this).trigger('keyup');
			
				$.publish('falls-style-relayout', { $item: $col, $container: $('.falls-style') });
			});

			//===================================================================================赞
			$('.single-photo .photo-meta .like').on('click', function (e) {
				var $tar = $(this);
				var hl = $tar.data('hadlike');
				var count = parseInt($tar.children('.count').text(), 10);
				xq.log($tar.children('.count').text());
				hl?(count--):(count++);
				$tar.children('.count').text(count);
				$tar.attr('title', (hl ? xq.config.get('like-text')['like']['title'] : xq.config.get('like-text')['hadlike']['title']));
				$tar.children(':not(.count)').text((hl ? xq.config.get('like-text')['like']['text'] : xq.config.get('like-text')['hadlike']['text']));

				xq.getJSON(xq.config.get('likeServer'), {
					'thread_id': $tar.parents('.single-photo').data('threadid'),
					'action': (hl ? 'like' : 'unlike')
				}, function (json) {
				
				});

				$tar.data('hadlike', !hl);
			});

		});
		//如果有这个hash，就直接打开上传图片的表单
		if (location.hash == '#add-pic') {
			$('.page-title2 .add-pic-btn').get(0).click();
		}
		//===========================================================================================================================
		//===========================================================================================================================
		//=========================================================================================================================== 相片详细页
		//===========================================================================================================================
		//===========================================================================================================================

		//===============================================================================赞/已赞
		//最多显示15个人
		xq.config.set('like-show-max', 15);
		//每个用户的所占宽度
		xq.config.set('like-user-width',44);

		var liked_num = parseInt($('.photo-detail .the-photo .operates .like span').text());
		var $likeBtn = $('.photo-detail .the-photo .operates .like');

		$likeBtn.on('click', function (e) {
			var c = $likeBtn.data('canclick');
			if (c || c === undefined) {
				$likeBtn.data('canclick', false);
				$(this).data('hadlike', !($(this).data('hadlike')));
				$(this).data('hadlike') ?
				$.publish('photo_like_click', { $btn: $(this), thread_id: xq.data.get('thread_id') }) :
				$.publish('photo_unlike_click', { $btn: $(this), thread_id: xq.data.get('thread_id') });
			}
		});


		//===============================================================================相册列表点击轮播
		//-----这一块先不做，之后再做，先做成静态页
		if (0) {
			var config1 = {
				timeout: 10 * 1000
			};
			var photoTemp = {
				//'125210':{ 'html': 'xxx', timestamp: 374125212 } //N秒之内用缓存，以后重新去后台取数据
			};
			$('.photo-list .img').on('click', function (e) {

				$.publish('');
			});
		}

		//===============================================================================左右切换图
		var config2 = {
			imgWidth: 554
		}
		$('.photo-detail .the-photo table img').on('mousemove', function (e) {
			if (getOffsetX(e) < config2.imgWidth / 2) {
				$.publish('img-curser-prev', e);
			} else {
				$.publish('img-curser-next', e);
			}
		});
		$('.photo-detail .the-photo table').on('click', function (e) {
			if (getOffsetX(e) < config2.imgWidth / 2) {
				$.publish('img-goto-prev');
			} else {
				$.publish('img-goto-next');
			}
		});
		$('.album-photo .right-btn').on('click', function (e) {
			$.publish('img-goto-next');
		});
		$('.album-photo .left-btn').on('click', function (e) {
			$.publish('img-goto-prev');
		});
		//$('.photo-list .img').on('click', function (e) {
		//	if ($(e.target).hasClass('is-user')) return;
		//	var href = $(this).find('table a').data('href');
		//	location = href;
		//});

		function getOffsetX(jqEvent) {
			return jqEvent.offsetX || (jqEvent.pageX - $(jqEvent.target).offset().left);

		}
	}

});