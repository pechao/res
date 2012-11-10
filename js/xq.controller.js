(function(xq, $, _, win, doc){

	var Controller = function () {
		
	}

	Controller.create = function (protoProps, classProps) {
		var cons = $.inherit(_.extend({
			__constructor: function () {


				if (protoProps && _.has(protoProps, 'constructor') && _.isFunction(protoProps.constructor)) {
					protoProps.constructor.apply(this, arguments);
				}

				if (this.view && this.model) {
					this.modelEvents && _.each(this.modelEvents, _.bind(function (handlerName, eventName) {
						//this.on(eventName, _.bind(this[handlerName], this));
						this.model.on(eventName, _.bind(_.isFunction(handlerName) ? handlerName : this[handlerName], this));
					}, this));

					var eventSpliter = /^(\w+)\s*(.*)$/;
					this.viewEvents && this.view.el && _.each(this.viewEvents, _.bind(function (handlerName, key) {
						//var split = key.split(' ');
						//var eventName = split.shift();
						//var selector = split.join(' ');
						var match = key.match(eventSpliter);
						var eventName = match[1];
						var selector = match[2];
						var method = _.bind(_.isFunction(handlerName) ? handlerName : this[handlerName], this);
						this.view.el.find(selector).on(eventName, method);
					}, this));
				}
			}
		}, protoProps), _.extend({}, classProps));

		return cons;
	}

	xq.Controller = Controller;
})(xq, jQuery, _, window, document);