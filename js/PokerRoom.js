var FONT_SIZE = 75;

var PokerRoom = (function($, localStorage) {
	// hold games in localStorage
	var games = {},
		timeOffset = 0,
		syncTimer = true,
		bell,
		listEl,
		gameEl,
		elementsToAdd = [],
		mute = true,
		
	sync = function() {
		var sync_a = [];
		for (var name in games) {
			var syncToken = games[name].syncToken;
			if (syncToken) {
				sync_a.push( {name:name, token:syncToken} );
			}
		}
		if (sync_a.length) {
			$.get('php/games.php', {method:'sync', games:JSON.stringify( sync_a )}, function(data) {
				if (syncTimer) {
					var updates = JSON.parse( data );
					for( var i=0,c=updates.length; i<c; i++ ) {
						var update = updates[i];
						if (games[update.name]) {
							games[update.name].update( update );
						}
					}
					syncTimer = setTimeout( function(){ sync() }, 5000 );
				}
			})
		} else {
			syncTimer = setTimeout( function(){ sync() }, 5000 );
		}
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
		listEl = getElementById('game_list');
		gameEl = getElementById('game');
	});
	
	var that = {
		timeOffset: timeOffset,
		update: function(game) {
			if (game) {
				games[game].update();
			} else {
				sync();
			}
		},
		suspend: function() {
			clearTimeout(syncTimer);
			syncTimer = false;
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
			games[name] = newGame;
			//container.appendChild(newGame.element);
			saveGames();
			
			return name;
		},
		removeGame: function(game) {
			delete games[game.name];
		},
		JSON: function() {
			return games.toString();
		},
		listGames: function() {
			
		},
		move: function( newHome ) {
			if( typeof newHome === 'string' ) {
				newHome = getElementById( newHome );
			}
			newHome.appendChild( container );
		},
		ding: function(game) {
			if (!mute && game.hasFocus && bell && bell.play) {
				bell.play();
			}
		},
		showGame: function( name ) {
			mute = false;
			if( games[name] ) {
				$('#start').hide();
				$(gameEl).show();
				for( var game in games ) {
					if( game == name ) {
						gameEl.appendChild( games[game].element );
						games[game].wake().focus();
					} else {
						$(games[game]).remove();
						game.sleep().blur();
					}
				}
			} else {
				console.error('Tried to load a game that does not exist.');
			}
		}
	};
	
	sync();
	
	return that;

})(jQuery, localStorage);
