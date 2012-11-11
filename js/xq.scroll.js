//define([],function
(function (_, $, xq) {

	// 
	// 例子：var scroll = new xq.Scroll({
	//			wrapNode: $('#wrap'),
	//			contentNode: $('#inner')
	//		});

	//		$('#inner').append('<li>a</li><li>b</li><li>c</li>');
	//		scroll.fire('change.content');

	var __tmpl_scroll = '<div class="ui-scrollable-track"><div class="ui-scrollable-gripper"></div></div>';

	var COLOR_TRANSPARENT = 'rgba(0,0,0,0)';
	var COLOR_TRACK_NORMAL = 'rgba(0,0,0,0.1)';
	var COLOR_GRIPPER_NORMAL = 'rgba(0,0,0,0.4)';
	var COLOR_GRIPPER_HALF = 'rgba(0,0,0,0.3)';

	//每次滚轮滚动的距离
	var PX_IN_EACH_WHELL = 50;

	var cssTrack = {
		position: 'absolute',
		right: '3px',
		top: '0',
		backgroundColor: COLOR_TRANSPARENT,
		borderRadius: '5px',
		cursor: 'pointer'
	};
	var cssGripper = {
		position: 'relative',
		top: '0',
		width: '8px',
		backgroundColor: COLOR_TRANSPARENT,
		borderRadius: '5px',
		cursor: 'pointer'
	}
	var cssWrap = {
		position: 'relative'
	}

	//属性：
	//	options
	//	wrapNode
	//	gripperNode
	//
	//方法：
	//	calcGripper
	//
	//监听事件：
	//	change.content	当内容区域发生DOM变化
	//
	xq.Scroll = $.inherit(xq._Base, {
		//参数：
		//	contentNode jqNode	----	滚动的内容
		//	wrapNode	jqNode	----	设置 overflow 属性的包裹 node
		//	
		__constructor: function (options) {
			this.__cacheHandler = {};
			options = _.extend({
				
			}, options);
			this.options = options;

			this.wrapNode = options.wrapNode;
			this.contentNode = options.contentNode;
			this.wrapHeight = this.trackHeight = xq.utils.getHeight(this.wrapNode, true, false, false);

			this.trackNode = $(__tmpl_scroll).css(cssTrack).css('height', this.trackHeight).appendTo(this.wrapNode);
			this.gripperNode = this.trackNode.find('div').css(cssGripper);
			//这几个 height 都需要实时计算
			this.contentHeight = xq.utils.getHeight(this.contentNode);
			this.scrollableContentHeight = this.contentHeight - this.wrapHeight;
			this.gripperHeight = 0;
			this.scrollableTrackHeight = this.trackHeight;
			this.gripperTop = 0;

			this.wrapNode.css(cssWrap);

			this.wrapNode.on('mousewheel', _.bind(function (e, delta) {
				var isPositive = delta > 0;
				this.moveContent(isPositive);
				this.moveGripper(isPositive);
			}, this)).on('mouseenter', _.bind(function (e) {
				this.colorTrans(this.gripperNode, COLOR_GRIPPER_HALF);
			}, this)).on('mouseleave', _.bind(function (e) {
				this.colorTrans(this.gripperNode, COLOR_TRANSPARENT);
			}, this));

			this.trackNode.on('mouseenter', _.bind(function (e) {
				this.colorTrans(this.gripperNode, COLOR_GRIPPER_NORMAL);
				this.colorTrans(this.trackNode, COLOR_TRACK_NORMAL);
			}, this)).on('mouseleave', _.bind(function (e) {
				this.colorTrans(this.gripperNode, COLOR_GRIPPER_HALF);
				this.colorTrans(this.trackNode, COLOR_TRANSPARENT);
			}, this));

			this.gripperNode.draggable({
				'containment': 'parent',
				'drag': _.bind(function (e, ui) {
					this.moveContent(undefined, ui.position.top);
				}, this)
			});

			this.calcGripper();
			this.on('change.content', _.bind(this.changeContentHandler, this));
		},
		changeContentHandler: function (e) {
			this.calcGripper();
		},
		moveContent: function (isPositive, gripperTop) {
			var top;

			//拖拽滚动条
			if (!_.isUndefined(gripperTop)) {
				top = gripperTop == 0 ? 0 : -gripperTop / this.scrollableTrackHeight * this.scrollableContentHeight;
			}
			//滚轮
			else {
				var prevTop = Math.floor(parseInt(this.contentNode.css('margin-top')));
				top = isPositive ? (prevTop + PX_IN_EACH_WHELL) : (prevTop - PX_IN_EACH_WHELL);
				top > 0 && (top = 0);
				top < -this.scrollableContentHeight && (top = -this.scrollableContentHeight);
			}
			this.contentNode.css({
				'margin-top': top
			});
		},
		moveGripper: function (isPositive,gripperTop) {
			var top;

			//滚轮
			var prevTop = Math.floor(parseInt(this.gripperNode.css('top')));
			var px_in_each_whell = PX_IN_EACH_WHELL / this.scrollableContentHeight * this.scrollableTrackHeight;
			top = isPositive ? (prevTop - px_in_each_whell) : (prevTop + px_in_each_whell);
			top < 0 && (top = 0);
			top > this.scrollableTrackHeight && (top = this.scrollableTrackHeight);

			this.gripperNode.css({
				'top': top
			});
		},
		colorTrans: function (node, color) {
			node.stop(true, true).animate({
				backgroundColor: color
			}, 'fast');
		},
		calcGripper: function () {
			this.contentHeight = xq.utils.getHeight(this.contentNode);
			this.scrollableContentHeight = this.contentHeight - this.wrapHeight;
			this.gripperHeight = Math.round(this.wrapHeight / this.contentHeight * this.trackHeight);
			this.scrollableTrackHeight = this.trackHeight - this.gripperHeight;
			this.gripperTop = Math.round(parseInt(this.contentNode.css('top')) / this.scrollableContentHeight * this.scrollableTrackHeight);

			this.gripperNode.css({
				'height': this.gripperHeight,
				'top': this.gripperTop
			});
		}

	});

	//xq.Scroll = Scroll;

})(_, jQuery, xq);