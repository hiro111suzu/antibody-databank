<?php
/*
共通スクリプト
	+ web
	+ mng
*/

//error_reporting(E_ERROR | E_WARNING | E_PARSE);
//. 設定
if ( ! defined( 'FLG_MNG' ) ) 
	define( 'FLG_MNG', false ); //- webサービスからならfalse

//. ディレクトリ定義
//define( 'DN_EMDB_MED'	, DN_DATA . '/emdb/media' );
//define( 'DN_PDB_MED'	, DN_DATA . '/epdb/media' );


//. _fn関数用データ
$_filenames = [
];

//. abdbデータ専用
//.. _main_tsv()
function _main_tsv() {
	return _tsv_load2( DN_DATA. '/main.tsv' );
}


//. ファイル読み書き系
//.. _json save / load
function _json_save( $fn, $data ) {
	return _gzsave(
		_prepfn( $fn ) ,
		json_encode( $data, JSON_UNESCAPED_SLASHES )
	);
}

function _json_load( $fn, $opt = true ) {
	$fn = _prepfn( $fn ); 
	if ( ! file_exists( $fn ) ) return;
	return json_decode( _gzload( $fn ), $opt );
}

//- オブジェクトで返す
function _json_load2( $fn ) {
	return _json_load( $fn, false );
}

function _to_json( $data ) {
	return json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
}

function _json_pretty( $data ) {
	return json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES 
		| JSON_PRETTY_PRINT);
}

//.. _json_cache: 使ったらキャッシュしておくjson load
$json_cache = [];
function _json_cache( $fn ) {
	global $json_cache;
	$fn = realpath( $fn );
	if ( $json_cache[ $fn ] == '' )
		$json_cache[ $fn ] = _json_load2( $fn );
	return $json_cache[ $fn ];
}

//.. _data save /load: serializeデータの読み書き
function _data_save( $fn, $data ) {
	return _gzsave( $fn, serialize( $data ) );
}

function _data_load( $fn ) {
	if ( file_exists( $fn ) )
		return unserialize( _gzload( $fn ) );
}

//.. _tsv_load2; 2階層になるバージョン
function _tsv_load2( $fn ) {
	if ( ! file_exists( $fn ) ) {
		_problem( "ファイルがない: $fn" );
		return;
	}
	$ret = [];
	$current_categ = 'undefined';
	foreach ( _file( $fn ) as $l ) {
		if ( substr( $l, 0, 2 ) ==  '//' ) continue;
		$l = preg_replace( '/[ \t]\/\/.*$/', '', $l ); //- コメント消し
		list( $key, $val ) = explode( "\t", $l, 3 );
		$key = trim( $key );
		if ( $key == '' || $key == '..' || $key == '...' ) continue;
		$val = trim( $val );
		if ( $key == '.' )
			$current_categ = $val;
		else
			$ret[ $current_categ ][ $key] = $val;
	}
	return $ret;
}

//.. _tsv_save 
function _tsv_save( $fn, $data ) {
	$out = '';
	foreach ( $data as $name => $val )
		$out .= "$name\t$val\n";
	return file_put_contents( $fn, $out );
}

//.. _tsv_save2 階層式
function _tsv_save2( $fn, $data ) {
	$out = '';
	foreach ( $data as $section => $child ) {
		$out .= ".\t$section\n";
		foreach ( $child as $name => $val )
			$out .= "$name\t$val\n";
		$out .= "\n";
	}
	return file_put_contents( $fn, $out );
}

//.. _prepfn: arrayなら_fn、それ以外はそのまま
//- 例 _json_load([ 'emdb_json', '1003' ]) 
function _prepfn( $s ) {
	return is_array( $s ) ? _fn( $s[0], $s[1] ) : $s;
}

//.. _file
//- file()のラッパー: 改行文字・空行を消す、配列に読み込む
//- 配列として返す
function _file( $s ) {
	return file_exists( $s )
		? file( $s, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES )
		: []
	;
}

//.. _is_gz: 拡張子が .gz ?
function _is_gz( $fn ) {
	return substr( $fn, -3 ) == '.gz';
}

