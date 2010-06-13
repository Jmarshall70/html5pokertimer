$(document).ready(function() {
	
	$('#new_game_title').val( util.randomWord() );
	
	//$('#asdf').click( post_game );
	$('form').bind( 'submit', post_game )	
});


function post_game( e ) {
	
	e.preventDefault();
	e.stopPropagation();
	e.stopBubble = true;
	
	var newGame = {
		'blindTime': getElementById('blind_time').value,
		'blinds': getElementById('blinds').value,
		'games': getElementById('games').value,
		'name': getElementById('new_game_title').value
	};
	var name = PokerRoom.add( newGame );
	PokerRoom.showGame(name);
}
