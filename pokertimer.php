<?php
header( 'content-type: text/plain' );

if( isset( $_REQUEST['title'] ) ) {
	$file_name = 'games/'.preg_replace( '/[\W]/', '', $_REQUEST['title'] ).'.json';
	echo $file_name;
}

if( !is_dir( 'games' ) ) {
	mkdir( 'games' );
	chmod( 'games', 0777 );
}

switch( $_REQUEST['method'] ) {
	case 'save':
		$time = time();
		$save_a = array( 'game_data' => $_POST['data'], 'last_updated' => $time, 'title' => $_POST['title'] );
		file_put_contents( $file_name, json_encode( $save_a ) );
		break;
	case 'get':
		if( file_exists( $file_name ) ) {
			$game_data = json_decode( file_get_contents( $file_name ), true );
			$game_data['time_since_update'] = time() - $game_data['last_updated'];
			echo json_encode( $game_data );
		}
		break;
	case 'list':
		$games = scandir( 'games' );
		print_r( $games );
		break;
	
	default:
		echo 'Please select a method. save, get, list';
}


?>