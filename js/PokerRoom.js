var FONT_SIZE = 75; //text size constant.

var PokerRoom = (function($) {
	// hold games in localStorage
	var games = {},
		gameCount = 0,
		timeOffset = 0,
		bell,
		listEl,
		gameEl,
		topPanel,
		bottomPanel,
		mute = true,
		currentGame,
		onBreak = false,
		controlsTimeout,
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
		if( currentGame ) {
			game = games[currentGame];
			$.post('php/games.php', {method:'sync', games:JSON.stringify([{syncToken:game.syncToken, name:game.name}]), rand:Math.random()}, function(updates) {
				updateGames( JSON.parse(updates) );
				syncTimer = setTimeout( function(){ sync() }, 5000 );
				syncInProgress = false;
			})
		} else {
			var syncGames = {};
			for (var name in games) {
				if (games[name].name ) {
					var gameSyncToken = games[name].syncToken;
					if (gameSyncToken && name) {
						syncGames[name] = gameSyncToken;
					}
				}
			}
			$.post('php/games.php', {method:'sync', syncToken:syncToken, rand:Math.random()}, function(updates) {
				updateList( JSON.parse(updates) );
				syncTimer = setTimeout( function(){ sync() }, 5000 );
				syncInProgress = false;
			})
		}
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
					that.add( game );
				}
			}
	
			var games_a = [];
			for( var name in games ) {
				games[name].wake();
				games_a.push(games[name]);
			}
			var template = $('#templates li.game')[0];
			var bindings = ['name', {key:'element',selector:'.state'}];
			var frag = util.template( template, bindings, games_a, function(el, game) {
				el.addEventListener( 'click', function(e){
					that.showGame(game.name)
					e.stopPropagation();
				}, true);
			});
			listEl.innerHTML = '';
			if (frag.childNodes.length) {
				listEl.appendChild( frag );
			}
			that.resume();
		}
		if (!gameCount) {
			listEl.innerHTML = '<li>No games in progress. You may start one below.</li>';		
		}
	},
	updateGames = function( updates ) {
		for( var name in updates ) {
			var update = updates[name];
			if (games[name]) {
				games[name].update( update );
			}
		}
	},
	addBreak = function(next) {
		games[currentGame].addBreak(next);
	},
	keyControl = function(e) {
		var key = String.fromCharCode(e.charCode||e.which).toLowerCase();
		switch( key ) {
			case 'b':
				addBreak(0);
				break;
			case 'n':
				addBreak(1);
				break;
			default:
				showControls();
				return;
		}
		e.preventDefault();
	},
	showControls = function() {
		curtain$.hide();
		if (controlsTimeout) {
			clearInterval(controlsTimeout);
		}
		if (!onBreak) {
			$('.control').stop().animate({opacity:'1'}, 150);
			controlsTimeout = setTimeout( hideControls, 2000 );
		}
	},
	hideControls = function() {
		clearInterval(controlsTimeout);
		$('.control').stop().animate({opacity:'0'}, 'slow', function() {
			curtain$.show();
		});
	};
	
	$(document).ready(function(){
		$.get('php/time.php', {rand:Math.random()}, function(data) {
			var serverTime = parseInt(data,10);
			if (serverTime) {
				timeOffset = serverTime - Date.now();
			}
		});
		bell = getElementById('bell');
		listEl = getElementById('game_list');
		gameEl = getElementById('game');
		
		topPanel = $('#panels .top')[0];
		bottomPanel = $('#panels .bottom')[0];
		
		curtain$ = $('#curtain').click( function(e) {
			e.stopPropagation();
			e.stopBubble = true;
			showControls();
		});
		
		$('#break_now')[0].addEventListener('click', function(e){
			e.preventDefault();
			addBreak(0);
		}, false);

		
		$('#break_next')[0].addEventListener( 'click', function(e){
			e.preventDefault();
			addBreak(1);
		}, false);
		
		hideControls();
		document.addEventListener( 'keydown', keyControl, true );
		if (!window.Touch) {
			document.addEventListener( 'mousemove', showControls, true );
		}
	});
	
	var that = {
		timeOffset: timeOffset,
		update: function(game) {
			if (game) {
				games[game].update();
			} else {
				sync();
			}
			return that;
		},
		suspend: function() {
			clearTimeout(syncTimer);
			syncTimer = false;
			syncSuspended = true;
			return that;
		},
		start: function() {
			syncSuspended = false;
			sync();
			return that;
		},
		resume: function() {
			syncSuspended = false;
			sync();
			return that;
		},
		add: function (blindTime, blinds, p_games, name, breakLength, lastUpdate, p_syncToken) {
			if (typeof blindTime === 'object') {
				//blind time is actually a game.
				var o = blindTime;
				if( o.state ) {
					games[o.name] = new PokerGame( this, o );
					gameCount++;
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
			
			games[name] = new PokerGame( this, state, name, breakLength, lastUpdate, p_syncToken );
			gameCount++;
			return name;
		},
		removeGame: function(name) {
			if (games[name]) {
				gameCount--;
				delete games[name];
				if (name === currentGame || !games[currentGame]) {
					currentGame = null;
					updateList();
				}
			}
		},
		JSON: function() {
			return games.toString();
		},
		list: function() {
			return games;
		},
		move: function( newHome ) {
			if( typeof newHome === 'string' ) {
				newHome = getElementById( newHome );
			}
			newHome.appendChild( container );
			return that;
		},
		ding: function(game) {
			if (!mute && game.hasFocus && bell && bell.play) {
				bell.play();
			}
			return that;
		},
		showGame: function( name ) {
			mute = false;
			if( games[name] ) {
				$('#start').hide();
				$(gameEl).show();
				for( var game in games ) {
					if( game == name ) {
						currentGame = game
						gameEl.appendChild( games[game].element );
						games[game].focus();
						hideControls();
					} else {
						$(games[game]).remove();
						games[game].sleep().blur();
					}
				}
			} else {
				console.error('Tried to load a game that does not exist.');
			}
			return that;
		},
		movePanels: function( place ) {
			topPanel.style.bottom = place+'px';
			bottomPanel.style.top = place+'px';
			return that;
		},
		startBreak: function(game) {
			if (game === currentGame) {
				onBreak = true;
			}
			hideControls();
			return that;
		},
		endBreak: function(game) {
			if (game === currentGame) {
				onBreak = false;
			}
			return that;
		}
	};
	
	return that;

})(jQuery);
