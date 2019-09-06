/*
searchform
*/

$( function(){
	$( '#rb_mode_list, #rb_mode_table' ).change( function(){
		if ( $( '#rb_mode_list:checked' ).val() ) {
			$( '.r_list' ).fadeIn( 'slow' );
			$( '.r_table, .srtdiv' ).fadeOut( 'slow' );
		} else {
			$( '.r_table, .srtdiv' ).fadeIn( 'slow' );
			$( '.r_list' ).fadeOut( 'slow' );
		}
	});
//	$( '#form1' ).change( function(){
//		//$( '#submitbtn' ).slideDown( 'slow' );
//		$( '#submitbtn' ).animate({ }, 'medium' );
//	});
});
