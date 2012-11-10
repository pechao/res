(function(xq, _, jQuery, win, doc, undefined){
	
	var hint = new xq.Widget.Hint({
		domId: 'global-hite'
	});

	var confirm = new xq.Widget.Confirm({
		domId: 'global-confirm'
	});

	var prompt = new xq.Widget.Prompt({
		domId: 'global-prompt'
	});

	var tip = new xq.Widget.Tip({
		domId: 'global-tip'
	});

	var tipBig = new xq.Widget.Tip({
		domId: 'global-tip-big',
		domClass: 'pop-tip-big pop-tip',
		needTitle: true,
		needTipBtn: true,
		needWrapper: true
	});

	var event = new xq.Event();



	$(function ($) {
		hint.appendTo();
		confirm.appendTo();
		prompt.appendTo();
		tip.appendTo();
		tipBig.appendTo();
	});

	xq.data.set('globalHint', hint);
	xq.data.set('globalConfirm', confirm);
	xq.data.set('globalPrompt', prompt);
	xq.data.set('globalTip', tip);
	xq.data.set('globalTipBig', tipBig);
	xq.data.set('globalEvent', event);

	tipBig.on('click.tip', function (e) { tipBig.hide(); });
	
})(xq, _, jQuery, window, document);