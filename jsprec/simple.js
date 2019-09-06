//. クッキー
//- クッキー期限 (365日後)
var dt = new Date();
dt.setDate( dt.getDate() + 365 );
var ckdate = dt.toGMTString();

//- 廃止クッキー
document.cookie = 'mov_win_size=; expires=expires=Tue, 10-May-1930 00:00:00 GMT;';
document.cookie = 'show_menu=; expires=expires=Tue, 10-May-1930 00:00:00 GMT;';

//. 最初に実行
$( function() {
	_idbox.init();	//- IDインプットボックス
	_extcol.init();	//- 右カラム
	_acomp.init();	//- 入力ボックスの自動補完定義
	_vw.init_vwmenu(); 	//- ビューア選択メニュー
});

//. ウインドウの変化を拾う
$( window ).on({
	resize: function(){
		//- メニュー自動モードなら、ウィンドウの大きさに合わせて、出し入れ
		var wid = 900 < window.innerWidth;
		_extcol.change(0);
	} ,
	beforeunload: function(e){
		_pmov.close();
		_vw.close_all();
	} ,
	scroll: function(e){
		_extcol.scroll();
	}
});

//. fucntions 一般
//.. _cookie クッキー書き込み
function _cookie( k, v ) {
	document.cookie = k + '=' + escape( v ) + ';' + 'expires=' + ckdate + ';';
}

//.. _fsize フォントサイズ
function _fsize( s ) {
	$('body').css( 'font-size', [ 'x-small', 'small', 'medium', 'large', 'x-large' ][ s ] );
	_cookie( 'vfsize', s );
	$('.fsizebtn').prop('disabled', false);
	$('#fsize' + s ).prop('disabled', true);
}

//.. _pagenum
function _pagenum( pg, name, speed  ) {
	var p = name ? phpvar.pagenum[ name ] : phpvar.pagenum;
	$( p.div )._loadex({ u: p.url + pg, v: p.pvar, speed: speed })
/*
	var $o = $( p.div );
	$('html,body').stop(1,1).animate(
		{ scrollTop: $o.offset().top },
		'fast' , 
		function(){
			$o._loadex({ u: p.url + pg, v: p.pvar, speed: speed })
		}
	);
*/
}

//. [obj] _extcol: 右カラム
_extcol = {
	win_limwidth: 900,
	showing		: false,
	btn_menu_fixed : false ,
	$col		: $( '#ext_column' ),
	$mainb		: $( '#mainbox' ) ,
	$menu		: $( '#menubox' ) ,
	$headbtn 	: $( '#top_opt' ) ,
	$mov		: $( '#movctrl' ) ,
	$vw			: $( '.elm_vw' ) ,
	$btn_menu_pop : $( '#btn_menu_pop' ),

	//.. win_is_wide
	win_is_wide: function() {
		return $(window).innerWidth() > 900;
	},

	//.. init
	init: function() {
		if ( ( this.win_is_wide() && _localstr.get('show_menu') !== '0' )  )
			this.menu( true, 0.1 );
		this.change(0);
		this.scroll();
	},

	//.. scroll: 固定ボタンの表示切り替え
	scroll: function() {
		if ( this.showing ) return;
		if ( $(window).scrollTop() > 
				this.$headbtn.offset().top + this.$headbtn.height() ) {
			if ( ! this.btn_menu_fixed ) {
				this.$btn_menu_pop
					.addClass('btn_menu_fixed')
					.stop(1,1)
					.fadeTo(3000, 0.5)
				;
				this.btn_menu_fixed = true;
			}
		} else {
			if ( this.btn_menu_fixed ) {
				this.$btn_menu_pop.stop(1,1).removeClass('btn_menu_fixed').fadeTo(500,1) ;
				this.btn_menu_fixed = false;
			}
		}
	} ,

	//.. change: 右カラム内容変化にメインコンテンツの幅対応
	change: function( speed ) {
		var w = this.$col.width();
		_pop.hide();
		this.$mainb.animate(
			{ marginRight: ( w > 30 && this.win_is_wide() )
				?  w + 5 //- 右を空ける
				: 0 //- 空けない
			},
			speed == undefined ? 'fast' : speed ,
			function(){
				this.$col.height( $(window).height() );
				_tab.shrink();
			}.bind(this)
		);
	},

	//.. menu:
	menu: function( f, speed ){
		//- f: フラグ trueなら表示
		//- speed: スピード (画面読み込み時と、手動のときはundefinedがくる)
		if ( speed == undefined ) {
			speed = 'medium';
			_localstr.setbool('show_menu', f);
		}
		if ( f ) {
			this.$menu.show( speed, function(){ this.change(); }.bind(this) );
			this.$headbtn.hide( speed );
			this.showing = true;
		} else {
			this.$menu.hide( speed, function(){ this.change(); }.bind(this));
			if ( this.btn_menu_fixed )
				this.$btn_menu_pop.stop(1,1).fadeTo(0,1).fadeTo(3000,0.5);
			this.$headbtn.show( speed );
			this.showing = false;
		}
		this.scroll();
	}
	
//	menu_shadow: function() {
//		this.win_is_wide()
//			? this.$menu.removeClass('shadow')
//			: this.$menu.addClass('shadow')
//		;
//	},
}

