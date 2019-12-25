<?php
_define_term( <<<EOD
TERM_NO_ITEM
	No item found_1_
	_1_見つかりませんでした
TERM_FOR
	_for _1_
	検索_1_の結果
TERM_ALL_DATA
	(all data)
	全データ
TERM_ALL_FOUND
	Showing all _1_ items_2_
	_2_全_1_件を表示しています
TERM_FROM_TO
	Showing _1_ - _2_ of _3_ items _4_
	_4__3_件中、_1_から_2_件目までを表示しています
TERM_PREV
	Previous
	前へ
TERM_NEXT
	Next
	次へ

EOD
);

class cls_pager {
/*
pager ページャ
検索結果とかの説明とページ番号ボタン
page 現在のページ、totalデータ数、rangeページごとのデータ数、
objname javascriptへ渡すときの名前
str: eg. for keyword:...

test_test
test_test2

*/
//. パラメータ
protected $page, $total, $range, $str, $btns,
	$objname = 'l',
	$url = '?page=' ,
	$div =	'#list' ,
	$func_name = '_pagenum'
;
//. コンストラクタ
function __construct( $s = '' ) {
	if ( $s != '' )
		$this->set( $s );
	return $this;
}

//. to string
function __toString(){
	return $this->msg();
}

//. set
function set( $in ) {
	//- arrayでセット
	foreach ( $in as $k => $v )
		$this->$k = $v;
	
	//- jsvar
	if ( $in[ 'div' ] != '' ) {
		_jsvar([ 'pagenum' => [
			$this->objname => [
				'url'	=> $this->url , 
				'pvar'	=> $this->pvar ,
				'div'	=> $this->div
			]
		]]);
	}
	return $this;
}

//. btn ボタン
function btn() {
	if ( $this->btn != '' )
		return $this->btns;
	
	//- 1ページだけの場合はボタンなし
	if ( $this->total <= $this->range )
		return;
	$lastp = ceil( $this->total / $this->range );

	//- ページボタン表示する間隔
	$btn_itv = 10;
	if ( $lastp >  110 ) $btn_itv = 50;
	if ( $lastp >  500 ) $btn_itv = 100;
	if ( $lastp > 1100 ) $btn_itv = 500;

	//- ボタン
	$on = $this->objname == '' ? ')' : ",'{$this->objname}')";
	$fn = '!' . $this->func_name . '(';
	$out = [];
	foreach ( range( 1, $lastp ) as $i ) {
		//- 現在の前後数ページは強制表示、それ以外なら、先頭、末尾、キリ番ページのみ
		if ( $i < $this->page - 1 || $this->page + 3 < $i )
			if ( $i != 1 && $i != $lastp && $i % $btn_itv != 0 ) continue;
		
		$j = $i - 1;
		$out[] = $i == $this->page + 1
			? _btn( '.' . BTN_ACTIVE, $i )
			: _btn( "$fn$j$on | ", $i )
		;
	}
	$pr = $this->page - 1;
	$nx = $this->page + 1;
	$out[] = _btn(
		$this->page == 0 ? DISABLE : "$fn$pr$on",
		_fa( 'chevron-left' ). TERM_PREV
	);
	$out[] = _btn(
		$this->page == $lastp - 1? DISABLE : "$fn$nx$on",
		_fa( 'chevron-right' ). TERM_NEXT
	);

	return $this->btns = _p( '.topline',
		_ej( 'Pages', 'ページ' ) . ': ' . implode( '', $out ) 
	);
}

//. msg メッセージ文字列
function msg() {
	//- 検索条件などの説明
	$desc = '';
	if ( is_array( $this->str ) ) {
		$a = [];
		foreach ( $this->str as $k => $v ) {
			if ( $v == '' ) continue;
			$a[] = _kakko( _kv([ $k => is_array( $v ) ? implode( ' & ', $v ) : $v ]) );
		}
		if ( count( $a ) == 0 ) {
			$desc = TERM_ALL_DATA;
		} else {
			$a = implode( ' & ', $a );
			$desc = _term_rep( TERM_FOR, $a );
		}
	} else if ( is_string( $this->str ) ) {
		$desc = $this->str;
	}

	$start = $this->page * $this->range + 1;
	$f_total = number_format( $this->total );
	$f_start = number_format( $start );
	$f_end   = number_format( min( $start + $this->range - 1, $this->total ) );

	if ( $this->total == 0 )
		$m = _term_rep( TERM_NO_ITEM, $desc );
	else if ( $this->total <= $this->range )
		$m = _term_rep( TERM_ALL_FOUND, $f_total, $desc );
	else
		$m = _term_rep( TERM_FROM_TO, $f_start, $f_end, $f_total, $desc );
	return _p( $m );
}

//. both
function both() {
	return $this->msg() . $this->btn();
}

}
