/*
viewtop.js
万見トップページ用
*/

$( function(){
	if ( $( '#randimg' ).text() == '' )
		_randimg( '' );
});

//. パネル標示切り替え
function _show( name ) {
	if ( name == 'all' ) {
		$( '.panel:hidden' ).show( 'medium' );
	} else {
		$( '.panel:not(#' + name  + ')' ).hide( 'medium' );
		$( '#' + name + ':hidden' ).show( 'medium' );
	}
}

//. gallery内容切り替え
function _galset( id ) {
	$( '#gbox' ).load( "viewtop.php?g=" + id );
	_show( 'gallery' );
}

