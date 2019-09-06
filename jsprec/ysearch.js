/*
ysearchjs
*/

//. 開始時
$( function() { 
	_form.init();
	_form.is_changed();
	_ystab.init();
	
	//- 戻る・進む動作
	if ( history && history.pushState ){
		$(window).on('popstate', function(e){
			_form.reloadform();
		});
	}
	
});

//. [func] _emn_search
function _emn_search(){
	$( '#form1' ).attr( 'action', 'esearch.php' ).submit();
}

//. [obj] _ystab
var _ystab = {
	page_num: [],

	//.. init
	init: function() {
		this.rkeywords = _form.get_rkeywords();
		this.get('page', 0); //- 初期画面の結果取得
		this.get('hit', 0);
	},

	//.. clear
	clear: function( names ) {
		names.forEach( function(c) {
			$( '#tabdiv_res_' + c ).text('');
		}.bind(this));
		return this;
	} ,

	//.. set タブ切り替え ボタンから
	set: function( name ){
		_form.$act_tab.val( name );
		_form.$page_num.val( this.page_num[ name ] || 0 );
		_form.changed(); //- なぜかコールバックされないので
	},

	//.. change タブ切り替え フォームから
	change: function(){
		name = _form.$act_tab.val() || 'emdb';
		_tab.s( 'res', name );

		//- 中身カラなら読み込み
		if ( !$( '#tabdiv_res_' + name ).text() ) {
//			console.log( 'empty: ' + name );
			this.get('page');
		}
		_form.disp_row(); //- フォームの行内容を操作
	},

	//.. page ページ ボタンから
	page: function( num, tab ) {
//		this.page_num[ tab ] = num;
		_form.$page_num.val( num );
		_form.$act_tab.val( tab );
		_form.changed(); //- なぜかコールバックされないので
	},

	//.. disp_mode: モード切替
	disp_mode: function() {
//		console.log( 'mode changed' );
		this.clear(['emdb', 'pdb', 'sas', 'chem']);
		this.get('page');
	},

	//.. get_all 全部再検索
	get_all: function( sp ) {
//		console.log( 'full reload' );
		this.page_num = {};
		_form.$page_num.val(0);
		$( '#ent_info' ).hide('medium');
		$( '#oc_div_result' )._loadex({
			u: '?ajax=res',
			v: _form.$o.serialize() ,
			speed: sp ,
			func: function(){
				this.get('page');
			}.bind(this)
			});
		this.get( 'hit');
	} ,

	//.. get ( hit / page)
	get: function( type, sp ) {
		$( type == 'page'
			? '#tabdiv_res_' + _form.$act_tab.val()
			: '#hit_item'
		)._loadex({
			u: '?ajax=' + type ,
			v: _form.$o.serialize() ,
			speed: sp || 'fast'
		});
	}
}

//. [obj] _form
var _form = {
	prev_val: {},
	$act_tab	: null,
	$page_num	: null,
	$o			: $('#form1') ,

	//.. init:
	init: function() {
		//- フォーム初期化
		this.$act_tab	= $('#act_tab');
		this.$page_num	= $('#pagen');
		this.$o.change(
			function(){ this.changed(); }.bind(this)
		);
		this.$act_tab.val( this.$act_tab.val() || phpvar.actab );
		this.disp_row( 0 );
	},

	//.. is_changed
	is_changed: function( key ) {
		if (!key) {
			this.prev_val["rkeywords"]	= this.get_rkeywords();
			this.prev_val["mode"]		= this.get_mode();
			this.prev_val["tab"]		= this.$act_tab.val();
//			this.prev_val["page"]		= this.$page_num.val();
			this.prev_val["form"]		= this.$o.serialize();
			return;
		}
		var result, next, prev;
		next = 
			key == 'rkeywords'	? this.get_rkeywords()	:
			key == 'mode'		? this.get_mode()		:
			key == 'tab'		? this.$act_tab.val()	:
			key == 'page'		? this.$page_num.val()	:
			key == 'form'		? this.$o.serialize()
		: null;
		if ( key == 'page' ) {
			var tab = this.$act_tab.val();
			prev = _ystab.page_num[ tab ];
			_ystab.page_num[ tab ] = next;
		} else {
			prev = this.prev_val[key];
			this.prev_val[key] = next;
		}

		result = prev != next;
//		console.log([
//			key + ( result ? ' changed' : ' not changed' ) ,
//			prev + ' -> ' + next
//		]); 
		return result;
	} ,
	//.. get_rkeywords
	get_rkeywords: function() {
		var r = 
			$("#idbox").val() +'%%'+
			$("input[name='auth']").val()
		;
//		console.log( r );
		return r;
	},

	//.. get_mode
	get_mode: function() {
		return $("input[name='mode']:checked").val();
	} ,

	//.. changed: 検索条件に変更
	changed: function( donot_pushhist ) {
		//- 内容が変わってなかったら、おしまい
		if ( ! this.is_changed( 'form' ) ) return;
		if ( ! donot_pushhist )
			history.pushState( null, null, '?' + this.$o.serialize() );

//		console.log([ 'changed', this.$o.serialize() ]);
		if ( this.is_changed('rkeywords') ) {
			_ystab.get_all();
			return;
		}
		if ( this.is_changed('mode') )
			_ystab.disp_mode();

		//- ページとタブは排他
		if ( this.is_changed('tab') )
			_ystab.change();
		else if ( this.is_changed('page') )
			_ystab.get('page');
	},

	//.. disp_row: 表示行をタブ内容にあわせる
	disp_row: function( speed ){
		var name = this.$act_tab.val() || 'emdb';
		
		speed = speed == undefined ? 'medium' : speed ;
		$('.opt_tr').hide( speed );
		phpvar.opt_tr[ name ] &&  phpvar.opt_tr[ name ].forEach( function(c) {
			$( '#tr_' + c ).stop(1,1).show( speed );
		});
	} ,

	//.. reloadform
	//- 戻る・進むボタン対応、フォームを書き換えて、検索実行
	reloadform: function() {
		var l = location.search || '?';
		this.$o._loadex({
			u: l + '&ajax=form',
			speed: 0,
			func:function(){
				this.init();
				this.changed(true);
			}.bind(this)
		});
	}
}