//. [obj] _idbox: ID用の入力ボックス
//- idboxはページ中に1個しか無いことを想定
var _idbox = {
	$inpbox: $('#idbox'),
	$info: $('#ent_info') ,

	//.. init
	init: function() {
		this.$inpbox.on('input', function(){
			_timer.do_after_busy(
				function(){ this.change(); }.bind(this) ,
				300 ,
				'idbox'
			);
		}.bind(this));
	},

	//.. info
	info: function( cont ) {
		cont
			? this.$info.html( cont ).slideDown( 'medium' )
			: this.$info.slideUp( 'medium' )
		;
		_pop.hide();
	},

	//.. set
	set: function( id ) {
		this.$inpbox.val( id );
		this.change();
	},

	//.. change
	change: function(){
		this.que = false;
		var i = this.$inpbox.val();
		i.length > 1
			? $.get( phpvar.idservadr + i, function(d) { _idbox.info(d); })
			: this.info()
		;
	},

	//.. clear
	clear: function(){
		this.$inpbox.val('');
		this.info();
	}
}

//. [obj] _acomp 自動補完
var _acomp = {

	//.. init
	init: function() {
		$('.acomp').on( 'input', function(o){
			_timer.do_after_busy(
				function(){ this.getlist(o.target); }.bind(this) ,
				500 ,
				'acomp'
			);
		}.bind(this));
	},

	//.. getlist 実行
	getlist: function(o) {
		var $o = $(o);
		var listname = $o.attr( 'list' );
		$.get(
			'ajax.php',
			{ w: $o.val(), l: listname, mode: 'acomp' },
			function(res){
				res && $('#' + listname).html(res);
			}
		);
	}
}

