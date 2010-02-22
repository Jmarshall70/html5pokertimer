<?php
header( 'content-type: text/plain' );

if( isset( $_REQUEST['title'] ) ) {
	$file_name = 'games/'.preg_replace( '/[\W]/', '', $_REQUEST['title'] ).'.json';
}

if( !is_dir( 'games' ) ) {
	mkdir( 'games' );
	chmod( 'games', 0777 );
}

switch( $_REQUEST['method'] ) {
	case 'save':
		$time = time();
		print_r( $_POST );
		$save_a = array( 'level_data' => json_decode( $_POST['data'] ), 'last_updated' => $time, 'title' => $_POST['title'] );
		file_put_contents( $file_name, json_encode( $save_a ) );
		break;
	case 'get':
		$game_data = get_game( $file_name );
		if( $game_data ) {
			$game_data = json_decode( file_get_contents( $file_name ), true );
			$game_data['time_since_update'] = time() - $game_data['last_updated'];
			echo json_encode( $game_data );
		} else {
			echo $file_name.' not found';
		}
		break;
	case 'list':
		$game_files = array_filter( scandir( 'games' ), is_json );
		$games = array();
		foreach( $game_files as $game_file ) {
			$game_data = get_game( 'games/'.$game_file );
			$countdown = $game_data['time_since_updated'];
			foreach( $game_data['level_data'] as $key => $level ) {
				$seconds = string_to_seconds( $level[0] );
				if( $seconds > $countdown ) {
					// set this level to the level time minus the time remaining time since the last update
					$game_data['current_level'] = $key;
					$games[] = $game_data;
					$countdown = 0;
				} else {
					$game_data['level_data'][$key][1] = '0:00';
					$seconds -= $countdown;
				}
			}
			if( $countdown > 0 ) {
				//the game is over.
				unlink( 'games/'.$game_file );
			}
		}
		echo json_encode( $games );
		break;
	
	default:
		echo 'Please select a method. save, get, list';
}

function is_json( $file_name ) {
	return preg_match( '/\\.json$/', $file_name );
}
function string_to_seconds( $time_s ) {
	$time_a = explode( ':', $time_s );
	$seconds = intval($time_a[0]*60) + intval($time_a[1]);
	return $seconds;
}
function get_game( $file_name ) {
	if( file_exists( $file_name ) ) {
		$game_data = json_decode( file_get_contents( $file_name ), true );
		$game_data['time_since_update'] = time() - $game_data['last_updated'];
		return $game_data;
	} else {
		return false;
	}
}

?>