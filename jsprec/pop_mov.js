/*
pop_mov ポップアップウィンドウ用movie
*/
//. vars
var
$player = $( '#m0' ) ,
$movbox = $( '#moviebox' ) ,
$msgbox = $( '#movmsgbox' )
;

//. 開始時
$( function(){
	_mov.init();
	_slider.init();
	_rotate.init();
});

//. ウインドウ、リサイズしたとき、閉じたとき
$(window).on({
	//- リサイズで、ムービーサイズ変更
	resize: function() {
		_gmenu.resize();
		_tab.shrink();
		_timer.do_after_busy( function(){
			_mov.resized();
		});
	} ,
	//- 閉じたら、メインウインドウに伝える
	beforeunload: function(e){
		w_o && w_o._pmov && w_o._pmov.closed( window.name );
	}
});

//. [obj] _mov
_mov = {
	//.. vars
	size	: 200 ,
	size_px	: '200px',
	reso	: 's' ,
	pausing : true ,

	//.. init
	//- jplayer定義
	init: function() {
		$player.jPlayer({
			cssSelectorAncestor: '#moviebox' ,
			preload			: "auto",
			backgroundColor	: "#ffffff",
			loop			: true,
			errorAlerts		: true,
			supplied		: "m4v, webmv" ,
			size			: { width: this.size_px, height: this.size_px } ,
			click 			: function() { _play( this.pausing ) }.bind(this) ,
			solution		: 'html' ,

			//- 準備できたら、動画ファイルを指定
			ready: function() {
				_mov.resized();
				_mov.movset( phpvar.mov_url[ _mov.reso ] );
			}
		});
		this.calc_size();
	},

	//.. resized
	resized: function() {
		var prev_res = this.reso;
		this.calc_size();
		$player.jPlayer({ size: { height: this.size_px, width: this.size_px } });
		$msgbox.css({ width: this.size });
		$movbox.css({ width: this.size });
		if ( prev_res != this.reso ) {
			this.movset( phpvar.mov_url[ this.reso ] );
		}
	},

	//.. calc_size
	calc_size: function() {
		this.size = Math.min(
			$(window).height() - 50,
			$(window).width()
		);
		this.size_px = this.size + 'px';
		this.reso = this.size < 250 ? 's' : 'l';
	},

	//.. icon: アイコン変更
	$icon: $( '.mvicon' ) ,
	icon: function( f ) {
		this.$icon
			.stop( 1, 1 ).show().attr( 'src', 'img/' + f + '.gif' )
			.fadeOut( 4000 );
	} ,

	//.. msg: メッセージ変更
	//- s2: 直接出力する文字列
	$msg: $( '.mvmsg' ) ,
	msg: function( s, s2 ) {
		this.$msg
			.stop( true, true ).text( phpvar.mv_str[ s ] || s ).show()
			.fadeOut( 2000 )
		;
	} ,
	
	//.. movset
	movset: function( obj ) {
		$player
			.jPlayer( 'setMedia', obj )
			.jPlayer( this.pausing ? 'pause' : 'play' )
		;
	} ,

	//.. play
	play: function( flg, from ) {
		if ( flg ) {
			$player.jPlayer( 'play' );
			this.pausing = false;
			this.icon( 'play' );
			this.msg( 'play' );
		} else {
			$player.jPlayer( 'pause' );
			this.pausing = true;
			this.icon( 'pause' );
			this.msg( 'pause' );
		}
//		console.log( ( flg ? 'play' : 'pause' ) + ' by ' + from );
	},

	//.. orient
	orient: function( t ) {
		if ( ! this.pausing || _slider.sliding ) return;
		this.play();
		$player.jPlayer( 'pause', t );
	}, 

	//.. view
	view: function( s ){
		this.play();
		this.orient({ 
			top		: 9.6 ,
			bottom	: 13.2 ,
			left	: 1.8 ,
			right	: 5.4 ,
			front	: 0 ,
			back	: 3.6 ,
			cut		: 18.5
		}[ s ] );
		this.icon( s );
		this.msg( s );
	}
}

