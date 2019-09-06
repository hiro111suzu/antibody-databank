var
	w_o = window.opener
;

//. _popvw ビューア共通オブジェクト
_popvw = {
	wo: window.opener ,
	ready: false ,

	$prgbar: $('#loadingbar') ,
	$msgbox: $('#pmsgbox') ,
	$msg: $('#pmsg') ,

	//.. ready
	set_ready: function() {
		this.ready = true;
		this.$prgbar.hide( 'medium' );
		this.cmdhist( 'Ready', 'blue' );
	},

	//.. cmdhist
	cmdhist: function( str, col ){
		w_o && w_o._vw.cmdhist( window.name, str, col );
		this.$msg.append('<p></p>');
		this.$msg.children('p:last').text( str ).addClass( col )
			.delay(5000).slideUp('meidum', function() { $(this ).remove(); })
		;
	},
	//.. que_exe
	que_exe: function( que ) {
		
		que.forEach( function( qobj ){
			if ( _cmd[ qobj.cmd ] ) {
				_cmd[ qobj.cmd ]( qobj.param, qobj.trg_obj );
				return;
			}
			if ( ! _cmd.other(qobj.cmd) )
				_popvw.cmdhist( window.getId + ': No such command: ' + qobj.cmd );
		});
	}
}

//. window 変化トリガ (ムービー以外共通)
if ( phpvar.app != 'mov' ) {
	$(window).on({
		//.. リサイズ
		resize: function(){
			_tab.shrink();
			_gmenu.resize();
			//- 最大化?なら保存しない
			if (
				screen.availWidth - window.outerWidth < 20 &&
				screen.availHeight - window.outerHeight < 20
			){
				return;
			}
			w_o && w_o._vw.winsized([$(window).innerWidth(), $(window).innerHeight()]);
		} ,
		//.. 閉じたら、メインウインドウに伝える
		beforeunload: function(e){
			w_o && w_o._vw.closed( window.name );
		}
	});
}

//. topbar / gmenu
var _gmenu = {
	//.. vars
	blank: true,
	$bar: $('#ttbar') ,
	$menu: $('#gmenu') ,
	
	//.. show
	show: function() {
		this.$menu.stop(1,1).slideDown('fast');
		this.$bar.stop(1,1).slideUp('fast');
		if ( this.blank ) {
			this.blank = false;
			this.$menu.show().load( '?ajax=gmenu', phpvar.postv,
				function(){
					_tab.refresh();
					if ( typeof _gmenu_init == 'function' )
						_gmenu_init(); 
				}
			);
		}
	},
	
	//.. hide
	hide: function() {
		this.$menu.stop(1,1).slideUp('slow');
		this.$bar.stop(1,1).slideDown('fast');
	},
	
	//.. reset
	reset: function( f ) {
		this.blank = true;
		f ? this.show() : this.hide(); 
	},
	
	//.. resize
	resize: function() {
		var w = $( window ).width(),
			h = $( window ).height()
		;
		if ( h < w && 1000 < w ) {
			this.$menu.addClass( 'gmenu_r' );
			_popvw.$msgbox.css( 'width', '50%' );
		} else {
	 		this.$menu.removeClass( 'gmenu_r' );
			_popvw.$msgbox.css( 'width', '100%' );
	 	}
	}
};

//. 親ウインドウの関数を呼ぶ関数
function _ofunc( func, v1, v2, v3, v4 ) {
	if ( $.isFunction( w_o[ func ] ) ) {
//		console.log( func );
		return w_o[ func ]( v1, v2, v3, v4 );
	} else if ( $.isFunction( w_o[ '_p' + phpvar.app ][ func ] ) ) {
//		console.log( '_p' + phpvar.app + '.' + func );
		return w_o[ '_p' + phpvar.app ][ func ]( v1, v2, v3, v4 );
	} else {
		console.log( 'no func: '+ func );
	}
}