//. [obj] _hdiv:
var _hdiv = {
	//- excl: exclusive
	$allbtn: $('h1 div.oc_btn'),
	$excl: $('#hdiv_exc'),
	$lev1: $('.lev1'),

	//.. oc 開いたり閉じたり
//- flg = なし: トグル, false 閉じる, true 開く, 2:  排他 
	oc: function( eid, flg, func ) {
		_pop.hide();
		var
			$div = $( '#oc_div_' + eid ) ,
			$btn = $( '#oc_btn_' + eid ) ,
			flg = flg != undefined ? flg : $div.is(':hidden')
		;

		//- 排他モード
		if ( this.$excl.prop('checked') && $div.hasClass( 'lev1' ) )
			flg = 2;

		if ( flg == 2 ) {
			this.$lev1.not( 'div#oc_div_' + eid ).slideUp( 'medium' );
			this.$allbtn.text( '+' );
		}

		if ( flg ) {
			$div.slideDown( 'medium', func );
			$btn.text( '-' );
			//- スクリプトがあれば実行
			var s = $div.data( 'js' );
			s && eval(s);
		} else {
			$div.slideUp( 'medium' );
			$btn.text( '+' );
		}
	},

	//.. focus
	focus: function(eid) {
		this.oc(eid, 1, function(){
			var $h = $('h1#h_' + eid);
			$('html,body').animate(
				{scrollTop: $h.offset().top} ,
				'slow' ,
				function(){
					$h.stop(1,1).fadeOut('fast',
						function(){ $h.fadeIn( 'medium' );} 
					);
				}
			);
		});
	},

	//.. all
	all: function() {
		var flg = false;

		//- 一個でも開いていたら閉じる
		this.$allbtn.each( function(){
			flg = $(this).text() == '-' ? true : flg;
		});
		if ( flg ) {
			this.$lev1.slideUp( 'medium' );
			this.$allbtn.text( '+' );
			this.$excl.prop('checked',true);
		} else {
			this.$lev1.slideDown( 'medium' );
			this.$allbtn.text( '-' );
			this.$excl.prop('checked',false);
		}
	} ,

	//.. all2 配下のhdivを開く
	all2: function(domobj) {
		var $parent = $(domobj).parent() ,
			$btn = $parent.children('h2').children('div.oc_btn') ,
			flg = false
		;
		$btn.each( function(){
			if ( $(this).text() == '-' )
				flg = true;
			console.log( $(this).text() );
		});

		console.log( flg );
		if ( flg ) {
			$parent.children( 'div.lev2' ).slideUp( 'medium' );
			$btn.text( '+' );
		} else {
			$parent.children( 'div.lev2' ).slideDown( 'medium' );
			$btn.text( '-' );
		}
	}
}

