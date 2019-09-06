//. 開始時に実行
var 
	zmax = 10000,
	shown = {},
	mousex, mousey ,

//	f = $( '#form' ),
//	mmaptop0 = f.height() + 10,
//	mmaptop1 = f.position().top + f.height() + 10,
	mmapsize = 150,
	cont = {} ,
	o_w = $( window ) ,
	o_pf = $( '#pframe' ) ,
	o_idbox = $( '#idbox' ) ,
	//- css
	stshown  = { backgroundColor: 'white'      , padding: 3 } ,
	sthidden = { backgroundColor: 'transparent', padding: 0 } ,
	anishown = { height: 104, width: 300 } ,
	kw
;

$( function() {
	kw = encodeURI( $( '#kwbox' ).val() );

	//.. サイズスライダー
	$( '#zslider' ).slider({
		min: 20, max: 80, value: Math.sqrt( size ), orientation: 'vertical',
		start: function( event, ui ) {
			var	
				cx = o_w.width() / 2 ,
				cy = o_w.height() / 2 ,
				r = size / 8000,
				sx = r * cx ,
				sy = r * cy
			;
			//- 中心
			$( '#zfx' ).css( _lt( cx - 10, cy )).fadeIn( 'fast' );
			$( '#zfy' ).css( _lt( cx, cy - 10 )).fadeIn( 'fast' );

			//- 枠
			$( '#zframe, #zfc' )
				.stop( 0, 0 )
				.css( _ltwh( cx - sx, cy - sy, sx * 2, sy * 2 ))
				.fadeIn( 'fast' )
			;
		} ,
		slide: function( event, ui ) {
			var 
				cx = o_w.width() / 2  ,
				cy = o_w.height() / 2  ,
				r  = Math.pow( ui.value, 2 ) / 8000 ,
				sx = r * cx ,
				sy = r * cy
			;
			$( '#zframe' ).css( _ltwh( cx - sx, cy - sy, sx * 2, sy * 2 ) );
		} ,
		stop: function( event, ui ) {
			var s = Math.pow( ui.value, 2 );
			if ( s != size )
				_size( s );
			else
				$( '#zframe, #zfx, #zfy, #zfc' ).fadeOut( 'medium' );
		}
	});
//	_getplot();
//	$( '#form' ).draggable();
	//.. pframe プロット枠
	o_pf
//		.draggable({ cursor: 'move', stop: function(){ _mmapbox(); } })
		.draggable({ cursor: 'move', drag: function(){ _mmapbox(); } })
//		.draggable({ stop: function(){ _mmapbox(); } })
//		.draggable()
		.mousemove( function( e ){
			mousex = e.pageX;
			mousey = e.pageY;
		})
		.dblclick( function(){
			var 
				p = $( this ).position() ,
				cx = o_w.width() / 2  ,
				cy = o_w.height() / 2  ,
				x = cx - mousex + p.left ,
				y = cy - mousey + p.top
			;
			$( '#zfx' ).css( _lt( cx - 10, cy ));
			$( '#zfy' ).css( _lt( cx, cy - 10 ));
			$( this ).animate( _lt( x, y ), 'medium' );
			$( '#zfx, #zfy' ).fadeIn( 'fast' ).fadeOut( 'slow' );
			_mmapbox( x, y );
		})
	;
	//.. idbox: ID入力
	$( '#kwbox' ).change( function(){ _kw() });

	//.. ミニマップ
	$( '#mmapbox' )
		.draggable({ cursor: 'move', drag: function(){ _mmapmove(); } })
	_fboxpos();
	$( '#mmap' ).fadeIn( 'slow' );
	_mmapbox();
	o_w.bind( 'resize', _mmapbox );

	//.. フォーカス
	if ( initid != '' ) {
		_focus( initid );
		initid = '';
	}

	_sethov();
});

//. トップを隠す
function _hidetop( f ) {
	if ( f ) {
		$( '#topbar, #toptab, #placebar, #ti_div' ).slideUp( 'fast', function(){
			$( '#hidetop' ).hide();
			$( '#showtop' ).show();
			_fboxpos();
		});
	} else {
		$( '#topbar, #toptab, #placebar, #ti_div' ).slideDown( 'fast', function(){
			$( '#hidetop' ).show();
			$( '#showtop' ).hide();
			_fboxpos();
		});
	}
}
//. _fboxpos: コントロールの位置を調節
function _fboxpos() {
	$( '#fbox' ).css( 'top', $( '#top' ).height() );
}

