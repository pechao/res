/*
*
* 发布新鲜事的模块 ---- 之前写在 inner_city_line.js 中，提取之。
*
* 
*/
(function ($, _, xq, win, doc) {

	debug = true;

	var Page = {};

	var hint, mask, hintTime = 2 * 1000;
	var isPersonalAlbum;
	var Item, View, Model, requiredItem, lengthLimit, warnMessage, moduleEvent = new xq.Event();

	(function () {
		//所有的实例都存在这里一个备份
		var instances = [];

		//后来写的这个 Item 类是为了验证必选项是否填写了，以后要推广这种写法
		Item = $.inherit({
			//参数: { ... }
			//		node Node -- jQuery 对象
			//		name String -- 用来匹配信息
			//		[ keyInModel = [ name String ] Array ] -- 实例在Model中存储的key -- Array是指有 >1 个的键名，匹配任何一个都行；比如：线路有：master_id | cross_id，在不同的情况下，有其中一个即可
			//		[ avaliableFn Function ] -- 指定判断是否合法的函数
			//		[ min Number ] -- value 的最小长度
			//		[ max Number ] -- value 的最大长度


			//对外接口：
			//
			//	方法：
			//		
			//
			__constructor: function (options) {
				_.extend(this, options);
				this.keyInModel = this.keyInModel || this.name;

				this.__cacheHandler = {};
				this.originColor = this.node.css('border-color');
				this.avaliable = false;
				this.warnMessage = null;

				this.on('change.valueSetted', function () {
					this.removeWarn();
				});

				instances.push(this);
			},
			getValue: function () {
				var name = this.keyInModel;
				var value;
				if (_.isString(name)) {
					value = Model.dataCollect.form[name];
				} else {
					$.each(name, function (i, nm) {
						value = Model.dataCollect.form[nm];
						if (value) return false;
					});
				}
				return value;
			},
			warn: function () {
				var node, warnColor, originColor;

				node = this.node;
				warnColor = '#f00';

				flick(node, this.originColor, warnColor, 2, null, function () {
					//xq.log('over');
				});
			},
			removeWarn: function () {
				this.node.css('border-color', this.originColor);
			},
			isAvaliable: function () {
				var value = this.getValue();
				var avali;
				if (this.avaliableFn) {
					avali = this.avaliableFn.call(this);
				}else if (this.min && (value||'').length <= this.min) {
					this.warnMessage = _.template(warnMessage[this.name], { tooShort: true, limit: this.min });
					avali = false;
				} else if (this.max && (value || '').length >= this.max) {
					this.warnMessage = _.template(warnMessage[this.name], { tooShort: false, limit: this.max });
					avali = false;
				}else {
					avali = !!value;
				}

				avali ? this.removeWarn() : this.warn();

				return this.avaliable = avali;
			}
		});
		xq.Event.mixTo(Item);

		function flick(node, color1, color2, times, interval, callback) {
			var id, change;
			times = times || 2;
			interval = interval || 100;

			id = setInterval(function () {
				(change = !change) && (times--);

				//xq.log(times)
				node.css('border-color', change ? color1 : color2);

				//每两次， -1
				if (!times && !change) {
					clearInterval(id);
					callback && callback();
				}
			}, interval);
		}

		
		moduleEvent.on('submit.thread', function ($form) {
			var type = Model.dataCollect.type || (Model.dataCollect.type = xq.data.get('type_threadForm'));
			if (type == 'album' && isPersonalAlbum) type = "personal_album";
			var required = requiredItem[type];

			var allowed = true, warnNum=0;
			$.each(instances, function (i, ins) {
				if ($.inArray(ins.name, required) != -1 && !ins.isAvaliable()) {
					//ins.warn();
					allowed = false;
					if (warnNum == 0) {
						var node = hint.getNode();
						hint.setMessage(this.warnMessage || warnMessage[ins.name]).pop().show();
						_.delay(_.bind(node.fadeOut, node), hintTime);
					}
					warnNum++;
				} else {
					//ins.removeWarn();
				}
			});

			allowed && moduleEvent.fire('submit.allowed', $form);
		});

		moduleEvent.on('change.formValue', function (name) {
			$.each(instances, function (i, ins) {
				if (name == ins.name) {
					//ins.isAvaliable();
					ins.removeWarn();
					return false;
				}
			});
		});

		requiredItem = {
			'hangout': ['line', 'title', 'content'],
			'topic': ['line', 'title', 'content'],
			'album': ['line', 'album', 'picture'],
			'personal_album': ['picture'],
			'encounter': ['line', 'title', 'sex', 'date', 'feature', 'content']
		};
		
		warnMessage = {
			'line': '必须先指定发布到哪条线路',
			'title': '标题必须<%= tooShort ? "大于" : "小于" %><%= limit %>个字',
			'content': '内容必须<%= tooShort ? "大于" : "小于" %><%= limit %>个字',
			'album': '必须指定发布到哪个公共相册',
			'picture': '至少上传一张照片',
			'sex': '请选择偶遇对象的性别',
			'feature': '至少添加1项偶遇对象的特征'
		};
	})();


	jQuery(function ($) {
		hint = new xq.Widget.Hint({ domId: 'thread-form-warn' }).hide().setId('fileupload.hint').appendTo();
		mask = new xq.Widget.Mask().relate(hint).appendTo();

		var line = new Item({
			node: $('.msg-form .line-sel'),
			name: 'line',
			keyInModel: ['cross_id', 'master_id']
		});

		var title = new Item({
			node: $('.give-title .input input').add('.give-meeting-title .input input'),
			name: 'title',
			min: 2,
			max: 50
		});
		var content = new Item({
			node: $('.content-section textarea').add('.meet-content-section textarea'),
			name: 'content',
			min: 5,
			max: 3000
		});
		var album = new Item({
			node: $('.public-photo-sel'),
			name: 'album',
			keyInModel: ['album_id']
		});
		var picture = new Item({
			node: $('.btn-area .add-btn'),
			name: 'picture'
		});
		var feature = new Item({
			node: $('.feature-section input'),
			name: 'feature'
		});










		//线路选择之后，加载线路信息并缓存起来 -- 统一换成 xq.Data.Line 来管理
		//xq.data.set('line_cache', {});
		//相册的缓存
		xq.data.set('album_cache', {});

		//发布框里面的下拉菜单，隐藏处理
		xq.onDocClick(function (e) {
			var $tar = $(e.target);
			// 1. 线路相册下拉 -- 线路选择 -- 站点选择 -- 标签选择
			var need_hide = ['public-photo-sel', 'line-sel', 'station-sel', 'label-sel'];

			_.each(need_hide, function (section) {
				section = '.' + section;
				var pulldown = section + '-pull-down';
				if ($tar.parents(section).length == 0) {
					$(pulldown).hide();
				}
			});

			//1.5 相册搜索结果
			var result = $('#album-search-result');
			var search = $('.public-photo .search-filter');
			if (!result.is($tar) && result.has($tar).length == 0 && !search.is($tar) && search.has($tar).length == 0) {
				result.hide();
			}

			// 2. 创建相册弹出窗
			var a_pop = $('#pop-create-common');
			if (a_pop.has($tar).length == 0 && $('.public-photo .create-album').has($tar).length == 0) {
				a_pop.hide();
			}
		});


		//发布的是否是个人相册，亦或是公共相册
		xq.fn.add('set_isPersonalAlbum', function (value) {
			isPersonalAlbum = value;
		});

		//1.5 新鲜事模块 --- 发布按钮
		$('.post-news .publish').hover(function () {
			$.publish('publish-pulldown-show');
		}, function () {
			$.publish('publish-pulldown-hide');
		});

		$.subscribe('publish-pulldown-show', function () {
			$('.post-news .publish ul').show();
		});

		$.subscribe('publish-pulldown-hide', function () {
			$('.post-news .publish ul').hide();
		});

		//3. 新鲜事模块 --- 发布的模块选择
		//var modules = {}; //就是 $('li.className')

		var config = {
			nowModule: undefined,
			defaultLabel: {
				'hangout': {
					'title': '征人一起做什么？',
					'content': '征人内容'
				},
				'topic': {
					'title': '起个标题吧',
					'content': '帖子内容'
				}
			},
			defaultStationTip: '请选择站点',
			defaultPhotoLimitNum: 4,
			picDescriptionLimit: 140
		};

		var postForm = $('.msg-panel').not('#thread-edit');
		var step1Tab = 'movie';
		View = {
			postNewsInputArea: postForm.find('.msg-form'),
			wrapper: postForm.find('.msg-form-inner'),
			inputs: postForm.find('.msg-form-inner').children(),

			//_showModule [ 可选 ]，也可以手动指定要加载的模块
			update: function (type, _showModule) {
				var moduleName = config.nowModule;
				this.postNewsInputArea.hide();
				this.inputs.hide();
				//xq.log(moduleName);
				this.showModule(_showModule || Model.postNews[moduleName]);

				//重置 label
				try {
					this.title.reset(type);
					this.content.reset(type);
				} catch (e) { };

				this.postNewsInputArea.slideDown();
			},
			//目前只有 hangout 有 tab，等以后有其他的了再扩展这个方法
			tabSwitch: function (tab, type) {
				var bars = Model.getTab(tab);
				var area = this.postNewsInputArea;
				//依据这个 bar 来添加、隐藏显示 其他的 bar
				var baseBar = area.find('.hangout-tab');

				baseBar.nextAll().hide();
				_.each(bars, function (bar) {
					var m = area.find('.' + bar);
					m.insertAfter(baseBar).show();
				});
			},
			hide: function () {
				this.postNewsInputArea.slideUp();
			},
			showModule: function (module) {
				var that = this;
				var area = this.postNewsInputArea;
				_.each(module, function (module, i) {
					if (xq.utils.getType(module) === 'string') {
						var m = area.find('.' + module);
						m.appendTo(that.wrapper).show();
					}
				});
			},

			getData: function (elem) {
				///<summary>获取数据</summary>
				///<param name="elem" type="Element">含有 data-action 属性的那个标签</param>
				return $(elem).data('action');
			},
			lineSel: {
				update: function (lineName) {
					//xq.log(lineName);
					View.postNewsInputArea.find('.line-sel-inner span').text(lineName);
					View.postNewsInputArea.find('.line-sel-inner a').attr('title', lineName);
					View.postNewsInputArea.find('.line-sel-pull-down').hide();
				}
			},
			timeSel: {
				update: function (time) {
					View.postNewsInputArea.find('.time-sel-inner span').text(time);
				}
			},
			stationSel: {
				update: function (stationName) {
					View.postNewsInputArea.find('.station-sel-inner span').text(stationName);
					View.postNewsInputArea.find('.station-sel-inner a').attr('title', stationName);
					View.postNewsInputArea.find('.station-sel-pull-down').hide();
				}
			},
			title: {
				reset: function (type) {
					var label = config.defaultLabel[type]['title'];
					View.postNewsInputArea.find('.give-title .input label').text(label);
				}
			},
			labelSel: {
				update: function (label) {
					View.postNewsInputArea.find('.label-sel-inner span').text(label);

					//其实这都应该放在外面，HTML模板，但是，提取出去之后，还得每个页面都加载这一小块，实在麻烦
					//那就干脆直接放在这里，反正也是很小的一块
					var __tmpl = '<li title=""></li>';

					var labels = xq.global.get('label');
					if (_.indexOf(labels, label) === -1) {
						var ul = View.postNewsInputArea.find('.label-sel-pull-down ul');
						var $li = $(__tmpl).appendTo(ul);
						$li.text(label).attr('title', label);
					}
				}
			},
			content: {
				reset: function (type) {
					var label = config.defaultLabel[type]['content'];
					View.postNewsInputArea.find('.content-section label').text(label);
				}
			},
			picture: {
				addPic: function (data) {
					var $html = $(_.template(xq.getTmpl('add-photo-part'), { photo: data }));
					View.postNewsInputArea.find('.btn-area .add-btn').before($html);
					$.publish('chrome-placeholder-bind', { $el: $html.find('.chrome-placeholder') });
				},
				addPlaceholder: function () {
					var t = xq.getTmpl('upload-pic-placeholder');
					var $html = $($.trim(t));
					$html.insertBefore(View.postNewsInputArea.find('.btn-area .add-btn'));
					return $html;
				},
				update: function (elem, num) {
					var limit = config.picDescriptionLimit;
					$(elem).find('.number').text(limit - num);
				}
			}
		};
		Model = {
			postNews: {
				//'hangout': { 'step1': ['post-line', 'hangout-tab', 'hangout-movie', 'where', 'goods-intro'], 'step2': ['post-line', 'give-title', 'content-section', 'goods-intro'] },
				'hangout': {
					'step1': ['post-line', 'hangout-tab', {
						'movie': ['hangout-movie'],
						'other': ['where', 'goods-intro']
					}],
					'step2': ['post-line', 'give-title', 'content-section', 'goods-intro']
				},
				'topic': ['post-line', 'give-title', 'content-section', 'add-pic-placeholder'],
				'album': ['sel-zhuanji', { 'lineAlbum': ['post-line', 'public-photo', 'btn-area'], 'personalAlbum': ['personal-photo', 'btn-area'] }],
				'encounter': ['post-line', 'give-meeting-title', 'sex-section', 'meet-time', 'feature-section', 'meet-content-section', 'add-pic-placeholder'],
				'bussiness': []
			},
			getHangoutStep1Tab: function (tabName) {
				//return
				var commonBars = _.filter(Model.postNews['hangout'].step1, function (bar) { return _.isString(bar); });
				var tabBars = this.postNews.hangout.step1[2][tabName];
				return commonBars.concat(tabBars);
			},
			//目前只有 hangout 征人有 tab ，以后需要的话再扩展这个接口
			getTab: function (tab, type) {
				//type == type || 'hangout';
				return this.postNews.hangout.step1[2][tab];
			},
			dataCollect: {
				'type': undefined,
				'form': {}
				//form 的格式：{
				//  master_id: 'xx',
				//  station_id: 'xx',
				//	title: xxx,
				//	label: xxx,
				//  relUrl: 'http:...',
				//  content: 'xxxxxx',
				//  time: 'xx'
				//}
			},
			setModuleType: function (moduleName) {
				this.dataCollect.type = config.nowModule = moduleName;
			},
			lineSel: {
				setData: function (data) {
					//Model.dataCollect.form.line = Model.dataCollect.form.line || {};
					if (!data.master_id) {
						//throw new Error('还没有跨城线路...后台没有这个数据结构');
						Model.dataCollect.form.cross_id = data.cross_id;
					} else {
						$.publish('post-news-line-select', data);
						Model.dataCollect.form.master_id = data.master_id;


						$.publish('load-stations-by-master', _.extend({ formEl: postForm, isPostForm: true }, data));
					}
					$.publish('load-albums-by-master', data);
					moduleEvent.fire('change.formValue', 'line');
				}
			},
			timeSel: {
				setData: function (time) {
					Model.dataCollect.form.cross_time = time;
				}
			},
			stationSel: {
				setData: function (data) {
					$.publish('post-news-station-select', data);
					//Model.dataCollect.form.line = Model.dataCollect.form.line || {};
					Model.dataCollect.form.station_id = data.station_id;
				},
				reset: function () {
					delete Model.dataCollect.form.station_id;
				}
			},
			title: {
				setData: function (title) {
					//Model.dataCollect.form.title = Model.dataCollect.form.title || {};
					Model.dataCollect.form.title = title;
					moduleEvent.fire('change.formValue', 'title');
				}
			},
			labelSel: {
				setData: function (label) {
					//Model.dataCollect.form.title = Model.dataCollect.form.title || {};
					Model.dataCollect.form.label = label;

					var labels = xq.global.get('label');
					if (_.indexOf(labels, label) === -1) {
						labels.push(label);
					}
				}
			},
			//去哪，商家网址
			whereUrl: {
				setData: function (data) {
					//Model.dataCollect.form.whereUrl = data.toString();
					Model.dataCollect.form.relativeUrl = data.toString();
				}
			},
			//征人，出行的内容
			content: {
				setData: function (content) {
					//xq.log(content);
					Model.dataCollect.form.content = content;
					moduleEvent.fire('change.formValue', 'content');
				}
			},
			sex: {
				setData: function (sex) {
					Model.dataCollect.form.sex = sex;
				}
			},
			feature: {
				setData: function (e) {
					var feature = e.feature;
					var action = e.action;
					Model.dataCollect.form.feature = Model.dataCollect.form.feature || [];

					switch (action) {
						case 'add':
							Model.dataCollect.form.feature.push(feature);
							break;
						case 'delete':
							_.without(Model.dataCollect.form.feature, feature);
							break;
					}

					moduleEvent.fire('change.formValue', 'feature');
				}
			},
			date: {
				setData: function (date) {
					//Model.dataCollect.form.date = Model.dataCollect.form.date || {};
					//date: { year: xxxx, month: xx, day: xx }
					//_.extend(Model.dataCollect.form.date, date);
					_.extend(Model.dataCollect.form, date);
				},
				getYear: function () {
					//return Model.dataCollect.form.date.year;
					return Model.dataCollect.form.year;
				},
				getMonth: function () {
					//return Model.dataCollect.form.date.month;
					return Model.dataCollect.form.month;
				}
			},
			picture: {
				init: function () {
					//pictures:[ { upload_id:xxx, description: '' }, { } ]
					Model.dataCollect.form.picture = Model.dataCollect.form.picture || [];
				},
				//正在上传的图片
				uploading: 0,
				getNum: function () {
					this.init();
					return Model.dataCollect.form.picture.length;
				},
				addPic: function (data) {
					this.init();
					var pics = Model.dataCollect.form.picture;
					//允许相同ID的多张图片上传
					//if (pics.length !== 0) {
					//	//如果已经上传过这张图片--相同ID，就忽略掉
					//	var ids = _.pluck(pics, 'upload_id');
					//	if (_.indexOf(ids, data.upload_id) !== -1) return;
					//}
					pics.push({ upload_id: data.upload_id });
					//同时更新对应的input标签---有的页面需要，是直接提交表单的，而不是ajax提交
					$('#form-pictures-upload').val(JSON.stringify(pics));

					moduleEvent.fire('change.formValue', 'picture');
				},
				delPic: function (data) {
					this.init();
					Model.dataCollect.form.picture = _.filter(
								Model.dataCollect.form.picture,
								function (picObj) {
									return picObj.upload_id.toString() !== data.upload_id.toString()
								}
							);
				},
				addDescription: function (data) {
					var picObj = _.find(Model.dataCollect.form.picture, function (picObj) { return picObj.upload_id.toString() === data.upload_id.toString() });

					picObj.description = data.description;
					//同时更新对应的input标签---有的页面需要，是直接提交表单的，而不是ajax提交
					$('#form-pictures-upload').val(JSON.stringify(Model.dataCollect.form.picture));
				}
			},
			album: {
				setData: function (data) {
					$.publish('post-news-album-select', data);
					Model.dataCollect.form.album_id = data.album_id;

					moduleEvent.fire('change.formValue', 'album');
				}
			}
		};

		///////////////////////////////////
		///////////////////////////////////对其他JS 提供 接口
		///////////////////////////////////
		xq.fn.add('get_selected_master_id', function (e) {
			return Model.dataCollect.form.master_id;
		});
		xq.fn.add('get_selected_cross_id', function (e) {
			return Model.dataCollect.form.cross_id;
		});

		//data: { cross_id: xx, name:  }
		//data: { master_id: xx, name:  }
		xq.fn.add('set_selected_line', function (data) {
			Model.lineSel.setData(data);
			View.lineSel.update(data.name);
		});

		xq.fn.add('add_form_keyvalue', function (key, value) {
			if (!$.isPlainObject(key)) {
				Model.dataCollect.form[key] = value;
				return;
			}

			_.each(key, function (value, key) {
				Model.dataCollect.form[key] = value;
			});
		});




		///////////////////////////////////
		///////////////////////////////////有的页面有默认值，比如，相册列表2页 和 相册详细页，默认 发布类型为：picture
		///////////////////////////////////
		var _type = $('.msg-panel').data('posttype');
		Page.album_id = $('.msg-panel').data('albumid') || xq.config.get('album_select_id');

		if (!_.isUndefined(_type)) {
			Model.dataCollect.type = _type;
		}
		if (Page.album_id) {
			Model.album.setData({ album_id: Page.album_id });
		}

		isPersonalAlbum = $('.msg-panel form input[name=personal]').length != 0;

		//页面后退的时候，内容会有默认值 --- 在 894行（给内容绑定事件的那儿）
		//textarea.trigger('keyup');








		////////////////////////////////////////////////////////////各种绑定UI的操作事件
		//点击选择，需要发布的新鲜事的类型
		$('.post-news .publish').on('click', 'li', function (e) {
			if (!xq.isLoginUser()) {
				xq.fn.exec('show-pop-log');
				return;
			}
			var type = $(e.target).attr('class');
			//TODO: 直接在源头拦截，替换，之后可以把 （1）城内/跨城页 （2）home页的 HTML 直接也替换了（目前可能后台改起来麻烦（他们的反应））
			if (type == 'need-person') type = 'hangout';
			if (type == 'meeting') type = 'encounter';

			$.publish('postnews-module-sel-type', { type: type, formEl: postForm });
			$.publish('publish-pulldown-hide');
		});
		//点击“发布”或“取消发布”的按钮
		postForm.find('.btn-line .inner').on('click', 'a', function (e) {
			e.preventDefault();
			var p = $(e.target).parent();
			if (p.hasClass('btn-cancle')) {
				$.publish('postnews-module-hide', e);
			} else if (p.hasClass('btn-post')) {
				//提交表单先验证
				moduleEvent.fire('submit.thread', $(e.target).parents('form'));
			}
		});

		//when submit is allowed
		moduleEvent.on('submit.allowed', function ($from) {
			$.publish('postnews-module-publish', { $form: $from });
		});

		//点击征人的 “下一步”按钮
		$('.msg-form .btn-line p.btn-next').add('.msg-form .btn-line p.btn-skip').on('click', 'a', function (e) {
			$.publish('postnews-hangout-step2');
		});
		//点击征人 “上一步”按钮
		$('.msg-form .btn-line p.btn-prev').on('click', 'a', function (e) {
			$.publish('postnews-hangout-step1');
		});



		/*===================== hangout tab switchy 征人tab切换 BEGIN ===========================*/
		var currentHangoutMoviePage = 0;
		var hangoutMoviePageCount = View.postNewsInputArea.find('.hangout-movie .switchy-addon li').length;
		View.postNewsInputArea.find('.hangout-tab').on('click', 'li', function (e) {
			var el = $(e.currentTarget);
			el.addClass('active').siblings().removeClass('active');

			var type = el.data('type');
			step1Tab = type;
			View.tabSwitch(step1Tab);
			//$.publish('postnews-hangout-step1');
		});

		View.postNewsInputArea.find('.hangout-movie .switchy-addon ul').on('click', 'li', function (e) {
			var tar = $(e.currentTarget);
			var index = tar.index();
			currentHangoutMoviePage = index;
			tar.addClass('active').siblings().removeClass('active');
			hangoutMovieScroll(index, tar.parents('.movies').find('.movie-list'));
		});

		View.postNewsInputArea.find('.hangout-movie>div>a').on('click', function (e) {
			var t = $(e.target);
			var tar = t.parent();
			if (tar.hasClass('prev')) {
				if (currentHangoutMoviePage <= 0) return;
				currentHangoutMoviePage--;
				if (currentHangoutMoviePage == 0)
					t.removeClass('clickable');
			} else {
				if (currentHangoutMoviePage >= hangoutMoviePageCount - 1) return;
				currentHangoutMoviePage++;
				if (currentHangoutMoviePage == hangoutMoviePageCount - 1)
					t.removeClass('clickable');
			}
			tar.siblings().children('a').addClass('clickable');
			hangoutMovieScroll(currentHangoutMoviePage, tar.siblings('.movies').find('.movie-list'));
		});

		//如果以后有“电影”以外其他需要 轮播 的，再扩展这个方法
		function hangoutMovieScroll(page, ulDom) {
			var lis = ulDom.find('li');
			var oneWidth = xq.utils.getWidth(lis[0], true);
			var count = lis.length;
			var moveDis = count / hangoutMoviePageCount * oneWidth;
			var marginLeft = -moveDis * page;
			$(ulDom).stop(true, true).animate({ 'margin-left': marginLeft });
		}

		/*===================== hangout tab switchy 征人tab切换 END ===========================*/





		//点击“添加图片”按钮
		$('.add-pic-placeholder').on('click', function (e) {
			//View.postNewsInputArea.find('.btn-area').insertAfter($(this)).show();
			$(e.target).siblings('.btn-area').insertAfter($(this)).show();
		});

		// 标题 | 偶遇标题 --- 添加标题
		$('.give-title .input input').add('.give-meeting-title .input input').on('keyup', function (e) {
			var val = $.trim($(e.target).val());
			if (val === '') return;
			$.publish('set-title', val);
		});
		// 标题 -- 1.显示/隐藏   2.选择标签
		View.postNewsInputArea.find('.give-title .label-sel').on('click', function (e) {
			var target = e.target;
			var tag = target.tagName.toLowerCase();
			var toggleBtn = View.postNewsInputArea.find('.label-sel-inner');
			if ($(target).isChildOf('.label-sel-inner')) {
				var pulldownList = toggleBtn.siblings('div');
				$.publish('label-sel.toggle-visible', { 'toggleBtn': toggleBtn, 'pulldownList': pulldownList });
			} else if (tag === 'li') {
				$.publish('label-sel.label-clicked', e);
			}
		});
		// 标题 -- 添加标签
		View.postNewsInputArea.find('.add-label input').on('keyup', function (e) {
			if (e.keyCode !== 13) return;
			var val = $.trim($(e.target).val());
			if (val === '') return;
			$(e.target).val('');
			$.publish('label-sel.add-label', { target: e.target, label: val });
		});

		// 新鲜事模块 --- 图片发布
		$('.sel-zhuanji p').hover(function (e) {
			$(this).addClass('hovered').siblings().removeClass('hovered');
		}, function (e) {
			$(this).removeClass('hovered');
		});
		//发布到：某线路和某某站的选择
		$('.line-sel-inner').on('click', function (e) {
			e.preventDefault();
			var pullDown = $(e.currentTarget).siblings('.line-sel-pull-down');
			if (pullDown.is(':hidden')) {
				pullDown.show();

				//绑定下拉列表自定义滚动条
				$.publish('check-and-bind-custom-scrollbar-in-first-time', { '$scrollarea': pullDown.children('.scroll-area') });
			} else {
				pullDown.hide();
			}
		});
		$('.line-sel-pull-down').on('click', 'dd', function (e) {
			var data = View.getData($(this));

			if (data.master_id) {

				xq.fn.exec('line-select-update-setdata', data);
			} else {
				xq.fn.exec('cross-select-update-setdata', data);
			}
		});
		//主要是上面的 Handler 调用，但是提取出来方便其他的JS调用
		xq.fn.add('line-select-update-setdata', function (data) {
			var name = data.master_name || data.name;
			var station = $('.station-sel');
			var crosstime = $('.time-sel');
			var album = $('.public-photo-sel');

			Model.lineSel.setData(data);
			View.lineSel.update(name);

			crosstime.hide();
			station.show();

			//===============================================线路更换，则：相应的站点和相册都应该更换
			//(1)先缓存默认的 文本，比如：“请选择站点”“选择线路相册”，以便清空时使用
			if (_.isUndefined(station.data('when-empty-text'))) {
				//station.data('when-empty-text', station.find('.station-sel-inner span').text());
				station.data('when-empty-text', '请选择站点');
			}
			if (_.isUndefined(album.data('when-empty-text'))) {
				//album.data('when-empty-text', album.find('.public-photo-sel-inner span').text());
				album.data('when-empty-text', '选择线路相册');
			}
			//(2) 更改站点、相册的数据和视图
			Model.stationSel.setData({ 'station_id': undefined });
			View.stationSel.update(station.data('when-empty-text'));

			//如果已经设置了page的 相册ID，则不需如此
			!Page.album_id && Model.album.setData({ 'album_id': undefined });
			$('.public-photo-sel-inner span').text(album.data('when-empty-text'));
		});

		//同上面功能相同，但是是针对 跨城线路的
		xq.fn.add('cross-select-update-setdata', function (data) {
			var cross_name = data.cross_name;
			var crosstime = $('.time-sel');
			var station = $('.station-sel');

			Model.lineSel.setData(data);
			View.lineSel.update(cross_name);

			station.hide();
			crosstime.show();
		});

		//选择站点
		$('.station-sel-inner').on('click', function (e) {
			e.preventDefault();
			var pullDown = $(e.currentTarget).siblings('.station-sel-pull-down');
			var widgetElem = $(e.currentTarget).parents('.station-sel');
			if (pullDown.is(':hidden')) {
				pullDown.show();
				widgetElem.css('z-index', '100');

				//绑定站点的下拉菜单滚动条
				$.publish('check-and-bind-custom-scrollbar-in-first-time', { '$scrollarea': View.postNewsInputArea.find('.station-sel .scroll-area') });
			} else {
				pullDown.hide();
				widgetElem.css('z-index', '0');
			}
		});
		//选择时间 -- 跨城
		$('.time-sel-inner').on('click', function (e) {
			e.preventDefault();
			var timepicker = xq.data.get('timepicker');
			if (!timepicker.get('bind-post-ok-handler')) {
				timepicker.set('bind-post-ok-handler', true);
				timepicker.on('click.ok', function (e) {
					var time = timepicker.stringify();
					Model.timeSel.setData(time);
					View.timeSel.update(time);
				});
			}
			timepicker.pop().show();
		});


		View.postNewsInputArea.find('.station-sel-pull-down').on('click', 'li', function (e) {
			var data = View.getData($(this));

			Model.stationSel.setData(data);
			View.stationSel.update(data.name);
		});

		//点击发布到什么相册--- 线路相册 | 个人相册
		$('.sel-zhuanji').on('click', 'p', function (e) {
			var type = $(this).data('type');
			//lineAlbum | personalAlbum
			isPersonalAlbum = type == 'personalAlbum' ? true : false;

			//如果在进入相册之前已经选择了线路，就先加载此线路下的相册，因为在发布类型不是“图片”时，选择线路是不加载相册的
			var master_id = Model.dataCollect.form.master_id;
			if (!isPersonalAlbum && !_.isUndefined(master_id)) {
				$.publish('load-albums-by-master', { 'master_id': master_id });
			}

			//显示“发布”按钮栏
			$('.msg-form .btn-line').show();
			View.inputs.hide();
			//View.showModule(Model.postNews.picture[1][type]);
			//View.update('picture', Model.postNews.picture[1][type]);
			View.update('picture', Model.postNews.album[1][type]);
		});
		//点击按钮创建一个相册
		$('.create-album').on('click', 'a', function (e) {
			if (_.isUndefined(Model.dataCollect.form.master_id)) {
				//alert('请先选择线路');
				hint.setMessage('请先选择线路').pop().show();
				e.preventDefault();
				return;
			}

			//$.publish('create-album-deteal-view', e)
			//处理 视图 -- 比如弹出一个框
			//if ($(this).children('input').length === 0) {
			//	$(this).append('<input type="" />');
			//}
			$pop = $('#pop-create-common');

			$(e.target).after($pop);
			$pop.show().find('input').focus();
			$pop.data('new-album-type', $(e.target).parent().data('type'));
		});
		//“确定”创建
		$('.create-album').on('keyup', 'input', function (e) {
			if (e.keyCode !== 13) return;
			var $input = $(e.target);
			$.publish('create-album.save-new-album', { '$input': $input });
		});
		$('#pop-create-common .save').on('click', function (e) {
			e.preventDefault();
			$.publish('create-album.hide-pop');
			$.publish('create-album.save-new-album', { $input: $(e.target).siblings('input') });
		});
		$('#pop-create-common .cancel').on('click', function (e) {
			e.preventDefault();
			$.publish('create-album.hide-pop');
		});

		//输入网址 “随机一下”按钮
		$('.msg-form .where .random').on('click', function (e) {
			var hint_msg = '超强的随机自动推荐活动好去处功能暂未开放。敬请期待~';
			hint.setMessage(hint_msg).pop().setShowTime(1000 * 5).show();
			//$.publish('whereUrl.fetchRemote', { isRandom: true });
		});
		//输入网址“确定”按钮
		$('.msg-form .where .ok').on('click', function (e) {
			var url = $.trim($(e.target).siblings('input').val());
			if (url == '') return;
			$.publish('whereUrl.fetchRemote', { url: url });
		});

		//...-_-要放在这儿
		$.subscribe('keyup.planeContent', function (e) {
			//1. 验证内容，以及是否必填项
			//2. 存储内容
			//xq.log(e.content);
			Model.content.setData(e.content);
		});
		//内容 | 偶遇内容
		var textarea = $('.msg-form .content-section textarea').add('.meet-content-section textarea');
		textarea.on('keyup', function (e) {
			e.content = $.trim($(this).val())
			if (e.content === '') return;
			var another = textarea.not(e.target);
			if(another.val() != e.content){
				another.val(e.content).keyup();
			}
			$.publish('keyup.planeContent', e);
		});
		//页面后退的时候，会有默认值
		textarea.trigger('keyup');

		//发布到 线路相册
		$('.public-photo-sel-inner').add('.personal-photo-sel-inner').on('click', function (e) {
			if (isPersonalAlbum) {
				return;
			}
			if (_.isUndefined(Model.dataCollect.form.master_id) && _.isUndefined(Model.dataCollect.form.cross_id)) {
				e.preventDefault();
				//alert('请先选择发布到的线路');
				hint.setMessage('请先选择发布到的线路').pop().show();
				return;
			}
			var c = this.className;
			var pullDown = {
				'public-photo-sel-inner': 'public-photo-sel-pull-down',
				'personal-photo-sel-inner': 'personal-photo-sel-pull-down'
			}
			var selector = '.' + pullDown[c];
			var pulldown = $(this).siblings(selector);
			if (pulldown.is(':hidden')) {
				pulldown.show();


				//绑定站点的下拉菜单滚动条
				$.publish('check-and-bind-custom-scrollbar-in-first-time', { '$scrollarea': pulldown.find('.scroll-area') });
			} else {
				pulldown.hide();
			}
		});
		//选择某个 相册
		$('.public-photo-sel-pull-down').add('.personal-photo-sel-pull-down').on('click', 'li', function (e) {
			var data = $(this).data('action');
			//视图
			var pulldown = $(this).parents('[class*=-photo-sel-pull-down]');
			pulldown.siblings().find('span').text(data.album_name + ' (' + data.photo_num + 'P)');
			pulldown.hide();
			//数据模型
			Model.album.setData(data);
		});
		//线路相册搜索
		$('.public-photo .search-filter input').on('keyup', function (e) {
			var search = $.trim($(e.target).val());
			var container = $('#album-search-result');

			if (search == '') {
				container.hide();
				return;
			}

			//↑↓上下移动选中结果项
			if (e.keyCode == 38 || e.keyCode == 40) {
				e.preventDefault();
				var current = container.children('.active:visible');
				//只计算显示的选项，“创建xx”如果不显示则不计算在内
				var usable = container.children(':eq(0)').is(':visible') ? container.children() : container.children(':gt(0)');
				var index = usable.index(current);
				var next = e.keyCode == 38 ? index - 1 : index + 1;
				if (next < 0) {
					next = usable.length - 1;
				} else if (next >= usable.length) {
					next = 0;
				}
				current.removeClass('active');
				usable.eq(next).addClass('active');

				return;
			} else if (e.keyCode == 13) { //回车
				container.children('.active:visible').get(0).click();

				return;
			}

			//键入字母搜索
			//1. 数据
			var result_limit = 7;
			var master_id = Model.dataCollect.form.master_id;
			var albums = xq.data.get('album_cache')[master_id]['album'];
			var results = [];
			var finded = false;
			$.each(albums, function (i, album) {
				if (!finded) {
					if (album.name == search) {
						finded = true;
						results.unshift(album);
						if (results.length > result_limit) results.pop();
					}
				}
				if (results.length < result_limit) {
					//如果 ==，则在上面已经加过一次了
					if (album.name.indexOf(search) != -1 && album.name != search) results.push(album);
				} else {
					if (finded) return false;
				}
			});

			//2. 视图
			var __tmpl = '<div class="s-item" data-id="{2}">{0} ({1}P)</div>';
			container.show().children(':gt(0)').remove();

			if (finded) {
				container.children(':eq(0)').hide();
			} else {
				container.children(':eq(0)').addClass('active').show().find('b').text(search);
				//显示提示框的时候，只能再显示6个结果
				results.pop();
			}
			_.each(results, function (album, i) {
				var item = $(xq.f(__tmpl, album.name.replace(search, function (match) {
					return '<b>' + match + '</b>';
				}), album.count, album.id));
				//第一个被选中
				if (finded && i == 0) item.addClass('active');
				container.append(item);
			});
		});

		$('#album-search-result').on('click', 'div', function (e) {
			var $tar = $(e.currentTarget);
			//$tar.text().replace(/\s\(\d+P\)$/, function (c) { return ''; });
			//去掉最后的 (52P)
			var album_name = $tar.find('b').text();
			if ($tar.hasClass('create-tip')) {
				//创建相册
				$('#album-search-result').add('.public-photo-sel-pull-down').hide();
				$.publish('create-album.save-new-album', { 'album_name': album_name, 'type': 'public' });
			} else {
				//选择相册
				var id = $tar.data('id');
				$(xq.f('.public-photo-sel-pull-down li[data-id={0}]', id)).get(0).click();
			}
		});
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		//征人第一步
		$.subscribe('postnews-hangout-step1', function (e) {
			//如果填写了“楼主很懒”的空信息提示，则清除了
			postForm.find('.goods-intro').children('.empty').length > 0 && $('.msg-form .goods-intro').empty();

			postForm.find('.btn-line').find('.btn-prev').hide().siblings('.btn-post').hide().siblings('.btn-skip').show().siblings('.btn-next').show();


			//var bars = Model.postNews['hangout'].step1;
			var bars = Model.getHangoutStep1Tab(step1Tab);

			View.update('hangout', bars);
		});
		//征人第二步
		$.subscribe('postnews-hangout-step2', function (e) {
			postForm.find('.where').hide();

			postForm.find('.btn-line').find('.btn-skip').hide().siblings('.btn-next').hide().siblings('.btn-prev').show().siblings('.btn-post').show();

			//活动信息
			var goods = $('.msg-form .goods-intro');
			if ($.trim(goods.text()) == '') {
				var __tmpl_no_goods = '<div class="empty">楼主很懒，没有填写相关网址 :(</div>'
				goods.html(__tmpl_no_goods);
			}

			View.update('hangout', Model.postNews['hangout'].step2);
		});

		//偶遇，选择时间
		$('.msg-form .meet-time h3').on('click', function (e) {
			var pullDown = $(this).siblings('.pull-down');
			if (pullDown.is(':hidden')) {
				pullDown.show();
			} else {
				pullDown.hide();
			}
		});
		//偶遇，选择时间--年份 | 月份 | 日期
		$('.msg-form .meet-time').on('click', 'li', function (e) {
			if ($(e.target).parents('.year').length !== 0) {
				//选择年份
				$.publish('meettime-year-selected', e);
			} else if ($(e.target).parents('.month').length !== 0) {
				//月
				e.$dayEl = $(e.target).parents('.month').siblings('.day');
				$.publish('meettime-month-selected', e);
			} else {
				//日
				$.publish('meettime-day-selected', e);
			}
		});
		//偶遇，选择性别
		$('.msg-form .sex-section b').on('click', function (e) {
			//视图
			$(this).addClass('hovered').siblings().removeClass('hovered');
			//数据模型
			Model.sex.setData($(this).data('sex'));
		});

		//偶遇，特征选择
		$('.msg-form .feature-section').on('click', 'li:not(.input)', function (e) {
			//视图
			$(this).toggleClass('clicked');
			var val = $.trim($(e.target).text());
			//
			var action = $(this).hasClass('clicked') ? 'add' : 'delete';
			$.publish('meeting.feature-select', { feature: val, action: action });
		});
		//偶遇，添加特征
		$('.msg-form .feature-section li input').on('keyup', function (e) {
			if (e.keyCode !== 13) return;
			val = $.trim($(this).val());
			if (val === '') return;
			//视图
			var li = $('<li class="clicked"></li>').text(val);
			$(this).parent().before(li).end().val('').siblings('label').show();
			//
			$.publish('meeting.feature-select', { feature: val, action: 'add' });
		});
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//============================================================================================图片相关
		//绑定添加图片的事件
		//xq.fileUpload($('.msg-form .add-btn input[type=file]'), xq.config.get('post-pic-server'));

		
		var uploadImgBtn = postForm.find('.btn-area li.add-btn');
		if (uploadImgBtn.length != 0) {
			var thread_upload = new xq.Image.Upload({
				node: uploadImgBtn,
				action: xq.config.get('post-pic-server'),
				//action: '/dev/resources/php/post_pic.php',
				inputName: 'picture',
				isJSONP: false,
				//临时的
				iframeSrc: '/tmp_peichao/proxy.html',
				valideFn: function (e, suit) {
					var val = $.trim(suit.input.val());
					if (!xq.utils.isImg(val)) {
						var warn_msg = '请上传正确格式的图片';
						hint.setMessage(warn_msg).pop().show();
						return false;
					}
				}
			});
			thread_upload.on('node.mouseenter', function (e, upload) {
				//upload.calcNode();
			});
			thread_upload.on('upload.start', function (e, suit, upload) {
				var $holder = View.picture.addPlaceholder();
				$holder.addClass(suit.id);

				Model.picture.uploading++;
				var num = Model.picture.getNum();

				//num是在 success 事件后才会变化
				if (num + Model.picture.uploading <= config.defaultPhotoLimitNum - 1) {
					$('.msg-form .btn-area li.add-btn').show();
				} else {
					$('.msg-form .btn-area li.add-btn').hide();
				}
			});
			thread_upload.on('upload.success', function (content, suit, upload) {

				Model.picture.uploading--;
				//上传中，占位li元素
				$(xq.format('.{0}', suit.id)).remove();
				var json = xq.parseJSON(content);
				View.picture.addPic(json);
				Model.picture.addPic(json);
				//更新视图，
			});
		}
		//删除已添加的图片
		$('.msg-form .btn-area').on('click', 'li .close-type-1', function (e) {
			var li = $(this).parents('li');
			var id = li.data('photoid');
			//数据
			Model.picture.delPic({ upload_id: id });

			//视图
			li.remove();
			if (Model.picture.getNum() < config.defaultPhotoLimitNum) {
				$('.msg-form .btn-area li.add-btn').show();
			}
		});
		//添加 图片 描述
		$('.msg-form .btn-area').on('keyup', 'textarea', function (e) {
			var val = $(this).val();
			var id = $(this).parents('li').data('photoid');
			var len = val.length;
			var limit = config.picDescriptionLimit;
			if (!(len <= limit)) {
				//数据
				val = val.substr(0, limit);
				len = val.length;
				//视图
				$(this).val(val);
			}
			//剩余字数更新
			$(e.target).siblings('.number').text(limit - len);
			//
			Model.picture.addDescription({ upload_id: id, description: val });
		});

		///////////////////////////////////////////分享 ---- 后台还没好，先隐藏
		$('.msg-form .btn-line .share-sns').on('click', 'a', function (e) {
			return;

			var sns = $(this);
			//匹配：javascript: void(0) -- 中间可以有任意个空格
			var jsvoidReg = /^\s*javascript\s*:\s*void\s*\(\s*0\s*\)/g;
			var sharpReg = /^\s*#\s*/g;
			var href = sns.attr('href');
			if (!href.match(jsvoidReg) && !href.match(sharpReg)) return;


			if (sns.hasClass('active')) {
				sns.removeClass('active').siblings('input').val(0);
			} else {
				sns.addClass('active').siblings('input').val(1);
			}
		});
		///////////////////////////////////////////分享 ---- 直接挂到 DOM 的 onclick
		//xq.fn.add('shareSns', function (self, url) {
		//	//a 标签
		//	var sns = $(self);

		//	if (!xq.isLoginUser()) {
		//		sns
		//	}

		//	if (sns.hasClass('active')) {
		//		sns.removeClass('active').siblings('input').val(0);
		//	} else {
		//		sns.addClass('active').siblings('input').val(1);
		//	}
		//});

		//////////////////////////////////////////////////////////////////////////事件处理区

		// 订阅 -- 选择想要发布的新鲜事类型
		$.subscribe('postnews-module-sel-type', function (e) {
			var formEl = e.formEl;
			formEl.find('.msg-form').show();
			var type = e.type;
			//如果是征人，先隐藏发布按钮，显示“下一步”按钮
			if (type == 'hangout') {
				formEl.find('.btn-next').show();
				formEl.find('.btn-skip').show();
				formEl.find('.btn-post').hide();
				formEl.find('.btn-prev').hide();
			} else {
				formEl.find('.btn-next').hide();
				formEl.find('.btn-skip').hide();
				formEl.find('.btn-post').show();
			}
			//如果是发布图片，先隐藏“发布”按钮栏，等选择具体是 “个人”还是“线路”后再显示出来
			type == 'album' ? formEl.find('.btn-line').hide() : formEl.find('.btn-line').show();
			//如果是“偶遇”，则显示是否要匿名发布
			type == 'encounter' ? formEl.find('.btn-line .anonymous').show() : formEl.find('.btn-line .anonymous').hide();

			Model.setModuleType(type);
			//因为征人的 Model.postNews['hangout'] 结构比较特殊，就重新 showModel 一次
			//View.update(type, (type == 'hangout' ? Model.postNews['hangout'].step1 : undefined));
			View.update(type, (type == 'hangout' ? Model.getHangoutStep1Tab(step1Tab) : undefined));

			if (type === 'encounter') {
				var mysex = $('.sex-section').data('mysex');
				formEl.find('.sex-section b[data-sex!=' + mysex + ']').trigger('click');

				var year = $('.meet-time .year').data('year');
				formEl.find('.meet-time .year .pull-down li[data-year=' + year + ']').trigger('click');

				var month = $('.meet-time .month').data('month') || (new Date().getMonth() + 1);
				formEl.find('.meet-time .month .pull-down li[data-month=' + month + ']').trigger('click');
			}

			//如果锁定了线路选择，就自动帮他选择好某条线路 --- 比如：在线路页面发布就不能再选择其他的线路
			//如果已经设置过，则不用再次设置
			if (formEl.find('.line-sel').hasClass('lock')) {
				//跨城线路
				if (xq.data.get('cross_id')) {
					xq.fn.exec('cross-select-update-setdata', xq.data.get(['cross_id', 'cross_name']));
				}
					//城内线路
				else if (!Model.dataCollect.form.master_id) {
					xq.fn.exec('line-select-update-setdata', xq.data.get(['master_id', 'master_name']));
				}
			}
		});
		// 订阅 -- 相关网址 请求后台
		$.subscribe('whereUrl.fetchRemote', function (e) {
			//xq.log(e.url);
			$.publish('whereUrl.fetchRemote-start');

			$.getJSON(xq.config.get('getGoodsInfoByUrl'), {
				is_random: e.isRandom ? 1 : 0,
				master_id: Model.dataCollect.form.master_id,
				station_id: Model.dataCollect.form.station_id,
				url: e.url
			}, function (json) {
				json.isRandom = e.isRandom;

				$.publish('whereUrl.fetchRemote-success', json);
			});
		});
		// 订阅 -- 相关网址 请求后台 -- 开始
		$.subscribe('whereUrl.fetchRemote-start', function () {
			$('.msg-form .where .error').hide();
			$('.msg-form .where .capturing').show();
			$('.msg-form .goods-intro').addClass('loading');
		});
		// 订阅 -- 相关网址 请求后台 -- 成功返回数据
		$.subscribe('whereUrl.fetchRemote-success', function (json) {
			//视图
			$('.msg-form .where .capturing').hide();
			$('.msg-form .goods-intro').removeClass('loading').empty();

			//未找到网址
			if (json.error != 200) {
				$('.msg-form .where .error').show();
				return;
			}

			var html = $(_.template(xq.getTmpl('goods-intro-tmpl'), { intro: json }));

			$('.msg-form .goods-intro').append(html);
			if (json.isRandom) {
				//如果是随机的，则把 input 栏内容也替换了
				$('.msg-form .where .input-link input').val(json.link_url).trigger('keyup');
			}
			//数据模型
			Model.whereUrl.setData(json.link_url);
		});

		///////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////
		$.subscribe('load-stations-by-master', function (data) {
			var lines = xq.Data.Line.getLines(data.master_id, function (lines) {
				$.publish('fetchRemote.stations.succeed', { formEl: data.formEl, lines: lines });

				//因为下拉的内容有变化，故需重新计算滚动条的高度
				$.publish('calculate-scrollbar-height', { '$scrollarea': $('.station-sel .scroll-area') });
			});
			//TODO: 之后看看是否有必要留着 "fetchRemote.stations.start" 事件//data:{ master_id, formEl, isPostForm }
			if (!lines) $.publish('fetchRemote.stations.start', data);
		});

		$.subscribe('load-albums-by-master', function (data) {
			if (Model.dataCollect.type !== 'album') return;

			var album_cache = xq.data.get('album_cache');

			if (album_cache[data.master_id]) {
				$.publish('fetchRemote.line-album-success', { 'data': album_cache[data.master_id] });
				return;
			}

			$.publish('fetchRemote.line-album-start');
			$.getJSON(xq.config.get('load-line-album-list'), {
				'master_id': data.master_id,
				'cross_id': data.cross_id
			}, function (json) {
				album_cache[data.master_id] = json;

				$.publish('fetchRemote.line-album-success', { 'data': json });

				//因为下拉的内容有变化，故需重新计算滚动条的高度
				$.publish('calculate-scrollbar-height', { '$scrollarea': $('.public-photo-sel .scroll-area') });
			});
		});


		//若 type=="album"（公共线路）选择线路后，更新相册列表
		$.subscribe('fetchRemote.line-album-start', function (e) {
			//临时方案
			var __tmpl = '<li class="first">线路相册列表加载中...</li>';
			$('.public-photo-sel ul').empty().append(__tmpl);
			xq.log('start');
		})
		$.subscribe('fetchRemote.line-album-success', function (e) {
			var __tmpl = '<li data-id="<%= album_id %>" data-action="{&quot;album_id&quot;:<%= album_id %>,&quot;album_name&quot;:&quot;<%= album_name %>&quot;,&quot;photo_num&quot;:<%= album_count %>}" class="<% print(is_first?"first":"") %>"><%= album_name %> (<%= album_count %>P)</li>';
			var listr = '';
			var i = 0;
			_.each(e.data.album, function (album) {
				//type_code 的 惟一值："offical"，如果是个人相册，直接就没有这个字段
				if (album.count == 0 && !album.type_code) return;
				listr += _.template(__tmpl, {
					'album_id': album.id,
					'album_name': album.name,
					'album_count': album.count,
					'is_first': i++ === 0
				});
			});
			$('.public-photo-sel ul').empty().append(listr);
			//xq.log(listr);
		})
		///////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////
		//创建相册弹出窗--确定要创建此名的新相册
		$.subscribe('create-album.save-new-album', function (e) {
			if (e.$input) { // 右面的弹出窗 创建
				var album_name = $.trim(e.$input.val());
				if (album_name === '') return;

				e.$input.val('');

				var $pop = $('#pop-create-common');
				var type = $pop.data('new-album-type');
			} else if (e.album_name) { //线路搜索的地方，直接创建
				var album_name = e.album_name;
				var type = e.type;
			}


			//检查是否已存在于页面已加载了相册中
			var albums = xq.data.get(type + '_album');
			var album = _.filter(albums, function (album) { return album.album_name === album_name });

			//相册已存在
			if (album.length !== 0) {
				var li = _.find($('.' + type + '-photo-sel-pull-down li'), function (li) {
					return $(li).data('action')['album_name'] === album_name;
				});
				$(li).trigger('click');
				return;
			}

			$.publish('create-album.create', { album_name: album_name, type: type, event: e });
		});
		//创建相册弹出窗--隐藏
		$.subscribe('create-album.hide-pop', function (e) {
			$('#pop-create-common').hide();
		});
		//创建相册
		$.subscribe('create-album.create', function (e) {
			var name = e.album_name;
			$.publish('create-album-fetchRemote-start');
			$.post(xq.config.get('create-album'), {
				name: name,
				type: e.type,
				master_id: Model.dataCollect.form.master_id
			}, function (json) {
				json = xq.parseJSON(json);
				$.publish('create-album-fetchRemote-success', { 'type': e.type, 'json': json });
			});
		});
		//创建相册--开始请求服务器
		$.subscribe('create-album-fetchRemote-start', function (e) {
			var config = {
				'creating-text': '正在创建相册...'
			}
			$.publish('fetchRemote-success-pop-tips', { 'text': config['creating-text'], autoFadeout: false });
		});
		//创建相册--服务器返回成功
		$.subscribe('create-album-fetchRemote-success', function (e) {
			//视图
			var liEl = $(_.template(xq.getTmpl('album-tmpl'), { 'photo': e.json }));
			$('.msg-form .' + e.type + '-photo-sel-pull-down ul').append(liEl);
			liEl.trigger('click');

			$.publish('fetchRemote-success-pop-tips-hide');
			//缓存数据
			//只有公共线路才能创建相册
			if (e.type != 'public') return;
			//线路相册的所有操作都是在选中了某条线路的情况下进行的
			xq.data.get('album_cache')[Model.dataCollect.form.master_id]['album'][e.json.album_id] = {
				'count': e.json.photo_num,
				'id': e.json.album_id,
				'name': e.json.album_name
			}
		});
		///////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////
		//发布到：选择某条主线路，主线路加载开始
		$.subscribe('fetchRemote.stations.start', function (e) {
			//选择线路，站点需要重置
			//视图
			//1.站点 title 提示信息
			e.formEl.find('.station-sel-inner a').attr('title', '');
			//2.站点 文本的显示内容
			e.formEl.find('.station-sel-inner span').text(config.defaultStationTip);
			//3.隐藏下拉菜单，显示“加载中”提示信息
			e.formEl.find('.station-sel-pull-down .loading').show().siblings().hide();
			//数据（发布 thread 表单需要， 编辑 thread 有自己的维护）
			e.isPostForm && Model.stationSel.reset();
		})
		//发布到：选择某条主线路，主线路加载完毕
		$.subscribe('fetchRemote.stations.succeed', function (e) {
			var lines = e.lines;
			var formEl = e.formEl;
			//假设 json 的结构为：{ 11: { id: 11, name: "11站" }, 12: { id: 12, name: "12站" }, 13: { id: 13, name: "13站" } }
			//根据加载的数据，更改站点的列表
			//json = { 11: { station_id: 11, station_name: "11站" }, 12: { station_id: 12, station_name: "12站" }, 13: { station_id: 13, station_name: "13站" } };
			var stations = {};
			//一条主线可能有多条支线，故，遍历所有支线，合并站点
			_.each(lines, function (line_obj, line_id) {
				_.extend(stations, line_obj.station);
			});

			var list = formEl.find('.station-sel-pull-down ul').empty();
			var index = 0;
			$.each(stations, function (key, station) {
				var liHtml = _.template(xq.getTmpl('post-station-tmpl'), { "station": station, index: index++ });
				list.append($(liHtml));
			});

			//3.显示下拉菜单，隐藏“加载中”提示信息
			formEl.find('.station-sel-pull-down .loading').hide().siblings().show();
		});
		// 设置标题
		$.subscribe('set-title', function (title) {
			Model.title.setData(title);
		});
		// 选择标签 -- toggle 按钮（点击 显示/隐藏）
		$.subscribe('label-sel.toggle-visible', function (e) {
			var list = e.pulldownList;
			//xq.log(ul.is(':hidden'));
			if (list.is(':hidden')) {
				list.show();

				//绑定下拉列表自定义滚动条
				$.publish('check-and-bind-custom-scrollbar-in-first-time', { '$scrollarea': e.pulldownList.children('.scroll-area') });
			} else {
				list.hide();
			}
		});
		(function () {
			// 选择标签 -- 选中了某标签
			$.subscribe('label-sel.label-clicked', function (e) {
				var target = $(e.target);
				var label = target.attr('title');
				selLable(target, label);
			});
			$.subscribe('label-sel.add-label', function (e) {
				var target = $(e.target);
				var label = e.label;
				//xq.log(label);
				selLable(target, label);
			});
			function selLable(target, label) {
				View.labelSel.update(label);
				Model.labelSel.setData(label);

				$.publish('label-sel.toggle-visible', { 'pulldownList': target.parents('.label-sel-pull-down') });
			}
		})();
		//偶遇，选择年份
		$.subscribe('meettime-year-selected', function (e) {
			var target = $(e.target);
			target.parents('.pull-down').hide();
			var year = target.data('year');
			//视图
			target.parents('.year').find('span').text(year + '年');
			//数据模型
			Model.date.setData({ year: year });

			//更新日
			$.publish('meettime-update-day');
		});
		//偶遇，选择月份
		$.subscribe('meettime-month-selected', function (e) {
			var target = $(e.target);
			$(e.target).parents('.pull-down').hide();
			var month = target.data('month');
			//视图
			target.parents('.month').find('span').text(month + '月');
			e.$dayEl.show();
			//数据模型
			Model.date.setData({ month: month });

			//更新日
			$.publish('meettime-update-day');
		});
		//更新日期
		$.subscribe('meettime-update-day', function () {
			var year = Model.date.getYear();
			var month = Model.date.getMonth();
			if (!year || !month) return;

			var days = new Date(year, month, 0).getDate();
			//var tmpl = $('#generate-date-day').text();
			var tmpl = xq.getTmpl('generate-date-day');
			var liEls = _.template(tmpl, { days: days });

			$('.msg-form .meet-time .day ul').html(liEls);
		});
		//偶遇，选择日
		$.subscribe('meettime-day-selected', function (e) {
			var target = $(e.target);
			$(e.target).parents('.pull-down').hide();
			var day = target.data('day');

			//视图
			target.parents('.day').find('span').text(day + '日');
			//数据模型
			Model.date.setData({ day: day });
		});
		//添加标签
		$.subscribe('meeting.feature-select', function (e) {
			Model.feature.setData(e);
		});

		////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////确认发布
		////////////////////////////////////////////////////////////////////////////////////
		// 订阅 -- 确定发布
		$.subscribe('postnews-module-publish', function (e) {
			var $form = e.$form;//$('#post-news-form');
			var un_need_now = $form.find('input[class!=non-remove]');
			un_need_now.attr('name', '');
			var data = Model.dataCollect;
			//如果是个人相册，则相册 id = 0
			//isPersonalAlbum && (data.type == 'picture') && (data.form.album_id = 0);
			//如果是个人相册，则 type 为 "personal_album"
			//isPersonalAlbum && (data.type == 'picture') && (data.type = 'personal_album');
			isPersonalAlbum && (data.type == 'album') && (data.form.personal = 1);


			//偶遇日期的默认值
			!data.form.month && (data.form.month = 0);
			!data.form.day && (data.form.day = 0);

			appendInput('type', data.type);
			_.each(data.form, function (value, name) {
				value = ($.isArray(value) || $.isPlainObject(value)) ? JSON.stringify(value) : value;
				appendInput(name, value);
			});
			//$('#post-news-form').submit();
			$form.submit();
			//=====================================目前直接提交表单
			return;

			function appendInput(name, value) {
				//新鲜事类型的字段名都换掉
				var replace_val = {
					'type': {
						//'need-person': 'hangout',
						'hangout': 'hangout',
						'topic': 'topic',
						//'picture': 'album',
						'album': 'album',
						//'personal_album': 'personal_album',
						//'personal_album': 'album',
						//'meeting': 'encounter',
						'encounter': 'encounter',
						'bussiness': 'trade'
					}
				};
				var replace_name = {
					'relativeUrl': 'relative_url'
				}
				//value = (name !== 'type') ? value : replace[value];
				value = replace_val[name] ? replace_val[name][value] : value;
				name = replace_name[name] ? replace_name[name] : name;

				var __tmpl = '<input type="hidden" name="{0}" value="" />';
				var $input = $(xq.f(__tmpl, name)).val(value);
				$form.append($input);
			}

			$.post(xq.config.get('postNewsServer'), { data: JSON.stringify(Model.dataCollect) }, function (d) { });

			$.publish('postnews-module-hide');

			$.publish('update-news-part', Model.dataCollect);
		});
		// 订阅 -- 取消发布
		$.subscribe('postnews-module-hide', function (e) {
			//这个只有 home 也有--那个页面需要的显示形式比较特殊
			$('.msg-panel .post-tooth').show();
			View.hide();
		});

		//发布消息之后，立即在页面显示出来 --- 暂时直接提交表单，刷新页面
		$.subscribe('update-news-part', function (e) {
			//var $el =
			//xq.log(e);
		});
	});
})(jQuery, _, xq, window, document);