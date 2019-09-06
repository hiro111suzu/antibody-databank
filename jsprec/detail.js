/*
detail.js
*/

var nav_single = true, //- 表 単独モード？
movsize = 200,
o_m = $( '#m1' ) ,
o_lslc = $( '.l_slc' );
cp_pos = {
	my: 'left top',
	at: 'right top',
	of: o_m,
	offset: '8, -4',
	collision: 'fit none'
}
;

window.onscroll = pos_lpane;

//. 開始時に実行
$( function() {
	_movstart();
	pos_lpane();

	//- コンパネ表示・消し
	$( '.moviebox, #conpane' )
		.hover(
			function(){ _showconpane(1); },
			function(){ _showconpane(0); }
		)
		.mousemove(
			function( e ){ _showconpane(1); } 
		)
	;

	//- スライス画像テーブルにホバー
	$( '.slc' ).hover(
		function(){ _slchov( this ); },
		function(){ _slchovr(); }
	);
	o_lslc.mouseover( function(){ $(this).stop().hide() } );
});

//. コンパネ表示
//- f=1: 表示, f=0: 0.5秒後に消す, f=-その他, すぐに消す
function _showconpane( f ) {
	if ( G.movhidden || G.cphidden ) return; //- ムービー非表示中  コンパネ非表示中
	var c = $( '#conpane' );
	if ( f == 1 ) {
		//- 表示
		clearTimeout( T.cp_hide );
		c.stop(1,1).position( cp_pos ).fadeIn( 'medium' ).css( 'opacity', 1 );
	} else if ( f == 0 ) {
		//- 半透明にして、0.5秒後に消す
		clearTimeout( T.cp_hide );
		c.stop(1,1).fadeTo( 'fast', 0.7 );
		T.cp_hide = setTimeout(
			function(){ c.stop(1,1).fadeOut( 'fast' ); } , 
			700 
		);
	} else {
		//- すぐに消す、1秒間は表示禁止
		G.cphidden = 1;
		c.stop(1,1).fadeOut( 'fast' );
		setTimeout( 'G.cphidden = 0;', 1000 ); //- 一秒間は表示禁止
	}
}

//. _hidemov: ムービー閉じる
// f=1 隠す、f=0 表示
function _hidemov( f ) {
	if ( f ) {
		//- 隠す
		_play();
		_movsz( 200 );
		$( '.msize' ).prop('disabled', false);
		$( '#conpane, .moviebox, .playbtn, .pausebtn' ).stop(1,1).hide( 'medium' );
		$( '#nomovie' ).show( 'slow' );
		$( '.movoffbtn, #downcbtn, #upcbtn' ).hide( 'fast' );
		G.movhidden = 1;

		//- ナビパネル
		$( '#navipanel' ).css( 'top', 0 );
		G.lkbup = 0;
		
	} else {
		//- 表示
		$( '#conpane, .moviebox, .playbtn' ).stop( 1, 1 ).show( 'medium' );
		$( '#nomovie, .pausebtn' ).hide( 'fast' );
		$( '.movoffbtn, #upcbtn' ).show( 'fast' );
		G.movhidden = 0;
	}
}

//. pos_lpane: 左枠、位置決め
var olp = $( '#left_pane' );

function pos_lpane(){
	var mint = _bottom( '#namebar' );
//	if ( FIREFOX )
//		mint += 6;

	var pos1 = $( document ).scrollTop() + 10;
	if ( IE6 )  {
		//- ie6 は、fixedがないので、いつも動かす
		olp.css( "top", ( pos1 < mint ) ? mint : pos1 );

/*
	} else if ( FIREFOX  && $.browser.version < 13 )  {
		//- firefox は、fixedとabsoluteを入れ替えるとムービーがリセットされる
		olp.css( ( pos1 < mint )
			? { position: 'fixed', top: mint - pos1 + 4 }
			: { position: 'fixed', top: 0 }
		);
*/

	} else {
		//- 普通の処理
		var p = olp.css( 'position' );
		if ( p == 'fixed' && pos1 < mint )
			olp.css({ position: 'absolute', top: mint });
		else if ( p == 'absolute'&& pos1 > mint )
			olp.css({ position: 'fixed', top: 0 });
	}
//	$( '#conpane' ).stop( true, true ).fadeOut( 'fast' );
	_showconpane(-1);
}

//. _navi: 指定テーブルへ
function _navi( s ) {
	if ( nav_single ) {
		$( '.dtable:visible:not(#t_' + s  + ')' ).slideUp( 'fast' );
		$( '#t_' + s + ':hidden' ).slideDown( 'medium' );
		$( '#showallbtn' ).show( 'slow' );
		pos_lpane();
		if ( IE6 )
			$('#left_pane').css( "top", _bottom( '#namebar' ) );
	}
	$( '#t_' + s ).queue( function(){
		$( 'html, body' ).animate({ scrollTop: $( this ).offset().top }, 'medium');
		$( this ).dequeue();
	});
}

