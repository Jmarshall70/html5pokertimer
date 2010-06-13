var PokerGame = (function($, window) { return function PokerGame (PokerRoom, state, name, breakLength, lastUpdate, syncToken) {
	
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
		var frag = util.template( template, binder, state, function(e,game,i) {
			if( game.blinds == local['break'] ) {
				$(e).click(function(){ 
					state.splice(i,1); 
					draw(); 
					save();
				}).addClass('break');
			}
		} );
		element.appendChild( frag );
		update();
	},
	update = function() {
		var now = Date.now() + PokerRoom.timeOffset;
		var milleseconds = (now-lastUpdate);
		if ( (milleseconds > 1100 && milleseconds < 2000) || milleseconds < 900 ) {
			// make them count at different times
			clearInterval(countInterval);
			countInterval = false;
			setTimeout( function(){ count(); }, milleseconds % 1000 );
			return;
		}
		
		var seconds = Math.floor((milleseconds+100)/1000);
		lastUpdate = now;
		
		//count
		var previousBlindIndex = currentBlindIndex;
		currentBlindIndex = -1;
		for( var i=0,c=state.length; i<c; i++ ) {
			if( state[i].time ) {
				currentBlindIndex = i;
				break;
			}
		}
		if( currentBlindIndex === -1 ) {
			that.remove();
		} else {
			blind = state[currentBlindIndex];
			
			while (seconds > blind.time) {
				seconds -= blind.time;
				blind.time = 0;
				currentBlindIndex += 1;
				blind = state[currentBlindIndex];
			}
			if (currentLevelEl != element.childNodes[currentBlindIndex]) {
				if( currentLevelEl ) {
					var previousLevel$ = $(currentLevelEl).removeClass('current').addClass('previous played');
					previousDimmerTimer = setTimeout( function() {
						previousLevel$.removeClass('previous');
					}, 90 * 1000);
				}
				
				if (state[previousBlindIndex] && state[previousBlindIndex].blinds == local['break'] ) {
					PokerRoom.endBreak(name);
				}
				if (state[currentBlindIndex].blinds == local['break']) {
					PokerRoom.startBreak(name);
				}
				currentLevelEl = element.childNodes[currentBlindIndex];
				$(currentLevelEl).addClass('current');
								
				updateScroll( true, function(){ding();} );
			}
			blind.time -= seconds;
			$('.time',element.childNodes[currentBlindIndex]).html(util.secondsToString(blind.time));
		}
	},
	ding = function() {
		PokerRoom.ding(that);
	},
	save = function() {
		$.post('php/games.php', {method:'save',game:that.toString()}, function(data){syncToken=data;});
	},
	updateScroll = function( animate, callback ) {
		if( hasFocus ) {
			var height = currentLevelEl.offsetHeight,
				topOffset = Math.floor( window.innerHeight/2 - height/2),
				levelTop = currentLevelEl.offsetTop,
				top = -1*(levelTop-topOffset);
			if( animate ) {
				PokerRoom.moveCurtains( topOffset+height );
				$(element).stop().animate({ 'top': top}, callback);
			} else {
				PokerRoom.moveCurtains( topOffset+height );
				$(element).stop().css({ 'top': top }, callback);
			}
		}
	},
	resize = function() {
		if( hasFocus ) {
			var width = element.offsetWidth;
			var fontSize = ( width / 1000 ) * FONT_SIZE;
			$(element).parent().css({'font-size':fontSize});
			var third_height = Math.floor( element.innerHeight/3 );
			updateScroll(false);
		} else {
			console.log( 'not resizing -- no focus' );
		}
	},
	resizeCallback = function(){ 
		resize();
	},
	addBreak = function( next ){
		var index = currentBlindIndex + next;
		state.splice(index, 0, {blinds:local['break'], game:local.clickToRemove, time:breakLength});
		draw();
		save();
	};
	
	var that = {
		update: function( updateData ) {
			if (!updateData) {
				$.getJSON('games.php', {game:name}, function(data) {
					if( data ) {
						clearTimeout(previousDimmerTimer);
						syncToken = data.syncToken;
						lastUpdate = data.lastUpdate;
						state = data.state;
						draw();
					}
				});
			} else if (updateData.syncToken && updateData.syncToken > syncToken) {
				state = updateData.game.state;
				lastUpdate = updateData.game.lastUpdate;
				syncToken = updateData.syncToken;
				draw();
				ding();
			}
			return that;
		},
		remove: function() {
			$(element).remove();
			clearInterval(countInterval);
			countInterval = false;
			PokerRoom.removeGame(this);
		},
		sleep: function() {
			clearInterval(countInterval);
			countInterval = false;
			return that;	
		},
		wake: function() {
			count();
			return that;
		},
		focus: function() {
			hasFocus = true;
			update();
			resize();
			that.wake();
			window.addEventListener( 'resize', resizeCallback, true );
			return that;
		},
		blur: function() {
			hasFocus = false;
			PokerRoom.moveCurtains('auto');
			window.removeEventListener( 'resize', resizeCallback, true );
			return that;
		},
		toString: function() {
			return JSON.stringify(that.toJSON());
		},
		toJSON: function() {
			return {
				lastUpdate: lastUpdate,
				breakLength: breakLength,
				name: name,
				state: state
			};
		},
		resize: function(animate) {
			resize(animate);
			return that;
		},
		redraw: function() {
			draw();
			return that;
		},
		addBreak: function(next){
			addBreak(next);
			return that;
		}
	};
	that.__defineGetter__( 'syncToken', function(){return syncToken} );
	that.__defineGetter__( 'element', function(){return element} );
	that.__defineGetter__( 'name', function(){return name} );
	that.__defineGetter__( 'hasFocus', function(){return hasFocus} );
	
	draw();
	
	if (!syncToken) {
		save();
	}
	
	return that;
}
})(jQuery, window)