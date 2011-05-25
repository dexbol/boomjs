/**@license
<?php
    header('Content-Type','text/javascript');
	header('Cache-Control','max-age=120');	
	header("Content-Type", "application/x-javascript");
	usleep(80000);
	
?>
*/
/*BOOM_ADD_FILE


CN6.addFile('mD.js',{
	fullpath:_BOOM_DEBUG_?'mD.source.js':'store/mD_MIN_201105191833.js',
	mods:['mD']
})


BOOM_ADD_FILE*/

CN6.add('mD',function(C){
	C.mD=true;
},{requires:['util']});


/*
CN6.use('util',function(C){
	C.output('mD.js is loaded');
})
*/