//. _idchange: IDボックスに入力
function _idchange(){
	var id = o_idbox.val();
	if ( /^[0-9][0-9a-z]{3}$/.test( id ) ) {
		//- IDぽい
		if ( $( '#' + id ).length ) { //- あるなら青、ないなら赤
			o_idbox.css( 'background-color', '#c0c0ff' );
			_focus( id );
		} else {
			o_idbox.css( 'background-color', '#ffc0c0' );
		}
	} else {
		//- IDじゃない
		o_idbox.css( 'background-color', 'white' );
	}
}

//. _showkwadd: 検索ボックスの表示追加
function _showkwadd() {
	$( '#kwbox' ).attr( 'size', 30 );
	$( '#kwadd' ).show( 'fast' );
}

//. _hidekwadd: 検索ボックスの追加消し
function _hidekwadd() {
	$( '#kwbox' ).attr( 'size', 20 );
	$( '#kwadd, #searching, #nohit ' ).hide( 'fast' );
}

//. p: 画像表示
function p( id, f ) {
// f: trueならボックスを広げるのをアニメーションしない
	//- 隠しアニメ中だったらやらない
	if ( G.hiding == id ) return;

	$( '#hideallbtn' ).show( 'fast' );

	var o = $( "#" + id );
	//- 取得
	if ( cont[ id ] == undefined )
		 $.get( "ajax_id2img.php?m=o&id=" + id, null, function( data ){ 
			o.html( data );
			cont[ id ] = data;
		});

	//- 表示
	$( "#" + id ).css( stshown )
		.animate( anishown, f ? 0 : 'fast' )._ztop().html(
			( cont[ id ] == undefined ) ? 'loading' : cont[ id ] );
	shown[ id ] = true;
}

//. _c: 隠すボタン
function _c( id ) {
	if ( typeof id  == 'object' ) 
		id = $( id ).parent().attr( 'id' );

	G.hiding = id;
	$( '#' + id ).stop( true, true ).html( ' ' )
		.css( sthidden ).animate( anihidden, 'fast' )
	delete shown[ id ];
	setTimeout( "G.hiding=0", 300 );
}

//. _o: 表示
function _o( o ) {
	p( $( o ).attr( 'id' ) );
}

//. _hideall: 全て隠す
function _hideall(){
	$( '.e, .p, .h' ).html( ' ' ).css( anihidden ).css( sthidden );
	shown = {};
	$( '#hideallbtn' ).hide( 'fast' );
}

//. _size: サイズ変更
function _size( v ) {
	var
		p = o_pf.position() ,
		cx = o_w.width() / 2 ,
		cy = o_w.height() / 2 ,
		relx = ( cx - p.left ) / size ,
		rely = ( cy - p.top  ) / size
	;
	size  = ( v > 100 ) ? v :  size * v;
	_getplot();
	o_pf.hide().css( _lt( cx - size * relx, cy - size * rely ) );
}

//. _kw キーワード
//: selectなら、select object
function _kw( o ) {
	_tour( 1 );

	if ( o != undefined ) {
		//- selectから受け取った
		kw = $( o ).children(':selected').text();
		$( '#kwbox' ).val( kw );
	} else {
		//- 入力ボックスから取得
		kw = $( '#kwbox' ).val();
	}

	if ( kw == '' ) {
		_clearres();
		return;
	}
//	alert( encodeURI( kw ) );

	$( '#numhit, #nohit' ).hide();
	$( '#searching' ).show( 'medium' );

//	_getplot();
	$( '.e, .p' ).addClass( 'h' ).css( 'z-index', 10 );
	$.getJSON( '?kw=' + encodeURI( kw ), function( json ) {
		//- id保存
		G.resids = json.ids;
		delete G.tourids;
		
		//- 色つけ
		for ( var i in json.ids ) {
			$( '#' + json.ids[ i ] ).removeClass( 'h' ).css( 'z-index', 100 );
		}

		//- 結果表示
		if ( json.num != 0 ) {
			//- なし
			$( '#numhit' ).show( 'medium' ).children( 'span' ).text( json.num );
			_hidekwadd();
		} else {
			//- なし
			$( '#numhit, #searching' ).hide();
			$( '#nohit' ).show( 'medium' );
		}
	});
}

//. _tour(): ツアー
//- f: 1なら、ストップ
function _tour( f ) {
	if ( f ) {
		//- pause
		$( '#starttourbtn, #shownextbtn' ).show();
		$( '#stoptourbtn' ).hide();
		clearInterval( T.tour );
	} else {
		//- start
		$( '#starttourbtn, #shownextbtn' ).hide();
		$( '#stoptourbtn' ).show();
		_shownext();
		T.tour = setInterval( function() {
			_shownext();
		}, 3000 );
	}
}

