/*
gallery
*/

//. ツールチップ
$(function() {
	$('.tt').tooltip( ttip_param );
});

var
loaded = {},
postv = { e: 2, p: 'a', s: 's' },
isize = 75
;

//. _toggle トグル
function _toggle( s ) {
	_get( s );
	$( '#a_' + s ).stop( true, true ).slideToggle( 'normal' );
}

//. _alone: それだけ表示
function _alone( s ) {
	_get( s );
	$( '.imgarea:not(#a_' + s  + ')' ).stop( true, true ).slideUp( 'medium' ,
		function(){ $( '#a_' + s ).stop( true, true ).slideDown( 'medium' ); }
	);
}

//. _reload: 再読み込み
function _reload( s ) {
	_get( s );
	$( '#a_' + s ).stop( true, true ).slideUp( 'fast' ).slideDown( 'fast' );
}

//. _all: 全部表示
function _all() {
	//- 全部表示してたら、全部隠す
	if ( $( '.imgarea:visible' ).length == cates.length ) {
		$( '.imgarea' ).stop( true, true ).hide();
	} else {
		$( '.imgarea' ).stop( true, true ).show();
		for ( var i in cates )
			_get( cates[ i ] );
	}
}

//. _get: 読み込み
//- 他の読み込みが終わるまで待つ
function _get( s ) {
	if ( loaded[ s ] ) return;		//- 既読？
	$( '#r_' + s ).hide( 'fast' );	//- 再読み込みボタンを消す
	$( '#w_' + s ).slideDown( 'fast' ); //- お待ち下さいバー出す
	if ( G.loading )
		setTimeout( '_get("' + s + '");', 500 );
	else
		_getmain( s );
}

//. _getmain: 読み込みメイン
function _getmain( s ) {
	G.loading = 1;
	$( '#a_' + s ).load( '?cate=' + s, postv, function() {
		//- ツールチップ初期化
		$( this ).children( 'a' ).tooltip( ttip_param );
		//- お待ち下さいバーしまう
		$( '#w_' + s ).slideUp( 'slow' );
		//- 画像サイズ再設定
		$( '.imgarea img' ).height( isize ).width( isize );
		$( this ).fadeTo( 'medium', 1 );
		loaded[ s ] = 1;
		G.loading = 0;
	});
}

//. フォームの内容変化
function _emode( o ) {
	postv[ 'e' ] = o.value;
	_relbtn();
}
function _pmode( o ) {
	postv[ 'p' ] = o.value;
	_relbtn();
}
function _size( o ) {
	postv[ 's' ] = o.value;
	isize = { 'vs': 50, 's': 75, 'm': 100, 'l': 200 }[ o.value ];
	$( '.imgarea img' ).height( isize ).width( isize );
	_relbtn();
}

//. リロードボタン
function _relbtn() {
	loaded = {};
	$( '.imgarea:hidden' ).html( '' );
	$( '.imgarea:visible' ).fadeTo( 'medium', 0.6 );
	//- 再読み込みボタン表示
	for ( var i in cates ) {
		if ( $( '#a_' + cates[ i ] ).is( ':visible' ) )
			$( '#r_' + cates[ i ] ).show( 'fast' );
	}
	$( '.tglbtn' ).fadeOut( 'fast' ).fadeIn( 'fast' );
}
