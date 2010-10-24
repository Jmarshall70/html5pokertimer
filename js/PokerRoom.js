var PokerRoom = (function($) {
	// hold games in localStorage
	var games = {},
		timeOffset = 0,
		sharedListEl,
		localListEl,
		gameEl,
		topPanel,
		bottomPanel,
		mute = true,
		currentGame,
		onBreak = false,
		syncInProgress = false,
		syncTimer = false,
		syncSuspended = false,
		curtain$,
		syncToken = 0, //this is the syncToken for the game list
		
	sync = function() {
		if (syncInProgress || syncSuspended) {
			return;
		}
		clearTimeout( syncTimer );
		syncInProgress = true;
		$.post('php/games.php', {method:'sync', syncToken:syncToken, rand:Math.random()}, function(updates) {
			updates = JSON.parse(updates);
			if(updates.syncToken) {
				updateList( updates );
			}
			syncTimer = setTimeout( function(){ sync() }, 5000 );
			syncInProgress = false;
		})
	},
	updateList = function( syncResult ) {
		var serverGames = syncResult.games;
		syncToken = syncResult.syncToken;
		
		if (serverGames.length) {
			
			for( var i=0,c=serverGames.length; i<c; i++ ) {
				var game = serverGames[i];
				if (games[game.name]) {
					games[game.name].update( game );
				} else {
					room.add( game );
				}
			}
			room.save();
		} else {
			sharedListEl.innerHTML ='<li>No shared games in progress.</li>';		
		}
		
		var sharedGames_a = [], localGames_a = [];
		for( var name in games ) {
			if (games.hasOwnProperty(name)) {
				games[name].wake();
				if (games[name].syncToken) {
					sharedGames_a.push(games[name]);
				} else {
					localGames_a.push(games[name]);
				}
			}
		}
		var template = $('#templates li.game')[0];
		var bindings = ['name', {key:'element',selector:'.state'}];
		var sharedFrag = util.template( template, bindings, sharedGames_a, function(el, game) {
			el.addEventListener( 'click', function(e){
				room.showGame(game.name)
				e.stopPropagation();
			}, true);
		});
		sharedListEl.innerHTML = '';
		if (sharedFrag.childNodes.length) {
			sharedListEl.appendChild( sharedFrag );
		}
		
		var localFrag = util.template( template, bindings, localGames_a, function(el, game) {
			el.addEventListener( 'click', function(e){
				room.showGame(game.name)
				e.stopPropagation();
			}, true);
		});
		if (localFrag.childNodes.length) {
			localListEl.innerHTML = '';
			localListEl.appendChild( localFrag );
		} else {
			localListEl.innerHTML = '<li>No games in progress.</li>';
		}
		
		room.resume();
	},
	updateGames = function( updates ) {
		for( var name in updates ) {
			var update = updates[name];
			if (games[name]) {
				games[name].update( update );
			}
		}
	},
	loadLocalGames = function() {
		var games_a = JSON.parse( localStorage.getItem( 'PokerGames' ) || '[]' );
		for (var i=0,c=games_a.length; i < c; i++) {
			if (games_a[i].state) {
				room.add( games_a[i] );
			}
		}
		room.save();
	}
	;
	
	$(document).ready(function(){
		sharedListEl = getElementById('shared_games');
		localListEl = getElementById('local_games');
		gameEl = getElementById('game');
		
		topPanel = $('#panels .top')[0];
		bottomPanel = $('#panels .bottom')[0];		
		
	});
	$(window).bind('load', function() {
		var rand = Math.random();
		$.get('php/time.php', {rand:rand}, function(data) {
			var requestEndTime = new Date(),
			serverTime = parseInt(data,10);
			if (serverTime) {
				room.timeOffset = timeOffset = serverTime - requestEndTime;
			}
		});
	});
	
	var room = {
		timeOffset: timeOffset,
		update: function(game) {
			if (game) {
				games[game].update();
			} else {
				sync();
			}
			return room;
		},
		suspend: function() {
			clearTimeout(syncTimer);
			syncTimer = false;
			syncSuspended = true;
			return room;
		},
		start: function() {
			syncSuspended = false;
			loadLocalGames();
			sync();
			room.save();
			return room;
		},
		resume: function() {
			syncSuspended = false;
			sync();
			return room;
		},
		add: function (blindTime, blinds, p_games, name, breakLength, lastUpdate, p_syncToken) {
			if (typeof blindTime === 'object') {
				//blind time is actually a game.
				var o = blindTime;
				if( o.state ) {
					games[o.name] = new PokerGame( this, o );
					return o.name;
				}
				blindTime = o.blindTime;
				blinds = o.blinds;
				p_games = o.games;
				name = o.name;
				lastUpdate = o.lastUpdate;
				p_syncToken = o.syncToken;
			}
			if (typeof blindTime === 'string') {
				blindTime = util.stringToSeconds(blindTime);
			}
			if (typeof blinds === 'string') {
				blinds = blinds.split(/\n|\r|\t/);
			}
			if (typeof p_games === 'string') {
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
			
			if (!name) {
				name = util.randomWord();
			}
			var newGame = new PokerGame( this, state, name, breakLength, lastUpdate, p_syncToken );
			if (!newGame) {
				return false;
			} else {
				games[name] = newGame;
				return name;
			}
		},
		removeGame: function(name) {
			console.log( 'removing '+name );
			if (games[name]) {
				delete games[name];
				if (name === currentGame || !games[currentGame]) {
					currentGame = null;
					updateList();
				}
			}
			room.save();
			return room;
		},
		save: function() {
			localStorage.setItem('PokerGames', JSON.stringify( room.toArray() ) );
			return room;
		},
		toArray: function() {
			var games_a = [];
			for (name in games) {
				games_a.push( games[name] );
			}
			return games_a
		},
		list: function() {
			return games;
		},
		move: function( newHome ) {
			if( typeof newHome === 'string' ) {
				newHome = getElementById( newHome );
			}
			newHome.appendChild( container );
			return room;
		},
		showGame: function( name ) {
			mute = false;
			if( games[name] ) {
				$('#start').hide();
				$(gameEl).show();
				for( var game in games ) {
					if (games.hasOwnProperty(game)) {
						if( game === name ) {
							currentGame = game
							gameEl.appendChild( games[game].element );
							games[game].focus();
							room.suspend();
						} else if (games[game]) {
							$(games[game]).remove();
							games[game].sleep().blur();
						}
					}
				}
				room.suspend();
			} else {
				console.error('Tried to load a game that does not exist.');
			}
			return room;
		},
		movePanels: function( place ) {
			topPanel.style.bottom = place+'px';
			bottomPanel.style.top = place+'px';
			return room;
		}
	};	
	return room;

})(jQuery);
