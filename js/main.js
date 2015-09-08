(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function(object, eventType, callback){
  var timer;

  object.addEventListener(eventType, function(event) {
    clearTimeout(timer);
    timer = setTimeout(function(){
      callback(event);
    }, 500);
  }, false);
};

},{}],2:[function(require,module,exports){
var Vector2 = require('./vector2');

var exports = {
  friction: function(vector, value) {
    var force = vector.clone();
    force.multScalar(-1);
    force.normalize();
    force.multScalar(value);
    return force;
  },
  drag: function(vector, value) {
    var force = vector.clone();
    force.multScalar(-1);
    force.normalize();
    force.multScalar(vector.length() * value);
    return force;
  },
  hook: function(v_velocity, v_anchor, k) {
    var force = v_velocity.clone().sub(v_anchor);
    var distance = force.length();
    if (distance > 0) {
      force.normalize();
      force.multScalar(-1 * k * distance);
      return force;
    } else {
      return new Vector2();
    }
  }
};

module.exports = exports;

},{"./vector2":6}],3:[function(require,module,exports){
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
var movers_num = 0;
var max = 0;

var input = document.getElementById('input-text');
var ft_canvas = document.createElement('canvas');
var ft_ctx = ft_canvas.getContext('2d');
var ft_str = input.value;
var text_coord_array = [];
var font_size = 0;

var vector_mouse = new Vector2();

var init = function() {
  renderloop();
  setEvent();
  resizeCanvas();
  text_coord_array = getTextCoord();
  initMover();
  debounce(window, 'resize', function(event){
    resizeCanvas();
  });
  debounce(input, 'keyup', function(event){
    checkInputValue();
  });
};

var initMover = function() {
  movers = [];
  max = text_coord_array.length - 1;
  movers_num = ft_str.length * 120;
  
  for (var i = 0; i < movers_num; i++) {
    var mover = new Mover();
    var position = new Vector2(body_width / 2, body_height / 2);
    var anchor = null;
    var size = 0;
    var index = Util.getRandomInt(0, max);
    
    size = font_size / 50;
    anchor = text_coord_array[index];
    mover.init(position, anchor, size);
    movers[i] = mover;
  }
  scatteredMover();
};

var getTextCoord = function() {
  var array = [];
  var image_data = null;
  
  font_size = body_width / Util.getByte(ft_str) * 1.8;
  ft_ctx.clearRect(0, 0, body_width, body_height);
  ft_ctx.beginPath();
  ft_ctx.fillStyle = '#333333';
  ft_ctx.font = font_size + 'px Arial';
  ft_ctx.textAlign = 'center';
  ft_ctx.textBaseline = 'middle';
  ft_ctx.fillText(ft_str, body_width / 2, body_height / 2.2);
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

var scatteredMover = function() {
  for (var i = 0; i < movers.length; i++) {
    var mover = movers[i];
    var radian = Util.getRadian(Util.getRandomInt(0, 360));
    var vector = new Vector2(body_width / 2, body_height / 2);
    var scalar = 0;
    var force = null;
    
    mover.position.copy(vector);
    scalar = Util.getRandomInt(body_width / 10, body_width / 4);
    force = new Vector2(Math.cos(radian) * scalar, Math.sin(radian) * scalar);
    mover.applyForce(force);
  }
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

var checkInputValue = function() {
  if (input.value === ft_str) return;
  ft_str = input.value;
  text_coord_array = getTextCoord();
  initMover();
};

var render = function() {
  ctx.clearRect(0, 0, body_width, body_height);
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
    for (var i = 0; i < movers_num; i++) {
      var index = Util.getRandomInt(0, max);
      movers[i].anchor = text_coord_array[index];
    }
    scatteredMover();
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

},{"./debounce":1,"./force":2,"./mover":4,"./util":5,"./vector2":6}],4:[function(require,module,exports){
var Util = require('./util');
var Vector2 = require('./vector2');
var Force = require('./force');

var exports = function(){
  var Mover = function() {
    this.position = new Vector2();
    this.velocity = new Vector2();
    this.acceleration = new Vector2();
    this.anchor = new Vector2();
    this.radius = 0;
    this.mass = 0;
    this.direction = 0;
    this.k = 0.1;
    this.r = Util.getRandomInt(220, 255);
    this.g = Util.getRandomInt(120, 235);
    this.b = Util.getRandomInt(120, 235);
  };
  
  Mover.prototype = {
    init: function(position, anchor, size) {
      this.radius = Util.getRandomInt(size, size * 3);
      this.mass = this.radius / 10;
      this.position = position.clone();
      this.velocity = position.clone();
      this.anchor = anchor.clone();
    },
    updatePosition: function() {
      this.position.copy(this.velocity);
    },
    updateVelocity: function() {
      this.velocity.add(this.acceleration);
      if (this.velocity.distanceTo(this.position) >= 1) {
        this.direct(this.velocity);
      }
    },
    applyForce: function(vector) {
      this.acceleration.add(vector);
    },
    applyFriction: function() {
      var friction = Force.friction(this.acceleration, 0.1);
      this.applyForce(friction);
    },
    applyDragForce: function() {
      var drag = Force.drag(this.acceleration, 0.24);
      this.applyForce(drag);
    },
    hook: function() {
      var force = Force.hook(this.velocity, this.anchor, this.k);
      this.applyForce(force);
    },
    rebound: function(vector) {
      var dot = this.acceleration.clone().dot(vector);
      this.acceleration.sub(vector.multScalar(2 * dot));
      this.acceleration.multScalar(0.8);
    },
    direct: function(vector) {
      var v = vector.clone().sub(this.position);
      this.direction = Math.atan2(v.y, v.x);
    },
    draw: function(context, mode) {
      var resize = Math.floor(this.acceleration.length() / 10);
      context.fillStyle = 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
      context.beginPath();
      context.arc(this.position.x, this.position.y, this.radius + resize, 0, Math.PI / 180, true);
      context.fill();
    }
  };
  
  return Mover;
};

module.exports = exports();

},{"./force":2,"./util":5,"./vector2":6}],5:[function(require,module,exports){
var exports = {
  getRandomInt: function(min, max){
    return Math.floor(Math.random() * (max - min)) + min;
  },
  getDegree: function(radian) {
    return radian / Math.PI * 180;
  },
  getRadian: function(degrees) {
    return degrees * Math.PI / 180;
  },
  getSpherical: function(rad1, rad2, r) {
    var x = Math.cos(rad1) * Math.cos(rad2) * r;
    var z = Math.cos(rad1) * Math.sin(rad2) * r;
    var y = Math.sin(rad1) * r;
    return [x, y, z];
  },
  getByte: function(str) {
    var b = 0;
    for (i = 0; i < str.length; i++) {
      var n = escape(str.charAt(i));
      if (n.length < 4) {
        b += 1;
      } else {
        b += 2;
      }
    }
    return b;
  }
};

module.exports = exports;

},{}],6:[function(require,module,exports){
// 
// このVector2クラスは、three.jsのTHREE.Vector2クラスの計算式の一部を利用しています。
// https://github.com/mrdoob/three.js/blob/master/src/math/Vector2.js#L367
// 

var exports = function(){
  var Vector2 = function(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  };
  
  Vector2.prototype = {
    set: function (x, y) {
      this.x = x;
      this.y = y;
      return this;
    },
    copy: function (v) {
      this.x = v.x;
      this.y = v.y;
      return this;
    },
    add: function (v) {
      this.x += v.x;
      this.y += v.y;
      return this;
    },
    addScalar: function (s) {
      this.x += s;
      this.y += s;
      return this;
    },
    sub: function (v) {
      this.x -= v.x;
      this.y -= v.y;
      return this;
    },
    subScalar: function (s) {
      this.x -= s;
      this.y -= s;
      return this;
    },
    mult: function (v) {
      this.x *= v.x;
      this.y *= v.y;
      return this;
    },
    multScalar: function (s) {
      this.x *= s;
      this.y *= s;
      return this;
    },
    div: function (v) {
      this.x /= v.x;
      this.y /= v.y;
      return this;
    },
    divScalar: function (s) {
      this.x /= s;
      this.y /= s;
      return this;
    },
    min: function (v) {
      if ( this.x < v.x ) this.x = v.x;
      if ( this.y < v.y ) this.y = v.y;
      return this;
    },
    max: function (v) {
      if ( this.x > v.x ) this.x = v.x;
      if ( this.y > v.y ) this.y = v.y;
      return this;
    },
    clamp: function (v_min, v_max) {
      if ( this.x < v_min.x ) {
        this.x = v_min.x;
      } else if ( this.x > v_max.x ) {
        this.x = v_max.x;
      }
      if ( this.y < v_min.y ) {
        this.y = v_min.y;
      } else if ( this.y > v_max.y ) {
        this.y = v_max.y;
      }
      return this;
    },
    floor: function () {
      this.x = Math.floor( this.x );
      this.y = Math.floor( this.y );
      return this;
    },
    ceil: function () {
      this.x = Math.ceil( this.x );
      this.y = Math.ceil( this.y );
      return this;
    },
    round: function () {
      this.x = Math.round( this.x );
      this.y = Math.round( this.y );
      return this;
    },
    roundToZero: function () {
      this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
      this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );
      return this;
    },
    negate: function () {
      this.x = - this.x;
      this.y = - this.y;
      return this;
    },
    dot: function (v) {
      return this.x * v.x + this.y * v.y;
    },
    lengthSq: function () {
      return this.x * this.x + this.y * this.y;
    },
    length: function () {
      return Math.sqrt(this.lengthSq());
    },
    normalize: function () {
      return this.divScalar(this.length());
    },
    distanceTo: function (v) {
      var dx = this.x - v.x;
      var dy = this.y - v.y;
      return Math.sqrt(dx * dx + dy * dy);
    },
    setLength: function (l) {
      var oldLength = this.length();
      if ( oldLength !== 0 && l !== oldLength ) {
        this.multScalar(l / oldLength);
      }
      return this;
    },
    clone: function () {
      return new Vector2(this.x, this.y);
    }
  }

  return Vector2;
};

module.exports = exports();

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvZGVib3VuY2UuanMiLCJzcmMvanMvZm9yY2UuanMiLCJzcmMvanMvbWFpbi5qcyIsInNyYy9qcy9tb3Zlci5qcyIsInNyYy9qcy91dGlsLmpzIiwic3JjL2pzL3ZlY3RvcjIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmplY3QsIGV2ZW50VHlwZSwgY2FsbGJhY2spe1xuICB2YXIgdGltZXI7XG5cbiAgb2JqZWN0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBmdW5jdGlvbihldmVudCkge1xuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBjYWxsYmFjayhldmVudCk7XG4gICAgfSwgNTAwKTtcbiAgfSwgZmFsc2UpO1xufTtcbiIsInZhciBWZWN0b3IyID0gcmVxdWlyZSgnLi92ZWN0b3IyJyk7XG5cbnZhciBleHBvcnRzID0ge1xuICBmcmljdGlvbjogZnVuY3Rpb24odmVjdG9yLCB2YWx1ZSkge1xuICAgIHZhciBmb3JjZSA9IHZlY3Rvci5jbG9uZSgpO1xuICAgIGZvcmNlLm11bHRTY2FsYXIoLTEpO1xuICAgIGZvcmNlLm5vcm1hbGl6ZSgpO1xuICAgIGZvcmNlLm11bHRTY2FsYXIodmFsdWUpO1xuICAgIHJldHVybiBmb3JjZTtcbiAgfSxcbiAgZHJhZzogZnVuY3Rpb24odmVjdG9yLCB2YWx1ZSkge1xuICAgIHZhciBmb3JjZSA9IHZlY3Rvci5jbG9uZSgpO1xuICAgIGZvcmNlLm11bHRTY2FsYXIoLTEpO1xuICAgIGZvcmNlLm5vcm1hbGl6ZSgpO1xuICAgIGZvcmNlLm11bHRTY2FsYXIodmVjdG9yLmxlbmd0aCgpICogdmFsdWUpO1xuICAgIHJldHVybiBmb3JjZTtcbiAgfSxcbiAgaG9vazogZnVuY3Rpb24odl92ZWxvY2l0eSwgdl9hbmNob3IsIGspIHtcbiAgICB2YXIgZm9yY2UgPSB2X3ZlbG9jaXR5LmNsb25lKCkuc3ViKHZfYW5jaG9yKTtcbiAgICB2YXIgZGlzdGFuY2UgPSBmb3JjZS5sZW5ndGgoKTtcbiAgICBpZiAoZGlzdGFuY2UgPiAwKSB7XG4gICAgICBmb3JjZS5ub3JtYWxpemUoKTtcbiAgICAgIGZvcmNlLm11bHRTY2FsYXIoLTEgKiBrICogZGlzdGFuY2UpO1xuICAgICAgcmV0dXJuIGZvcmNlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbmV3IFZlY3RvcjIoKTtcbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cztcbiIsInZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgVmVjdG9yMiA9IHJlcXVpcmUoJy4vdmVjdG9yMicpO1xudmFyIEZvcmNlID0gcmVxdWlyZSgnLi9mb3JjZScpO1xudmFyIE1vdmVyID0gcmVxdWlyZSgnLi9tb3ZlcicpO1xudmFyIGRlYm91bmNlID0gcmVxdWlyZSgnLi9kZWJvdW5jZScpO1xuXG52YXIgYm9keV93aWR0aCAgPSBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoICogMjtcbnZhciBib2R5X2hlaWdodCA9IGRvY3VtZW50LmJvZHkuY2xpZW50SGVpZ2h0ICogMjtcbnZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzJyk7XG52YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG52YXIgZnBzID0gNjA7XG52YXIgbGFzdF90aW1lX3JlbmRlciA9IERhdGUubm93KCk7XG5cbnZhciBtb3ZlcnMgPSBbXTtcbnZhciBtb3ZlcnNfbnVtID0gMDtcbnZhciBtYXggPSAwO1xuXG52YXIgaW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5wdXQtdGV4dCcpO1xudmFyIGZ0X2NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xudmFyIGZ0X2N0eCA9IGZ0X2NhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xudmFyIGZ0X3N0ciA9IGlucHV0LnZhbHVlO1xudmFyIHRleHRfY29vcmRfYXJyYXkgPSBbXTtcbnZhciBmb250X3NpemUgPSAwO1xuXG52YXIgdmVjdG9yX21vdXNlID0gbmV3IFZlY3RvcjIoKTtcblxudmFyIGluaXQgPSBmdW5jdGlvbigpIHtcbiAgcmVuZGVybG9vcCgpO1xuICBzZXRFdmVudCgpO1xuICByZXNpemVDYW52YXMoKTtcbiAgdGV4dF9jb29yZF9hcnJheSA9IGdldFRleHRDb29yZCgpO1xuICBpbml0TW92ZXIoKTtcbiAgZGVib3VuY2Uod2luZG93LCAncmVzaXplJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgIHJlc2l6ZUNhbnZhcygpO1xuICB9KTtcbiAgZGVib3VuY2UoaW5wdXQsICdrZXl1cCcsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICBjaGVja0lucHV0VmFsdWUoKTtcbiAgfSk7XG59O1xuXG52YXIgaW5pdE1vdmVyID0gZnVuY3Rpb24oKSB7XG4gIG1vdmVycyA9IFtdO1xuICBtYXggPSB0ZXh0X2Nvb3JkX2FycmF5Lmxlbmd0aCAtIDE7XG4gIG1vdmVyc19udW0gPSBmdF9zdHIubGVuZ3RoICogMTIwO1xuICBcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3ZlcnNfbnVtOyBpKyspIHtcbiAgICB2YXIgbW92ZXIgPSBuZXcgTW92ZXIoKTtcbiAgICB2YXIgcG9zaXRpb24gPSBuZXcgVmVjdG9yMihib2R5X3dpZHRoIC8gMiwgYm9keV9oZWlnaHQgLyAyKTtcbiAgICB2YXIgYW5jaG9yID0gbnVsbDtcbiAgICB2YXIgc2l6ZSA9IDA7XG4gICAgdmFyIGluZGV4ID0gVXRpbC5nZXRSYW5kb21JbnQoMCwgbWF4KTtcbiAgICBcbiAgICBzaXplID0gZm9udF9zaXplIC8gNTA7XG4gICAgYW5jaG9yID0gdGV4dF9jb29yZF9hcnJheVtpbmRleF07XG4gICAgbW92ZXIuaW5pdChwb3NpdGlvbiwgYW5jaG9yLCBzaXplKTtcbiAgICBtb3ZlcnNbaV0gPSBtb3ZlcjtcbiAgfVxuICBzY2F0dGVyZWRNb3ZlcigpO1xufTtcblxudmFyIGdldFRleHRDb29yZCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYXJyYXkgPSBbXTtcbiAgdmFyIGltYWdlX2RhdGEgPSBudWxsO1xuICBcbiAgZm9udF9zaXplID0gYm9keV93aWR0aCAvIFV0aWwuZ2V0Qnl0ZShmdF9zdHIpICogMS44O1xuICBmdF9jdHguY2xlYXJSZWN0KDAsIDAsIGJvZHlfd2lkdGgsIGJvZHlfaGVpZ2h0KTtcbiAgZnRfY3R4LmJlZ2luUGF0aCgpO1xuICBmdF9jdHguZmlsbFN0eWxlID0gJyMzMzMzMzMnO1xuICBmdF9jdHguZm9udCA9IGZvbnRfc2l6ZSArICdweCBBcmlhbCc7XG4gIGZ0X2N0eC50ZXh0QWxpZ24gPSAnY2VudGVyJztcbiAgZnRfY3R4LnRleHRCYXNlbGluZSA9ICdtaWRkbGUnO1xuICBmdF9jdHguZmlsbFRleHQoZnRfc3RyLCBib2R5X3dpZHRoIC8gMiwgYm9keV9oZWlnaHQgLyAyLjIpO1xuICBpbWFnZV9kYXRhID0gZnRfY3R4LmdldEltYWdlRGF0YSgwLCAwLCBib2R5X3dpZHRoLCBib2R5X2hlaWdodCkuZGF0YTtcbiAgXG4gIGZvciAodmFyIHkgPSAwOyB5IDwgYm9keV9oZWlnaHQ7IHkrKykge1xuICAgIGZvciAodmFyIHggPSAwOyB4IDwgYm9keV93aWR0aDsgeCsrKSB7XG4gICAgICB2YXIgaW5kZXggPSAoeSAqIGJvZHlfd2lkdGggKyB4KSAqIDQ7XG4gICAgICB2YXIgciA9IGltYWdlX2RhdGFbaW5kZXhdO1xuICAgICAgdmFyIGcgPSBpbWFnZV9kYXRhW2luZGV4ICsgMV07XG4gICAgICB2YXIgYiA9IGltYWdlX2RhdGFbaW5kZXggKyAyXTtcbiAgICAgIHZhciBhID0gaW1hZ2VfZGF0YVtpbmRleCArIDNdO1xuICAgICAgXG4gICAgICBpZiAoYSA+IDApIHtcbiAgICAgICAgYXJyYXkucHVzaChuZXcgVmVjdG9yMih4LCB5KSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBhcnJheTtcbn07XG5cbnZhciB1cGRhdGVNb3ZlciA9IGZ1bmN0aW9uKCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG1vdmVycy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBtb3ZlciA9IG1vdmVyc1tpXTtcbiAgICB2YXIgY29sbGlzaW9uID0gZmFsc2U7XG4gICAgXG4gICAgbW92ZXIuaG9vaygpO1xuICAgIG1vdmVyLmFwcGx5RHJhZ0ZvcmNlKCk7XG4gICAgbW92ZXIudXBkYXRlVmVsb2NpdHkoKTtcbiAgICBtb3Zlci51cGRhdGVQb3NpdGlvbigpO1xuICAgIG1vdmVyLmRyYXcoY3R4KTtcbiAgfVxufTtcblxudmFyIHNjYXR0ZXJlZE1vdmVyID0gZnVuY3Rpb24oKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbW92ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIG1vdmVyID0gbW92ZXJzW2ldO1xuICAgIHZhciByYWRpYW4gPSBVdGlsLmdldFJhZGlhbihVdGlsLmdldFJhbmRvbUludCgwLCAzNjApKTtcbiAgICB2YXIgdmVjdG9yID0gbmV3IFZlY3RvcjIoYm9keV93aWR0aCAvIDIsIGJvZHlfaGVpZ2h0IC8gMik7XG4gICAgdmFyIHNjYWxhciA9IDA7XG4gICAgdmFyIGZvcmNlID0gbnVsbDtcbiAgICBcbiAgICBtb3Zlci5wb3NpdGlvbi5jb3B5KHZlY3Rvcik7XG4gICAgc2NhbGFyID0gVXRpbC5nZXRSYW5kb21JbnQoYm9keV93aWR0aCAvIDEwLCBib2R5X3dpZHRoIC8gNCk7XG4gICAgZm9yY2UgPSBuZXcgVmVjdG9yMihNYXRoLmNvcyhyYWRpYW4pICogc2NhbGFyLCBNYXRoLnNpbihyYWRpYW4pICogc2NhbGFyKTtcbiAgICBtb3Zlci5hcHBseUZvcmNlKGZvcmNlKTtcbiAgfVxufTtcblxudmFyIGFwcGx5Rm9yY2VNb3VzZSA9IGZ1bmN0aW9uKHZlY3Rvciwgc2NhbGFyX2Jhc2UpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3ZlcnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZGlzdGFuY2UgPSB2ZWN0b3IuZGlzdGFuY2VUbyhtb3ZlcnNbaV0ucG9zaXRpb24pO1xuICAgIHZhciBkaXJlY3QgPSB2ZWN0b3IuY2xvbmUoKS5zdWIobW92ZXJzW2ldLnBvc2l0aW9uKTtcbiAgICB2YXIgc2NhbGFyID0gKHNjYWxhcl9iYXNlIC0gZGlzdGFuY2UpIC8gMTAwO1xuICAgIHZhciBmb3JjZSA9IG51bGw7XG4gICAgXG4gICAgaWYgKHNjYWxhciA8IDApIHNjYWxhciA9IDA7XG4gICAgZGlyZWN0Lm5vcm1hbGl6ZSgpO1xuICAgIGZvcmNlID0gZGlyZWN0Lm11bHRTY2FsYXIoc2NhbGFyICogLTEpO1xuICAgIG1vdmVyc1tpXS5hcHBseUZvcmNlKGZvcmNlKTtcbiAgfTtcbn07XG5cbnZhciBjaGVja0lucHV0VmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgaWYgKGlucHV0LnZhbHVlID09PSBmdF9zdHIpIHJldHVybjtcbiAgZnRfc3RyID0gaW5wdXQudmFsdWU7XG4gIHRleHRfY29vcmRfYXJyYXkgPSBnZXRUZXh0Q29vcmQoKTtcbiAgaW5pdE1vdmVyKCk7XG59O1xuXG52YXIgcmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gIGN0eC5jbGVhclJlY3QoMCwgMCwgYm9keV93aWR0aCwgYm9keV9oZWlnaHQpO1xuICB1cGRhdGVNb3ZlcigpO1xufTtcblxudmFyIHJlbmRlcmxvb3AgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXJsb29wKTtcblxuICBpZiAobm93IC0gbGFzdF90aW1lX3JlbmRlciA+IDEwMDAgLyBmcHMpIHtcbiAgICByZW5kZXIoKTtcbiAgICBsYXN0X3RpbWVfcmVuZGVyID0gRGF0ZS5ub3coKTtcbiAgfVxufTtcblxudmFyIHJlc2l6ZUNhbnZhcyA9IGZ1bmN0aW9uKCkge1xuICBib2R5X3dpZHRoICA9IGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGggKiAyO1xuICBib2R5X2hlaWdodCA9IGRvY3VtZW50LmJvZHkuY2xpZW50SGVpZ2h0ICogMjtcblxuICBjYW52YXMud2lkdGggPSBib2R5X3dpZHRoO1xuICBjYW52YXMuaGVpZ2h0ID0gYm9keV9oZWlnaHQ7XG4gIGNhbnZhcy5zdHlsZS53aWR0aCA9IGJvZHlfd2lkdGggLyAyICsgJ3B4JztcbiAgY2FudmFzLnN0eWxlLmhlaWdodCA9IGJvZHlfaGVpZ2h0IC8gMiArICdweCc7XG4gIGZ0X2NhbnZhcy53aWR0aCA9IGJvZHlfd2lkdGg7XG4gIGZ0X2NhbnZhcy5oZWlnaHQgPSBib2R5X2hlaWdodDtcbn07XG5cbnZhciBzZXRFdmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGV2ZW50VG91Y2hTdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW92ZXJzX251bTsgaSsrKSB7XG4gICAgICB2YXIgaW5kZXggPSBVdGlsLmdldFJhbmRvbUludCgwLCBtYXgpO1xuICAgICAgbW92ZXJzW2ldLmFuY2hvciA9IHRleHRfY29vcmRfYXJyYXlbaW5kZXhdO1xuICAgIH1cbiAgICBzY2F0dGVyZWRNb3ZlcigpO1xuICB9O1xuICBcbiAgdmFyIGV2ZW50VG91Y2hNb3ZlID0gZnVuY3Rpb24oKSB7XG4gIH07XG4gIFxuICB2YXIgZXZlbnRUb3VjaEVuZCA9IGZ1bmN0aW9uKCkge1xuICB9O1xuXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xuXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdzZWxlY3RzdGFydCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIH0pO1xuXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZlY3Rvcl9tb3VzZS5zZXQoZXZlbnQuY2xpZW50WCAqIDIsIGV2ZW50LmNsaWVudFkgKiAyKTtcbiAgICBldmVudFRvdWNoU3RhcnQoKTtcbiAgfSk7XG5cbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgdmVjdG9yX21vdXNlLnNldChldmVudC5jbGllbnRYICogMiwgZXZlbnQuY2xpZW50WSAqIDIpO1xuICAgIGV2ZW50VG91Y2hNb3ZlKCk7XG4gIH0pO1xuXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldmVudFRvdWNoRW5kKCk7XG4gIH0pO1xuXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB2ZWN0b3JfbW91c2Uuc2V0KGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WCAqIDIsIGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WSAqIDIpO1xuICAgIGV2ZW50VG91Y2hTdGFydCgpO1xuICB9KTtcblxuICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB2ZWN0b3JfbW91c2Uuc2V0KGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WCAqIDIsIGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WSAqIDIpO1xuICAgIGV2ZW50VG91Y2hNb3ZlKCk7XG4gIH0pO1xuXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZlbnRUb3VjaEVuZCgpO1xuICB9KTtcbn07XG5cbmluaXQoKTtcbiIsInZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgVmVjdG9yMiA9IHJlcXVpcmUoJy4vdmVjdG9yMicpO1xudmFyIEZvcmNlID0gcmVxdWlyZSgnLi9mb3JjZScpO1xuXG52YXIgZXhwb3J0cyA9IGZ1bmN0aW9uKCl7XG4gIHZhciBNb3ZlciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucG9zaXRpb24gPSBuZXcgVmVjdG9yMigpO1xuICAgIHRoaXMudmVsb2NpdHkgPSBuZXcgVmVjdG9yMigpO1xuICAgIHRoaXMuYWNjZWxlcmF0aW9uID0gbmV3IFZlY3RvcjIoKTtcbiAgICB0aGlzLmFuY2hvciA9IG5ldyBWZWN0b3IyKCk7XG4gICAgdGhpcy5yYWRpdXMgPSAwO1xuICAgIHRoaXMubWFzcyA9IDA7XG4gICAgdGhpcy5kaXJlY3Rpb24gPSAwO1xuICAgIHRoaXMuayA9IDAuMTtcbiAgICB0aGlzLnIgPSBVdGlsLmdldFJhbmRvbUludCgyMjAsIDI1NSk7XG4gICAgdGhpcy5nID0gVXRpbC5nZXRSYW5kb21JbnQoMTIwLCAyMzUpO1xuICAgIHRoaXMuYiA9IFV0aWwuZ2V0UmFuZG9tSW50KDEyMCwgMjM1KTtcbiAgfTtcbiAgXG4gIE1vdmVyLnByb3RvdHlwZSA9IHtcbiAgICBpbml0OiBmdW5jdGlvbihwb3NpdGlvbiwgYW5jaG9yLCBzaXplKSB7XG4gICAgICB0aGlzLnJhZGl1cyA9IFV0aWwuZ2V0UmFuZG9tSW50KHNpemUsIHNpemUgKiAzKTtcbiAgICAgIHRoaXMubWFzcyA9IHRoaXMucmFkaXVzIC8gMTA7XG4gICAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb24uY2xvbmUoKTtcbiAgICAgIHRoaXMudmVsb2NpdHkgPSBwb3NpdGlvbi5jbG9uZSgpO1xuICAgICAgdGhpcy5hbmNob3IgPSBhbmNob3IuY2xvbmUoKTtcbiAgICB9LFxuICAgIHVwZGF0ZVBvc2l0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMucG9zaXRpb24uY29weSh0aGlzLnZlbG9jaXR5KTtcbiAgICB9LFxuICAgIHVwZGF0ZVZlbG9jaXR5OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMudmVsb2NpdHkuYWRkKHRoaXMuYWNjZWxlcmF0aW9uKTtcbiAgICAgIGlmICh0aGlzLnZlbG9jaXR5LmRpc3RhbmNlVG8odGhpcy5wb3NpdGlvbikgPj0gMSkge1xuICAgICAgICB0aGlzLmRpcmVjdCh0aGlzLnZlbG9jaXR5KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGFwcGx5Rm9yY2U6IGZ1bmN0aW9uKHZlY3Rvcikge1xuICAgICAgdGhpcy5hY2NlbGVyYXRpb24uYWRkKHZlY3Rvcik7XG4gICAgfSxcbiAgICBhcHBseUZyaWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBmcmljdGlvbiA9IEZvcmNlLmZyaWN0aW9uKHRoaXMuYWNjZWxlcmF0aW9uLCAwLjEpO1xuICAgICAgdGhpcy5hcHBseUZvcmNlKGZyaWN0aW9uKTtcbiAgICB9LFxuICAgIGFwcGx5RHJhZ0ZvcmNlOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBkcmFnID0gRm9yY2UuZHJhZyh0aGlzLmFjY2VsZXJhdGlvbiwgMC4yNCk7XG4gICAgICB0aGlzLmFwcGx5Rm9yY2UoZHJhZyk7XG4gICAgfSxcbiAgICBob29rOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBmb3JjZSA9IEZvcmNlLmhvb2sodGhpcy52ZWxvY2l0eSwgdGhpcy5hbmNob3IsIHRoaXMuayk7XG4gICAgICB0aGlzLmFwcGx5Rm9yY2UoZm9yY2UpO1xuICAgIH0sXG4gICAgcmVib3VuZDogZnVuY3Rpb24odmVjdG9yKSB7XG4gICAgICB2YXIgZG90ID0gdGhpcy5hY2NlbGVyYXRpb24uY2xvbmUoKS5kb3QodmVjdG9yKTtcbiAgICAgIHRoaXMuYWNjZWxlcmF0aW9uLnN1Yih2ZWN0b3IubXVsdFNjYWxhcigyICogZG90KSk7XG4gICAgICB0aGlzLmFjY2VsZXJhdGlvbi5tdWx0U2NhbGFyKDAuOCk7XG4gICAgfSxcbiAgICBkaXJlY3Q6IGZ1bmN0aW9uKHZlY3Rvcikge1xuICAgICAgdmFyIHYgPSB2ZWN0b3IuY2xvbmUoKS5zdWIodGhpcy5wb3NpdGlvbik7XG4gICAgICB0aGlzLmRpcmVjdGlvbiA9IE1hdGguYXRhbjIodi55LCB2LngpO1xuICAgIH0sXG4gICAgZHJhdzogZnVuY3Rpb24oY29udGV4dCwgbW9kZSkge1xuICAgICAgdmFyIHJlc2l6ZSA9IE1hdGguZmxvb3IodGhpcy5hY2NlbGVyYXRpb24ubGVuZ3RoKCkgLyAxMCk7XG4gICAgICBjb250ZXh0LmZpbGxTdHlsZSA9ICdyZ2IoJyArIHRoaXMuciArICcsJyArIHRoaXMuZyArICcsJyArIHRoaXMuYiArICcpJztcbiAgICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICBjb250ZXh0LmFyYyh0aGlzLnBvc2l0aW9uLngsIHRoaXMucG9zaXRpb24ueSwgdGhpcy5yYWRpdXMgKyByZXNpemUsIDAsIE1hdGguUEkgLyAxODAsIHRydWUpO1xuICAgICAgY29udGV4dC5maWxsKCk7XG4gICAgfVxuICB9O1xuICBcbiAgcmV0dXJuIE1vdmVyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzKCk7XG4iLCJ2YXIgZXhwb3J0cyA9IHtcbiAgZ2V0UmFuZG9tSW50OiBmdW5jdGlvbihtaW4sIG1heCl7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pKSArIG1pbjtcbiAgfSxcbiAgZ2V0RGVncmVlOiBmdW5jdGlvbihyYWRpYW4pIHtcbiAgICByZXR1cm4gcmFkaWFuIC8gTWF0aC5QSSAqIDE4MDtcbiAgfSxcbiAgZ2V0UmFkaWFuOiBmdW5jdGlvbihkZWdyZWVzKSB7XG4gICAgcmV0dXJuIGRlZ3JlZXMgKiBNYXRoLlBJIC8gMTgwO1xuICB9LFxuICBnZXRTcGhlcmljYWw6IGZ1bmN0aW9uKHJhZDEsIHJhZDIsIHIpIHtcbiAgICB2YXIgeCA9IE1hdGguY29zKHJhZDEpICogTWF0aC5jb3MocmFkMikgKiByO1xuICAgIHZhciB6ID0gTWF0aC5jb3MocmFkMSkgKiBNYXRoLnNpbihyYWQyKSAqIHI7XG4gICAgdmFyIHkgPSBNYXRoLnNpbihyYWQxKSAqIHI7XG4gICAgcmV0dXJuIFt4LCB5LCB6XTtcbiAgfSxcbiAgZ2V0Qnl0ZTogZnVuY3Rpb24oc3RyKSB7XG4gICAgdmFyIGIgPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBuID0gZXNjYXBlKHN0ci5jaGFyQXQoaSkpO1xuICAgICAgaWYgKG4ubGVuZ3RoIDwgNCkge1xuICAgICAgICBiICs9IDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBiICs9IDI7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBiO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHM7XG4iLCIvLyBcbi8vIOOBk+OBrlZlY3RvcjLjgq/jg6njgrnjga/jgIF0aHJlZS5qc+OBrlRIUkVFLlZlY3RvcjLjgq/jg6njgrnjga7oqIjnrpflvI/jga7kuIDpg6jjgpLliKnnlKjjgZfjgabjgYTjgb7jgZnjgIJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tcmRvb2IvdGhyZWUuanMvYmxvYi9tYXN0ZXIvc3JjL21hdGgvVmVjdG9yMi5qcyNMMzY3XG4vLyBcblxudmFyIGV4cG9ydHMgPSBmdW5jdGlvbigpe1xuICB2YXIgVmVjdG9yMiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB0aGlzLnggPSB4IHx8IDA7XG4gICAgdGhpcy55ID0geSB8fCAwO1xuICB9O1xuICBcbiAgVmVjdG9yMi5wcm90b3R5cGUgPSB7XG4gICAgc2V0OiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgdGhpcy54ID0geDtcbiAgICAgIHRoaXMueSA9IHk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGNvcHk6IGZ1bmN0aW9uICh2KSB7XG4gICAgICB0aGlzLnggPSB2Lng7XG4gICAgICB0aGlzLnkgPSB2Lnk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGFkZDogZnVuY3Rpb24gKHYpIHtcbiAgICAgIHRoaXMueCArPSB2Lng7XG4gICAgICB0aGlzLnkgKz0gdi55O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBhZGRTY2FsYXI6IGZ1bmN0aW9uIChzKSB7XG4gICAgICB0aGlzLnggKz0gcztcbiAgICAgIHRoaXMueSArPSBzO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzdWI6IGZ1bmN0aW9uICh2KSB7XG4gICAgICB0aGlzLnggLT0gdi54O1xuICAgICAgdGhpcy55IC09IHYueTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgc3ViU2NhbGFyOiBmdW5jdGlvbiAocykge1xuICAgICAgdGhpcy54IC09IHM7XG4gICAgICB0aGlzLnkgLT0gcztcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgbXVsdDogZnVuY3Rpb24gKHYpIHtcbiAgICAgIHRoaXMueCAqPSB2Lng7XG4gICAgICB0aGlzLnkgKj0gdi55O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBtdWx0U2NhbGFyOiBmdW5jdGlvbiAocykge1xuICAgICAgdGhpcy54ICo9IHM7XG4gICAgICB0aGlzLnkgKj0gcztcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgZGl2OiBmdW5jdGlvbiAodikge1xuICAgICAgdGhpcy54IC89IHYueDtcbiAgICAgIHRoaXMueSAvPSB2Lnk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGRpdlNjYWxhcjogZnVuY3Rpb24gKHMpIHtcbiAgICAgIHRoaXMueCAvPSBzO1xuICAgICAgdGhpcy55IC89IHM7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIG1pbjogZnVuY3Rpb24gKHYpIHtcbiAgICAgIGlmICggdGhpcy54IDwgdi54ICkgdGhpcy54ID0gdi54O1xuICAgICAgaWYgKCB0aGlzLnkgPCB2LnkgKSB0aGlzLnkgPSB2Lnk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIG1heDogZnVuY3Rpb24gKHYpIHtcbiAgICAgIGlmICggdGhpcy54ID4gdi54ICkgdGhpcy54ID0gdi54O1xuICAgICAgaWYgKCB0aGlzLnkgPiB2LnkgKSB0aGlzLnkgPSB2Lnk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGNsYW1wOiBmdW5jdGlvbiAodl9taW4sIHZfbWF4KSB7XG4gICAgICBpZiAoIHRoaXMueCA8IHZfbWluLnggKSB7XG4gICAgICAgIHRoaXMueCA9IHZfbWluLng7XG4gICAgICB9IGVsc2UgaWYgKCB0aGlzLnggPiB2X21heC54ICkge1xuICAgICAgICB0aGlzLnggPSB2X21heC54O1xuICAgICAgfVxuICAgICAgaWYgKCB0aGlzLnkgPCB2X21pbi55ICkge1xuICAgICAgICB0aGlzLnkgPSB2X21pbi55O1xuICAgICAgfSBlbHNlIGlmICggdGhpcy55ID4gdl9tYXgueSApIHtcbiAgICAgICAgdGhpcy55ID0gdl9tYXgueTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgZmxvb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMueCA9IE1hdGguZmxvb3IoIHRoaXMueCApO1xuICAgICAgdGhpcy55ID0gTWF0aC5mbG9vciggdGhpcy55ICk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGNlaWw6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMueCA9IE1hdGguY2VpbCggdGhpcy54ICk7XG4gICAgICB0aGlzLnkgPSBNYXRoLmNlaWwoIHRoaXMueSApO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByb3VuZDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy54ID0gTWF0aC5yb3VuZCggdGhpcy54ICk7XG4gICAgICB0aGlzLnkgPSBNYXRoLnJvdW5kKCB0aGlzLnkgKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcm91bmRUb1plcm86IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMueCA9ICggdGhpcy54IDwgMCApID8gTWF0aC5jZWlsKCB0aGlzLnggKSA6IE1hdGguZmxvb3IoIHRoaXMueCApO1xuICAgICAgdGhpcy55ID0gKCB0aGlzLnkgPCAwICkgPyBNYXRoLmNlaWwoIHRoaXMueSApIDogTWF0aC5mbG9vciggdGhpcy55ICk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIG5lZ2F0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy54ID0gLSB0aGlzLng7XG4gICAgICB0aGlzLnkgPSAtIHRoaXMueTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgZG90OiBmdW5jdGlvbiAodikge1xuICAgICAgcmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueTtcbiAgICB9LFxuICAgIGxlbmd0aFNxOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55O1xuICAgIH0sXG4gICAgbGVuZ3RoOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMubGVuZ3RoU3EoKSk7XG4gICAgfSxcbiAgICBub3JtYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLmRpdlNjYWxhcih0aGlzLmxlbmd0aCgpKTtcbiAgICB9LFxuICAgIGRpc3RhbmNlVG86IGZ1bmN0aW9uICh2KSB7XG4gICAgICB2YXIgZHggPSB0aGlzLnggLSB2Lng7XG4gICAgICB2YXIgZHkgPSB0aGlzLnkgLSB2Lnk7XG4gICAgICByZXR1cm4gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcbiAgICB9LFxuICAgIHNldExlbmd0aDogZnVuY3Rpb24gKGwpIHtcbiAgICAgIHZhciBvbGRMZW5ndGggPSB0aGlzLmxlbmd0aCgpO1xuICAgICAgaWYgKCBvbGRMZW5ndGggIT09IDAgJiYgbCAhPT0gb2xkTGVuZ3RoICkge1xuICAgICAgICB0aGlzLm11bHRTY2FsYXIobCAvIG9sZExlbmd0aCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGNsb25lOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gbmV3IFZlY3RvcjIodGhpcy54LCB0aGlzLnkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBWZWN0b3IyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzKCk7XG4iXX0=
