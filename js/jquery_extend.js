//zuo.com
//----------------------------------------1. DOM 无关事件 --- author:Ben Alman(http://benalman.com)(https://gist.github.com/799721)
(function($){

  // object on which to bind, unbind and trigger handlers. reqs jQuery 1.4.3+
  var o = $({});

  // Subscribe to a topic. Works just like bind, except the passed handler
  // is wrapped in a function so that the event object can be stripped out.
  // Even though the event object might be useful, it is unnecessary and
  // will only complicate things in the future should the user decide to move
  // to a non-$.event-based pub/sub implementation.
  $.subscribe = function(topic, fn) {

	// Call fn, stripping out the 1st argument (the event object)
	function wrapper() {
	  return fn.apply(this, Array.prototype.slice.call(arguments, 1));
	}

	// Add .guid property to function to allow it to be easily unbound
	// reqs jQuery 1.4+
	wrapper.guid = fn.guid = fn.guid || $.guid++;

	// Bind the handler.
	o.bind(topic, wrapper);
  };

  // Unsubscribe from a topic. Works exactly like unbind
  $.unsubscribe = function() {
	o.unbind.apply(o, arguments);
  };

  // Publish a topic. Works exactly like trigger
  $.publish = function() {
	o.trigger.apply(o, arguments);
  };
  
  // for debugging
  $.pubsubdebug = function() {
	return o;
  };

})(jQuery);


//判断:当前元素是否是被筛选元素的子元素
jQuery.fn.isChildOf = function (b) {
	if (typeof b !== 'string') throw new Error('please input a String Selector in "isChildOf(...)"');
	return (this.parents(b).length > 0);
};
//判断:当前元素是否是被筛选元素的子元素或者本身
jQuery.fn.isChildAndSelfOf = function (b) {
	if (typeof b !== 'string') throw new Error('please input a String Selector in "isChildOf(...)"');
	return (this.closest(b).length > 0);
};
