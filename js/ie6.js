var headerPNG = '.header .logo a,.header .news .nums a,.pull-down .border-bottom,.pull-down .inner,.pull-down .inner2,.pull-down .left,.pull-down .middle,.pull-down .right,.pull-down .inner,.pull-down .inner2,.header .news .border-top,';
var leftPart = '.left-part h3,.left-part .personal-info b,.left-part .my-traffic b,.left-part .friends b,.left-part .browse-history b,.tl,.tr,.bl,.br,.tl_3,.tr_3,.bl_3,.br_3,.section-icon,';
var privateMailPNG = '.main-part .sixin-wrap b,.main-part .sixin-wrap em,.main-part .sixin-wrap .reply-area .msg,.main-part .sixin-wrap .back-mail,.main-part .sixin-wrap .friend-reply p.info i,.main-part .sixin-wrap .reply-btn,#city-sel .top,#city-sel .mdl,#city-sel .btm,';
var mainPart = '.notification b,.big-title h3,.main-part .sixin-wrap .reply-single .options i,.prompt-quite h3 i,.user-detail-part .content-part .content ul.line li p.bus,';
var homeMainPart = '.post-news .inner-container .list li a b,.icon-here,.msg-form .line-sel i,.msg-form .station-sel i,.post-news .msg-panel .border-bottom,';
var friendMainPart = '.each-follower .operates p,';
var innerCityLine = '.scrollbar-wrap-hor i,.post-news .title-list li p i,.news-paihang li,.find-fav li,.people-zuo .content-wrap dd,.people-zuo .content-wrap dl,.right-part h3,.people-zuo .title,.find-fav .title,.invite-friends a,.find-fav h4,.page-title .about-line .mail,';
var register = '.step-info b,.step-info div s,.form-data li b,.form-data li i,.form-data li p,.form-data li span,.next-btn strong,#lines-wrap .had-in,#lines-wrap .suggest,#lines-wrap .search-result .wrap,#lines-wrap .if-empty em,#lines-wrap .search-result s,'+
			   '.search-part .search-input i,.search-part .search-input p,.search-part .search-input b,.next-btn,.stations-box li div.mdl em.add,.stations-box li .top,.stations-box li .btm,.stations-box li div.mdl,.stations-box li div.mdl em.change,';
var rightPart = '.right-part .title,.people-zuo .content-wrap dl, .sit-what .content-wrap dl,.sit-what .content-wrap dd,.want-go .title p, .weather .title p,.user-detail-part .title-part .right .mail,';
var homeForm = '.msg-form .public-photo-sel-inner a i,';
var haoyouPart = '.group-single .left i, .group-single .right i,';
var scrollbar = '.scrollbar-wrap .scroll-bg .btm,.scrollbar-wrap .scroll-bg .top,';

var tagBeFix = removeComma(headerPNG + leftPart + privateMailPNG + mainPart + homeMainPart + friendMainPart + innerCityLine + register + rightPart + homeForm + haoyouPart + scrollbar)
//alert(tagBeFix);
DD_belatedPNG.fix(tagBeFix);

function removeComma(str) {
	if (str.lastIndexOf(',') === str.length - 1) {
		str = str.substr(0, str.length - 1);
	}
	return str;
};