//. tbtoggle: テーブルモード切替
function tbtoggle() {
	nav_single = ! nav_single;
	a = $( '#sign_a' ).css( 'background-color' );
	$( '#sign_a' ).css( 'background-color', $( '#sign_s' ).css( 'background-color' ) );
	$( '#sign_s' ).css( 'background-color', a );
	if ( nav_single ) {
		_navi( 'Entry' );
		$( '#showallbtn' ).show( 'slow' );
	} else {
		$('.dtable' ).show( "medium" );
		$( '#showallbtn' ).hide( 'slow' );
		pos_lpane();
		if ( IE6 ) // ie 6
			$('#left_pane').css( "top", _bottom( '#namebar' ) );
	}
}

//. ナビパネルを上げる
//- s = 1: 強制的に下げる
function upc() {
	var o = $( '#navipanel' );
	if ( G.lkbup ) {
		//- 下げる
		o.animate({ top: 0 }, 'fast', function(){
			$( '#downcbtn' ).hide(); $( '#upcbtn' ).show();
		});
		G.lkbup = 0;
	} else {
		//- 上げる
		o.animate({top: -200}, 'fast', function(){
			$( '#downcbtn' ).show(); $( '#upcbtn' ).hide();
		});
		G.lkbup = 1;
	}
}

//. ムービー (detailの)
//var movres = 's'; //- ムービーの解像度 (新ムービーで廃止しよう)

$( function(){
	$( '.moviebox' ).resizable({ 
		minHeight: 200, minWidth: 200, 
		distance: 7, 
		aspectRatio: true ,
		start: function( event, ui ) {
			$( '#conpane' ).hide();
			G.cphidden = 1; //- コンパネ非表示中フラグ
		},
		stop: function( event, ui ) {
			_movsz( ui.size.width, 1 );
			G.cphidden = 0; //- コンパネ非表示中フラグ
		}
	});
});

//. _mch: ムービー切り替え
//- num: ムービー番号
//- f: ?

function _mch( num, f ) {
	movnum = num;
	//- 切り替え
	o_m._movset( mv_files[ movnum ][ movres ] );

	//- ムービーキャプションの番号を装飾
	$( '.midx' ).removeClass( 'midxc' );
	$( '.midx' + num ).addClass( 'midxc' );

	//- メッセージ
	_mvmsg( 'mov', num );
}

//. _movsz: ムービーサイズ変更
function _movsz( s, flg ) {
//- flg: アニメーション無しフラグ: 廃止
	if ( G.movhidden ) { //- ムービー非表示中なら表示する
		_hidemov(0);
//		alert( 'show' );
	}

	var ss = s + 'px';
	o_m.css({ height: s,  width: s })
		.jPlayer({ size: { height: ss, width: ss } });
	$( '.mvmsgbox' ).css({ width: s });
	$( '.moviebox' ).css({ height: 'auto', width: 'auto' });

	$( '#conpane' ).hide();
	G.cphidden = 1; //- コンパネ消し、アニメーション終わるまで表示なし
	$( '#conpane:visible' ).hide();
	$( '#right_pane' ).animate({marginLeft: s + 20 }, 'fast', function(){ G.cphidden = 0; } );

	//- ムービー、解像度きりかえ
	movres = ( s < 300 ) ? 's' : 'l';
	_mch( movnum );

	//- ボタンのactivation
	$( '.msize' ).prop('disabled', false);
	$( '.ms' + s ).prop('disabled', true);
}

//. _entimg: 構成要素のアニメーション
function _etimg( i ) {
	//- ムービー切り替え
	pausing = 1;
	_mch( etimg.depnum );
	_mvmsg( 'comp', ' #' + i );
	//- ボックス挿入（初回のみ）
	if ( etimg.div != '' ) {
		$( '.moviebox' ).prepend( etimg.div );
		etimg.div = '';
	}
//	alert( etimg.replace( /_eid_/g, i ) );

	//- アニメーション
	var s = o_m.width();
	$( '#etimgb' ).show().css({ width: s, height: s })
		.html( etimg.html.replace( /_eid_/g, i ) );
	$( '#etimg1' )	.fadeIn( 250 ).delay( 500 ).fadeOut( 250 )
					.fadeIn( 250 ).delay( 500 ).fadeOut( 250 );
	$( '#etimg2' )	.delay( 250 ).fadeIn( 250 ).fadeOut( 250 )
					.delay( 500 ).fadeIn( 250 ).fadeOut( 250,
						function(){ _play(1); $( '#etimgb' ).hide();
					});
}

