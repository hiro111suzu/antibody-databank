/*
pop_mov ポップアップウィンドウ用Jmol
*/
var
backbone_only = '*.CA,*.P,'  ,
//- タイマー
timer = {},

//- アプレット用 グローバル変数
A = {} , 

//選択モード
selmodef = { 'halo':true, 'center':true }
;

//. ウインドウ、リサイズしたとき、閉じたとき
$(window)
	//- リサイズで、Jmolサイズ変更
	.resize( function() {
		_timer.do_after_busy( function() {
			var wh = _winsize2jmolsize();
			Jmol.resizeApplet( jmol0, wh );
	    }, 200 );
	})
;

//. 開始時
$( function(){
	var a = _winsize2jmolsize();
	phpvar.jmolconf.width = a[0];
	phpvar.jmolconf.height = a[1];
	Jmol._alertNoBinary = false; 
	$( '#jmolinner' ).html( Jmol.getAppletHtml( 'jmol0', phpvar.jmolconf ) );
});

//.. _winsize2jmolsize ウインドウサイズからJmolのサイズを返すリサイズ
function _winsize2jmolsize() {
	return [
		$(window).width() - 4,
		$(window).height() - 54
	];
}

//. コマンド実行
//.. _send_cmd
// 

//function _send_cmd( que ) {
_cmd.init();
var _cmd = {
	other: function(){
		if ( phpvar.jmolcmd[ qobj ] ) {
			_jmols( phpvar.jmolcmd[ qobj ] );
			return true;
		} else {
			return false;
		}
	},
	asb: function( param, trg_obj ) {
		//- param = 1 or [abid:1, backbone_only: true, ]
		if ( typeof param === 'string' )
			param = {abid: param};

		_jmols( 'load "" FILTER "'
			+ ( param.bbonly ? backbone_only : '' ) //- 主鎖だけ
			+ 'biomolecule ' + param.abid + '";'
			+ phpvar.jmolcmd.init 
		, 0 );
		_ofunc( '_datareloaded' );
		_ofunc( '_btn_deco', 'asb', trg_obj );
	} ,
	reload: function() {
		_jmols( phpvar.jmolcmd.reload + ';' + phpvar.jmolcmd.init );
		_ofunc( '_datareloaded' );
		_ofunc( '_btn_deco', 'asb' );
	} ,
	select: function( param, trg_obj ) {
		_select( param, trg_obj );
	}
}



//.. _jmols: jmolコマンド
//- f 読み込み中・計算中フラグ => 0: 構造 1: 表面
function _jmols( s, f ){
	s = s.replace( /_dq_/g, '"' );
	_popvw.cmdhist( '$ ' + s );
	if ( f != undefined )
		_loadstart( f );
	try {
		Jmol.script( jmol0, s );
	} catch(e) {
		return false;
	}
	return true;
}

//.. _select 選択
function _select( cmd, trg_obj ) {
	//- 前回の選択と同じ？トグルスイッチ
	if ( trg_obj != undefined && trg_obj == A.last_trg_obj ) {
		//- 選択をオフ
		cmd = 'selectionHalos OFF; select all; label off;'
			+ ( selmodef.center ? 'zoomto 0.7 0;' : '' );
		_ofunc( '_btn_deco', 'select' );
		A.last_trg_obj = '';
	} else {
		cmd = 'select ' + cmd
			+ ( selmodef.halo   ? ';selectionHalos ON;' 		: '' )
			+ ( selmodef.center ? ';if ({selected}.size > 0) zoomto 0.7 {selected} 0;'	: '' )
		;
		_ofunc( '_btn_deco', 'select', trg_obj );
		A.last_trg_obj = trg_obj;
	}
	return _jmols( cmd );
}

//. 通信・メッセージ系関数
//.. _jmolmsg

