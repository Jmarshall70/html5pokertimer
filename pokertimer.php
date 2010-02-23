<?php
header( 'content-type: text/plain' );

if( isset( $_REQUEST['title'] ) ) {
	$file_name = preg_replace( '/[\W]/', '', $_REQUEST['title'] ).'.json';
}

if( !is_dir( 'games' ) ) {
	mkdir( 'games' );
	chmod( 'games', 0777 );
}

switch( $_REQUEST['method'] ) {
	case 'save':
		$time = time();
		$save_a = array( 
						'level_data' => json_decode( unescape( $_POST['data'] ) ), 
						'last_updated' => $time, 
						'title' => unescape( $_POST['title'] ) 
						);
		file_put_contents( 'games/'.$file_name, json_encode( $save_a ) );
		break;
	case 'get':
		$game_data = evaluate_game( $file_name );
		if( $game_data ) {
			echo json_encode( $game_data );
		} else {
			echo $file_name.' not found';
		}
		break;
	case 'list':
		$game_files = array_filter( scandir( 'games' ), is_json );
		$games = array();
		foreach( $game_files as $game_file ) {
			$game_data = evaluate_game( $game_file );
			if( $game_data ) {
				$games[] = $game_data;
			}
		}
		echo json_encode( $games );
		break;
	
	default:
		echo 'Please select a method. save, get, list';
}
function evaluate_game( $file_name ) {
	if( file_exists( 'games/'.$file_name ) ) {
		$game_data = get_game( 'games/'.$file_name );
		$countdown = $game_data['time_since_update'];
		foreach( $game_data['level_data'] as $key => $level ) {
			$seconds = string_to_seconds( $level[0] );
			if( $seconds > $countdown ) {
				// set this level to the level time minus the time remaining time since the last update
				$game_data['current_level'] = $key;
				$game_data['level_data'][$key][0] = $game_data['current_time'] = seconds_to_string( $seconds - $countdown );
				$countdown = 0;
				break;
			} else {
				$game_data['level_data'][$key][0] = '0:00';
				$countdown -= $seconds;
			}
		}
		if( $countdown > 0 ) {
			//the game is over.
			unlink( 'games/'.$file_name );
			$game_data = false;
		}
	} else {
		$game_data = false;
	}
	return $game_data;
}
function is_json( $file_name ) {
	return preg_match( '/\\.json$/', $file_name );
}
function string_to_seconds( $time_s ) {
	$time_a = explode( ':', $time_s );
	$seconds = intval($time_a[0]*60) + intval($time_a[1]);
	return $seconds;
}
function seconds_to_string( $seconds ) {
	$minutes = floor( $seconds / 60 );
	$seconds = $seconds % 60;
	return $minutes.':'.str_pad( $seconds, 2, '0', STR_PAD_LEFT );
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
function unescape( $s ) {
	return strip_tags( stripslashes( $s ) );
}
?>