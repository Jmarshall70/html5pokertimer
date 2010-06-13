$(document).ready(function() {
	
	$('#new_game_title').val( util.randomWord() );

	
	PokerRoom.add( 'blind_time', 'blinds', 'games', 'new_game_title' );
	PokerRoom.move('poker_games');
	
	
});