/*
result.js
resultページ用
*/
var 
$resbox = $('#oc_div_result') ,
$idbox	= $('#idbox')
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
	$actab		: $('#actab'),
	$ckb_met	: $('.ckb_met'),
	$tsort		: $('#tsort') ,
	$trev		: $('#trev') ,
	$pagen		: $('#pagen') ,
	$menu_sortby	: $('#sortby') ,
	$rb_mode_table	: $('#rb_mode_table') ,
	
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

	//.. allmet
	allmet: function() {
		var o = this.$ckb_met;
		o.prop( 'checked', o.filter(':checked').length < o.length );
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

	//.. actab: タブの切替
	tab: function( num ) {
		this.$actab.val(num);
	},

	//.. tsort: テーブルモードのソート
	tsort: function( s, r ) {
		this.$tsort.val(s);
		this.$trev.val(r);
		this.$pagen.val(0);
		_startsearch();
	},

	//.. func: changed: 検索条件に変更
	changed: function() {
		//- 内容が変わってなかったら、おしまい
		var f = this.srlz();
		if ( this.formcont == f ) return;
		this.formcont = f;

		//- テーブルモードならフォームのソートの所を操作
		if ( this.$rb_mode_table.is(':checked') ) {
			this.$menu_sortby.prop( 'disabled', true );
		} else {
			this.$menu_sortby.prop( 'disabled', false );
		}

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

	//- IDヒットエリア
	$('#idhit')._loadex({u:'?ajax=h', v:{ kw: $idbox.val() }, speed: 'fast' });
}

//. [func] _ym_search
function _ym_search() {
	$( '#form1' ).attr( 'action', 'ysearch.php' ).submit();
}

