//注册第四步，上传头像
//define(function (require, exports, module) {
//var crop;
$(function () {
	
	var config = {
		minRealWidth: 160,
		minRealHeight: 160
	}
	var canNextStet = false;
	var avatarBtn = $('.upload-main-btn a');
	var avatarCropNode = $('#avatar-edit');
	var realWidth = avatarCropNode.width();
	var realHeight = avatarCropNode.height();

	var avatarEditForm = xq.Form.create({
		action: xq.config.get('avatar-edit'),
		method: 'post',
		map: {}
	}).appendTo();
	var imgUrl;

	//var crop;

	//1. 上传头像
	var nextBtn = $('.next-btn');
	var avatarUpload = new xq.Image.Upload({
		node: avatarBtn,
		action: xq.config.get('upload-avatar'),
		inputName: 'avatar'
	});

	var __tmpl_img = '<img src="<%= src %>" />';
	
	avatarUpload.on('upload.success', function (content, suit, upload) {
		
		var image = new Image();
		imgUrl = content.url;
		image.onload = function (e) {
			var minWidth = realWidth * config.minRealWidth / content.originWidth
			var minHeight = realHeight * config.minRealHeight / content.originHeight;

			var randWidth = xq.utils.rand(minWidth, realWidth);
			var randHeight = xq.utils.rand(minHeight, realHeight);
			var left = (realWidth - randWidth) / 2;
			var top = (realHeight - randHeight) / 2;

			avatarCropNode.html(_.template(__tmpl_img, { src: imgUrl })).find('img').Jcrop({

				setSelect: [left, left + randWidth, top + randHeight, top],
				minSize: [minWidth, minHeight],
				aspectRatio: config.minRealWidth / config.minRealHeight,
				onSelect: function (e) {

					avatarEditForm.addNameValue({
						width: e.w,
						height: e.h,
						x: e.x,
						y: e.y,
						//这是在 160 的形状上编辑的
						size: 160,
						url: imgUrl
					});
				},
				onRelease: function (e) {
					avatarEditForm.addNameValue({
						width: realWidth,
						height: realHeight,
						x: 0,
						y: 0,
						url: imgUrl
					});

				}
			});
		};
		image.src = imgUrl;

		btnInit();
	});

	
	function btnInit() {
		if (nextBtn.data('inited')) return;

		nextBtn.addClass('next-btn2').children('div').addClass('ok2');
		nextBtn.on('click', function (e) {
			avatarEditForm.submit();
		});
		nextBtn.data('inited', true);
	}

});

//});
