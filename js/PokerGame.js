var PokerGame = (function($, util) { 
	
var SIZE_CONSTANT = 16, //text size constant.
controlsFadeTime = 1000, 
bell = (function() {
	var mute = false,
	element = null,
	events = new util.Events(['mute', 'unmute', 'ding']);
	
	$(document).ready(function() {
		element = document.getElementById('bell');
		if (element.play) {
			toggleElement = $('a.bell.button').bind('click', function() {
				bell.toggle();
			});
		} else {
			$(document.body).addClass('mute');
		}
	});
	
	var bell = {
		ding: function() {
			if (!mute && element && element.play) {
				element.play();
			}
			events.trigger('ding');
		},
		mute: function() {
			$(document.body).addClass('mute');
			mute = true;
			events.trigger('mute');
		},
		unmute: function() {
			$(document.body).removeClass('mute');
			mute = false;
			events.trigger('unmute');
		},
		toggle: function() {
			if(mute) {
				bell.unmute();
			} else {
				bell.mute();
			}
		},
		events: events
	};
	
	return bell;
})();

return function PokerGame (PokerRoom, info, state) {
	if (!info.games) {
		console.log('removed because there were no games.');
		return false;
	}
	var game = this;
	var lastUpdate = info.lastUpdate;
	var breakLength = info.breakLength;
	var state = info.state;
	var blinds = info.blinds;
	var games = info.games;
	var blindTime = info.blindTime || 600;
	var infoEl;
	
	game.syncToken = info.syncToken;
	game.name = info.name;
	
	if ($.isArray(info.state)) {
		state = info.state;
	} else {
		blinds = blinds.split(/\n+/g);
		games = games.split(/\n+/g);
		blindTime = util.stringToSeconds(blindTime);
		
		state = [];
		for (var i=0,c=blinds.length; i<c; i++ ) {
			state.push({ time:blindTime, blinds:blinds[i], game: games[i%games.length] });
		}
	}
	if (!lastUpdate) {
		lastUpdate = (new Date).getTime();
	}
	if (!game.syncToken) {
		game.syncToken = 0;
	}
	if (!game.name || typeof game.name !== 'string') {
		game.name = util.randomWord();
	}
	if( !breakLength ) {
		breakLength = blindTime; 
		// use the time from the last blind as the default break length
		// if the game is already on the second level the first one will be zero.
	}
	
	var countInterval;
	var element = createElement('div', 'poker-game');
	var currentLevelEl = null;
	var hasFocus = false;
	var previousDimmerTimer;
	var currentBlindIndex = -1;
	var blindTimeRemaining = 0;
	var defaultLevelHeight;
	var onBreak = false;
	var curtain$;
	var toolbar;
	var hud;
	
	game.element = element;
	
	function count() {
		if (update() && !countInterval) {
			countInterval = setInterval(function(){count();}, 1000);
		}
	}
	function draw(){
		element.innerHTML = '';
		currentLevelEl = null;
		var template = $('#templates .level')[0];
		var binder = [ 'blinds', 'game', {selector:'.time', key:'time', fn:util.secondsToString} ];
		var frag = util.template( template, binder, state );
		element.appendChild( frag );
		currentBlindIndex = -1;
		currentLevelEl = null;
		if( update() ) {
			count();
			return true;
		} else {
			return false;
		}
	}
	function update() {
		var now = (new Date).getTime() + PokerRoom.timeOffset;
		var milliseconds = (now-lastUpdate);
		if ( countInterval && ((blindTimeRemaining-milliseconds) % 1000) > 50 ) {
			// end this timer and start a new one if we're off by more than 1/20 seconds
			clearInterval(countInterval);
			countInterval = null;
			setTimeout( function(){ count(); }, ((blindTimeRemaining-milliseconds) % 1000)  );
		}
		
		lastUpdate = now;
		
		//count
		var previousBlindIndex = currentBlindIndex;
		currentBlindIndex = -1;
		for( var i=0,c=state.length; i<c; i++ ) {
			if( state[i].time ) {
				currentBlindIndex = i;
				break;
			} else {
				var iElement = $(element.childNodes[i]).addClass('played')[0];
				$('.time',iElement).html(util.secondsToString(0));
			}
		}
		if( currentBlindIndex === -1 ) {
			game.remove();
			return false;
		} else {
			blind = state[currentBlindIndex];
			
			while (milliseconds > blind.time) {
				milliseconds -= blind.time;
				blind.time = 0;
				var iElement = $(element.childNodes[currentBlindIndex]).addClass('played')[0];
				$('.time',iElement).html(util.secondsToString(0));
				currentBlindIndex += 1;
				if (currentBlindIndex === state.length) {
					game.remove();
					return false;
				}
				blind = state[currentBlindIndex];
			}
			if (previousBlindIndex !== currentBlindIndex) {
				if( currentLevelEl ) {
					var previousLevel$ = $(currentLevelEl).removeClass('current').addClass('previous played');
					previousDimmerTimer = setTimeout( function() {
						previousLevel$.removeClass('previous');
					}, 90 * 1000);
				}
				
				if (state[currentBlindIndex].blinds === local['break']) {
					onBreak = true;
					$(document.body).addClass('onbreak');
				} else {
					onBreak = false;
					$(document.body).removeClass('onbreak');
				}
				currentLevelEl = element.childNodes[currentBlindIndex];
				if (currentLevelEl) {
					$(currentLevelEl).addClass('current');
				} else {
					// the game is over.
					game.remove();
					return false;
				}
				updateScroll( true, function(){ 
					if( hasFocus ) {
						bell.ding();
					}
				});
			} else if (!currentLevelEl) {
				currentLevelEl = element.childNodes[currentBlindIndex];
			}
			blind.time -= milliseconds;
			blindTimeRemaining = blind.time;
			$('.time',element.childNodes[currentBlindIndex]).html(util.secondsToString(blind.time));
		}
		return true;
	}
	function save() {
		PokerRoom.save();
		if (game.syncToken) {
			sync.run();
		}
	}
	
	var sync = (function() {
		var run = function() {
			$.post('php/games.php', {method:'sync', games:JSON.stringify([{syncToken:game.syncToken, name:name}]), rand:Math.random()}, function(updates) {
				if (syncTimer) {
					clearTimeout(syncTimer);
					updates = JSON.parse(updates);
					if (updates[name]) {
						game.update( updates[name] );
					}
					syncTimer = setTimeout( function(){ run(); }, 30000 );
				}
			})
		
		},
		syncTimer = false,
		
		sync = {
			start: function() {
				syncTimer = true;
				PokerRoom.save();
				$.post('php/games.php', {method:'save',game:game.toString()}, function(data){
					game.syncToken = data;
					$(document.body).addClass('syncing');
					$('.sync-state', infoEl).html('public');
					PokerRoom.save();
					run();
				});
			},
			stop: function() {
				clearTimeout(syncTimer);
				syncTimer = null;
				game.syncToken = null;
				$(document.body).removeClass('syncing');
				$('.sync-state', infoEl).html('private');
			},
			run: function() {
				if (!syncTimer) {
					sync.start();
				} else {
					run();
				}
			}
		}
		return sync;
	})();
	function updateScroll( animate, callback ) {
		if( hasFocus ) {
			var height = currentLevelEl.offsetHeight,
			topOffset = Math.floor( (window.innerHeight || html.clientHeight)/2 - height/2),
			levelTop = currentLevelEl.offsetTop,
			newTop = topOffset-levelTop;
			PokerRoom.movePanels( topOffset+height );
			if( animate ) {
				$(element).stop().animate({'top': newTop}, callback);
			} else {
				$(element).stop().css({ 'top': newTop}, callback);
			}
		}
	}
	function resize() {
		if( hasFocus ) {
			var width = element.offsetWidth;
			var fontSize = width / SIZE_CONSTANT;
			$(element).parent().css({'font-size':fontSize});
			var third_height = Math.floor( element.clientHeight/3 );
			
			if ((window.innerHeight || html.clientHeight) > (currentLevelEl.nextSibling||currentLevelEl.previousSibling).offsetHeight * 3) {
				$(element).addClass('tall');
			} else {
				$(element).removeClass('tall');
			}
			
			updateScroll(false);
		} else {
			console.log( 'not resizing -- no focus' );
		}
	}
	function resizeCallback(){ 
		resize();
	}
	function addBreak(index) {
		state.splice(index, 0, {blinds:local['break'], game:'', time:breakLength});
		draw();
		save();
	}
	function startBreak() {
		addBreak(currentBlindIndex);
		onBreak = true;
	}
	function breakNext() {
		addBreak(currentBlindIndex+1);
	}
	function endBreak() {
		if (onBreak) {
			onBreak = false;
			state.splice(currentBlindIndex, 1);
			draw();
			save();
		}
		
	}
	function toggleBreak() {
		if (onBreak) {
			endBreak();
		} else {
			startBreak();
		}
	}
	function keyControl(e) {
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
	}
	
	var controlsTimeout = null;
	function showControls() {
		curtain$.hide();
		if (controlsTimeout) {
			clearInterval(controlsTimeout);
			controlsTimeout = setTimeout( hideControls, controlsFadeTime );
		} else {
			$(hud).stop().animate({opacity:0.95}, 150);
			controlsTimeout = setTimeout( hideControls, controlsFadeTime );
		}
	}
	function hideControls() {
		clearTimeout(controlsTimeout);
		controlsTimeout = null;
		$(hud).stop().animate({opacity:0}, 'slow', function() {
			curtain$.show();
		});
	}
	function addTime(seconds) {
		state[currentBlindIndex].time += seconds * 1000;
		update();
		save();
	};
	
	game.update = function( updateData ) {
		if (!updateData) {
			$.getJSON('php/games.php', {game:name}, function(data) {
				if( data ) {
					clearTimeout(previousDimmerTimer);
					game.syncToken = data.syncToken;
					lastUpdate = data.lastUpdate;
					state = data.state;
					save();
					draw();
				}
			});
		} else if (updateData.syncToken && updateData.syncToken > game.syncToken) {
			if (updateData.game) {
				state = updateData.game.state;
				lastUpdate = updateData.game.lastUpdate;
			} else {
				state = updateData.state;
				lastUpdate = updateData.lastUpdate;
			}
			game.syncToken = updateData.syncToken;
			draw();
			if (hasFocus) {
				bell.ding();
			}
		}
		return game;
	};
	game.remove = function() {
		$(element).remove();
		clearInterval(countInterval);
		countInterval = false;
		PokerRoom.removeGame(game.name);
	};
	game.sleep = function() {
		clearInterval(countInterval);
		countInterval = false;
		return game;	
	};
	game.wake = function() {
		count();
		return game;
	};
	game.focus = function() {
		toolbar = $('#toolbar')[0];
		hud = $('#hud')[0];
		
		/////////////////////////////////////////
		// fill in game info
		
		infoEl = $('#info')[0];
		
		$('.blinds', infoEl).html(util.secondsToString(blindTime)+' blinds');
		$('.games', infoEl).html(games.join('<br>')).css({'font-size':(100/games.length)+'%'});
		
		if (game.syncToken) {
			$('.sync-state', infoEl).html('public');
		} else {
			$('.sync-state', infoEl).html('private');
		}
		$('.name', infoEl).html(game.name);
		
		curtain$ = $('#curtain').bind('click', function(e) {
			showControls();
			return false
		});
		
		$('a.break.button', hud).bind('click', function(e){
			toggleBreak();
			hideControls();
		});
		$('a.break-next.button', hud).bind('click', function(e){
			breakNext();
			hideControls();
		});
		
		$('a.sync.button', hud).bind('click', function(e) {
			e.preventDefault();
			sync.run();
		});
		$('a.advance.button', hud).bind('click', function(e) {
			e.preventDefault();
			addTime(30);
		});
		$('a.goback.button', hud).bind('click', function(e) {
			e.preventDefault();
			addTime(-30);
		});
		$(toolbar).bind('click', function() {
			//hideControls();
		});
		
		hideControls();
		$(document).bind('keydown', keyControl);
		if (!window.Touch) {
			$(document.body).bind('mousemove', showControls);
			$(hud).bind('mouseover', function() { controlsFadeTime = 5000 });
			$(hud).bind('mouseout', function() { controlsFadeTime = 1000 });
		} else {
			controlsFadeTime = 5000;
		}
		game.hasFocus = hasFocus = true;
		game.wake();
		update();
		resize();
		$(window).bind('resize', resizeCallback);
		
		if (game.syncToken) {
			sync.start();
		}
		
		return game;
	};
	game.blur = function() {
		//game.hasFocus = hasFocus = false;
		//$(window).unbind( 'resize', resizeCallback );
		return game;
	};
	game.toString = function() {
		if (game.toJSON) {
			return JSON.stringify(game.toJSON());
		} else {
			return false;
		}
	};
	game.toJSON = function() {
		return {
			lastUpdate: lastUpdate,
			breakLength: breakLength,
			name: game.name,
			state: state,
			syncToken: game.syncToken,
			games: games,
			blindTime: blindTime,
			
		};
	};
	game.resize = function(animate) {
		resize(animate);
		return game;
	};
	game.redraw = function() {
		draw();
		return game;
	};
	
	if (game.__defineGetter__) {
		//game.__defineGetter__( 'syncToken', function(){return syncToken;} );
		//game.__defineGetter__( 'element', function(){return element;} );
		//game.__defineGetter__( 'name', function(){return name;} );
		//game.__defineGetter__( 'hasFocus', function(){return hasFocus;} );
	}	
	
	var stillGood = draw();
	if (stillGood) {
		return game;
	} else {
		return false;
	}
}

})(jQuery, util)