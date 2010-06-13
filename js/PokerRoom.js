var PokerRoom = (function($, localStorage) {
	// hold games in localStorage
	var games = [],
		timeOffset = 0,
		bell,
		container = createElement('div', 'poker-room'),
		elementsToAdd = [],
	updateFromServer = function() {
		// get game names and last update token
		// check them against what's on the server, update if needed
	},
	saveGames = function() {
		localStorage.setItem('PokerGames',games);
	};
	
	$.get('php/time.php', function(data) {
		var serverTime = parseInt(data,10);
		if (serverTime) {
			timeOffset = serverTime - Date.now();
		}
	});
	
	$(document).ready(function(){
		bell = getElementById('bell');
		if( elementsToAdd ) {
			elementsToAdd.forEach(function( element, i ) {
				container.appendChild(element);
			});
		}
	});
	
	return {
		timeOffset: timeOffset,
		update: function(game) {
			if (game) {
			}
		},
		add: function (blindTime, blinds, p_games, name, breakLength) {
			if (typeof blindTime === 'string') {
				blindTime = util.formValue( blindTime );
				blindTime = util.stringToSeconds(blindTime);
			}
			if (typeof blinds === 'string') {
				blinds = util.formValue( blinds );
				blinds = blinds.split(/\n|\r|\t/);
			}
			if (typeof p_games === 'string') {
				p_games = util.formValue( p_games );
				p_games = p_games.split(/\n|\r|\t/);
			}
			if (!breakLength) {
				breakLength = blindTime;
			}
			var gamesLength = p_games.length;
			var state = [];
			for (var i=0,c=blinds.length; i<c; i++ ) {
				state.push({ time:blindTime, blinds:blinds[i], game: p_games[i%gamesLength] });
			}
			
			if (name) {
				name = util.formValue(name);
			} else {
				name = util.randomWord();
			}
			var newGame = PokerGame( this, state, breakLength, name, Date.now() );
			games.push(newGame);
			container.appendChild(newGame.element);
			saveGames();
		},
		removeGame: function(game) {
			var i = games.indexOf(game);
			if (i != -1) {
				games.splice(i,1);
			}
			game = null;
		},
		JSON: function() {
			return games.toString();
		},
		listGames: function() {
			return games;
		},
		move: function( newHome ) {
			if( typeof newHome === 'string' ) {
				newHome = getElementById( newHome );
			}
			newHome.appendChild( container );
		},
		ding: function() {
			if (bell && bell.play) {
				bell.play();
			}
		}
		
	};

})(jQuery, localStorage);
