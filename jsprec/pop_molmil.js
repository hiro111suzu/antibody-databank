var
//	___str ,
canvas , soup,
$cvs = $('#molmilViewer')
;

//. 開始時に実行
$(function(){
	initViewer();
});

//. ウインドウ、リサイズしたとき、閉じたとき
$(window).resize(
	function(){_resize_canvas();}
);
//.. function
function _resize_canvas() {
	var w = $( window ).width(),
		h = $( window ).height()
	;
	$cvs.get(0).width = w;
	$cvs.get(0).height = h;
	$cvs.width(w).height(h);
	if ( canvas ) {
		canvas.renderer.resizeViewPort();
		canvas.update = true;
	}
}

//. molmil_layer: タッチ、マウスクリックでメニュー消し
$('#molmil_layer').on(
	'touchstart mousedown', 
	function(){ _gmenu.hide(); }
);

//. _gmenu_init: メニュー初期化処理
function _gmenu_init() {
	$('#vwchkbox_blackbg').prop("checked",  _localstr.getbool('blackbg') );
	$('#vwchkbox_stereo' ).prop("checked",  _localstr.getbool('stereo') );
	$('#vwchkbox_fog'    ).prop("checked", !_localstr.getbool('nofog') );
}

//. molmil開始

function initViewer() {
	//wait until Molmil has been properly loaded
	if (! window.molmil.configBox || ! molmil.configBox.initFinished) {
		return setTimeout(initViewer, 100);
	}
	
	//.. 各種初期設定
	_resize_canvas();
	canvas = molmil.createViewer( $cvs.get(0) ); // initialize the canvas
	soup = canvas.molmilViewer

	_mm.init();
	//- molmil UI消し
	$('.molmil_UI_LB_icon').hide();
	$('.molmil_UI_RB_icon').hide();

	//- 初期設定
	molmil.configBox.glsl_fog   = !_localstr.getbool('nofog');
	molmil.configBox.stereoMode = _localstr.getbool('stereo') ? 1: 0;
	molmil.configBox.BGCOLOR    = _localstr.getbool('blackbg') ? [0,0,0,1] : [1,1,1,1];
	molmil.configBox.stereoEyeSepFraction = 10;
//	molmil.stereoFocalFraction = 5;

	//- load
	_load.auto();

	//- プライムの場合は、メニューを表示
	phpvar.shomenu && _gmenu.show();
}

//. obj: _load
var _load = {
	//.. auto
	auto: function() {
		var d = phpvar.ent.db;
		if ( d == 'sasbdb-model' ) d = 'sasbdb';
		this[d]();
	},

	//.. PDB
	pdb: function(){
		phpvar.ent.url
			? molmil.loadFile(
				phpvar.ent.url ,
				'mmcif',
				function( sp, str ){ _load.postjob( sp, str ); },
				true,
				soup
			)
			: molmil.loadPDB(
				phpvar.ent.id, //- ID
				function( sp, str ){ _load.postjob( sp, str ); },
				true, //- async
				soup
			);
		;
	},
	//.. EMDB
	emdb: function(){
		try {
			molmil.loadFile(
				phpvar.ent.url ,
				'obj',
				function( sp, str ){ _load.postjob( sp, str ); },
				true,
				soup
			);
		} catch(e) {
			console.log( 'catch error: ' + e );
		}
		//- コールバックが呼ばれないので、強制的にready
		if ( !_popvw.ready ) this.postjob( soup );
	},
	//.. chem
	chem: function(){
		molmil.loadCC(
			phpvar.ent.id ,
			function( sp, str ){ _load.postjob( sp, str ); },
			true,
			soup
		);
	},
	//.. sasbdb
	sasbdb: function() {
		molmil.loadFile(
			phpvar.ent.url ,
			'mmcif',
			function( sp, str ){ _load.postjob( sp, str ); },
			true,
			soup
		);
	},
	//.. postjob
	postjob: function() {
		//- データベースごとの初期化
		_mm.style_init();

		//- 共通作業
		_mm.rebuild();
		_popvw.set_ready();
	}
}

