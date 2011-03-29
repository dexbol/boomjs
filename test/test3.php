<?php
    header('Content-Type','text/javascript');
		header('Cache-Control','max-age=120');

	usleep(50000);
?>
var t3='t3';

CN6.add('t3-1',function(C){
C['t3-1']='fuck';
},{requires:['t2-1']})
