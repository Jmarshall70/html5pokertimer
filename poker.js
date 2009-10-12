var current_level_dom = null;
var container = null;
var time_per_level = null;
var bell = null;
$(document).ready(function(){
	$(window).bind( 'resize', function(){change_size(true, true)} );
	bell = document.getElementById('bell');
	if( bell.duration == 0 || !bell.canPlayType('audio/ogg') ) {
		if( bell.canPlayType('audio/mpeg') ) {
			new_src = bell.src.substr(0, bell.src.length-3)+'mp3';
			bell.parentNode.removeChild(bell);
			bell = new Audio();
			bell.src = new_src;
		} else if( bell.canPlayType('audio/wav') ) {
			new_src = bell.src.substr(0, bell.src.length-3)+'wav';
			bell.parentNode.removeChild(bell);
			bell = new Audio();
			bell.src = new_src;
		}
	}
	console.log( bell.src )
	container = id('poker_levels');
	draw();
	setInterval( count, 1000 );
	
});

function count() {
	c = current_level_dom.childNodes;
	var time = c[0].innerHTML
	var time_a = time.split(':');
	var minutes = parseInt( time_a[0], 10 );
	var seconds = parseInt( time_a[1], 10 );
	if( seconds == 0 && minutes == 0 ) {
		set_current()
		return;
	} else if( seconds == 0 ) {
		minutes -= 1;
		seconds = 59;
	} else {
		seconds -= 1;
	}
	time = minutes+':'+pad(seconds);
	c[0].innerHTML = time
	$('title').html( time + ' - ' + c[1].innerHTML + ' - ' + c[2].innerHTML );
}

function new_level() {
	var container = create('div');
	$(container).addClass('level');
	container.innerHTML = '<div class="time">'+time_per_level+'</div><div class="blinds"></div><div class="game"></div><a class="break" href="#" onclick="add_break(this.parentNode); return false">add break</a>';
	return container;
}
function new_break() {
	var break_dom = create('div');
	$(break_dom).addClass('level');
	$(break_dom).addClass( 'break' );
	break_dom.innerHTML = '<div class="time">'+time_per_level+'</div><div class="blinds">Break!</div><div class="game"><button onclick="remove_break(this.parentNode.parentNode)">Break&rsquo;s over</button></div>';
	return break_dom;
}
function add_break(	node_before ) {
	break_dom = new_break();
	$(break_dom).css({ 'display': 'none' });
	current_level_dom.parentNode.insertBefore( break_dom, node_before );
	change_size();
	if( node_before == current_level_dom ) {
		$(current_level_dom).removeClass( 'current' );
		current_level_dom = break_dom;
		$(current_level_dom).addClass( 'current' );
	}
	$(break_dom).slideDown();
}
function remove_break(break_dom) {
	if( break_dom == current_level_dom ) {
		$(break_dom).slideUp( function() { set_current(); container.removeChild( break_dom ) } );
	} else {
		$(break_dom).slideUp( function() { container.removeChild( break_dom ) } );
	}
}
function set_current( new_dom ) {
	if( new_dom == null ) {
		new_dom = current_level_dom.nextSibling
	}
	$(current_level_dom).removeClass( 'current' );
	current_level_dom = new_dom;
	$(current_level_dom).addClass( 'current' );
	update_view();
	bell.play();
}
function update_view(abrupt) {
	var dom_height = current_level_dom.offsetHeight;
	var top_of_center = Math.floor( window.innerHeight/2 -dom_height/2);
	var dom_top = current_level_dom.offsetTop;
	if( abrupt ) {
		$('html,body').scrollTop(dom_top-top_of_center);
	} else {
		$('html,body').animate({ 'scrollTop': dom_top-top_of_center });
	}
	//$(controls).css({ 'top': dom_top + dom_height });
}

function draw() {
	time_per_level = id('time').value
	blinds = id('blinds').value.split('\n');
	games = id('games').value.split('\n');
	level = container.firstChild;
	var level_counter = 0
	for( var i = 0,c=blinds.length; i < c; i++ ) {
		if( blinds[i] ) {
			if( !level ) {
				level = new_level();
				container.appendChild( level );
			}
			level.childNodes[0].innerHTML = time_per_level;
			level.childNodes[1].innerHTML = blinds[i];
			level.childNodes[2].innerHTML = games[level_counter%games.length]
			level_counter += 1;
		} else {
			break_dom = new_break();
			if( level ) {
				container.replaceChild( break_dom, level );
				level = break_dom;
			} else {
				container.appendChild( break_dom );
				level = break_dom;
			}
		}
		level = level.nextSibling;
	}
	while( level && level.nextSibling ) {
		level.parentNode.removeChild( level.nextSibling );
	}
	change_size()
	set_current( container.firstChild );
}
function change_size(scroll, animate){
	var width = container.offsetWidth;
	var ratio = width / 1000;
	$(container).css({'fontSize':ratio*72, 'lineHeight':(ratio*80)+'px'});
	$('#settings').css({'fontSize':ratio*72, 'lineHeight':(ratio*80)+'px'});
	//$('.level').css({'height':ratio*90});
	var half_height = Math.floor( window.innerHeight/2 );
	$(container).css({ 'paddingTop': half_height, 'paddingBottom': half_height });
	if( scroll ) {	
		update_view(animate);
	}
}
function id(e){return document.getElementById(e)}
function create(e){return document.createElement(e)}
function pad(num, totalChars, padWith) {
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
