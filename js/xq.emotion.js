//表情
//define(function (require, exports, module) {

(function (exports, $, _, xq, win, doc, undefined) {
	
	var Emotion;
	//表情列表框的模版
	var __tmpl = '<li title="<%= alt %>"><img src="<%= src %>" alt="<%= alt %>" data-emotion="<%= ubb %>" data-id="<%= id %>" /></li>';
	//回复替换的模板
	var __tmpl_img = '<img src="<%=src%>" alt="<%=alt%>" title="<%=alt%>">';

	Emotion = $.inherit({
		__constructor: function (emotionData) {
			var self = this;

			_.extend(this, emotionData);
			this.html = _.template(__tmpl, emotionData);

			this.toString = function () {
				return self.ubb;
			}
		}
	}, {
		//表情的数据[Array <Object>]
		_data: null,
		//['(哈哈)','(嘿嘿)',...]
		_ubb: null,
		initEmotion: function (data) {
			var tmp = [];
			var ubb = [];
			_.each(data, _.bind(function (emotion, index) {
				var klass = this.prototype.__constructor;
				tmp.push(new klass(emotion));
				ubb.push(emotion.ubb);
			}, this));
			this._data = tmp;
			this._ubb = ubb;
		},
		getData: function () {
			return this._data;
		},
		hasData: function () {
			return !!this._data;
		},
		getAllHtml: function () {
			return _.pluck(this._data, 'html').join('');
		},
		getById: function (id) {
			return _.find(this._data, function (emotion, i) {
				return emotion.id == id;
			});
		},
		getByAlt: function (alt) {
			return _.find(this._data, function (emotion, i) {
				return emotion.alt == alt;
			});
		},
		//“你好(呵呵)”-->“你好<img src="" alt="">”
		filtString: function (str) {
			_.each(this._ubb, _.bind(function (ubb, index) {
				str = str.replace(new RegExp(ubb.replace(/(\(|\))/g, '\\$1'), 'g'), _.template(__tmpl_img, this._data[index]));
				//str = _.template(__tmpl_img,
			}, this));
			return str;
		},
		//options：
		//	prefix：前缀
		updateSrc: function (options) {
			options.prefix && _.each(this._data, function (emotion) {
				emotion.src = options.prefix + emotion.src;
				emotion.html = _.template(__tmpl, emotion);
			});
		},
		//不需要 fetch 了，写成静态文件了
		setData: function (data) {
			this.initEmotion(data);
		},
		fetch: function (callback) {
			$.getJSON(xq.config.get('getEmotion'), _.bind(function (json) {
				if (json.error != 200) {
					xq.log('fetch emotion Error!');
					return;
				}
				this.initEmotion(json.emotion);

				callback && callback(this.getData());
			}, this));
		}
	});

	xq.Emotion = Emotion;
	return Emotion;

})({}, jQuery, _, xq, window, document);

//});