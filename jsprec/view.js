//. init
//.. グローバル変数 UI関係
var 
zmax = 1000,	// z-index初期値
mdist = 8,		// マウスドラッグの感度
timer = {},		//- タイマーID
busy = 0,		//waitで使用
hidden = {},	// 隠しているパネル
anifid = 0,		//- アニメーションフレームのID、巡回させる
apmax = {},		//- アプレットを最大化したときの、もとの大きさと位置
lastselobj ,	//- 前回選択したときのオブジェクト
U = {} ,		//- ui関係ハッシュ
G = {} ,
prime = ( 0 < $( '#ctrl_prime' ).length ) //- primeならtrue

;
G.col_cpk_nc = true;
G.col_cpk_lig = true;

//var ttip_param = { track: false, left: 0, delay: 150, showURL: false };
/*
U.lastact: 最後にアクティブにしたパネル、もう一度表示しようとすると隠すため
U.apdown: コントロールパネル出したときに、アプレットをずらしたか

*/

//.. グローバル変数 ビューア関係
var 
curzoom = 100,	// 現在のズーム
zshade = 60,	//- jmol zshade
selmodef = ( _jmol		//選択モード
	? { 'halo':true, 'center':true } 
	: { 'halo':true, 'blink':true }
) , //選択モード
loaded = {},	//- 読み込んだモデル
loadedmap,		//- 後から読み込んだマップ
loadedef = {},	//- 読み込んだ efvet

blinkcnt = 0,	//- jv点滅カウント

pickselmode,	//- マウス選択モード
cmodel = 0,		//- 現在表示中のNMRモデル

fileid = 2,			//- 新しく読み込むファイルのID
f_mcol,			//- マップの色を変更したか
define='',		//- モデルの定義用文字列

slbthick = -1,	//- salb厚さを固定
slbcenter = -1, //- salb中心を固定
A = {},			//- アプレット関係ハッシュ
/*
A.busy_surf: 計算中フラグ 表面モデル
A.busy_str:  計算中フラグ 構造
*/
selecting,		//- 選択要素してるか
cursurf = 's1',	//- 現在の操作対象の表面
tlsurf = {},	//- モデル毎の透明度
mscnt = 0,		//- 表面モデル（作った奴）数
cmdcnt = 0		//- コマンドヒストリの行数
;

//. 最初に実行
$( function() {

//.. ドラッグ・リサイズ
//... アプレットパネル
	$( "#aparea" )
		.resizable({ 
			minHeight: 100, minWidth: 100, 
			maxWidth: $(window).width() - 20,
			maxHeight: $(window).height() - 20,
			distance: mdist, handles: 'all',
			start: function( event, ui ) {
				ui.helper._ztop();
				$( '#jvbox, #jmol' ).width( 10 ).height( 10 );
			} ,
			stop: function( event, ui ) {
				var a = ui.helper;
				$( '#jvbox, #jmol' ).width( a.width() ).height( a.height() - 25 );
				rightp_width(); //- 右枠広さ
				a._takeb()._ckpos();
				_maxap(0); //- 最大化前の状態消去
				if ( _jmol )
					Jmol.resizeApplet( jmolobj, [ a.width(), a.height() - 25 ] );
			}
		})
		.draggable({ 
			handle: '#aptbar', containment: 'document', distance: mdist,
			start: function( event, ui ) {
				ui.helper._ztop();
			} ,
			stop: function( event, ui ) { 
				ui.helper._takeb()._ckpos();
				rightp_width(); //- 右枠広さ
				_maxap(0); //- 最大化前の状態消去
				_pita(); //- ピタ
				U.apdown = 0;
			}
		})
	;

//... ボタンパネル
	$( "#btn_area" )
		.draggable({
			containment: 'document', distance: mdist, scroll: false,
//			grid: [10,10],
//			snap: true, snapMode: "outer", snapTolerance: 10,
			start: function( event, ui ) { ui.helper._fixs()._ztop(); } ,
			stop:  function( event, ui ) { ui.helper._abso()._takeb()._ckpos(); }
		})
		.resizable({
			minHeight: 30, minWidth: 50,  handles: 'all', distance: mdist ,
			start: function( event, ui ) { ui.helper._fixs()._ztop(); } ,
			stop: function( event, ui ) {
				ui.helper._abso().css( 'height', 'auto' )._ckpos(); 
			}
		})
	;

//... 普通のパネル
	$( ".ctrls" )
		.draggable({
			handle: '.tbar', distance: mdist,
			start: function( event, ui ) { ui.helper._fixs()._ztop(); } ,
			stop:  function( event, ui ) { ui.helper._abso()._takeb()._ckpos(); }
		})
		.resizable({
			minHeight: 40, minWidth: 150,  handles: 'all', distance: mdist,
			start: function( event, ui ) {
				ui.helper._fixs()._ztop()
					.children( '.ctrlin' ).css( 'height', 'auto' );
			} ,
			stop: function( event, ui ) {
				ui.helper._abso()._ckpos()
					.children( '.ctrlin' ).height( ui.helper.height() - 32 );
			}
		})
	;

//... ボタンのダブルクリックでパネルをしまう
	$( ".btns" ).dblclick( function() {
		_rearg( $( this ).attr( 'id' ).slice( 4 ) );
	});

//... ダブルクリックで全表示/全消し
	$( "#btn_area:not(button)" ) .dblclick( function() {
		for ( var n in panels ) {
			_hidectrl( panels[ n ], 1 );
		}
	});
//... パネルのクリック 最前面、押し戻し
	$( '#title, #aparea, #btn_area, .ctrls' ).click( function() {
		$( this )._ztop()._takeb();
	});

//... タイトルバー ダブルクリック （shading）
	$( '.tbar' ).dblclick( function() { $( this )._pshade(); } );
	$( '.tbar img' ).click( function() { $( this ).parent( '.tbar' )._pshade(); } );
//	$( '.tbar img' ).click( function() {
//		$( this ).parent( '.tbar' ).parent( '.ctrls' ).css( 'position', 'fixed' ); 
//	} );


//		var cl = $( this ).parent( '.ctrls' );
//		if ( cl.height() < 40 )
//			cl.css( 'height', 'auto' )._anif( this )._ckpos(); // off
//		else
//			cl.animate( { height: 25 }, 'fast' )._ckpos('shade'); // on
//	});

//... アプレットオプションパネル
	$( '#aptbar' ).hover(
		function() { $( '#apoptbtn' ).show(); } ,
		function() { $( '#apoptbtn' ).hide(); }
	).dblclick(
		function() { _showapopt(); }
	);
	$( '#apopt' ).hover(
		function() {
			clearTimeout( timer.hideapopt );
			_showapopt(1);
		}, function() {
			timer.hideapopt = setTimeout( '_showapopt(0)', 1000 );
		}
	)

//.. スライダー
//... スラブ jmol
	$( '#slabm_slider' ).slider({
		values: [ 0, 100 ], range: true,
		slide: function( event, ui ) {
			if ( _wait() ) return;
			_jmol_slab( ui.value );
		},
		stop: function( event, ui ) { _jmol_slab( ui.value ); }
	}) ;

//... スラブ jv
	$( '#slabv_slider' ).slider({
		slide: function( event, ui ) { jvs( 'slab ' + ( 100 - ui.value ) ); }
	});

//... ズーム
	$( '#zoom_slider' ).slider({
		min: 10, max: 500, value: 100, step: 5,
		slide: function( event, ui ) {
			if ( _jmol ) {
				if ( _wait() ) return;
				var v = ui.value;
				jmols( 'zoom ' + v );
				$( '#zvbox' ).val(v);
			} else {
				var z = ui.value / curzoom * 100;
				jvs( 'zoom ' + z );
				curzoom = curzoom * z / 100;
			}
		}, 
		stop: function( event, ui ) {
			if ( ! _jmol ) return;
			var v = ui.value;
			jmols( 'zoom ' + v );
			$( '#zvbox' ).val(v);
		}
	});

//... 透明度
	//- 原子モデル
	$( '#tlatom_slider' ).slider({
		min: 0, max: 0.99, step: 0.01, value: A.tlatom,
		slide: function( event, ui ) {
			if ( _wait( 200 ) ) return;
			_tlatom( ui.value );
		}, 
		stop: function( event, ui ) { _tlatom( ui.value ); }
	});

	//- 透明度  マップ
	$( '#tlsurf_slider' ).slider({
		min: 0, max: 0.99, step: 0.01, value: A.tlsurf,
		slide: function( event, ui ) {
			if ( _wait( 200 ) ) return;
			_tlsurf( ui.value );
		}, 
		stop: function( event, ui ) { _tlsurf( ui.value ); }
	});

//... 選択マーク
	$( '.selmark' )._popup( '#selmarkpop' );

//... タブ
	$( '#atom_surf' ).tabs();
	$( '#help_tabs' ).tabs();

//.. ajax
	$.getJSON( ajaxfn, function( json ) {
		for ( var n in json )
			$( '#data_' + n ).html( json[ n ] );
		if ( _pdb )
			$( '.seq' ).mouseup( function(){ _selsel( this ); });
		$( '.ctrls' )._shorten();
//		$( '.t' ).tooltip( ttip_param );
		_coolpanel( coolpanel );

		//- ポップアップ汎用
		$( '._pu' )._popup();
		
		//- リンク画像用のポップアップ
		_idpopup();

		//- タブ
		if ( _chem )
			$( '#compo_tabs' ).tabs({
				activate: function( event, ui ){
					_chem_compo_tab( ui.newTab.text() );
				}
			});
	}).error(function(jqXHR, textStatus, errorThrown) {
	    $( '#data_ajaxdbg' ).html(
	    	"<b>Error:</b> " + textStatus + "<br>" +
			"<b>Text:</b><br>" + jqXHR.responseText
		);
		_loaderror();
	});

	;

//.. その他
	$( '.desc' ).dblclick( function() { $(this).hide( 'fast' );} ); // 説明消し
	$( '#msg' ).dblclick( function() { $(this).text('');  } ); // メッセージエリア
	timer.loaderror = setTimeout( '_loaderror()', 20000 );
	
	//- tooltip
//	$( '.t' ).tooltip( ttip_param );
	//- test
//	$( '#btn_area' )._popup( '#testpop' );
//	$( '.tbar button' )._popup( '#testpop' );
});

