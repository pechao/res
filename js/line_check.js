(function($, _, xq){
	var mask = new xq.Widget.Mask({ zIndex: 105 });
	var hint = new xq.Widget.Hint({ domId: 'line_check'}).hide();

	$(function () {
		mask.appendTo();
		hint.appendTo().getNode().css({ zIndex: 110 });
	});

	var config = {
		warnTime: 1000 * 3
	}

	var limit = {
		cross: {
			min: 0,
			max: 5
		},
		master: {
			min: 1,
			max: 5
		}
	}

	var warnMessage = {
		cross: {
			max: '不要太贪心哦，目前你只能加入 ' + limit.cross.max + ' 条你最熟悉的跨城线路',
			overrange: '哇！你已经加入了超过 ' + limit.cross.max + ' 条的跨城线路，是怎么办到的？牛逼~求反馈'
		},
		master: {
			min: '必须保留最少 ' + limit.master.min + ' 条地铁、巴士线路',
			notenough: '哇！你的剩余地铁、巴士线路竟然不足 ' + limit.master.min + ' 条，怎么弄的？求反馈~',
			max: '不要太贪心哦，目前你只能加入 ' + limit.master.max + ' 条你最熟悉的地铁、巴士线路',
			overrange: '哇！你已经加入了超过 ' + limit.master.max + ' 条的地铁、巴士线路，是怎么办到的？牛逼~求反馈'
		}
	}


	hint.on('show', function () {
		mask.show();
		_.delay(function () {
			hint.getNode().fadeOut();
			mask.getNode().fadeOut();
		}, config.warnTime);
	});
	hint.on('hide', function () {
		mask.hide();
	});


	//检查线路的操作
	//userData : { master:{}, cross:{} }
	//nowLineData: { op: 'join'|'quit', id: 110000, type: 'master'|'cross' }
	xq.fn.add('check-line-operate', function (userData, nowLineData) {
		var type = nowLineData.type;
		var borderType = nowLineData.op == 'join' ? 'max' : 'min';
		var borderNum = limit[type][borderType];
		var len = _.keys(userData[type]).length;
		if (len == borderNum) {
			hint.setMessage(warnMessage[type][borderType]);
		} else if (borderType == 'max' && len > borderNum) {
			hint.setMessage(warnMessage[type]['overrange']);
		} else if (borderType == 'min' && len < borderNum) {
			hint.setMessage(warnMessage[type]['notenough']);
		} else {
			return true;
		}
		hint.pop().show();
		return false;
	});
})(jQuery, _, xq);