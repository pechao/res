/*

每次上传图片都用到的共同的操作，提取到这个文件中====但是其中一些接口留在外面，比如，上传开始--到上传完成，这个中间的过程自定义；上传完毕后的接口

发布的事件：
	form.add-picture-fetchRemote-start  { id: id }
	form.add-picture-fetchRemote-success { iframe_id: xxx }


*/


//点击input按钮，选择需要上传的文件的==========其实是用DOM元素代为点击
//e: { form_id, }
$.subscribe('file_input-clicked', function (e) {
	var form_id = e.form_id;
	var form = $('#' + form_id);
	var input = form.find('input');

	if (form.length === 0) {
		var html = _.template($.trim(xq.getTmpl('post-pic-tmpl')), { 'post_pic_server': e.server_url, 'form_id': e.form_id });
		form = $(html).appendTo('body');
		input = form.children('input');

		//这儿是真正的 input 元素===========当选择的文件发生变化
		input.on('change', function (e) {
			if (e.target.files.length === 0) return;
			$.publish('form.add-picture-changed', { e: e, form: form, form_id: form_id });
		});
	}

	input.trigger('click');
});

//添加了一张图片  //文件选框发生变化
$.subscribe('form.add-picture-changed', function (e) {
	var id = xq.ajaxForm(e.form, function (data, id) {
		var data = xq.parseJSON(data);
		data.iframe_id = id;
		data.form_id = e.form_id;
		$.publish('form.add-picture-fetchRemote-success', data);
	});

	//开始上传，这个接口留在外面自定义（每次的情况不同）
	$.publish('form.add-picture-fetchRemote-start', { iframe_id: id, form_id: e.form_id });
	xq.ajaxForm.submit();
});


//添加图片--成功添加到服务器并返回---这个接口是每次都要干的一件事---删除那个用过的iframe
$.subscribe('form.add-picture-fetchRemote-success', function (data) {
	//每此上传都传到一个新生成的iframe，成功后，删除这个 iframe
	$(xq.format('#{0}', data.iframe_id)).remove();
});