//.. ウインドウのリサイズ
$( window ).resize( function() {
	if ( apmax.x != undefined ) //-最大化してたら、しなおし
		_maxap(1);
	$( '.ctrls' )._shorten();
});

//. jquery 関数
jQuery.fn.extend({

//.. _popup( c ): 要素cを要素thisのポップアップにする
	//- 

	_popup: function( c ) { return this.each( function() {
		var t = $( this ); //- トリガ要素
		//- ポップアップ要素
		var p = ( c == undefined ) ? t.next().appendTo('body') : $( c ); 

		//- 消すスクリプト、実行時に参照するためグローバル変数
		U.fnchpop = "$( '.pubox' ).fadeOut( 'medium' )";

		//- トリガ要素にホバー
		t.hover( function(){
			t.css( 'opacity', 0.6 ); //- トリガを半透明に
			clearTimeout( timer.popshow ); clearTimeout( timer.pophide );
			//- 出現タイマー
			timer.popshow = setTimeout( function(){
				$( '.pubox' ).hide(); //- 別のを消しておく
				var w = Math.floor( $( window ).width() / 4 ); //- 幅を自動計算
				clearTimeout( timer.popshow ); clearTimeout( timer.pophide );
				p.show().css({opacity: 0.85, maxWidth: w })._ztop()
					.position({ of: t, my: 'left top', at: 'left bottom' });
			}, 200, p );
		}, function(){
			t.css( 'opacity', 1 );
			clearTimeout( timer.popshow ); clearTimeout( timer.pophide );
			timer.pophide = setTimeout( U.fnchpop, 200 );
		} )

		//- トリガをクリック
		.click( function(){
			clearTimeout( timer.popshow ); clearTimeout( timer.pophide );
			p.hide().fadeIn( 'fast' )
				.position({ of: t, my: 'left top', at: 'left bottom' });
			setTimeout( function(){ p._ztop(); }, 100 );
		} )
		;

		//- ポップアップにホバー
		p.hover( function(){
			clearTimeout( timer.popshow ); clearTimeout( timer.pophide );
			p.show().css( 'opacity', 1 );
		}, function(){
			clearTimeout( timer.popshow ); clearTimeout( timer.pophide );
			timer.pophide = setTimeout( U.fnchpop, 1000 );
			p.css( 'opacity', 0.7 );
		} )
	} ) } ,

//.. _ztop
	_ztop: function() {
		zmax ++; 
		return this.css( 'z-index', zmax );
	} ,
//.. _fixs: パネルサイズを固定へ
	//- ドラッグ・リサイズのstartで_fixs、endで_abso
	_fixs: function() {
//		var a = $( _anifid() );
//		var w = this.width();
//		var h = this.height();
//		a.css( 'z-index', 0 ).width( w ).height( h ).show().insertBefore( this ).hide( 'slow' );
//		this.children( '.tbar' ).children( '.reargbtn' ).show( 'fast' );
//		this.children( '.reargbtn' ).show( 'fast' );
//		return this.width( w ).height( h );
//		this.insertBefore( a.width( this.width() ).height( this.height() ).show() );
		this.children( '.tbar' ).children( '.reargbtn' ).show( 'fast' );
		this.children( '.reargbtn' ).show( 'fast' );
		return this.width( this.width() ).height( this.height() );
	} ,
//.. _abso: 属性をabsoluteへ、じゃなくて本当はfixedへ
	_abso: function() {
		if ( this.css( 'position' ) == 'fixed' ) return this;
		return this.css({
			top: this.offset().top - $( document ).scrollTop(),
			left: this.offset().left - $( document ).scrollLeft(),
			position: 'fixed'
		});
	} ,
//		if ( this.css( 'position' ) == 'absolute' ) return this;
//		var o = this.offset();
//		return this.css( 'position', 'absolute' ).offset( o );
//	} ,

//.. _takeb: はみ出てたら押し戻す
	_takeb: function() {
		return this.each( function() {
			var t = $(this);
			if ( t.css('top').charAt(0) == '-' )
				t.animate({ top: 2 }, 'fast' )._ckpos();
			if ( t.css('left').charAt(0) == '-' )
				t.animate({ left: 2 }, 'fast' )._ckpos();
		});
	} ,

//.. _ckpos: パネルの状態をクッキーに保存
	//- opt = 'defo' だとデフォルト
	_ckpos: function( opt ) {
		var cid = this.attr( 'id' );
		if ( opt == 'defo' ) { //- デフォルト
			_cookie( 'v_' + cid , '' );
		} else {
			var str = hidden[ cid ] ? '0' : '1' ; //- hiddenでもクッキーには場所を書く
			str = ( opt == 'shade' ) ? '2' : str ; //- シェーディングしてるか？
//			var cpos = this.css( 'position' );
//			if ( cpos == 'absolute' || cid == 'aparea' )
			if ( this.css( 'position' ) == 'fixed' || cid == 'aparea' )
				str += ','+ this.position().left +','+ this.position().top
					 +','+ this.width() +','+ this.height();
			_cookie( 'v_' + cid , str );
		}
		return this;
	} ,

//.. _ckorder: パネルの順番をクッキーに保存
	_ckorder: function() {
		var c = this.attr( 'id' ).replace( 'ctrl_', '' ) + '|';
		p_order = c + p_order.replace( c, '' );
		_cookie( 'p_order', p_order );
		return this;
	} ,

//.. _richcl: モード別・中身の表示と非表示
	//- 隠れているときに内容を変更しても無視されるので
//	_modeset: function () { 
//		return this.each( function(){
//			rich ? $(this).find( '.rich, .richil' ).show()
//				: $(this).find( '.rich, .richil' ).hide() ;
//		});
//	} ,

//.. _shorten heightが長すぎるパネルを短く
	_shorten: function( f ) {
		//- f: 強制フラグ（absoluteでも高さ調節）atom_surfから利用
		return this.each( function() {
			var c = $(this),
				clin = c.children( '.ctrlin' );
			// abosoluteでshadeしていない、あるいは強制フラグ
//			if ( ( c.css( 'position' ) != 'absolute' && c.height() > 40 ) || f ) {
			if ( c.height() > 40 || f ) {
				clin.css( 'height', 'auto' );
				c.css( 'height', 'auto' );
			}
			var siz = ( $( window ).height() - 100 )* 0.9;
			if ( clin.height() >= siz ) {
				clin.height( siz );
				c.css( 'height', 'auto' );
			}
	 	});
	} ,

//.. _pshade: パネルをシェード
	//- タイトルバーのクラスとして呼ぶ！ this = title bar
	_pshade: function() {
		var cl = $( this ).parent( '.ctrls' );
		if ( cl.height() < 40 )
			cl.css( 'height', 'auto' )._anif( this )._ckpos(); // off
		else
			cl.animate( { height: 25 }, 'fast' )._ckpos('shade'); // on
	} ,

//.. _anif: フレームのアニメーション効果
	//- this => ゴール要素、s => スタート要素
	_anif: function( s ) {
		var o = $( s );
		if ( o.offset().left == 0 ) return this;
		$( _anifid() )
			.css( { top: o.offset().top, left: o.offset().left,
				width: o.width(), height: o.height() } )
			.show()
			.animate( { left: this.offset().left, top: this.offset().top,
				width: this.width(), height: this.height() }, 400 ) //400
			.fadeOut( 'normal' )
		;
		return this;
	},
//.. _hide: 隠れてる奴も隠す
	_hide: function( o ) { return this.each( function() {
		$( this ).hide( o, function() { $( this ).css( 'display', 'none' ) } );
	}); },

//.. _show...: 隠れてる奴も
	_showblock: function( o ) { return this.each( function() {
		$( this ).show( o, function() { $( this ).css( 'display', 'block' ) } );
	}); },

	_showinline: function( o ) { return this.each( function() {
		$( this ).show( o, function() { $( this ).css( 'display', 'inline' ) } );
	}); }

//.. -
});


