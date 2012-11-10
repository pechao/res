(function (xq, $, _, win, doc) {

	var _Image_ = xq.namespace('Image');
	var __tmpl_editImg = '<div><div class="top-left"></div><div class="top"></div><div class="top-right"></div><div class="right"></div><div class="bottom-right"></div>' +
						'<div class="bottom"></div><div class="bottom-left"></div><div class="left"></div></div>';

	var Point = $.inherit({
		__constructor: function (x, y) {
			//this.__cacheHandler = {};
			this.setXY(x, y);
		},
		setX: function (x) {
			//this.fire('setX', x);
			!_.isUndefined(x) && (this.x = x);
			return this;
		},
		setY: function (y) {
			//this.fire('setY', y);
			!_.isUndefined(y) && (this.y = y);
			return this;
		},
		setXY: function (x, y) {
			var xy = x;
			if (!$.isPlainObject(x)) {
				xy = { x: x, y: y };
			}
			this.setX(xy.x);
			this.setY(xy.y);
			return this;
		},
		getXY: function (x, y) {
			return {
				x: this.x,
				y: this.y
			}
		}
	});

	//这是一个抽象的矩形类，
	//只控制矩形的四个顶点的位置，
	//以及缩放等
	Rectangle = $.inherit({
		//参数
		//	[ fixedScale Number | false ] 固定比例的缩放（参数为：宽 / 高）
		//	[ minWidth Number ]
		//	[ maxWidth Number ]
		//	[ minHeight Number ]
		//	[ maxHeight Number ]
		//	[ borderLimit Array < Number > ] [ 上 右 下 左 ] -> [0, 200, 200, 0] -- 矩形只能在这个范围之内
		__constructor: function (options) {
			options = options || {};
			this.pointTL = new Point;
			this.pointBR = new Point;

			this.options = options;
		},
		pointTL: null,
		pointBR: null,
		move: function (xDis, yDis) {
			var tmpTL = this.pointTL.getXY();
			var tmpBR = this.pointBR.getXY();
			var pointTL = this.pointTL;
			var pointBR = this.pointBR;

			pointTL.setX(pointTL.x + xDis);
			pointBR.setX(pointBR.x + xDis);
			pointTL.setY(pointTL.y + yDis);
			pointBR.setY(pointBR.y + yDis);

			if (this.isOverBorder(pointTL, pointBR)) {
				pointTL.setXY(tmpTL);
				pointBR.setXY(tmpBR);
				return;
			}

			this._isShowen && this.showMe();
			return this;
		},
		moveTo: function (x, y) {
			this.move(x - this.pointTL.x, y - this.pointTL.y);
			return this;
		},
		//fixPoint[ String ]: 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_RIGHT' | 'BOTTOM_LEFT'
		//xPos [ Number ]: x的绝对坐标 --- 因为是鼠标移动来调用这个，所以，用绝对坐标即可
		//yPos [ Number ]: y的绝对坐标
		resize: function (fixPoint, xPos, yPos) {
			var tmpTL = this.pointTL.getXY();
			var tmpBR = this.pointBR.getXY();
			var pointTL = this.pointTL;
			var pointBR = this.pointBR;
			var options = this.options;

			if (fixPoint == 'TOP_LEFT') {
				pointBR.setX(xPos);
				pointBR.setY(yPos);
			} else if (fixPoint == 'TOP_RIGHT') {
				pointTL.setX(xPos);
				pointBR.setY(yPos);
			} else if (fixPoint == 'BOTTOM_RIGHT') {
				pointTL.setX(xPos);
				pointTL.setY(yPos);
			} else if (fixPoint == 'BOTTOM_LEFT') {
				pointBR.setX(xPos);
				pointTL.setY(yPos);
			}

			var isNegative = pointBR.x < pointTL.x || pointBR.y < pointTL.y;
			isNegative && xq.log('is negative');
			if (isNegative || this.isOverSize(pointTL, pointBR) || this.isOverBorder(pointTL, pointBR)) {
				pointTL.setXY(tmpTL);
				pointBR.setXY(tmpBR);
				return;
			}

			this.options.fixedScale && this.scaleTheSize(fixPoint, pointTL, pointBR);

			this._isShowen && this.showMe();
			return this;
		},
		updateOptions: function (options) {
			_.extend(this.options, options);
			return this;
		},
		getWidth: function () {
			return this.pointBR.x - this.pointTL.x;
		},
		getHeight: function () {
			return this.pointBR.y - this.pointTL.y;
		},
		//fixPoint: 以此固定点来缩放
		scaleTheSize: function (fixPoint, pointTL, pointBR) {
			var fixedScale = this.options.fixedScale;
			if(!fixedScale) throw 'this.options.fixedScale is not defined';

			pointTL = pointTL || this.pointTL;
			pointBR = pointBR || this.pointBR;
			var width = pointBR.x - pointTL.x;
			var height = pointBR.y - pointTL.y;
			if (width / height != fixedScale) {
				height = parseInt(width / fixedScale);
				if (fixPoint == 'TOP_LEFT') {
					//pointBR.setX(xPos);
					pointBR.setY(pointTL.y + height);
				} else if (fixPoint == 'TOP_RIGHT') {
					//pointTL.setX(xPos);
					pointBR.setY(pointTL.y + height);
				} else if (fixPoint == 'BOTTOM_RIGHT') {
					//pointTL.setX(xPos);
					pointTL.setY(pointBR.y - height);
				} else if (fixPoint == 'BOTTOM_LEFT') {
					//pointBR.setX(xPos);
					pointTL.setY(pointBR.y - height);
				}
			}
			return {
				pointTL: pointTL,
				pointBR: pointBR
			};
		},
		isOverBorder: function (pointTL, pointBR) {
			var borderLimit = this.options.borderLimit;
			var isOverBorder = borderLimit && (pointTL.y < borderLimit[0] || pointBR.x > borderLimit[1] || pointBR.y > borderLimit[2] || pointTL.x < borderLimit[3]);
			isOverBorder && xq.log('over border');
			return isOverBorder;
		},
		isOverSize: function (pointTL, pointBR) {
			var options = this.options;
			var width = pointBR.x - pointTL.x;
			var height = pointBR.y - pointTL.y;

			var isOverSize = (options.minWidth && width < options.minWidth) ||
					(options.minHeight && height < options.minWidth) ||
					(options.maxWidth && width > options.maxWidth) ||
					(options.maxHeight && height > options.maxHeight);
			isOverSize && xq.log('over size');
			return isOverSize;
		},
		//用一个DIV显示出来
		_tmpDom: null,
		_isShowen: false,
		showMe: function () {
			var bgColor = '#666';
			this._tmpDom = this._tmpDom || $('<div>').css({
				position: 'absolute',
				backgroundColor: bgColor,
				zIndex: 1000
			});

			this._isShowen = true;
			var div = this._tmpDom.css({
				width: this.getWidth(),
				height: this.getHeight(),
				top: this.pointTL.y,
				left: this.pointTL.x
			}).appendTo('body');
		},
		hideMe: function () {
			this._isShowen = false;
			this._tmpDom && this._tmpDom.remove();
		}
	});

	//xq.Event.mixTo(Point);

	//DOM结构：node:<div style="position:relative"><img /></div>
	//
	//属性：
	// node, img, editImg, 
	//
	//方法：
	//	
	//
	//
	_Image_.Crop = $.inherit(xq._Base, {
		//
		//参数：
		//	node: jqNode
		//	[ canReDraw = fasle Boolean ] 是否可以重新绘制编辑区域
		//	[ fixedScale = false Boolean | Number ] 是否比例缩放，宽：高
		//	[ imgRealWidth Number ] 图片宽度所代表的真实的宽度
		//	[ imgRealHeight Number ] 图片高度所代表的真实的高度
		//	[ minRealWidth = 160 Number | false ] 在真实的图片尺寸下，需要的最小宽度
		//	[ minRealHeight = 160 Number | false ] 在真实的图片尺寸下，需要的最小高度
		//
		__constructor: function (options) {
			options = _.extend({
				canReDraw: true,
				minRealWidth: 160,
				minRealHeight: 160
			}, options);
			this.options = options;
			this.node = options.node;
			this.canReDraw = options.canReDraw;
			this.fixedScale = options.fixedScale;

			this.img = this.node.find('img');
			this._isImgLoaded = !!this.img.height();

			if (!this._isImgLoaded) {
				this.img.on('load', _.bind(function (e) {
					this._init();
				}, this));
			} else {
				this._init();
			}
		},
		pointStart: new Point,
		pointEnd: new Point,
		//pointTL: new Point,
		//pointBR: new Point,
		offset: null,
		disToBorder: null,
		//_tmpPointTL: new Point,
		_isImgLoaded: null,
		_hasAnEditArea: false,
		_hadBindNodeMousemove: false,
		_hadBindEditImgMousemove: false,
		_isDraging: false,
		_init: function () {
			this.setBgColor('#000');
			var width = this.width = this.img.width();
			var height = this.height = this.img.height();
			this.src = this.img.attr('src');

			var options = this.options;

			this.rectangle = new Rectangle(_.extend({
				fixedScale: this.fixedScale,
				minWidth: options.imgRealWidth && options.minRealWidth && this.width * options.minRealWidth / options.imgRealWidth,
				minHeight: options.imgRealHeight && options.minRealHeight && this.height * options.minRealHeight / options.imgRealHeight,
				maxWidth: width,
				maxHeight: height,
				borderLimit: [0, width, height, 0]
			}, this.options));

			this.node.css({
				'position': 'relative',
				'user-select': 'none',
				'-webkit-user-select': 'none',
				'-ms-user-select': 'none',
				'-moz-user-select': 'none'
			});

			//this.img.css({
			//	display: 'block'
			//});

			var editImgCss = {
				position: 'absolute',
				width: this.width,
				height: this.height,
				backgroundImage: this._genBgUrl(this.src),
				backgroundRepeat: 'no-repeat',
				cursor: 'crosshair',
				zIndex: 100
			};
			var blockSize = 8;
			var blockSize2 = blockSize / 2;
			var blockSize4 = blockSize / 4;
			var blockCss = {
				position: 'absolute',
				width: blockSize,
				height: blockSize,
				background: '#000',
				opacity: '0.3',
				zIndex: 120
			};
			var barCss = {
				position: 'absolute',
				width: blockSize2,
				height: blockSize2,
				zIndex: 110
			}

			var editImg = $(__tmpl_editImg).css(editImgCss).hide();
			this.editImg = editImg;
			this.editTL = editImg.find('.top-left').css(_.extend({}, blockCss, { top: -blockSize2, left: -blockSize2, cursor: 'nwse-resize' }));
			this.editT = editImg.find('.top').css(_.extend({}, barCss, { top: -blockSize4, cursor: 'n-resize' }));
			this.editTR = editImg.find('.top-right').css(_.extend({}, blockCss, { top: -blockSize2, right: -blockSize2, cursor: 'nesw-resize' }));
			this.editR = editImg.find('.right').css(_.extend({}, barCss, { right: -blockSize4, cursor: 'e-resize' }));
			this.editBR = editImg.find('.bottom-right').css(_.extend({}, blockCss, { bottom: -blockSize2, right: -blockSize2, cursor: 'nwse-resize' }));
			this.editB = editImg.find('.bottom').css(_.extend({}, barCss, { bottom: -blockSize4, cursor: 'n-resize' }));
			this.editBL = editImg.find('.bottom-left').css(_.extend({}, blockCss, { bottom: -blockSize2, left: -blockSize2, cursor: 'nesw-resize' }));
			this.editL = editImg.find('.left').css(_.extend({}, barCss, { left: -blockSize4, cursor: 'e-resize' }));
			this.editImgCopy = $('<div>').css(_.extend({}, editImgCss, { 'background': 'none', 'zIndex': 80 }));

			this.img.before(this.editImg);
			this.img.before(this.editImgCopy);

			this.node.on('mousedown', _.bind(this._nodeMousedownHandler, this));
			this.node.on('mouseup', _.bind(this._nodeMouseupHandler, this));
			this.editImg.on('mousedown', _.bind(this._editImgMousedownHandler, this));
			this.editImg.on('mouseup', _.bind(this._editImgMouseupHandler, this));
			this.editImg.on('mousedown', 'div', _.bind(this._editBorderMousedownHandler, this));
			this.editImg.on('mouseup', 'div', _.bind(this._editBorderMouseupHandler, this));

			this._bindedNodeMousemoveHandler = _.bind(this._nodeMousemoveHandler, this);
			this._bindedEditImgMousemoveHandler = _.bind(this._nodeMousemoveHandler, this);//注意这个绑定
			this._bindedEditBorderMousemoveHandler = _.bind(this._nodeMousemoveHandler, this);//注意这个绑定
		},
		_bindedNodeMousemoveHandler: null,
		_bindedEditImgMousemoveHandler: null,
		_bindedEditBorderMousemoveHandler: null,
		_nodeMousedownHandler: function (e) {
			//if(this.)
		},
		_nodeMouseupHandler: function (e) {
		},
		_nodeMousemoveHandler: function (e) {
		},
		_editImgMousedownHandler: function (e) {
			e.stopPropagation();
			this._isMoving = true;
		},
		_editImgMouseupHandler: function (e) {
			e.stopPropagation();
			this._isMoving = false;
		},
		_editBorderMousedownHandler: function (e) {
			e.stopPropagation();
			this._isResizing = true;
		},
		_editBorderMouseupHandler: function (e) {
			e.stopPropagation();
			this._isResizing = false;
		},
		_genBgUrl: function (url) {
			return 'url(' + url + ')';
		},
		_getOffset: function (e, direction) {
			if (direction == 'x') return e.pageX - this.offset.left;
			if (direction == 'y') return e.pageY - this.offset.top;
		},
		openEditArea: function () {
			this._hasAnEditArea = true;
			this.rectangle
		},
		closeEditArea: function () {
			this._hasAnEditArea = false;
			this.updateCursor();

			this.pointStart.setXY();
			this.pointEnd.setXY();
			this.pointTL.setXY();
			this._tmpPointTL.setXY();
			this.pointBR.setXY();

			this.editImg.css({
				display: 'none',
				top: 0,
				left: 0,
				width: this.width,
				height: this.height,
				backgroundPosition: '0 0'
			});

			this.img.css({ opacity: 1 });
		},
		updateSrc: function (src) {
			this.img.attr('src', src);
			this.editImg.css({ backgroundImage: this._genBgUrl(src) });
		},
		updateCursor: function () {
			var cursor;
			if (this._hasAnEditArea) {
				cursor = 'move';
			} else {
				cursor = 'crosshair'
			}
			this.editImg.css({
				cursor: cursor
			});
		},
		updateArea: function (pointTL, pointBR) {
			var width = pointBR.x - pointTL.x;
			var height = pointBR.y - pointTL.y;
			var left = pointTL.x;
			var top = pointTL.y;
			var right = left + width;
			var bottom = top + height;

			//(left < 0) && (left = 0);
			//(top < 0) && (top = 0);
			//(right > this.width) && (width = this.width - left);
			//(bottom > this.height) && (height = this.height - top);

			this.editImg.css({
				top: top,
				left: left,
				width: width,
				height: height,
				backgroundPosition: '-' + left + 'px -' + top + 'px'
			});
			this.editT.css('width', width);
			this.editB.css('width', width);
			this.editR.css('height', height);
			this.editL.css('height', height);
		},
		setOpacity: function (opacity) {
			this.img.css('opacity', opacity);
		},
		setBgColor: function (colorStr) {
			this.node.css('background-color', colorStr);
		},
		setSize: function (width, height) {
			var css = {
				width: width,
				height: height
			};
			this.node.css(css);
			this.img.css(css);
		}
	});

})(xq, jQuery, _, window, document);