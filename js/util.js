var util = (function($) { return {
	template: function(template, bindings, items, callback) {
		if (typeof template === 'string') {
			template = getElementById(template)
		}
		
		template = template.cloneNode(true);
		template.removeAttribute('id');
		
		var frag = document.createDocumentFragment();
		for(var i=0, c=items.length; i<c; i++) {
			var item = items[i];
			var e = template.cloneNode(true);
			for (var j=0,d=bindings.length; j < d; j++) {
				var binding = bindings[j];
				if (typeof binding === 'string') {
					binding = { selector:'.'+binding, key:binding };
				}
				var item$ = $(binding.selector,e);
				
				if (item$.length) {
					if (binding.fn) {
						item$.html( binding.fn(item[binding.key]) );
					} else if ( binding.nodeName ) {
						item$.append(item[binding.key]);
					} else {
						item$.html(item[binding.key]);
					}
					if (binding.onclick) {
						item$.click(binding.onclick);
					}
					if (binding.callback) {
						binding.callback( e, item$[0], item );
					}
				}
			}
			if (callback) {
				callback( e, item, i );
			}
			frag.appendChild(e);
		}
		return frag;
	},
	randomWord: function() {
		var firstConsonants = [ 'b',  'c',  'd',  'g',  'h',  'j',  'k',  'l',  
								'm',  'n',  'p',  'r',  's',  't',  'z',
						 	   'br', 'ch', 'pr', 'gr', 'cr', 'fr', 'fl', 'pl', 
						 	   'dr', 'th', 'sh', 'sw', 'st'],
			
			consonants = ['b','c','d','f','g','j','k','l','m','n','p','r','s','t','v','y'],
			vowels = ['a','e','i','o','u', 'o'],
			firstConsonantLength = firstConsonants.length
			consonantLength = consonants.length,
			vowelLength = vowels.length;
		
		return function(){
			var word = '';
			word += firstConsonants[Math.floor(Math.random() * firstConsonantLength )];
			word += vowels[Math.floor(Math.random() * vowelLength )];
			for( var i = 0; i < 2; i++ ) {
				word += consonants[Math.floor(Math.random() * consonantLength )];
				word += vowels[Math.floor(Math.random() * vowelLength )];
			}
			return word;
		}
	},
	formValue: function( s ) {
		var s_dom = getElementById(s);
		if (s_dom && s_dom.hasOwnProperty('value') ) {
			return s_dom.value;
		} else {
			return s;
		}
	},
	secondsToString: function( sec ) {
		sec = Math.round( sec / 1000 );
		return Math.floor(sec/60)+':'+util.pad(sec%60,2);
	},
	stringToSeconds: function( time ) {
		var time_a = time.split(':');
		if (time_a.length > 1) {
			return ((parseInt(time_a[0],10)*60) + parseInt(time_a[1],10)) * 1000;
		} else {
			return parseInt(time,10) * 1000;
		}
	},
	pad: function (num, totalChars, padWith) {
		num = num + "";
		padWith = padWith ? padWith : "0";
		totalChars = totalChars ? totalChars : 2;
		if (num.length < totalChars) {
			while (num.length < totalChars) {
				num = padWith + num;
			}
		}
	
		if (num.length > totalChars) { //if padWith was a multiple character string and num was overpadded
			num = num.substring((num.length - totalChars), totalChars);
		}
	
		return num;
	},
	Events: function(types) {
		var listeners = {},
		event = this;
		
		for( var i=0, c=types.length; i < c; i += 1 ) {
			listeners[types[i]] = [];
		};
		
		event.addEventListener = function(type, callback, addToFront) {
			if (!listeners[type]) {
				throw 'Tried to add event of type '+type+'. Possible events are '+types.join(', ');
			}
			var index = listeners[type].indexOf(callback);
			if (index !== -1) {
				if(addTofront) {
					listeners[type].unshift(callback);
				} else {
					listeners[type].push(callback);
				}
			}
		};
		event.removeEventListener = function(type, callback) {
			if (!listeners[type]) {
				throw 'Tried to remove event of type '+type+'. Possible events are '+types.join(', ');
			}	
			var index = listeners[type].indexOf(callback);
			if (index !== -1) {
				listeners[type].splice(index,1);
			}
			
		};
		event.trigger = function(type, arguments) {
			if (!listeners[type]) {
				throw 'Tried to trigger event of type '+type+'. Possible events are '+types.join(', ');
			}
			var callbacks = listeners[type];
			for (var i=0,c=callbacks.length; i < c; i += 1) {
				var returnValue = callbacks[i].apply(window, arguments);
				if (returnValue === false) {
					break;
				}
			}
		};
		
	}
}})(jQuery);

function getElementById( id ) {
	return document.getElementById(id);
}

function createElement( type, className ) {
	var e = document.createElement(type);
	if (className) {
		e.className = className;
	}
	return e;
}

if (!console) {
	var console = {
		log: function(){},
		dir: function(){},
		error: function(){}
	};
}
