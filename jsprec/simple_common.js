/*
simple fw 
popup viewerと共通
*/

//. jquery 拡張 _loadex
jQuery.fn.extend({
	_loadex: function( opt ) {
		var $cont_box = $(this);
		var speed = opt.speed === undefined ? 'medium' : opt.speed;
		var $body = $('html,body')
		_pop.hide();

		if ( $cont_box.offset().top < $body.scrollTop() ) {
			$('html,body').stop(1,1).animate(
				{ scrollTop: $cont_box.offset().top },
				'slow'
			);
		}

		return $cont_box.slideUp( speed, function(){
			$cont_box.html( phpvar.loading ).show().load( opt.u, opt.v, opt.func );
		});
	}
});

//. [obj] _localstr: localStorage
var _localstr = {

	//.. get
	get: function( name ) {
		return localStorage.getItem('yorodumi.' + name );
	},

	//.. getjson
	getjson: function( name ) {
		return JSON.parse( this.get( name ) );
	},

	//.. getbool
	getbool: function( name ) {
		return this.get( name ) === '1' ;
	},

	//.. setjson
	setjson: function( name, val ) {
		this.set( name, JSON.stringify(val) )
	},

	//.. setbool
	setbool: function( name, val ) {
		this.set( name, val ? 1: 0 )
	},

	//.. set
	set: function( name, val ){ 
		_timer.do_after_busy( function(){
			localStorage.setItem('yorodumi.' + name, val );
//			console.log({ 'localstr_setting': name +': '+ val});
	    }, 500, 'localstr_' + name );
	}
};

//. [obj] _tabs
var _tab = {
	$p: $( '.tabp' ) ,
	
	//.. refresh
	refresh: function() {
		this.$p = $( '.tabp' );
	},

	//.. s: 切替
	s: function( id1, id2, js ) {
		var i = id1 + '_' + id2;
		$('.tabbtn_' + id1).prop('disabled', false);
		$('#tabbtn_' + i).prop('disabled', true);
		$('.tabdiv_' + id1).hide();
		$('#tabdiv_' + i).show();
		_pop.hide();

		js && eval(js);
		this.shrink();
	},

	//.. shrink
	//- タブが収まりきらないときの対処
	shrink: function() {
		_timer.do_after_busy( function(){
			this.shrink_main();
		}.bind(this), 100 );
	},
	shrink_main: function() {
		this.$p.each( function(){
			var wid_cont, wid_pre, wid_tabs = 0, wid_tabs_lim = 0, maxwid, w,
				$btns, o_wrap, num_tabs,
				$tabp = $(this),
				mrgn_r = 2
			;

			//- 隠れてたらやらない
			if ( $tabp.is(':hidden') ) return; 

			//- コンテナ広さ
			wid_cont = $tabp.parent().width() - 10;

			//- タブの合計幅
			$btns = $tabp.children('.tabbtn');
			$btns.css({ maxWidth: 'none' }); //- 一旦戻す
			num_tabs = $btns.length;
			maxwid = Math.round( wid_cont / num_tabs ) + 10;

			$btns.each( function(){
				w = $(this).outerWidth() + 4;
				wid_tabs += w;
				wid_tabs_lim += Math.min( maxwid, w );
			});

			//- プレ文字列 改行するか
			wid_pre = $tabp.children('.tabstr').width();
			$wrap = $tabp.children('.wrap');
			0 < wid_pre && wid_cont < wid_tabs + wid_pre
				? $wrap.show() : $wrap.hide();

			//- タブ幅制限するか
			if ( wid_cont < wid_tabs ) {
				wid_tabs = wid_tabs_lim;
			} else {
				maxwid = 'none';
			}

			//- マージン
			if ( wid_cont < wid_tabs ) {
				mrgn_r = Math.max(
					Math.round(( wid_cont - wid_tabs)/num_tabs) ,
					-50
				);
			}
			//- css書き換え
			$btns.css({
				overflow	: 'hidden' ,
				maxWidth	: maxwid ,
				marginRight	: mrgn_r
			});
		});
	}
}

