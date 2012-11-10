(function (xq, $, _, win, doc) {
	
	var _Image_ = xq.namespace('Image');


	//示例：var image = new xq.Image.Image({
	//			src: '',
	//			onload: function () {
	//				$('#cnt').text(JSON.stringify(upload.nodeInfo));
	//			},
	//			onnew: function (node) {
	//				$('#button').before(node);
	//			}
	//		});
	_Image_.Image = $.inherit(xq._Base, {
		//参数：
		//	src String
		//	[ onload Function ] ---	加载成功后的回调函数
		//	[ onnew Function ]	---	初始化之后，也可以写在在实例化代码后面
		//
		__constructor: function (options) {
			_.extend(this, options);

			this.dom = new Image();
			this.node = $(this.dom);

			options.onload && this.node.on('load', _.bind(options.onload, this));

			this.dom.src = options.src;

			options.onnew && options.onnew.call(this, this.node);
		}
	});

})(xq, jQuery, _, window, document);