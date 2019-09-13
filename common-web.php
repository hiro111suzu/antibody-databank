<?php
date_default_timezone_set("Asia/Tokyo"); 
//ini_set('display_errors', 'stderr');
//error_reporting(E_ALL);

//define( 'SPEED_TEST', true );

if ( ! defined( 'AJAX' ) )
	define( 'AJAX', false );

//- mngシステムと共通のライブラリ
require( __DIR__ . '/common-all.php' );


$_sqlite_log = [];

//. クラス
spl_autoload_register( function( $class_name ) {
	require_once $class_name . '.php';
});

//. 初期設定

//.. 時間計測
define( 'TIME_START', $time_prev = microtime( TRUE ) );

//.. 攻撃対策
foreach ( $_GET + $_POST as $s ) {
	if ( _instr( '<script', $s ) || _instr( '<iframe', $s ) )
		die();
}

//.. init 前半
mb_internal_encoding( 'UTF-8' );
//define( 'TEST', $_COOKIE[ 'testhoge' ] );
define( 'TEST', true );

//.. lang
$lang = $_COOKIE[ 'lang' ];
if ( _getpost_safe( 'lang' ) ) {
	$lang = _getpost_safe( 'lang' );
	setcookie( "lang", $lang, time()+60*60*24*365 );
}
if ( $lang == '' )
	$lang = ( strtolower( substr( $_SERVER["HTTP_ACCEPT_LANGUAGE"], 0, 2 ) ) == 'ja' )
		? 'ja' : 'en' ;

define( 'LANG', $lang );
define( 'L_JA', $lang == 'ja' );
define( 'L_EN', $lang != 'ja' );

//.. folder / file name
//- others
define( 'DN_PREP'	, realpath( __DIR__. '/../prepdata' ) );	//- TESTSVにしかない
define( 'DN_FDATA'	, realpath( __DIR__. '/../fdata' ) );		//- TESTSVにしかない