//. chem-comp-tab
function _chem_compo_tab( pdbid ) {
	var o = $( '#comp_title_' + pdbid );
	if ( o.html() != '' ) return;
	$.getJSON( 'view_ajax_chem.php?p=' + pdbid + '&c=' + id, function( json ) {
		o.html( json.title );
		$( '#comp_btns_' + pdbid ).html( json.btn );
//		alert( json.btn );
	});
}
//. レイアウト関係の関数
//.. _showctrl: パネルを表示
function _showctrl( c, flg ) {
	//- flg: 1なら連続でも、隠さない
	var cl = $( '#ctrl_' + c );

	//- 連続押しならパネルを隠す
	if ( c == U.lastact && flg == undefined && ! hidden[ 'ctrl_' + c ] ) {
		_hidectrl( c );
		U.lastact = '';
		return;
	}
	U.lastact = c;
	hidden[ 'ctrl_' + c ] = 0;

	//- シェーディングしてたら戻す
	if ( cl.height() < 40 )
		cl.css( 'height', 'auto' );

	//- 先頭じゃなかったら、先頭へ
	if ( $( '.ctrls' ).index( cl ) != 0 && cl.css( 'position' ) != 'fixed' )
		cl.hide().insertBefore( '.ctrls:first' );

	//- 表示
	cl.show( 'fast', function() {
//		$(this)._modeset()._takeb()._shorten()._anif( '#btn_' + c )
		$(this)._takeb()._shorten()._anif( '#btn_' + c )
			._ztop()._ckpos()._ckorder();
	});
	_bshow( c, 1 ); //- ボタン
}

//..  _hidectrl: パネルを隠す（xボタン）
function _hidectrl( c, f ) {
	//- f: アニメーションフレームなしフラグ
	if ( f == undefined )
		$( '#btn_' + c )._anif( '#ctrl_' + c )
	hidden[ 'ctrl_' + c ] = 1;
	$( '#ctrl_' + c )._ckpos().hide( 'fast' );
	_bshow( c ); // ボタンパネルのボタン
}

//.. rearg パネルを戻す
//- パネルを戻す、flg=1だと、表示しない
function _rearg( c, flg ) {
	var cs = ( c == 'btn_area' ) ? '#btn_area' : '#ctrl_' + c;
	var cl = $( cs );
	var p = _anifid();
	$( p ).css({ width: cl.width(), height: cl.height(),
		top: cl.offset().top, left: cl.offset().left });
	//- 戻す
	cl.hide().css( 'position', 'relative' )
		.css( { width: 'auto', height: 'auto', top: 'auto', left: 'auto' } )
		.find( '.reargbtn' ).hide(); //- 「戻す」ボタンを隠す

	if ( ! flg ) { //- 表示する +視覚効果
//		cl.show()._modeset()
		cl.show()
			.queue( function() { $( p ).show(); $(this).dequeue(); })
			._shorten()._anif( p )
			.queue( function() { $( p ).hide(); $(this).dequeue(); })
		;
		_bshow( c, 1 );
	} else { //- 表示しない（リセット用）
		_bshow( c, 0 );
	}
	cl._ckpos();
}

//.. _bshow : ボタンのクラスを書き換え
// bshown/bhidden
// n: パネル名 f: 表示するかフラグ
function _bshow( n, f ) {
//	f ? $( '#btn_' + n ).addClass( 'bshown' ).removeClass( 'bhidden' )
//		: $( '#btn_' + n ).addClass( 'bhidden' ).removeClass( 'bshown' ) ;
	f ? $( '#btn_' + n ).addClass( 'c' + n ).removeClass( 'd' + n )
		: $( '#btn_' + n ).addClass( 'd' + n ).removeClass( 'c' + n ) ;
}

//.. sizeap アプレットのサイズ変更
//- m => l: 大きく, s: 小さく, 数字: そのサイズに
//- m2: 高さ（オプション）
//- fmax: 最大化フラグ
function sizeap( m, m2, fmax ) {
	var ap = $( "#aparea" );
	var x = ap.width();
	var y = ap.height() - 30;
	
	//- 相対値
	if ( m == 'l' ) {
		if ( y < 1000 ) {
			x += 50;
			y += 50;
		}
	} else if ( m == 's' ) {
		if ( y > 100 ) {
			y -= 50;
			x -= 50;
		}

	//- 絶対値
	} else {
		x = m;
		y = ( m2 > 10 ) ? m2 : m;
	}

	//- 変更
	ap.width( x ).height( y + 25 );
	$( '#jvbox, #jmol' ).width( x ).height( y );
	if ( _jmol ) {
		Jmol.resizeApplet( jmolobj, [ x, y ] );
		$( '#jmolmsg' ).width( x );
	}
	rightp_width();

	//- 最大化以外
	if ( fmax != 1 ) {
		_maxap( 0 ); //- 
		$( '#aparea' )._ckpos(); //- クッキー
	}
}

//.. _maxpa: アプレット最大化
// f: 1 強制最大化 （デフォルトはトグル）
// f: 0 サイズそのままで、最大じゃないことにする
function _maxap( f ) {
	var ap = $( '#aparea' );
	if ( f == 0 ) {
		apmax = {};
		$( '#bt_aprest' ).hide();
		ap.draggable( 'enable' );
		return;
	}
	var t = 0;
	var l = 0;
	var x = $(window).width() - 20
	var y = $(window).height() - 55;
	var flg = 0; //- 最大化か？
	if ( f == 1 && apmax.x != undefined ) {
		//- 既に最大（窓の大きさが変わったときなど）
		flg = 1;
	} else if ( apmax.x == undefined ) {
		//- 最大化 & 大きさ保存
		apmax.x = ap.width();
		apmax.y = ap.height() - 25;
		apmax.t = ap.position().top;
		apmax.l = ap.position().left;
		$( '#bt_aprest' ).show();
		flg = 1;
		//- jquery uiのデフォで、disableにすると透き通ってしまうので
		ap.draggable( 'disable' ).css( { opacity: 1, filter: 'Alpha(Opacity=100)' } );
	} else {
		//- もどす
		x = apmax.x;
		y = apmax.y;
		t = apmax.t;
		l = apmax.l;
		apmax = {};
		$( '#bt_aprest' ).hide();
	}
	ap.css( { top: t, left: l } );
	sizeap( x, y, flg );
}

//.. rightp_width: 右ペインの広さ調節
function rightp_width() {
	var a = $( '#aparea' );
	var w = a.position().left + a.width();
	$( '#right_pane' ).animate( { marginLeft: w + 17 }, 'fast' ,
		function(){ $( '.ctrls' )._shorten(); } );
	$( '#title' ).animate( { width: w + 10 }, 'fast' );
}

//.. layout_reset
function layout_reset() {
// レイアウトを初期化
	$( '#aparea' ).css( 'top', $( '#title').height() + 7 ).css( 'left', 0 );
	sizeap( 400 );
	_rearg( 'btn_area' );
	for ( var n in panels )
		_rearg( panels[ n ], 1 );
	for ( var n in init_show )
		_rearg( init_show[ n ] );

	//- 順番情報も消去
	p_order = '';
	_cookie( 'p_order', '' );
}

