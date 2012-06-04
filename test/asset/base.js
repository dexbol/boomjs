/**@license
<?php
    header('Content-Type','text/javascript');
	header('Cache-Control','max-age=120');
	sleep(4);

?>
*/


CN6.add('util',function(C){
	function output(msg){
		if(typeof console == 'object'){
			console.log&&console.log(msg);
		}
	}
	
	C.output=output
});

CN6.use('util',function(C){
	C.output('base.js is loaded');
});

var F_base=true;