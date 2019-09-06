/*
movie
ムービーのあるページに共通のjs
*/

//- o_mv ムービープレーヤーオブジェクト
var o_mv, o_mvicon, o_mvmsg,
pausing = 1,
//newmov = 1,
prevm = {} , //- 1サイクル前のマウスの位置
msldcol = { def:'#aaa', act:'#e77' }
;

//. jQuery関数追加
jQuery.fn.extend({
	_movset: function( obj ) {
		return $( this )
			.jPlayer( 'setMedia', obj )
			.jPlayer( pausing ? 'pause' : 'play' )
		;
	}
});

//. jplayer初期化
if ( movsize == undefined )
	var movsize = mv_param.size;

var
	//movsize = mv_param.size;
	movres = ( movsize < 300 ? 's' : 'l' )
;


$( function(){ for ( var i in mv_param.boxids ) {
	_jp_init( mv_param.boxids[ i ] );
}});

function _jp_init( boxid ) {
	var mpx = movsize + 'px';
	$( '#' + boxid ).jPlayer({
		cssSelectorAncestor: '#a_' + boxid ,
		preload			: "auto",
		backgroundColor	: "#ffffff",
		loop			: true,
//		errorAlerts		: true,
//		supplied: "flv, webmv, m4v" ,
		supplied: "webmv, m4v" ,
		size: { width: mpx, height: mpx } ,
		click : function() { _play( pausing ) } ,

//		play : function() { _play(1); },
//		pause: function() { _play(); }
		// Jplayer.swfのパス
//		swfPath: "js/",
		solution: mv_param.flash ? 'flash, html' : 'html, flash' ,

		//- 準備できたら、動画ファイルを指定
		ready: function() {
			//- boxidの中身は変わってしまう、その都度とりだす
			$(this)._movset( mv_param[ $(this).attr( 'id' ) ][ movres ] );
		}
	})
//		.bind($.jPlayer.event.play, function(event) {
//			$( '#src' ).text(
//				event.jPlayer.status.src
//				+ ( event.jPlayer.version.flash != 'n/a' ? ' [Flash]' : ' [html5]' )
//			);
//		});
	;
}

