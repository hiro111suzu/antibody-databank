<?php 
require_once( __DIR__. '/common-web.php' );
//exec( 'parse.php' );
$a = '';

//. init

//maltose-binding proteinを特異的に認識。

//.. misc
$data = _json_load( 'data/main.json' );
define( 'RANGE', 10 );
define( 'COUNT_ALL', count( $data ) );
define( 'FA_EXTLNK', _fa( 'external-link' ) );
define( 'G_PAGE', _getpost_safe( 'page' ) ?: 0 );

_add_url([
	'doi'	=> 'https://dx.doi.org/[id]' ,
	'pubmed'	=> 'https://www.ncbi.nlm.nih.gov/pubmed/[id]'
]);

define( 'TH_ICON', [
/*
	'antigen'	=> 'eyedropper' ,
	'antigen2'	=> 'eyedropper' ,
	'antibody'	=> 'flag' ,
	'antibody2'	=> 'flag' ,
	'description'		=> 'info' ,
	'supplier'	=> 'shopping-cart',
	'application' => 'flask',
	'reference' => 'book', 
	'contact'	=> 'envelope' ,
*/
]);

//.. get

define( 'GET_AJAX', _getpost( 'ajax' ) );
define( 'CSSID_PREFIX', GET_AJAX );

$a = _getpost( 'category' );
define( 'GET_CATEG'	, $a == 'all' ? '' : $a );

$a = _getpost_safe( 'animal' );
define( 'GET_ANIM'	, $a == 'all' ? '' : $a );

$a = _getpost_safe( 'application' );
define( 'GET_APPL'	, $a == 'all' ? '' : $a );

define( 'GET_KW'	, _getpost_safe( 'kw' ) );
define( 'GET_PAGE'	, (integer)_getpost( 'pagen' )  );

$a = $_GET;
unset( $a['lang'] );
define( 'NO_DATA'	, $a == [] );

$list_anim = [];
$list_categ = [];

//.. _fn
$_filenames += [
	//- pubmed/uniprot
	'pubmed_json' => 'data/pubmed/<id>.json' ,
	'unp_json' => 'data/uniprot/<id>.json' ,
];

//.. peptag
define( 'PEP_TAG', _tsv_load2( 'data/peptide_tag.tsv' ) );

//.. pdb
define( 'AB_PDB_ID', _tsv_load2( 'data/ab_pdb_id.tsv' ) );

//.. j2e


//.. filter

foreach ( $data as $num => $item ) {
//	_die( $data );
	extract( $item );
	++ $list_categ[ $item['category'] ];
	if ( $item['animal'] )
		++ $list_anim[ $item['animal'] ];

	if ( GET_CATEG != '' && $item['category'] != GET_CATEG ) {
		unset( $data[ $num ] );
		continue;
	}
	if ( GET_ANIM != '' && $item['animal'] != GET_ANIM ) {
		unset( $data[ $num ] );
		continue;
	}
	if ( GET_APPL != '' && ! _instr( GET_APPL, _imp( $item['application'] ) ) ) {
		unset( $data[ $num ] );
		continue;
	}

	if ( GET_KW != '' &&
		! _instr( GET_KW, json_encode( array_values( $item ) ) )
	) {
		unset( $data[ $num] );
	}
//	_die( json_encode( array_keys( $item ) ) );
}

//. ajax output
if ( GET_AJAX ) {
	die( GET_AJAX == 'f'
		? _form()
		: _data_output( $data ) 
	);
}

//. css
$css = <<<EOD

.ent_table { width: 100% }
.ent_table th { width: 15%; }
.subtable { width: 100% }
.subtable th { width: 25%; }
.subtable th, .subtable td, .subtable tr, .subtable {
	border: none; background: none;
}

EOD;

//. form
_simple_hdiv( _fa('search'). _ej( 'Search', '検索' ) ,
	_t( 'form| #form1', _form() )
);

