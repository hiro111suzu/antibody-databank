$(
	function(){ _movstart(); }
);

function _resh() {
	$.getJSON( "ajax_slots.php?t=" + Date(), function( r ){
		o_mv.each( function( i ){
			//- ���[�r�[�؂�ւ�
			$( this )._movset( r[ i ].url );

			//- �L���v�V�����i�ƃ����N�j��������
			var c = $( '#cap' + i );
			c.html( c.html()
				.replace( /(EM|P)DB-[0-9a-z]{4}/ig, r[ i ].db + '-' + r[ i ].id ) 
			);

			//- ���[�r�[�����b�Z�[�W
			_mvmsg( 'loading' );
			_mvicon( 'resh' );
		});
		//- �c�[���`�b�v������
		$( '#cap0 a, #cap1 a, #cap2 a' ).tooltip( ttip_param );
	});
}