//.. _coolpanel: パネルに影
function _coolpanel( f ) {
	if ( f ) {
		$( '#title,#aparea,#btn_area,.ctrls' ).addClass( 'sd br4' );
		$( '#aptbar,.tbar' ).addClass( 'br2' );
	} else {
		$( '#title,#aparea,#btn_area,.ctrls' ).removeClass( 'sd br4' );
		$( '#aptbar,.tbar' ).removeClass( 'br2' );
	}
	_cookie( 'coolpanel', f );
}

//.. _pita: アプレットパネルをタイトルバーにくっつける
//- f: 強制か？ undefinedなら近いときだけpita
function _pita( f ) {
	var a = $( '#aparea' );
	var apos = a.position();
	var t = $( '#title' );
	var h = t.height() + 6;
	if ( ( Math.abs( h - apos.top ) < 20 && apos.left < 50 ) || f )
		a.animate( { top: h, left: 0 }, 'fast', function(){
			$( this )._ckpos();
			rightp_width();
		});
}

//.. showopt: オプション表示
function showopt( f ) {
	var cl = $( '#options' );
	cl._ztop();
	_cookie( 'vshowopt', f );

	var cla = $( '#aparea' );
	var clt = $( '#title' );
	if ( f ) {
		//- 表示
		$( '#bt_showop' ).hide();
		$( '#bt_hideop' ).show();
		cl.slideDown( 'fast' ).queue( function(){
			var t = clt.height() + 7;
			U.apdown = 0;
			if ( t > cla.position().top && cla.position().left < 200 ) {
				cla.css( 'top', t );
				U.apdown = 1;
			}
			 cla._ckpos();
			 $(this).dequeue();
		});
	} else {
		//- 隠す
		var t = clt.height() + 12;
		$( '#bt_hideop' ).hide();
		$( '#bt_showop' ).show();
		cl.hide( 'fast' ).queue( function(){
			var cla = $( '#aparea' );
			if ( ( t > cla.position().top && cla.position().left < 200 ) || U.apdown == 1 )
				cla.css( 'top', clt.height() + 7 );
			 cla._ckpos();
			 $(this).dequeue();
		});
	}
}
//.. apopt アプレットのオプションパネル
function _showapopt(f) {
//	clearTimeout( timer.hideapopt );
	var a = $( '#apopt' ).width( $( '#aptbar' ).width() ); // 幅調整
	if ( f == undefined )
		a.toggle( 'fast' );
	else
		f ? a.show( 'fast' ) : a.hide( 'fast' );
}

//.. richmode
//リッチモード切替 f = 1 リッチモードへ
function richmode( f ) {
	_cookie( 'vrich', f );
	rich = f;
	if ( f ) {
		//- 表示 (displayの種類、tr要素: table-row .richcl: inline )
		//- tr要素だけは display: table-row
		$( '.rich' ).fadeIn( 'slow', function(){
			$( this ).css( 'display', 'block' ).filter( 'tr' ).css( 'display', 'table-row' );
		});
		//- インライン要素
		$( '.richil' )
			.fadeIn( 'slow', function(){ $( this ).css( 'display', 'inline' ) } )
			.filter( '.bhidden' )
				.each( function(i,el){
					_bshow( $(el).attr('id').replace( /btn_/, '' ), 1 )
				})
//				.removeClass( 'bhidden' ).addClass( 'bshown' )
		;
	} else {
		//- 非表示
		$( '.rich, .richil' ).fadeOut( 'slow', function(){ $(this).css( 'display', 'none' ) } );
	}
	$( '.ctrls' )._shorten();
	$( '#btn_rich' ).text( rich ? '-' : '+' );
}

//.. _richtgl: リッチモードトグル
function _richtgl( f ) {
	if ( f != undefined && rich == f )
		return;
	$( '#cb_rich' ).prop( 'checked', !rich );
	richmode(!rich);
}


//.. showdesc パネル中の説明を表示
function _showdesc( f ) {
	vhidedesc = f;
	_cookie( 'vhidedesc', f );
	f ? $( '.desc' )._hide( 'fast' )
		: $( '.desc' )._showblock( 'fast' ) ;
}

//.. fsize フォントサイズ
function fsize( s ) {
	sz = [ 'x-small', 'small', 'medium', 'large', 'x-large' ];
	$('*').css( 'font-size', sz[ s ] );
	_cookie( 'vfsize', s );
	_pita();
}

//.. _anifid: アニメーションフレームのセレクタ文字列を返す
function _anifid() {
	anifid = ( anifid + 1 ) % 10;
	return '#anif' + anifid;
}

//. その他 汎用
//.. _menusel ドロップダウンメニューの選択
function _menusel( o ) {
	eval( $( o ).children( 'option:selected' ).val() );
}

//.. _checkb
//- チェックボックス
function _checkb( o ) {
	eval( o.checked ? o.name : o.value );
}

//.. radio ラジオボタン
function _radio( o ) {
	eval( o.value );
}

//.. _alert デバッグ用
function _alert( s ) {
//	$( '#msg' ).addtext( s );
	$( '#msg' ).append( '<br />' + s );
}

//.. debugstr デバッグ用
function _debugstr( s ) {
	var cl = $( '#debugstr' );
	cl.html( s + '<br />' + cl.html() );
}

//.. pdbのurlを返す
//function _u_pdb( i ) {
//	return u_pdb + i + '.ent.gz';
//}

//.. wait （スライダー用）
function _wait( x ) {
//- 最後に実行してからxミリ秒以内だったらtrue (あまり頻繁に実行しないように)
	if ( busy ) return 1;
	busy = 1;
	setTimeout( 'busy=0', ( x == undefined ) ? 100 : x );
}

//. アプレット関係の関数
//.. コマンド
//... aps: アプレットコマンド
function aps( s1, s2 ) {
	if ( _jmol )
		jmols( s1 );
	else {
		jvs( ( s2 == undefined ) ? s1 : s2 );
	}
}
//... jmols: jmolコマンド
//- f 読み込み中・計算中フラグ => 0: 構造 1: 表面
function jmols( s, f ){
	s = s.replace( /_dq_/g, '"' );
	_cmdhist( '$ ' + s );
	if ( f != undefined )
		_loadstart( f );
	try {
//		o_jmol.script( s );
//		alert( s );
		Jmol.script( jmolobj, s );
	} catch(e) {
		_cmdhist( 'Jmol is busy now', 'green' );
	}
}

//... jvs: jvコマンド
function jvs( s ){
	s = s.replace( /_dq_/g, '"' );
	_cmdhist( '$ ' + s );
	try {
		o_jv.executeCommand( s );
	} catch(e) {
		_cmdhist( 'jV is busy now', 'green' );
	}
}

//... apcmd: コマンドパネルに入力したコマンド
function apcmd() {
	var c = $( '#cmdbox' );
	var cl = c.val();
	if ( cl == '' ) return;
	if ( /^js /.test( cl ) )
		eval( cl.slice( 3 ) ); //-js
	else
		aps( cl ); //- applet
	c.select();
}

//... cmdstr: コマンドパネルに実行したコマンドを書き込む
//- 一回目は赤く表示、二回目は黒に戻す（エラーだったら赤いまま）
//function cmdstr( s ) {
//	s = 'JS Error: (' + s + ')';
//	timer.jserror = setTimeout( '_cmdhist(s,"red")', 1000 );
//}

//function cmdstr2( s ) {
//	clearTimeout( timer.jserror );
//	_cmdhist( '$ ' + s );
//}
//.. 選択
//... selmode: 選択モード
function selmode( m, f ) {
//- m モード名
//f: true/false -> on/off 省略 -> トグル

	if ( f == undefined ) {
		selmodef[ m ] = ! selmodef[ m ];
		f = selmodef[ m ];
	} else
		selmodef[ m ] = f;

	//- ボタンのクラス属性書き換え
	$( '.selmode_' + m )
		.addClass(    'selmode_o' + ( f ? 'n' : 'ff' ) )
		.removeClass( 'selmode_o' + ( f ? 'ff' : 'n' ) )
	;

	if ( _jmol ) {
		if ( m == 'halo' )
			jmols( f ? 'selectionHalos ON;' : 'selectionHalos OFF;' );
		if ( m == 'only' )
			jmols( f ? 'set hideNotSelected ON;'
				: 'set hideNotSelected OFF; display all and !water;' );
		if ( m == 'center' )
			jmols( f ? 'zoomto 0.7 {selected} 0;' : 'zoomto 0.7 0;' );
	} else { //- jV
		if ( m == 'blink' )
			f ? _blink() : _blinkoff();
		if ( m == 'center' )
			jvs( f ? 'center selected;' : 'center */*;' );
		if ( m == 'only' )
			jvs( f ? 'select !selected; displayatom off; select !selected'
				: 'displayatom on; select !selected; displayatom on; select !selected' );
	}
}