//. _slchov: スライス要素にホバー
function _slchov( o ) {
	if ( G.pssizing ) return; //- サイズ変更中はやらない
	//- hoverされた要素
	var i = $( o ).attr( 'id' ) ,
		ang = i.substr( 4, 1 ) ,
		lev = i.substr( 5, 1 ) ,
		oi, msg, c_ang, c_lev, l, t, w, h, iwid, ihei, iof ,
		ar1 = [ 'z', 'y', 'x' ], ar2 = [ 'a', 'b', 'c', '_', 's' ]
	;
	o_lslc.stop(1,1).fadeOut( 0.5 );

	for ( var i1 in ar1 ) for ( var i2 in ar2 ) {
		c_ang = ar1[ i1 ];
		c_lev = ar2[ i2 ];
		if ( c_ang == ang ) continue;

		oi = $( '#slc_' + c_ang + c_lev ); //- 線を引く対称の画像オブジェクト
		if ( oi.length === 0 || ! oi.is( ":visible" ) ) continue; //- 絵がないならやらない

		var iwid = oi.width() ,
			ihei = oi.height() ,
			iof  = oi.offset()
		;
		var ani1 = ( ang == 'z' || ( ang == 'y' && c_ang == 'z' ) )
			//- 横モード
			? {
				opacity: 1,
				top: 	iof.top + Math.round( ihei * lv2r[0][ c_ang ][ lev ] ) + 1 ,
				left: 	iof.left + 2 ,
				width: 	iwid - 2 ,
				height: 0
			}
			//- 縦モード
			: {
				opacity: 1,
				top: 	iof.top + 2 ,
				left: 	iof.left + Math.round( iwid * lv2r[1][ c_ang ][ lev ] ) + 1 ,
				width: 	0 ,
				height: ihei - 2
			},
			//- アニメーション（表面、投影）
			ani2 = {
				top		: iof.top  + 2 ,
				left	: iof.left + 2 ,
				width	: iwid - 2 ,
				height	: ihei - 2
			}
		;
		
		if ( lev == 's' || lev == '_' ) //- 表面、投影
			$( '#l_slc_' + c_ang + c_lev ) //- 線のオブジェクト
				.stop(1,1)
				.animate( ani1, 10 )
				.animate( ani2, 800 )
				.animate( ani1, 10 )
				.fadeTo( 2000, 0.6 )
			;
		else //- 断面
			$( '#l_slc_' + c_ang + c_lev ) //- 線のオブジェクト
				.stop(1,1)
				.show()
				.animate( ani1, 'fast' )
				.fadeTo( 2000, 0.6 )
			;
	}
}

//- ホバーout
function _slchovr( s ) {
	o_lslc.stop(1,1).fadeOut( s == undefined ? 2000 : s );
}

//. _pssize: スライス画像大きさ
function _pssize( size, obj ) {
	G.pssizing = 1;
	o_lslc.hide(); //- スライスの線を消す
	_slchovr( 100 );
	$( '#pstable td img' ).each( function(){
		var o = $(this) ,
			w = o.width ,
			h = o.height ,
			src = o.attr( 'src' ) ,
			sizeto = ( w > h )
				? { width: 'auto', height: size }
				: { width: size, height: 'auto' }
			,
			src = size == 100
				? src.replace( 'png', 'jpg' )
				: src.replace( 'jpg', 'png' )
		;
		o.animate( sizeto, 'slow', function(){ G.pssizing = 0; }).attr( 'src', src );
	});

	//- ボタンを無効に
	$( '.pssize' ).prop('disabled', false);
	$( obj ).prop('disabled', true );

	//ｰ 大きくしたときは前面に出す
	$( '#t_Map' ).css({ position: 'relative', zIndex: (size > 100 ? 200 : 0 ) });
	if ( size > 100 ) {
		$( '#pstable tr th .xbtn' ).show( 'medium' );
	} else {
		$( '#pstable tr th .xbtn' )
			.hide( 'medium' ).attr( 'onclick', '_hidepsrow(this)' ).text( 'X' );
		$( '#pstable td' ).show( 'medium' );
	}
}

//. _hidepsrow: スライス画像隠す
function _hidepsrow( o, flg ) {
	var o = $( o ), p = o.parent( 'th' );
	if ( flg == undefined ) {
		o.attr( 'onclick', '_hidepsrow( this, 1 )' ).text( ' + ' );
		p.children( 'p' ).hide( 'medium' );
		p.nextAll( 'td' ).hide( 'medium' );
	} else {
		o.attr( 'onclick', '_hidepsrow( this )' ).text( 'X' );
		p.children( 'p' ).show( 'medium' );
		p.nextAll( 'td' ).show( 'medium' );
	}
}