//.. function
function _form() {
	global $list_anim, $list_categ;
	$get = array_filter( $_GET );
	unset( $get['lang'] );
	$term_all = _ej( 'all', 'すべて' ). _span( '.small', ' ('. COUNT_ALL. ')' );;

	//... categ
	$items_categ = [ 'all' => $term_all ];
	foreach ( $list_categ as $s => $n ) {
		$items_categ[ $s ] = _l( $s ). _span( '.small', " ($n)" );
	}

	//... animal
	$items_anim = [ 'all' => $term_all ];
	foreach ( $list_anim as $s => $n ) {
		$items_anim[ $s ] = _l( $s ). _span( '.small', " ($n)" );
	}

	//... appl
	$items_appl = [ 'all' => $term_all ];
	foreach ([
		'IP',
		'IHC',
		'WB' ,
		'FACS' ,
		'ICC' ,
		'protein purification'
	] as $s ) {
		$items_appl[ $s ] = _l( $s );
	}

	//... return
	return _t( 'table| .ent_table', ''
		.TR.TH. _ej( 'Keywords', 'キーワード' )
		.TD. _inpbox( 'kw', html_entity_decode( GET_KW ) )

		.TR.TH. _l( 'category' ) .TD. _radiobtns([
			'name' => 'category' ,
			'on'   => GET_CATEG ?: 'all'
		], $items_categ )
		.TR.TH. _l( 'application' ) .TD. _radiobtns([
			'name' => 'application' ,
			'on'   => GET_APPL ?: 'all' 
		], $items_appl )
		.TR.TH. _l( 'animal' ) .TD. _radiobtns([
			'name' => 'animal' ,
			'on'   => GET_ANIM ?: 'all'
		], $items_anim )
	)
	. _e( 'input| type:hidden| #pagen| name:pagen| value:'. G_PAGE )
	. _e( 'input| type:submit| st: width:30%| .submitbtn' )
	;
}

//. data

//.. output
_simple_hdiv( _fa('database'). _ej( 'Data', 'データ' ) ,
	_div( '#searchres', _data_output( $data ) ) ,
	[ 'hide' => NO_DATA, 'id' => 'data' ] 
);

//. about
//.. DOC_DATA
define( 'DOC_DATA', [
/*
	'news' => _ej([
		_span( '.red', 'This service is under construction.' ) ,
	],[
		_span( '.red', '現在開発中のサービスです') ,
	]) ,
*/
	'about' =>  _ej([
		'<i>Antibody Square</i> distribute information of antibody constructed by AMED-BINDS projects and others, for antibody developers, users, and suppliers, to exchange antibody information.' ,
		'Find antibody you need?', 
		[ 'Acccess the pages of "suppliers" or "Contact" links.' ],
		'Have antibody system to be distributed?' ,
		[ 'Contact us!' ],
		'Can supply a antibody in this page?',
		[ 'Acccess the pages of "Contact" links.' ],

	], [
		'抗体広場は、AMED-BINDSなどのプロジェクトで作成された抗体の情報を収集し、利用者、作成者、提供者の情報交換を促進するたのサービスです' ,

		'利用したい抗体を見つけたら' ,
		[ '連絡先か、販売提供のページへ' ] ,

		'情報公開・可能な抗体をお持ちの方へ' ,
		[ 'ただ今準備中です' ] ,

		'抗体を販売可能な業者へ' ,
		[ '随時ご連絡をお待ちしております', '抗体情報の「連絡先」へお問い合わせください' ] ,
	])
]);

//.. output
_simple_hdiv( _fa( 'info-circle' ). _ej( 'About', 'このページについて' ) , ''
//		_ej( 'Documentation', '文書' ) ,
	. ( DOC_DATA[ 'news' ] ? _simple_hdiv(
		_ej( 'News', 'お知らせ' ) , 
		_doc_data( 'news' ) ,
		[ 'type' => 'h2' ]
	): '' )
	. _simple_hdiv(
		_ej( 'About Antibody Square', '抗体広場について' ) ,
		_doc_data( 'about' ) ,
		[ 'type' => 'h2' ]
	)
	/*
	. _simple_hdiv(
		_ej( 'External links', 'リンク' ), 
		_li_many([ '----', '----', '----' ]) ,
		[ 'type' => 'h2' ]
	)
	*/
	,
	[ 'hide' => !NO_DATA, 'id' => 'about' ]
);