//... _select:
function _select( s, obj ) {
	//- 前回の選択と同じ？
	if ( obj != undefined && obj == lastselobj && !selmodef[ 'add' ] ) {
//		alert( 'same' );
		_selbtn_r(); //- ボタンの色、解除
		if ( _jmol ) {
			jmols( 'selectionHalos OFF; select all; label off;'
				+ ( selmodef[ 'center' ] ? 'zoomto 0.7 0;' : '' )
			);
		} else {
			jvs( 'select all;' );
			_blinkoff();
		}
		$( '#cursel' ).text( 'all' );
		$( '.sel' ).fadeOut( 'medium',  function() { $(this).css( 'display', 'none' ) } );
		$( '#selmarkpop' ).fadeOut( 'medium' );
		selecting = 0;
		lastselobj = '';
		return;
	}

	lastselobj = obj;
	
	if ( _jmol ) {
		if ( selmodef[ 'add' ]  )
			s = '(' + s + ') or selected';
		var t = 'select ' + s
		if ( selmodef[ 'halo' ] )
			t +=  '; selectionHalos ON;';
		if ( selmodef[ 'center' ] )
			t +=  '; zoomto 0.7 {selected} 0; ';
		if ( _chem && G.pdbmodel == undefined )
			t = 'label off; ' + t + ';label;';
		jmols( t );
	} else { //- jV
		var t = '';
		if ( selmodef[ 'blink' ] )
			_blinkoff();
		if ( selmodef[ 'add' ]  )
			s = '((' + s + ') or selected)';
		t += 'select ' + s + '; ';
		if ( selmodef[ 'center' ] )
			t +=  'center selected; ';
		if ( selmodef[ 'only' ] )
			t += 'select !selected; displayatom off; select !selected; displayatom on; ';
		//- 選択
		jvs( t );
		
		if ( selmodef[ 'blink' ] )
			_blink();
	}
	
	//- ボタンに色づけ
	if ( ! selmodef[ 'add' ] )
		_selbtn_r();
	if ( obj != undefined )
		$( obj ).children( 'span' ).addClass( 'csel' );

	//- 選択された要素をコマンドパネルに表示
	$( '#cursel' ).text( s );

	//- 選択マーク
	if ( s == 'all' ) {
		$( '.sel' ).fadeOut( 'medium', function() { $(this).css( 'display', 'none' ) } );
//		$( '.sel' )._hide( 'fast' );
		selecting = 0;
	} else {
		$( '.sel' ).fadeIn( 'medium', function() { $(this).css( 'display', 'inline' ) });
		selecting = 1;
	}

}

//... _selbtn_r: 選択ボタンの色リセット
function _selbtn_r() {
	$( '.csel' ).removeClass( 'csel' );
	$( '.cselx' ).removeClass( 'cselx' );
	$( '.seqsel' ).removeClass( 'seqsel' );
	$( '.seqselx' ).removeClass( 'seqselx' );
	$( '.picked' ).removeClass( 'picked' );
}

//... _resetsel
// 選択状態のリセット
function _resetsel() {
	_selbtn_r();
	if ( _jmol ) {
		selmode( 'halo', 1 );
		selmode( 'only', 0 );
		selmode( 'center', 1 );
		selmode( 'add', 0 );
		jmols( 'selectionHalos OFF; set hideNotSelected OFF; display all and !water; select all; label off;' );
		_zshade();
	} else {
		_blinkoff();
//		jvs( 'select none' );
		selmode( 'blink',	1 );
		selmode( 'only',	0 );
		selmode( 'center',	0 );
		selmode( 'add',		0 );
		_blinkoff();
		jvs( 'select all' );
	}
	$( '#cursel' ).text( 'all' );
	$( '.sel' ).fadeOut( 'medium',  function() { $(this).css( 'display', 'none' ) } );
	$( '#selmarkpop' ).fadeOut( 'medium' );
	selecting = 0;
}

//... _selsel 選択した文字列のシーケンスを選択
function _selsel( c ) {
	var s = ' ';

	//- 選択文字列を取得
//	if ( jQuery.browser.msie )
//		s += document.selection.createRange().text;
//	else if ( jQuery.browser.opera )
//		s += document.getSelection();
//	else //if ( jQuery.browser.mozilla or jQuery.browser.safari )
//		s += window.getSelection();

	//- 拾ったコード
	if ( '\v' === 'v' )
		s += document.selection.createRange().text;
	else
		s += ( 'getSelection' in window ? window : document ).getSelection().toString();

	if ( s == ' ' ) return;

	//- jVでは未対応
	if ( ! _jmol ) {
		_jv_unable( 'jv_conf_seqsel' );
		return;
	}

	//- 配列を選択したボックス
	var o = $( c );
	s = s.replace( /[^A-Z]/g, '' )
	_select( 'within( "' + s + '", all)&' + o.attr( 'name' ) );
	o.addClass( 'seqsel' ); //-色つけ
}

//... blink: jV用 点滅
//- f: 表示・非表示
function _blink( f ) {
	clearTimeout( timer.blink );
	if ( f ) {
		jvs( 'displayatom on' );
		timer.blink = setTimeout( '_blink(0)', 700 );

		// 10回点滅したら終わり
		++ blinkcnt;
		if ( blinkcnt > 9 )
			_blinkoff();
	} else {
		jvs( 'displayatom off' );
		timer.blink = setTimeout( '_blink(1)', 300 );
	}
}

function _blinkoff() {
	clearTimeout( timer.blink );
	jvs( 'displayatom on' );
	blinkcnt = 0;	
}

//... clicksel: 「クリックで選択」のモード
function _clicksel( mode ) {
	pickselmode = mode;
}
//.. 表示
//... resetview: 表示をリセット
function resetview() {
	$( '#zvbox' ).val( 100 );
	$( '#zoom_slider' ).slider( { min: 10, max: 500, value: 100 } );
	if ( _jmol ) {
		jmols( 'reset; boundbox off' )
		_fixslab();
		$( '#slabm_slider' ).slider( {values: [ 0, 100 ]} );
		$( '#scale input:first' ).prop('checked', true); //- スケール
	} else {
		jvs( 'slab 100; reset' );
		curzoom = 100;
	 	$( '#slabv_slider' ).slider( 'value', 0 );
	}
}

//... _jmol_slab: Jmol用スラブ
function _jmol_slab( cv ) {
	var v = $( '#slabm_slider').slider( 'option', 'values' );
	if ( slbthick >= 0 ) {
		//- 厚さ固定
		if ( cv != v[1] ) { //- handle #0?
			v[1] = v[0] + slbthick;
			if ( v[1] > 100 )
				v[1] = 100;
			$( '#slabm_slider').slider( 'values', 1, v[1]  );
		} else {
			v[0] = v[1] - slbthick;
			if ( v[0] < 0 )
				v[0] = 0;
			$( '#slabm_slider').slider( 'values', 0, v[0]  );
		}
	} else if ( slbcenter >= 0 ) {
		//- 中心固定
		if ( cv != v[1] ) {
			v[1] = 2 * slbcenter - v[0];
			if ( v[1] > 100 )
				v[1] = 100;
			$( '#slabm_slider').slider( 'values', 1, v[1]  );
		} else {
			v[0] = 2 * slbcenter - v[1];
			if ( v[0] < 0 )
				v[0] = 0;
			$( '#slabm_slider').slider( 'values', 0, v[0]  );
		}
	}
	var s = 100 - v[0];
	var d = 100 - v[1];
//	jmols( 'slab ' + s + '; depth ' + d + ' ; slab on;' );
	jmols( 'slab ' + s + '; set zDepth ' + d + ' ; slab on;' );
}
//... _fixslabfix: スラブ固定
// f1: なし:リセット 1:thick 0:center
// f2: 0:ON 1:OFF
function _fixslab( f1, f2 ) {
	if ( f1 == undefined ) {
		//- リセット
		$( '#slabm_slider' ).slider( {values: [ 0, 100 ]} );
		slbthick = -1;
		slbcenter = -1;
		$( '#fixcenter,#fixthick' ).prop('checked', false);
		$( '#slbthick,#slbcenter' ).text( '' );
		jmols( 'slab off;depth 0;set zshade on;slab ' + zshade );
//		jmols( 'slab off;depth 0;set zshade on;set zslab ' + zshade );

	} else if ( f1 ) {
		//- thick
		if ( f2 ) {
			var v = $( '#slabm_slider').slider( 'option', 'values' );
			slbthick = v[1] - v[0];
			$( '#slbthick' ).text( ' ' + slbthick + '%' );
			_fixslab(0,0);
			$( '#fixcenter' ).prop('checked', false);
		} else {
			slbthick = -1;
			$( '#slbthick' ).text( '' );
		}
	} else {
		//- center
		if ( f2 ) {
			var v = $( '#slabm_slider').slider( 'option', 'values' );
			slbcenter = Math.round( ( v[1] + v[0] ) / 2 );
			$( '#slbcenter' ).text( ' ' + slbcenter + '%' );
			_fixslab(1,0);
			$( '#fixthick' ).prop('checked', false);
		} else {
			slbcenter = -1;
			$( '#slbcenter' ).text( '' );
		}
	}
}

