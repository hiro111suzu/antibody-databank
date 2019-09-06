/*
popup
*/
var
PU = {} ,
zmax = 100;
;

$( function() { 
	$( '._pu' )._popup();
});

jQuery.fn.extend({
//. _ztop
	_ztop: function() {
		zmax ++; 
		return this.css( 'z-index', zmax );
	} ,

//. _pupup( c ): 要素cを要素thisのポップアップにする
	_popup: function( c ) { return this.each( function() {
		//- トリガ要素
		var o_t = $( this );
		var o_p;
		//- ポップアップ要素
		if ( c == undefined ) {
			o_p = o_t.next();
			if ( o_p.length == 0 )
				o_p = o_t.parent().next(); //- 次の要素がなければ「親の次」の要素
			o_p.appendTo('body');
		} else {
			o_p = $( c );
		}
//		var o_p = ( c == undefined ) ? o_t.next().appendTo('body') : $( c ); 

		//- 消すスクリプト、実行時に参照するためグローバル変数
		PU.fnchpop = "$( '.pubox' ).fadeOut( 'medium' )";

		//- トリガ要素にホバー
		o_t.hover( function(){
			o_t.css( 'opacity', 0.85 ).addClass( '_pu_act' ); //- トリガを半透明に
			clearTimeout( T.popshow ); clearTimeout( T.pophide );
			//- 出現タイマー
			T.popshow = setTimeout( function(){
				$( '.pubox' ).hide(); //- 別のを消しておく
//				var w = Math.floor( $( window ).width() / 4 ); //- 幅を自動計算
				clearTimeout( T.popshow ); clearTimeout( T.pophide );
//				p.show().css({opacity: 0.85, maxWidth: w })._ztop()
				o_p.show().css({opacity: 0.85})._ztop()
					.position({ of: o_t, my: 'left top', at: 'left bottom' });
			}, 200, o_p );
		}, function(){
			o_t.css( 'opacity', 1 ).removeClass( '_pu_act' );
			clearTimeout( T.popshow ); clearTimeout( T.pophide );
			T.pophide = setTimeout( PU.fnchpop, 100 );
		} );

		//- ポップアップにホバー
		o_p.hover( function(){
			clearTimeout( T.popshow ); clearTimeout( T.pophide );
			o_p.show().css( 'opacity', 1 );
			o_t.addClass( '_pu_act' ); //- トリガ要素ピカ
		}, function(){
			clearTimeout( T.popshow ); clearTimeout( T.pophide );
			T.pophide = setTimeout( PU.fnchpop, 1000 );
			o_p.css( 'opacity', 0.7 );
			o_t.removeClass( '_pu_act' ); //- トリガ要素もどす
		} )
	} ) }
});