//. [obj] _pop: ポップアップ
var _pop = {
	$box: { 1: $('#popbox'), 2: $('#popbox2'), 3: $('#popbox3') },
	$trig: { 1:false, 2:false, 3: false } ,

	//.. up
	up: function( o, lev ) {
		var $trg = $(o);
//		console.log( 'popup!!' );
		//- レベル決定 ポップボックスの中？
		if ( lev == undefined ) {
			if ( $trg.parents('#popbox2').length > 0 ) {
				return this.up( o, 3 );
			} else if ( $trg.parents('#popbox').length > 0 ) {
				return this.up( o, 2 );
			} else {
				lev = 1;
			}
		}
		this.hide( lev + 1 );

		//- 以前のトリガを戻す
		this.$trig[lev] && this.$trig[lev].removeClass( 'poptrg_act' );
		this.$trig[lev] = $trg;

		if ( $trg.hasClass( 'poptrg_act' ) ) {
			//- すでに出ているときはしまう（トグル動作）
			this.hide( lev );
		} else {
			this.show( lev, $trg );
		}
	},

	//.. show
	show: function( lev, $trg ) {
		var url = $trg.data( 'url' );
		if ( url ) {
			$.get( url, function(d){
				var cont = ( $trg.data( 'pre' ) || '' ) + d;
				this.$box[lev].html( phpvar.popxbtn[lev] + cont );
				$trg.data( 'pop', cont ).data( 'url', '' ).data( 'pre', '' );
			}.bind(this));
		}
		$trg.addClass( 'poptrg_act' );
		this.$box[lev]
			.fadeTo( 0, 0 )
			.html( phpvar.popxbtn[lev] + $trg.data( 'pop' ) )
			.position({
				of: $trg,
				my: 'left top' ,

				//- li要素の中だったら横に出す
				at: $trg.parent()[0].tagName == 'LI'
					 ? 'right top' : 'left bottom',
				collision: 'flipfit' 
			})
			.fadeTo( 'medium', 0.95, function(){
				var js = $trg.data( 'js' );
				js && eval( js );
			})
		;
	},

	//.. hide
	hide: function ( lev ) {
		for ( var n = 3; n >= ( lev || 1 ); n-- ) {
			this.$trig[n] && this.$trig[n].removeClass( 'poptrg_act' );
			this.$box[n].fadeTo( 'fast', 0, function(){ $(this).html('');} );
		}
	}
}

//. function
//.. _more
function _more( eid, flg ) {
	_pop.hide();
	var 
		$more  = $('#more_'  + eid),
		$moreb = $('#moreb_' + eid),
		$lessb = $('#lessb_' + eid)
	;
	if ( flg ) {
		$more.hide('fast');
		$moreb.show('fast');
		$lessb.hide('fast');
	} else {
		$more.show('fast');
		$moreb.hide('fast');
		$lessb.show('fast');
	}
}

//.. long
function _long( eid, flg ) {
	_pop.hide();
	var
		$short = $('#short_'  + eid),
		$long  = $('#long_'  + eid)
	;
	if ( flg ) {
		$long.hide();
		$short.show();
	} else {
		$long.show();
		$short.hide();
	}
}
//.. _limany
function _limany( eid, flg ) {
	_pop.hide();
	if ( flg ) {
		$('#ulm_' + eid + ' .more').show('fast');
		$('#less_' + eid).show('fast');
		$('#more_' + eid).hide('fast');
	} else {
		$('#ulm_' + eid + ' .more').hide('fast');
		$('#less_' + eid).hide('fast');
		$('#more_' + eid).show('fast');
	}
}
//. [obj] _timer
var _timer = {
	timer: {},
	flg_busy: {},
	
	//.. do_after_busy
	//- 落ち着くのを待つ、初回でも待ってから、
	//- 頻繁に実行されると、その間なにも実行されない
	//- 最後の処理は必ず実行されるはず
	do_after_busy: function( func, msec, name ) {
		name = name || 'temp';
		clearTimeout( this.timer[ name ] );
		this.timer[ name ] = setTimeout( function(){ func() }, msec || 100 );
	},

	//.. busy 同じことを頻繁にしないように
	//- if ( _timer.busy() ) return など
	//- busy 時々実行する処理用、最後が実行されないこともある
	busy: function( msec, name ) {
		name = name || 'defo';
		if ( this.flg_busy[ name ] ) return true;
		this.flg_busy[ name ] = true;
		setTimeout(
			function(){ this.flg_busy[name] = false }.bind(this),
			msec || 100
		);
	}
}
