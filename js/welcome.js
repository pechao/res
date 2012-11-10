var jobDetail = {
	delay:100,
	hide: 0,
	show: 1,
	showDetails: function(dlDom){
		//var arrow = dlDom.next('.pointer-arrow');
		var arrow = dlDom.next('.hover-area');
		if(dlDom.css('display')=='none'){
			dlDom.css({opacity: this.hide, display:'block'});
			arrow.css({opacity: this.hide, display:'block'});
			dlDom.stop().animate({'opacity': this.show},this.delay);
			arrow.stop().animate({'opacity': this.show},this.delay);
		}
	},
	hideDetails: function(dlDom){
		//var arrow = dlDom.next('.pointer-arrow');
		var arrow = dlDom.next('.hover-area');
		dlDom.animate({'opacity':this.hide},this.delay,function(){
			dlDom.css({display:'none'});
		});
		arrow.stop().animate({'opacity':this.hide},this.delay, function(){
			arrow.css({'display':'none'});
		})
	}
};

$(function(){
	/*$('.job>div>a').mouseover(function(e){
		jobDetail.showDetails($(this).next('dl'));
	});
	
	$('.job .close-btn').click(function(e){
		jobDetail.hideDetails($(this).parents('dl'));
	});*/
	$('.job>div').hover(function(e){
		jobDetail.showDetails($(this).find('dl'));
	}, function(e){
		jobDetail.hideDetails($(this).find('dl'));
	});
});