/*

 <?php
 header('Content-Type','text/javascript');
 header('Cache-Control','max-age=120');	
 header("Content-Type", "application/x-javascript");
 usleep(80000);

 ?>
*/
CN6.add("mA",function(){},{requires:["util"]});CN6.add("mB",function(){},{requires:["util"]});CN6.add("mC",function(){},{requires:["util"]});CN6.use("util",function(a){a.output("mA_mB_mC.js is loaded")});
