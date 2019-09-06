
//. 開始時
$( function() {
	//.. asymbar_box
	$( '.asymbar_box' ).click( function(){
		$( this ).children('.asymbar_tx' ).toggle();
	})

	//.. 化合物画像
	$('.chemsvg').click( function(){
		var o = $(this);
		var s = o.width() == 100 ? 500 : 100;
		o.animate({ width: s, height: s }, 'medium' );
	});
	//.. validation report
	$('#valrep_img').click( function(){
		var o = $(this);
		o.animate({ width: o.width() > 300  ? 300 : 600 }, 'medium' );
	});
	//.. svg
	$('.svgimg').click( function(){
		var $o = $(this);
		var flg_large = $o.height() > 300;
		$o.animate({ height: flg_large ? 100 : 500 }, 'medium',
			function(){ flg_large ? _pop.hide() : '' }
		);
	});

	//.. 装置画像
	$('.eqimg').click( function(){
		var $t = $(this);
		$t.hasClass('eqimgl') ? $t.removeClass('eqimgl') : $t.addClass('eqimgl');
	});
	//.. その他
	phpvar.randimgck
		? _randimg.ckget()
		: _randimg.init()
	;

	_slab.init(); //- スラブスライダー
	_slcimg.init(); //- EMスライス画像
});

//. uc
/*
var _ucell = {
	$inner: $('#uc_inner2') ,
	current: false ,
	alpha: function() {
		this.rot( 'alpha', 0, -5, 20 );
	},
	beta: function() {
		this.rot( 'beta', 0, -5, -20 );
	},
	gamma: function() {
		this.rot( 'gamma', 0, 20, 0 );
	},
	rot: function( a, z, x, y ) {
		if ( this.current == a ) {
			alert( 'reset' );
			this.current = false;
			this.$inner.css(
				'transform', 'rotateZ(180deg) rotateX(20deg) rotateY(45deg)' );
		} else {
			alert( a );
			this.$inner.css( 'transform',
				'rotateZ(' +z+ 'deg) rotateX(' +x+ 'deg) rotateY(' +y+ '45deg)'
			);
			this.current = a;
		}
	}
}
*/

//. obj: _randimg: ランダム選択画像
var _randimg = {
	$box: $('#randimg'),
	$btns: $('.randimgbtn') ,
	$histbox: $( '#histimgbox' ) ,
	flg: { rand:false, hist:false },

	//.. init
	init: function() {
		this.$box.html() == '' && this.rep();
	},

	//.. rep 取得
	rep: function _randimg( mode, obj ) {
		this.$btns.removeClass( 'shine' );
		obj && $(obj).addClass( 'shine' );
		this.$box._loadex({
			u: 'ajax.php',
			v: {mode:'randimg', rmode:mode, t:Date()}
		}); 
	},

	//.. ckget
	ckget: function() {
		if ( this.$box.html() != '' ) return;
		this.$box._loadex({
			u: 'ajax.php' ,
			v: {mode:'randimgck', t:Date()}
		});
	},
	//.. hist
	hist: function() {
		if ( this.$histbox.html() != '' ) return;
		this.$histbox._loadex({
			u: 'ajax.php' ,
			v: {mode:'randimghist', t:Date()}
		});
	}
}

//. [obj] _dettab PDBのエンティティ詳細情報タブ
var _dettab = {
	//.. get
	get: function( mode, eid ) {
		var $o = $('#box' + mode + eid );
		if ( $o.html == '' ) return;
		$o.load(
			'quick-ajax.php',
			{ ajax:mode, id:phpvar.entinfo.did, eid:eid } ,
			function() {
				$(this).prev().hide(); //- loading bar を隠す
			}
		);
	},
	//.. reget
	reget: function( mode, eid, aid ) {
		$('#box' + mode + eid ).load(
			'quick-ajax.php',
			{ ajax:mode, id:phpvar.entinfo.did, eid:eid, aid:aid } 
		);
	}
}