//. css common
if ( ! AJAX ) {
//- よく使う
$_css = [
	'3d'  => 'border-color: #eee #999 #666 #aaa;' ,
	'bar' => 'border-top: 1px solid #ddd; border-bottom: 1px solid #888;' ,
	'br2' => 'border-radius: 3px;' ,
	'br4' => 'border-radius: 6px;' ,
	'ui'  => '<link rel="stylesheet" type="text/css" href="css/jquery-ui.css">' ,
];

//.. main
$_css[ 'all' ] = <<<EOD
body { background: #ffffff; margin: 0; padding: 0; border-width: 0; }
button {font-size: medium}
button, a, select, label, .lk {cursor: pointer}
button img, button {vertical-align: middle}
label:hover { color: red; text-decoration:underline}
li { margin: 0.3em 0 0.3em 1em; padding: 0 }
p { margin: 0.3em 0  }

.hide { display: none; }
.nw { white-space: nowrap; }
.left { float:left }
.right {float:right }
.clboth { clear:both }
.red { color:red }
.blue { color:blue }
.gray{ color: #bbb }
.green { color:green }
.bld { font-weight:bold }
.lkicon { padding: 0 2px; margin: 0; border: none; vertical-align: middle; }

.xbtn { margin: 0 2px 0 0; padding: 0px 8px; background: #444; color: white; 
	font-weight:bold; }
.xbtn:hover { background: #f44 }

//- ポップアップの中の画像
.popimg { width: 100px; height: 100px; float:left; }

//- 影
.sd { box-shadow: 1px 1px 12px #777; }
.sd2 { box-shadow: 1px 1px 7px #777; }
//- 角丸
.br2{ border-radius: 3px; }
.br4{ border-radius: 5px; }

EOD;


//.. end
}

//. function 条件定義の関数

//.. _ej: 英語設定なら$s1、それ以外は$s2を返す
if ( L_EN ) {
	function _ej( $s1, $s2 ) { return $s1; }
} else {
	function _ej( $s1, $s2 ) { return $s2; }	
}

//.. _test: テストモードなら文字列を返す
if ( TEST ) {
	function _test( $s ) { return $s; }
} else {
	function _test( $s ) {}
}


//. function DB関係ない系
//.. _obj 一個のインスタンスを使い回すクラスオブジェクト用
$_obj_cache = [];
function _obj( $name ) {
	global $_obj_cache;
	$name = "cls_$name";
	if ( ! $_obj_cache[ $name ] )
		$_obj_cache[ $name ] = new $name;
	return $_obj_cache[ $name ];
}

//.. _getpost:
function _getpost( $s = '' ) {
	return trim( strip_tags(
		mb_convert_kana( (string)$_GET[ $s ] ?: (string)$_POST[ $s ], 'a' )
	) );
}

//.. _getpost_safe:
function _getpost_safe( $s = '' ) {
	return preg_replace( '/[^a-zA-Z0-9_\.\-,;:]/', '', _getpost( $s ) );
}

//.. _instr: 文字列が含まれるか？
//- mng版よりも低機能
function _instr( $needle, $heystack ) {
	return mb_strpos( strtolower( $heystack ), strtolower( $needle ) ) !== false;
}

//.. _headmatch: 文字列の先頭が一致するか？
function _headmatch( $needle, $heystack ) {
	return stripos( $heystack, $needle ) === 0;
}

//.. _add_lang 辞書に追加
function _add_lang( $a ) {
	 global $langini;
	 if ( L_EN ) return;
	 if ( ! is_array( $langini ) ) return;
	 $langini = array_merge( $langini, array_change_key_case( $a ) );
}

//.. _add_lang_tsv tsvファイルから追加
function _add_lang_tsv( $key ) {
	 global $langini;
	 if ( L_EN ) return;
	 if ( $langini[ "#$key" ] )
	 	return; //- 既に読み込み済み

	 $langini = array_merge(
	 	$langini ,
	 	array_change_key_case( (array)_tsv_load2( DN_DATA. '/e2j.tsv' )[ $key ] ),
	 	[ "#$key" => true ]
	 );
}

//.. _short: ユニコード文字列を短く
//- ページタイトル用
function _short( $s, $l = 70 ) {
	return ( mb_strlen( $s ) > $l )
		? mb_substr( $s, 0, $l - 5 ) . "..."
		: $s
	;
}

//.. _ic: アイコン画像
function _ic( $s = 'link' ) {
	$s = strtolower( $s ) ?: 'link';
	return "<img src=\"img/lk-$s.gif\" class=\"lkicon\">";
}

//.. _x: xmlから取り出した文字列の修正、改行を消去とか
function _x( $s ) {
	if ( is_object( $s ) || is_array( $s ) )
		return _test( _t( 'pre | .red bld', print_r( $s, true ) ) );
	if ( strlen( $s ) > 5000 )
		$s = substr( $s, 0, 5000 ) . ' ...';
	return _reg_rep( trim( $s ), [
		'/[\n\r\t ]+/' => ' ',
		'/^(na|n\/a|null|none)$/i' => '' ,
	]);
}

//.. _imp2: implodeのラッパー
function _imp2( $ar ) {
	//- デフォルトのセパレータ区切る
	//- 配列で受け取っても、引数の羅列で受け取ってもOK
	return implode( SEP, array_filter( _armix( func_get_args() ) ) );
}

//.. _format_bytes: KBとかにする
function _format_bytes( $b ) {
	$r = [ 1099511627776, ' TB' ];
	if ( $b < 1099511627776 ) $r = [ 1073741824, ' GB' ];
	if ( $b <    1073741824 ) $r = [    1048576, ' MB' ];
	if ( $b <       1048576 ) $r = [       1024, ' KB' ];
	if ( $b <          1024 ) $r = [          1, ' B'  ];
	if ( $b == 0 ) return;
	return round( $b / $r[0], 1 ) . $r[1];
}

//.. _kv: key : value
function _kv( $a, $del = SEP ) {
	//- $del: デリミタ
	$ret = [];
	foreach ( $a as $k => $v ) {
		if ( $k == '_d' ) {
			$del = $v;
			continue;
		}
		if ( $v == '' ) continue;
		$k = function_exists( '_trep' ) ? _trep( $k ) : _l( $k );
//		$k = _l( $k );
		$ret[] = "<b>$k</b>: $v";
	}
	return implode( $del, $ret ) ;//. print_r( _t( 'pre', $a ), 1 );
}


//.. _csv
//- ダブルクオートは予め処理しておく
function _csv( $fn, $data, $sep = ',' ) {
	$out = [];
	foreach ( $data as $line )
		$out[] = implode( $sep, $line );
	$out = implode( "\n", $out );

	header( "Content-Type: application/octet-stream" );
	header( "Content-Disposition: attachment; filename=$fn" );
	die( L_JA ? mb_convert_encoding( $out, "SJIS", "UTF-8" ) : $out );
}

//.. _group_name
//- 名前文字列を先頭文字列でグループ化
//- 先頭文字列を返す
function _group_name( $names ) {
	$ret = [];
	foreach ( array_reverse( range( 13, 100 ) ) as $num ) {
		$sum = [];
		foreach ( $names as $idx => $name ) {
			$n = substr( $name, 0, $num );
			if ( ! in_array( substr( $n, -1 ), [ '-', ':', ';', ' ', '.' ] ) )
				continue;
			$sum[ $n ][] = $idx;
		}
		foreach ( $sum as $name => $idxs ) {
			if ( count( $idxs ) < 2 ) continue;
			$ret[] = $name;
			foreach ( $idxs as $i ) {
				unset( $names[ $i ] );
			}
		}
		$names = array_filter( $names );
		if ( count( $names ) == 0 ) break;
	}
	sort( $ret );
	return $ret;
//	_die( 'hoge' );
}


//. function html文字列を生成する系
//.. _t: タグ
define( 'TAG_REP', [
	'/^#/'					=> 'id:' ,
	'/^\./'					=> 'class:',
	'/^\?/'					=> 'title:',
	'/^st:/'				=> 'style:',
	'/^!/'					=> 'onclick:',
	'/^([a-z]+): ?(.*)/'	=> '$1="$2"' ,
]);

function _t( $tag, $str = '' ) {
	$split = preg_split( '/ *\| */', trim( $tag ), 0, PREG_SPLIT_NO_EMPTY );
	return '<'
		. implode( ' ', _reg_rep( $split, TAG_REP ) )
		. ">$str</{$split[0]}>"
	;
}

//.. _e: 空タグ
function _e( $tag ) {
	return '<'
		. implode( ' ',	_reg_rep(
			preg_split( '/ *\| */', trim( $tag ), 0, PREG_SPLIT_NO_EMPTY ) ,
			TAG_REP
		)) . '>'
	;
}

//.. _a: リンクタグ
function _a( $url, $str, $opt = '' ) {
	// 別窓で開く指定は、$optに入れる '_b'
	if ( is_array( $url ) )
		$url = _emnlink( $url );
	return _t( "a| href:$url |$opt", $str );
}

//- 別窓
function _ab( $url, $str, $opt = '' ) {
	if ( is_array( $url ) )
		$url = _emnlink( $url );
	return _t( "a| href:$url | target=\"_blank\" |$opt", $str );
}

//- アイコン付き
function _ai( $url, $icon, $str = '', $opt = '' ) {
	if ( is_array( $url ) )
		$url = _emnlink( $url );
	return _t( "a| href:$url | $opt", _ic( $icon ) . $str );
}

//- 今のページなら太字、違えばリンク
function _a_flg( $flg, $url, $str, $opt = '' ) {
	if ( is_array( $url ) )
		$url = _emnlink( $url );
	return $flg ? "<b>$str</b>" : _a( $url, $str, $opt );
}


//.. _img
function _img( $s1, $s2 = '' ) {
	if ( $s2 == '' ) {
		$fn = ( substr( $s1, -2 ) != '.g' ) ? $s1 : "img/{$s1}if";
		return "<img src=\"$fn\">";
	} else {
		$fn = ( substr( $s2, -2 ) != '.g' ) ? $s2 : "img/{$s2}if";
		return _e( "img|src:$fn|$s1" );
	}
}


//.. _btn
function _btn( $opt, $str ) {
	return _t( "button|$opt", $str );
}

//.. _div
function _div( $opt, $str = '' ) {
	return _t( "div|$opt", $str );
}

//.. _span
function _span( $opt, $str = '' ) {
	return _t( "span|$opt", $str );
}

//.. _p
function _p( $s1, $s2 = '' ) {
	return ( $s2 == '' ) ? "<p>$s1</p>" : _t( "p|$s1", $s2 );
}

//.. _radiobtns: ラジオボタンのセット
//- $opt => [ $name => get用の name, on => 初期選択アイテム ]
//- $btns => [ 'name1' => 'text1', .... ]
function _radiobtns( $opt, $btns ) {
	extract( $opt ); //- $name, $on, $otheropt
	$ret = [];
	foreach ( $btns as $val => $txt ) {
		$i = "rb_{$name}_{$val}";
		$ret[] = _span( '.nw', ''
			. _e( "input |#$i |type:radio |name:$name |value:$val |$otheropt"
				. ( $on == $val ? '|checked' : '' )
			)
			. _t( "label | for:$i",  $txt ?: $val )
		);
	}
	return implode( ' ', $ret );
}

//.. _selopt: ドロップダウンメニュー
//- $opt 
function _selopt( $opt, $ar, $sel = '' ) {
	$ret = '';
	foreach ( $ar as $k => $v ) {
		$s = $k == $sel ? 'selected:selected' : '';
		$ret .= _t( "option | value:$k | $s", $v );
	}
	return _t( 'select |' . $opt, $ret );
}

//.. _xbtn
function _xbtn( $js = '', $o = '' ) {
	return _t( "button| !$js| .xbtn| title:"
			. _ej( 'Button : Close', 'ボタン : 閉じる' ) . "|$o" ,
		 'X' );
}


//. 関数 sqlite系
//.. _quicksqlite: 定型パターンでデータ取り出し
$o_dbs = [];
$_quicksqlite_info = [
	'pdb_title' => [
		'dbname' => 'pdb',
		'select' => 'title' ,
		'key'    => 'id'
	],
	'pmid2did'   => [
		'select' => 'ids' ,
		'key'    => 'pmid'
	],
	'taxojname' => [
		'dbname'	=> 'taxo',
		'select'	=> 'jname' ,
		'key'		=> 'name'
	] ,
	'dbid_title' => [
		'dbname'	=> 'dbid' ,
		'select'	=> 'title' ,
		'key'		=> 'db_id' ,
	] ,
	'dbid_num' => [
		'dbname'	=> 'dbid' ,
		'select'	=> 'num' ,
		'key'		=> 'db_id' ,
	] ,
	'dbid_info' => [
		'dbname' => 'dbid' ,
		'select' => [ 'title', 'num' ] ,
		'key'	 => 'db_id' ,
	] ,
	'strid2dbids' => [
		'dbname' => 'strid2dbids' ,
		'select' => 'dbids' ,
		'key'	 => 'strid' ,
	] ,
	'wikipe' => [
		'dbname' => 'wikipe' ,
		'key'	 => 'key' ,
		'select' => [ 'key', 'en_title', 'en_abst', 'ja_title', 'ja_abst' ],
	] ,
	'met'		=> [
		'dbname' => 'met' ,
		'key'	 => 'key' ,
		'select' => [ 'name', 'data' ],
	] ,
	'taxo'		=> [
		'dbname' => 'taxo' ,
		'key'	=>	'key' ,
		'select' => ['name', 'json1'] ,
	] ,
	'taxoid'		=> [
		'dbname' => 'taxoid' ,
		'key'	 =>	'name' ,
		'select' => 'id' ,
	] ,
];
function _quicksqlite( $type, $val ) {
	global $_quicksqlite_info, $o_dbs;
	extract( $_quicksqlite_info[ $type ] ); //- $select, $key, $dbname
	if ( !$select ) die( 'no db info: '. $type );

	$dbname = $dbname ?: $type;
	if ( ! $o_dbs[ $dbname ] )
		$o_dbs[ $dbname ] = new cls_sqlite( $dbname );
	$sql=[
		'select' => $select ,
		'where'  => "$key=" . _quote( $val ) ,
	];
	return is_array( $select )
		? array_values( (array)$o_dbs[$dbname]->qar( $sql )[0] )
		: $o_dbs[$dbname]->qcol( $sql )[0]
	;
}

//.. _kwprep: 検索キーワードの変換
//- ダメ文字消して、小文字にして、分割して配列にして返す
function _kwprep( $kw ) {
	if ( $kw == '' ) return;
	$kw = strtolower( preg_replace( "/[' ]+/", ' ', $kw ) );

	$f = true;
	$ret  = [];
	foreach( explode( '"', $kw ) as $w ) {
		$w = trim( $w );
		if ( $f ) { //- ""の外
			if ( $w != '' )
				$ret = array_merge( $ret, explode( ' ', $w ) );
		} else { //- ""の中
			$ret[] = $w;
		}
		$f = ! $f;
	}
	foreach ( $ret as $i => $s )
		$ret[$i] = trim( $s );
	return array_filter( $ret );
}

//.. _kw2sql
function _kw2sql( $kw, $db ) {
	$col_kw = _search_cols( $db );
	$q = [];
	foreach ( (array)_kwprep( $kw ) as $w )
		$q[] = $col_kw .' LIKE '. _quote( "%$w%" );
	return $q;
}

//.. _search_cols:
function _search_cols( $db ) {
	$cols = is_array( $db ) ? $db : [
		'pdb'	=> [ 'search_kw', 'title', 'search_auth' ] ,
		'emdb'	=> [ 'search_words' ]  ,
		'sas'	=> [ 'kw' ] ,
		'chem'	=> [ 'kw' ] ,
		'dbid'  => [ 'title', 'db_id' ] ,
		'met'   => [ 'key', 'name', 'for' ] ,
		'taxo'	=> [ 'name', 'kw' ],
		'pap'	=> [ 'search_kw' ] ,
		'doc'	=> [ 'kw' ] ,
	][ $db ];
	if ( count( $cols ) == 1 )
		return $cols[0];
	foreach ( $cols as &$c )
		$c = "ifnull($c, '')";
	return implode( " || '|' || ", $cols );
}

//. 関数 その他 内部データなど
//.. _url: 各種URLを返す
function _url( $db, $i = '', $i2 = '' ) {
	global $urls, $id;
	return strtr( $urls[ $db ], [
		'[id]'	=> $i ?: $id ,
		'[id2]'	=> $i2 
	] );
}

function _add_url( $a ) {
	global $urls;
	$urls = array_merge( $urls, $a );
}

//.. _fn: 各種ファイル名を返す
function _fn( $type, $i = '', $s1 = '' ) {
	global $id, $_filenames;
	return strtr( $_filenames[ $type ], [
		'<id>' => $i ?: $id ,
		'<s1>' => $s1
	]);
}

//.. _e2j
/*
function _e2j( $term, $str = ' (<>)' ) {
	if ( L_EN ) return;
	$s = _json_cache( DN_DATA . '/ids/term_e2j.json.gz' )->{ strtolower($term) };
	if ( $s == '' ) return;
	return strtr( $str, [ '<>' => _imp( $s ) ] );
}
*/

//.. _chemform2html: 化学式をかっこ良くする
function _chemform2html( $in ) {
	//- SO4、PO4、NH2など対策 （現在、中途半端）
	$in = preg_replace( 
		[ '/^(O[34]) ([P-Z]+) (-[0-9]+)$/', '/^(H[234]) (N)(| \+1)$/' ],
		'$2 $1 $3',
		$in 
	);

	$ret = '';
	foreach ( (array)explode( ' ', $in ) as $l ) {
		$t = substr( $l, -1 );
		if ( $t == '-' || $t == '+' ) {
			//- 電荷？（上付きに）
			$num = abs( $l );
			$ret .= '<sup>' . $t . ( $num > 1 ? $num : '' ) . '</sup>' ;
		} else {
			//- 元素名+数（下付に）
			preg_match( '/([A-Za-z]+)([0-9]*)/', $l, $a );
			$ret .= ''
				. ucfirst( strtolower( $a[1] ) )			//- 元素名
				. ( $a[2] > 1 ? "<sub>{$a[2]}</sub>" : '' )	//- 個数
			;
		}
	}
	return $ret;
}

//.. _pubmed_abst
function _pubmed_abst( $j ) {
	$ret = [];
	foreach ( (array)$j as $k => $v )
		$ret[] = ( ctype_digit( $k ) ? '' : "<b>$k</b>: " ) . $v;
	return implode( '<br>', $ret );
}

//.. _term_rep
function _term_rep( $term, $r1, $r2 = '', $r3 = '', $r4 = '' ) {
	return strtr( $term, [
		'_1_' => $r1 ,
		'_2_' => $r2 ,
		'_3_' => $r3 ,
		'_4_' => $r4 ,
		'_'   => ' ' ,
	]);
}

//.. _define_term
function _define_term( $in ) {
	$key = $en = '';
//	foreach ( explode( "\n", strtr( $in, [ '"' => '\"' ] ) ) as $line ) {
	foreach ( explode( "\n", $in ) as $line ) {
		$trim = trim( $line );
		if ( ! $trim || substr( $trim, 0, 2 ) == '//' ) continue;
		//- キー 
		if ( substr( $line, 0, 1 ) != "\t" ) {
			$key = $trim;
			continue;
		}
		if ( ! $key ) continue;
		if ( ! $en ) {
			$en = $trim;
			continue;
		}
		if ( defined( $key ) )
			_testinfo( $key, '_define_term, 2nd def.' );
		else
			define( $key, L_EN ? $en : $trim );

		$key = $en = '';
	}
}

//. ページ構成要素
//.. _js: jsのコードを返す
//- 配列でも、複数の要素でもOK
function _js() {
	global $_jsvar;

	function _js_comment( $s ) {
		return TEST ? "\n// ---------- $s ----------\n\n" : null;
	}

	if ( ! defined( 'JS_SOURCE_SET' ) )
		define( 'JS_SOURCE_SET', _data_load( 'jsprec/js.data' ) );

	$ret = '';
	
	//- jsvar
	if ( $_jsvar ) $ret .= ''
		. _js_comment('jsvar')
		. 'var phpvar='. json_encode( $_jsvar, TEST ? JSON_PRETTY_PRINT : null ). ';'
	;

	//- スクリプト
	foreach ( _armix( func_get_args() ) as $n ) {
		$ret .= _instr( ';', $n ) //- セミコロンがあったらjsコード、なければ名称
			? _js_comment('direct'). $n
			: _js_comment( $n )
			 . ( TEST ? file_get_contents( "jsprec/$n.js" ) : JS_SOURCE_SET[ $n ] )
		;
	}
	return "<script>\n$ret\n</script>\n";
}

//.. _jslib: javascript のライブラリ読み込みのタグを返す
//- 配列でも、複数の要素でもOK
function _jslib() {
	//- 基本 (jquery のみ)
	$s1 = "<script src=\"";
	$s2 = "\"></script>\n";

//	$ret = $s1 . 'http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js' . $s2;
//	$ret = $s1 . 'http://code.jquery.com/jquery-1.6.3.min.js' . $s2;
	$ret = $s1 
		. "//code.jquery.com/jquery-2.2.4.min.js"
//		. '//code.jquery.com/jquery-3.2.1.min.js' //- jquery-UI に問題
		. $s2
	;

	//- その他
	$j = JMOLPATH;
	$a = [
		'ui'			=> 'js/jquery-ui.min.js' ,
		'jplayer'		=> 'js/jquery.jplayer.min.js' ,
		'tooltip'		=> 'js/jquery.tooltip.min.js' ,
		'tablesorter'	=> 'js/jquery.tablesorter.min.js' ,
//		'social'		=> 'js/social-likes.min.js' ,

		'jmol'			=> "$j/JSmol.min.js" ,
		'jmol3'			=> "$j/js/JSmolThree.js" ,
		'jmolgl'		=> "$j/js/JSmolGLmol.js" 
	];
	foreach ( _armix( func_get_args() ) as $s ) {
		$ret .= _instr( '<', $s )
			? $s
			: $s1 . ( $a[ $s ] ?: $s ) . $s2
		;
	}
	return $ret;
}
/*
jquery-uiダウンロード
draggable, resizable, slider, Tabs, autocomplete, position
cssは、smoothness
*/

//.. _jsvar: jsへ渡す $_jsvarを定義
function _jsvar( $a ) {
	global $_jsvar;
	$_jsvar = array_replace_recursive( (array)$_jsvar, $a );
}

//.. _css: cssのコードを返す
function _css() {
	global $_css;
	$rep = TEST
		//- テスト用
		? [
			'in'  => '/\/\/.*([\n\r]+|$)/' ,
			'out' => ''
		]
		//- 公開用
		: [
			'in'  => [ '/\/\/.*([\n\r]+|$)/', '/ *([,:;{}]) */', '/[\t\n\r]+/' ] ,
			'out' => [ '', '\1', '' ]
		]
	;

	$code = '';
	$link = '';
	foreach ( _armix( func_get_args() ) as $n ) {
		if ( _instr( '<link', $_css[ $n ] ) ) {
			$link .= $_css[ $n ];
		} else {
			$code .= preg_replace(
				$rep[ 'in' ], $rep[ 'out' ] ,
				_instr( ':', $n ) ? $n : $_css[ $n ]  //- スニペット名称か、直コードか
			);
		}
	}
	return "<style>\n$code\n</style>$link";
}

//.. _die: 文字列を吐いて死ぬ
function _die( $a ) {
	if ( is_array( $a ) || is_object( $a ) )
		$a = print_r( $a, 1 );
	die( _p( '強制終了' ) . _t( 'pre', $a ) );
}

//.. _redirect: リダイレクト
function _redirect( $u ) {
	header( "HTTP/1.1 303 See Other" ); 
	header( "Location: $u" );
	die();
}

//.. _robokill: ロボットからだったら503を吐いて死ぬ
function _robokill( $num = 10 ) {
	if ( $num < 10 )
		if ( $num < substr( microtime(), 4, 1 ) ) return;

	$u = $_SERVER[ 'HTTP_USER_AGENT' ];
	$r = false;
	if ( _instr( 'spider', $u ) || _instr( 'robot', $u ) || _instr( '.htm', $u ) ) {
//		if ( _instr( 'baidu', $u )
//			or _instr( 'soso', $u )
//			or _instr( 'sogou', $u )
//			or _instr( 'naver', $u )
//		) $r = 1;
		$r = true;
	}

	if ( $r and substr( microtime(), 4, 1 ) < $num ) {
		header("HTTP/1.1 503 Service Temporarily Unavailable");
		header("Status: 503 Service Temporarily Unavailable");
		header("Retry-After: 86400");
		header("Connection: Close");
		die( "503 Service Temporarily Unavailable" );
	}

}

//. 関数 ファイル操作系
//.. _tsv_load:
function _tsv_load( $fn ) {
	foreach ( _file( $fn ) as $l ) {
		$a = explode( "\t", $l );
		if ( $a[ 1 ] != '' )
			$ret[ $a[0] ] = $a[1];
	}
	return $ret;
}

//.. _mkdir
function _mkdir( $d ) {
	if ( is_dir( $d ) ) return;
	mkdir( $d );
}

//. 変数・定数の定義

//$emdbidlist = _file( DN_DATA . '/emdbidlist.txt' );
//$pdbidlist  = _file( DN_DATA . '/pdbidlist.txt'  );

//.. 検索用 latestデータの名前
$latest_name = [
	'e_newxml'	=> _ej( 'new EMDB'		, '新規EMDB' ) ,
	'e_newmap'	=> _ej( 'new map'		, '新規マップ' ) ,
	'e_udmap'	=> _ej( 'updated map'	, '更新されたマップ' ) ,
	'p_new'		=> _ej( 'new PDB'		, '新規PDB' )  ,
	'p_ud'		=> _ej( 'updated PDB'	, '更新されたPDB' )
];

//.. define: HTML
//- DOCTYPE
define( 'DOCTYPE', '<!DOCTYPE HTML><meta http-equiv="content-type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes"><meta http-equiv="X-UA-Compatible" content="IE=edge">' );

$_ = '&nbsp;';

define( 'HTML_END'	, '</body></html>' );
define( 'CHECK'		, 'checked="checked"' );
define( 'DISABLE'	, 'disabled="disabled"' );
$_chkd = 'checked:checked';
define( 'BR'		, '<br>' );

define( 'TR', '<tr>' );
define( 'TR_TOP', '<tr class="toprow">' );
define( 'TD', '<td>' );
define( 'TH', '<th>' );
define( 'LI', '<li>' );


//.. ホスト名は廃止、テストサーバーかどうかのみ
define( 'TESTSV', is_dir( '../prepdata' )  );
define( 'URL_PDBJ', _instr( 'pdbj.org', $_SERVER[ 'SERVER_NAME' ] ) ? ".." : '//pdbj.org' );

//.. jmol
define( 'JMOLPATH', TESTSV
	? end( glob( '_jmol/jmol*' ) ) . '/jsmol'
	: '../jmol/jsmol'
);

//.. icon

//- icon
define( 'IC_L'		, _ic() );
define( 'IC_DL'		, _ic( 'download' ) );
define( 'IC_OPEN'	, _ic( 'open' ) );

define( 'IC_EMN'	, _ic( 'emn' ) );
define( 'IC_YM'		, _ic( 'miru' ) );

define( 'IC_PDBJ'	, _ic( 'pdbj' ) );
define( 'IC_RESH'	, _ic( 'resh' ) );
define( 'IC_CONT'	, _ic( 'contact' ) );

define( 'IC_DET'	, _ic( 'detail' ) );
define( 'IC_MOV'	, _ic( 'movie' ) );
define( 'IC_SRC'	, _ic( 'search' ) );

define( 'IC_OMO'	, _ic( 'omokage' ) );
define( 'IC_ENT'	, _ic( 'entry' ) );
define( 'IC_ASB'	, _ic( 'asb' ) );
define( 'IC_HELP'	, _ic( 'help' ) );
define( 'IC_VIEW'	, _ic( 'view' ) );
define( 'IC_WIKIPE'	, _ic( 'wikipe' ) );

define( 'OMO_MODE', 8 );
	//TEST ? 7 : 3 );

//.. method name
$_metname = _ej( [
	'e' => 'electron microscopy' ,
	't' => 'electron tomography' ,
	'a' => 'subtomogram averaging' ,
	's' => 'single particle reconstruction' ,
	'i' => 'single particle (icosahedral) reconstruction' ,
	'h' => 'helical reconstruction' ,
	'2' => 'electron crystallography' 
] , [
	'e' => '電子顕微鏡法' ,
	't' => '電子線トモグラフィー' ,
	'a' => 'サブトモグラム平均化' ,
	's' => '単粒子再構成法' ,
	'i' => '単粒子 (正20面体対称) 再構成法' ,
	'h' => 'らせん対称再構成法' ,
	'2' => '電子線結晶学' 
] );

define( 'EM_MET_NAME', [
	'e' => 'electron microscopy' ,
	't' => 'electron tomography' ,
	'a' => 'subtomogram averaging' ,
	's' => 'single particle reconstruction' ,
	'i' => 'single particle reconstruction' ,
	'h' => 'helical reconstruction' ,
	'2' => 'electron crystallography' 
]);

$_metname_short = _ej( [
	'e' => 'electron microscopy' ,
	't' => 'electron tomography' ,
	'a' => 'subtomogram averaging' ,
	's' => 'single particle' ,
	'i' => 'icosahedral' ,
	'h' => 'helical' ,
	'2' => 'electron crystallography' 
], [
	'e' => '電子顕微鏡法' ,
	't' => 'トモグラフィー' ,
	'a' => 'サブトモグラム平均' ,
	's' => '単粒子' ,
	'i' => '正20面体対称' ,
	'h' => 'らせん対称' ,
	'2' => '電子線結晶学' 
] );
$_metname_wikipe = [
	'e' => 'em' ,
	't' => 'electron tomography' ,
	'a' => 'electron tomography' ,
	's' => 'single particle reconstruction' ,
	'i' => 'single particle reconstruction' ,
	'h' => '' ,
	'2' => 'electron crystallography' 
];

//.. フレーズ
/*
class PHR {
	const SHOW_MOV		= _ej( 'Show movie', 'ムービーを表示' );
	const SHOW_MOLMIL	= _ej( 'Show Molmil', 'Molmilを表示' );
	const SHOW_JMOL		= _ej( 'Show Jmol', 'Jmolを表示' );
	const SHOW_SVIEW	= _ej( 'Show SurfView', 'SurfViewを表示' );
}
*/

//.. ファイル名
$_filenames += [
/*
	//- emdb
	'emdb_snap'		=> DN_EMDB_MED	. '/<id>/snap<s1>.jpg' ,

	'emdb_olist'	=> DN_DATA		. '/omokage-data/emdb-<id>-list.txt' ,
	'emdb_olistj'	=> DN_DATA		. '/omokage-data/emdb-<id>-list.json' ,

	//- ym
	'ym_matrix'		=> DN_EMDB_MED	. '/<id>/ym/matrix.json' ,

	//- epdb
	'epdb_json'		=> DN_DATA		. '/epdb/json/<id>.json.gz' ,

	'pdb_omap'		=> DN_DATA		. '/omokage-data/pdb-<id>.jpg' ,
	'pdb_olist'		=> DN_DATA		. '/omokage-data/pdb-<id>-list.txt' ,
	'pdb_olistj'	=> DN_DATA		. '/omokage-data/pdb-<id>-list.json' ,

	//- allpdb
	'mmcif'			=> TESTSV
					?	DN_FDATA 	. '/mmcif/<id>.cif.gz'
					: '/kf1/PDBj/ftp/rcsb/mmcif/<id>.cif.gz'
	,

	//- sas
	'sasbdb_json'	=> DN_DATA . '/sas/json/<id>.json.gz' ,
	'sasbdb_img'	=> DN_DATA . '/sas/img/<id>.jpg' ,

	//- pubmed
	'pubmed'		=> DN_DATA		. "/pubmed/<id>.json" ,
*/
];


//. $urls定義
//.. $urls
$urls = [
];

//. subdata等の読み込み.

$_contents = '';
$_ext_column = '';
$_hidden = '';

$cssid = 0;
$jslib = [];

$_comptime = [];

//. abdb common
$a = _tsv_load2( 'data/term.tsv' );
define( 'TERM_E', $a['e'] );
define( 'TERM_J', $a['j'] );
define( 'TERM_REP', $a['rep_' . _ej( 'e', 'j' ) ] ); 

$j = '';
foreach ( _file( 'data/j2e.txt' ) as $line )  {
	if ( ! $line ) {
		$j = '';
	} else if ( ! $j ) {
		$j = $line;
	} else {
		$a[ 'e2j' ][ $line ] = $j;
		$j = '';
	}
}

define( 'TERM_E2J', $a['e2j'] );
define( 'TERM_J2E', array_flip( $a['e2j'] ) );

//. misc define
define( 'BTN_ACTIVE', 'btn_active | disabled' );
define( 'SEP', '<span class="sep"> / </span>' ); //- セパレータ
/*
_define_term(<<<EOD
TERM_SELECT_BTN
	Click this button to select this element in structure viewer
	クリックすると構造ビューア内でこの要素が選択されます
TERM_POP_VIEWER
	Click this button to start structure viewer
	クリックすると構造ビューアが起動します
TERM_WIKIPE
	Wikipedia
	ウィキペディア
EOD
);
*/

//.. 
_add_lang([
]);

define( 'LOADING', _span( '.loadingbar', _img( '', 'loading.g' ) ) );
define( 'LOADINGT', _p( LOADING . _ej( 'Loading...', '読み込み中...' ) ) );
_jsvar([
	'loading' => LOADINGT ,
	'loadingerror'	=> _span( '.red', _ej( ' error?', ' エラー?' ) ) ,
]);

//- docで使う文字列
define( 'DOC_RELATED', _ej( '<b>Related info.</b>: ', '<b>関連情報</b>: ' ) );
define( 'DOC_LINK',	_ej( '<b>External links</b>: ', '<b>外部リンク</b>: ' ) );

//$_doc = _json_load( 'doc/doc.json.gz' );
define( 'DOC_JSON', _json_load( 'doc/doc.json.gz' ) );

//- hdiv lev2 の一括表示
define( 'BTN_HDIV2_ALL',
	 _btn( '!_hdiv.all2(this)', _ej( 'Show/hide all', 'すべて表示・隠す' ) )
);

//define( 'IC_DB', _fa( 'database' ) );
define( 'IC_SEARCH', _fa( 'search' ) );
define( 'IC_KEY', _fa( 'key' ) );

//. css
$col_bright = '#eef';
$col_medium = '#aad';
$col_dark   = "#66a";
/*
if ( COLOR_MODE == 'ym' ) {
	$col_bright = '#dee';
	$col_medium = '#8bb';
	$col_dark   = "#377";
}

if ( COLOR_MODE == 'emn' ) {
	$col_bright = '#d8e8d8';
	$col_medium = '#9c9';
	$col_dark   = "#585";
}

if ( COLOR_MODE == 'mng' ) {
	$col_bright = '#e8d8d8';
	$col_medium = '#c99';
	$col_dark   = "#855";
}
*/
$col_red	= "#800";

$bg_dark   = "background: $col_dark; color: white";
$bg_blight = "background: $col_bright";
$bg_medium = "background: $col_medium";

//- font-size
$fsize = [ 'x-small', 'small', 'medium', 'large', 'x-large' ][ $_COOKIE[ 'vfsize' ] ?: 2 ];

//- ここから
$_css[ 'simple' ] = <<<EOD
html, body { height: 100%; }
button { font-size: medium }
button img, button { vertical-align: middle }
button, a, select, label, .lk, .clickable {cursor: pointer}

.clickable:hover { color: blue; }

li { margin: 0.3em 0 0.3em 1em; padding: 0 }
p { margin: 0.3em 0  }
ul { margin: 0; padding: 0;}

.hide { display: none; }
.nw { white-space: nowrap; }
.left { float:left }
.right {float:right }
.clboth { clear:both }
.red { color:red }
.blue { color:blue }
.gray{ color: #bbb }
.green { color:green }
.white { color:white }
.dark { color: $col_dark }
.bld { font-weight:bold }
.shine { position: relative; z-index: 100; box-shadow: 0 0 1em 0em #ff0; }
.shine:hover { box-shadow: 0 0 1em 0.5em #ff0; }
.lkicon { padding: 0 2px; margin: 0; border: none; vertical-align: middle; }
.small { font-size: small }
.smaller { font-size: smaller }
.large { font-size: large }
// .shadow { box-shadow: 0 0 10px #000; }
//.. form
input { max-width: 100% !important; }

input[type=radio]:checked, input[type=checkbox]:checked,
input[type=radio]:checked + label, input[type=checkbox]:checked + label {
	background: #ff9; box-shadow: 0 0 1.5em #ff0;
}
.inpbox { width: 100%; font-size: larger;}
//- float解除用
.left:after, .clearfix:after{
    content: "";
    clear: both;
    display: block;
}

.doc_ul { margin: 0.3em 0.1em 1em 1em; }
pre { border: 1px solid gray; padding: 0.5em }

//.. general
html { font-size: $fsize }
body { background: white; margin: 0; padding: 0; border: none; }

#mainbox, #maininner {
	min-width: 350px;
	border: none; padding: 0 ; margin 0;
}
#maininner { padding: 0.2em 0.3em }

//.. general tabale
table { border-collapse: collapse; border: 1px solid $col_medium;}
	// max-width: 100% !important; }
td, th { padding: 0.1em 0.5em; border: 1px solid $col_medium;  }

.maintable { width: 100%; }
.maintable > tbody > tr > th { width: 15%; }
.maintable > tbody > tr > td { word-wrap: break-word; width: 85%; }
th { text-align:right; $bg_blight; }
.toprow th { text-align:center; width: auto; }
.numtable td{ text-align:right }

img { vertical-align: middle; }

//.. general item
button, .submitbtn {
	padding: 0.1em 1em; $bg_blight;
	border: 2px solid $col_medium;
	border-radius: 3px;
	font-size: inherit;
	box-shadow: 0 0 5px rgba(0,0,0,0.3);
}
.minibtn { padding: 0.1em 0.3em; }
button:hover, .submitbtn:hover {
	box-shadow: 0 0 10px rgba(255,255,0,0.5);
}

button:active, .submitbtn:active {
	box-shadow: 0 0 2px rgba(0,0,0,0.7);
}

.submitbtn {
	padding: 0.1em 2em; font-size: larger; font-weight: bold;
	$bg_dark;
}
button:disabled { opacity: 0.5; cursor: default }
.btn_active {
	font-weight: bold; color: $col_red; cursor: default;
}
//- loadingbar
.loadingbar { vertical-align: middle }
.btn_small { padding: 0.1em }

//.. hdiv
h1, h2, h3 { 
	font-size: larger; 
	font-weight:bold; 
	clear: both;
	padding: 0; margin: 3px 0 0;
	border-style: solid; border-width: 2px; border-color: $col_dark;
	$bg_blight;
//	height: 1.5em;
//	height: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	cursor: pointer;
}
h1:hover, h2:hover, h3:hover {
	box-shadow: 0 5px 8px 2px #ff9;
}
h1 p, h2 p, h3 p {
	border: none; padding: 0; margin: 0;
}

h2, h3 { font-size: inherit; border-width: 1px; }

.h_addstr { font-weight: normal;}

.oc_btn {
	$bg_dark;
	float: left; width: 2.5em;
	text-align: center;
	margin: 0 0.5em 0 0; padding: 0;
	font-size: larger;
	font-weight: bolder;
//	height: 100%;
}

.oc_div {
////	margin: 0.2em 0 0.8em 1em;
//	padding: 0.2em 0 0.8em 0.9em;
	margin: 0em 0 0.4em 0em;
	padding: 0.2em 0 0.4em 1em;
	border-left: 2px solid $col_medium;
	word-wrap: break-word;
//	max-width: 100% !important; 
}
.h_sub { font-size: inherit; border:none; border-top: 1px solid $col_medium; padding: 1px 0.2em;
	background: inherit;
	cursor: inherit; }

//- separator
.sep { color: $col_medium }

//- ID input
#id_form { display: inline }
input { font-size: larger; }

//- top / bottom
#simple_top, #simple_bottom, #simple_bottom span {
	$bg_dark; color: white;
	padding: 0.5em 0.5em; margin: 0;
	background-image: url("img/bg.png");
}


//.. simpletop/ bottom
#simple_top a, #simple_bottom a {
	text-decoration: none; color: white; }

#simple_top_title {
	display:block; float: left;
	font-size: xx-large; font-weight: bold; 
	padding: 0.5em 0.5em 0.5em 1em;
	text-shadow: 1.5px 1.5px 2px rgba(0,0,0,0.75), 0 0 10px #ff9;
}

#simple_top_title:hover { 
	text-shadow: 1.5px 1.5px 2px rgba(0,0,0,0.8),0 0 5px #ff9, 0 0 15px #ff9;
}

#simple_top_title img { margin-right: 0.3em; vertical-align: middle; width: 1.3em; height: 1.3em }
#simple_top_sub { font-size:small;
	margin: 1.3em 1em 1em 1em;
	text-shadow: 1.5px 1.5px 2px rgba(0,0,0,0.7), 0 0 10px #ff9;
}

#top_opt { float: right; font-size: small; text-align: right;
	margin: 0.1em; }

#simple_bottom {
	font-size: smaller; text-align: center;
}

