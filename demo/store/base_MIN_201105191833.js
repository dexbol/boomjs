/*

 <?php
 header('Content-Type','text/javascript');
 header('Cache-Control','max-age=120');
 usleep(80000);

 ?>
*/
CN6.add("util",function(a){function b(c){var d=document.getElementById("console");if(d){var e=document.createElement("p");e.appendChild(document.createTextNode(c));d.appendChild(e)}else setTimeout(function(){b(c)},200)}a.output=b});CN6.use("util",function(a){a.output("base.js is loaded")});
