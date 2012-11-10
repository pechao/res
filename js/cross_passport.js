jQuery(function ($) {


	var timePicker,passport,confirm;
	
	var tmpl = {
		timepicker: xq.getTmpl('time-picker-tmpl'),
		passport: xq.getTmpl('passport-tmpl')
	}

	if (tmpl.timepicker) {
		timePicker = new xq.Widget.TimePicker({
			tmpl: tmpl.timepicker
		}).appendTo().hide();

		timePicker.on('click.ok', function (e, date) {
			this.hide();
			passport && passport.addOneStamp(date);
		});


		//事件发布在 module_thread.js -- 编辑feed，编辑跨城出发时间
		timePicker.on('threadEdit.click.ok', function (controller) {
			controller.model.set({
				cross_time: this.stringify()
			})
		});
	}
			
			
	if (tmpl.passport) {
		passport = new xq.Widget.Passport({
			tmpl: tmpl.passport,
			lineName: xq.data.get('cross_name'),
			stamps: xq.data.get("cross_stamp")
		}).appendTo().hide();


		passport.on('show', function (e) {
			//先缓存下来，若点击“取消”，则取消这些改动 
			// _.clone 为一层浅复制 --- 此处已足够，因为数组内都是字符串，没有引用类型
			this.set('cache', _.clone(this.getStamps()));
		});

		passport.on('click.add', function (e) {
			timePicker.show().pop();
		});

		passport.on('click.save', function (e) {
			var crossId, stamps;

			this.hide();
			stamps = this.getStamps();
			
			if (_.isEqual(stamps, this.get('cache'))) return;

			//目前的 passport 关联到哪一个 跨城线路 了
			//线路管理（注册第二步）页
			if (crossId = this.get('crossId')) {
				xq.Data.Cross.setStamp(crossId, stamps);
				$.publish('send-lines-to-server');
			}
			//跨城页
			else {
				$.post(xq.config.get('saveStamp'), {
					stamp: JSON.stringify(this.getStamps()),
					cross_id: xq.data.get('cross_id')
				});
			}
		});

		passport.on('click.quit', function (e) {
			confirm.popTo(this.getBtn('quit')).show().setLineName(this.get('lineName')).set('lineId', this.get('lineId'));
		});

		passport.on('click.cancel', function (e) {
			this.removeAllStamps().addStamps(this.get('cache'));
		});

		passport.on('hide', function (e) {
			timePicker.hide();
			confirm.hide();
		});
	}


	confirm = new xq.Widget.Confirm({
		message: '确认退出 <b>' + xq.data.get('cross_name') + '</b> 线路圈？',
		okBtnName: '确认退出',
		arrow: true
	}).appendTo().hide().setId('confirm.quitLine').moveArrow('center');

	confirm.setLineName = function (lineName) {
		this.getNode().find('.warn b').html(lineName);
		return this;
	}

	confirm.setLineId = function (lineId) {
		this._lineId = lineId;
		return this;
	}

	confirm.on('click.ok', function (e) {
		passport && passport.removeAllStamps().hide();
		//确认退出线路 -- 跨城线路页
		$.publish('exit-this-line-in-linepage', { $btn: this.get('$btn') });
		//确认退出线路 -- 线路管理页，注册第二步（跨城线）
		var crossId = this.get('lineId');
		xq.Data.Cross.quit(crossId);
		$.publish('send-lines-to-server');
		xq.data.get('removeLineFromJoinedArea')(crossId, true);

		//确认退出线路 -- 线路管理页，注册第二步（城内线）
		$.publish('sureQuit.master', { master_id: this.get('lineId') });
	});


	
	xq.data.set('confirm', confirm);
	xq.data.set('timepicker', timePicker);
	xq.data.set('passport', passport);
	
});