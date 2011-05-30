/**@license
<?php
    header('Content-Type','text/javascript');
	header('Cache-Control','max-age=120');
	usleep(80000);

?>
*/

/*BOOM_ADD_FILE


CN6.addFile('base.js',{
	fullpath:_BOOM_DEBUG_?'base.source.js':'store/base_MIN_201105301712.js',
	mods:['util']
});

//load base js as soon as possible
CN6.load('base.js');

BOOM_ADD_FILE*/

CN6.add('util',function(C){
	function output(msg){
		var area=document.getElementById('console');
		
		if(!area){
			setTimeout(function(){
				output(msg);
			},200);
			return;
		}

		var p=document.createElement('p');
		p.appendChild(document.createTextNode(msg));
		area.appendChild(p);
	}
	
	C.output=output
});

CN6.use('util',function(C){
	C.output('base.js is loaded');
});
