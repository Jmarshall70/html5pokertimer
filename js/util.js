var util = {
	template: function(template, bindings, items, callback) {
		if (typeof template === 'string') {
			template = getElementById(template)
		}
		
		template = template.cloneNode(true);
		template.removeAttribute('id');
		
		var frag = document.createDocumentFragment();
		for(var i=0, c=items.length; i < c; i++) {
			var item = items[i];
			var e = template.cloneNode(true);
			for (var key in bindings) {
				var binding = bindings[key];
				if (typeof binding === 'string') {
					binding = { selector:'.'+binding, key:binding };
				}
				var item$ = $(binding.selector,e);
				
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
			if (callback) {
				callback( e, item, i );
			}
			frag.appendChild(e);
		}
		return frag;
	},
	randomWord: function(){
		var consonants = 'bcdfghjklmnprstvwyz';
		var vowels = 'aeiou';
		var word = '';
		var consonant_length = consonants.length;
		var vowel_length = vowels.length;
		for( var i = 0; i < 4; i++ ) {
			word += consonants.charAt( Math.floor(Math.random() * consonant_length ) );
			word += vowels.charAt( Math.floor(Math.random() * vowel_length ) )
		}
		return word;
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
		return Math.floor(sec/60)+':'+util.pad(sec%60,2);
	},
	stringToSeconds: function( time ) {
		var time_a = time.split(':');
		if (time_a.length > 1) {
			return (parseInt(time_a[0],10)*60) + parseInt(time_a[1],10);
		} else {
			return parseInt(time,10);
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
		} else {}
	
		if (num.length > totalChars) { //if padWith was a multiple character string and num was overpadded
			num = num.substring((num.length - totalChars), totalChars);
		} else {}
	
		return num;
	}
};

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