//. end
_simple_out([
	'title' => _ej( 'Antibody Square', '抗体広場' ) ,
	'sub'	=> _ej(
		'Information repository for antibody developers, users, and suppliers' ,
		'抗体作成者・利用者・販売業者の情報交換サイト'
	) ,
	'css' 	=> [ 'ym' , $css ] ,
	'icon'	=> 'icon.png' ,
	'js'	=> 'display'
]);

//. functions

//.. _l
function _l( $in ) {
	return L_EN
		? TERM_E[ $in ] ?: TERM_J2E[ $in ] ?: $in
		: TERM_J[ $in ] ?: TERM_E2J[ $in ] ?: $in
	;
}

//.. _data_output
function _data_output( $data ) {
	global $_GET;
	//... data table
	$use = array_slice( $data, GET_PAGE * RANGE, RANGE );
	$flg_hide = 10 < count( $use );
	$ret = '';
	foreach ( $use as $num => $item ) {
		$ret .= _ent_table( $item, $flg_hide );
	}
	
	//... pager
	$o_pager = new cls_pager([
	//	'str'		=> KW == '' ? '':
	//		_ej( ' for keyword: "' .KW. '"', '検索語「' .KW. '」:  ' ) ,
	//	'str'		=> '検索結果'
		'range' 	=> RANGE ,
		'total'		=> count( $data ) ,
		'page'		=> GET_PAGE ,
		'pvar'		=> $_GET + [ 'ajax' => 1 ] ,
		'div'		=> '#searchres' ,
		'func_name' => '_form.pagenum' ,
	]);
	return $o_pager->msg(). ( 1 < count( $use ) ? BTN_HDIV2_ALL : '' ). $ret. $o_pager->btn();
}

