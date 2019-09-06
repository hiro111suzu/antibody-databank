/*
index
トップページ
*/

var movsize = 200;

//. 開始時に実行
$(
	function(){ _movstart(); }
);

//. ID ボックス 内容に変化
function idchange() {
	var id = $( '#idbox' ).val().toLowerCase();
	if ( id.match(/^[0-9][0-9a-z]{3}$/) ) {
		//- IDぽい
		$('#idform').attr( 'action', 'emnavi_detail.php' );
		$("#idimg").slideDown("slow").load( "ajax_id2img.php?m=i&id=" + id );
	} else {
		//- IDじゃない
		$('#idform').attr( 'action', 'emnavi_result.php' );
		if ( id.length < 2 )
			$("#idimg").slideUp("slow").html('');
	}
}

//. ムービーシャッフル

function _resh() {
	$.getJSON( "ajax_slots.php?t=" + Date(), function( r ){
		o_mv.each( function( i ){
			//- ムービー切り替え
			$( this )._movset( r[ i ].url );

			//- キャプション（とリンク）書き換え
			var c = $( '#cap' + i );
			c.html( c.html()
				.replace( /(EM|P)DB-[0-9a-z]{4}/ig, r[ i ].db + '-' + r[ i ].id ) 
			);

			//- ムービー内メッセージ
			_mvmsg( 'loading' );
			_mvicon( 'resh' );
		});
		//- ツールチップ初期化
		$( '#cap0 a, #cap1 a, #cap2 a' ).tooltip( ttip_param );
	});
}

//. ムービーコンパネ表示切り替え
function viewbtn() { $("#ctrdt").toggle("middle"); }

//. アクセスパネル 詳細・シンプル切り替え
function _accdet( f ) {
	if ( f ) {
		$( '#btn_accs' ).show();
		$( '#btn_accd' ).hide();
		$( '.acc_detail' ).fadeIn( 'slow' );
		$( '.acc_simple' ).fadeOut( 'slow' );
		_cookie( 'top_acc_det', 1 );
	} else {
		$( '#btn_accs' ).hide();
		$( '#btn_accd' ).show();
		$( '.acc_detail' ).fadeOut( 'slow' );
		$( '.acc_simple:not(#idimg)' ).fadeIn( 'slow' );
		_cookie( 'top_acc_det', '' );
	}
}

