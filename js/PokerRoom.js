var FONT_SIZE = 75;

var PokerRoom = (function($) {
	// hold games in localStorage
	var games = {},
		timeOffset = 0,
		syncTimer = false,
		bell,
		listEl,
		gameEl,
		topCurtain,
		bottomCurtain,
		mute = true,
		syncToken = 0,
		currentGame,
		onBreak = false,
		controlsTimeout,
		
	sync = function(timer) {
		clearTimeout( syncTimer );
		
		var sync_a = [];
		for (var name in games) {
			var gameSyncToken = games[name].syncToken;
			// TODO: have this add games that have changes to send to the server
			if (gameSyncToken) {
				sync_a.push( {name:name, syncToken:gameSyncToken} );
			}
		}
		if (sync_a.length) {
			$.post('php/games.php', {method:'sync', games:JSON.stringify( sync_a )}, function(updates) {
				updates = JSON.parse(updates);
				for( var name in updates ) {
					var update = updates[name];
					if (games[name]) {
						games[name].update( update );
					}
				}
				syncTimer = setTimeout( function(){ sync() }, 5000 );
			})
		} else {
			syncTimer = setTimeout( function(){ sync() }, 5000 );
		}
	},
	addBreak = function(next) {
		games[currentGame].addBreak(next);
	},
	keyControl = function(e) {
		var key = ""+String.fromCharCode(e.charCode).toLowerCase();
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
		if (controlsTimeout) {
			clearInterval(controlsTimeout);
		}
		if (!onBreak) {
			$('.control').stop().animate({opacity:'1'}, 'fast');
			controlsTimeout = setTimeout( hideControls, 2000 );
		}
	},
	hideControls = function() {
		clearInterval(controlsTimeout);
		$('.control').stop().animate({opacity:'0'}, 'slow');
	};
	
	$(document).ready(function(){
		$.get('php/time.php', {rand:Math.random()}, function(data) {
			var serverTime = parseInt(data,10);
			if (serverTime) {
				timeOffset = serverTime - Date.now();
			}
			that.listGames();
		});
		bell = getElementById('bell');
		listEl = getElementById('game_list');
		gameEl = getElementById('game');
		
		topCurtain = $('#curtains .top')[0];
		bottomCurtain = $('#curtains .bottom')[0];
		
		$('#break_now').click( function(e){
			e.preventDefault();
			addBreak(0);
		});
		
		$('#break_next').click( function(e){
			e.preventDefault();
			addBreak(1);
		});
		
		document.addEventListener( 'keypress', keyControl, true );
		document.addEventListener( 'mousemove', showControls, true );
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
			return that;
		},
		resume: function() {
			sync();
			return that;
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
			
			games[name] = new PokerGame( this, state, name, breakLength, lastUpdate, p_syncToken );
			
			return name;
		},
		removeGame: function(game) {
			delete games[game.name];
		},
		JSON: function() {
			return games.toString();
		},
		list: function() {
			return games;
		},
		listGames: function() {
			$.getJSON('php/games.php', {method:'list',syncToken:syncToken}, function(p_games) {
				for( var name in p_games ) {
					if( games[name] ) {
						games[name].update(p_games[name]);
					} else {	
						that.add( p_games[name] );
					}
				}
				var games_a = [];
				for( var game in games ) {
					games[game].wake();
					games_a.push(games[game]);
				}
				var template = $('#templates li.game')[0];
				var bindings = ['name', {key:'element',selector:'.state'}];
				var frag = util.template( template, bindings, games_a, function(e, game) {
					$(e).click(function(){that.showGame(game.name)});
				});
				listEl.innerHTML = '';
				listEl.appendChild( frag );
				currentGame = null;
				that.resume();
			});
			return that;
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
						gameEl.appendChild( games[game].element );
						games[game].focus();
						currentGame = game
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
		moveCurtains: function( place ) {
			topCurtain.style.bottom = place+'px';
			bottomCurtain.style.top = place+'px';
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
