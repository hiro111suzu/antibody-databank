<?php 
require_once( __DIR__ . '/common-web.php' );
//. init

$del_terms = [];
foreach ( preg_split( '/[\n\r]+/',  <<<EOD
！

PAtag (GVAMPGAEDDVV；12アミノ酸)は加藤研の登録商標（登録第5671624号）。
PAtagはAMED・PDISの成果。
MAPtag (GDGMVPPGIEDK；12アミノ酸)は加藤研の登録商標（商願2017- 26697）。
RAPtagはDMVNPGLEDRIEの12アミノ酸からなる。AMED革新的バイオの成果。
AMED革新的バイオの成果。
PA16タグは16アミノ酸（GLEGGVAMPGAEDDVV）。
AMED・糖鎖創薬の成果。
EOD

) as $s ) {
	if ( $s == '' ) continue;
	$del_terms[ strtr( '/'. preg_quote( $s ). '/u', [ ' ' => '[  \t\r\n+]+' ] ) ] =
		''
//		_span( '.red', 'hoge' )
	;
}
// file_get_cont
//. main
$num = 0;
$data = [];
$categ = '';

foreach ( explode( '<tr>',
	_reg_rep( file_get_contents( 'table.html' ), $del_terms )
) as $tr ) {
	//.. th (categ)
	$ar = [];
	if ( _instr( '</th>', $tr ) ) {
		$categ = trim( strtr( strip_tags( explode( '</th>', $tr )[0] ), [ '関連' => '' ] ) );
		if ( $categ == 'タグ' )
			$categ = 'tag system' ;
		continue;
	}
	if ( ! _instr( '</td>', $tr ) ) continue;

	//.. tr
	$tr = _reg_rep( $tr, [
		'/<td(| .+?)>/u'			=> '<>' ,
		'/<\/(td|tr|tbody|table)>/u'	=> '' ,
		'/[ \n\r]+/u'				=> ' ' ,
		'/ *<br> */u'				=> '|' ,
	]);
	$a = [];
	foreach  ( explode( '<>', $tr ) as $s ) {
		$a[] = trim( $s, " |\t" );
	}
	$b = explode( '|', $summary = $a[1] );

	//- 名称を分割
	$name = [];
	$iso = [];
	$ani = [];
	foreach ( explode( '、', trim( $b[1], "()（） \t" ) ) as $s ) {
		$s = preg_split( '/[;；]/u', $s, 2 );
		$name[] = trim( $s[0] );
		$s = explode( ' ', trim( $s[1] ), 2 );
		$ani[] = trim( $s[0] );
		$iso[] = trim( $s[1] );
	}
	$ani = _imp( _uniqfilt( $ani ) ); //- 配列にしない 多分複数になることはないので
	$data[ $num ] = [
		'category'		=> $categ ,
		'antigen' 		=> strtr( $b[0], [ '抗体' => '', '抗' => '' ] ) ,
//		'name'			=> strtr( trim( $b[1], "()（） \t" ), [ '；' => '; ', '、' => '/' ] ) ,
		'name'			=> _uniqfilt( $name ) ,
		'animal'		=> $ani ,
		'isotype'  		=> _uniqfilt( $iso ) ,
		'description'	=> $a[2] ,
		'application'	=> $a[3] ,
		'reference' 	=> _get_links( $a[4] ) ,
		'contact'		=> 'kato_tohoku' ,
		'supplier'  	=> _get_links( strtr( $a[5], [ '＊販売をご希望の企業からのご連絡をお待ちしております。' => '' ] ) )
	];
	
	//.. to English
	foreach ( $data[ $num ] as $key => $val ) {
		if ( is_array( $val ) ) {
			$val_new = [];
			foreach ( $val as $v ) {
				$val_new[] = _j2e( $v );
			}
		} else {
			$val_new = _j2e( $val );
		}
		$data[ $num ][ $key ] = $val_new;
	}
	++ $num;
}

_json_save( 'data.json', $data );

/*
//. tsv

//.. main
$out = [];
foreach ( $data as $num => $item ) {
	$o =[];
	$pmid = [];
	foreach ( $item[ 'reference' ] as $r ) {
		$u = _reg_rep( trim( $c[1] ), [ '/^https?:?\/\//' => '//' ] )

//		if ( _instr( 'pubmed/?term', $c[1] ) {
//		}


	}


	$out[] = ".\t". implode( ', ', $item['name'] );
	foreach ( $item as $k => $v ) {
		$vo = $v;
		if ( is_array( $v ) ) {
			$vo = [];
			foreach ( $v as $c ) {
				if ( is_array( $c ) ) {
					
					if ( _instr( 'pubmed/?term', $c[1] ) {
						
					}
				}
				$vo[] = is_array( $c ) ? "[{$c[1]}]({$c[0]})" : $c;
			}
			$v = implode( '|', $vo );
		}
		$out[] = "$k\t$v";
	}
	$out[] = '';
}
$out = implode( "\n", $out );
file_put_contents( 'data/main.tsv', $out );
echo $out;



//foreach ( $data as $d ) {
//	$title = 
//}


//$o_sql = new PDO( "sqlite:abdb.sqlite", '', '' );
//$o_sql->pdo->beginTransaction();
*/
//. functions
//.. get link
function _get_links( $in ) {
	$ret = [];
	foreach ( explode( '|', strtr( $in, [ '<a ' => '|<a ' ]) ) as $s ) {
		$str = _j2e( trim( strip_tags( $s ) ) );
		if ( ! $str ) continue;
		preg_match( '/href="(.+?)"/', $s, $m );
		$url = $m[1];
		if ( substr( $url, 0, 3 ) == '../' )
			$url = strtr( $url, [ '../' => 'http://www.med-tohoku-antibody.com/' ] );
//		if ( _instr( 'pubmed', $url ) )
//			$str .= ' (PubMed)';
		$ret[] = [ $str, $url ];
	}
	return $ret;
}

//.. _j2e
function _j2e( $in ) {
	if ( $in == '' ) return;
	return array_key_exists( (string)$in, TERM_J2E ) ? TERM_J2E[ $in ] : $in;
}


