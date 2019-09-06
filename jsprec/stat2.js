/*
stat.js
statページ用
*/

//. init
var
$win = $( window ),
$maintable = $( '#maintable' )
;

//. 開始時

$( function(){
	//.. table sorter
	//- 「分解能」など数値データなら、無理やり数値にしてソート
	if ( phpvar.sortint ) {
		$maintable.tablesorter({
			headers:{ 0: { sorter:'digit'} },
			textExtraction: function(node) { return node.innerHTML.replace( /[^0-9]/, '' ); }
		});
	} else {
		$maintable.tablesorter();
	}
	$maintable.bind( 'sortEnd', function(){
		_fixhead.setc();
		_plot.hideall();
	});

	//.. others
	_fixhead.init();
	phpvar.k2 && _plot.init();
});

//. クリックで検索
$( '.dlnk,.pbar' ).click( function(){
	var o = $( this ) ,
		s1 = phpvar.k1v[ o.attr( 'k' ) ] ,
		s2 = phpvar.k2v[ o.attr( 'sk' ) ] ,
		d = o.attr( 'd' )
	;
	if ( s1 == undefined || o == null )
		return;
	window.open( phpvar.urlbase + phpvar.ck1 + '=1&kw=%22' + phpvar.k1 + ':' + s1 + '%22' +
		( s2 == undefined ? '' : ' %22' + phpvar.k2 + ':' + s2 + '%22&' + phpvar.ck2 + '=1' ) +
		( d ==  undefined ? '' : '&db=' + d ) 
	);
});

//. func _showall: 全部表示
function _showall( f ) {
	if ( f ) {
		$( '#showall' ).hide();
		$( '.hrow' ).show();
	} else {
		$( '#showall' ).show();
		$( '.hrow' ).hide();
	}
	_fixhead.setc();
}

//. object _plot: ホバーでプロット
var _plot = {
	flg_col: false,
	currplot: null,
	$pbox: $('.pbox'),

	//.. init 初期化 ホバーの設定
	init: function() {
		//- 各セル
		var that = this;
		$maintable.find( 'th, td' ).mouseover( function(){
			var o = $( this ) ,
				r = parseInt( o.attr( 'k' ) ),
				c = parseInt( o.attr( 'sk' ) )
			;
			if ( !r && !c  ) return;
			if ( !r ) that.flg_col = true;
			if ( !c ) that.flg_col = false;
			_timer.do_after_busy( function(){ that.start(r, c); }, 200, 'plot' );
		});

		//- メインテーブルから外れた
		$maintable.mouseout( function(){
			_timer.do_after_busy( function(){ that.hideall(r, c); }, 500, 'plot' );
		});
	},
	
	//.. start: プロット作成
	start: function( r, c ) {
		var o, w, f, pmy, pat, psize, num = 0, dly = 1;

		//- 今のプロットと同じならやらない
		var p =  this.flg_col ? 'c' + c : 'r' + r ;
		if ( this.currplot == p ) return;

		this.currplot = p;
		this.hideall( true );
		$('.pcell').removeClass( 'pcell' );

		if ( this.flg_col ) {
			//- カラム (縦)
			w = $win.width() / 2,
			f = w > this.cell( 1, c ).offset().left - $win.scrollLeft();
			pmy = f ? 'left'  : 'right';
			pat = f ? 'right' : 'left';
			psize = w / phpvar.maxval;
		} else {
			//- 行 (横)
			w = $win.height() / 2,
			f = w > this.cell( r, 1 ).offset().top - $win.scrollTop();
			pmy = f ? 'top'		: 'bottom';
			pat = f ? 'bottom'	: 'top';
			psize = w / phpvar.maxval;
		}

		while(1) {
			++ num;
			o = this.flg_col ? this.cell( num, c ) : this.cell( r, num );
			o.addClass( 'pcell' );
			if ( !o[0] ) break; //- なければ終わり

			v = o.text();
			if ( !v ) continue;
			v = Math.round( v * psize );
			$( '#pb' + num )
				.stop( true, true )
				.delay( dly * 20 )
				.css( this.flg_col
					? { width: v, height: o.height() - 5 }
					: { width: 20, height: v }
				)
				.position({ of: o, my: pmy, at: pat, collision: 'none' })
				.fadeTo( 0, 0.7 )
			;
			++ dly;
		}
	},

	//.. hideall プロットを消す
	hideall: function( flg ) {
		this.$pbox
			.stop( 1, 1 )
			.fadeTo( 500, 0, 
				function(){
					if ( !flg ) {
						this.currplot = null;
						$('.pcell').removeClass( 'pcell' );
					}
				}.bind(this)
			)
		;
	} ,

	//.. cell
	cell: function( r, c ) {
		return $( '#r' + parseInt( r ) + 'c' + parseInt( c ) );
	}
}


//. object fixhead 固定テーブルヘッダ
var _fixhead = {
	showing: false ,
	$head_tr: $('#maintable thead tr'),
	$fixhead: $('#fixhead') ,

	//.. init
	init: function() {
		this.setc();
		$win
			.scroll( function () { this.onscroll() }.bind(this) )
			.resize( function() { this.setc() }.bind(this) )
		;
	},

	//.. setc: コンテンツセット
	setc: function() {
		var o, fxhd;
		if ( phpvar.k2 == null ) return
		fxhd = this.$fixhead
			.width( $maintable.width() )
			.find( 'tr' ).html( '' )
		;
		this.$head_tr.children( 'th' ).each( function() {
			o = $( this );
			fxhd.append( $( '<th></th>' )
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
	},

	//.. onscroll: スクロール
	onscroll: function() {
		var w = $( document ).scrollTop(),
			h = this.$head_tr.position().top;
		;
		if  ( this.showing && h > w ) {
			this.$fixhead.stop( 1, 1 ).fadeOut( 100 );
			this.showing = false;
		} else if  ( ! this.showing && h < w ) {
			this.setc();
			this.$fixhead.stop( 1, 1 ).fadeTo( 500, 0.75 );
			this.showing = true;
		}
	}
}