//. [obj] _slcimg: EMマップ スライス
var _slcimg = {
	sizing: false ,
	line_reset: true ,
	$lines		: $( '.l_slc' ) ,
	$imgs		: $( '#pstable td img' ),
	$resizebtns	: $( '.pssize' ) ,
	$xbtn		: $( '#pstable tr th button.xbtn' ) ,
	$td			: $( '#pstable td' ) ,

	//.. init
	init: function() {
		var that = this;
		$( '.slc' ).hover(
			function(){ that.hov_in(this); },
			function(){ that.hov_out(); }
		);
		this.$lines.mouseover( function(){ $(this).stop().hide() } );
	},

	//.. hov_in: スライス要素にホバー
	hov_in: function( domobj ) {
		if ( this.sizing ) return; //- サイズ変更中はやらない

		//- hoverされた要素
		var i = $(domobj).attr('id') ,
			hov = {
				ang: i.substr( 4, 1 ) ,
				lev: i.substr( 5, 1 ) 
			} ,
			angs = [ 'z', 'y', 'x' ],
			levs = [ 'a', 'b', 'c', '_', 's' ],
			lev,
			cur = {} ,
			$img, img = {} ,
			$line ,
			ani1, ani2,
			i, j
		;
		this.$lines.stop(1,1).fadeOut( 0.5 );

		for ( i in angs ) for ( j in levs ) {
			cur = {
				ang: angs[i],
				lev: levs[j]
			};
			if ( cur.ang == hov.ang ) continue;

			//- 線を引く対称の画像オブジェクト
			$img = $( '#slc_' + cur.ang + cur.lev );

			//- 画像がないならやらない
			if ( $img.length === 0 || ! $img.is( ":visible" ) ) continue;

			img = {
				wid: $img.width() ,
				hei: $img.height() ,
				top: $img.offset().top ,
				lef: $img.offset().left 
			};
			$line = $( '#l_slc_' + cur.ang + cur.lev ) //- 線のオブジェクト

			//- アニメーション
			if ( hov.ang == 'z' || ( hov.ang == 'y' && cur.ang == 'z' ) ) {
				//- 横線モード
				lev = phpvar.lv2r[0][ cur.ang ][ hov.lev ];
				lev = Math.round( img.hei * ( this.flg_yflip ? 1 - lev : lev ) );
				ani1 = {
					opacity	: 1,
					top		: img.top + lev + 1 ,
					left	: img.lef + 2 ,
					width	: img.wid - 2 ,
					height	: 0
				}
			} else {
				// 縦線モード
				lev = Math.round( img.wid * phpvar.lv2r[1][ cur.ang ][ hov.lev ] );
				ani1 = {
					opacity: 1,
					top: 	img.top + 2 ,
					left: 	img.lef + lev + 1 ,
					width: 	0 ,
					height: img.hei - 2
				};
			}

			//- アニメーション（表面、投影）
			ani2 = {
				top		: img.top + 2 ,
				left	: img.lef + 2 ,
				width	: img.wid - 2 ,
				height	: img.hei - 2
			};

			//- 線の初期化
			if ( this.line_reset ) {
				$line.stop(1,1).css( ani2 )
			}

			//- 実行
			if ( hov.lev == 's' || hov.lev == '_' ) {
				//- 表面、投影
				$line
					.stop(1,1)
					.animate( ani1, 10 )
					.animate( ani2, 800 )
					.animate( ani1, 10 )
					.fadeTo( 2000, 0.6 )
				;
			} else {
				//- 断面
				$line
					.stop(1,1)
					.show()
					.animate( ani1, 'fast' )
					.fadeTo( 2000, 0.6 )
				;
			}
		}
		this.line_reset = false;
	} ,

	//.. hov_out: ホバーout
	hov_out: function( s ) {
		this.$lines.stop(1,1).fadeOut( s == undefined ? 2000 : s );
	},

	//.. sldsize: スライス画像サイズスライダー
	$sld_size: $('#sld_size'),
	sldsize: function() {
		_timer.do_after_busy(
			function(){ this.size( this.$sld_size.val() ) }.bind(this) ,
			'sldsize',
			200
		);
	},
	
	//.. size: スライス画像サイズ変更
	size: function( size, obj ) {
		this.line_reset = true;
		this.sizing = true;
		this.hov_out( 100 );
		this.$imgs.each( function(){
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
			o.stop(0,0)
				.animate( sizeto, 'medium', function(){ _slcimg.sizing = false; })
				.attr( 'src', src )
			;
		});

		//- 押したボタンを無効に
		this.$resizebtns.prop('disabled', false);
		obj && $( obj ).prop('disabled', true );

		//ｰ 大きくしたときは前面に出す
		$( '#t_Map' ).css({ position: 'relative', zIndex: (size > 100 ? 200 : 0 ) });
		if ( size > 100 ) {
			this.$xbtn.show('medium');
		} else {
			this.$xbtn
				.hide('medium').attr('onclick', '_slcimg.hide(this)').text( 'X' );
			this.$td.show('medium');
		}
	},

//.. hide: スライス画像隠す
	hide: function( o, flg ) {
		var o = $( o ), p = o.parent( 'th' );
		this.line_reset = true;
		o.attr( 'onclick', '_slcimg.show(this)' ).text( ' + ' );
		p.children( 'p' ).hide( 'medium' );
		p.nextAll( 'td' ).hide( 'medium' );
	},
//.. show: スライス画像表示
	show: function( o ) {
		var o = $( o ), p = o.parent( 'th' );
		this.line_reset = true;
		o.attr( 'onclick', '_slcimg.hide(this)' ).text( 'X' );
		p.children( 'p' ).show( 'medium' );
		p.nextAll( 'td' ).show( 'medium' );
	},

	//.. filter: contrast / brightness
	$sld_brgt: $('#sld_brgt') ,
	$sld_cont: $('#sld_cont') ,
	$chkb_invt: $('#chkb_invt') ,
	filter: function() {
		_timer.do_after_busy(
			function(){
				this.$imgs.css( 'filter',
					'brightness(' + this.$sld_brgt.val() + '%) ' +
					'contrast('   + this.$sld_cont.val() + '%) ' +
					'invert(' + ( this.$chkb_invt.prop('checked') ? 100 : 0 ) + '%)'
				);
			}.bind(this) ,
			'sldfilter',
			50
		);
	},

	//.. yflip
	flg_yflip: false ,
	$chkb_yflip: $('#chkb_yflip' ) ,
	yflip: function() {
		this.flg_yflip = this.$chkb_yflip.prop('checked');
		this.$imgs.css('transform', 'scaleY(' + (this.flg_yflip ? '-' : '') + '1)');
	},

	//.. reset
	reset: function(){
		this.$sld_brgt.val(100);
		this.$sld_cont.val(100);
		this.$sld_size.val(100);
		this.$chkb_invt.prop('checked', false);
		this.$chkb_yflip.prop('checked', false);
		this.sldsize();
		this.filter();
	}
}

