<?php
$time = explode( ' ', microtime() );
echo $time[1].substr( $time[0], 2, 3);
?>