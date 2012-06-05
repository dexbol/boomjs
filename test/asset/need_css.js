/**@license
<?php
    header('Content-Type','text/javascript');
	header('Cache-Control','max-age=120');	
	header("Content-Type", "application/x-javascript");
	//usleep(80000);
	sleep(4);
?>
*/


CN6.add('need_css',function(C){
	C.resetBackground=function(){
		document.getElementsByTagName('body')[0].style.backgroundColor = 'white';	
		return true;
	}
},{requires:['css']});