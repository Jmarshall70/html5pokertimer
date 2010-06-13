$(document).ready(function() {
	
	$('#new_game_title').val( util.randomWord() );
	
	$('#asdf').click( post_game );
	//$('form').bind( 'submit', post_game )	
});


function post_game( e ) {
	
	var name = PokerRoom.add( 'blind_time', 'blinds', 'games', 'new_game_title' );
	PokerRoom.showGame(name);
}
