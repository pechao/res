//TODO: 陆续整理
xq.config.set('postUserLinesToServer', '/passport/line.ajax.do.php');
xq.config.set('queryTagNameServer', '/tag/op.ajax.do.php');
xq.config.set('join-exit-page-master', '/passport/join_master.ajax.do.php');
xq.config.set('login', '/passport/login_check.ajax.php');
xq.config.set('isEmailExist', '/passport/email_check.ajax.do.php');
xq.config.set('group-operate', '/friend/group.do.php');
xq.config.set('replyNews', '/thread/comment.ajax.do.php');
xq.config.set('create-album', '/thread/album_create.ajax.do.php');
xq.config.set('city_select_type', 'jump'); //jump / search
xq.config.set('get-city-master', '/line/master.ajax.php?city_id={0}');

//检查邮箱是否已注册：
//请求格式：email: aa@aa.com
//返回格式：{"available":1} -- 如果邮箱未注册
xq.config.set('checkEmailServer', '/dev/resources/php/emailCheck.php');

//修改密码
//请求格式：{ 'oldpass','newpass','newpass_re'}
//返回格式：{error:200,description:'修改成功'} || {error:404,description:'旧密码错误'} ...
xq.config.set('change-pass', '/tmp_peichao/server/change_pass.php');

//线路搜索，ajax接口
//请求格式：{ key: '302', count: 7, city_id: 310000 }
//返回格式：{ name: "地铁1号线", type: "bus|subway", master_id: 2875, station_start: "淞虹路", station_end: "杨高中路" }
xq.config.set('getSearchLine', '');

//表情json数据
//请求格式：{}
//返回格式：[{ alt: "微笑", id: 1, "ubb": "(微笑)", "src": "/img/emotion/weixiao.gif" }, {...}]
xq.config.set('getEmotion', '/dev/resources/php/getEmotion.php');

//获取用户卡片
//请求格式：{ userid: xxxx }
//返回格式：{ error: 200, html: '<div></......' }
xq.config.set('getUserProfile', '/dev/resources/php/user_card2.php');
//xq.config.set('getUserProfile', '/passport/user_card.html.php');

//添加图片的URL server
//请求格式：-------- 一个表单，包含一张图片
//返回格式：--------{error: 200, id: xxx-xxxx-xx, url: xxxxx.jpg }
xq.config.set('post-pic-server', '/dev/resources/php/post_pic.php');
//xq.config.set('post-pic-server', '/thread/upload.ajax.do.php');

//修改头像，接受图片上传的URL --- 接受一个form 表单

//请求格式：-------- 一个表单，包含一张图片 { iframe: 1, avatar: xx }
//返回格式：--------{ upload_id: 106, url: xxxxx.jpg }
//xq.config.set('upload-avatar','/dev/resources/php/post_pic.php');
xq.config.set('upload-avatar', '/tmp_peichao/server/upload_avatar.php');
//xq.config.set('upload-avatar', '/setting/avatar.ajax.do.php');

//编辑头像尺寸和比例，上传
//请求格式：---- { width: , height: , x: , y: }
//返回格式：---- { error: 200, url: {200: '', 160: '', 48: ''} }
xq.config.set('avatar-edit', '/tmp_peichao/server/avatar_edit.php');



//获取当前用户的已加入的线路的信息
xq.config.set('getPersonalLineInfo', '/passport/line.ajax.php');
//xq.config.set('getPersonalLineInfo', '/dev/_joinedLines.json');

//加载跨城线路的信息
//
xq.Data.Cross.setLoadCrossUrl('/cross/cross.ajax.php?cross_id=<%= crossId %>');

//查询主线下面的支线
//请求格式：
//xq.config.set('addLineServer', '/line/line.ajax.php');
xq.Data.Line.setLoadLineUrl('/line/line.ajax.php?master_id=<%= masterId %>');
//根据线路，获取对应的站点 ↑
//请求格式：---------{ master_id: xxxx }
//xq.config.set('getStations', '/line/line.ajax.php');

