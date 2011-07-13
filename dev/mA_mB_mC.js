/**@license
<?php
    header('Content-Type','text/javascript');
	header('Cache-Control','max-age=120');	
	header("Content-Type", "application/x-javascript");
	usleep(80000);
	
?>
*/



CN6.add('mA',function(C){
	
},{requires:['util']});

CN6.add('mB',function(C){
	
},{requires:['util']});

CN6.add('mC',function(C){
	
},{requires:['util']});

CN6.use('util',function(C){
	C.output('mA_mB_mC.js is loaded');
})