@media screen and ( max-width:640px ) { 
	#simple_top_sub { clear: both; }
	#simple_top_title { padding: 0 }
	.wide_only {display: none}
}

//- simple_border div
.simple_border { border: 2px solid $col_medium; padding: 0.5em; margin: 0.2em 0.5em; }

//- メニューポップボタン
.btn_menu_fixed {
	position: fixed; top: 0.5em; right: 0.5em; opacity: 1; z-index: 1000;
}

//.. tab
.tabp { margin-bottom: 0; white-space: nowrap; width: auto; }
.tabbtn {
	margin: 0 2px -2px 2px; padding: 0.1em 0.5em; vertical-align: bottom;
	border-radius: 8px 8px 0 0; position: relative;
	background: $col_bright; border: 2px solid $col_medium; 
	box-shadow: none;
}
.tabbtn:hover { padding-top: 0.3em; z-index: 200; overflow: visible !important }
.tabbtn:disabled { padding-top: 0.5em;  border-bottom-color: white;
	opacity: 1; font-weight: bold; color: $col_red;
	background: white; z-index: 100}
.tabdiv { border: 2px solid $col_medium; padding: 0.5em; margin: 0 }

//.. ポップアップ
.pubox { display: none;
	margin: 0; padding: 5px; border: 1px solid $col_dark; max-width: 30em;
	background: $col_bright; box-shadow: 1px 1px 10px #777;
}
._pu_act {
	box-shadow: 1px 1px 10px #777;
}

