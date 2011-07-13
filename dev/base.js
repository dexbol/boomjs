/**@license
<?php
    header('Content-Type','text/javascript');
	header('Cache-Control','max-age=120');
	sleep(4);

?>
*/


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
