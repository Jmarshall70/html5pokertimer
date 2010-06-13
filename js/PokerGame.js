var PokerGame = (function($) { return function PokerGame (PokerRoom, state, breakLength, name, lastSync, lastUpdate) {
	
	if ( !$.isArray(state) && typeof state === 'object') {
		lastSync = state.lastSync;
		lastUpdate = state.lastUpdate;
		breakLength = state.breakLength;
		name = p_state.name;
		state = p_state.state;
	}
	
	if (!lastUpdate) {
		lastUpdate = Date.now();
	}
	
	var interval,
		element = createElement('div', 'poker-game'),
		currentLevelEl = null,
	
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
			previousLevel$ = $(currentLevelEl).removeClass('current').addClass('previous')
			setTimeout( function() {
				previousLevel$.removeClass('previous');
			}, 60 * 1000);
		}
		currentLevelEl = element.childNodes[newIndex]
		$(currentLevelEl).addClass('current');
		PokerRoom.ding();
	}
	draw = function(){
		element.innerHTML = '';
		var template = $('#templates .level')[0];
		var binder = [ 'blinds', 'game', {selector:'.time', key:'time', fn:util.secondsToString} ];
		var frag = util.template( template, binder, state )
		element.appendChild( frag );
	};
	
	that = {
		lastSync: lastSync,
		element: element,
		update: function( updateTime, newState ) {
			if (updateTime > lastUpdate) {
				state = newState;
				lastUpdate = updateTime;
				ding();
			}
		},
		remove: function() {
			$(element).remove();
			clearInterval(interval);
			PokerRoom.removeGame(this);
		},
		sleep: function() {
			clearInterval(interval);	
		},
		toString: function() {
			return JSON.stringify({
				lastUpdate: lastUpdate,
				breakLength: breakLength,
				name: name,
				state: state
			});
		}
	}
	
	draw();
	advance(0);
	count();
		
	return that;
}
})(jQuery)