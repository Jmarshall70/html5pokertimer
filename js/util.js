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
		sec = Math.floor( sec / 1000 );
		return Math.floor(sec/60)+':'+util.pad(sec%60,2);
	},
	stringToSeconds: function( time ) {
		var time_a = time.split(':');
		if (time_a.length > 1) {
			var minutes = (parseInt(time_a[0],10) || 0) * 60;
			var seconds = parseInt(time_a[1],10) || 0;
			return (minutes + seconds) * 1000;
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
var html = $('html')[0];


if (!console) {
	window.console = {
		log: function(){},
		dir: function(){},
		error: function(){}
	};
}

//json2.js
if(!this.JSON){this.JSON={};}(function(){function f(n){return n<10?'0'+n:n;}if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+f(this.getUTCMonth()+1)+'-'+f(this.getUTCDate())+'T'+f(this.getUTCHours())+':'+f(this.getUTCMinutes())+':'+f(this.getUTCSeconds())+'Z':null;};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf();};}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}if(typeof rep==='function'){value=rep.call(holder,key,value);}switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}v=partial.length===0?'[]':gap?'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v;}if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==='string'){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}return str('',{'':value});};}if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}return reviver.call(holder,key,value);}text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}throw new SyntaxError('JSON.parse');};}}());
