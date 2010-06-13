var PokerGame = (function($) { return function PokerGame (PokerRoom, state, name, breakLength, lastUpdate, syncToken) {
	
	if ( !$.isArray(state) && typeof state === 'object') {
		syncToken = state.syncToken;
		lastUpdate = state.lastUpdate;
		breakLength = state.breakLength;
		name = p_state.name;
		state = p_state.state;
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
	var interval,
		element = createElement('div', 'poker-game'),
		currentLevelEl = null,
		hasFocus = false;		
	
	count = function() {
		if (!interval) {
			interval = setInterval(function(){count()}, 1000);
		}
		update();
	},
	update = function() {
		var now = Date.now() + PokerRoom.timeOffset;
		
		var milleseconds = (now-lastUpdate)
		var seconds = Math.floor(milleseconds/1000);
		lastUpdate = now;
		
		//count
		var currentBlindIndex = -1;
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
				advance(currentBlindIndex);
			}
			blind.time -= seconds;
			$('.time',element.childNodes[currentBlindIndex]).html(util.secondsToString(blind.time));
		}
	},
	advance = function(newIndex) {
		if( currentLevelEl ) {
			previousLevel$ = $(currentLevelEl).removeClass('current').addClass('previous played')
			setTimeout( function() {
				
				previousLevel$.removeClass('previous');
			}, 90 * 1000);
		}
		currentLevelEl = element.childNodes[newIndex]
		$(currentLevelEl).addClass('current');
		
		updateView( true, function(){ ding() } );
	}
	draw = function(){
		element.innerHTML = '';
		var template = $('#templates .level')[0];
		var binder = [ 'blinds', 'game', {selector:'.time', key:'time', fn:util.secondsToString} ];
		var frag = util.template( template, binder, state )
		element.appendChild( frag );
		update();
		updateView( false );
	},
	ding = function() {
		PokerRoom.ding(that);
	},
	save = function() {
		$.post('php/games.php', {method:'save',game:that.toString()}, function(data){ syncToken = data });
	},
	updateView = function( animate, callback ) {
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
			$(element.parentElement).css({'font-size':fontSize});
			var third_height = Math.floor( element.innerHeight/3 );
			updateView(false);
		}
	}
	resizeCallback = function(animate){resize() };
	
	that = {
		update: function( updateData ) {
			if (!updateData) {
				$.get('games.php', {game:name}, function(data) {
					data = JSON.parse( data );
					if( data ) {
						that.update();
					}
				});
			} else if (updateData.syncToken && updateData.syncToken > syncToken) {
				state = updateData.game.state;
				lastUpdate = updateData.game.lastUpdate;
				syncToken = updateData.syncToken;
				ding();
			}
			return that;
		},
		remove: function() {
			$(element).remove();
			clearInterval(interval);
			PokerRoom.removeGame(this);
		},
		sleep: function() {
			clearInterval(interval);
			return that;	
		},
		wake: function() {
			count();
			return that;
		},
		focus: function() {
			hasFocus = true;
			resize();
			window.addEventListener( 'resize', resizeCallback );
			return that;
		},
		blur: function() {
			hasFocus = false;
			PokerRoom.moveCurtains('auto');
			window.removeEventListener( 'resize', resizeCallback );
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
			updateView(animate);
		}
	}
	that.__defineGetter__( 'syncToken', function(){return syncToken} );
	that.__defineGetter__( 'element', function(){return element} );
	that.__defineGetter__( 'hasFocus', function(){return hasFocus} );
	
	draw();
	
	if (!syncToken) {
		save();
	}
		
	return that;
}
})(jQuery)