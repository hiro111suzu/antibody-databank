/*
result.js
resultページ用
*/
var 
$resbox = $('#searchres')

;

//. 開始時
$( function() { 
	_form.init();

	//- 戻る・進む動作
	if ( history && history.pushState ){
		$(window).on('popstate', function(e){
			_form.reloadform();
		});
	}
});

//. [obj] _form
var _form = {
	formcont: null,
	timer_w: null,

	$form		: $('#form1') ,
	$pagen		: $('#pagen') ,
	
	//.. init:
	init: function() {
		//- フォーム初期化
		this.formcont = this.srlz();
		this.$form.change( function(){ _form.changed(); } );
	},

	//.. srlz
	srlz: function() {
		return this.$form.serialize();
	},

	//.. pagenum
	pagenum: function( n ) {
		this.$pagen.val(n);
		_startsearch();
	},

	//.. reloadform
	reloadform: function() {
		var l = location.search || '?';
		this.$form._loadex({
			u: l + '&ajax=f',
			speed: 0,
			func:function(){ _form.init(); } 
		});
		_startsearch( l + '&ajax=l' );
	},

	//.. func: changed: 検索条件に変更
	changed: function() {
		//- 内容が変わってなかったら、おしまい
		var f = this.srlz();
		_hdiv.oc( 'data', true );
		if ( this.formcont == f ) return;
		this.formcont = f;

		$resbox.fadeTo( 'fast', 0.7 );
		this.$pagen.val(0);
		_timer.do_after_busy( function(){ _startsearch(); }, 1000, 'form' );
	}
}

//. [func] _startsearch: 検索
function _startsearch( prms ) {
	var srlz = prms || _form.srlz();

	//- urlヒストリ
	if ( history && history.pushState ){
		prms == undefined && history.pushState( srlz, null, '?' + srlz );
	}

	//- 結果エリア
	$resbox._loadex({u:'?ajax=l', v: srlz, speed: 'medium'}).fadeTo( 'fast', 1 );

	//- aboutを隠す
	_hdiv.oc( 'about', false );
}

