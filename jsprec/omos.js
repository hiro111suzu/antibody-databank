var
$subjbox	= $('#subj_box') ,
$sicon		= $('.sampleicon') 
;
phpvar.idservadr = 'omo-ajax.php?ent=1&id=';

//. 最初に実行
$( function() {
	//- 表示する結果が決まっているなら、最初から結果表示モードに
	if ( phpvar.id ) {
		_result.start()
		_getsubj();
	}
});
//console.log(phpvar);
//. [obj] _result
var _result = {
	$box: $('#result_box') ,
	$test: $('#test_box') ,
	timer: null,

	//.. start
	start: function() {
		this.timer = setInterval( function(){this.get();}.bind(this), 1000 );
		this.get();
//		_hide();
	},

	//.. get: 検索結果を取得
	get: function() {
		phpvar.postvar.t = new Date().getTime(); //- キャッシュを使わせない
		$.getJSON( phpvar.ajaxurl, phpvar.postvar, function( json ) {
			//- 終わりフラグがtrueなら、タイマーを止める
			if ( json.end ) {
				_pop.hide();
				clearInterval( this.timer );
			}
			this.$box.html( json.out );
			this.$test.append( json.test ).show();

		}.bind(this)).error(function(jqXHR, textStatus, errorThrown) {
		    this.$test.show().html(
		    	"<b>Error:</b> " + textStatus + "<br>" +
				"<b>Text:</b><br>" + jqXHR.responseText
			);
			clearInterval( this.timer );
		}.bind(this));

		//- ユーザーデータならサブジェクトのところも毎回更新毎回
//		console.log( phpvar.userdata );
		if ( phpvar.userdata ) {
			_getsubj();
		}
	} ,
	//.. get_anim: アニメーション付き(ページ切り替えなど)
	get_anim: function() {
		_pop.hide();
		_kw_suggest.flg_done = false; //- キーワード候補リセット
		this.$box.html( phpvar.loading );

		phpvar.postvar.t = new Date().getTime(); //- キャッシュを使わせない
		$.getJSON( phpvar.ajaxurl, phpvar.postvar, function( json ) {
			this.$box.hide().html(json.out).slideDown('medium');
			this.$test.html( json.test ).show();
		}.bind(this));
	},
	
	//.. page: ページ切り替え
	page: function( p ) {
		phpvar.postvar.pg = p;
		this.get_anim();
		
	} ,

	//.. mode: 表示モード切り替え
	mode: function( v ) {
		phpvar.postvar.list = v;
		phpvar.postvar.actab = 'display';
		this.get_anim();
	} ,

	//.. gmref: gmfitでリファイン
	gmref: function( num ) {
		phpvar.postvar.gmref = true;
		phpvar.postvar.gmnum = num;
		this.timer = setInterval( function(){ this.get();}.bind(this), 2000 );
	} 
}

//. function
//.. _getsubj: 
function _getsubj() {
	$subjbox.load( phpvar.ajaxurl, { 'id': phpvar.id, 'subj': true } );
}

//.. _hide: 結果表示に関係ない要素を隠す
function _hide() {
	_hdiv.oc( 'about', 0 );
	_hdiv.oc( 'query', 0 );
}

//.. _sample
function _sample( i, o ) {
	$sicon.fadeTo( 0, 1 ); //- クリックしたのだけ半透明に
	$( o ).fadeTo( 0, 0.5 );
	_idbox.set( i );
}

//. [obj] _kw_suggest: 推奨キーワード
var _kw_suggest = {
	flg_done: false ,
	$box: null,
	//.. get
	get: function(id) {
		if ( this.flg_done ) return;
		$('#kw_recom')._loadex({ u: phpvar.ajaxurl, v: {'id': phpvar.id, 'kw_recom': true} });
		this.flg_done = true;
	} ,
	//.. add
	add: function(domobj) {
		var txt_box, txt_btn, $btn = $(domobj);
		if ( ! this.$box )
			this.$box = $('#inp_filtkw');
		txt_box = this.$box.val();
		txt_btn = $btn.text();
		if ( txt_box.indexOf( txt_btn ) === -1 ) {
			$btn.addClass('shine');
			this.$box.val( txt_box + ( txt_box == '' ? '' : ' ' ) + txt_btn );
		} else {
			$btn.removeClass('shine');
			this.$box.val( txt_box.replace( txt_btn, '' ).replace( / +/, ' ' ).trim() );
		}
	}
}
//. [obj] _dbid
var _dbid = {
	vals: {} ,
	$box_inc: '', $box_exc: '',
	getitems: function( id ) {
		var $div = $('#func_items');
		$div.text() ||
			$div._loadex({ u: phpvar.ajaxurl, v: {'id': id, 'dbid': true} });
	},
/*
	pop: function( key ) {
		$('#popbox').child('select').val( this.vals[ key ] );
	}
*/
	filt: function( key, obj ) {
		_pop.hide( 2 );
		var num = $(obj).val();
		console.log( key, num );
//		this.vals[key] = num;
		$trg = $('.poptrg_act');
//		$trg.data( 'pop', $('#popbox').html() ); //- 変化をデータ属性に書き戻す
		this.$box_inc = this.$box_inc || $('#inp_dbid_inc');
		this.$box_exc = this.$box_exc || $('#inp_dbid_exc');

		if ( num == 1 ) { //- inc
			$trg.addClass('filt_inc');
			this.$box_inc.val( this.$box_inc.val() + ' ' + key );
		} else {
			$trg.removeClass('filt_inc');
			this.$box_inc.val( 
				this.$box_inc.val().replace(key, '').replace( / +/, ' ' ).trim()
			);
		}
		if ( num == 2 ) { //- exc
			$trg.addClass('filt_exc');
			this.$box_exc.val( this.$box_exc.val() + ' ' + key );
		} else {
			$trg.removeClass('filt_exc');
			this.$box_exc.val( 
				this.$box_exc.val().replace(key, '').replace( / +/, ' ' ).trim()
			);
		}
	}
}
