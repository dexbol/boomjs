/**@license
<?php
    header('Content-Type','text/javascript');
	header('Cache-Control','max-age=120');	
	header("Content-Type", "application/x-javascript");
	//usleep(80000);
	sleep(2);
?>
*/

/*BOOM_ADD_FILE

CN6.addFile('mE.js',{
	fullpath:_BOOM_DEBUG_?'mE.source.js':'store/mE_MIN_201105191833.js',
	mods:['mE']
})


BOOM_ADD_FILE*/

CN6.add('mE',function(C){
	C.mE=true;
});

CN6.mE='fuck'
/*
CN6.use('util',function(C){
	C.output('mE.js is loaded');
})
*/