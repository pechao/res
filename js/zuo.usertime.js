(function($, exports){
	//用户的最后登陆时间，每秒钟都要更新一次（一分钟内）

	/***
	*
	*
	*
	**模块监听事件：
	**	（1） $.subscribe('ZUO.check-usertime') ---- 比如在页面DOM有变动的时候，重新检测
	*
	*
	*
	*/
	return;
	var config = {
		selector: '.timetext',
		secondUsers: [],
		sTime: 1000,
		mTime: 1000 * 30
	};

	//主要是 xq.log 
	var debug = false;


	var User = $.inherit({
		__constructor: function (elem) {
			var dom = $(elem);

			this.elem = elem;
			this.dom = dom;
			this.timestamp = xq.unifyTimestamp(dom.data('time'));

			this.secondInterval();
			this.minuteInterval();
		},
		updateView: function () {
			this.dom.text(xq.getHumanTime(this.timestamp));
		},
		getDiff: function (format) {
			format = format || 'second';
			var now = (new Date()).getTime();
			return Math.round((now - this.timestamp) / (format === 'second' ? 1000 : format === 'minute' ? 1000 * 60 : format === 'hour' ? 1000 * 60 * 60 : 1));
		},
		isLessOneMinute: function () {
			return this.getDiff() < 60;
		},
		secondInterval: function () {
			if (this.isLessOneMinute() && !this.elem.secondId) {
				this.elem.secondId = setInterval($.proxy(function () {
					this.updateView();
					this.secondCheck();
					debug && xq.log(this, 'one second');
				}, this), config.sTime);
			}
		},
		minuteInterval: function () {
			if (this.elem.minuteId) {
				return;
			}

			this.elem.minuteId = setInterval($.proxy(function () {
				var diff = this.getDiff('minute');
				var hour1 = 59, hour9 = 60 * 9, yestorday = 60 * 24, beforYestorday = 60 * 48;
				debug && xq.log('one minute', diff);
				if (diff === hour1 || diff === hour9 || diff === yestorday || diff === beforYestorday) {	
					this.updateView();
				}
				this.minuteCheck();
			}, this), config.mTime);
		},
		secondCheck: function () {
			if (!this.isLessOneMinute() || !this.dom.isChildOf('body')) {
				debug && xq.log('clear second');
				clearInterval(this.elem.secondId);
			}
		},
		minuteCheck: function () {
			if (!this.dom.isChildOf('body')) {
				debug && xq.log('clear minute');
				clearInterval(this.elem.minuteId);

				_.without(config.secondUsers, this);
				
				//delete this;
			}
		}
	});

	
	$(function(){
		
		checkSecondUser();
		
		$.subscribe('ZUO.check-usertime',function(){
			checkSecondUser();
		});
	});
	

	
	
	function checkSecondUser() {
		$(config.selector).each(function (index, userEl) {
			var fil = _.filter(config.secondUsers, function (userObj) { return userObj.elem === userEl });
			if (fil.length === 0) {
				config.secondUsers.push(new User(userEl));
			}
		});
	}
	
})(jQuery, window);