//. [obj] _pmov:
var _pmov = {
	$menuctrl: $('#movctrl') ,
	wins: {} ,
	size: 0,

	//.. open ポップアップウインドウを開く
	open: function( data_id, mov_num ) {
		var win_id = 'mov-' + data_id + ( mov_num ? '-' + mov_num : '' );
		//- 右カラム出す
		this.$menuctrl.slideDown('fast')

		//- もうあるならフォーカスするだけ
		if ( this.wins[ win_id ] ) {
			this.wins[win_id].focus();
			return;
		}

		//- リストに追加
		$( _entitem('mov', data_id, mov_num ) )
			.appendTo( '#movlist' )
			.attr( 'id', 'movidx_' + win_id )
			.data( 'wid', win_id )
			.slideDown( 'medium' )
		;

		//- 新規ムービー
		this.movsize = _localstr.get( 'mov.size' ) - 0 || 400;
		this.wins[ win_id ] = window.open(
			phpvar.vwurl.mov + data_id + ( mov_num ? '&num=' + mov_num : '' ) ,	//- URL
			win_id,			//- ウインドウ名
			'menubar=no,location=no,scrollbars=0,'
			+ 'width=' + ( this.movsize + 4 )
			+ ',height=' + ( this.movsize + 54 )
		);
	},

	//.. size: 全ウインドウリサイズ
	size: function( val ){
		this.movsize = [ 200, 300, 400, 600, 800 ][ val ]-0
			|| Math.max( 200, this.movsize += val );
		_localstr.set( 'mov.size', this.movsize );
		this.all( function( o ){
			o.resizeTo(
				o.outerWidth - o.innerWidth + this.movsize + 4, 
				o.outerHeight - o.innerHeight + this.movsize + 54 
			);
		}.bind(this));
		this.tile();
	},

	//.. play
	play: function( val ){
		this.all( function( o ){
			o._mov.play( val );
			o.focus();
		});
	},

	//.. ori: 方向、数値で受け取る
	ori: function( val ){
		this.all( function( o ){
			o._mov.orient( val );
		});
	},

	//.. ori2: 方向、文字列で受け取る
	ori2: function( val ){ //- ori2 ('front'とかの文字列で指定)
		this.all( function( o ){
			o._mov.view( val );
			o.focus();
		});
	},

	//.. close 全て閉じる
	close: function() {
		$( '#movlist' ).html('');
		this.$menuctrl.slideUp('fast');
		this.all( function( o ){
			o.close();
		});
	},

	//.. tile
	tile: function(){
		var x = y = y_nex = x_win = y_win = 0,
			x_scr = window.parent.screen.width ,
			y_scr = window.parent.screen.height ,
			mgn = 2
		;
		$.each( this.wins, function( win_id, o ){
			x_win = o.outerWidth;
			y_win = o.outerHeight;
			if ( x + x_win > x_scr ) {
				x = 0;
				y = y_nex;
			}
			o.moveTo( x, y );

			//- 次の窓の位置
			y_nex = y_nex > y + y_win ? y_nex : y + y_win;
			x = o.screenX + x_win + mgn;
			if ( y > y_scr )
				y = 0;
			o.focus();
		});
	} ,

	//.. all 全ウインドウに対する実行
	all: function( fn ) {
		$.each( this.wins, function( win_id, o_win ){
			if ( o_win.closed ) {
				this.closed( win_id );
			} else {
				fn( o_win );
			}
		}.bind(this));
	} ,

	//.. win: 特定のウインドウを操作
	//- コントローラーからの操作、フォーカスか、閉じるか
	//- ボタンからの呼び出しなので、ボタンに書いてあるdataを参照する
	win: function( flg, domobj ) {
		var wid =  $(domobj).parent().data('wid');
		var o = this.wins[wid];
		if (!o || o.closed )
			this.closed(wid);
		flg ? o.focus() : o.close();
	},

	//.. closed: movウインドウを閉じた時の動作
	//- 子ウインドウのbeforeunloadから、呼び出される
	closed: function( win_id ) {
		//- オブジェクトクリア
		delete this.wins[ win_id ];
		//- アイテムリストからクリア
		$( '#movidx_' + win_id ).hide( 'medium', function(){ $(this).detach() } );
		//- ムービーがなくなったら、コントローラーも消す
		if ( Object.keys( this.wins ).length == 0 ) {
			this.$menuctrl.slideUp('fast');
		}
	}
}