//. _movstart: ムービー初期化
function _movstart() {
	
	//- ムービーオブジェクト
	o_mv = $( '.player:visible' );
	o_mvicon = $( '.mvicon' );
	o_mvmsg = $( '.mvmsg' );

	//..  ホバー
	//- アイコン、文字を出す
	$( '.moviebox' ).hover(
		function(){
			_mvmsg( pausing ? 'mouse' : 'playing' );
			prevm = { x: 0, y: 0 };
			G.movgeo = undefined;
		} ,
		function(){
			prevm = { x: 0, y: 0 };
			G.movgeo = undefined;
//			$( this ).css( 'border', 'none' );
		}
	)

	//..  マウス
	.mousemove( function( e ){
		if ( !pausing ) return;

		//- タイマー
		if ( G.mousetimer ) return;
		G.mousetimer = 1;
		setTimeout( 'G.mousetimer=0', 100 );

		//- ムービーボックスのジオメトリ
		if ( G.movgeo == undefined ) {
			var t = $( this );
			G.movgeo = {
				w: t.width() ,
				l: t.offset().left + 3 ,
				t: t.offset().top + 3
			};
		}

		//- ポインタの位置
		var x = ( e.pageX - G.movgeo.l ) / G.movgeo.w - 0.5 ,
			y = ( e.pageY - G.movgeo.t ) / G.movgeo.w - 0.5 ,
			//- 移動量 絶対値
			dx = Math.abs( prevm.x - x ) ,
			dy = Math.abs( prevm.y - y )
		;

		//- スライダー上、余り動いていない、ならやめ
		if ( y > 0.5 || dx + dy < 0.005 ) return;

		if ( y < -0.4 ) {
			//- 断面を表示
			orient( ( x + 0.5 ) * 7 + 15.5 );
			_mvicon(
				( x < -0.2 ) ? 'or_c3' :
				( x > 0.2  ) ? 'or_c1' : 'or_c2'
			);

		} else {
			if ( dx > dy ) {
				//- 横方向
				if ( x > 0 ) {
					var p = 'or_l';
					orient( x * 9.5 );
				} else {
					var p = 'or_r';
					orient( 7.0 + ( x * 9.5 ) );
				}
				var a = Math.abs( x );
				_mvicon(
					( a > 0.40 ) ? 'or_bk' :
					( a > 0.30 ) ? p + '3' :
					( a > 0.15 ) ? p + '2' :
					( a > 0.05 ) ? p + '1' : 'or_f'
				); 
			} else {
				//- 縦方向
				if ( y > 0 ) {
					var p = 'or_t';
					orient( ( y * 9.5 ) + 7.2 );
				} else {
					var p = 'or_b';
					orient( 15.0 + ( y * 9.5 ) );
				}
				var a = Math.abs( y );
				_mvicon(
					( a > 0.40 ) ? 'or_bk' :
					( a > 0.30 ) ? p + '3' :
					( a > 0.15 ) ? p + '2' :
					( a > 0.05 ) ? p + '1' : 'or_f'
				); 
			}
		}
		prevm = { x: x, y: y };
	});

	//..  ムービースライダー
	//- マウスダウンで開始
	$( '.jp-seek-bar' ).mousedown( function( e ) {
		var o = $( this );
		o.children( '.jp-play-bar' ).css( 'background-color', msldcol.act );
		T.msld = 0;
		G.msldflg = 1;
		G.msld = {
			l: o.offset().left + 2,
			w: o.width() / 100
		};
		o_mv.jPlayer( 'playHead', ( e.pageX - G.msld.l ) / G.msld.w );
	})

	//- フレーム移動
	.mousemove( function( e ){
		if ( ! G.msldflg ) return;
		//- タイマー
		if ( T.msld ) return;
		T.msld = 1;
		setTimeout( 'T.msld=0', 100 );
		//- スライダー操作
		var t = $( this );
		o_mv.jPlayer( 'playHead', ( e.pageX - G.msld.l ) / G.msld.w );
	})
	;

	//- マウスアップで終了（どこでも）
	$( 'body' ).mouseup( function(){
		if ( G.msldflg ) {
			G.msldflg = 0;
			$( '.jp-play-bar' ).css( 'background-color', msldcol.def );
		}
	});
}

//. _movcon ムービーコントロール
function _movcon( c, o ) {
	if ( G.movhidden ) return; //- ムービー非表示中
	o_mv.jPlayer( c, o );
}

//. _mvicon: ムービーの中のアイコン変更
function _mvicon( f ) {
	o_mvicon.stop( 1, 1 ).show().attr( 'src', 'img/' + f + '.gif' ).fadeOut( 4000 );
}

//. _mvmsg: ムービーの中のメッセージ変更
//- s2: 直接出力する文字列
function _mvmsg( s, s2 ) {
	if ( G.primvmsg ) return;

	o_mvmsg.stop( true, true )
		.hide().text(
			( phpvar.mv_str[ s ] || s )
			+ 
			( s2 != undefined ? s2 : '' ) 
		).show()
		.fadeOut( 2000 )
	;
}

//. _play() 再生
// f: true -> 再生
// それ以外: 一時停止

function _play( f ) {
	if ( f ) {
		o_mv.jPlayer( 'play' );
		$('.playbtn').hide();
		$('.pausebtn').show();
		pausing = 0;
		_mvicon( 'play' );
		_mvmsg( 'play' );
	} else {
		o_mv.jPlayer( 'pause' );
		$('.playbtn').show();
		$('.pausebtn').hide();
		pausing = 1;
		_mvicon( 'pause' );
		_mvmsg( 'pause' );
	}
}

//. _orient 方向
function orient( t ) {
	if ( ! pausing )
		_play();
	_movcon( 'pause', t );
//	if ( ! pausing ) _play();
}

function orient2( s ) {
	orient({ 
		top		: 9.6 ,
		bottom	: 13.2 ,
		left	: 1.8 ,
		right	: 5.4 ,
		front	: 0 ,
		back	: 3.6 ,
		cut		: 18.5

	}[ s ] );
	_mvicon( s );
	_mvmsg( s );
}

