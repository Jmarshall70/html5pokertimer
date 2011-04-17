$(document).ready(function() {
	var blindTimeInput = getElementById('blind_time'),
	blindsInput = getElementById('blinds'),
	gamesInput = getElementById('games'),
	
	post_game = function(e) {
		
		var newGame = {
			'blindTime': blindTimeInput.value,
			'blinds': blindsInput.value,
			'games': gamesInput.value,
			'name': getElementById('new_game_title').value
		};
		
		localStorage.removeItem('lastGame');
		localStorage.setItem('lastGame', JSON.stringify(newGame));
		window.newGame = newGame;
		
		var name = PokerRoom.add( newGame );
		PokerRoom.save();
		PokerRoom.showGame(name);
		
		return false;
	},
	lastGame;
	
	try {
		lastGame = JSON.parse(localStorage.getItem('lastGame'))
	} catch(e) {}
	if (lastGame) {
		blindTimeInput.value = lastGame.blindTime;
		blindsInput.value = lastGame.blinds;
		gamesInput.value = lastGame.games;
		$('#restore_last').bind('click', function(){
			blindTimeInput.value = lastGame.blindTime;
			blindsInput.value = lastGame.blinds;
			gamesInput.value = lastGame.games;
		});
	} else {
		$('#restore_last').hide();
	}
	
	
	$('#new_game_title').val( util.randomWord() );
	$('#show_advanced').bind( 'click', function(){ $('.advanced').show(); $('.no-advanced').hide(); });
	$('#hide_advanced').bind( 'click', function(){ $('.advanced').hide(); $('.no-advanced').show(); }).click();
	
	$('#restore_defaults').bind('click', function(){
		blindTimeInput.value = blindTimeInput.defaultValue;
		blindsInput.value = blindsInput.defaultValue;
		gamesInput.value = gamesInput.defaultValue;
	});
	
	
	$('#new_game').bind( 'click', post_game );
	
});

$(document).bind('click', function(e){
	if (e.target.nodeName === 'A' && e.target.href.substr(e.target.href.length-1) === '#') {
		e.preventDefault();
		return false;
	}
});

var local = {
	'break': 'BREAK',
	clickToRemove: 'Click to Remove'
};

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-16941239-2']);
_gaq.push(['_setDomainName', '.postmodem.net']);
_gaq.push(['_trackPageview']);

(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
