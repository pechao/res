(function(xq, $, _, win, doc){
	
	var Data = xq.namespace('Data');

	//在此模块内部使用：主要是静态成员和单例模式的类使用
	var moduleEvent = new xq.Event();


	(function () {
		//参数：
		//	

		//对外接口：
		//
		//	方法：
		//
		//	事件：
		//

		//类属性：
		//	
		//	
		//	
		//
		//
		//类方法：
		//	
		//	
		//	
		//
		Data.create = function (protoProps, classProps) {
			
			var cons = $.inherit(_.extend({
				__constructor: function () {
					var argLen, events, instanceMembers, options;
					argLen = arguments.length;
					//instanceMembers = arguments[argLen - 2];
					//options = arguments[argLen - 1];
					this.__cacheHandler = {};
					this.attributes = {};

					//instanceMembers && _.extend(this, instanceMembers);

					if (protoProps && _.has(protoProps, 'constructor') && _.isFunction(protoProps.constructor)) {
						protoProps.constructor.apply(this, arguments);
					}

					//events = (options && options.events) || this.events;
					events = this.events;
					events && _.each(events, _.bind(function (handlerName, eventName) {
						//this.on(eventName, _.bind(this[handlerName], this));
						this.on(eventName, _.isFunction(handlerName) ? handlerName : this[handlerName]);
					}, this));
				},
				set: function (key, value, options) {
					var attrs;
					if (_.isObject(key)) {
						attrs = key;
						options = value
					} else {
						attrs = {};
						attrs[key] = value;
					}

					_.each(attrs, _.bind(function (value, key) {
						var oldValue = this.get(key);
						//oldValue, newValue 皆为 null 或 undefined 
						if (oldValue == value && value == undefined) return;

						//add, remove, change 都会触发 change　事件
						if (!_.isEqual(value, oldValue)) {
							this.fire('change.' + key, {
								key: key,
								oldValue: oldValue,
								newValue: value
							});

							if (!_.has(this.attributes, key)) { //if (!oldValue) {
								this.fire('add.' + key, {
									key: key,
									value: value
								});
							}
							this.attributes[key] = value;
						}
					}, this));
					
					return this;
				},
				get: function (key) {
					return key ? this.attributes[key] : this.attributes;
				},
				remove: function (key) {
					var oldValue = this.get(key);
					oldValue != undefined && this.fire('change.' + key, {
						key: key,
						oldValue: oldValue,
						newValue: undefined
					})
					this.fire('remove.' + key, {
						key: key,
						value: this.get(key)
					});
					delete this.attributes[key];

					return this;
				},
				empty: function () {
					//this.attributes = {};
					_.each(this.get(), _.bind(function (value, key) {
						this.remove(key);
					}, this));
				},
				/*
				* url String
				* key String
				* [ queryData Object ]
				* [ success Function ]
				*/
				fetch: function (options) {
					$.getJSON(options.url, options.queryData, _.bind(function (json) {
						this.set(options.key, json);
						options.success && options.success(json, options.key, this);
					}, this));
				},
				save: function (key, value, options) {
					//this.set
					//$.post(options.url || this.url, options.queryData, function (resp) {

					//})
				},
				toJSON: function () {
					return _.clone(this.attributes);
				}
			}, protoProps), _.extend({}, classProps));

			xq.Event.mixTo(cons);
			return cons;
		}

	})();
	
	/////////////////////////////////////////
	///////////////////////////////////////// BASE BEGIN --- 所有 Data 的基类
	/////////////////////////////////////////
	
	(function () {
		//参数：
		//	

		//对外接口：
		//
		//	方法：
		//
		//	事件：
		//

		//类属性：
		//	_data [ Object ] -- 是此类主要维护的一个数据
		//	_loadUrl [ String ]
		//	event [ xq.Event ]
		//
		//
		//类方法：
		//	setData(data)
		//	getData()
		//	setLoadUrl(url[ String ])
		//
		Data.Base = $.inherit(xq._Base, {
			__constructor: function () {
				this.__base();
			}
		}, {
			event: new xq.Event(),
			_data: null,
			//数据只有一份
			setData: function (data) {
				this._data = data;
			},
			getData: function () {
				return this._data;
			},
			_loadUrl: null,
			setLoadUrl: function (url) {
				this._loadUrl = url;

				//this.event.fire('change.url', url);
			},
			getLoadUrl: function () {
				console.trace();
				return this._loadUrl;
			}
		});
	})();
	
	/////////////////////////////////////////
	///////////////////////////////////////// BASE END --- 所有 Data 的基类
	/////////////////////////////////////////



	/////////////////////////////////////////
	///////////////////////////////////////// BASE END --- 所有 Data 的基类
	/////////////////////////////////////////

	(function () {
		var _switch = false;
		var ins;
		
		Data.Singleton = $.inherit(xq._Base, {
			__constructor: function(){
				if(!_switch){
					throw new Error('The class xq.Data.User can not be instanlize, can use the Class\'s getInstance() method get the only instance');
				}
				this._info = null;

				this.__GetterSetter();
			}
		}, {
			getInstance: function () {
				return getIns.apply(this, arguments);
			}
		});
		
		//竟然没法在静态方法中共访问类本身...
		//有必要callback吗...吃饱撑了
		function getIns(callback){
			if(!ins) {
				_switch = true;
				ins = new Data.User();
				_switch = false;
			}
			callback && callback.call(ins);
			return ins;
		}
	})();
	
	

	/////////////////////////////////////////
	///////////////////////////////////////// BASE END --- 所有 Data 的基类
	/////////////////////////////////////////



	/////////////////////////////////////////
	///////////////////////////////////////// PinYin BEGIN --- 继承自 xq._Base
	/////////////////////////////////////////

	(function () {

		Data.PinYin = $.inherit(xq._Base, {
			__constructor: function (charactor) {
				this.chars = charactor;
				var pa = this.__self.getPinYin(charactor, true, true)
				this.pinyin = pa.pinyin;
				this.acronym = pa.acronym;
			}
		}, {
			_pinyin: null,
			isLoaded: false,
			setPinYinJSON: function (pinyin) {
				this._pinyin = pinyin;
				this.isLoaded = true;

				moduleEvent.fire('data.pinyin', pinyin);
			},
			getPinYin: function (charactor, isAcronym, isBoth) {
				var len = charactor.length;
				var dict = this._pinyin;
				var _pin = [];
				while (len--) {
					//IE7 JS 引擎不能把 字符串当作 数组来取
					var chara = charactor[len] || charactor.substr(len, 1);
					var pin = dict[chara];

					//多音字默认使用第一个读音，如果压根就没有这个拼音，原样把字放进去
					_pin.unshift((pin && pin[0]) || chara);
				}

				//首字母缩写
				var acronym;
				if (isAcronym || isBoth) {
					acronym = _.map(_pin, function (pin) {
						return pin[0] || pin.substr(0, 1);
					});
				}

				//!isBoth && (_pin = acronym);
				!isBoth && acronym && (_pin = acronym);

				return isBoth ? {
					pinyin: _pin.join(''),
					acronym: acronym.join('')
				} : _pin.join('');
			}
		});

	})();

	/////////////////////////////////////////
	///////////////////////////////////////// PinYin BEGIN --- 继承自 xq._Base
	/////////////////////////////////////////

	
	
	/////////////////////////////////////////
	///////////////////////////////////////// User BEGIN --- 继承自 xq._Base
	/////////////////////////////////////////
	
	(function(){
		var _switch = false;
		var ins;
		
		Data.User = $.inherit(xq._Base,{
			__constructor: function(){
				if(!_switch){
					throw new Error('The class xq.Data.User can not be instanlize, can use the Class\'s getInstance() method get the only instance');
				}
				this._info = null;

				// WARN: 把同一个数据放在两个地方维护（且需要同步），本身就是错误的
				//this._master = null; == Data.Master.getUserMaster();
				//this._cross = null; == Data.Cross.getUserCross();
				//this._line = null; == Data.Line.getUserLine();

				this.__GetterSetter();
			},
			getMaster: function () {
				return Data.Master.getUserMaster();
			},
			getCross: function () {
				return Data.Cross.getUserCross();
			},
			getLines: function (masterId) {
				return Data.Line.getLines.apply(Data.Line, arguments);
			}
		}, {
			//有必要callback吗...吃饱撑了
			getInstance: function (callback) {
				if (!ins) {
					_switch = true;
					ins = new this();
					_switch = false;
				}
				callback && callback.call(ins);
				return ins;
			}
		});
		
		
	})();
	
	/////////////////////////////////////////
	///////////////////////////////////////// User END --- 继承自 xq._Base
	/////////////////////////////////////////
	
	/////////////////////////////////////////
	///////////////////////////////////////// City BEGIN --- 继承自 Data.Base
	/////////////////////////////////////////
	
	(function () {
		//参数：
		//	cityId[ Number | String ] || cityName [ String ]

		//对外接口：
		//
		//	方法：
		//
		//	事件：
		//		load.data -- _data 加载完成
		//

		//类属性：
		//	event [ xq.Event ]
		//
		//类方法：
		//	getData()
		//	
		//	getCross(crossId [ Number | String ])
		//	parse(crossId [ Number | String ])
		//
		Data.City = $.inherit(Data.Base, {
			__constructor: function (cityId) {
				this.__base();
				this._city = this.__self.getCity(cityId);
				
				this.__GetterSetter(this);
			}
		}, {
			event: new xq.Event(),
			getData: function (callback) {
				//if (!this._data) {
				//	var self = this;
				//	$.get(this._loadUrl, function (json) {
				//		if (json.error == 200) {
				//			self._data = json.city;
				//			self.addPinYin(self._data);
				//			self.event.fire('load.data', self._data);
				//			callback && callback.call(self, self._data);
				//		}
				//	});
				//} else {
					return this._data;
				//}
			},
			setData: function (data) {
				this._data = data;
				this.addPinYin(data);
			},
			addPinYin: function (city) {
				var id = setInterval(function () {
					if (Data.PinYin.isLoaded) {
						clearInterval(id);
					} else {
						return;
					}

					var getPinYin = _.bind(Data.PinYin.getPinYin, Data.PinYin);
					_.each(city, function (city, city_id) {
						var pa = getPinYin(city.name, true, true);
						city['pinyin'] = pa.pinyin;
						city['acronym'] = pa.acronym;
					});
				},10);
			},
			_currentCity: null,
			getCurrentCity: function(){
				return this._currentCity;
			},
			setCurrentCity: function(cityId){
				if(isNaN(parseInt(cityId,10))) return false;
				this._currentCity = cityId;
			},
			setLoadUrl: function (url) {
				this.__base(url);

				//城市页立即去取一次
				//同时为了尽量避免阻塞页面，10ms 后去取
				_.delay(_.bind(this.getData, this), 200);
			},
			getCity: function (city_id) {
				city_id = city_id || this.getCurrentCity();
				if (_.isArray(city_id)) {
					var city = [], self = this;
					_.each(city_id, function (id) {
						city.push(self._data[id]);
					});
					return city;
				} else {
					return this._data[city_id];
				}
			},
			byName: function (name) {
				return _.find(this._data, function (city) {
					return city.name == name;
				});
			}
		});

		//Data.City.event.on('change.url', function (url) {
		//	xq.log('Data.City - ' + url);
		//});
	})();
	
	/////////////////////////////////////////
	///////////////////////////////////////// City END --- 继承自 Data.Base
	/////////////////////////////////////////
	
	
	
	/////////////////////////////////////////
	///////////////////////////////////////// BaseLine BEGIN --- 继承自 Data.Base -- 子类：Cross,Master,Line
	/////////////////////////////////////////
	
	(function(){

		//参数：
		//	

		//对外接口：
		//
		//	方法：
		//		join() -- 加入这条线路
		//		quit() -- 退出这条线路
		//
		//	事件：
		//
		//类属性：
		//	
		//类方法：
		//
		Data.BaseLine = $.inherit(Data.Base,{
			
			join: function(){
				
			},
			quit: function(){
				
			}
		});
	})();
	
	/////////////////////////////////////////
	///////////////////////////////////////// BaseLine END --- 继承自 Data.Base -- 子类：Cross,Master,Line
	/////////////////////////////////////////



	/////////////////////////////////////////
	///////////////////////////////////////// Cross 跨城线路 BEGIN --- 继承自 Data.Base
	/////////////////////////////////////////
	(function () {

		var cityIdLen = 6;

		//参数：
		//	cityId[ Number | String ] || cityName [ String ]

		//对外接口：
		//
		//	getter setter
		//		_cross
		//
		//	方法：
		//
		//	事件：
		//
		//类属性：
		//	_data -- 主数据，因为不会在前端直接维护一个全部的跨城数据，所以，这个属性不用
		//	_userCross -- 用户加入的跨城线路
		//类方法：
		//	getUserCross()
		//	setUserCross(crossData [ Object ])
		//	getCross(crossId [ Number | String ]) | getCross(fromCityId [ Number ], toCityId [ Number ])
		//	_parse(crossId [ Number | String ])
		Data.Cross = $.inherit(Data.BaseLine, {
			__constructor: function (crossId) {
				this._cross = this.__self.getCross(crossId);

				this.__GetterSetter();
			},
			getStamp: function () {
				var cross = this.getCross();
				return this.__self.getStamp(cross.cross_id);
			},
			setStamp: function (stamps) {
				//要保证这个数据跟 __self 里面保存的 是同一份数据
				var cross = this.getCross();
				this.__self.setStamp(cross.cross_id);

				return this;
			}
		}, {
			_loadCrossUrl: null,
			getLoadCrossUrl: function (crossId) {
				return _.template(this._loadCrossUrl, { crossId: crossId });
			},
			setLoadCrossUrl: function (url) {
				//格式应该为："http://zuo.test/line/cross.ajax.php?cross_id=<%= crossId %>"
				this._loadCrossUrl = url;
			},
			//退出的数据放到这里
			_crossPool: {},
			update: function (crossId, keyValue) {
				var cross = this.getCross(crossId);
				$.extend(cross, keyValue);
				this._crossPool[crossId] = cross;
			},
			join: function (crossId, callback) {
				var self = this;
				var cross = this.getCross(crossId, function (cross) {
					self.getUserCross()[crossId] = cross;
					callback && callback(cross);
				});
				
				return cross;
			},
			quit: function (crossId) {
				this._crossPool[crossId] = this.getCross(crossId);
				delete this.getUserCross()[crossId];
			},
			getData: null,
			setData: null,
			getStamp: function (crossId) {
				return this.getCross(crossId)['stamp'];
			},
			setStamp: function (crossId, stamp) {
				this.getCross(crossId)['stamp'] = stamp;
			},
			_userCross: {},
			getUserCross: function(){
				return this._userCross;
			},
			setUserCross: function(crossData){
				if (!$.isPlainObject(crossData)) return;
				this._userCross = crossData;

				moduleEvent.fire('data.user.cross', crossData);
				//Data.User.getInstance().setCross(crossData);

				return this;
			},
			//crossId 也可以是：fromCityId, toCityId
			getCross: function (crossId, callback) {
				if (_.isUndefined(crossId)) return null;
				// arguments: fromCityId, toCityId, callback
				if (parseInt(callback)) {
					crossId = '' + crossId + callback;
					callback = arguments[2];
				}
				var cross = (this._userCross && this._userCross[crossId]) || this._crossPool[crossId];
				var notLoaded = false;
				if (!cross) {
					notLoaded = true;
					cross = this._parse(crossId);
				}

				if (notLoaded && callback) {
					var self = this;
					$.getJSON(this.getLoadCrossUrl(crossId), function (json) {
						// extend ，因为是自己模拟数据，后台返回的数据只有 人气等，其他的数据还是要靠 _parse 来解析出来
						var cross = self._crossPool[crossId] = $.extend(self._parse(crossId), json.cross);
						callback(cross);
					});
				} else if (callback) {
					callback(cross);
				}

				return cross;
			},
			_parse: function (crossId) {
				//one_another 的写法是为了跟后台数据的变量名称格式保持一致

				var city_id = crossId.toString().substr(0, cityIdLen);
				var city = Data.City.getCity(city_id);
				var city_name = (city && city['name']) || '出发城市';
				var target_id = crossId.toString().substr(cityIdLen);
				var target = Data.City.getCity(target_id);
				var targete_name = (target && target['name']) || '目的城市';
				var name = city_name + ' → ' + targete_name;
				var reverse_id = '' + target_id + city_id;
				var parsedCross = {
					cross_id: crossId,
					city_id: city_id,
					city_name: city_name,
					target_id: target_id,
					target_name: targete_name,
					name: name,
					reverse_id: reverse_id,
					stamp: [],
					popularity: 0,
					feed: 0
				}

				this._crossPool[crossId] = parsedCross;
				var url = this.getLoadCrossUrl(crossId);
				$.getJSON(url, _.bind(function (data) {
					_.extend(this._crossPool[crossId], data.data);
					$.publish('loaded.cross', {
						crossId: crossId,
						popularity: data.data.popularity
					});
				}, this));

				return parsedCross;
			}
		});
	})();

	/////////////////////////////////////////
	///////////////////////////////////////// Cross 跨城线路 END --- 继承自 Data.Base
	/////////////////////////////////////////
	
	
	
	/////////////////////////////////////////
	///////////////////////////////////////// Master 城内线路 主线  BEGIN --- 继承自 Data.Base
	/////////////////////////////////////////
	
	(function(){
		//参数：
		//	masterId[ Number | String ]

		//对外接口：
		//
		//	方法：
		//
		//	事件：
		//
		//类属性：
		//	_data -- 主线数据，以城市名作为key
		//	_userMaster -- 用户加入的主线路
		//
		//类方法：
		//	getMaster(masterId[ Number | String ]) -- 获取指定 id 的 master 主线
		//	getLines(masterId[ Number | String ]) -- 获取指定 id 的 master 下的 lines 支线
		//	getData([cityId [ Number | String ] = currentCityId ])
		//	setData([cityId [ Number | String ] = currentCityId ], masterData[ Object ])
		//	getUserMaster()
		//	setUserMaster(userMasterData [ Object ])
		Data.Master = $.inherit(Data.BaseLine, {
			__constructor: function(masterId){
				//主线包含 >=1 条支线
				this._lines = {};
				this._master = this.__self.getMaster(masterId);

				this.__GetterSetter();
			},
			setLines: function (lineId) {
				this._lines[lineId] = new Data.Line(lineId, this.getMaster().masterId);
			},
			getLines: function () {
				if (!_.isEmpty(this._lines)) return this._lines;

			}
		}, {
			_subway:[],
			getSubway: function(){ 
				return this._subway;
			},
			//1. 添加匹配拼音
			//2. 提取地铁
			initEveryMaster: function () {
				var master = this.getData();
				var subway = this.getSubway();
				var needAcronym;
				//xq.log('inited');
				$.each(master, function (master_id, masterLine) {
					if (masterLine.type == 'subway') {
						subway.push(masterLine);
						//xq.log('subway');
					}
					
					var name = masterLine['name'];
					//if (name == '地铁12号线') log = true;
					var pin_acro = xq.Data.PinYin.getPinYin(name, true, true);
					var match = [name].concat(_.values(pin_acro));
					
					var transNumberName = xq.utils.transLineNumber(name);
					if (transNumberName != name) {
						//线路名有阿拉伯数字的话，就不需转为汉字后的缩写了
						needAcronym = !name.match(/\d/) || undefined;
						pin_acro = xq.Data.PinYin.getPinYin(transNumberName, needAcronym, needAcronym);
						match = match.concat(transNumberName).concat(needAcronym ? _.values(pin_acro) : pin_acro);
					}
					

					//masterLine['match'] = match; //[name, pin_acro.pinyin, pin_acro.acronym];//self.transChars(name, han_pin);
					masterLine['match'] = match.join(' ');
				});
			},
			//2种用法：
			//Master.getMaster(15185) | return { name, city_id, master_id... }
			//Master.getMaster([15185, 8768]) | return { master_id: { name, city_id, master_id... }, master_id: { name, city_id, master_id... } }
			getMaster: function (masterId) {
				var userMaster = this.getUserMaster();
				var cityMastyer = this.getData();
				if (_.isArray(masterId)) {
					var getted = {};
					_.each(masterId, function (masterId) {
						getted[masterId] = userMaster[masterId] || cityMastyer[masterId];
					});
					return getted;
				}
				//如果不在已加入的master里面，则，请求的master必然是当前城市的master【除非是在调试】
				return userMaster[masterId] || cityMastyer[masterId];
			},
			//Master.getMasterByName('地铁') | return [ { name, city_id, master_id... }, { name, city_id, master_id... } ]
			getMasterByName: function (lineName) {
				var cityMaster = this.getData();
				var matched = [];
				var i = 0;
				_.each(cityMaster, function (master, index) {
					if (master.name.match(lineName)) {
						matched.push(master);
					}
				});
				return matched;
			},
			getLines: function (masterId) {
				
			},
			_data: {},
			getData: function(cityId){
				if(_.isUndefined(cityId)) cityId = Data.City.getCurrentCity();
				return this._data[cityId];
			},
			setData: function(cityId, masterData){
				if(isNaN(parseInt(cityId))) {
					masterData = cityId;
					cityId = Data.City.getCurrentCity();
				}
				if(!$.isPlainObject(masterData)) throw new Error('masterData to set Must Be with type of Object');
				this._data[cityId] = masterData; 
			},
			_userMaster: {},
			getUserMaster: function(){
				return this._userMaster;
			},
			setUserMaster: function(userMasterData){
				if(!$.isPlainObject(userMasterData)) return false;
				this._userMaster = userMasterData;

				moduleEvent.fire('data.user.master', userMasterData);

				//var user = Data.User.getInstance();
				//user._master = userMasterData;

				return this;
			}
		});
	})();
	
	/////////////////////////////////////////
	///////////////////////////////////////// Master 城内线路 主线  END --- 继承自 Data.Base
	/////////////////////////////////////////
	
	// TODO : Line 抽象的不太好，跟 Master 联系太紧密；后面还有 Station 没弄哪
	/////////////////////////////////////////
	///////////////////////////////////////// Line 城内线路  线路 BEGIN --- 继承自 Data.Base
	/////////////////////////////////////////
	
	(function () {
		//参数：
		//	lineId[ Number | String ]

		//对外接口：
		//
		//	getter setter
		//		_haunt --- 出没的站
		//		_interest --- 感兴趣的站
		//
		//	方法：
		//
		//	事件：
		//
		//	类属性：
		//		_lines --- 以 masterId 为 key 的 对象
		//		_loadLineUrl
		//
		//	类方法：
		//		getLines(masterId[ Number | String ], [ callback [ Function ]], [ context [ Object ]]) -- 获取指定 masterId 下面的 lines
		//		setLoadLineUrl(url[ String ])
		//
		Data.Line = $.inherit(Data.BaseLine, {
			__constructor: function (masterId, lineId) {
				//var master = Data.Master.getMaster(masterId);
				var lines = this.__self.lines[masterId];

				if (!lines) {
					this.__self.getLines(masterId, function (lines) {
						this.line = lines[lineId];
						this.fire('loaded.line', lines[lineId]);
					}, this)
				} else {
					this.line = lines[lineId]
				}
				
				this._info = null;

				var stationLines = this.__self.getUserLine();
				this._haunt = (stationLines && stationLines[lineId]) || null;
				this._interest = (stationLines && stationLines[lineId]) || null;

				this.__GetterSetter();
			}
		}, {
			_lines: {},
			getLines: function (masterId, callback, context) {
				context = context || win;
				var lines = this._lines[masterId];
				if (lines) {
					if (_.isFunction(callback)) {
						callback.call(context, lines);
						return lines;
					} else {
						return lines;
					}
				};

				var self = this;
				$.getJSON(this.getLoadLineUrl(masterId), _.bind(function (json) {
					if (json.error != 200) return;

					lines = this._lines[masterId] = json.line;

					if (_.isFunction(callback)) callback.call(context, lines, masterId);
				}, this));
			},
			_userLine: {},
			getUserLine: function () {
				return this._userLine;
			},
			setUserLine: function (userLineData) {
				this._userLine = userLineData;
			},
			_loadLineUrl: null,
			setLoadLineUrl: function (url) {
				//格式 为： 'http://zuo.test/line/line.ajax.php?master_id=<%= masterId %>'
				this._loadLineUrl = url;
			},
			getLoadLineUrl: function (masterId) {
				return _.template(this._loadLineUrl, { masterId: masterId });
			}
		});
	})();
	
	/////////////////////////////////////////
	///////////////////////////////////////// Master 城内线路  线路 END --- 继承自 Data.Base
	/////////////////////////////////////////

})(xq, jQuery, _, window, document);