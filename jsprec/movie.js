/*
movie.js
movieページ用
*/

//. init
var 
MovNum = 50,
cid = '', //- 現在の追加ボックスのデータのID
opmov = [],

//- resizableのパラメータ
respar = { 
	minHeight: 200, minWidth: 200, 
	distance: 7, 
	aspectRatio: true ,
	stop: function( event, ui ) { _movsz( ui.size.width ); }
};

//. 開始時 実行
$(
	function(){ _movstart(); }
);

//. onscroll
window.onscroll = function(){
	var pos1 = $( document ).scrollTop() + 10,
		mint = _bottom( '#namebar' );
	if ( pos1 < mint )
		$('#mcontrol').css({ position: 'absolute', top: mint });
	else if ( IE6 )
		$('#mcontrol').css( "top", pos1 );
	else
		$('#mcontrol').css({ position: 'fixed', top: 5 });
};

//. ID入力対応
function _idc( id ) {
	if ( id == undefined )
		id = $( '#idbox' ).val(); //- ボックスに入力
	else
		$( '#idbox' ).val( id ); //- ボタンを押した

	if ( cid == id ) return; //- 同じボタンを押した
	cid = id;
	//- アイコンを不活性化
	$( '.selid' ).prop('disabled', false);
	if ( id != '' )
		$( '.selid' + id ).prop( 'disabled', true );
	
	if ( id.match(/^[0-9a-zA-Z]{4}$/) ) {
		$("#idimg")
			.fadeTo( 'fast', 0.1 ).slideDown( 'medium' )
			.load( "?mode=idc&id=" + id, '', function(){
				//- ツールチップ有効化
				$( '.adm' ).tooltip( ttip_param );
				//- 同じIDだったら、不活性化
				if ( dataid == id )
					$( '.adm' ).prop( 'disabled', true );
				//- 既に開かれている奴を不活性化
				for ( var i in opmov )
					$( '#adm' + opmov[ i ] ).prop( 'disabled', true );
				//- 視覚効果 
				$( this ).fadeTo( 'fast', 1 );

				//- メッセージ入れ替え
				$( '#idimgm1' ).hide( 'medium' );
				$( '#idimgm2' ).show( 'medium' );
			})
		;
	} else if ( id.length < 2 ) {
		$( '#idimg' ).hide( 'slow' ).html( '' );
		$( '#idimgm1' ).show( 'medium' );
		$( '#idimgm2' ).hide( 'medium' );
	}
}

//. _adm: ムービーの追加
//- o: 押したボタンのオブジェクト
function _adm( id, num, o ) {
	var u = '?mode=adm&id=' + id + '&num=' + num + '&cnt=' + MovNum
		 + "&siz=" + movsize ;
//	alert( u );
	$.getJSON( u, function( json ) {
		$( '.movietable:last' ).after( json.mov );
		$( '#iconarea .icon:last' ).after( json.icon );
		mv_param[ 'm' + MovNum ] = json.files;
		_jp_init( 'm' + MovNum );
		_movstart();
		MovNum ++;
		//- ツールチップ有効化
		$( '#iconarea .addtt' ).tooltip( ttip_param ).removeClass( 'addtt' );
		//- リサイザブル有効化
		$( '.moviebox' ).resizable( respar );
	});
	//- 開いたムービーを記憶
	opmov.push( id.slice( -4 ) + '_' + num );
	//- ボタンを不活性化
	$( o ).prop( 'disabled', true );
}

//. ムービーコントロール
function stop() { _movcon( 'stop' ); }

//. size ムービーサイズ変更
function _movsz( s ) {
	movsize = s;
	var ss = s + 'px';
	$( '.player' ).css({ height: s,  width: s })
		.jPlayer({ size: { height: ss, width: ss } });
	$( '.mvmsgbox' ).css({ width: s });
	$( '.moviebox' ).css({ height:'auto', width: 'auto'});
	$( '.movietable' ).width( s + 10 );

	//- サイズ変更ボタンのactivation
	$( '.msize' ).prop('disabled', false);
	$( '.ms' + s ).prop('disabled', true );
}

//. リサイズ
$( function(){
	$( '.moviebox' ).resizable( respar );
});

//. hidem ムービーアイコン化
function hidem( n ) {
	$( '#t' + n ).hide( 'fast', function(){ _movstart(); } );

	//- アイコン
	$( '#i' + n ).show('normal');
}

//. showm: ムービーアイコン化解除
function showm( n ) {
// 	if ( IE )
//		$( '#t' + n ).show().css({ width: movsize + 10, position: 'static' });
//	else
		$( '#t' + n ).width( movsize + 10  )
			.show( 'fast', function(){ _movstart(); } );

	//- アイコン
 	$( '#i' + n ).hide( 'slow' );
}

