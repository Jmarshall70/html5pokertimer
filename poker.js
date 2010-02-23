var current_level_dom = null;
var previous_level_dom = null;
var container = null;
var time_per_level = null;
var blinds = null;
var games = null
var bell = null;
var game_list = null
var last_updated = null;

var text_size = 80;
var level_data = []
var title = ''
var current_level_id = null;


$(document).ready( function(){ 
	$('form').bind( 'submit', post_game )
	$.getJSON( 'pokertimer.php?method=list', draw_list );
	$(window).bind( 'resize', function(){change_size(true, true)} );
	bell = document.getElementById('bell');
	container = id('poker_levels');
	setInterval( count, 1000 );
	setInterval( request_update, 5000 );
	$('#new_game_title').val( random_word() );

});
function request_update( new_title ) {
	if( new_title ) {
		title = new_title
	}
	if( title ) {
		$.getJSON( 'pokertimer.php', { 'method':'get', 'title':title }, update_game )
	}
}
function draw_list( new_game_list ) {
	game_list = new_game_list;
	var table_html = '<table>';
	for( var i = 0, c = game_list.length; i < c; i++ ) {
		var game = game_list[i];
		var level = game['level_data'][game['current_level']];
		table_html += '<tr><td><a href="#'+game['title']+'" onclick="request_update(\''+game['title'].replace("'", "")+'\');">'+game['title']+'</a></td><td>'+level[1]+'</td><td>'+level[2]+'</td><td>'+level[0]+'</td></tr>';
	}
	table_html += '</table>';
	$('#games').html( table_html );
}
function post_game( e ) {
	
	title = $('input[name=title]').val();
	time_per_level = $('input[name=time]').val();
	blinds = $('textarea[name=blinds]').val().split('\n');
	games = $('textarea[name=games]').val().split('\n');
		
	level_data = [];
	var level_counter = 0;
	for( var i = 0, c=blinds.length; i < c; i++ ) {
		if( blinds[i] ) {
			var new_line = [ time_per_level, blinds[i], games[level_counter%games.length] ]
			level_counter += 1
		} else {
			var new_line = [ time_per_level, 'Break', '' ];
		}
		level_data.push( new_line );
	}

	$('#start').hide();
	setup()
	data = {'method': 'save', 'data': $.toJSON(level_data), 'title':title};
	$.post( 'pokertimer.php', data );
	return false;
}
//initial setup
function setup(){
	draw( 0 );
}

// creates the dom elements for the board.
function draw( current_blinds ) {
	//read the values from the HTML
	
	$('#poker_container').show();
	container.innerHTML = '';
	// make blind levels
	current_level = level = null;
	current_level_id = current_blinds;
	var level_counter = 0
	for( var i = 0,c=level_data.length; i < c; i++ ) {
		var data = level_data[i]
		var time = data[0];
		if( level_data[i+1] && level_data[i+1][0] != time ) {
			var break_time = level_data[i+1][0];
		} else {
			var break_time = time;
		}
		var blind = data[1];
		var game = data[2];
		if( game ) {
			var level = create('div');
			$(level).addClass('level');
			level.innerHTML = '<div class="time">'+time+'</div><div class="blinds">'+blind+'</div><div class="game">'+game+'</div><a class="break" href="#" onclick="add_break( this.parentNode, '+i+', \''+break_time+'\'); return false">add break</a>';
			
		} else { // There's a blank line in the blinds, indicating a break.			
			var level = new_break( time );
		}
		level.level_id = i;
		container.appendChild( level );
	}
	change_size()
	set_current( current_blinds );
	change_size();
}
//set the current level
function set_current( new_id ) {
	
	previous_level_dom = container.childNodes[current_level_id]
	current_level_dom = container.childNodes[new_id];
	
	$(previous_level_dom).removeClass( 'current' ).addClass( 'previous' );
	setTimeout( function(){ $(previous_level_dom).removeClass( 'previous' ) }, 60000 );
	$(current_level_dom).addClass( 'current' ).removeClass( 'previous' );
	if( current_level_id != new_id ) {
		current_level_id = new_id;
		update_view();	
		bell.play();
	}
}
// update the location dom elements
function update_view(abrupt) {
	if( current_level_id ) {
		var dom_height = current_level_dom.offsetHeight;
		var top_of_center = Math.floor( window.innerHeight/2 -dom_height/2);
		var dom_top = current_level_dom.offsetTop;
		if( abrupt ) {
			$(container).css({ 'top':-1*(dom_top-top_of_center) });
		} else {
			$(container).animate({ 'top': -1*(dom_top-top_of_center) });
		}
	}
}

// count down 1 second
function count() {
	if( title ) {
		c = container.childNodes[current_level_id];
		var time = level_data[current_level_id][0]; //c[0].innerHTML
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
		level_data[current_level_id][0] = c.childNodes[0].innerHTML = time
		
		$('title').html( time + ' - ' + c.childNodes[1].innerHTML + ' - ' + c.childNodes[0].innerHTML );
	}
}

// create a DOM element for a break
function new_break( time ) {
	var break_dom = create('div');
	$(break_dom).addClass('level');
	$(break_dom).addClass( 'break' );
	break_dom.innerHTML = '<div class="time">'+time+'</div><div class="blinds">Break!</div><div class="game"><button onclick="remove_break(this.parentNode.parentNode.level_id)">Break&rsquo;s over</button></div>';
	break_dom.is_break = true;
	return break_dom;
}
// "add break" button pushed.
function add_break(	node_before, node_id, time ) {
	var break_a = [ time, 'Break', false ]
	level_data.splice( node_id, 0, break_a )
	draw( current_level_id );
	data = {'method': 'save', 'data': $.toJSON(level_data), 'title':title};
	$.post( 'pokertimer.php', data );
	
}
// "break's done" button pushed
function remove_break( level_id ) {
	level_data.splice( level_id, 1 )
	if( level_id < current_level_id ) {
		current_level_id -= 1;
	}
	draw( current_level_id );
	data = {'method': 'save', 'data': $.toJSON(level_data), 'title':title};
	$.post( 'pokertimer.php', data );
}

// called initially and on resize
function change_size(scroll, animate){
	if( current_level_dom ) {
		var width = container.offsetWidth;
		var ratio_text_size = ( width / 1000 ) * text_size;
		$(container).css({'fontSize':ratio_text_size, 'lineHeight':1});
		$('#settings').css({'fontSize':ratio_text_size, 'lineHeight':1});
		//$('.level').css({'height':ratio*90});
		var third_height = Math.floor( container.innerHeight/3 );
		$(container).css({ 'paddingTop': third_height, 'paddingBottom': third_height, height: third_height });
		if( scroll ) {	
			update_view(animate);
		}
	}
}

function update_game( data ) {
	console.log( data.last_updated );
	if( data.last_updated && data.last_updated != last_updated ) {
		console.log( data );
		title = data.title;
		last_updated = data.last_updated;
		level_data = data.level_data;
		draw( data.current_level );
		bell.play();
	}
}

function random_word() {
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
}

//convenience functions
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
