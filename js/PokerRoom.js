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
				var serverGames = updates.games;
				syncToken = updates.syncToken;
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
				}
				updateList();
			}
			syncTimer = setTimeout( function(){ sync() }, 60000 );
			syncInProgress = false;
		});
	},
	updateList = function( syncResult ) {		
		var sharedGames_a = [], localGames_a = [], sharedGameCount = 0;
		for( var name in games ) {
			if (games.hasOwnProperty(name) && games[name]) {
				games[name].wake();
				if (games[name] && games[name].syncToken) {
					sharedGameCount += 1;
					sharedGames_a.push(games[name]);
				} else if (games[name]) {
					localGames_a.push(games[name]);
				}
			}
		}
		if (sharedGameCount === 0) {
			sharedListEl.innerHTML ='<li>No shared games in progress.</li>';		
		}
		var template = $('#templates li.game')[0];
		var bindings = ['name', {key:'element',selector:'.state'}];
		var sharedFrag = util.template( template, bindings, sharedGames_a, function(el, game) {
			$(el).bind( 'click', function(e){
				room.showGame(game.name)
			});
		});
		if (sharedFrag.childNodes.length) {
			sharedListEl.innerHTML = '';
			sharedListEl.appendChild( sharedFrag );
		}
		
		var localFrag = util.template( template, bindings, localGames_a, function(el, game) {
			$(el).bind('click', function(e){
				room.showGame(game.name)
			});
		});
		if (localFrag.childNodes.length) {
			localListEl.innerHTML = '';
			localListEl.appendChild( localFrag );
		} else {
			localListEl.innerHTML = '<li>No games in progress.</li>';
		}
		
		room.resume();
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
			//room.save();
			return room;
		},
		resume: function() {
			syncSuspended = false;
			sync();
			return room;
		},
		add: function (info) {
			/*
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
			}*/
			
			var newGame = new PokerGame( this, info );
			if (!newGame) {
				return false;
			} else {
				games[newGame.name] = newGame;
				return newGame.name;
			}
		},
		removeGame: function(name) {
			if (games[name]) {
				games[name] = null;
				delete games[name];
				room.save();
			}
			return room;
		},
		save: function() {
			localStorage.removeItem('PokerGames');
			localStorage.setItem('PokerGames', JSON.stringify( room.toArray() ) );
			return room;
		},
		toArray: function() {
			var games_a = [];
			for (var name in games) {
				if (games.hasOwnProperty(name) && games[name]) {
					games_a.push( games[name] );
				}
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
				$('#start').css({display: 'none'});
				$(gameEl).show();
				for( var game in games ) {
					if (games.hasOwnProperty(game)) {
						if( game === name ) {
							currentGame = game
							gameEl.appendChild( games[game].element );
							games[game].focus();
							room.suspend();
						} else if (games[game]) {
							//$(games[game]).remove();
							games[game].sleep().blur();
						}
					}
				}
				room.suspend();
			} else {
				console.error('Tried to load "'+name+'", which does not exist.');
			}
			return room;
		},
		movePanels: function( place ) {
			$(topPanel).css( 'bottom', place);
			$(bottomPanel).css( 'top', place);
			return room;
		}
	};	
	return room;

})(jQuery);