//. _shownext: 一つ表示
function _shownext() {
	if ( G.tourids == undefined )
		G.tourids = G.resids.concat(); //- 配列コピー
	var id = '';
	while ( $( '#' + id ).length == 0 ) {
		if ( G.tourids.length == 0 ) { //- おしまい？
			delete G.tourids;
			_tour( 1 );
			return;
		}
		id = G.tourids.shift();
	}
	_focus( id );
	o_idbox.val( id );
	setTimeout( '_c("' + id + '")', 40000 );
}

//. _clearres: 結果をクリア
function _clearres() {
	_tour(1);
	delete resids;
	$( '.h' ).removeClass( 'h' );
	$( '#numhit, #nohit' ).hide( 'fast' );
	$( '#kwbox' ).val('');
}

//. _getplot: プロット取得
function _getplot( x, y ) {
//	if ( ! IE ) // IE対策
	$( '#dark' ).fadeTo( 'fast', 0.2 );
//	alert( 'db: ' + db + ' / kw: ' + kw );
	kw = encodeURI( $( '#kwbox' ).val() );
//	alert(kw);
	o_pf.load( "omokagemap.php?aj=1"
//		 + "&size=" + size + "&db=" + db + "&kw=" + kw + '&mode=' + mode, '' ,
		 + "&size=" + size + "&kw=" + kw + '&mode=' + mode, '' ,
		 function() {
			//- ホバー
			_sethov();
			o_pf.width( size + 40 ).height( size + 40 ).show();
			for ( var id in shown ){
				p( id, 2 );
			}
			var c = $( '#zframe' );
			var cp = c.position();
			$( '#zfc:visible' ).animate(
				_ltwh( cp.left, cp.top, c.width(), c.height() ) ,
				'slow', '' ,
				function(){
					$( '#zframe, #zfx, #zfy, #zfc' ).fadeOut( 'fast' ); 
					$( '#dark' ).fadeOut( 'fast' );
				}
			);
			if ( initid != '' ) {
				_focus( initid );
				initid = '';
			}
			_mmapbox( );
		}
	);
}

//. _chmod モード変更テスト用
function _chmod( m ) {
	mode = m;
	$( '#form button' ).prop( 'disabled', false );
	$( '#mode' + m ).prop( 'disabled', true );
	_getplot();
}

//. _sethov: ボックスのホバー設定
function _sethov() {
	$( '.e, .p, .h' ).mouseenter( function(){ $(this)._ztop() } );
}

//. _focus: 任意のIDにフォーカス
function _focus( id ) {
	var pt = $( "#" + id ).position(),
		cx = o_w.width()  / 2 - pt.left - 150,
		cy = o_w.height() / 2 - pt.top  - 50;
	o_pf.animate( _lt( cx, cy ), 'medium', '', function() { p( id, 1 ); } );
//	o_pf.animate( _lt( cx, cy ), 'medium', '', p( id, 1 ));
	_mmapbox( cx, cy );
}

//. _mmapsize: ミニマップのサイズ変更
function _mmapsize() {
	mmapsize = { 0: 150, 150: 250, 250: 0 }[ mmapsize ];
	var h = mmapsize;
	if ( mmapsize == 0 ) {
		$( '#mmapbox' ).hide();
		h = 80;
	}
	$( '#mmapbtn' ).stop( 1, 1 ).show().animate({ height: h }, 'medium' );
	$( '#mmapimg' ).stop( 1, 1 ).show().animate({ width: mmapsize, height: mmapsize }, 'medium' );
	_mmapbox();
}

//. _mmapbox: ミニマップボックスを移動
function _mmapbox( pl, pt ) {
	if ( mmapsize == 0 ) return;

	if ( pt == undefined )
		var pt = o_pf.position().top;
	if ( pl == undefined )
		var pl = o_pf.position().left;

	var s = size / mmapsize , // * 0.95
		mpos = $( '#mmapimg' ).position()
	;
	$( '#mmapbox' ).show().stop(1,1).animate( _ltwh(
		mpos.left - pl / s ,
		mpos.top  - pt / s ,
		o_w.width()  / s ,
		o_w.height() / s
	), 'fast' );
}

//. _mmapmove: ミニマップ => マップを移動
function _mmapmove() {
	var s = size / mmapsize,
		mb = $( '#mmapbox' ).position(),
		mi = $( '#mmapimg' ).position()
	;
	o_pf.stop(1,1).animate( _lt(
		( mi.left - mb.left ) * s ,
		( mi.top  - mb.top  ) * s 
	), 'fast' );
}

//. jquery func
jQuery.fn.extend({
	_ztop: function() {
		zmax ++; 
		return this.css( 'z-index', zmax );
	}
});

//. _lt(), _ltwh
function _lt( l, t ) {
	return { left: l, top: t };
}

function _ltwh( l, t, w, h ) {
	return { left: l, top: t, width: w, height: h };
}