//... bg_col: 背景色
function bg_col( c ) {
	aps( lights[ ( c < 2 ) ? 0 : 1 ] + ';background ' + bgcols[ c ] );
	$( '#jmolbox' ).css( 'background-color', bgcolsc[ c ] );
	_cookie( 'bg_col', c );
}

//... _stereo: ステレオ
function _stereo( c ) {
	aps( 'stereo ' + c );
//	alert( 'stereo ! ' + c );
	_cookie( 'stereo', c != 'off' ? c : '' );
	if ( prime )
		_prime_stereo( c );
}

//... _prime_stereo
function _prime_stereo( c ) {
	var b = '_s', a = '_m';
	if ( c.indexOf( 'redcyan' ) == 0 ) {
		b = '_m'; a = '_s';
	}
	$( '.prime_img' ).each( function() {
		var o = $( this );
		o.attr( 'src', o.attr( 'src' ).replace( b, a ) );
	});
}

//... scale: スケール
function _scale( s ) {
	s = s +' '+ ( s / 10 ) +' '+ '0';
	jmols( 'boundbox ticks x ' + s + ';boundbox ticks y ' + s + ';boundbox ticks z ' + s );
}

//... imgq 画質
// f: 1だと低画質モード
function imgq(f) {
	jmols( f ? _vlq : _vhq );
	_cookie( 'vlq', f );
	f ? $( '.cb_imgq' ).prop('checked', false)
		: $( '.cb_imgq' ).prop('checked', true);
}
//... _zval: jmol set zoom
function _zval(v) {
	var v = ( v == undefined ) ? $( '#zvbox' ).val() : v;
	$( '#zvbox' ).val(v);
	if ( v < 5 || 10000 < v ) return;
	var zs = $( '#zoom_slider' );
	if ( v > zs.slider( 'option', 'max' ) )
		zs.slider({ max: v });
	zs.slider( 'value', v );
	jmols( 'zoom ' + v );
}

//... _zshade: jmol zshade
function _zshade( v ) {
	if ( v == undefined )
		v = zshade;
	zshade = v;
	jmols( ( v == 0)
		? 'set zshade off'
		: 'set zshade on; set zslab ' + v
	);
}

//.. スタイル

//... _tlatom: _tlsurf 透明度
function _tlatom( v ) {
	jmols( 'color translucent ' + v );
	A.tlatom = v;
}
function _tlsurf( v ) {
	jmols( 'isosurface ' + cursurf + ' translucent ' + v );
	f_mcol = 1;
	A.tlsurf = v;
}

//... _mapcolor: マップの色
function _mapcolor( c ) {
	var t = $( '#tlsurf_slider' ).slider( "value" );
	jmols( 'isosurface ' + cursurf + ' translucent ' + t + ' [' + c + ']' );
	f_mcol = 1;
}
//... _surfst: 表面のスタイル
function _surfst( s ) {
	jmols( 'isosurface ' + cursurf + ' ' + s + ' on' );
}

//... _chsurf: 操作する表面モデル切り替え
function _chsurf( s ) {
//	tlsurf[ cursurf ] == A.tlsurf;
	cursurf = s;
	if ( s == undefined ) {
		//- 消去
		$( '#cursurf' ).hide( 'fast' ).text( '' );
		$( '#cursurf_btn' ).hide( 'fast' );
	} else {
		//- 切り替え
		var str = ( s == 's1' )
			? 'EMDB-' + ( _pdb ? loadedmap : id  )
			: s.replace( /^ms/, 'Surface #' ).replace( /^ef/, 'eF-site chain-' );
		$( '#cursurf' ).hide( 'fast' ).text( str ).show( 'fast' );
		$( '#cursurf_btn' ).show( 'fast' );
	}
}

//... _makesurf
//f: 分子かVDWか 0: vdw, 1: mol
function _makesurf( f ) {
	++ mscnt;
	sid = 'ms' + mscnt;
	_chsurf( sid );
	jmols( 'isosurface '
		+ sid
		+ ( _chem ? ''
			:' IGNORE {solvent'
				+ ( $( '#mksurf_iglig' ).prop( 'checked' ) ? ' or ligand' : '' )
				+ '}'
		)
		+ ' resolution 0 '
		+ ( f ? 'molecular' : 'solvent 0' )
	, 1 );
	$( '#surflist' ).append( surfbtn.replace( /_id_/g, mscnt ) );
}

//... _showsurf: 表面モデルを表示
// fを指定しないとき、i:1現在のsurfを表示、0:非表示
// fを指定するとき、iはmsのID、fが表示フラグ
function _showsurf( i, f ) {
	if ( f == undefined ) {
		f = i;
		sid = cursurf;
	} else {
		f ? _chsurf( sid ) : '';
		sid = 'ms' + i;
	}
	jmols( 'isosurface ' + sid + ' ' + ( f ? 'on' : 'off' ) );
}

//... _resetstyle: リセット
function _resetstyle() {
	if ( ! _pdb ) return;
	aps( init_style );
	$( '#ctrl_Style select' ).prop( 'selectedIndex', 0 ); //- メニューをリセット
	if ( _jmol ) {
		$( '#tlatom_slider' ).slider( 'value', 0 );
		$( '#tlsurf_slider' ).slider( 'value', 0 );
		jmols( 'isosurface ms delete;' );
		A.tlatom = 0;
		A.tlsurf = 0;
	}
}

//... _stmode: 原子・表面 スタイルモード切り替え
function _stmode( f ) {
	if ( f ) {
		//- surface
		$( '#atomst' ).appendTo( '#hide' );
		$( '#surfst' ).appendTo( '#atom_surf' );
		$( '#btn_surf' ).addClass( 'atomsurf_on' ).prop( 'disabled', true);
		$( '#btn_atom' ).removeClass( 'atomsurf_on' ).prop('disabled', false);
		atomsurf = 2;
	} else {
		//- atom
		$( '#atomst' ).appendTo( '#atom_surf' );
		$( '#surfst' ).appendTo( '#hide' );
		$( '#btn_atom' ).addClass( 'atomsurf_on' ).prop( 'disabled', true );
		$( '#btn_surf' ).removeClass( 'atomsurf_on' ).prop('disabled', false);
		atomsurf = 1;
	}
	$( '#ctrl_Style' )._shorten(1);
}
//... _color: 色
function _color( col, flg ) {
	nc  = 'color (! _carbon_etc) cpk;';
	lig = 'color (ligand) cpk;';
	if ( col == 'nc_cpk' ) {
		//- 炭素はCPK
		G.col_cpk_nc = flg;
		if ( flg ) 
			aps( nc );
	} else if ( col == 'lig_cpk' ) {
		//- リガンドはCPK
		G.col_cpk_lig = flg;
		if ( flg )
			aps( lig );
	} else {
		aps( 'color ' + col + ';'
			+ ( G.col_cpk_nc  ? nc  : '' )
			+ ( G.col_cpk_lig ? lig : '' )
		);
	}
}

//.. モデル読み込み・表示
//... _asb: 集合体構造読み込み
// limit: 表示するchainID
// i: biomolのID
// f: 主鎖だけフラグ
function _asb( c, limit, i, f ) {
	if ( _jmol ) {
		jmols( 'load "" FILTER "'
			+ ( f ? backbone_only : '' ) //- 主鎖だけ
			+ 'biomolecule ' + limit + '";' + init_style 
		, 0 );
	} else {
//		_jvload( f ? u_asbb + i : u_asb + i + '.gz' );
		_jvload( f ? u_asbb + i : u_asb + i );
		if ( f )
			jvs( 'backbone 150' );
	}
	_datareloaded(); //- 読み込んだデータの情報をクリア
	_asb_btn( c );
}

