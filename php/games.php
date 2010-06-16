<?php
header( 'content-type: text/plain' );

if( !is_dir( 'games' ) ) {
	mkdir( 'games' );
	chmod( 'games', 0777 );
}
foreach( $_GET as $key => $val ) {
	$_GET[$key] = stripslashes($val);
}
foreach( $_POST as $key => $val ) {
	$_POST[$key] = stripslashes($val);
}
switch( $_REQUEST['method'] ) {
	case 'save':
		$game = json_decode($_POST['game'], true);
		$file_name = name_to_file($game['name']);
		file_put_contents( $file_name, $_POST['game'] );
		echo filemtime( $file_name );
		break;
	
	case 'get':
		$game_data = evaluate_game( name_to_file($_POST['name']) );
		if( $game_data ) {
			echo $game_data;
		} else {
			echo 'game not found';
		}
		break;
		
	case 'sync':
		if( isset( $_POST['games'] ) ) {
			// sync specific games
			$games = json_decode( trim($_POST['games']), true );
			$updates = array();
			foreach( $games as $game ) {
				$file_name = name_to_file( $game['name'] );
				if( file_exists( $file_name ) ) {
					$syncToken = filemtime( $file_name );
					if( $game['syncToken'] <  $syncToken ) {
						$updates[$game['name']] = array(
							'syncToken' => $syncToken,
							'game' => get_game( $file_name )
						);
					}
				}
			}
			echo json_encode($updates);
		} else {
			// sync all games
			$game_files = glob( 'games/*' );
			$games = array();
			$syncToken = time();
			foreach( $game_files as $game_file ) {
				if( filemtime( $game_file ) > $_POST['syncToken'] ) {
					$game_data = evaluate_game( $game_file );
					if( $game_data ) {
						$games[] = $game_data;
					}
				}
			}
			echo json_encode( array( 'games' => $games, 'syncToken' => $syncToken ) );
		}
		break;
	
	default:
		echo 'Please select a method. save, sync, get, list';
}
function evaluate_game( $file_name ) {
	if( file_exists( $file_name ) ) {
		$game_data = get_game( $file_name );
		$now = time()*1000;
		$countdown = $now - $game_data['lastUpdate'];
		foreach( $game_data['state'] as $key => $level ) {
			if( $level['time'] > $countdown ) {
				$countdown = 0;
				break;
			} else {
				$countdown -= $level['time'];
			}
		}
		if( $countdown > 0 ) {
			//the game is over.
			unlink( $file_name );
			$game_data = false;
		} else {
			$game_data['syncToken'] = filemtime( $file_name );
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
function name_to_file( $name ) {
	return 'games/'.preg_replace( '/[\W]/', '', $name ).'.json';
}
function get_game( $file_name ) {
	if( file_exists( $file_name ) ) {
		$game_data = json_decode( file_get_contents( $file_name ), true );
		return $game_data;
	} else {
		return false;
	}
}
function unescape( $s ) {
	return strip_tags( stripslashes( $s ) );
}
?>