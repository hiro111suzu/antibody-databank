$(
	function(){ _movstart(); }
);

function _resh() {
	$.getJSON( "ajax_slots.php?t=" + Date(), function( r ){
		o_mv.each( function( i ){
			//- ムービー切り替え
			$( this )._movset( r[ i ].url );

			//- キャプション（とリンク）書き換え
			var c = $( '#cap' + i );
			c.html( c.html()
				.replace( /(EM|P)DB-[0-9a-z]{4}/ig, r[ i ].db + '-' + r[ i ].id ) 
			);

			//- ムービー内メッセージ
			_mvmsg( 'loading' );
			_mvicon( 'resh' );
		});
		//- ツールチップ初期化
		$( '#cap0 a, #cap1 a, #cap2 a' ).tooltip( ttip_param );
	});
}