//. _qvw
var _qvw = {
	//- 配列選択
	seqsel: function( odom ){
		var seq, $o = $(odom);

		//- 選択文字列取得(謎の拾ったコード)
		if (window.getSelection) {
			seq = window.getSelection().toString();
		} else if (document.selection) {
			seq = document.selection.createRange().text;
		}
		seq = seq.replace( /[^A-Za-z]/g,'').toUpperCase();//- 空白消し
		if ( seq.length == 0 ) return;

		_vw.open( phpvar.entinfo.did, {
			obj: $o,
			cmd: {
				'molmil':{
					cmd: 'focus_seq',
					param: { seq: seq, aid: $o.data('aid') }
				}
			}
		});
	}
/*
	selbtn: function(obj){
		var $o = $(obj);
		console.log(
			{jmol: $o.data('jmol'), molmil: $o.data('molmil')}
		);
	} 
*/
}

//. Jmol
//.. _jmolq: jmol-mainにqueを送信
function _jmolq( que ) {
	_pjmol.que( 'jmol-main', que );
}

//.. _btn_deco: 選択ボタンなどをデコレーション
function _btn_deco( mode, obj ) {
	if ( mode == 'select' ) {
		$( '.select_btn' ).removeClass( 'act' ).removeClass( 'failed' );
	} else if ( mode == 'asb' ) {
		$( '.asb_btn' ).removeClass( 'act' );
	}
	obj && $(obj).addClass( 'act' );
}

//.. _datareloaded: データのリロードがあった時の対処
function _datareloaded() {
	_btn_deco( 'select' );
	_btn_deco( 'asb' );
}

//.. _selected_count: 選択原子数を受け取った
function _selected_count( num ) {
	if ( num == '0' ) {
		$( '.select_btn.act' ).addClass( 'failed' );
	}
}

