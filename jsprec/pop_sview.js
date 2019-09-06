//var container, stats,
//var controls
//var camera, scene, renderer;
//var mouseX = 0, mouseY = 0;
//var windowHalfX = window.innerWidth / 10;
//var windowHalfY = window.innerHeight / 10;

//. [obj] _sview
var _sview = {
/*
	camera: '',
	light,
	controls,
	renderer,
	scene,
*/
	$container: $('#container') ,
	bgcolor: new THREE.Color( _localstr.getbool('blackbg') ? 0x000000 : 0xffffff )
};


init();
animate();

//. [func] init
function init() {
	//.. camera
	_sview.camera = new THREE.PerspectiveCamera(
		20,
		window.innerWidth / window.innerHeight,
		1,
	//- 中央でスライス
	//	phpvar.init_pos.dep * 2.5,  
		phpvar.init_pos.dep * 10 );
	_sview.camera.position.z = phpvar.init_pos.dep * 2.5

	//.. controls
	_sview.controls = new THREE.TrackballControls(_sview.camera);

	_sview.controls.rotateSpeed = 3.0;
	_sview.controls.zoomSpeed = -3;
	_sview.controls.panSpeed = 0.1;

	_sview.controls.noZoom = false;
	_sview.controls.noPan = false;

	//- 慣性回転
	_sview.controls.staticMoving = true;
//	_sview.controls.dynamicDampingFactor = 0.5
	_sview.controls.keys = [ 65, 83, 68 ];
	_sview.controls.addEventListener( 'change', render );

//.. scene
	_sview.scene = new THREE.Scene();
	_sview.scene.add(
		new THREE.AmbientLight( 0x555555, 0.2 )
	);
	_sview.light = new THREE.DirectionalLight( 0xaaaaaa, 0.4 );
	_sview.scene.add( _sview.light );
	_sview.scene.fog = new THREE.Fog(
		_sview.bgcolor ,
		phpvar.init_pos.dep - phpvar.init_pos.fogn,
		phpvar.init_pos.dep + phpvar.init_pos.fogf
	);

//.. ロード設定
	var onProgress = function ( xhr ) {
//		if ( xhr.lengthComputable ) {
//			var percentComplete = Math.round( xhr.loaded / xhr.total * 100, 2 );
//		}
	};
	var onError = function ( xhr ) {
		_popvw.cmdhist( 'Load error', 'red' );
	};

	var manager = new THREE.LoadingManager();
	manager.onLoad = function () {
		_popvw.set_ready();
	}

	//.. loader実行
	var loader = new THREE.OBJMTLLoader(manager);
	loader.load( phpvar.filepath.obj, phpvar.filepath.mtl,
		function ( object ) {
			object.position.x = phpvar.init_pos.x;
			object.position.y = phpvar.init_pos.y;
			object.position.z = phpvar.init_pos.z;

			//- 裏面も
/*
			object.traverse( function( node ) {
			    if( node.material ) {
			        node.material.side = THREE.DoubleSide;
			        node.material.clipShadows = true;
			    }
			});
*/
			_sview.scene.add( object );

		}, 
		onProgress,
		onError 
	);

	//.. renderer
	_sview.renderer = new THREE.WebGLRenderer();
//	_sview.renderer.setPixelRatio( window.devicePixelRatio );
//	_sview.renderer.setSize( window.innerWidth, window.innerHeight );
//	_sview.renderer.setClearColor( new THREE.Color(0xffffff) )
	_sview.$container.append( _sview.renderer.domElement );
	_resize_canvas();
}

//. functions

//.. animate
function animate() {
	requestAnimationFrame( animate );
	render();
	_sview.controls.update();
	var d = _sview.camera.position.distanceTo( _sview.scene.position );
//	_sview.camera.near = d * 3;

	_sview.scene.fog.near = d - phpvar.init_pos.fogn;
	_sview.scene.fog.far  = d + phpvar.init_pos.fogf;
	_sview.light.position.copy( _sview.camera.position );

}

//.. render
function render() {
//	_sview.camera.lookAt( _sview.scene.position );
	_sview.renderer.render( _sview.scene, _sview.camera );
}

//. ウインドウ、リサイズしたとき、閉じたとき
$(window).resize(
	function() { _resize_canvas(); } 
);

function _resize_canvas() {
	var sz = {
		w: window.innerWidth ,
		h: window.innerHeight
	}
	_sview.renderer.setPixelRatio( window.devicePixelRatio );
	_sview.renderer.setClearColor( _sview.bgcolor );
	_sview.renderer.setSize( sz.w, sz.h );
	_sview.camera.aspect = sz.w / sz.h;
	_sview.camera.updateProjectionMatrix();
	_sview.controls.update();
}