//城市选择
//xq.config.set('cityUrl', '/line/city.ajax.php');
//xq.Data.City.setLoadUrl('/line/city.ajax.php');
xq.Data.City.setLoadUrl('/tmp_peichao/server/city.ajax.php');

//发送加入的线路到后台
//请求格式：line_select:{"3176":{"line_id":"3176","master_id":"2777","interestedStations":[],"hauntStations":[]}...}
xq.config.set('postUserLinesToServer', '/passport/line.ajax.do.php');
//xq.config.set('postUserLinesToServer', '/dev/line.do.php');

//编辑新鲜事，需要获取 thread 的详细内容
//请求格式：{ thread_id: xx }
//返回格式：{} -> type, title, station_id, station_name, label, content, picture:[{	id:xx, description: '' }], sex, feature, year, month, day（根据不同类型返回不同的必需字段）
//xq.config.set('getThread', '/dev/resources/php/getThread.php');
xq.config.set('getThread', '/thread/get.ajax.php');

//删除新鲜事
//请求：{ thread_id: xx }
//返回：{ error: 200, url: '/line/221' } -- 详情页删除后需要跳页
xq.config.set('delThread', '/thread/delete.ajax.do.php');
//xq.config.set('delThread', '/dev/resources/php/delete.ajax.do.php');

//删除回复
//请求：{ comment_id: xx }
xq.config.set('delComment', '/comment/delete.ajax.do.php');


//fetch 实时获取最新的未读通知
//返回：{error, notify: { notify: 2//通知, message: 5 //私信}}
//xq.config.set('fetchUnreadNotify', '/dev/resources/php/fetchUnreadNotify.php');

//实时获取最新的未读feed
//返回：{ error, feed: { line: 2//线路动态, friend: 2//好友动态, guang: 2//随便看看} }
//xq.config.set('fetchUnreadFeed', '/dev/resources/php/fetchUnreadFeed.php');








//folow 某人，或取消folow === 每页都要有
xq.config.set('followTheUser', '/dev/resources/php/followTheUser.php');
//搜索好友
//请求格式：{ q: 搜索的字段 }
//返回格式：{"friend":[{"id":65,"avatar" ,"nick", "city", "line_num", "space_url" },{...}],"other":[{"id"...},{..}]}
xq.config.set('search-friend', '/dev/resources/php/search_friend.php');







//xq.config.set('get-city-master', '/dev/_master.json?city_id={0}');
//xq.config.set('city_id', '310000');
//xq.Data.City.setCurrentCity('310000');
xq.Data.City.setCurrentCity('9');
//热门推荐城市：城市的ID的数组
//xq.config.set('hotCity', ["110000", "310000", "440100", "120000", "320100", "320500", "440300", "420100", "510100", "330100", "610100", "210100", "430100", "410100", "500000", "350100", "330300"]);
xq.config.set('hotCity', ["1", "9", "234", "2", "108", "112", "32", "33", "236", "203", "282", "121", "333", "71", "220", "185", "22", "148", "123"]);






//JS 生成线路的 超链接时使用 -- 只要把 <%= master_id %> 放到URL相应的地方即可
xq.data.set('master_url_tmpl', '/line/<%= master_id %>');
xq.data.set('cross_url_tmpl', '/cross/<%= cross_id %>');

//var cityUrlRule = '/line/<%= city_id %>';
//var cityUrlRule = '/explore/?city_id=<%= city_id %>';
//xq.data.set('cityUrlTmpl', '/<%= city_name %>');
xq.data.set('cityUrlTmpl', 'javascript:void(0)');



//用户的线路圈，
//json加载后，会：
//1. 根据数据库资料填充这个 object
//2. 用户在前台的操作也会更改这个 object
//3. 最后把数据提交给 后台
window.Events = {
	'document': {
		'Click': 'documentClicked',
		'Keyup':'documentKeyup'
	},
	'UserLinesLoaded': 'userLinesPoll-Loaded-succeed',
	'MasterLinesLoaded': 'masterLinesIntheCityLoaded-succeed'
}

xq.config.set('tipsText', {
	'replySuccess': '评论成功',
	'mailSuccess': '私信发送成功'
});


//xq.config.addTraceList();
