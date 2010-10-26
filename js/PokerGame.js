var PokerGame = (function($, util) { 
	
var SIZE_CONSTANT = 16, //text size constant.
bell = (function() {
	var mute = false,
	element = null,
	events = new util.Events(['mute', 'unmute', 'ding']);
	
	$(document).ready(function() {
		element = document.getElementById('bell');
		toggleElement = $('#toolbar a.bell').bind('click', function() {
			bell.toggle();
		});
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
})()
return function PokerGame (PokerRoom, state, name, breakLength, lastUpdate, syncToken) {
	
	if ( !$.isArray(state) && typeof state === 'object') {
		syncToken = state.syncToken;
		lastUpdate = state.lastUpdate;
		breakLength = state.breakLength;
		name = state.name;
		state = state.state;
	}
	if( !$.isArray(state)) {
		console.error( 'state is not an array!' );
		return false;
	}
	if (!lastUpdate) {
		lastUpdate = Date.now();
	}
	if (!syncToken) {
		syncToken = 0;
	}
	if (!name || typeof name != 'string') {
		name = util.randomWord();
	}
	if( !breakLength ) {
		breakLength = state[state.length-1].time; 
		// use the time from the last blind as the default break length
		// if the game is already on the second level the first one will be zero.
	}
	var countInterval,
	element = createElement('div', 'poker-game'),
	currentLevelEl = null,
	hasFocus = false,
	previousDimmerTimer,	
	currentBlindIndex = -1,
	blindTimeRemaining = 0,
	defaultLevelHeight,
	onBreak = false,
	curtain$,
	
	count = function() {
		if (!countInterval) {
			countInterval = setInterval(function(){count();}, 1000);
		}
		update();
	},
	draw = function(){
		element.innerHTML = '';
		currentLevelEl = null;
		var template = $('#templates .level')[0];
		var binder = [ 'blinds', 'game', {selector:'.time', key:'time', fn:util.secondsToString} ];
		var frag = util.template( template, binder, state, function(el,game,i) {
		} );
		element.appendChild( frag );
		currentBlindIndex = -1;
		currentLevelEl = null;
		update();
	},
	update = function() {
		var now = Date.now() + PokerRoom.timeOffset;
		var milliseconds = (now-lastUpdate);
		if ( countInterval && ((blindTimeRemaining-milliseconds) % 1000) > 50 ) {
			// end this timer and start a new one if we're off by more than 1/20 seconds
			clearInterval(countInterval);
			countInterval = null;
			setTimeout( function(){ count(); }, ((blindTimeRemaining-milliseconds) % 1000)  );
		}
		
		if (milliseconds < 500 && currentLevelEl) {
			return;
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
				var iElement = $(element.childNodes[i]).addClass('played')[0]
				$('.time',iElement).html(util.secondsToString(0));
			}
		}
		if( currentBlindIndex === -1 ) {
			game.remove();
			game = null;
		} else {
			blind = state[currentBlindIndex];
			
			while (milliseconds > blind.time) {
				milliseconds -= blind.time;
				blind.time = 0;
				var iElement = $(element.childNodes[currentBlindIndex]).addClass('played')[0]
				$('.time',iElement).html(util.secondsToString(0));
				currentBlindIndex += 1;
				if (currentBlindIndex == state.length) {
					game.remove();
					game = null;
					return;
				}
				blind = state[currentBlindIndex];
			}
			if (previousBlindIndex != currentBlindIndex) {
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
				}
				updateScroll( true, function(){bell.ding();} );
			} else if (!currentLevelEl) {
				currentLevelEl = element.childNodes[currentBlindIndex];
			}
			blind.time -= milliseconds;
			blindTimeRemaining = blind.time;
			$('.time',element.childNodes[currentBlindIndex]).html(util.secondsToString(blind.time));
		}
	},
	save = function() {
		PokerRoom.save();
		if (syncToken) {
			$.post('php/games.php', {method:'save',game:game.toString()}, function(data){
				syncToken=data;
				PokerRoom.save();
			});
		}
	},
	sync = (function() {
		var run = function() {
			$.post('php/games.php', {method:'sync', games:JSON.stringify([{syncToken:syncToken, name:name}]), rand:Math.random()}, function(updates) {
				if (syncTimer) {
					var updates = JSON.parse(updates);
					if (updates[name]) {
						game.update( updates[name] );
					}
					syncTimer = setTimeout( function(){ run() }, 30000 );
				}
			})
		
		},
		syncTimer = false,
		
		sync = {
			start: function() {
				syncTimer = true;
				PokerRoom.save();
				$.post('php/games.php', {method:'save',game:game.toString()}, function(data){
					syncToken=data;
					PokerRoom.save();
					run();
				});
			},
			stop: function() {
				clearTimeout(syncTimer);
				syncTimer = null;
				syncToken = null;
			},
			run: function() {
				if (!syncTimer) {
					sync.start();
				} else {
					run();
				}
			}
		}
		return sync
	})(),
	updateScroll = function( animate, callback ) {
		if( hasFocus ) {
			
			var height = currentLevelEl.offsetHeight;
				topOffset = Math.floor( window.innerHeight/2 - height/2),
				levelTop = currentLevelEl.offsetTop,
				newTop = topOffset-levelTop;
			
			if( animate ) {
				PokerRoom.movePanels( topOffset+height );
				$(element).stop().animate({ 'top': newTop}, callback);
			} else {
				PokerRoom.movePanels( topOffset+height );
				$(element).stop().css({ 'top': newTop }, callback);
			}
		}
	},
	resize = function() {
		if( hasFocus ) {
			var width = element.offsetWidth;
			var fontSize = width / SIZE_CONSTANT;
			$(element).parent().css({'font-size':fontSize});
			var third_height = Math.floor( element.innerHeight/3 );
			
			if (window.innerHeight > (currentLevelEl.nextSibling||currentLevelEl.previousSibling).offsetHeight * 3) {
				$(element).addClass('tall');
			} else {
				$(element).removeClass('tall');
			}
			
			updateScroll(false);
		} else {
			console.log( 'not resizing -- no focus' );
		}
	},
	resizeCallback = function(){ 
		resize();
	},
	startBreak = function(){
		state.splice(currentBlindIndex, 0, {blinds:local['break'], game:'', time:breakLength});
		onBreak = true;
		draw();
		save();
	},
	endBreak = function() {
		if (onBreak) {
			onBreak = false;
			state.splice(currentBlindIndex, 1);
			draw();
			save();
		}
		
	},
	toggleBreak = function() {
		if (onBreak) {
			endBreak();
		} else {
			startBreak();
		}
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
	controlsTimeout = null,
	showControls = function() {
		curtain$.hide();
		if (controlsTimeout) {
			clearInterval(controlsTimeout);
			controlsTimeout = setTimeout( hideControls, 2000 );
		} else {
			$('#toolbar').stop().animate({opacity:'1'}, 150);
			controlsTimeout = setTimeout( hideControls, 2000 );
		}
	},
	hideControls = function() {
		clearTimeout(controlsTimeout);
		controlsTimeout = null;
		$('#toolbar').stop().animate({opacity:'0'}, 'slow', function() {
			curtain$.show();
		});
	},
	addTime = function(seconds) {
		state[currentBlindIndex].time += seconds * 1000;
		//lastUpdate = Date.now();
		save();
		draw();
	};
	
	var game = {
		update: function( updateData ) {
			if (!updateData) {
				$.getJSON('php/games.php', {game:name}, function(data) {
					if( data ) {
						clearTimeout(previousDimmerTimer);
						syncToken = data.syncToken;
						lastUpdate = data.lastUpdate;
						state = data.state;
						save();
						draw();
					}
				});
			} else if (updateData.syncToken && updateData.syncToken > syncToken) {
				if (updateData.game) {
					state = updateData.game.state;
					lastUpdate = updateData.game.lastUpdate;
				} else {
					state = updateData.state;
					lastUpdate = updateData.lastUpdate;
				}
				syncToken = updateData.syncToken;
				draw();
				bell.ding();
			}
			return game;
		},
		remove: function() {
			$(element).remove();
			clearInterval(countInterval);
			countInterval = false;
			PokerRoom.removeGame(name);
		},
		sleep: function() {
			clearInterval(countInterval);
			countInterval = false;
			return game;	
		},
		wake: function() {
			count();
			return game;
		},
		focus: function() {
			$('#toolbar a.break').bind('click', function(e){
				toggleBreak();
			});
			
			$('#toolbar a.sync').bind('click', function(e) {
				e.preventDefault();
				sync.run();
			});
			$('#toolbar a.advance').bind('click', function(e) {
				e.preventDefault();
				addTime(30);
			});
			$('#toolbar a.goback').bind('click', function(e) {
				e.preventDefault();
				addTime(-30);
			});
			$('#toolbar').bind('click', function() {
				hideControls();
			});
			curtain$ = $('#curtain').click( function(e) {
				e.stopPropagation();
				e.stopBubble = true;
				showControls();
			});
			
			hideControls();
			$(document).bind('keydown', keyControl);
			if (!window.Touch) {
				$(document).bind('mousemove', showControls);
			}
			hasFocus = true;
			game.wake();
			update();
			resize();
			window.addEventListener( 'resize', resizeCallback, true );
			
			if (game.syncToken) {
				sync.start();
			}
			
			return game;
		},
		blur: function() {
			hasFocus = false;
			PokerRoom.movePanels('auto');
			window.removeEventListener( 'resize', resizeCallback, true );
			return game;
		},
		toString: function() {
			return JSON.stringify(game.toJSON());
		},
		toJSON: function() {
			return {
				lastUpdate: lastUpdate,
				breakLength: breakLength,
				name: name,
				state: state,
				syncToken: syncToken
			};
		},
		resize: function(animate) {
			resize(animate);
			return game;
		},
		redraw: function() {
			draw();
			return game;
		}
	};
	game.__defineGetter__( 'syncToken', function(){return syncToken} );
	game.__defineGetter__( 'element', function(){return element} );
	game.__defineGetter__( 'name', function(){return name} );
	game.__defineGetter__( 'hasFocus', function(){return hasFocus} );
	
	draw();
	
	return game;
}
})(jQuery, util)