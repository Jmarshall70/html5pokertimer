$(document).ready(function() {
	
	$('#new_game_title').val( util.randomWord() );
	$('#show_advanced').bind( 'click', function(){ $('form .advanced').show(); $('form .no-advanced').hide(); });
	$('#hide_advanced').bind( 'click', function(){ $('form .advanced').hide(); $('form .no-advanced').show(); }).click();
	PokerRoom.start();
	//$('#asdf').click( post_game );
	$('form').bind( 'submit', post_game );


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
	PokerRoom.save();
	PokerRoom.showGame(name);
}

var local = {
	'break': 'BREAK',
	clickToRemove: 'Click to Remove'
};

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-16941239-2']);
_gaq.push(['_setDomainName', '.postmodem.net']);
_gaq.push(['_trackPageview']);

setTimeout( (function() { return function() {
		var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
		ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
		var s = document.getElementsByTagName('script')[0];
		s.parentNode.insertBefore(ga, s);
}})(), 3000 );