//.. クリックポップアップ
.poptrg {
	color: #033; text-decoration: underline; cursor: pointer;
}
.poptrg_act { opacity: 0.5; }
img.poptrg_act { box-shadow: 1px 1px 10px #777; }
.pophide {
	color:white; 
	background: $col_red;

	margin: -3px -3px inherit inherit;
	font-weight: bold;
	border: none; 
	float: right;
}

.popbox {  
	display: none;
	position: absolute;
	margin: 0; padding: 5px; border: 1px solid $col_dark; max-width: 30em;
	background: white;
	box-shadow: 1px 1px 10px #777;
	z-index: 1000;
	max-height: 80vh;
}
.pop_inner {
	font-size: smaller; overflow:auto; width:100%;;max-height:20em
}

//.. 閉じるボタン
.closebtn {
	color:white; 
	background: $col_red;
	font-weight: bold;
	border: none; 
	float: right;
}

//.. sizebox
.sizebtn { height: 1.6em; padding: 0 0.5em; vertical-align: middle; } 
.sizebox_ll { width: 1.1em; height: 1.1em }
.sizebox_l  { width: 0.9em; height: 0.9em }
.sizebox_m  { width: 0.7em; height: 0.7em }
.sizebox_s  { width: 0.5em; height: 0.5em }
.sizebox_ss { width: 0.3em; height: 0.3em }
.sizebtn div { vertical-align: middle; display:table-cell; background: $col_dark }

//- リスト表示の区切り
.topline { border-top: 1px solid $col_medium;}

//.. ext_column
#ext_column {
	position: fixed; z-index: 500; top: 0; right: 0;
	max-width: 90%;
	margin: 0; padding: 0; 
	font-size: smaller;
	height: auto;  overflow-y: auto;
	overflow-x:hidden;
}

