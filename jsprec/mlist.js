/*
mlist
new movies page
*/

var
o_m = $( '#m1' ) ,
o_ani = $( '#aniimg' ) ,
o_table = $( '#movinfo' )
;

$( function() { _movstart(); });

//. _page(): データリスト切り替え
function _page( p ) {
	var 
	w = $( '#wait' ).slideDown( 'fast' ) ,
	o = $( '#mlist' ).fadeTo( 'fast', 0.5 );
	$( '.pgbtn' ).prop( 'disabled', true );

	$.getJSON( '?page=' + p, function( r ) {
		o.html( r.imgs ).fadeTo( 'fast', 1 ).children( 'img' ).tooltip( ttip_param );
		$( '.dbar' ).html( r.dbar );
		w.slideUp( 'slow' );
	});
}

//. _movc:
function _movc( s ) {
	//- 前回と同じならやらない
	if ( s == G.prevmid ) return;

	//- 前回のムービーアイコンの半透明化をもどす
	if ( G.prevmid != undefined )
		$( '#i' + G.prevmid ).addClass( 'idimg' ).removeClass( 'cimg' );

	G.prevmid = s;

	//- アイコンの半透明化
	var o = $( '#i' + s ).addClass( 'cimg' ).removeClass( 'idimg' );

	//- アニメーション
	o_ani.stop(1,1)
		.css({ top: o.offset().top, left: o.offset().left,
			width: o.width(), height: o.height() })
		.attr( 'src', o.attr( 'src' ) )
		.show()
		.animate({ left: o_m.offset().left, top: o_m.offset().top,
				width: o_m.width(), height: o_m.height() }, 500 )
		.fadeOut( 'normal' )
	;
	
	$.getJSON( '?mov=' + s, function( json ) {
		//- テーブル入れ替え
		o_table.html( json.table );
		//- ムービー入れ替え
		o_m._movset( json.files[ 's' ] );
		//- メッセージ
		_mvmsg( json.movid );
	});
}

