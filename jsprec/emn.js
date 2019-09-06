/*
emnavi
全ページ共通
*/

//. init
//- クッキー期限 (10日後)
var dt = new Date();
dt.setDate( dt.getDate() + 10 );
var ckdate = dt.toGMTString() ,

//- ツールチップパラメータ
ttip_param = { track: false, left: 0, delay: 150, showURL: false, showBody: ' : ' },

//- タイマー変数//- 雑グローバル変数
T = {}, G = {} ,

//- IE6以前
//IE6 = $.browser.msie && ( $.browser.version < 7 ),
//IE = $.browser.msie ,
//FIREFOX = $.browser.mozilla ,
IE = false,
IE6 = false
;

if ( /*@cc_on!@*/false ) {
	if ( navigator.userAgent.match(/MSIE (¥d¥.¥d+)/) )
		IE = true;
		if ( parseFloat(RegExp.$1) == 6 )
			IE6 = true;
//		{browser_v = parseFloat(RegExp.$1);}//IE6.7.8
}

//. クッキー書き込み
function _cookie( k, v ) {
	document.cookie = k + '=' + escape( v ) + ';' + 'expires=' + ckdate + ';';
}

//. _bottom: オブジェクトの底辺の位置
function _bottom( s ) {
	var o = $( s );
	return o.position().top + o.outerHeight();
}

//. tinput: トップバーの検索ボックス
function _tinput() {
	var str = $( '#ti_box' ).val().toLowerCase() ,
		l = str.length
	;

	if ( l == 0 ) {
		//- ヌル
		$( '#ti_box' ).attr( 'size', 5 );
		$( '#ti_btn' ).stop( true, true ).fadeOut( 'medium' );
	} else {
		//- ヌルじゃない
		$( '#ti_box' ).attr( 'size', l + 4 );
		$( '#ti_btn' ).stop( true, true ).fadeIn( 'medium' );
	}

	if ( str.match(/^[0-9][0-9a-zA-Z]{3}$/) ){
		//- IDっぽい
		$( '#ti_btn' ).val( 'ID' );
		$( '#ti_form' ).attr( 'action', 'emnavi_detail.php' );
		$( '#ti_idimg' ).stop( true, true )
			.fadeIn( 'medium' ).load( 'ajax_id2img.php?id=' + str );
	} else {
		//- それ以外
		$( '#ti_btn' ).val( $( '#ti_btn').attr( 'k' ) );
		$( '#ti_form' ).attr( 'action', 'emnavi_result.php' );
		$( '#ti_idimg' ).stop( true, true ).fadeOut( 'medium' ).html( '' );
	}
}

function _ti_idhide() { $( '#ti_idimg' ).slideUp( 'medium' ).html( '' ) };