#menubox {
	width: 250px; 
}

.extcol_item_outer{
	right:0;
	$bg_dark; margin: 0 0 5px 0; padding: 2px 7px 7px 7px; 
	position: relative;
	border: none;
}

.extcol_item_inner {
	background: white;
	color: black;
}
.extcol_listitem_img {
	width: 75px; height: 75px
}


//.. パンくず
.pankuzu ul { margin-left: 1em }
.pankuzu li { list-style:none; }
.pankuzu li:before { content:"┗"; }

//.. 表？ 
.noborder, .noborder td, .noborder tr { border: none; margin 0; padding: 0;}

//.. doc
.docimg { box-shadow: 0 0 5px rgba(0,0,0,0.8 ); }

//.. font awesome
.fa { font-size: 1.1em; margin: 0 0.2em; }

//.. misc 
.txtype_icon { width: 24px; height: 24px; }
EOD;

//.fa-white { font-size: larger; color: white; }
//.fa { font-size: larger; color: $col_dark; margin: 0 0.2em; }

//. functions: simple_out
//- 全要素出力
//- エラーとかajax以外は、これが唯一のecho

function _simple_out( $a ) {
	global $_contents, $_about, $urls, $_testinfo, $_ext_column, $_hidden, $_meta, $_h1list,
		$col_dark, $_comptime ,
		$_sqlite_log
	;
	extract( $a ); //- $title, $sub, $icon ,$js, $css, $openabout, $newstag, $docid, $title_pk,
		//- $auth_autocomp,
	unset( $a );
	//- jsvar 追加
	_jsvar([
		'idservadr' => 'ajax.php?mode=id2img&id='
		
//IMG_MODE == 'em'
//			? 'ajax.php?mode=id2img&img_mode=em&id='
//			: 'ajax.php?mode=id2img&id='
		,
		'popxbtn' => [
			1 => _btn( '!_pop.hide() | .pophide', 'X' ) ,
			2 => _btn( '!_pop.hide(2) | .pophide', 'X' ) ,
			3 => _btn( '!_pop.hide(3) | .pophide', 'X' ) 
		],
	]);

	//.. theme-color スマホ用
	$_meta .= _e( "meta|name:theme-color|content:$col_dark" );

	//.. autocomp
/*
	$j = _json_load2( DN_DATA . '/autocomp.json.gz' );
	$e = COLOR_MODE == 'emn';
	$autocomp = _t( 'datalist | #acomp_kw', $j->kw );
	if ( $e )
		$autocomp .= _t( 'datalist | #acomp_em', $j->kw_em );
	if ( $auth_autocomp ) {
		$autocomp .= _t( 'datalist | #acomp_an' . ( $e ? '_em' : '' ) ,
			$e ? $j->an_em : $j->an 
		);
	}
*/
	//.. タイトル
	$title_color = $title;
	$title = strtr( $title, [
		'EM Navigator'	=> 'EM| Navigator|' ,
		'EMN'			=> 'EM|N|' ,
		'Yorodumi'		=> 'Yorodu|mi|' ,
		'Omokage'		=> 'Omo|kage|',
		'万見'			=> '万|見|',
	]);
	if ( _instr( '|', $title ) ) {
		$a = explode( '|', (string)$title );
		$title_color = _span( '.ttcol1', $a[0] ) . _span( '.ttcol2', $a[1] ) . $a[2];
		$title = implode( '', $a );
		if ( is_string( $css ) )
			$css = [ $css ];
		$css[] = '.ttcol1 {color: #bcf} .ttcol2 {color: #faa }';
	}

	//.. icon
	$favicon = '';	//- favicon
	$icon_s = '';
	$icon32 = '';	//- タイトル用アイコン
	if ( $icon != '' ) {
		foreach ([ "img/lk-$icon.gif", "img/$icon.gif", "img/$icon" ] as $icon_s ) {
			if ( ! file_exists( $icon_s ) ) continue;
			$icon32  = file_exists( $l = strtr( $icon_s, [ '.' => '32.' ] ) )
				? $l : $icon_s ;
			$favicon = _e( "link | rel:icon | href:$icon_s" );
			$icon_s = _img( $icon_s );
			$icon32 = _img( $icon32 );
			break;
		}
	}


	//.. ページ一覧
	//... パンくず
	$pk = 'li| itemscope="itemscope" itemtype="http://data-vocabulary.org/Breadcrumb"';
	$s = _t( 'li', $icon_s
		. _span( 'itemprop="title"', $title_pk ?: $title )
	);

	//- トップページでない (EMN /YMでない)
/*
	if ( ! defined( 'TOP_PAGE' ) ) {
		$s = _t( 'ul',
			_t( $pk,
				COLOR_MODE == 'emn'
				? _a( '.' ,
					IC_EMN . _span( 'itemprop="title"', 'EM Navigator' ) ,
					'itemprop="url"' 
				)
				: _a( 'quick.php',
					IC_YM . _span( 'itemprop="title"', _l( 'Yorodumi', '万見' ) ) ,
					'itemprop="url"' 
				)
			) . _t( 'ul', $s ) 
		);
	}

	$item_pankuzu = _t( 'nav' , 
		//- PDBj
		_t( $pk, _ab(
			_url( 'pdbj' ),
			IC_PDBJ . _span( 'itemprop="title"', 'PDBj' ), 
			'itemprop="url"' ) 
		)
		//- 以下
		. _t( 'ul | .pankuzu', $s )
	);
*/

	//... サーチ
/*	$item_search = _t( 'form |.topline | method:get | action:ysearch.php', ''
		.LI
		. _a( 'ysearch.php', _ic( 'lens' ) . _ej( 'Cross-search', '横断検索' ) )
		. ': '
		. _e( 'input| .acomp| type:search| name:kw| list:acomp_kw| size:15' )
	);
*/
	//... その他のページ
/*
	$y = $e = $h = '';
	$plus = _fa( 'plus-square', 'large' );

	$p = '';
	foreach ([
		[ 'esearch.php'		, 'EMN Search'			, 'EMN検索'				, 'search' ] ,
		[ 'stat.php'		, 'EMN Statistics'		, 'EMN統計'				, 'statistics' ] ,
		[ 'gallery.php'		, 'EMN Gallery'			, 'EMNギャラリー'		, 'gallery' ] ,
		[ 'pap.php?em=1'	, 'EM Papers'			, 'EMN文献' 			, 'article' ] ,
		[ 'doc.php?tag=emn'	, 'About EM Navigator'	, 'EM Navigatorについて'	, 'help' ] ,
	] as $a ) {
		$p .= LI. _a( $a[0], _ic( $a[3] ) . _ej( $a[1], $a[2] ), '.nw'  );
	}
	$item_emn = _a( '.', IC_EMN . 'EM Navigator' ) .' '. _pop( $plus, $p );	

	$p = '';
	foreach ([
		[ 'ysearch.php'		, 'Yorodumi Search'		, '万見検索'		, 'search' ] ,
		[ 'pap.php'			, 'Yorodumi Papers'		, '万見文献' 		, 'article' ] ,
		[ 'taxo.php'		, 'Yorodumi Species'	, '万見生物種' 		, 'taxo' ] ,
		[ 'doc.php?tag=ym'	, 'About Yorodumi'		, '万見について'	, 'help' ] ,

	] as $a ) {
		$p .= LI. _a( $a[0], _ic( $a[3] ) . _ej( $a[1], $a[2] ), '.nw'  );
	}
	$item_ym = _a( 'quick.php', _ic( 'miru') . _ej( 'Yorodumi', '万見 (Yorodumi)' ) )
		.' '. _pop( $plus, $p );

	$item_omo = _a( 'omo-search.php',
			_ic( 'omokage' ) . _ej( 'Omokage search', 'Omokage検索' ) 
		)
		.' '
		. _pop( $plus,
			LI. _a(
				'doc.php?tag=omo', 
				IC_HELP . _ej( 'About Omokage search', 'Omokage検索について' )
			)
		)
	;

	$p = '';
	foreach ([
		[ '?type=info'	, 'Help'		, 'ヘルプ'		] ,
		[ '?type=faq'	, 'FAQ'			, 'FAQ'			] ,
		[ '?type=news'	, 'News'		, 'お知らせ'	] ,
		[ '?tag=about'	, 'Pages'		, 'ページ一覧'	] ,

	] as $a )
		$p .= LI. _a( 'doc.php' . $a[0], IC_HELP . _ej( $a[1], $a[2] ), '.nw' );

	$item_doc = _a( 'doc.php', _ic('help') . _ej( 'News&docs', 'お知らせ・ヘルプ' ) )
		.' '. _pop( _fa( 'plus-square', 'large' ), $p );
	
	
	$item_pages = ''
		. LI. $item_emn
		. LI. $item_ym
		. LI. $item_omo
		. LI. $item_doc
		. ( TEST
			? LI . _a( '_mng.php', 'mng' )
			: ''
		)
	;
*/

	//.. about
	if ( is_array( $_about ) ) {
		 _simple_hdiv(
		 	_ic( 'help' ) . _ej( "About $title", $title . 'について' ) ,
		 	_t( 'ul', '<li>' . implode( '<li>', $_about ) ) ,
			[ 'hide' => ! $openabout, 'id' => 'about' ]
		);
	}

	//- docから（こっちをメインに切替よう）
	$about = '';
	if ( $newstag != '' ) {
		$news = '';
		$cnt = 0;
		foreach ( DOC_JSON as $i => $d ) {
			if ( $d[ 'type' ] != 'news' ) continue;
			if ( in_array( 'old', (array)$d[ 'tag' ] ) ) continue;
			if ( ! in_array( $newstag, (array)$d[ 'tag' ] ) ) continue;
			$news .= _doc_hdiv( $i, [ 'type' => 'h3', 'hide' => $cnt > 1 ] );
			++ $cnt;
			if ( $cnt > 4 ) break;
		}
		if ( $news != '' ) {
			$about .= _simple_hdiv(
				'News',
				$news . _p( _ab( 'doc.php?type=news', _ej( 'Read more', 'すべてのお知らせ' ) ) ) ,
				[ 'type' => 'h2',  ] 
			);
		}
	}

	//- 解説
	if ( $docid != '' ) {
		$about .= _doc_hdiv( $docid, [ 'nourl' => true ] );
		//- サブタイトルもdocから
		if ( $sub == '' )
			$sub = DOC_JSON[ $docid ][ _ej( 'e', 'j' )][ 's' ];
	}
	
	if ( $about != '' ) {
		 _simple_hdiv(
		 	_ic( 'help' ) . _ej( "About $title", $title . 'について' ) ,
		 	$about
		 	. _p( _ab( "doc.php?tag=$newstag", _ej( 'Read more', '他の情報も見る' ) ) )
		 	,
			[ 'hide' => ! $openabout, 'id' => 'about' ]
		);
	}
	
	//.. toplinks
//	$toplinks = _t( 'ul', $item_pankuzu. $item_search . $item_pages  . $item_links );
	$a = [];
	$l = _fa('external-link');
	foreach ([
		_ej( 'Development note', '開発メモ' ) => '//github.com/hiro111suzu/antibody-databank/wiki/',
		_ej( 'Antibodybank', '抗体バンク（東北大学・加藤研究室）' ) => '//www.med-tohoku-antibody.com/topics/001_paper_antibody_PDIS.htm' 
	] as $n => $u ) {
		$a[] = _ab( $u, $l. $n );
	}



	$toplinks = _t( 'ul', LI. implode( LI, $a ) );



	//.. 言語切替ボタン
	$top = $_SERVER[ 'PHP_SELF' ];
	$langlink = L_EN
		? '' 
			. '<b>[English]</b> '
			. _a( "$top?" . http_build_query( [ 'lang' => 'ja' ] + $_GET ), '日本語' )
		: ''
			. _a( "$top?" . http_build_query( [ 'lang' => 'en' ] + $_GET ), "English" )
			. ' <b>[日本語]</b> '
	;

	//.. ボトム
//	$btm = implode( ' ', [
/*
		$item_emn ,
		$item_ym ,
		$item_omo ,
		$item_doc ,
		BR,
//		_a( $urls[ 'pdbj' ]		, IC_PDBJ . 'Protein Databank Japan (PDBj)' ) ,
//		_a( $urls[ 'pdbj' ] . '/help/'	, _ic( 'help' ) . _ej( 'PDBj Help', 'PDBj ヘルプ' )  ),
//		_a( $urls[ 'pdbj' ] . '/contact/' , _ic( 'contact' )
//			. _ej( 'Contact us', 'お問い合わせ' ) ),

		_ab( 'https://binds.jp', _fa('external-link') . 'AMED-BINDS' )
		BR,
		_a( 'doc.php?id=developer',
			_ej( 'Developed by ', '開発者: ' )
//			. _img( 'img/face.jpg' )
			. ' H. Suzuki, Waseda univeristy' 
		)
	]);
*/
	$btm = _ab( 'https://binds.jp', 'Supported by AMED-BINDS' )
		. BR
		. BR
		. _pop(
			_ej( 'Developed by ', '開発者: ' ). ' H. Suzuki, Waseda univeristy' ,
			'mail: hirofumi[at]aoni.waseda.jp'
		)
	;

	//.. ext_column
	$m = '';
	foreach ( $_h1list as $i => $str ) {
		$m .= _t( "li | .clickable  | !_hdiv.focus('$i')", $str );
	}

	$pg_menu = ''
		. _btn( '!_hdiv.all()', _ej( 'Show/hide all', 'すべて表示・隠す' ) )
		. _chkbox( _ej( 'Exclusive', '単独表示' ), '#hdiv_exc', $_COOKIE[ 'hdiv_exc' ] )
		. _t( 'ul', $m )
	;

	//- fontsize
	$fs = $_COOKIE[ 'vfsize' ] ?: 2;
	foreach ( [0,1,2,3,4] as  $i )
		$da[ $i ] = $i == $fs ? 'disabled' : '';

	$_ext_column .=  _div( '#menubox | .extcol_item_outer hide', ''
		. _btn( '.closebtn | !_extcol.menu(0)', 'X' )
		. _p( _span( '!_extcol.menu(0)', _fa( 'bars', 'white' ) . _ej( 'Menu', 'メニュー' )  ) )
		. _div( '.extcol_item_inner', ''

			//- このページ
			. _simple_hdiv(
				_ej( 'This page', 'このページ' ) ,
				$pg_menu ,
				[ 'id' => 'page_menu', 'type' => 'h2' ]
			)

			//- このサイト
			. _simple_hdiv(
				_fa( 'link' ) . _ej( 'External links', 'リンク' ) ,
				$toplinks ,
				[ 'type' => 'h2' ]
			)

			//- オプション
			. _simple_hdiv(
				_fa('gear') . _ej( 'Options', 'オプション' ), ''
				. _t( 'ul', ''
					.LI. $langlink
/*
					.LI. _ej( 'Structure viewers', '構造ビューア' ) . BR
					. _viewer_selector( 'mol' )
					. BR
					. _viewer_selector( 'map' )
*/					. ': '
					.LI. _ej( 'Font size', '文字の大きさ' )
					. _sizebtn( 'ss', ' fsizebtn| #fsize0 | !_fsize(0)|' . $da[0] )
					. _sizebtn( 's' , ' fsizebtn| #fsize1 | !_fsize(1)|' . $da[1] )
					. _sizebtn( 'm' , ' fsizebtn| #fsize2 | !_fsize(2)|' . $da[2] )
					. _sizebtn( 'l' , ' fsizebtn| #fsize3 | !_fsize(3)|' . $da[3] )
					. _sizebtn( 'll', ' fsizebtn| #fsize4 | !_fsize(4)|' . $da[4] )
				
				)
				,
				[ 'type' => 'h2', 'hide' => false ]
			)
		)
	);

	//.. 時間計測
	if ( $_comptime != [] ) {
		_time( 'output' );
		$t = '';
		foreach ( $_comptime as $name => $val ) {
			$t .= TR.TH. $name .TD. ( $val < 50 ? $val : _span( '.red', $val ) );
		}
		$t .= TR.TH. 'total' .TD. number_format( ( microtime( TRUE ) - TIME_START ) * 1000 );
		$_testinfo .= _simple_hdiv(  'comp time', _t( 'table| .small', $t ), [ 'type' => 'h2' ] );
	}

	//.. sqlite log
	if ( $_sqlite_log != [] ) {
		$t = '';
		foreach ( $_sqlite_log as $a )
			$t .= TR.TH. $a[0] .TD. $a[1] .TD. $a[2];
		$_testinfo .= _simple_hdiv( 'SQlite log', _t( 'table| .small', $t ), [ 'type' => 'h2' ] );
	}

	//.. testinfo
	if ( $_testinfo != '' )
		_simple_hdiv( 'Test info', $_testinfo );

	//.. 出力
	echo DOCTYPE
		. _t( 'title', _ifnn( $sub, "$sub - " ) . $title )
		. $favicon
		. $_meta
		. '<link href="//netdna.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet">'
		. _jslib( $jslib, 'ui' )
		. _css( 'simple', $css )
		. _div( '#ext_column', $_ext_column )
		. _div( '#mainbox', ''

			//- topbar
			. _t( 'header', _div( '#simple_top | .clearfix', ''
				. _div( '#top_opt', $langlink
					. BR
					. _btn( '#btn_menu_pop |!_extcol.menu(1)',
						_ic( 'menu' ) . _ej( 'menu', 'メニュー' ) )

				)
				. _a( '.', $icon32 . $title_color, '#simple_top_title' )
/*
				. _pop(
					$icon32 . $title_color ,
					$toplinks , 
					[ 'trgopt' => '#simple_top_title', 'js' => '_acomp.init()' ]
				)
*/
				. ( $sub == '' ? '' : _div( '#simple_top_sub', "- $sub -" ) )
			))
			. _div( '#maininner', $_contents )
			. _t( 'footer', _div( '#simple_bottom', $btm ) )
		)
		. _div( '#popbox|.popbox', '' )
		. _div( '#popbox2|.popbox', '' )
		. _div( '#popbox3|.popbox', '' )
		. $_hidden //- jsで使う隠し要素など
//		. $autocomp
		. _js( 'simple_common', 'simple', $js ) // 'simple_mov',
	;
}

