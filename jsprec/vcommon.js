/*
vcommon.js
万見トップと万見メイン両方
*/

//- クッキー期限 (365日後)
var dt = new Date();
dt.setDate( dt.getDate() + 365 );
var ckdate = dt.toGMTString();

//. 最初に実行
$( function() {
	$( '#open_sel' ).tabs({active: open_acttab });
	_idpopup();
	
	//- IDインプットボックス
	var i = $( '#idbox' ),
		ib = $( '#idboxpop' )
	;
	i.keyup( function(){
		var v = i.val();
		if ( v.length == 3 | v.length == 4 ) {
			$.get( 'ajax_id2imgv.php?id=' + v, function( data ) {
				if ( data == '' )
					ib.slideUp( 'fast' );
				else
					ib.html( data ).slideDown( 'fast' );
			});
		} else {
			ib.slideUp( 'fast' );
		}
	});

	//- ランダムセレクトオプション
	var r = $( '.rsel_opt' );
	r.click( function(){_rsel_act( this );} );
	r.change( function(){_rsel_act( this );} );
	r.focus( function(){_rsel_act( this );} );
	r.keyup( function(){_rsel_act( this );} );
});

function _rsel_act( t ) {
	$( '.rsel_opt' ).addClass( 'transp' );
	$(t).removeClass( 'transp' );
//	alert( $(t).html() );
}

//. ランダム選択画像
function _randimg( m ) {
	//- menuで選択
	if ( m == 'menu' )
		m = $( "#randmenu" ).val();

	var o = $( '#randimg' ),
		ol = $( '#randimg_loading' ),
		kw = ( m == 'k' ) ? '&kw=' + $( '#rndkw' ).val() : ''
	;
	o.slideUp( 'fast' );
	ol.show( 'fast' );
	$.get( 'ajax_randimg.php?mode=' + m + kw + '&t=' + Date(), function( data ) {
		o.html( data ).slideDown( 'fast', function(){
			_idpopup();
			ol.stop(1,1).hide( 'fast' );
		});
	});
}

//.  _randimgdel: 画像一覧 キーワード
function _randkw( o ) {
	$( '#rndkw' ).val( o );
	_randimg( 'k' );
}

//. _randimgdel: 画像一覧を閉じる
function _randimgdel() {
//	alert( 'hoge' );
	_cookie( 'randimg', 'x' );
	$('#randimg').hide('fast').html('');
}

//. _idpopup: 画像のホバーでIDポップアップ
function _idpopup() {
	$( '.lnkimg' ).hover( function(){
		var t = $( this ),
			tt = t.attr( 'title' );
		;
		if ( tt.indexOf( ':' ) == -1 ) {
			$.get( 'ajax_gettitle.php?id=' + tt, function( data ) {
				var ttt = tt + ': ' + data,
					o = $( '#idpopup' )
				;
				t.attr( 'title', ttt );
				if ( o.text() == tt )
					o.text( ttt );
			});
		}

		$( '#idpopup' )
			.stop(1,1)
			.text( tt )
			.fadeIn( 'fast' )
			.position({ of: t, my: 'top', at: 'bottom' })
		;
	}, function(){
		$( '#idpopup' ).fadeOut( 'medium' );
	});
}

/*
function _lsstore( k, v ) {
	if (typeof localStorage == 'undefined') return
}
*/

//. クッキー書き込み
function _cookie( k, v ) {
	document.cookie = k + '=' + escape( v ) + ';' + 'expires=' + ckdate + ';';
}

