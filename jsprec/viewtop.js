/*
viewtop.js
�����g�b�v�y�[�W�p
*/

$( function(){
	if ( $( '#randimg' ).text() == '' )
		_randimg( '' );
});

//. �p�l���W���؂�ւ�
function _show( name ) {
	if ( name == 'all' ) {
		$( '.panel:hidden' ).show( 'medium' );
	} else {
		$( '.panel:not(#' + name  + ')' ).hide( 'medium' );
		$( '#' + name + ':hidden' ).show( 'medium' );
	}
}

//. gallery���e�؂�ւ�
function _galset( id ) {
	$( '#gbox' ).load( "viewtop.php?g=" + id );
	_show( 'gallery' );
}

