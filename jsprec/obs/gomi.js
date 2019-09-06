//. simple / viwer old
//. object: _pjmol:
var _pjmol = {
	qtimer: {},
	ques: {},

//.. open: Jmolポップアップ
//- Jmolポップアップウインドウを開きコマンドを送る
//- queにコマンドを追加
//- i: ID
//- trg_obj: ボタンなど、dataが入っている要素オブジェクト
	open: function( i, trg_obj ) {
//		alert( 'molmil' );
		var win_id = 'jmol-' + i;
		if ( trg_obj ) {
			var o = $( trg_obj ).data('jmol');
			o.trg_obj = trg_obj;
			this.que( win_id, o );
		}
		i =  i == 'main' ? phpvar.entinfo.did : i; //- quick メインデータ対応
		_vw.open_vwin( win_id, phpvar.vwurl.jmol + i );
	},

	//.. que: Jmolが応答するまで、コマンドを送り続ける
	que: function( win_id, que ) {
		if ( que == undefined ) return;
		this.ques[win_id] = this.ques[win_id] || [];
		clearInterval( this.qtimer[win_id] );
		this.qtimer[win_id] = setInterval( function(){
			if ( ! _vw.wins[win_id] ) {
				_vw.cmdhist( win_id, 'Waiting for Jmol window', 'green' );
				return;
			}
			if ( _vw.wins[win_id].closed ) {
				delete this.ques[win_id];
				delete _vw.wins[win_id];
				clearInterval( this.qtimer[win_id] );
				return;
			}
			if ( _vw.wins[win_id]._send_cmd == undefined ) {
				_vw.cmdhist( win_id, 'Waiting for Jmol reply', 'green' );
				return;
			}
			if ( _vw.wins[win_id]._send_cmd( this.ques[win_id] ) ) {
				//- Ok
				delete this.ques[win_id];
				_vw.wins[win_id].focus();
				clearInterval( this.qtimer[win_id] );
			} else {
				//- 返事がない
				_vw.cmdhist( win_id, 'Jmol seems to be busy now', 'green' );
			}
		}.bind(this), 500 );
	}
}

//. object: _psview: SurfView
var _psview = {
	//.. open ポップアップウインドウを開く
	open: function( i, n ) {
		var win_id = 'sview-' + i + ( n == '' ? '' : '-' + n );
		i =  i == 'main' ? phpvar.entinfo.did : i; //- quick メインデータ対応
		_vw.open_vwin( win_id, phpvar.vwurl.sview + i );
	}
}

//. object: _pmolmil: MolMil
var _pmolmil = {
	qtimer: {},
	ques: {},

	//.. open ポップアップウインドウを開く
	open: function( i, trg_obj ) {
		var win_id = 'molmil-' + i;
//		alert( 'molmil' );
		if ( trg_obj ) {
			var o = $( trg_obj ).data( 'molmil' );
			o.trg_obj = trg_obj;
			this.que( win_id, o );
		}
		i =  i == 'main' ? phpvar.entinfo.did : i; //- quick メインデータ対応
		_vw.open_vwin( win_id, phpvar.vwurl.molmil + i );
	},

	//.. que: 応答するまで、コマンドを送り続ける
	que: function( win_id, que ) {
		if ( que == undefined ) return;
		this.ques[win_id] = this.ques[win_id] ? this.ques[win_id] : [];
		this.ques[win_id].push( que );

		clearInterval( this.qtimer[win_id] );
		this.qtimer[win_id] = setInterval( function(){
			if ( ! _vw.wins[win_id] ) {
				console.log( 'waiting molmil window' );
				return;
			}
			if ( _vw.wins[win_id].closed ) {
				clearInterval( this.qtimer[win_id] );
				delete _vw.wins[win_id];
				return;
			}
			if (
				! _vw.wins[win_id]._popvw ||
				! _vw.wins[win_id]._popvw.ready 
			) {
				console.log( 'Molmil not ready' );
				return;
			}
			if ( _vw.wins[win_id]._send_cmd( this.ques[win_id] ) ) {
				//- Ok
				this.ques[win_id] = [];
				_vw.wins[win_id].focus();
				clearInterval( this.qtimer[win_id] );
				console.log( 'ok' );
			} else {
				console.log( 'Molmil does not reply' );
			}
		}.bind(this), 500 );
	}
}
