(function ($, exports) {

	var pageGlobal = {};
	xq.data.set('dict-city-master', {}); //字典类型的 => 城市：所有主线  集合
	

	//----------------------------此文件 里面提供的全局变量和函数
	//exports.seachLineSuggest
	//exports.scrollbar --- 自定义滚动条
	//exports.masters  --- 主线路的json

	exports.userLinesPoll = {};

	var config = {
		//提示框显示的时间，之后隐藏
		tipShowTime: 1000
	}

	function fadeIn(elem) {
		if ($.browser.msie && parseInt($.browser.version) < 7) {
			$(elem).show();
		} else {
			$(elem).stop().css({ 'display': 'block', 'opacity': 0 }).animate({ 'opacity': 1 }, 200);
		}
	}
	function fadeOut(elem) {
		if ($.browser.msie && parseInt($.browser.version) < 7) {
			$(elem).hide();
		} else {
			$(elem).stop().animate({ 'opacity': 0 }, 100, function () { $(this).css('display', 'none') });
		}
	}


	$(function () {

		///////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////
		///////////////////
		//后台表情的字符替换还没做，目前用前端替换，之后把这一段删除即可
		(function () {
			_.each($('.reply-content').add('.reply-cnt').add('.blockquote .big'), function (dom, i) {
				var node = $(dom);
				node.html(xq.Emotion.filtString(node.text()).replace(/<([^(img)])/g, '&lt;$1'));
			})
		})();


		//2. 回复 表情
		$('.feed-replies .reply-box-inner .face-btn').toggle(function (e) {
			var $this = $(this);
			var $faceNode = $this.parent().siblings('.reply-faces');

			initEmotionNode($faceNode.find('ul'), $this.siblings().find('input'));

			$this.find('i').addClass('active')
			$faceNode.show();
		}, function (e) {
			$(this).find('i').removeClass('active').end().parent().siblings('.reply-faces').hide();
		});

		//node 是 $('xx ul')
		function initEmotionNode(node, input) {
			if (node.find('li').length) return;

			if (!xq.Emotion.hasData()) {
				xq.Emotion.fetch(fillNode);
			} else {
				fillNode(xq.Emotion.getData());
			}

			function fillNode(emotions) {
				node.html(xq.Emotion.getAllHtml());
				node.on('click', 'li', function (e) {
					//console.log(input.val());
					var id = $(e.currentTarget).find('img').data('id');
					xq.utils.insertValue(input[0], xq.Emotion.getById(id) + '');
					input.keydown();
					input.focus();
				});
			}
		}

		xq.onDocClick(function (e) {
			var replyBox = $('.reply-box-wrap');
			var find = $(e.target).parents('.reply-box-wrap');
			if (find.length == 0) {
				var faceBtn = replyBox.find('.face-btn');
				_.each(faceBtn, function (node, index) {
					if ($(node).find('i').hasClass('active')) {
						node.click();
					}
				});
			}
		});
		///////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////

		//先把当前页面的 city_id　放到一个“全局”变量里面 -- 当点击切换城市（且不跳转页面的话，会更改此变量）
		xq.data.set('page-city-id', $('.header .city .now-city').data('cityid'));


		//-10. 当fetchRemote，后台返回成功后的提示消息
		(function () {
			var config = {
				fadeTimeout: 1000 * 2.5
			};
			var $popBox = $('.alert-success');

			$.subscribe('fetchRemote-success-pop-tips', function (e) {
				$popBox.children('p').text(e.text);
				xq.utils.pop($popBox);
				$popBox.show();

				e.autoFadeout === undefined ? e.autoFadeout = true : null;
				e.autoFadeout ? setTimeout("$('.alert-success').fadeOut()", config.fadeTimeout) : null;
			});

			$.subscribe('fetchRemote-success-pop-tips-hide', function (e) {
				$popBox.fadeOut();
			});

			$popBox.children('.close-btn').on('click', function (e) {
				$popBox.hide();
			});
		})();

		//-9. 自定义 title 提示
		$('.custom-title').hover(function (e) {
			var title = $(e.currentTarget).data('title')

		}, function (e) {});

		//-8. ======================================================= 翻页 --- 废掉
		$.subscribe('bind-page-number-evenet', function () {
			$('.page-number').on('click', 'a', function (e) {
				//使用默认 a 标签的跳转
				if ($(e.target).hasClass('normal-link')) return;

				e.preventDefault();

				$.publish('page-number-fetch-remote-start');
				$.get($(e.target).attr('href'), function (data) {
					$.publish('page-number-fetch-remote-success', { 'data': data });
				});
			});
		});
		//$.publish('bind-page-number-evenet');


		//-7. ======================================================== feed 列表页的 “特征”部分，hover 展开全部特征
		$('.xiehou .feature').hover(function () {
			var ul = $(this).find('.mdl ul');
			if (ul.hasClass('min-height')) {
				//如果没有 min-height，说明不需要这个效果
				ul.data('can-hover', true);
			}
			ul.removeClass('min-height');
			$(this).find('.arrow b').addClass('hover');
		}, function () {
			var ul = $(this).find('.mdl ul');
			if (!ul.data('can-hover')) return;

			ul.addClass('min-height');
			$(this).find('.arrow b').removeClass('hover');
		});


		//////////0. 注册全局事件
		$(document).on('keyup', function (e) {
			xq.events.fire(Events.document.Keyup, e);
		});
		$(document).on('click', function (e) {
			xq.events.fire(Events.document.Click, e);
		});

		//0.1 ajax成功之后，比如，评论成功，发布成功，等等，“回复成功”提示弹出窗
		$('#tips-info .close').on('click', function (e) {
			$('#tips-info').hide();
		});
		$.subscribe('global-remote-success', function (e) {
			$el = $('#tips-info');
			$el.show().children('.tip-text').text(e.content);
			//1 秒钟后消失
			setTimeout(function () {
				$el.animate({ 'opacity': 0 }, function () {
					$el.hide().css('opacity', 1);
				});
			}, config.tipShowTime);
		});

		//0.2 关注/取消关注 某人
		$.subscribe('goto-about-follow', function (e) {
			$.publish('follow-the-user-start');
			xq.post(e.url, {
				action: "friend",
				op: e.operate,
				user_id: e.user_id
			}, function (e) {
				$.publish('follow-the-user-success');
			});
		});


		//0.5 把所有 <a href="#" ></a> 连接为 # 的 a 标签全部屏蔽跳转
		$('a[href=#]').on('click', function (e) {
			e.preventDefault();
		});



		//1. 导航 -- 城市选择 -- 下拉
		(function ($) {
			//注册人数最多的城市的数量
			var maxCityCount;
			var powerKey = 'popularity';
			var cities;
			var swtichCityBox = $('#browse-city');
			//mouse out
			var out_num = 0;
			//一共12个级别(因为12像素高），每个级别的能量则为
			var maxLevel = 12;
			//var eachCityLevel = 1 / maxLevel;

			var powerMap = {
				0: [0, 0],
				1: [0, 0],
				2: [1, 2],
				3: [3, 4],
				4: [5, 10],
				5: [11, 20],
				6: [21, 30],
				7: [31, 40],
				8: [41, 52],
				9: [53, 64],
				10: [65, 76],
				11: [77, 89],
				12: [90, 100]
			};
			
			var t_hot = swtichCityBox.find('.hot');
			var t_province = swtichCityBox.find('.province');
			var t_city = swtichCityBox.find('.p-city');

			//切换正在浏览的城市 ------- 虽然跟城市选择有公用的部分...但，真的很糟心，而且这个更精简一些
			//#pub-city-change 公共首页 独有
			//#lines-wrap .search-input b 注册第二步独有
			var headerCity = $('.head-container .now-city');
			headerCity.data('css', {
				top: 36,
				left: 1
			})
			var reg2City = $('#lines-wrap .search-input b');
			reg2City.data('css', {
				top: 50,
				left: 2
			});
			var pubCity = $('#pub-city-change a');
			pubCity.data('css', {
				top: 34,
				left: 0
			});

			var cityselButtons = headerCity.add(reg2City).add(pubCity);
			cityselButtons.hover(function (e) { 
				out_num++;
				cities = xq.Data.City.getData();
				var self = $(this);
				var city_id = self.data('cityid');
				if (!cities) {
					$.getJSON(xq.Data.City.getLoadUrl(), function (json) {
						cities = xq.fn.exec('addCountToCity', json.city);
						//xq.fn.exec('setMaxCityCount', cities);
						xq.fn.exec('swtichCityMouseoverHandler', cities, city_id, self);
					});
				} else {
					xq.fn.exec('setMaxCityCount', cities);
					xq.fn.exec('swtichCityMouseoverHandler', cities, city_id, self);
				}
			}, function (e) {
				xq.fn.exec('swtichCityMouseoutHandler');
			});
			//这两个一块来计算 mouse out
			swtichCityBox.hover(function (e) {
				out_num++;
			}, function (e) {
				xq.fn.exec('swtichCityMouseoutHandler');
			});


			//目前没有这个数据，先模拟一下 --- 有了真实的就删了这个
			xq.fn.add('addCountToCity', function (cities) {
				//_(cities).each(function (city) {
				//	city['count'] = Math.floor(Math.random() * 10000) + 1000;
				//});
				return cities;
			});

			//------暂时不需要能量条了
			xq.fn.add('setMaxCityCount', function (cities) {
				var max = _(cities).max(function (city) { return city[powerKey] });
				maxCityCount = max[powerKey];
			});

			//点击左上角的城市选择--浏览不同的城市
			xq.fn.add('swtichCityMouseoverHandler', function (cities, city_id, pop_insertAfter) {
				//第一次
				if (t_hot.children('li').length == 0) {
					showHot(t_hot);
					showProvince(t_province);
				}
				t_city.hide();
				swtichCityBox.insertAfter(pop_insertAfter).show().css(pop_insertAfter.data('css'));


				t_hot.find('li').removeClass('active');
				t_province.find('li').removeClass('active');

				//如果没有选中城市，则不会有默认激活的城市
				if(!city_id){
					return;
				}

				//选中热门城市
				t_hot.children('li').each(function (i,hot) {
					if ($(hot).data('cityid') == city_id) {
						$(hot).addClass('active');
						return false;
					}
				});
				//选中省份
				t_province.children('li').each(function (i, province) {
					if ($(province).data('provinceid') == cities[city_id]['parent_id']) {
						$(province).addClass('active').get(0).click();
						return false;
					}
				});

				//如果省份点击后，显示了所对应的省内城市，则，也选中对应的城市
				if (t_city.is('hidden')) return;
				t_city.children('li').each(function (i, city) {
					if ($(city).data('cityid') == city_id) {
						$(city).addClass('active');
						return false;
					}
				});

			});

			xq.fn.add('swtichCityMouseoutHandler', function () {
				out_num--;
				
				var delay = 10;
				setTimeout(function () {
					if (out_num > 0) return;
					swtichCityBox.hide();
				}, delay);
			});

			//点击省份，显示城市
			$('#browse-city .province').on('click', 'li', function (e) {
				var li = $(e.currentTarget).addClass('active');
				li.siblings().removeClass('active')

				showCity(li.data('provinceid'), t_city);
			});

			//xq.config.set('city_select_type', 'search')
			//城市选择---------目前不能用，直接屏蔽掉 ----------------- 等能用了直接删掉这段代码即可
			$('#browse-city .hot').add('#browse-city .p-city').on('click', 'li', function (e) {
				//e.preventDefault();
				//$('#browse-city').hide();
				var test_domain = location.href.split(".");
				var split_test_domain=test_domain.splice(0,1,"");
				var str_test_domain=test_domain.join(".");
				var isJump = xq.config.get('city_select_type') == 'jump'; //or 'search'
				//直接跳页 ----------------- 目前无论如何都不会跳页了，而是刷新本页（砍掉“探索”频道）
				//if (isJump) return;

				e.preventDefault();
				var city_id = $(e.currentTarget).data('cityid');
				//var url = location.href;
				//var qs = xq.queryString.parse(url);
				//qs['city_id'] = city_id;
				//location.href = xq.queryString.stringify(qs, url, true);
				xq.cookie.set('city_id', city_id, str_test_domain);
				//location.href = location.href;
				location.reload();


				//var city_id = xq.data.get('page-city-id');
				//var cityMaster = xq.data.get('dict-city-master');
				//if (!cityMaster[city_id]) {
				//	$.getJSON(xq.f(xq.config.get('get-city-master'), city_id), function (json) {

				//	});
				//} else {
				//}
			});




			//========$('.left-part h3.not-log a') --> 只有未登录的左侧栏有
			$('.left-part h3.not-log a').on('click', function (e) {
				$.publish('on-city-sel-click', { 'city_id': $(this).data('cityid') });
			});

			//当点击了某个城市之后 -- 事件在下面发出
			$.subscribe('the-city-was-selected', function (e) {
				//========$('.left-part h3.not-log a') --> 只有未登录的左侧栏有
				//顶部的城市不联动
				//$('.head-container .now-city')
				$('.left-part h3.not-log a').text(e.city_name).data('cityid', e.city_id);
				
			});

			$.subscribe('on-city-sel-click', function (e) {
				var citySel = $('#city-sel');
				xq.utils.pop(citySel);

				var cityid = $.trim(e.city_id);
				
				if (!cities) {
					$.getJSON(xq.Data.City.getLoadUrl(), function (json) {
						cities = xq.fn.exec('addCountToCity', json.city);
						xq.fn.exec('setMaxCityCount', cities);
						$.publish('citiesJsonBack', { 'cityid': cityid, 'isFirstTime': true, 'citySel': citySel });
					});
				} else {
					$.publish('citiesJsonBack', { 'cityid': cityid, 'isFirstTime': false, 'citySel': citySel });
				}

				$.publish('registerStep1.check-button-avaliable');
			});

			$.subscribe('citiesJsonBack', function (e) {
				var cityid = e.cityid;
				var citySel = e.citySel;
				if (e.isFirstTime) {
					showHot($('#city-sel .hot-city'));
					showProvince($('#city-sel .province'));
				}
				//有可能开始没有初始选择某个城市
				$('#city-sel .cities').hide();
				if (cityid != '') {
					var provinceid = cities[cityid]['parent_id'];
					var provinceEl = citySel.find('li[data-provinceid=' + provinceid + ']');
					
					//citySel.find('.cities').hide();
					//if (!e.isFirstTime) {
					$.publish('provinceClicked', { 'provinceEl': provinceEl });
					//}
					$.publish('hovercityhadselected', { 'cityid': cityid, 'provinceid': provinceid });
				} else {
					var hot = $('#city-sel .hot-city');
					var province = $('#city-sel .province');

					hot.children('li').removeClass('hovered');
					province.children('li').removeClass('hovered');
				}

				citySel.show();
			});

			//var __tmpl_city = '<li data-cityid="{0}"><a href="{2}">{1}</a><div class="city-power"><div class="{3}"></div></div></li>';
			var __tmpl_city = '<li data-cityid="{0}" class="clear-net {4}"><a href="{2}">{1}</a><span class="out"><span class="in" style="height:{3}px;"></span></span></li>';

			var cityUrlRule = xq.data.get('cityUrlTmpl');
			//var classRule = 'count<%= level %>';
			var __tmpl_province = '<li data-provinceid="{0}"><a href="javascript:void(0)">{1}</a></li>';
			function showHot(container) {
				var hots = getHotCity();
				container.empty();
				$.each(hots, function (index, city_id) {
					var cityName = cities[city_id]['name'];
					var cityUrl = _.template(cityUrlRule, { city_name: cityName });
					var power = getCityLevel(cities[city_id][powerKey], cities[city_id]['line_cout']);
					var emptyClass =  power == maxLevel ? 'empty' : '';

					container.append(xq.f(__tmpl_city, city_id, cityName, cityUrl, power, emptyClass));
				});
			}
			function showProvince(container) {
				var hots = getHotCity();
				var provinecs = [];
				container.empty();

				$.each(cities, function (id, city) {
					var province_id = city['parent_id'];
					//香港，先隐藏
					if (province_id == '810000') return;
					if (xq.inArray(id, hots, true) === -1 && xq.inArray(province_id, provinecs, true) === -1) {
						container.append(xq.f(__tmpl_province, province_id, city['name']));
						provinecs.push(province_id);
					}
				});

			}
			function showCity(province_id, container) {
				if (_.isUndefined(province_id)) return;

				container.show().empty();

				$.each(cities, function (id, cityObj) {
					if (cityObj['parent_id'] == province_id && cityObj['city_id'] != cityObj['parent_id']) {
						var cityUrl = _.template(cityUrlRule, { city_name: cityObj['name'] });
						var power = getCityLevel(cityObj[powerKey], cityObj['line_count']);
						var emptyClass = power == maxLevel ? 'empty' : '';

						container.append(xq.f(__tmpl_city, id, cityObj['name'], cityUrl, power, emptyClass));
					}
				});
			}
			//根据每个城市的注册人数，来判定它的级别
			function getCityLevel(count, lineCount) {
				var percent = Math.round(count / maxCityCount * 100);
				var level;
				$.each(powerMap, function (key, value) {
					if (percent >= value[0] && percent <= value[1]) {
						level = key;
						//xq.log(key +' in ' + JSON.stringify(value));
						return false;
					}
				});

				if (level == 0 && lineCount > 0) {
					level += 1;
				}

				//css需要，取反值（空槽高度）
				return maxLevel - level;
			}
			//获得直达城市，或叫做热门城市
			function getHotCity() {
				return xq.config.get('hotCity');
			}
			//==================================================== 具体的省份、城市选择
			$('#city-sel').on('click', 'li', function (e) {
				//$(this).addClass('hovered').siblings();
				var li = $(this), city_id = li.data('cityid');
				if (city_id) {
					//.直接命中具体的城市
					$.publish('cityClicked', { 'city_id': city_id });
				} else {
					$.publish('provinceClicked', { 'provinceEl': li });
				}
			});

			$.subscribe('cityClicked', function (e) {
				var city_id = e.city_id;
				var city_name = cities[city_id]['name'];
				$('#city-sel').hide();
				$('.form-data .city').find('span').text(city_name).data('cityid', city_id);
				$('.form-data .city').find('input').val(city_id);
				$.publish('the-city-was-selected', { 'city_id': city_id, 'city_name': city_name });
				try {
					validCity();
				} catch (e) { };
			});
			$.subscribe('provinceClicked', function (e) {
				var li = e.provinceEl;
				li.addClass('hovered').siblings().removeClass('hovered');
				//同时，加载省份对应的城市列表，并显示出来
				showCity(li.data('provinceid'), $('#city-sel .cities'));
			});

			$.subscribe('hovercityhadselected', function (e) {
				var cityid = e.cityid;
				var provinceid = e.provinceid;

				var citySel = $('#city-sel');

				if (cityid !== '') {
					citySel.find('li').removeClass('hovered');
					citySel.find('li[data-cityid=' + cityid + ']').addClass('hovered');
					citySel.find('li[data-provinceid=' + provinceid + ']').addClass('hovered');
				}
			})
			//========================================== 关闭城市选择
			$('#city-sel .top i').click(function (e) {
				$('#city-sel').hide();
			});
		})($);







		//2. 导航 -- 用户设置 -- 下拉
		$('.header .user').hover(function (e) {
			fadeIn($(this).find('.pull-down'));
		}, function (e) {
			fadeOut($(this).find('.pull-down'));
		});

		//3. 导航 -- 新消息条数 -- 下拉
		$('.header .news').hover(function (e) {
			fadeIn($(this).find('.pull-down'));
		}, function (e) {
			fadeOut($(this).find('.pull-down'));
		});

		//4. 导航 -- 搜索输入框
		$('.header .searchInput input').focusin(function (e) {
			$(this).parents('.searchInput').addClass('focus').end().siblings('label');
		});
		$('.header .searchInput input').focusout(function (e) {
			$(this).parents('.searchInput').removeClass('focus').end().siblings('label');
		});

		//5. 搜索框 键入内容时，实时提示

		//6. 如果没有新消息，则，小猫睡觉... --- 已经页面直接输出了，不需要js操作了
		//alert($.trim($('.header .news .nums span').text()));
		//if ($.trim($('.header .news .nums span').text()) == '') {
		//	sleepCat();
		//}
		//function sleepCat() {
		//	$('.header .news .nums').addClass('nonews');
		//}

		//7. 未登录时的登录模块
		$('.header .log-menu').hover(function (e) {
			$(this).children('p').addClass('hovered');
			$(this).children('.pull-down').show();
		}, function (e) {
			$(this).children('p').removeClass('hovered');
			$(this).children('.pull-down').hide();
		});


		////////////// 公共模块 ---- （搜索）输入框，用 <input value="xxx"> 的 value 来模仿 chrome 下的 placeholder；所有需要的 input 都需要添加类“chrome-placeholder”
		$.subscribe('chrome-placeholder-bind', function (e) {
			var $el = e.$el;
			$el.on('keyup', function (e) {
				//var val = $.trim($(e.target).val());
				var $tar = $(e.target);
				var tag = e.target.tagName.toLowerCase();
				var val = (tag === 'input' || tag === 'textarea') ? $tar.val() : $tar.text();
				if (val == '') {
					$tar.siblings('label').show();
				} else {
					$tar.siblings('label').hide();
				}
			});

			$el.on('change', function (e) {
				if ($(e.currentTarget).val() != '') {
					$(e.currentTarget).siblings('label').hide();
				}
			});

			$el.on('focusout', function (e) {
				if ($(e.currentTarget).val() == '') {
					$(e.currentTarget).siblings('label').show();
				}
			});

			$el.on('keydown', function (e) {
				$(e.target).siblings('label').hide();
			});
			
			$el.siblings('label').on('click',function (e) {
				$(this).siblings('.chrome-placeholder').focus();
			});
		});

		$.publish('chrome-placeholder-bind', { $el: $('.chrome-placeholder') });

		//// 所有的 <input /> 如果已经有内容了，则 label 需隐藏
		$('.chrome-placeholder').each(function (index, ele) {
			if ($.trim($(ele).val()) != '') {
				$(ele).siblings('label').hide();
			}
		});

		////////////// 公共模块 ---- 类似上面，但，是div元素：<div class="editable-tips" style="">添加回复</div>
		$.subscribe('editable-tips-bind', function (e) {
			var $el = e.$el;
			$el.on('click', function (e) {
				$(this).siblings('.editable').focus();
			});
			$el.siblings('.editable').on('keyup', function (e) {
				var val = $(this).text();
				if (val == '') {
					$(this).siblings('.editable-tips').show();
				} else {
					$(this).siblings('.editable-tips').hide();
				}
			});
		});


		////////////// 公共模块 ---- 自定义 滚动条
		//1. 初始化滚动条
		$('.scroll-area').each(function (index, El) {
			$.publish('bind-custom-v-scrollbar', { '$scrollarea': El });
		});
		//2. 初始化建议线路
		seachLineSuggest.init('.suggest-area');

	});


	


	//顶部搜索框 输入提示
	exports.masters;
	var seachLineSuggest = {
		info: {
			city_id: $('.nowCity').data('cityid'),
			han_pin: {},
			masters: {},
			ready: 0,
			nowListIndex: -1,
			allListNums: 0,
			selector: undefined,
			maxSuggestNum: 6, //线路搜索结果，最多提示几条
			maxCrossNum: 3,
			isPressing: false,
			holdTime: 1000, //按住键盘多久，算是按住了，开始滚动选择
			switchInterval: 30 //按住键盘，切换菜单的频率
		},
		init: function (selector) {
			var info = this.info;
			var that = this;
			info.selector = selector;
			//1. 请求汉字拼音对照表
			//$.getJSON(xq.config.get('pinyinJson'), function (json) {
			//	info.ready++;
			//	//TODO:
			//	info.han_pin = json;
			//	//以后用这个接口
			//	xq.Data.PinYin.setPinYinJSON(json);

			//	if (info.ready == 2) xq.Data.Master.initEveryMaster();
			//		//transToPin(that, info.han_pin);
			//});

			//2. ajax请求城市列表 ---- 此页面不挑选城市，或假定是上海，不用切换

			//3. 请求主线路
			var masterUrl = xq.f(xq.config.get('get-city-master'), xq.data.get('page-city-id'));
			xq.getJSON(masterUrl, function (json) {
				
				//info.ready++;
				//TODO: 接口要改，不用这个
				exports.masters = info.masters = xq.data.get('dict-city-master')[xq.data.get('page-city-id')] = json.master;
				//而用这个，默认设置为当前城市的主线路
				xq.Data.Master.setData(json.master);

				//if (info.ready == 2)
				xq.Data.Master.initEveryMaster();
					//transToPin(that, info.han_pin);

				xq.multiEvents.fire(Events.MasterLinesLoaded);
			});

			//5. 绑定键盘事件搜索匹配
			//var keydownId;
			$(selector).find('input').on('keyup', function (e) {
				//xq.log(e.keyCode);
				//↓ ↑
				if (e.keyCode == 40 || e.keyCode == 38) {
					e.keyCode == 40 ? menuDown() : menuUp();
					//clearInterval(keydownId);
				} else if (e.keyCode == 13) {
					//回车确认
					//that.confirmLine(that.info.nowListIndex);
					$(that.info.selector + ' .inner2 .active a').get(0).click();
				} else {
					var val = xq.filtInput($.trim($(this).val()));

					if (val !== '') {
						var currentCity = xq.Data.City.getCity();

						var matches = that.getMatchedMaster(val);
						var matchedCross = that.getMatchedCross(currentCity, val, 3);

						//xq.log(val, matches);
						info.allListNums = matches.length + matchedCross.length;
						info.nowListIndex = -1;
						
						if ($(that.info.selector).find('.pull-down').is(':hidden')) {
							that.showSuggest();
						}
						var html = that.genHtml(val, matches, selector);
						html += that.genCrossHtml(currentCity, val, matchedCross);

						$(selector).find('.inner2').html(html);
					} else {
						that.hideSuggest();
					}
				}
			});
			function menuDown() {
				if (++info.nowListIndex > info.allListNums - 1)
					info.nowListIndex = 0;
				that.activeList(info.nowListIndex, selector);
			}
			function menuUp() {
				if (--info.nowListIndex < 0)
					info.nowListIndex = info.allListNums - 1;
				that.activeList(info.nowListIndex, selector);
			}
			//6. 鼠标选择 下拉提示的选项 ---- 里面有 <a> 标签，直接跳转页面了
			//$(selector).find('.inner2').on('click', 'p', function (e) {
				//var index = $(this).index() - 1;
				//that.confirmLine(index);
			//});

			$('#top-search-bar').on('focus', function (e) {
				if ($.trim($(this).val()) != '')
					that.showSuggest();
			});

			//tab键切换焦点
			xq.events.on(Events.document.Keyup, function (e) {
				if (e.keyCode == 9) {
					if ($(that.info.selector).has(document.activeElement).length == 0) {
						that.hideSuggest();
					}
				}
			});
			//鼠标点击空白处，弹出框全部消失
			xq.onDocClick(function (e) {
				if ($(that.info.selector).has(e.target).length == 0) {
					that.hideSuggest();
				}
			});
		},
		//根据 输入的线路名 获取匹配的线路
		getMatchedMaster: function (lineName, max) {
			max = max || this.info.maxSuggestNum;
			var matched = [];
			var masters = this.info.masters;
			var subway = xq.Data.Master.getSubway();
			
			$.each(subway, function (i, subway) {
				var result = avaliable(subway);
				if (result == 'break') {
					return false;
				} else if (result) {
					matched.push(subway);
				}
			});

			$.each(masters, function (master_id, masterObj) {
				var result = avaliable(masterObj);
				if (result == 'break') {
					return false
				} else if (result) {
					matched.push(masterObj);
				}
			});

			return matched;

			function avaliable(master) {
				if (matched.length >= max) return 'break';
				if (_.isUndefined(master['match'])) return false;
				if ($.inArray(master, matched) != -1) return false;

				//var isMatch = false;
				//$.each(master['match'], function (i, value) {
				//	if (value.match(lineName)) {
				//		isMatch = true;
				//		return false;
				//	}
				//});
				//return isMatch ? true : false;

				//master['match'] 从数组转换成了字符串
				return master['match'].match(lineName);
			}
		},
		getMatchedCross: function (currentCity, lineName, max) {
			max = max || this.info.maxCrossNum;
			//直辖市
			var p_city = [110000, 120000, 310000, 500000];
			//推荐：北京，上海，深圳
			var recommand = [110000, 310000, 440300];

			var matched = [];

			var hotCity = xq.config.get('hotCity');
			$.each(hotCity, function (i, cityId) {
				var city = xq.Data.City.getCity(cityId);
				var result = avaliable(city);
				if (result == 'break') {
					return false;
				} else if (result) {
					matched.push(city);
				}
			});

			var allcity = xq.Data.City.getData();
			$.each(allcity, function (cityId, city) {
				var result = avaliable(city);
				if(result == 'break') {
					return false;
				} else if (result) {
					matched.push(city);
				}
			});

			if (matched.length == 0) {
				matched = xq.Data.City.getCity(_.without(recommand, currentCity.city_id));
			}

			return matched;

			function avaliable(city) {
				if (matched.length >= max) return 'break';
				if ($.inArray(city, matched) != -1) return false;
				if (city.city_id == currentCity.city_id) return false;
				if (city.city_id == city.parent_id && $.inArray(parseInt(city.city_id), p_city) == -1) return false;

				if (city.name.match(lineName) || city.pinyin.match(lineName) || city.acronym.match(lineName)) return true;
			}
		},
		//生成 HTML list
		genHtml: function (input, masters, selector) {
			var html = [], that = this;

			//1. 处理 .title
			var __tmpl_h3 = '<h3 class="title">进入包含 "<b><%= lineName %></b>" 的线路</h3>';
			html.push(_.template(__tmpl_h3, { lineName: input }));

			if (masters.length == 0) {
				var __tmpl_empty = '<p class="result-item last empty">找不到匹配 "<span><%= keyword %></span>" 的城内线路</p>';
				html.push(_.template(__tmpl_empty, { keyword: input }));
				return html.join('');
			}

			//2. 生成对应的路线提示列表
			var __tmpl = '<p class="result-item <%= className %>"><a href="<%= line_url %>"><b class="icon18 icon-here <%= type %>"></b><span class="line-name"><%= lineName %></span><span class="gray"><%= start %> - <%= end %></span></a></p>';
			
			$.each(masters, function (key, master) {
				html.push(_.template(__tmpl, {
					className: (key == masters.length - 1 ? 'last' : ''),
					type: master.type,
					lineName: that.matchChar(input, master['name']),
					line_url: xq.getLineUrl(master.master_id),
					start: master.station_start,
					end: master.station_end
				}));
			});
			return html.join('');
		},
		genCrossHtml: function (currentCity, input, crosses) {
			var html = [];
			var __tmpl_h3 = '<h3 class="title">进入包含 "<b><%= currentCity %> > <%= lineName %></b>" 的线路</h3>';
			html.push(_.template(__tmpl_h3, { lineName: input, currentCity: currentCity.name }));

			var __tmpl = '<p class="result-item <%= className %>"><a href="<%= line_url %>"><b class="icon18 icon-here cross"></b><span class="line-name"><%= currentCity %> > <%= lineName %></span></a></p>';
			var that = this;
			$.each(crosses, function (key, cross) {
				html.push(_.template(__tmpl, {
					className: (key == crosses.length - 1 ? 'last' : ''),
					currentCity: currentCity.name,
					lineName: that.matchChar(input, cross.name),
					line_url: xq.getLineUrl(xq.Data.Cross.getCross(currentCity.city_id, cross.city_id).cross_id, true)
				}));
			});
			return html.join('');
		},
		//匹配字符串，
		//比如，(6,36路) ==> <span>3<b>6</b>路</span> || ('song','淞虹路') ==> <span>淞虹路</span>
		matchChar: function (chars, string) {
			var html;
			var index = string.indexOf(chars);
			//xq.log(index);
			var front = string.slice(0, index),
				end = string.slice(index + chars.length);
			html = front + '<b class="match">' + chars + '</b>' + end;
			return index == -1 ? string : html;
		},
		//激活下拉筛选的 Element
		activeList: function (index, selector) {
			var list = $(selector).find('.inner2 p').not('.empty');
			list.eq(index).siblings('.active').removeClass('active').end().addClass('active');

			//同时改变输入框的文字
			this.changeInputValue(index);
		},
		changeInputValue: function (index) {
			var selector = this.info.selector;
			$(selector).find('input').val($(selector).find('.inner2 p').not('.empty').eq(index).find('span').not('.gray').text());
		},
		//确认选择的线路
		//------------------------------目前只是简单的隐藏提示框，之后还应该有，发送到后台搜索指定的线路 ------- 直接跳转链接
		confirmLine: function (index) {
			if (this.info.allListNums <= 0)
				return;

			//this.hideSuggest();
			//this.changeInputValue(index);

			//发送到后台搜索!
		},
		//隐藏提示框
		hideSuggest: function () {
			$(this.info.selector).find('.pull-down').hide();
		},
		//显示提示框
		showSuggest: function () {
			$(this.info.selector).find('.pull-down').show();
		},
		//判断点击是否在 搜索框的元素中
		clickInSearchPart: function (target) {
			return;
			var wrapSelector = '.topbarInfo';
			xq.log($(target).parents(wrapSelector));
			if ($(target).parents(wrapSelector).length > 0) {
				//this.hideSuggest();
				return true;
			}
			return false;
		}
	};



	//exports.scrollbar = scrollbar;
	exports.seachLineSuggest = seachLineSuggest;
})(jQuery, window);