//. functions - simpleFW
//.. _cssid
//- cssに使うユニークな数字を返す
function _cssid() {
	global $_cssid;
	++ $_cssid;
	return ( AJAX ? 'a' : 'i' )
		. ( defined( 'CSSID_PREFIX' ) ? CSSID_PREFIX : '' ) 
		. $_cssid
	;
}

//.. _icon_title: タイトルをアイコン付きにする
define( 'ICONS_FOR_H1', [
	'Basic information'			=> 'entry' ,
	'strvis'					=> 'view' ,
	'Sample'					=> 'sample' ,
	'Sample preparation' 		=> 'sample' ,
	'Assembly'					=> 'asb' ,
	'Map'						=> 'map' ,
	'Components'				=> 'components' ,
	'Sample components'			=> 'components' ,
	'downlink'					=> 'download' ,
	'Downloads'					=> 'download' ,
	'External links'			=> 'link' ,

	'About this page'			=> 'help' ,
	'Authors'					=> 'auth' ,
	'Contact author'			=> 'auth' ,
	'Citation'					=> 'article' , 
	'Keywords'					=> 'lens' ,
	'Map data'					=> 'map' ,
	'Imaging'					=> 'em' ,
	'Electron microscopy imaging' => 'em' ,
	'Electron microscopy' 		=> 'em' ,
	'Processing'				=> 'processing' ,
	'Computation'				=> 'processing' ,
	'Image processing'			=> 'processing' ,
	'Download'					=> 'download' ,
	'Links'						=> 'link' ,
]);

