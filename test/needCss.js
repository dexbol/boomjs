/**@license
<?php
    header('Content-Type','text/javascript');
	header('Cache-Control','max-age=120');	
	header("Content-Type", "application/x-javascript");
	//usleep(80000);
	sleep(2);
?>
*/


CN6.add('needCss',function(C){

	C.resetBackground=function(){
		jQuery('body').css('backgroundColor','white');
	}
	
	
},{requires:['a.css']});