//. [obj] _vw: ビューアー共通
_vw = {
	//.. vars
	wins: {},
	cmdhist_lastid: false,
	cmdhist_lastmsg: false,
	qtimer: {},
	qloopcnt: {},
	ques: {},

	conf: {
		apps: {
			mol: _localstr.get('viewer.apps.mol') || 'molmil', 
			map: _localstr.get('viewer.apps.map') || 'sview'
		},
//		intab: _localstr.get('viewer.intab' ) === '1',
		winsize: _localstr.getjson('viewer.winsize') || [500,500]
	} ,

	$menu_apps	: {
		map: $('.menu_viewer_map') ,
		mol: $('.menu_viewer_mol')
	},
//	$chkbox_intab	: $('#chk_vw_intab' ) ,
	$menuctrl	: $( '#vwctrl' ) ,
	$cmdhist_box	: $('#cmdhist') ,
	$pick_id		: $('#p_id'   ) ,
	$pick_chain	: $('#p_chain') ,
	$pick_res	: $('#p_res'  ) , 
	$pick_atom	: $('#p_atom' ) ,
	$pick_img	: $('#p_img' ) ,


	//.. init_vwmenu: デフォルトビューア
	//- 開始時、メニューUI設定
	init_vwmenu: function() {
		this.$menu_apps.map.val( this.conf.apps.map );
		this.$menu_apps.mol.val( this.conf.apps.mol );
//		this.$chkbox_intab.prop('checked', this.conf.intab );
	},

	//.. select_defvw
	//- ユーザーによる変更
	select_defvw: function(type,domobj) {
		var v = $(domobj).val();
		if ( v == this.conf.apps[type] ) return;
		this.conf.apps[type] = v;
		_localstr.set('viewer.apps.' + type, v ); 
		this.init_vwmenu();
	} ,

	//.. open ビューアウインドウを開く
	//- DOMのdata-jmol/data-molmilにもコマンド
	open: function( did, param ) {
		//- param.map: bool マップビューアならtrue: 
		//- param.obj: DOM obj
		//- param.cmd: コマンド

		var o = {};
		var viewer_appli = this.conf.apps[ param && param.map ? 'map' : 'mol' ];
		var win_id = viewer_appli + '-' + did;

		this.$menuctrl.slideDown('fast');

		//- ビューアにコマンドキュー送信
		if ( param ) {
			if ( param.obj )
				o = $(param.obj).data(viewer_appli); //- コマンドを読み取る
			if ( param.cmd && param.cmd[viewer_appli] )
				o = param.cmd[viewer_appli];
			if ( o ) {
				o.trg_obj = param.obj;
				this.que( win_id, o, viewer_appli );
			}
		}

		//- もうあるならフォーカスするだけ
		if ( this.wins[ win_id ] && !this.wins[ win_id ].closed ) {
			this.wins[ win_id ].focus();
			return false;
		}

		//- リストに追加
		$( _entitem('mol', did ) ).appendTo( '#vwlist' )
			.attr( 'id', 'vwidx_' + win_id )
			.data( 'wid', win_id )
			.slideDown( 'medium' )
		;

		//- 開く
		this.wins[ win_id ] = window.open(
			phpvar.vwurl[viewer_appli] + did,	//- URL
			win_id,			//- ウインドウ名
			'menubar=no,location=no,scrollbars=0,'
			+ 'width=' + this.conf.winsize[0]
			+ ',height=' + this.conf.winsize[1]
		);
		return true;
	},

	//.. que: 応答するまで、コマンドを送り続ける
	//- vappはなくてもいい
	que: function( win_id, que, vapp ) {
		if (!que) return;
		vapp = vapp || 'viewer';

		this.ques[win_id] = this.ques[win_id] || [];
		this.ques[win_id].push( que );

		clearInterval( this.qtimer[win_id] );
		this.qloopcnt[win_id] = 0;
		this.qtimer[win_id] = setInterval( function(){
			//- カウントしてタイムアウトチェック
			++ this.qloopcnt[win_id];
			if ( this.qloopcnt[win_id] > 50 ) {
				this.msg_que( win_id, 'timeout' );
				this.clear_que(win_id);
				return;
			}
			//- 窓が閉じた？
			if ( this.wins[win_id] && this.wins[win_id].closed ) {
				this.clear_que(win_id);
				delete this.wins[win_id];
				this.msg_que( win_id, 'window is closed' )
				return;
			}
			//- 準備中？
			if (
				! this.wins[win_id] ||
				! this.wins[win_id]._popvw ||
				! this.wins[win_id]._popvw.ready 
			) {
				this.msg_que( win_id, 'not ready' );
				return;
			}
			//- 先に止めておかないと、重い処理を繰り返してしまう
			clearInterval( this.qtimer[win_id] );

			//- キュー投下
			this.wins[win_id].focus();
			this.wins[win_id]._popvw.que_exe( this.ques[win_id] );
			this.clear_que(win_id);
			this.msg_que( win_id, 'ok' );
		}.bind(this), 500 );
	},
	clear_que: function( win_id ) {
		this.ques[win_id] = [];
		clearInterval( this.qtimer[win_id] );
	} ,
	msg_que: function( win_id, str ) {
		this.cmdhist( win_id, 'que of ' + win_id + ': ' + str );
	} ,

	//.. win
	win: function(flg, domobj) {
		var wid =  $(domobj).parent().data('wid');
		var o = this.wins[wid];
		if (!o || o.closed )
			this.closed(wid);
		if (flg) {
			window.blur();
			o.focus();
		} else {
			o.close();
		}
	},

	//.. winsized: ウィンドウサイズ変更
	winsized: function( wh ) {
		_localstr.setjson('viewer.winsize', wh );
		this.conf.winsize = [wh[0], wh[1]];
	} ,

	//.. close: 全ウインドウを閉じる
	close_all: function() {
		$.each( this.wins, function( win_id, o_win ){
			if ( o_win.closed ) return;
			o_win.close();
		});
		this.$menuctrl.slideUp('fast');
	},

	//.. closed ウインドウを閉じた時の動作
	//- 子ウインドウのbeforeunloadから、呼び出される
	closed: function( win_id ) {
		//- オブジェクトクリア
		delete this.wins[ win_id ];
		this.cmdhist( win_id, 'Window closed', 'green' );

		//- アイテムリストからクリア
		$( '#vwidx_' + win_id ).hide( 'medium', function(){ $(this).detach() } );

		//- ビューアウインドウがなくなったら、コントローラーも消す
		if ( Object.keys( this.wins ).length == 0 ) {
			this.cmdhist( '', 'All closed', 'green' );
			this.$menuctrl.slideUp('fast');
		}
	},

	//.. cmdhist: コマンドヒストリ
	// str: 文字列, col => 色
	//var cmdcnt = 0;
	cmdhist: function( win_id, str, col ) {
		if (!str) return;
		//- 繰り返しなら書かない
		if ( this.cmdhist_lastmsg == win_id + str ) return;
		this.cmdhist_lastmsg = win_id + str;
			
		//- 前回と違うIDからのメッセージならIDを書く
		if ( win_id != this.cmdhist_lastid ) {
			this.$cmdhist_box.append( '<p class="green bld">['+win_id+']</p>' );
			this.cmdhist_lastid = win_id;
		}
		//- htmlエスケープするため、タグと中身を別々に挿入
		this.$cmdhist_box.append( '<p></p>' );
		this.$cmdhist_box.children( 'p:last' ).text( str ).addClass( col );
		if ( this.$cmdhist_box.children('p').length > 100 )
			this.$cmdhist_box.children( 'p:first' ).remove();
		this.$cmdhist_box.scrollTop( 10000 );
	},

	//.. mousepick:
	mousepick: function( wn, str ) {
		var a = str.replace( /^.*?\[(.+?)\](.+?):(.+?)\.(.+?) #(.*?) .+$/, '$1,$2,$3,$4,$5' )
			.split( ',' );
		//- コマンドパネルに書き込み
		this.$pick_id	.text( wn.replace( 'jmol-', '' ) );
		this.$pick_chain	.text( a[2] );
		this.$pick_res	.text( a[0] + '-' + a[1] );
		this.$pick_atom	.text( a[3] + '-' + a[4] );
		var o = this.$pick_img;
		//- chemcompの画像
		$.get( phpvar.idservadr + a[0], function( data ) {
			if ( data == '' )
				o.slideUp( 'fast' );
			else
				o.html( data ).slideDown( 'fast' );
		});
	}
}

//. [func] _entitem
function _entitem( type, data_id, movnum ) {
	var id = data_id.replace( /^.+-/, ''  );
	var db = data_id.substr(0,1).toLowerCase();

	return type == 'mol'
		? phpvar.vwidx_bar
			.replace( '__imgurl__',
				phpvar.imgurl.vw[db]
					.replace( '__id__', id )
			)
			.replace( '__str__', id )
		: phpvar.movidx_bar
			.replace( '__imgurl__',
				phpvar.imgurl.mov[db]
					.replace( '__id__', id )
					.replace( '__num__', movnum || ( db == 'e' ? 2 : 'dep' ) )
			)
			.replace( '__str__', id + ( movnum ? ' #' + movnum : '' ))
	;
}
