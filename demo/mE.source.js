/**@license
<?php
    header('Content-Type','text/javascript');
	header('Cache-Control','max-age=120');	
	header("Content-Type", "application/x-javascript");
	usleep(80000);
	
?>
*/

/*BOOM_ADD_FILE

CN6.addFile('mE.js',{
	fullpath:_BOOM_DEBUG_?'mE.source.js':'store/mE_MIN_201105301712.js',
	mods:['mE']
})


BOOM_ADD_FILE*/

CN6.add('mE',function(C){
	
},{requires:['mD']});

CN6.use('util',function(C){
	C.output('mE.js is loaded');
})
