var current_level_dom = null;
var previous_level_dom = null;
var container = null;
var time_per_level = null;
var blinds = null;
var games = null
var bell = null;
var game_list = null
var last_update = null;

var text_size = 80;
var level_data = []

current_level_id = null;


$(document).ready( function(){ 
	$('form').bind( 'submit', post_game )
	$.getJSON( 'pokertimer.php?method=list', draw_list );
	$(window).bind( 'resize', function(){change_size(true, true)} );
	bell = document.getElementById('bell');
	container = id('poker_levels');
	setInterval( count, 1000 );
});

function draw_list( new_game_list ) {
	game_list = new_game_list;
	var table_html = '<table>';
	for( var i = 0, c = game_list.length; i < c; i++ ) {
		var game = game_list[i];
		var level = game['level_data'][game['current_level']];
		table_html += '<tr><td><a href="#" onclick="update_game(game_list['+i+']); return false">'+game['title']+'</a></td><td>'+level[1]+'</td><td>'+level[2]+'</td><td>'+level[0]+'</td></tr>';
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
	var level_counter = 0
	for( var i = 0,c=level_data.length; i < c; i++ ) {
		var data = level_data[i]
		var time = data[0];
		var blind = data[1];
		var game = data[2];
		if( game ) {
			var level = create('div');
			$(level).addClass('level');
			level.innerHTML = '<div class="time">'+time+'</div><div class="blinds">'+blind+'</div><div class="game">'+game+'</div><a class="break" href="#" onclick="add_break(this.parentNode); return false">add break</a>';
			if( i == current_blinds ) {
				current_level = level;
			}
			
		} else { // There's a blank line in the blinds, indicating a break.			
			var level = new_break();
		}
		level.level_id = i;
		container.appendChild( level );
	}
	change_size()
	set_current( current_level || container.firstChild, current_blinds );
}
//set the current level
function set_current( new_dom, id ) {
	if( new_dom == null ) {
		new_dom = current_level_dom.nextSibling
		current_level_id += 1;
	} else if( id || id === 0 ) {
		current_level_id = id;
	}
	$(previous_level_dom).removeClass( 'previous' );
	previous_level_dom = current_level_dom
	current_level_dom = new_dom;
	
	$(previous_level_dom).removeClass( 'current' ).addClass( 'previous' );
	setTimeout( function(){ $(previous_level_dom).removeClass( 'previous' ) }, 60000 );
	$(current_level_dom).addClass( 'current' ).removeClass( 'previous' );
	
	update_view();	
	bell.play();
}
// update the location dom elements
function update_view(abrupt) {
	var dom_height = current_level_dom.offsetHeight;
	var top_of_center = Math.floor( window.innerHeight/2 -dom_height/2);
	var dom_top = current_level_dom.offsetTop;
	if( abrupt ) {
		$(container).css({ 'top':-1*(dom_top-top_of_center) });
	} else {
		$(container).animate({ 'top': -1*(dom_top-top_of_center) });
	}
	//$(controls).css({ 'top': dom_top + dom_height });
}

// count down 1 second
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

// create a DOM element for a break
function new_break() {
	var break_dom = create('div');
	$(break_dom).addClass('level');
	$(break_dom).addClass( 'break' );
	break_dom.innerHTML = '<div class="time">'+time_per_level+'</div><div class="blinds">Break!</div><div class="game"><button onclick="remove_break(this.parentNode.parentNode)">Break&rsquo;s over</button></div>';
	break_dom.is_break = true;
	return break_dom;
}
// "add break" button pushed.
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
// "break's done" button pushed
function remove_break(break_dom) {
	if( break_dom == current_level_dom ) {
		$(break_dom).slideUp( function() { set_current(); container.removeChild( break_dom ) } );
	} else {
		$(break_dom).slideUp( function() { container.removeChild( break_dom ) } );
	}
}

// called initially and on resize
function change_size(scroll, animate){
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

function update_game( data ) {
	console.log( data );
	if( true || data.last_update != last_update ) {
		current_blinds = data.current_level;
		level_data = data.level_data;
		draw( current_blinds );
	}
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
// from MDC
if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++)
    {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}