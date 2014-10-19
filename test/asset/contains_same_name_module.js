/**@license
<?php
    header('Content-Type','text/javascript');
	header('Cache-Control','max-age=120');
	sleep(2);
?>
*/

Boom.add('contains_same_name_module', function(C) {
	C.contains_same_name_module = true;
});