/*
stat.js
statページ用
*/

//. init
var 
colplot = 1 ,
currplot
;

//. 開始時

$( function($) {
//.. table sorter
	//- 「分解能」など数値データなら、無理やり数値にしてソート
	if ( sortint )
		$( '#maintable' ).tablesorter({
			headers:{ 0: { sorter:'digit'} },
			textExtraction: function(node) { return node.innerHTML.replace( /[^0-9]/, '' ); }
		});
	else
		$( '#maintable' ).tablesorter();
	$( '#maintable' ).bind( 'sortEnd', function(){ _sortend(); } );
	_fixhead();
});

//. sortend
function _sortend() {
//	alert( 'sort end!' );
	_fixhead();
	_hideplot();
}

//. fixhead 固定ヘッダ

var mainh = $( '#maintable thead tr' ),
	fixhshowing = 0;
;
function _fixhead() {
	if ( k2 == null ) return
	var fh = $( '#fixhead tr' ).html( '' );
	$( '#fixhead' ).width( $( '#maintable' ).width() );
	mainh.children( 'th' ).each( function() {
		var o = $( this );
		fh.append( $( '<th></th>' )
			.html( o.html() )
			.width( o.width() )
			//- ソートカラム？
			.addClass( ''
				+ ( o.hasClass( 'headerSortUp' )   ? 'headerSortUp'   : '' )
				+ ( o.hasClass( 'headerSortDown' ) ? 'headerSortDown' : '' )
			)
			//- クリック
			.click( function(){ o.click(); })
		);
	});
}

$( window ).scroll( function () {
	var w = $( document ).scrollTop(),
		h = mainh.position().top;
	;
	if  ( fixhshowing && h > w ) {
		$( '#fixhead' ).stop( 1, 1 ).fadeOut( 100 );
		fixhshowing = 0;
	} else if  ( ! fixhshowing && h < w ) {
		$( '#fixhead' ).stop( 1, 1 ).fadeTo( 500, 0.75 );
		fixhshowing = 1;
	}
})
.resize( function() {
	clearTimeout( T.fixhead );
	T.fixead = setTimeout( '_fixhead()', 500 );
});

//. クリックで検索
$( '.dlnk,.pbar' ).click( function(){
	var o = $( this ) ,
		s1 = k1v[ o.attr( 'k' ) ] ,
		s2 = k2v[ o.attr( 'sk' ) ] ,
		d = o.attr( 'd' )
//		t = o.text();
	;
	if ( s1 == undefined | o == null )
		return;
//	if ( o == null )
//		return;
//	alert( k1 + ' (' + ck1 + '):'+ s1 + ' - ' + k2 + ':' + s2 );
	window.open( urlbase + ck1 + '=1&kw=%22' + k1 + ':' + s1 + '%22' +
		( s2 == undefined ? '' : ' %22' + k2 + ':' + s2 + '%22&' + ck2 + '=1' ) +
		( d ==  undefined ? '' : '&db=' + d ) 
	);
});

//. ホバーでプロット表示
if ( k2 != null ) {
	var pb = $( '#parambox' );
	$( '#maintable th, #maintable td' ).mouseover( function(){
		var o = $( this ) ,
			r = o.attr( 'k' ) ,
			c = o.attr( 'sk' )
		;
//		pb.text( 'r=' + r + ', c='  + c );
		if ( r == undefined & c == undefined ) return;
		if ( r == undefined ) colplot = 1;
		if ( c == undefined ) colplot = 0;
		clearTimeout( T.plot );
		clearTimeout( T.hideplot );
		T.plot = setTimeout( '_plot(' + r + ',' + c + ')', 200 );
	});

	$( '#maintable' ).mouseout( function(){
		clearTimeout( T.plot );
		clearTimeout( T.hideplot );
		T.hideplot = setTimeout( "_hideplot();", 1000 );
	});
}

//. プロットを消す
function _hideplot( f ) {
	$( '.pbox' )
		.stop( 1, 1 )
		.fadeTo( 500, 0 )
		.animate( { width:0, height:0 }, 500,
			function(){
				if ( !f ) currplot = ''; 
			}
		)
	;
}
//. プロット
function _plot( r, c ) {
	//- 今のプロット同じならやらない
	var p =  colplot ? 'c' + c : 'r' + r ;
	if ( currplot == p ) return;

	currplot = p;
	_hideplot( 1 );
//	var pb = $( '#parambox' );
//	pb.text( r );
	$( '.pcell' ).removeClass( 'pcell' );

	var o, v, num = 1, dly = 1;
	if ( colplot ) {
		//- カラム
		var	w = $( window ).width() ,
			l = $( '#r0c' + c ).offset().left - $( window ).scrollLeft() ,
			psize = w / 2 / maxval ,
			pmy = 'left' ,
			pat = 'right'
		;
		//- どちらに出すか決める
		if ( l > w / 2 ) {
			pmy = 'right';
			pat = 'left';
		}

		while(1) {
			o = $( '#r' + num + 'c' + c ).addClass( 'pcell' );
			if ( ! o[0] ) break; //- なければ終わり
			v = o.text();
			if ( v > 0 ) {
				_plotsub( num, dly ,
					{ width: Math.round( v * psize ), height: o.height() - 5 } ,
					{ of: o, my: pmy, at: pat, collision: 'none' }
				);
				++ dly;
			}
			++ num;
		}
	} else {
		//- 行 (横)
		var	w = $( window ).height() ,
			t = $( '#r' + r + 'c1' ).offset().top - $( window ).scrollTop() ,
			psize = w / 2 / maxval ,
			pmy = 'top' ,
			pat = 'bottom'
		;
		//- どちらに出すか決める
		if ( t > w / 2 ) {
			pmy = 'bottom';
			pat = 'top';
		}

		while(1) {
			o = $( '#r' + r + 'c' + num ).addClass( 'pcell' );
			if ( ! o[0] ) break; //- なければ終わり
			v = o.text();
			if ( v > 0 ) {
				_plotsub( num, dly ,
					{ width: 20, height: Math.round( v * psize ) } ,
					{ of: o, my: pmy, at: pat, collision: 'none' }
				);
				++ dly;
			}
			++ num;
		}

	}
}

//. プロットサブ
function _plotsub( num, dly, ocss, opos ) {
	$( '#pb' + num )
		.stop( 1, 1 )
		.delay( dly * 50 )
		.css( ocss )
		.position( opos )
//		.fadeTo( 300, 0.7 )
		.fadeTo( 0, 0.7 )
	;
}

//. 全部表示
function _showall( f ) {
	if ( f ) {
		$( '#showall' ).hide();
		$( '.hrow' ).show();
	} else {
		$( '#showall' ).show();
		$( '.hrow' ).hide();
	}
	_fixhead();
}
