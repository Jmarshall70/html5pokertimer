var PokerRoom = (function($) {
	// hold games in localStorage
	var games = {},
	timeOffset = 0,
	sharedListEl,
	localListEl,
	gameEl,
	mute = true,
	currentGame,
	onBreak = false,
	syncInProgress = false,
	syncTimer = false,
	syncSuspended = false,
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
		var template = $('#templates li.game')[0];
		var bindings = ['name', {key:'element',selector:'.state'}];
		
		if (sharedGameCount === 0) {
			$('.tabs .public').hide();
			sharedListEl.innerHTML ='<li>No shared games in progress.</li>';		
		} else {
			$('.tabs .public').show();
			var sharedFrag = util.template( template, bindings, sharedGames_a, function(el, game) {
				$(el).bind( 'click', function(e){
					room.showGame(game.name)
				});
			});
			if (sharedFrag.childNodes.length) {
				sharedListEl.innerHTML = '';
				sharedListEl.appendChild( sharedFrag );
			}
		}
		
		if (localGames_a.length) {
			$('.tabs .local').show();
			localListEl.innerHTML = '';
			var localFrag = util.template( template, bindings, localGames_a, function(el, game) {
				$(el).bind('click', function(e){
					room.showGame(game.name)
				});
			});
			localListEl.appendChild( localFrag );
		} else {
			$('.tabs .local').hide();
			localListEl.innerHTML = '<li>No games in progress.</li>';
		}
		
		room.resume();
	},
	loadLocalGames = function() {
		var games_a = JSON.parse( localStorage.getItem( 'PokerGames' ) || '[]' ),
		foundOne = false;
		for (var i=0,c=games_a.length; i < c; i++) {
			if (games_a[i].state) {
				var gameName = room.add( games_a[i] );
				foundOne = !games[gameName].syncToken || foundOne;
			}
		}
		if (foundOne) {
			$('.tab-content .local').show();
			$('.tabs > *').removeClass('selected')
			$('.tabs .local').addClass('selected');
		} else {
			$('.tab-content .new-game').show();
			$('.tabs > *').removeClass('selected')
			$('.tabs .new-game').addClass('selected');
		}
		room.save();
	}
	;
	
	$(document).ready(function(){
		sharedListEl = getElementById('shared_games');
		localListEl = getElementById('local_games');
		gameEl = getElementById('game');
		
		var tabs = $('.tabs')[0],
		tabContent = $('.tab-content')[0];
		
		$(tabs.children).each(function(i, el) {
			$(el).bind('click', function() {
				$(tabContent.children).hide()
				$(tabContent.children[i]).show()
				$(tabs.children).removeClass('selected');
				$(el).addClass('selected');
			});
		});
		
	});
	// onload to make sure nothing else is hogging the network (from this window, at least.)
	$(window).bind('load', function() {
		var rand = Math.random();
		$.get('php/time.php', {rand:rand}, function(data) {
			var requestEndTime = new Date(),
			serverTime = parseInt(data,10);
			if (serverTime) {
				room.timeOffset = timeOffset = serverTime - requestEndTime;
			}
			room.start();
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
							_gaq.push(['_trackEvent', 'game', 'start']);
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
		}
	};	
	return room;

})(jQuery);