//. custom obj _mm
var _mm = {
	//.. 設定系
	//... molmil name
	mmname: {},
	ui: null,
	init: function(){
		this.mmname = {
			color: {
				grp: molmil.colorEntry_Group ,
				cpk: molmil.colorEntry_CPK ,
				str: molmil.colorEntry_Structure
			},
			style: {
				hide: molmil.displayMode_None ,
				defo: molmil.displayMode_Default ,
				cartoon  : molmil.displayMode_Cartoon ,
				bs  : molmil.displayMode_BallStick ,
				stk	: molmil.displayMode_Stick ,
				cpk : molmil.displayMode_Spacefill
			}
		};
		this.ui = new molmil.UI(soup);
		return this;
	},

	//... 1文字コード
	one_seq: {} ,
	resname2one: {
		"ALA" :"A",
		"CYS" :"C",
		"ASP" :"D",
		"GLU" :"E",
		"PHE" :"F",
		"GLY" :"G",
		"HIS" :"H",
		"ILE" :"I",
		"LYS" :"K",
		"LEU" :"L",
		"MET" :"M",
		"ASN" :"N",
		"PRO" :"P",
		"GLN" :"Q",
		"ARG" :"R",
		"SER" :"S",
		"THR" :"T",
		"VAL" :"V",
		"TRP" :"W",
		"TYR" :"Y",
		"DA"  :"A",
		"DT"  :"T",
		"DG"  :"G",
		"DC"  :"C",
		"A"   :"A",
		"T"   :"T",
		"U"   :"U",
		"G"   :"G",
		"C"   :"C",
		"PSU" :"U",
		"MSE" :"M",
		"UNK" :"X"
	},

	//... chain color
	ccol: {
		"A":[154,166,204,1],
		"B":[141,204,141,1],
		"C":[204,154,160,1],
		"D":[204,204,102,1],
		"E":[204,154,204,1],
		"F":[141,192,192,1],
		"G":[204,166,90,1],
		"H":[192,102,102,1],
		"I":[196,178,143,1],
		"J":[0,153,204,1],
		"K":[164,74,74,1],
		"L":[82,164,136,1],
		"M":[123,164,40,1],
		"N":[190,104,190,1],
		"O":[0,165,167,1],
		"P":[0,204,102,1],
		"Q":[48,143,90,1],
		"R":[0,0,111,1],
		"S":[151,146,86,1],
		"T":[0,80,0,1],
		"U":[102,0,0,1],
		"V":[102,102,0,1],
		"W":[102,0,102,1],
		"X":[0,102,102,1],
		"Y":[147,107,9,1],
		"Z":[142,27,27,1],
		"0":[0,204,102,1],
		"1":[48,143,90,1],
		"2":[0,0,111,1],
		"3":[151,146,86,1],
		"4":[0,80,0,1],
		"5":[102,0,0,1],
		"6":[102,102,0,1],
		"7":[102,0,102,1],
		"8":[0,102,102,1],
		"9":[147,107,9,1]
	} ,
	
	//.. セレクト系
	selection: null,

	//... select
	select: function( cmd, param ) {
		if ( typeof cmd == 'string' ) {
			this.selection = molmil.quickSelect( cmd, soup );
		} else {
			this.selection = cmd;
		}
		return this;
	} ,

	//... selected
	selected: function( mode ) {
		return this.selection || soup.structures[0];
	},

	//... select_chain チェーンを選択
	select_chain: function( chains ) {
		var atm = [], mol = [];
		if ( typeof chains === 'string' )
			chains = [ chains ];
		soup.structures[0].chains.forEach( function(c){
			if ( chains.indexOf( c.name ) == -1 ) return;
			c.molecules.forEach( function(c2) {
				atm = atm.concat( c2.atoms );
				mol.push( c2 );
			});
		});
		this.selection = { atoms: atm, molecules: mol };
		return this;
	} ,

	//... select_res 残基を選択
	select_res: function( inobj ) {
		var atm = [], mol = [], res_in_chain;
		console.log( inobj );
		soup.structures[0].chains.forEach( function(c){
			if ( ! inobj[c.name] ) return;

			//- 数値化 "123" => 123
			res_in_chain = inobj[c.name].map( function(v){ return parseInt(v); });
			c.molecules.forEach( function(c2) {
				if ( res_in_chain.indexOf( c2.id ) == -1 ) return;
				atm = atm.concat( c2.atoms );
				mol.push(c2);
			});
		});
		this.selection = { atoms: atm, molecules: mol };
		return this;
	} ,

	//... select_seq 配列文字列で検索
	select_seq: function( asid, seq ) {
		var atm = [], mol = [], tg_chain, matchres = {}, m = 0;

		//- ターゲットのチェーンを取り出す
		soup.structures[0].chains.forEach( function(c){
			if ( c.name != asid ) return;
			tg_chain = c.molecules;
		});
		if ( !tg_chain ) {
			_popvw.cmdhist('no chain: '+ asid );
			return this;
		}

		//- 位置文字配列作成
		if ( ! this.one_seq[ asid ] ) {
			this.one_seq[ asid ] = '';
			tg_chain.forEach( function(r){
				this.one_seq[asid] += ( this.resname2one[ r.name ] || 'X' );
			}.bind(this));
		}
//		console.log([ this.one_seq[asid], seq.toUpperCase() ]);

		//- 検索
		while(true) {
			m = this.one_seq[asid].indexOf( seq.toUpperCase(), m );
			if ( m == -1 ) break;
			for ( i=m; i < m + seq.length; i++) {
				matchres[i] = true;
			}
			++ m;
		}
//		console.log( matchres );
		//matchres.keys && 
		Object.keys( matchres ).forEach( function(n) {
			atm = atm.concat( tg_chain[n].atoms );
			mol.push( tg_chain[n] );
		});

		this.selection = {atoms: atm, molecules: mol};
		return this;
	},

	//.. スタイル系

	//... style_init
	style_init: function( only ) {
		var do_style = only != 'color';
		var do_color = only != 'style';
		this.select();
		//- PDB
		if ( phpvar.ent.db == 'pdb' ) {
			//- スタイル
			if ( do_style ) {
				this.style( 'defo' ).style( 'ligand_style' );
				this.select( 'resn HOH' ).color('cpk').style( 'hide' ).select();
			}
			//- 色
			if ( do_color ) {
				if ( phpvar.initstyle.multic ) {
					this.color( 'jmolchain' );
				} else {
					this.color( 'grp' );
				}
				this.style( 'ligand_color' );
			}

		//- chem
		} else if ( phpvar.ent.db == 'chem' ) {
			if ( do_style )
				this.style( 'bs' );
			if ( do_color )
				this.color( 'cpk' );

		//- sasbdb
		} else if ( phpvar.ent.db == 'sasbdb' || phpvar.ent.db == 'sasbdb-model') {
			if ( phpvar.initstyle.dummy ) {
				if ( do_style ) this.style( 'cpk' );
				if ( do_color )	this.color( 'cpk' );
			} else {
				if ( do_style ) this.style( 'defo' );
				if ( do_color )	this.color( 'jmolchain' );
			}
		}

		//- prime用 初期化処理
		phpvar.init_cmd && eval( phpvar.init_cmd );
		return this;
	},

	//... color
	color: function( mode ) {
//		console.log( 'color' );
		if ( typeof mode != 'string' ) {
			molmil.colorEntry(
				this.selected() ,
				molmil.colorEntry_Custom ,
				mode
			);
		} else if ( mode == 'jmolchain' ) {
			var that = this;
			this.selected().chains.forEach( function(c){
				if ( c.isHet || c.molecules[0].name == 'HOH' ) return;
				var cn = c.authName || c.name || 'A';
				molmil.colorEntry(
					c ,
					molmil.colorEntry_Custom,
					that.ccol[ cn.substring( cn.length-1 ).toUpperCase() ]
				);
			});
		} else if ( mode == 'init' ) {
			this.style_init( 'color' );
		} else {
			molmil.colorEntry(
				this.selected() ,
				this.mmname.color[ mode ]
			);
//			molmil.colorEntry(
//				this.selected().atoms ,
//				this.mmname.color[ mode ]
//			);
//			molmil.colorEntry(
//				this.selected().molecules ,
//				this.mmname.color[ mode ]
//			);
		}
		return this;
	},
	
	//... style
	style: function( mode ) {
		if ( mode == 'ligand_color' ) {
			this.selected().chains.forEach( function(c){
				if ( ! c.isHet ) return;
				molmil.colorEntry( c, molmil.colorEntry_CPK );
			});
		} else if ( mode == 'ligand_style' ) {
			this.selected().chains.forEach( function(c){
				if ( ! c.isHet ) return;
				if ( c.atoms && c.atoms.length == 1 ) {
					molmil.displayEntry( c, molmil.displayMode_BallStick );
//					molmil.displayEntry( c, molmil.displayMode_Spacefill );
				} else {
					molmil.displayEntry( c, molmil.displayMode_Stick );
//					molmil.displayEntry( c, molmil.displayMode_BallStick );
				}
			});
		} else if ( mode == 'init' ) {
			this.style_init( 'style' );
		} else {
			molmil.displayEntry(
				this.selected() ,
				this.mmname.style[ mode || 'defo' ]
			);
		}
		return this;
	} ,

	//... show_sidechain
	show_sidechain: function( flg ) {
		var colatoms = [];
//		_mm.selection.molecules.showSC = true;
		molmil.displayEntry( _mm.selection.molecules, 
			molmil.displayMode_Stick_SC );
//		_mm.selection.atoms
		_mm.selection.atoms.forEach(function(c){
			if ( c.element == 'C' ) return;
			colatoms.push(c);
		});
		molmil.colorEntry( colatoms, molmil.colorEntry_CPK );
		return this;
	},

	//... styleset
	styleset:function( mode ) {
		this.select().style(mode).rebuild();
		_popvw.cmdhist( 'Style applied' ) ;
	} ,
	//... colorset
	colorset:function( mode ) {
		this.select().color(mode).rebuild();
		_popvw.cmdhist( 'Color applied' ) ;
	} ,

	//... delchain
	delchain:function( t_chain ) {
		if ( typeof t_chain === 'string' )
			t_chain = [ t_chain ];

		var idxs = [];
//		soup.atomRef.forEach( function(c, i){
//			if ( t_chain.indexOf( c.chain.name ) === -1 ) return;
//			delete soup.structures[0].atomRef[i];
//		});
		soup.structures[0].chains.forEach( function(c, i){
			if ( t_chain.indexOf( c.name ) === -1 ) return;
			idxs.unshift(i);
//			c.molecules.forEach( function(c2, i2){
//				delete c.molecules[i2];
//			})
//			c.atoms.forEach( function(c2, i2){
//				delete c.atoms[i2];
//			})
//			delete soup.chains[i];
//			delete soup.structures[0].chains[i].molecules;
//			delete soup.structures[0].chains[i];
//			soup.structures[0].chains.splice(i,1);
//			console.log( c.name );
		});
		idxs.forEach( function(i){
			soup.structures[0].chains.splice(i,1);			
		})


		return this;
	} ,

	//.. view系
	//... focus
	focus: function() {
		var sel = this.selected(), cnt;
//		console.log( 'selection: ' + sel );

		if ( sel.molecules )
			cnt = sel.molecules.length + ' residues';
		if ( sel.atoms )
			sel = sel.atoms;
		if ( ! cnt )
			cnt = sel.length + ' atoms';

//		console.log( sel );
		molmil.selectAtoms( sel, false, soup );
		if ( sel.length == 0 ) {
			molmil.resetCOG( canvas, false );
			_popvw.cmdhist( 'No atom selected', 'red' );
 		} else {
			molmil.selectionFocus( soup, 1 );
			_popvw.cmdhist( 'Focusing on selected ' + cnt );
			canvas.renderer.updateSelection();
		}
		this.rebuild();
		return this;
	} ,
	
	//... reset_focus
	reset_focus: function() {
		canvas.molmilViewer.calculateCOG();
		canvas.renderer.camera.z = canvas.molmilViewer.calcZ();
		canvas.renderer.camera.z_set = true;
		molmil.selectAtoms( [], false, soup );
		this.rebuild();
		canvas.update = true;
		return this;
	},

	//... zoom
	zoom: function( lev ) {
		canvas.renderer.camera.z = canvas.renderer.camera.z / lev;
		canvas.update = true;
		return this;
	} ,

/*
	//... rot
	rot: function( lev ) {
		canvas.renderer.camera.x += lev;
		canvas.update = true;
		return this;
	} ,
*/

	//... reset_view
	reset_view: function() {
		canvas.renderer.camera.reset();
		this.reset_focus();
		return this;
	},

	//.. animation
	anim: function(p) {
		
	},

	//.. config
	config: function( key, val ) {
		molmil.configBox[key] = val;
		molmil.shaderEngine.recompile(canvas.molmilViewer.renderer);
//		console.log( molmil.configBox.stereoMode );
		if ( key === 'stereoMode' ) {
//			alert( 'stero' )
			canvas.renderer.camera.z = canvas.molmilViewer.calcZ() / (val ? 1/2: 3);
			canvas.renderer.camera.z_set = true;
			if ( val ) _mm.zoom(2);
//			console.log( canvas.renderer.camera.z );
		}
		canvas.update = true;
		return this;
	} ,

	//.. UI系e
	uiset: function( cmd, param ) {
		if ( cmd == 'molmil_menu' ) {
			$('.molmil_UI_LB_icon').toggle('medium');
			$('.molmil_UI_RB_icon').toggle('medium');
		} else if ( cmd == 'console' ) {
			this.ui.toggleCLI();
			_resize_canvas();
		}
		return this;
	} ,

	//.. rebuild
	rebuild: function() {
		soup.renderer.initBuffers();
		canvas.update = true;
		return this;
	} ,
	//.. asb
	asb: function( aid, disp_mode ) {
		molmil.toggleBU(
			aid === undefined ? -1 : aid ,
			disp_mode || 4 ,
			3,	//- color mode
			soup.structures[0],
			soup
		);
		var str = 'assembly #' + aid;
		if ( aid === undefined || aid === -1 ) {
			_mm.select().rebuild();
			str = 'asymmetric unit';
		}
		_popvw.cmdhist( 'Displaying ' + str );
		return this;
	}
}