function _icon_title( $in, $icon = '' ) {
//- 	$in: "タイトル|サブタイトル|タグ名"
//- 	タグ名は_trepに渡す
	list( $title, $sub, $tag ) = explode( '|', $in, 3 );
	$title = trim( $title, ' ~' );
	return ( $icon != ''
			? _ic( $icon )
			: ( ICONS_FOR_H1[ $title ] ? _ic( ICONS_FOR_H1[ $title ] ) : '' )
		)
		. (	function_exists( '_trep' ) ? _trep( $title, [ 'tag' => $tag ]) : _l( $title ) )
		. ( $sub ? ' ' . trim( $sub ) : '' )
//		. ( "[$tag]" )
	;
}

//.. function_
function _title_num( $t, $num = '_' ) {
	return ( function_exists( '_trep' ) ? _trep( $t ) : _l( $t ) )
		. ( $num == '_' ? '' : " ($num)" );
}

//.. _simple_hdiv
/*
$id 特別なIDをふるか css-id
$hide デフォルトで隠しておく 
$return: $_contentsに追加せずにreturnするフラグ
$only: open時、他をcloseする要素
$js 開いたとき実行するスクリプト

アイコンはタイトルから自動付加されるが、$iconで指定も可能
h1以外の時はオプション無しでも自動出力しないモード
*/

$_h1list = [];
function _simple_hdiv( $h1cont, $div_cont, $opt = [] ) {
	global $_contents, $_h1list; 
	$type = 'h1';
	$h1add = $icon = $hide = $only = $return = false;
	extract( $opt ); //- $id, $hide, $only, $return, $js, $type
	if ( $type != 'h1' )
		$return = true;

	//- ID
	if ( $id == '' )
		$id = _cssid();
	
	//- 排他モード
	$o = $only ? ',2' : '';

	//- h1 str
	$h1str = _icon_title( $h1cont, $icon );

	//- メニュー用
	if ( $type == 'h1' ) {
		$_h1list[ $id ] = $h1str;
	}

	$cls = ( $type == 'h1' ? ' lev1' : ( $type == 'h2' ? ' lev2' : '' ) )
		. ( $hide ? ' hide' : '' )
	;


	$ret .= _t( "$type | #h_$id | !_hdiv.oc('$id'$o)" , ''
		. _div( "#oc_btn_$id | .oc_btn ", $hide ? '+' : '-' )
		. $h1str . $h1add
	)
	. _div( "#oc_div_$id | .oc_div$cls" . _atr_data( 'js', $js ), $div_cont )
	;

	//- 自動出力/return
	if ( ! $return )
		$_contents .= $ret;
	return $ret;
}

//.. _simple_tabs
/*
引数は任意個、あるいは一つの配列
	(文字列)'説明' , タブの一番左に書く説明
	(#で始まる文字列)'#hoge' , 独自ID
	[
		'id' => 'id', なくてもいい
		'active' => true
		'tab' => tab
		'div' => contents
		'js' => スクリプト
	]
*/
function _simple_tabs() {
	$ar = func_get_args();
	if ( count( $ar ) == 1 )
		$ar = $ar[0];

	$gid = ''; //- 全体のID
	$tabstr = ''; //- タブの前に書く文字

	//- まずIDとかを拾っておく
	$flg = false;
	$first = -1;
	foreach ( $ar as $num => $a ) {
		if ( is_string( $a ) ) {
			if ( substr( $a, 0, 1 ) == '#' ) {
				//- ID取得
				$gid = substr( $a, 1 );
			} else {
				//- タブの前に書くこと
				$tabstr .= _l( $a );
			}
		} else {
			if ( $a[ 'active' ] ) $flg = true;
			if ( $first == -1 ) $first = $num; //- 最初のタブ
		}
	}
	//- どのタブもアクティブラグがなければ、最初のタブをアクティブに
	if ( ! $flg )
		$ar[ $first ][ 'active' ] = true;

	//- タブ前文字
	if ( $tabstr != '' )
		$tabstr = _span( '.tabstr', "$tabstr: " );

	//- ID決定
	if ( $gid == '' )
		$gid = _cssid();

	$tabs = '';
	$divs = '';
	foreach ( $ar as $a ) {
		if ( is_string( $a ) ) continue;
		$id = $active = $tab = $div = $js = '';
		extract( $a ); //- $id, $active, $tab, $div, $js
		if ( $id == '' )
			$id = _cssid();
		$d = $active ? '| disabled' : '';

		//- js: 開いた時に実行するスクリプト
		if ( $js != '' )
			$js = ",'" . strtr( htmlspecialchars( $js ), [ "'" => "\\'" ] ) . "'";

		$tabs .= _btn(
			"#tabbtn_{$gid}_{$id} |type:button | .tabbtn tabbtn_$gid $d| !_tab.s('$gid','$id'$js)"
			. '| autocomplete="off"'
			,
			_l( $tab )
		);

		$cls = $active ? '' : 'hide';
		$divs .= _div( "#tabdiv_{$gid}_{$id} | .tabdiv tabdiv_{$gid} $cls", $div );
	}
	return _div( '', ''
//		. _t( 'p|.tabp_pre hide', $tabstr )
		. _p( '.tabp', $tabstr . _span('.wrap hide', BR) . $tabs )
		. $divs
	);
}

//.. _simple_table
function _simple_table( $ar ) {
	if ( ! is_array( $ar ) ) return $ar;
	$s = '';
	foreach ( $ar as $key => $val ) {
		if ( $key == '' || $val == '' ) continue;
		$s .= TR.TH. _icon_title( $key ) .TD. $val;
	}
	return $s == '' ? '' : _t( 'table | .maintable', $s );
}

//.. _chkbox チェックボックス
function _chkbox( $label, $opt, $flg = false ) {
	$id = preg_match( '/#([a-zA-Z0-9_]+)/', $opt, $m );
	$id = $m[1];
	if ( $id == '' ) {
		$id = _cssid();
		$opt = "#$id|$opt";
	}
	return _span( '.nw', 
		_e( "input| type:checkbox| $opt" . ( $flg ? '|checked:checked' : '' ) )
		. _t( "label| for:$id", _l( $label ) )
	);
}

//.. _more
function _more( $cont, $opt = [] ) {
	//- defo
	$btn  = _ej( 'Details', '詳細'  );
	$btn2 = _ej( 'Hide details', '詳細を隠す' );
	$type = 'div';

	extract( $opt ); //- $id $btn $btn2 $type
	if ( $id ==  '' )
		$id = _cssid();
	return ''
		. _btn( "!_more('$id') | #moreb_$id", $btn )
		. _btn( "!_more('$id',1) | #lessb_$id | .hide", $btn2 )
		. _t( "$type | #more_$id | .hide", $cont );
	;
}

//.. _long
// 'abcd', 'efgh'
// 'abcd', 4
function _long( $val, $len = '' ) {
	if ( is_array( $val ) ) {
		$len = $len ?: 3;
		//- 配列で受け取る
		$long = _imp( $val );
		if ( count( $val ) < $len + 2 )
			return  $long;
		$short = _imp( array_slice( $val, 0, $len ) );
	} else {
		//- 何番目の文字以降を隠すか指定
		$len = $len ?: 100 ;
		$val_notag = strip_tags( $val );
		if ( strlen( $val_notag ) < $len * 1.1 )
			return $val;
		$long = $val;
		$short = preg_replace( '/[^\. ;:_]+$/', '', substr( $val_notag, 0, $len ) );
	}
	$id = _cssid();
	return ''
		. _span( "#short_$id", $short .' ...'.
			_btn( "!_long('$id')", _fa('angle-double-right') )
		)
		. _span( "#long_$id| .hide", $long
			._btn( "!_long('$id',1)", ' '. _fa('angle-double-left') )
		)
	;
}

//.. _li_many(
function _li_many( $items, $num = 4 ) {
	$items = array_values( array_filter( (array)$items ) );
	if ( !$items ) return;
	$cnt = count( $items );
	if ( $cnt < $num + 2 )
		return _t( 'ul', LI. implode( LI, $items ) );
	//- main
	$id = _cssid();
	$n = $cnt - $num;
	$li = _e( 'li| .more hide' );
	return _t( "ul| #ulm_$id", ''
		.LI . implode( LI , array_slice( $items, 0, $num ) )
		.$li. implode( $li, array_slice( $items, $num ) )
	)
	. _btn( "!_limany('$id',1)| #more_$id",
		_ej( "Show more $n items", "残り{$n}個を表示" ). ' '. _fa( 'angle-double-right' )
	)
	. _btn( "!_limany('$id')| #less_$id| .hide" ,
		_fa( 'angle-double-left' ). ' '. _ej( "Show less", "表示を減らす" )
	);
}


//.. _pop
//- 内容は data-pop内に入る
function _pop( $btn_str, $div_cont, $opt = [] ) {
	//- optで受け取る値のデフォルト
	$type = 'span' ;
	$trgopt = '.poptrg' ;
	$url = $js = $pre = '';
	extract( $opt );

	$o = '!_pop.up(this)'
		. _atr_data( 'pop', $div_cont ?: LOADING )
		. _atr_data( 'pre', $pre )
		. _atr_data( 'url', $url )
		. _atr_data( 'js' , $js )
		. " | $trgopt"
	;
	return $type == 'img'
		? _img( $o, $btn_str )
		: _t( "$type | $o", $btn_str )
	;
}

//.. _pop_ajax
function _pop_ajax( $str, $ar ) {
	if ( !$ar['@'] )
		$ar['@'] = 'ajax';
	if ( !$ar['ajax'] )
		$ar['ajax'] = 1;
	$pre = $ar['pre'];
	unset( $ar['pre'] );
	return _pop( $str, '', [ 'url' => _emnlink( $ar ), 'pre' => $pre ] );
}