//.. _gzload : 拡張子が.gzなら圧縮解除して読み込み
function _gzload( $fn ) {
	return _is_gz( $fn )
		? implode( '', gzfile( $fn ) )
		: file_get_contents( $fn )
	;
}

//.. _gzsave 
function _gzsave( $fn, $cont ) {
	return file_put_contents( $fn, _is_gz( $fn ) ? gzencode( $cont ) : $cont );
}

//.. _del
//- ファイル削除
function _del() {
	$num = 0;
	foreach ( func_get_args() as $fn ) {
		if ( ! file_exists( $fn ) ) continue;
		unlink( $fn );
		++ $num;
	}
	return $num;
}


//. その他
//.. _reg_rep
function _reg_rep( $in, $array ) {
	return preg_replace(
		array_keys( (array)$array ) ,
		array_values( (array)$array ) ,
		$in
	);
}

//.. _add_fn: そのスクリプト内だけで使う _fnを追加
/*
function _add_fn( $a ) {
	global $_filenames;
	$_filenames = $a + $_filenames ;
}
*/

//.. _imp: implodeのラッパー
//- コンマ区切りにして返す
//- 配列で受け取っても、引数の羅列で受け取ってもOK
function _imp() {
	return implode( ', ', _armix( func_get_args() ) );
}

//.. _armix: 配列やら変数やらの集まりを一つの配列へ
function _armix( $in ) {
	$ret = [];
	foreach ( array_filter( (array)$in ) as $a ) {
		if ( is_array( $a ) || is_object( $a ) ) {
			$ret = array_merge( $ret, _armix( $a ) );
		} else {
			$ret[] = $a;
		}
	}
	return array_filter( $ret );
}

//.. _uniqfilt: array_unique + array_filter
function _uniqfilt( $in ) {
	return array_unique( array_filter( (array)$in ), SORT_REGULAR );
}

//.. _ifnn: $s1がnullでなかったら、$s2を返す
function _ifnn( $s1, $s2, $s3 = '' ) {
	return $s1 != '' ? strtr( $s2, [ '\1' => $s1 ] ) : $s3 ;
}

//.. _numonly 数字だけ取り出す
function _numonly( $s ) {
	return preg_replace( '/[^0-9]/', '', $s );
}

//.. _same_str: 大文字小文字関係なし比較
function _same_str( $s1, $s2 ) {
	return strtolower( $s1 ) == strtolower( $s2 );
}

//.. _quote
function _quote( $s, $q = "'" ) {
	if ( $q == 2 )
		$q = '"';
	return $q. strtr( $s, [ $q => $q.$q ] ). $q ;
}

//. class sqlite
class cls_sqlite {
	protected $pdo, $wh, $sql, $fn_db, $log, $flg_mng, $flg_persistent;
	function __construct( $s = 'main', $flg = false ) { //- $flg: manageモードか？
		$this->set( $s );
		$this->flg_mng = $flg;
		if ( FLG_MNG )
			_m( 'SQLite database file: ' . $this->fn_db );
		return $this;
	}

	//.. set
	function set( $db_name = 'main', $flg_persistent = false ) {
		//- sqliteファイルをローカルにコピー
		//- $flg_persistent: ATTR_PERSISTENT フラグ
		$this->flg_persistent = $flg_persistent;

		//... フルパス指定
		if ( _instr( '/', $db_name ) ) {
			$this->log( basename( $db_name, '.sqlite' ), 'direct', $fn );
			return $this->set_PDO( $db_name );
		}
		
		//... doc: docだけはemnavi/docにある
		if ( $db_name == 'doc' ) {
			$fn = ( FLG_MNG ? DN_EMNAVI. '/' : '' ) . 'doc/doc.sqlite';
			$this->log( 'doc', '-', $fn );
			return $this->set_PDO( $fn );
		}
		
		$fn = DN_DATA. "/$db_name.sqlite";

		//... テストサーバー: そのまま使う
		if ( TESTSV || FLG_MNG ) {
			$this->log( $db_name, 'local', $fn );
			return $this->set_PDO( $fn );
		}

		//... 本番サーバー: DBファイルをコピーする
		$dn = '/dev/shm/emnavi';
		if ( ! is_dir( $dn ) )
			mkdir( $dn );
		$dest = "$dn/$db_name.sqlite";
//		$flg_persistent = false;
		if ( ! file_exists( $dest ) ) {
			copy( $fn, $dest );
			touch( $dest, filemtime( $fn ) );
			$this->log( $fn, 'new, copied', "$fn -> $dest" );
		} else if ( filemtime( $fn ) != filemtime( $dest ) ) {
			copy( $fn, $dest );
			touch( $dest, filemtime( $fn ) );
			$this->log( $fn, 'changed, copied', "$fn -> $dest" );
		} else {
			$this->log( $fn, 'same', $fn );
		}
		return $this->set_PDO( $dest );
	}