//. [obj] _rotate 回転
_rotate = {
	prev_mpos: { x: 0, y: 0 } , //- 1サイクル前のマウスの位置
	movgeo	: undefined, //- playerのジオメトリ

	//.. geo_reset
	geo_reset: function() {
		this.prev_mpos = { x: 0, y: 0 };
		this.movgeo = undefined;
	} ,

	//.. init
	init: function() {
		$movbox.on({
			//- ホバー アイコン、文字を出す
			'mouseenter': function(){
				_mov.msg( _mov.pausing ? 'mouse' : 'playing' );
				this.geo_reset();
			}.bind(this) ,
			'mouseleave': function(){
				this.geo_reset();
			}.bind(this) ,
			//- マウス、タッチ移動系
			'mousemove': function(e) {
				if ( _mov.pausing && !_slider.sliding )
					this.rot( e );
			}.bind(this),

			'touchstart': function( e ){
				if ( _slider.sliding ) return;
				this.rot( e );
				if ( event.changedTouches.length > 1 )
					return;

				_mov.msg( 'touch' );
				this.geo_reset();
			}.bind(this) ,

			'touchmove': function( e ){
				if ( _slider.sliding ) return;
				if ( event.changedTouches.length > 1 ) return;
				event.preventDefault();
				this.rot({
					pageX: event.changedTouches[0].pageX ,
					pageY: event.changedTouches[0].pageY
				});
			}.bind(this) //,
	//		'touchend': function( e ){
	//			_play();
	//		}
		});
	} ,

	//.. rot マウスでムービ回転
	rot: function( e ){
		var x, y, dx, dy;
		if ( _timer.busy( 50 ) ) return;

		//- ムービーボックスのジオメトリ
		if ( this.movgeo == undefined ) {
			this.movgeo = {
				w: $player.width() ,
				l: $player.offset().left,
				t: $player.offset().top
			};
		}

		//- ポインタの位置
		x = ( e.pageX - this.movgeo.l ) / this.movgeo.w - 0.5;
		y = ( e.pageY - this.movgeo.t ) / this.movgeo.w - 0.5;
		dx = Math.abs( this.prev_mpos.x - x );
		dy = Math.abs( this.prev_mpos.y - y );

		//- スライダー上、余り動いていない、ならやめ
		if ( y > 0.5 || dx + dy < 0.005 ) return;

		//- 実行
		this.prev_mpos = { x: x, y: y };
		if ( y < -0.4 ) {
			this.slice( x );
		} else if ( dx > dy ) {
			this.rot_x( x );
		} else {
			this.rot_y( y );
		}
	} ,

	//.. rot_x: 横方向
	rot_x: function(x) {
		var p, a;
		if ( x > 0 ) {
			p = 'or_l';
			_ori( x * 9.5 );
		} else {
			p = 'or_r';
			_ori( 7.0 + ( x * 9.5 ) );
		}
		a = Math.abs( x );
		_mov.icon(
			( a > 0.40 ) ? 'or_bk' :
			( a > 0.30 ) ? p + '3' :
			( a > 0.15 ) ? p + '2' :
			( a > 0.05 ) ? p + '1' : 'or_f'
		);
	} ,

	//.. rot_y: 縦方向
	rot_y: function(y) {
		var p, a;
		if ( y > 0 ) {
			p = 'or_t';
			_ori( ( y * 9.5 ) + 7.2 );
		} else {
			p = 'or_b';
			_ori( 15.0 + ( y * 9.5 ) );
		}
		a = Math.abs( y );
		_mov.icon(
			( a > 0.40 ) ? 'or_bk' :
			( a > 0.30 ) ? p + '3' :
			( a > 0.15 ) ? p + '2' :
			( a > 0.05 ) ? p + '1' : 'or_f'
		); 
	} ,

	//.. slice 断面を表示
	slice: function(x) {
		_ori( ( x + 0.5 ) * 7 + 15.5 );
		_mov.icon(
			( x < -0.2 ) ? 'or_c3' :
			( x > 0.2  ) ? 'or_c1' : 'or_c2'
		);
	}
};

//. [obj] _slider スライダー
_slider = {
	$seekbar: $( '.jp-seek-bar' ) ,
	$playbar: $( '.jp-play-bar' ) ,
	sliding: false ,
	bar_left: 0,
	bar_width: 0,

	//.. init 初期化
	init: function(){
		this.$seekbar.on({
			//- マウスダウンで開始
			'mousedown touchstart': function(e){
				this.start( e );
			}.bind(this) ,
			//- フレーム移動
			'mousemove touchmove': function(e){
				this.move(e);
			}.bind(this)
		});

		//- マウスアップで終了（どこでも）
		$( 'body' ).on({
			'mouseup touchend mouseleave': function(){
				if ( this.sliding ) this.end();
			}.bind(this) ,
			'mousemove touchmove': function(e){
				if ( this.sliding ) this.move( e );
			}.bind(this)
		});
	},

	//.. start
	start: function(e) {
		this.$playbar.addClass('playbar_active');
		this.sliding = true;
		//- バーの位置と幅取得
		this.bar_left  = this.$seekbar.offset().left + 2;
		this.bar_width = this.$seekbar.width() / 100;
		this.pos(e);
	} ,

	//.. move
	move: function( e ) {
		if ( !this.sliding || _timer.busy( 50 ) ) return;
		this.pos(e);
	} ,

	//.. end
	end: function(){
		this.sliding = false;
		this.$playbar.removeClass('playbar_active');
	} ,
	//.. pos
	pos: function( e ) {
		$player.jPlayer( 'playHead', ( e.pageX - this.bar_left ) / this.bar_width );
	}
};

//. 関数

//.. _movnum: UIから
function _movnum( n ) {
	_mov.movset( phpvar.movs_url[n][ _mov.reso ] );
	phpvar.postv.num = n;
	_gmenu.reset(true);
}

//.. _play() 再生
// f: true -> 再生
// それ以外: 一時停止
function _play( f ) {
//	w_o && w_o._pmov
//		? w_o._pmov.play( f )
//		: _mov.play( f )
//	;
	w_o._pmov.play( f )
	_mov.play( f )
}

//.. _ori 時間を受け取る、
function _ori( t ) {
//	w_o && w_o._pmov 
//		? w_o._pmov.ori( t )
//		: _mov.orient( t )
//	;
	_mov.orient( t )
	w_o._pmov.ori( t )
}

//.. _ori2  方向を受け取る
function _ori2( s ) {
//	w_o && w_o._pmov 
//		? w_o._pmov.ori2( s )
//		: _mov.view( s )
//	;
	w_o._pmov.ori2( s )
	_mov.view( s )

}