//.. ent_table
function _ent_table( $item, $flg_hide ) {
	$table = '';
	$add = [];

	//... summary
	$summary = _imp([
		_ej( 'anti-', '抗' ). _l( $item['antigen'] ) ,
		'"'. _imp( $item['name'] ). '"' ,
		_l( $item['animal'] ) .' '. _imp( $item['type'] )
	]);

	$add[ 'antigen2' ] = $item['antigen'];
	//... uniprot
	$j = '';
	$unp_id = $item[ 'unp_id' ][0];
	if ( $unp_id )
		$j = _json_load( _fn( 'unp_json', $unp_id ) );
	if ( $j ) {
		//- name 日本語
		foreach ( $j['name'] as $n ) {
			$t = _l( $n );
			if ( $t != $n )
				$j['name'][] = $t;
		}
		$add[ 'antigen2' ] = _subtable([
			'antigen'	=> $item['antigen'] ,
			'pname'		=> _long( $j['name'], 2 ),
			'gn'		=> _long( $j['gn'], 4 ),
			'organism'	=> TERM_REP[ $j['org'] ] ?: $j['org'] ,
			'UniProt'	=> _ab( 'https://uniprot.org/uniprot/'. $unp_id, FA_EXTLNK. 'UniProt:'. $unp_id ) ,
//			'test'		=> _test(
//				_ab( _fn( 'unp_json', $unp_id ), 'unp_json' )
//			)
		]);
	}

	//... tag system
	$ptag = PEP_TAG[ $item['antigen'] ];
	if ( $ptag ) {
		$add[ 'antigen2' ] = _subtable([
			'Type'		=> _ej( 'Peptide tag', 'ペプチドタグ' ) ,
			'Tag name'	=> $item['antigen'] ,
			'Tag type'	=> $ptag['imp'] ? _ej(
				'improved version of '. $ptag['imp'] ,
				$ptag['imp']. 'の改良型'
			) : '',
			'Sequence'	=> $ptag['seq']
				? $ptag['seq']. ' ('. strlen( $ptag['seq'] ). _ej( ' res.', '残基' ). ')' 
				: ''
			,
			'Trademark'	=> $ptag[ _ej( 'tm_e', 'tm_j' ) ] ,
			'Project'	=> $ptag[ _ej( 'by_e', 'by_j' ) ] ,
			'Remark'	=> $ptag[ _ej( 'rem_e', 'rem_j' ) ] ,
		]);
	}
	

	//... antibody
	$add[ 'antibody' ] = _subtable([
		'name'		=> $item[ 'name' ] ,
		'animal'	=> _l( $item[ 'animal' ] ) ,
		'isotype'	=> _imp( $item[ 'isotype' ] ) ,
	]);

	//... PDB
	$o = [];
	foreach ( (array)explode( ',', $item[ 'name' ] ) as $n ) {
		foreach ( (array)AB_PDB_ID[ trim( $n ) ] as $i => $t ) {
			$o[] = _ab( 'https://pdbj.org/mine/summary/'. $i, FA_EXTLNK. $i ). ": $t";
		}
	}
	if ( $o )
		$item[ 'structure' ] = _li_many( $o );

	//... いったんまとめ
	$item = array_merge( $add, $item );
	unset( $item[ 'name' ], $item['animal'], $item['isotype'] );

	//... application
	if ( $item['application'] ) {
		$app = array_filter( $item['application'] );
		$a = [];
		foreach ( preg_split( '/[,、]/', $item['application'][0] ) as $s ) 
			$a[] = _l( trim( $s ) );
		if ( $a )
			$app[0] = _imp( $a );
		foreach ( $app as $i => $c ) {
			$c = _l( $c );
			if ( 2 < strlen( $c ) )
				$app[$i] = $c;
			else 
				unset( $app[$i] );
		}
		$item['application'] = 1 < count( $app )
			? _t( 'ul', LI. implode( LI, $app ) )
			: $app[0]
		;
	}
	//... pubmed
	if ( $item['pmid'] ) {
		$ref = [];
		foreach ( $item['pmid'] as $pmid ) {
			$j = _json_load( _fn( 'pubmed_json', $pmid ) );
			if ( !$j ) continue;
			$ref[] = implode( BR, [
				_ab(
					$j['id']['doi']
						? _url( 'doi', $j['id']['doi'] )
						: _url( 'pubmed', $pmid )
					,
					FA_EXTLNK. _imp([
						'<i>'. $j['journal']. '</i>' ,
						$j['year'] ,
						$j['vol']. ( $j['isu'] ? '('. $j['isu']. ')': '' ) ,
						$j['page']
					])
				) ,
				'<b>'. $j['title']. '</b>' ,
				_long( $j['auth'], 4 ) ,
			]);
		}
		$ref = 1 < count( $ref )
			? _li_many( $ref, 2 )
			: $ref[0]
		;
		$item['reference'][] = BR. $ref;
	}

	//... all
	foreach ( $item as $key => $val ) {
		if ( in_array( $key, [
			'kw', 'pmid', 'unp_id', 'name', 'animal', 'isotype', 'category', 'antigen'
		])) continue;
		if ( is_array( $val ) ) {
			//- array
			$va = [];
			foreach( $val as $a ) {
				$va[] .= is_array( $a )
					? ( $a[1] ? _ab( $a[1], FA_EXTLNK. _l( $a[0] ) ) : _l( $a[0] ) )
					: _l( $a )
				;
			}
			$val = _imp( $va );
		} else {
			//- string
			$val = _l( $val );
		}
		//- rep
		$val = TERM_REP[ $val ] ?: $val ;

		//- link
		if ( _instr( '|', $val ) ) {
			list( $t, $u ) = explode( '|', $val );
			$val = _ab( $u, FA_EXTLNK. $t );
		}

		$table .= TR.TH
			. ( TH_ICON[ $key ] ? _fa( TH_ICON[ $key ] ) : '' )
			. ( L_EN ? TERM_E[ $key ] : TERM_J[ $key ] )
			. TD. $val
		;
		
	}

	//... end
	return _simple_hdiv( $summary, _t( 'table| .ent_table', $table ), [
		'type' => 'h2',
		'hide' => $flg_hide 
	]);
}

//.. docment
function _doc_data( $type ) {
	$ret = '';
	foreach ( (array)DOC_DATA[ $type ] as $a ) {
		$ret .= is_array( $a )
			? _t( 'ul', LI. implode( LI, $a ) )
			: LI. $a
		;
	}
	return _t( 'ul', $ret );
}

//.. _subtable
function _subtable( $a ) {
	$ret = [];
	foreach ( $a as $k => $v ) {
		if ( $v == '' ) continue;
		$ret[] = TH. _l( $k ). TD. $v;
	}
	return _t( 'table|.subtable', TR. implode( TR, $ret ) );
}