//. object _uicom: UIからコマンド
var _uicom = {
	//..  ドロップメニュー
	menu: function( o ) {
		_uicom.ex( $(o).children( 'option:selected' ).data() );
	} ,

	//.. ボタン
	btn: function( o ) {
		_uicom.ex( $(o).data() );
	} ,

	//.. 実行
	ex: function( d ) {
		d.jmolc && _jmolq( d.jmolc );
		d.js && eval( d.js );
	}
}

//. object: _vwcmd: misc ビューアコマンド
// function _vwcmd( mode, trg_obj ) {
//- htmlからオブジェクトを受け取るノリで
var _vwcmd = {
	//.. quality: ビューア画質
	quality: function( trg_obj ) {
		var f = $(trg_obj).prop('checked');
		_jmolq( f ? 'hq' : 'lq' );
		_cookie( 'jmol_hq', f ? 1 : 0 );
	} ,

	//.. blackbg: 黒背景
	blackbg: function( trg_obj ) {
		_jmolq( $(trg_obj).prop('checked') ? 'bgblack' : 'bgwhite' );
	},
	//.. resetview
	reset_view: function() {
		//- 背景白、高画質オフ、立体視オフ、断面スライダーリセット
		//- jmolコマンド
		$('.menu_view').val('d');
		$('.chk_view').prop('checked', false);
		_jmolq('bgwhite');
		_jmolq('lq');
		_jmolq('boundbox off; stereo off; reset;');

		_slab.reset();
	}
}

//. object: _slab: スラブ
var _slab = {
	$sld: $( '#slab_slider' ) ,
	$range: {} ,
	fvals: { c: -1, t: -1 } ,

	//.. init
	init: function() {
		var that = this;
		this.$sld.slider({
			values: [ 0, 100 ],
			range: true,
			create: function(){
				that.$range = that.$sld.children( '.ui-slider-range' );
			},
			slide: function( event, ui ) {
				if ( ! _timer.busy( 300 ) )
					that.slide( ui.value );
			},
			stop: function( event, ui ) { that.slide( ui.value ); }
		});
	},

	//.. get/set
	getpos: function() {
		return this.$sld.slider( 'option', 'values' );
	} ,
	setpos: function( v1, v2 ) {
		this.$sld.slider( 'values', v1, v2 );
	} ,

	//.. reset
	reset: function() {
		this.$sld.slider({values: [ 0, 100 ]});
		this.fvals = { t: -1, c: -1 };
		$( '#slab_fix' ).val( 'none' ); //- メニューをリセット
		this.$range.removeClass( 'shine' ).text('');
		_jmolq( 'slab off;depth 0;set zDepth 0; set zshade on;slab 60' );
	} ,

	//.. スライドした
	slide: function( cv ) {
		var v = this.getpos();
		if ( this.fvals.t > -1 ) { //- 厚さ固定
			if ( cv != v[1] ) { //- handle #0?
				this.setpos( 1, Math.min( 100, v[0] + this.fvals.t ) );
			} else {
				this.setpos( 0, Math.max( 0, v[1] - this.fvals.t ) );
			}
		} else if ( this.fvals.c > -1 ) { //- 中心固定
			if ( cv != v[1] ) {
				this.setpos( 1, Math.min( 100, 2 * this.fvals.c - v[0] )  );
			} else {
				this.setpos( 0, Math.max( 0, 2 * this.fvals.c - v[1] )  );
			}
		}
		_jmolq( 'slab ' + (100-v[0]) + ';set zDepth ' + (100-v[1]) + '; slab on;' );
	} ,

	//.. fix: スラブ固定
	// f1: なし:リセット 1:thick 0:center
	// f2: 0:ON 1:OFF
	fix: function( o ) {
		var fixmode = $( o ).val();
		var v = this.getpos();
		if ( fixmode == 'thick' ) {
			this.fvals.t = v[1] - v[0];
			this.$range.addClass( 'shine' ).text('');
		} else if ( fixmode == 'center' ) {
			this.fvals.c = Math.round( ( v[1] + v[0] ) / 2 );
			this.$range.addClass( 'shine' ).text('|');
		} else {
			this.fvals = { t: -1, c: -1 };
			this.$range.removeClass( 'shine' ).text('');
		}
	}
}

