var Util = require('./util');
var Vector2 = require('./vector2');
var Force = require('./force');
var Mover = require('./mover');
var debounce = require('./debounce');

var body_width  = document.body.clientWidth * 2;
var body_height = document.body.clientHeight * 2;
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var fps = 60;
var last_time_render = Date.now();

var movers = [];
var movers_num = 1200;
var max = 0;

var ft_canvas = document.createElement('canvas');
var ft_ctx = ft_canvas.getContext('2d');
var ft_str = '@ykob';
var text_coord_array = [];

var vector_mouse = new Vector2();

var init = function() {
  renderloop();
  setEvent();
  resizeCanvas();
  text_coord_array = getTextCoord();
  intMover();
  debounce(window, 'resize', function(event){
    resizeCanvas();
  });
};

var intMover = function() {
  max = text_coord_array.length - 1;
  
  for (var i = 0; i < movers_num; i++) {
    var mover = new Mover();
    var radian = Util.getRadian(Util.getRandomInt(0, 360));
    var position = new Vector2(body_width / 2, body_height / 2);
    var anchor = null;
    var force = null;
    var scalar = 0;
    var size = 0;
    var rad = Util.getRadian(Util.getRandomInt(0, 360));
    var index = Util.getRandomInt(0, max);
    
    size = body_width / 360;
    scalar = Util.getRandomInt(body_width / 10, body_width / 2);
    force = new Vector2(Math.cos(radian) * scalar, Math.sin(radian) * scalar);
    anchor = text_coord_array[index];
    mover.init(position, anchor, size);
    mover.applyForce(force);
    movers[i] = mover;
  }
};

var getTextCoord = function() {
  var array = [];
  var image_data = null;
  
  ft_ctx.beginPath();
  ft_ctx.fillStyle = '#333333';
  ft_ctx.font = body_width / ft_str.length + 'px Arial';
  ft_ctx.textAlign = 'center';
  ft_ctx.textBaseline = 'middle';
  ft_ctx.fillText(ft_str, body_width / 2, body_height / 2);
  image_data = ft_ctx.getImageData(0, 0, body_width, body_height).data;
  
  for (var y = 0; y < body_height; y++) {
    for (var x = 0; x < body_width; x++) {
      var index = (y * body_width + x) * 4;
      var r = image_data[index];
      var g = image_data[index + 1];
      var b = image_data[index + 2];
      var a = image_data[index + 3];
      
      if (a > 0) {
        array.push(new Vector2(x, y));
      }
    }
  }
  return array;
};

var updateMover = function() {
  for (var i = 0; i < movers.length; i++) {
    var mover = movers[i];
    var collision = false;
    
    mover.hook();
    mover.applyDragForce();
    mover.updateVelocity();
    mover.updatePosition();
    mover.draw(ctx);
  }
};

var applyForceMouseLoop = function() {
  var scalar = 2000;
  
  applyForceMouse(vector_mouse, scalar);
};

var applyForceMouse = function(vector, scalar_base) {
  for (var i = 0; i < movers.length; i++) {
    var distance = vector.distanceTo(movers[i].position);
    var direct = vector.clone().sub(movers[i].position);
    var scalar = (scalar_base - distance) / 100;
    var force = null;
    
    if (scalar < 0) scalar = 0;
    direct.normalize();
    force = direct.multScalar(scalar * -1);
    movers[i].applyForce(force);
  };
};

var render = function() {
  ctx.clearRect(0, 0, body_width, body_height);
  applyForceMouseLoop();
  updateMover();
};

var renderloop = function() {
  var now = Date.now();
  requestAnimationFrame(renderloop);

  if (now - last_time_render > 1000 / fps) {
    render();
    last_time_render = Date.now();
  }
};

var resizeCanvas = function() {
  body_width  = document.body.clientWidth * 2;
  body_height = document.body.clientHeight * 2;

  canvas.width = body_width;
  canvas.height = body_height;
  canvas.style.width = body_width / 2 + 'px';
  canvas.style.height = body_height / 2 + 'px';
  ft_canvas.width = body_width;
  ft_canvas.height = body_height;
};

var setEvent = function () {
  var eventTouchStart = function() {
    var scalar = 60000;
    for (var i = 0; i < movers_num; i++) {
      var index = Util.getRandomInt(0, max);
      movers[i].anchor = text_coord_array[index];
    }
    applyForceMouse(vector_mouse, scalar);
  };
  
  var eventTouchMove = function() {
  };
  
  var eventTouchEnd = function() {
  };

  canvas.addEventListener('contextmenu', function (event) {
    event.preventDefault();
  });

  canvas.addEventListener('selectstart', function (event) {
    event.preventDefault();
  });

  canvas.addEventListener('mousedown', function (event) {
    event.preventDefault();
    vector_mouse.set(event.clientX * 2, event.clientY * 2);
    eventTouchStart();
  });

  canvas.addEventListener('mousemove', function (event) {
    event.preventDefault();
    vector_mouse.set(event.clientX * 2, event.clientY * 2);
    eventTouchMove();
  });

  canvas.addEventListener('mouseup', function (event) {
    event.preventDefault();
    eventTouchEnd();
  });

  canvas.addEventListener('touchstart', function (event) {
    event.preventDefault();
    vector_mouse.set(event.touches[0].clientX * 2, event.touches[0].clientY * 2);
    eventTouchStart();
  });

  canvas.addEventListener('touchmove', function (event) {
    event.preventDefault();
    vector_mouse.set(event.touches[0].clientX * 2, event.touches[0].clientY * 2);
    eventTouchMove();
  });

  canvas.addEventListener('touchend', function (event) {
    event.preventDefault();
    eventTouchEnd();
  });
};

init();
