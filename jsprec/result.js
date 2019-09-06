/*
result.js
resultページ用
*/

var
tid = -1 , //- タイマーID
formcont //- フォームの内容をシリアライズしたもの
;

//. 開始時
$( function() { 
	//- ポップアップ
	$( '.idcol' ).hover( function(){
		var t = $( this ).addClass( 'psel' ) ,
			o = t.offset(),
			w = 300;
		if ( tid != -1 )
			clearTimeout( tid );
		else
			w = 10;
		tid = setTimeout( function(){
			$( '#popup' ).hide().text('')
				.css( { top: o.top, left: o.left + t.width() - 10 } )
				.load( "ajax_id2img.php?m=p&id=" + t.text()  )
				.fadeIn( 'medium' );
		} , w );
	}, function(){
		$( this ).removeClass( 'psel' );
		clearTimeout( tid );
	});
	
	//- フォーム内容に変更
	$( '#form1' )
		.change( function(){ _changed(); } )
		.keyup( function(){ _changed(); } )
	;
	
	//- カウントをクリック
	_jmp();
	
	//- フォームの内容を取得
	formcont = $( '#form1' ).serialize();
});

//. func: _jump: ジャンプリストをjavasriptの読み込みに変更する
function _jmp(){
	$( '.jmp' )
		.attr( 'href', 'javascript:void(0);' )
		.click( function(){
			_startsearch( 'from=' + $( this ).attr( 'cnt' ) );
		})
	;
}

//. func: _changed: 検索条件に変更
function _changed() {
	//- 内容が変わってなかったら、おしまい
	var f = $( '#form1' ).serialize();
	if ( formcont == f ) return;
	formcont = f;

	$( '#result, .cnt' ).fadeTo( 'fast', 0.5 );
	clearTimeout( T.waitsearch );
	T.waitsearch = setTimeout( '_startsearch()', 1000 );
}

function _startsearch( s ) {
	s = ( s != undefined ) ? s + '&' : '';
	$.getJSON( '?aj=1&' + s + $( '#form1' ).serialize(), function( json ) {
		$( '.cnt' ).html( json.counter ).fadeTo( 'fast', 1 );
		$( '#result' ).html( json.result ).fadeTo( 'fast', 1 );
		if ( json.hide )
			$( '#form2' ).hide();
		else
			$( '#form2' ).show();
		_jmp(); //- ジャンプリストをスクリプトに改造
	});
}

//. func: _pophide
function _pophide(){ $( '#popup' ).hide(); }

//. ソート条件の変更
function _tsort( s, r ) {
	$( '#tsort' ).val( s );
	$( '#trev' ).val( r );
	_startsearch();
}