//... _asb_btn ボタンの色つけ
function _asb_btn( c ) {
	$( '.b_asb' ).removeClass( 'act' );
	$( c ).children( 'span' ).addClass( 'act' );
}

//... reloadstr 再読み込み 
// m: モード ud:original 1:ユニットセル 2x2x2 etc
// c: ボタンのオブジェクト
function reloadstr( c, m1, m2, m3 ) {
	if ( _jmol ) {
		var s1, s2;
		var ld = ( fileid == 2 ) // 別のモデルを読んでいない？
			? 'load ""'
			: 'load "' + url_pdb + '"'
		;
		if ( m1 != undefined ) { // ユニットセル
			s1 = ' {' + m1 + ' ' + m2 + ' ' + m3 + '} ';
			s2 = 'unitcell {'
				+ ( m1 > 2 ? '1' : '0' ) + ' '
				+ ( m2 > 2 ? '1' : '0' ) + ' '
				+ ( m3 > 2 ? '1' : '0' ) + '};';
			jmols( ld + s1 + ';' + init_style + s2, 0 );
		} else {
			jmols( ld + ';' + init_style, 0 );
		}
		_datareloaded() //- フィットマップクリア
	} else {
		_jvload( url_pdb );
	}
	_asb_btn( c );
}

//... __openpdb: chemcomp 用 PDBモデル読み込み
function _openpdb( u, sel, obj ) {
	if ( G.pdbmodel != u )
		jmols( 'load "' + u + '";' + init_pstyle + init_style, 0 );
	G.pdbmodel = u;
	if ( sel != undefined )
		_select( sel, obj );
}

//... _pdbappend split用 PDBモデル追加読み込み
function _pdbappend( i, u ) {
	if ( _jmol ) {
		_defineid( i );
		//- EM mapのせいで、回転しているときの対処
		var rot = ( loadedmap == undefined ) ? '' :
			'select ~' + i + ';rotateSelected MOLECULAR @rq;translateSelected @t;' ;
		jmols( 'load APPEND "' + u + '";model all;center all;'
			+ define + rot + init_style, 0 );
	} else {
		_jvload( u, 1 );
	}
	$( '#apnd_' + i ).prop('disabled', true);
}

//... _jvload: jv用、PDBデータ読み込み
//- asb, reload, splitから呼ぶ
//- u: url
//- f: 1なら、現在のモデルを表示したまま
function _jvload( u, f ) {
//	alert( u );
	if ( ! f )
		jvs( 'zap' );
	var txt = '[js] loadPDB("' + u + '")'
	_cmdhist( 'Loading file, ' + u, 'blue' );
//	cmdstr( txt );
	o_jv.loadPDB( u, 1 );
//	cmdstr2( txt );
	jvs( 'center */*;zoom 140;' + init_style );
}

//... _fitted EMDB用、PDBの読み込み
// bu: biological unitを読み込む
// hide: 読み込む代わりに隠す
function _fitted( pid, urlpdb, bu, hide ) {
	var id2 = pid + ( bu ? 'bu' : '' );

	//- 隠す
	if ( hide ) {
		jmols( 'hide hidden OR ~' + id2 );
		$( '.fit' + id2 ).prop('checked', false);
		return;
	}

	//- チェックボックスをチェック
	$( '.fit' + id2 ).prop('checked', true);

	//- 既に読み込んであるなら表示だけ
	if ( loaded[ id2 ] ) {
		jmols( 'display displayed OR ~' + id2 );
		return;
	}

	_defineid( id2 );
	var f = bu ? ' filter "' + backbone_only + 'biomolecule 1"' : ''
//	_loadstart();
	jmols( 'load APPEND "' + urlpdb + '"' + f + ';'
		+ define + 'select ~' + id2 + ';' + tmatrix
		+ 'backbone only; backbone 300;color chain;model all;select all;'
	, 0 );
	loaded[ id2 ] = 1;

	//- 一度も色を変更していなかったら、半透明の白にする
	if ( ! f_mcol ) {
		jmols( 'isosurface s1 translucent 0.60 [xffffff]' );
		$( '#tlsurf_slider' ).slider( 'value', 0.6 );
		A.tlsurf = 0.6;
	}

	_zshade(); //- zshadeあわせ直し

	//- 選択ボタンを有効化
	$( '.sel' + pid ).prop('disabled', false);
}

//... _fitmap PDB用、EMDB読み込み
// fid: マップのID: 指定しないと隠すだけ
// r2-m 回転行列
function _fitmap( fid, r1, r2, r3, m ) {
	//- jV未対応
	if ( ! _jmol ) {
		_jv_unable( 'jv_conf_loadmap' );
		return;
	}

	//- マップを隠す？
	if ( fid == undefined ) {
		jmols( 'isosurface s1 off' );
		return;
	}

	//- もう読み込んでるマップなら表示させるだけ
	if ( loadedmap == fid ) {
		jmols( 'isosurface s1 on' );
		return;
	}

//	_loadstart(1);
	//- フィットマップのチェックボックス
	$( '.cb_fit:not(#cb_' + fid + ')' ).prop('checked', false);

	//- 別のマップを読み込むなら、座標を戻す
	if ( loadedmap != undefined ) {
		jmols( 'rq=quaternion(r*-1);t=t*-1;select all;translateSelected @t;rotateSelected MOLECULAR @rq;' );
	}

	loadedmap = fid;
	_chsurf( 's1' );

	jmols( ''
/*
		なんだか移動できない
		// matrix
		+ 'r=[[' + r1 + '],[' + r2 + '],[' + r3 + ']];'
		+ 'rq=quaternion(r*-1);t={' + m + '};t=t*-1;'
//		+ 'select all;rotateSelected MOLECULAR @rq;translateSelected @t;'
		// map open
		+ 'isosurface s1 file "' + u_em_med + '/' + fid + '/ym/o1.zip|o1.jvxl";'
		+ 'isosurface s1 offset @t rotate @rq translucent 0.60 [xffffff];'
		+ 'center all; boundbox (all); selectionHalos OFF;'
*/
		// matrix
		+ 'r=[[' + r1 + '],[' + r2 + '],[' + r3 + ']];'
		+ 'rq=quaternion(r);t={' + m + '};'
		+ 'select all;rotateSelected MOLECULAR @rq;translateSelected @t;'
		// map open
		+ 'isosurface s1 file "' + u_em_med + '/' + fid + '/ym/o1.zip|o1.jvxl";'
		+ 'isosurface s1 translucent 0.60 [xffffff];'
		+ 'center all; boundbox (all); selectionHalos OFF;'

	, 1 );
	_zshade();
}

//... _loadans アンサンブル読み込み fit_robot用
function _loadans( fn, c ) {
	if ( _jmol ) {
		jmols( 'load "' + fn + '";' + init_pstyle + init_style, 0 );
	} else {
		_jvload( fn );
	}
	//- ボタン色付け
	fileid = 3;
	_asb_btn( c );
}

//... _model モデル表示 NMR用
// n: 全モデルなら無し
function _model( n ) {
	if ( _jmol ) {
		jmols( 'frame pause; model ' + ( ( n == undefined ) ? 'all' : n  ));
	} else {
		if ( n == undefined ) {
			jvs( 'select all; displayatom on' );
			$( '#cmodel' ).text( 'All' );
		} else {
			jvs( 'select all; displayatom off; select */' + n + '; displayatom on; select all;' );
			$( '#cmodel' ).text( '#' + n );
		}
	}
}

//... _nmodel jv NMRモデル 次のモデル前のモデル
// i = 0; 前のモデル、1:次のモデル
function _nmodel( i, l, h ) {
	if ( i ) {
		++ cmodel;
		if ( cmodel > h )
			cmodel = l;
	} else {
		-- cmodel;
		if ( cmodel < l )
			cmodel = h;
	}
	_model( cmodel );
}

//... _defineid: Jmolモデルの定義文字列
function _defineid( i ) {
//- モデルの定義（load appendすると全部忘れるので、毎回全部定義しなおす）
//- 変数定義するのみ、実行しない！
	define += 'define ~' + i + ' ' + fileid + '.1;';
	++ fileid;
}

