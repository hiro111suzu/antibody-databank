/*
doc
*/

//. on scroll
window.onscroll = function(){
	var pos1 = $( document ).scrollTop() + 10,
		mint = _bottom( '#placebar' );
	if ( pos1 < mint )
		$('#navi_pane').css({ position: 'absolute', top: mint });
	else if ( IE6 )
		$('#navi_pane').css({ top: pos1 });
	else
		$('#navi_pane').css({ position: 'fixed', top: 5 });
};

function _scr( p ) {
	$( 'html, body' ).animate({ scrollTop: $( '#p_' + p ).offset().top }, 300 );

//	$.scrollTo( $( '#p_' + p ), 300 );
//	var o = $( '#p_' + p + ' .title' );
//	var p = o.css( 'padding-left' );
//	o.animate( { paddingLeft: 100 }, 'fast' ).animate( { paddingLeft: p }, 'slow' );
}
