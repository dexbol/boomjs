<?php
    header('Content-Type','text/javascript');
		header('Cache-Control','max-age=120');
	usleep(50000);
	
?>
CN6.add('t4-1',function(C){C['t4-1']=true},{requires:['t3-1']});

//CN6.add('t4-2',function(C){C['t4-2']=true},{requires:['t2-1']});