//... _datareloaded: データがリロードされたときの対処
function _datareloaded() {
	//- フィットマップのチェックボックスはずす
	$( '.cb_fit' ).prop('checked', false );
	loadedmap = undefined;

	//-split 用 ロードボタンを復活
	$( '.b_apnd' ).prop('disabled', false);
	fileid = 2;

	//- ef-siteのチェックボックスはずす
	$( '.cb_ef' ).prop('checked', false);
	loadedef = {};
	
	//- jmol表面
	$( '#surflist' ).text('');
	_chsurf();
	mscnt = 0;
}
//.. アプレット通信系
//... マウスコールバック
// jV: file, model, chain, res, atom, altloc, resName, atomName, x, y, z
function _mousepick( p1, p2, p3, p4, p5, p6, p7, p8 ) {
	if ( _jmol ) {
		var a = p2.replace( /^.*?\[(.+?)\](.+?):(.+?)\.(.+?) #(.*?) .+$/, '$1,$2,$3,$4,$5' )
			.split( ',' );
		var chain = a[2];
		var res = a[0];
		var resn = a[1];
		var atom = a[3] + '-' + a[4];
		var atom_id = a[0].replace( /^.+?\]\.(.+?) .+$/, '$1' ) ;

	} else {
		var model = p2;
		var chain = p3;
		var resn = p4;
		var res = p7.replace(/^\s+|\s+$/g, '');
		var atom = p8 + '-' + p5;
		var atom_id = '';
	}
	//- コマンドパネルに書き込み
	$( '#p_chain' ).text( chain );
	$( '#p_res'   ).text( res + '-' + resn );
	$( '#p_atom'  ).text( atom  + ' / ' + atom_id );

	//- 
	_jmolmsgpop(
		'[Clicked] chain: ' + chain
		+ ', residue: ' + res + '-' + resn
		+ ', atom: ' + atom + '/' + atom_id
	);

	//- セレクト
	if ( pickselmode == 2 )
		_select( '*:' + chain );
	if ( pickselmode == 1 )
		_select( resn + ' & *:' + chain );

	//- ボタンに色づけ & 目立たせる
	$( '.picked' ).removeClass( 'picked' );
	$( '#ch_' + chain
		+ ',#np_' + res
		+ ',#np_' + res + '_' + chain + '_' + resn
		+ ',#atid_' + atom_id.replace( "'", '_' ) 
	)
		.addClass( 'picked' )
		.animate( { marginRight: 20, marginLeft: 20 } , 'fast' )
		.animate( { marginRight: 0, marginLeft: 0 } , 'fast' )
	;
}

//... _loadend / _loadstart
//- f => 1: 表面モデル計算中バーを出す 0: 構造データ処理中バーを出す
function _loadstart( f ) {
	if ( f == 1 )
		A.busy_surf = true;
	else
		A.busy_str = true;

	clearTimeout( timer.loaderror );
	$( '.loadingbar' ).html( loadingbar );
	$( '#loading' ).show( 'fast' );
	timer.loaderror = setTimeout( '_loaderror()', 20000 );
}
function _loaderror() {
	//全体（ページ開いたときに出ている奴）
	$( '.loadingbar' ).html( loadingerror );
	//- アプレットの奴は5秒で消す
	timer.loaderror2 = setTimeout( "$('#loading').hide('slow')", 5000 );
}

//... _jmolmsg
function _jmolmsg( s1, s2, s3 ) {

//	if ( /^echo/i.test( s2 ) ) return;
	//- 応答なし
	if ( ! $.isFunction( Jmol.script ) ) {
		_cmdhist( 'Jmol is busy now.', 'green' );
		_jmolmsgpop( 'Jmol is busy now.' );
		return;
	}

	$( '#loading' ).hide( 'slow' ); //- ロード中バーをしまう
	if ( A.busy_surf )
		$( '#calcsurf' ).show( 'slow' ); //- 表面計算中バーを出す
	if ( A.busy_str )
		$( '#calcstr' ).show( 'slow' ); //- 計算中バーを出す

	//- 表面計算おわり
	if ( A.busy_surf && /created/.test( s2 ) ) {
		$( '#calcsurf' ).hide( 'slow' );
		A.busy_surf = false;
	}

	//- 構造計算おわり
	if ( A.busy_str && / atoms selected/.test( s2 ) ) {
		$( '#calcstr' ).hide( 'slow' );
		A.busy_str = false;
	}

	//- 意味ない系
	if ( s2 == '' ) return;

	//- コマンドパネル出力
	_cmdhist( s2, ( /ERROR/.test( s2 ) ) ? 'red' : 'blue' );
	if ( /atoms selected/.test( s2 ) ) {
		var num = s2.replace( 'atoms selected', '' );
		$( '#numselatom' ).text( num );
		if ( num == '0 ' ) {
			$( '.seqsel' ).addClass( 'seqselx' ).removeClass( 'seqsel' );
			$( '.csel' ).addClass( 'cselx' ).removeClass( 'csel' );
		}
	}
	_jmolmsgpop( s2 );
}

//... _jmolmsgpop: jmolの下にメッセージ
function _jmolmsgpop( s ) {

	if ( s == 'zShade = true' ) return; //- そのうち直そう！
	if ( s == 'zshadePower = 1' ) return;
	if ( /script .*(started|completed)/i.test( s ) ) return;

	var o = $( '#jmolmsg' );
	if ( o.children('p').length > 2 )
		o.children( 'p:first' ).remove();
	o.show()._ztop().append( '<p>' + s + '</p>' );
	clearTimeout( timer.hidemsg );
	timer.hidemsg = setTimeout( '$("#jmolmsg").fadeOut("medium").html("");', 3000 );
}


//... _cmdhist: コマンドヒストリ
// str: 文字列, col => 色
function _cmdhist( str, col ) {
	var cl = ( col != undefined ) ? ' class="' + col + '"' : '' ;
	$( '#cmdhist' ).append( '<p' + cl + '></p>' );
	$( '#cmdhist p:last' ).text( str ); //- htmlエスケープするため
	if ( cmdcnt > 100 )
		$( '#cmdhist p:first' ).remove();
	else
		++ cmdcnt;
	$( '#cmdhist' ).scrollTop( 10000 );
}

//. efsite
function _geteflist( o ) {
	$( o ).hide( 'fast' );
	$( '#efloading' ).show( 'fast' );
	$.get( 'view_eflist.php?id=' + id, function(data) {
		$( o ).replaceWith( data ).show( 'fast' );
		$( '#efloading' ).hide( 'fast' );
	});
}

function _efsite( c, f ) {
	sid = 'ef' + c;
	//- 隠す？
	if ( f == 1 ) {
		jmols( 'isosurface ' + sid + ' off' );
		return;
	}
	_chsurf( sid );
	//- 表示するだけ
	if ( loadedef[ c ] ) {
		jmols( 'isosurface ' + sid + ' on' );
		return;
	}

//	var C = c.toUpperCase();
	_loadstart(1);
	jmols( 'isosurface ' + sid + ' COLOR RANGE -0.1 0.1 file "eftrans.php?id=' + id + '-' + c + '" COLORSCHEME "rwb" translucent 0.2' );
	loadedef[ c ] = 1;
}
/*
 file "http://ef-site.hgc.jp/eF-site/servlet/Download?type=efvet&entry_id=1tup-A" COLORSCHEME "rwb"
*/

//. ED map
function _edmap( o, u ) {
	_loadstart(1);
	jmols( 'isosurface edmap color [x008000] sigma '
		+ $( '#edmap_lev' ).val()
		+ ' within '
		+ $( '#edmap_dist' ).val()
		+ ' (selected) "'
		+ u
		+ '" mesh nofill;'
	);
	_chsurf( 'edmap' );
}
//. ED map
function _emmap( o, u ) {
	_loadstart(1);
	jmols( 'isosurface edmap color [x008000] cutoff '
		+ $( '#emmap_lev' ).val()
		+ ' within '
		+ $( '#emmap_dist' ).val()
		+ ' (selected) "'
		+ u
		+ '" mesh nofill;'
	);
	_chsurf( 'emmap' );
}

//. _jv_unable: jVではできないメッセージ
// s: 質問ID、何回も同じ事を聞かないように
function _jv_unable( s ) {
	if ( A[ s ] ) return;
	A[ s ] = true;
	if ( window.confirm( msg_jv_unable ) )
		location.replace( '?app=jmol&id=' + id );
}

//. 
/*
@ compile
{run java -jar C:\tools\compiler-latest\compiler.jar --compilation_level WHITESPACE_ONLY --js view.js --js_output_file view.m.js
@ コンパイルした奴を削除
{run cmd /r del view.m.js
コンパイルは

Closure Compiler Service
http://closure-compiler.appspot.com/home

Whitespace only で
コピペじゃダメ、ちゃんとダウンロードする
*/

