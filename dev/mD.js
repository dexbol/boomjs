/**@license
<?php
    header('Content-Type','text/javascript');
	header('Cache-Control','max-age=120');	
	header("Content-Type", "application/x-javascript");
	//usleep(80000);
	sleep(2);
?>
*/


CN6.add('mD',function(C){
	C.mD=true;
},{requires:['util']});


CN6.use('util',function(C){
	C.output('mD.js is loaded');
})