	//.. set_PDO
	function set_PDO( $fn_db ) {
		if ( ! file_exists( $fn_db ) ) {
			die( TESTSV || FLG_MNG
				? "no db file: $fn_db"
				: 'Database error'
			);
		}
		$this->pdo = new PDO(
			'sqlite:' . realpath( $fn_db ),
			'', '',
			[ PDO::ATTR_PERSISTENT => $this->flg_persistent ] 
		);
		$this->fn_db = $fn_db;
		return $this;
	}

	//.. getsql()
	function getsql() {
		return $this->sql;
	}

	//.. setsql
	function setsql( $q ) {
		if ( is_array( $q ) ) {
			$q = array_change_key_case( $q );
			//- デフォルト値設定、select, from, の順番になるようにする
			$q = array_merge([
				'select'	=> $q[ 'select' ] ?: 'count(*)' ,
				'from'		=> $q[ 'from' ]   ?: 'main' ,
				'where'		=> $this->wh
			], $q );

			$qa = [];
			foreach ( $q as $k => $v ) {
				if ( $v == '' || $v == [] ) continue;
				$qa[] = strtoupper( $k );
				if ( is_array( $v ) )
					$v = implode( $k == 'where' ? ' and ' : ',', $v );
				$qa[] = $v;
			}
			$q = implode( ' ', $qa );
		}
		$this->sql = $q;
		return $this;
	}

	//.. where
	function where( $wh ) {
		$this->wh = is_array( $wh ) ? implode( ' and ', $wh ) : $wh;
		return $this;
	}

	//.. cnt
	function cnt( $wh = '' ) {
		if ( $wh != '' )
			$this->where( $wh );
		return $this->q([ 'where' => $this->wh ])->fetchColumn();
	}

	//.. q クエリ実行メイン
	function q( $ar ) {
		$this->setsql( $ar );

		//... mngシステム版
		if ( FLG_MNG ) {
			$res = $this->pdo->query( $this->sql );
			$er = $this->pdo->errorInfo();
			if ( $er[0] == '00000' ) {
				return $res;
			} else {
				//- エラー
				_kvtable([
					'DB file' => $this->fn_db ,
					'query'   => $this->sql ,
					'error message' => print_r( $er, 1 )
				], 'DB error');
			}
		} else {

		//... WEB版
			//- エラーが出なくなるまで繰り返す
			foreach ( range( 1, 20 ) as $cnt ) {
				$res = $this->pdo->query( $this->sql );
				$er = $this->pdo->errorInfo();
				if ( $er[0] == '00000' ) return $res;
				usleep( 500000 ); //- 0.5秒
			}

			die( TEST 
				? _p( "DB error\n" ) . _t( 'pre', ''
					. "\nDB file: {$this->fn_db}"
					. "\nquery: {$this->sql}"
					. "\nerror message\n"
					. print_r( $er, 1 )
				)
				: 'Database process is busy. Please, retry later.'
			);
		}
	}
	
	//.. qcol, qar, qobj
	function qcol( $ar ) {
		return $this->q( $ar )->fetchAll( PDO::FETCH_COLUMN, 0 );
	}
	function qar( $ar ) {
		return $this->q( $ar )->fetchAll( PDO::FETCH_ASSOC );
	}
	function qobj( $ar ) {
		return $this->q( $ar )->fetchAll( PDO::FETCH_OBJ );
	}

	//.. log
	function log( $a, $b, $c ) {
		global $_sqlite_log;
		if ( ! TEST ) return;
		$_sqlite_log[] = [ $a, $b, $c ];
	}
}