function _jmolmsg( s1, s2, s3 ) {
//	if ( /^echo/i.test( s2 ) ) return;
	//- 応答なし
	if ( ! $.isFunction( Jmol.script ) ) {
		_popvw.cmdhist( 'Jmol is busy now.', 'green' );
		return;
	}

	$( '#loading' ).hide( 'slow' ); //- ロード中バーをしまう
	if ( A.pg_calc == 1 )
		$( '#calcsurf' ).show( 'slow' ); //- 表面計算中バーを出す
	if ( A.pg_calc == 2 )
		$( '#calcstr' ).show( 'slow' ); //- 計算中バーを出す

	//- 表面計算おわり
	if ( A.pg_calc ==  1 && / created with /.test( s2 ) ) {
		$( '#calcsurf' ).hide( 'slow' );
		A.pg_calc = 0;
	}
	//- 構造計算おわり
	if ( A.pg_calc == 2 && / atoms selected/.test( s2 ) ) {
		$( '#calcstr' ).hide( 'slow' );
		A.pg_calc = 0;
	}

	//- 意味ない系
	if ( s2 == '' ) return;
	if ( /Callback = |languageTranslation = /.test(s2) ) return;
	if ( /^script [0-9]+ started$/.test(s2) ) return;


	//- コマンドパネル出力
	_popvw.cmdhist( s2, ( /ERROR/.test( s2 ) ) ? 'red' : 'blue' );

	//- 選択数メッセージ
	if ( /atoms selected/.test( s2 ) )
		_ofunc( '_selected_count', s2.replace( 'atoms selected', '' ) )
}

//.. _mousepick マウスクリック
function _mousepick( p1, p2 ) {
	w_o._vw.mousepick( window.name, p2 );
}

//.. モデル読み込み・表示

//... _asb: 集合体構造読み込み
// i: biomolのID
// f: 主鎖だけフラグ
// limit: そのほかの条件 (取り消し
function _asb( i, f ) {
	_jmols( 'load "" FILTER "'
		+ ( f ? backbone_only : '' ) //- 主鎖だけ
		+ 'biomolecule ' + i + '";' + phpvar.jmolcmd.init 
	, 0 );
//	_datareloaded(); //- 読み込んだデータの情報をクリア
//	_asb_btn( c );
}

//... _loadend / _loadstart
//- f => 1: 表面モデル計算中バーを出す 0: 構造データ処理中バーを出す
function _loadstart( f ) {
	A.pg_calc = ( f == 1 ) ? 1 : 2;
	clearTimeout( timer.loaderror );
	$( '.loadingbar' ).html( phpvar.loadingbar );
	$( '#loading' ).show( 'fast' );
	timer.loaderror = setTimeout( function(){
		//全体（ページ開いたときに出ている奴）
		$( '.loadingbar' ).html( phpvar.loadingerror );
		//- アプレットの奴は5秒で消す
		timer.loaderror2 = setTimeout( "$('#loading').hide('slow')", 5000 );
	}, 20000 );
}

/*
/
//... reloadstr 再読み込み 
// m: モード ud:original 1:ユニットセル 2x2x2 etc
// c: ボタンのオブジェクト
function _reloadstr( c, m1, m2, m3 ) {
	var s1, s2;
	var ld = ( fileid == 2 ) // 別のモデルを読んでいない？
		? 'load ""'
		: 'load "' + _u_pdb( id ) + '"'
	;
	if ( m1 != undefined ) { // ユニットセル
		s1 = ' {' + m1 + ' ' + m2 + ' ' + m3 + '} ';
		s2 = 'unitcell {'
			+ ( m1 > 2 ? '1' : '0' ) + ' '
			+ ( m2 > 2 ? '1' : '0' ) + ' '
			+ ( m3 > 2 ? '1' : '0' ) + '};';
		jmols( ld + s1 + ';' + init_style + s2, 0 );
	} else {
		jmols( ld + ';' + init_style, 0 );
	}
	_datareloaded() //- フィットマップクリア
	_asb_btn( c );
}

//... _datareloaded: データがリロードされたときの対処
function _datareloaded() {
	//- フィットマップのチェックボックスはずす
	$( '.cb_fit' ).prop('checked', false);
	loadedmap = undefined;

	//-split 用 ロードボタンを復活
	$( '.b_apnd' ).prop('disabled', false);
	fileid = 2;

	//- ef-siteのチェックボックスはずす
	$( '.cb_ef' ).prop('checked', false);
	loadedef = {};
	
	//- jmol表面
	$( '#surflist' ).text('');
	_chsurf();
	mscnt = 0;
}
*/

