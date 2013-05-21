/**@license
<?php
    header('Content-Type','text/javascript');
	header('Cache-Control','max-age=120');
	sleep(1);
?>
*/

Boom.add('module_2', function(C) {
	if (C.module_1) {
		C.module_2 = true;
	}

}, {requires:['module_1']});

Boom.add('module_3', function(C) {
	if (C.module_2) {
		C.module_3 = true;
	}
}, {requires: ['module_2']});