//. _cmd キューから受け取る
var _cmd = {
	//.. asb
	asb: function( param, trg_obj ) {
//		console.log( trg_obj );
		_mm.asb(param);
		trg_obj && _ofunc( '_btn_deco', 'asb', trg_obj );
	},

	//.. focus_chain
	focus_chain: function(param, trg_obj) {
		_mm.select_chain( param ).focus();
		trg_obj && _ofunc( '_btn_deco', 'select', trg_obj );
	},

	//.. focus_res
	focus_res: function(param, trg_obj) {
		_mm.select_res( param ).show_sidechain().focus();
		trg_obj && _ofunc( '_btn_deco', 'select', trg_obj );
	} ,

	//.. focus_res_ns; スタイル変更なし
	focus_res_ns: function(param, trg_obj) {
		_mm.select_res( param ).focus();
		trg_obj && _ofunc( '_btn_deco', 'select', trg_obj );
	} ,

	//.. focus_seq
	focus_seq: function(param, trg_obj) {
		_popvw.cmdhist( 'Sequence: ' + param.aid +'-'+ param.seq ) ;
		_mm.select_seq( param.aid, param.seq ).focus();
		trg_obj && _ofunc( '_btn_deco', 'select', trg_obj );
	},

	//.. focus_reset
	focus_reset: function() {
		_mm.reset_focus();
//		trg_obj && _ofunc( '_btn_deco', 'select', trg_obj );
//- 	トリガの装飾をクリアする処理
	},

	//.. water
	water: function( param ) {
		soup.waterToggle( param );
		_mm.select( 'resn HOH' ).style( param ? 'bs' : 'hide' ).rebuild();
		_popvw.cmdhist( param ? 'Water shown' : 'Water hidden' ) ;
	},

	//.. other
	other: function(param, trg_obj) {
		_popvw.cmdhist( 'unknown command' );
	}
}

//. _vwui 操作UIから
_vwui = {
	style: function(o) {
		_mm.select().style( $(o).val() ).rebuild();
		_popvw.cmdhist( 'Style applied' ) ;
	},
	color: function(o) {
		_mm.select().color( $(o).val() ).rebuild();
		_popvw.cmdhist( 'Color applied' ) ;
	},

	//.. 表示系
	blackbg: function(o) {
		var ck = $(o).prop('checked');
		_mm.config('BGCOLOR', ck ? [0,0,0,1]: [1,1,1,1] );
		_localstr.setbool( 'blackbg', ck );
	},
	fog: function(o) {
		var ck = $(o).prop('checked');
		_mm.config('glsl_fog', ck );
		_localstr.setbool( 'nofog', !ck );
	} ,
	stereo: function(o) {
		var ck = $(o).prop('checked');
		_mm.config('stereoMode', ck ? 1 : 0 );
		_localstr.setbool( 'stereo', ck );
	}
}