//.. _table_2col: 2カラムのテーブル
function _table_2col( $cont, $o = [] ) {
	$topth = $opt = '';
	extract( $o );
	$ret = '';
	foreach ( $cont as $th => $td ) {
		if ( $td == '' ) continue;
		$th = function_exists( '_trep' ) ? _trep( $th ) : _l( $th );
		if ( is_array( $td ) )
			$td = _imp2( $td );
		$ret .=  $topth
			 ? TR_TOP	. TH . $th . TH . $td
			 : TR 		. TH . $th . TD . $td
		;
		$topth = false;
	}
	return _t( "table|$opt", $ret ) ;
}
/*
//.. _table_3col: 3カラム以上のテーブル
function _table_3col( $cont, $o = [] ) {
	$topth = $opt = '';
	extract( $o );
	$ret = '';
	foreach ( $cont as $th => $ar ) {
		$td = [];
		foreach ( $ar as $a )
			$td[] = is_array( $a ) ? _imp2( $a ) : $a;
		$th = _l( $th );
		$ret .=  $topth
			 ? TR_TOP . TH . $th . TH . implode( TH, $td )
			 : TR	  . TH . $th . TD . implode( TD, $td )
		;
		$topth = false;
	}
	return _t( "table|$opt", $ret ) ;
}
*/
//.. _idinput
function _idinput( $id, $opt = [] ) {
	$btnlabel = _ej( 'Submit', '送信' );
	$size = 40;
	$name = 'id';
	extract( $opt ); //- $btnlabel, $size, $action, $posttext, $acomp

	return 	_t(
		"form | #id_form | method:get" . _attr( 'action', $action )
		, ''
		. _e( "input| type:search | name:$name | #idbox"
			. _attr( 'size', $size )

			//- ID初期値
			. _attr( 'value', strip_tags( $id ) )

			//- 自動補完
			. ( $acomp == '' ? '' : '|.acomp|list:acomp_' . $acomp )
		)
		. ( ! defined( 'IMG_MODE' ) ? '' :
			_e( "input| type:hidden | name:img_mode| value:" . IMG_MODE )
		)
		. _e( "input| type:submit | .submitbtn | value:". ( $btnlabel ?: 'Submit' ) )
	)
	. $posttext
	. _div( '#ent_info', '' )
	;
}

//.. _inputbox
function _inpbox( $name, $val, $o = [] ) {
	$cls = 'inpbox';
	extract( $o ); //- $acomp, $cls, $idbox;
	$acomp = $acomp == '' ? '' : "acomp | list:acomp_$acomp";
	return _e(
		"input| name:$name| type:search| .$cls $acomp|"
		. ( $idbox ? '|#idbox' : '' )
		. _attr( 'value', $val ) );
}

//.. _testinfo
$_testinfo = '';
function _testinfo( $info, $info2 = 'test' ) {
	global $_testinfo;
	if ( ! TEST ) return;

	$_testinfo .= _simple_hdiv(
		$info2 ?: 'testinfo' ,
		_print_r( $info ) ,
		[ 'type' => 'h2' ]
	);
}

//.. _print_r
function _print_r( $data ) {
	return _t( 'pre | .simple_border', print_r( $data, true ) );
}
//.. _time
function _time( $name = 'time' ) {
	global $time_prev, $_comptime;
	if ( !TEST || !SPEED_TEST ) return;
	while ( $_comptime[ $name ]  != '' )
		$name .= '+';
	$now = microtime( TRUE );
	$t = number_format( ( $now - $time_prev ) * 1000 );
	$time_prev = $now;
	$_comptime[ $name ] = $t;
}
//.. _atr_data
//- オブジェクト、配列はここでJSONにする
function _atr_data( $k, $v ) {
	return $v == ''
		? ''
		: "|data-$k=\"" . htmlspecialchars(
			is_string( $v ) ? $v : json_encode( $v )
	) . '"';
}

//.. _atr_js
function _atr_js( $v ) {
	return $v == ''
		? ''
		: "|!" . htmlspecialchars( $v ) . '"'
	;
}
//.. _attr
function _attr( $k, $v ) {
	return $v == '' ? '' : "|$k=\"" . htmlspecialchars( $v ) . '"';
}

//.. _local_link サイト内リンク
function _local_link( $ar ) {
	if ( array_keys( $ar ) == [0, 1] ) //- _url関数の短縮
		return _url( $ar[0], $ar[1] );
	$php = $ar[0] ? $ar[0] . '.php' : '';
	$sharp = $ar['#'] ? '#' . $ar['#']: '';
	unset( $ar[0], $ar['#'] );
	return ( $_SERVER['PHP_SELF'] == $php ? '' : $php )
		.'?'. http_build_query( array_filter( $ar ) ) . $sharp;
}

//. function - doc
//.. _doc_hdiv
//- hdivで返す
function _doc_hdiv( $docid, $opt = [] ) {
	$lang = $nourl = $type = $hide = null;
	extract( $opt );
	$doc = DOC_JSON[ $docid ];
	$lang = $lang ?: _ej( 'e', 'j' );

	//- 関連情報
	$related = '';
	if ( count( $doc[ 'rel' ] ) > 0 ) {
		$a = [];
		foreach ( $doc[ 'rel' ] as $d )
			$a[] = _doc_pop( $d );
		$related = _p( '.small', DOC_RELATED . _imp2( $a ) );
	}

	//- 画像
	$img = ( $doc[ 'img' ] == '' || $nourl )
		? '' 
		: _img( '.docimg', $doc[ 'img' ] )
	;
	if ( $img != '' && $doc[ 'url' ] != '' )
		$img = _ab( $doc[ 'url' ], $img );

	$o = [
		'retrun' 	=> true,
		'type'		=> $type ?: 'h2' ,
		'hide'		=> $hide
	];
	
	//- url: そのページのAboutの場合は、URLは書かない
	$url = $nourl ? '' : $doc[ 'url' ];
	if ( $url ) {
		$url = _p( 'URL: ' . _ab( $url, _fullurl( $url ) ) );
	}

	//- 文章
	if ( $doc[ $lang ] == '' ) {
		return _simple_hdiv(
			_ej( 'Document not found', '文書が見つかりません' ) ,
			"ID: $docid - $lang" ,
			$o
		);
	} else {
		$t = $s = $c = $l = '';
		extract( $doc[ $lang ] );
		return _simple_hdiv(
			//- タイトル
			$t
			//- 中身
			, ''
			//- 概要
			. ( $s == '' ? '' : _t( 'p|.bld', $s ) )
			//- 画像
			. $img
			//- URL
			. $url
			//- コンテンツ
			. $c
			//- 関連情報
			. $related
			//- 外部リンク
			. ( $l == '' ? '' : _p( '.small', DOC_LINK . $l ) )
			,
			$o
		);
	}
}

//.. _doc_pop
//- ポップアップで返す
//- $opt[ btnstr: ボタンに書く名称、noiconアイコン無し 
function _doc_pop( $docid, $opt = [] ) {
	extract( $opt ) ; //- $label, $noicon
	return _pop_ajax(
		$label != ''
			? $label
			: ( $noicon ? '' : IC_HELP ) . DOC_JSON[ $docid ][ L_EN ? 'e' : 'j' ][ 't' ]
		,
		[ 'mode' => 'doc', 'id' => $docid ]
	);
}

//.. _doc_div ポップアップ用のコンテンツ
function _doc_div( $docid ) {
	$doc = DOC_JSON[ $docid ];
	$url = $doc[ 'url' ];
	//- 文章
	if ( ! $doc[ 'e' ] ) {
		return TEST ? "Doc '$docid' not found" : '' ;
	} else {
		$t = $s = $c = $l = ''; //- title, subtitle(?), $contents, $l?
		extract( $doc[ L_EN ? 'e' : 'j' ] );
		return implode( array_filter([
			//- タイトル
			'<b>' . ( $url ? _ab( $url, $t ) : $t ) . '</b>' ,

			//- 概要かコンテンツ
			$s ?: $c ?: 'no document' , 

			//- 画像
			$doc[ 'img' ]
				? ( $url
					? _ab( $url, _img( '.docimg', $doc[ 'img' ] ) )
					: _img( '.docimg', $doc[ 'img' ] )
				)
				: ''
			,
			//- 詳細へのリンク
			_ab([ '@' => 'doc', 'id' => $docid ],
				IC_HELP . _ej( 'Read more', '詳細を読む' )
			)
		]), BR );
	}
}

//. function - misc
//.. _keywords: キーワード
//- キーワードリストを受け取り(配列、文字列)、検索リンクとして返す
function _keywords( $kw ) {
	if ( is_string( $kw ) )
		$kw = explode( ',', strtr( $kw, [ ';' => ',' ] ) );
	$ret = [];
	foreach( array_filter( (array)$kw ) as $t ) {
		$t = trim( $t, ", \n\r\t" );
		$ret[] = _pop_ajax(
			IC_KEY. ( _obj('wikipe')->term($t)->icon() )
			. $t . _ifnn( _obj('wikipe')->e2j(), ' (\1)' ) ,
			[ 'mode' => 'kw', 'kw' => $t ]
		);
	}
	return _imp2( array_unique( $ret ) );
}

//.. _wildcard ワイルドカード sqlite検索用
//- [ ] は、の前後は空白に一致するように（完全一致風の検索）
function _wildcard( $s, $match = false ) {
	$s = $match ? " $s " : $s;
	return "'%"
		. preg_replace( [ '/^\[/', '/\]$/' ], [ ' ', ' ' ], $s )
		. "%'"
	;
}

//. function - 文字列

//.. _sharp 数値なら # を添える
function _sharp( $s ) {
	return ctype_digit( $s ) ? "#$s" : $s;
}

//.. _datestr
function _datestr( $in, $lang = '') {
	if ( $in == '' ) return;
	$s = strtotime( $in ) ;
	if ( $s == 0 )
		return $in; //. (TEST ? _span( '.red',' #non-date str#') : '');
	if ( $lang == '' )
		$lang = _ej( 'e', 'j' );
	return $lang == 'e' ? date( 'M j, Y', $s ) : date( 'Y年n月j日', $s );
}


//.. _eqstr:
//- 同じ文字列 case鈍感、trimあり
function _eqstr( $s1, $s2 ) {
	return (
		strtolower( trim( $s1 ) )
		==
		strtolower( trim( $s2 ) )
	);
}

//.. _breakable: word breakをさしこむ
function _breakable( $str ) {
	if ( strip_tags( $str ) != $str ) return $str; //- もうタグが付いていたらやらない
	return preg_replace( ['/\b/', '/_/'], ['<wbr>', '_<wbr>'], $str );
}

//. function - misc
//.. _fa: font awesome
function _fa( $name, $cls = 'dark large' ) {
	return "<i class=\"fa fa-$name $cls\"></i>";
}

//.. _sizebtn サイズ変更ボタン
//- $optの最初はクラス
//- $size: 'ss', 's', 'm', 'l', 'll'
function _sizebtn( $size, $opt ) {
	return _btn( ".sizebtn $opt", _div( ".sizebox_$size", '' ) );
}

