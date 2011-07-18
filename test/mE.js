/**@license
<?php
    header('Content-Type','text/javascript');
	header('Cache-Control','max-age=120');	
	header("Content-Type", "application/x-javascript");
	//usleep(80000);
	sleep(2);
?>
*/


CN6.add('mE',function(C){
	C.mE=true;
},{requires:['util']});


CN6.use('util',function(C){
	C.output('mE.js is loaded');
})

var F_mE=true;