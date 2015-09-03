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
    var position = new Vector2(body_width / 2, body_height / 2);
    var anchor = null;
    var size = 0;
    var index = Util.getRandomInt(0, max);
    
    size = body_width / 360;
    anchor = text_coord_array[index];
    mover.init(position, anchor, size);
    movers[i] = mover;
  }
  scatteredMover();
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
    this.r = Util.getRandomInt(100, 220);
    this.g = Util.getRandomInt(220, 255);
    this.b = Util.getRandomInt(100, 160);
  };
  
  Mover.prototype = {
    init: function(position, anchor, size) {
      this.radius = Util.getRandomInt(size, size * 5);
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
      var resize = Math.floor(this.acceleration.length() / 5);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvZGVib3VuY2UuanMiLCJzcmMvanMvZm9yY2UuanMiLCJzcmMvanMvbWFpbi5qcyIsInNyYy9qcy9tb3Zlci5qcyIsInNyYy9qcy91dGlsLmpzIiwic3JjL2pzL3ZlY3RvcjIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqZWN0LCBldmVudFR5cGUsIGNhbGxiYWNrKXtcclxuICB2YXIgdGltZXI7XHJcblxyXG4gIG9iamVjdC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XHJcbiAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgY2FsbGJhY2soZXZlbnQpO1xyXG4gICAgfSwgNTAwKTtcclxuICB9LCBmYWxzZSk7XHJcbn07XHJcbiIsInZhciBWZWN0b3IyID0gcmVxdWlyZSgnLi92ZWN0b3IyJyk7XHJcblxyXG52YXIgZXhwb3J0cyA9IHtcclxuICBmcmljdGlvbjogZnVuY3Rpb24odmVjdG9yLCB2YWx1ZSkge1xyXG4gICAgdmFyIGZvcmNlID0gdmVjdG9yLmNsb25lKCk7XHJcbiAgICBmb3JjZS5tdWx0U2NhbGFyKC0xKTtcclxuICAgIGZvcmNlLm5vcm1hbGl6ZSgpO1xyXG4gICAgZm9yY2UubXVsdFNjYWxhcih2YWx1ZSk7XHJcbiAgICByZXR1cm4gZm9yY2U7XHJcbiAgfSxcclxuICBkcmFnOiBmdW5jdGlvbih2ZWN0b3IsIHZhbHVlKSB7XHJcbiAgICB2YXIgZm9yY2UgPSB2ZWN0b3IuY2xvbmUoKTtcclxuICAgIGZvcmNlLm11bHRTY2FsYXIoLTEpO1xyXG4gICAgZm9yY2Uubm9ybWFsaXplKCk7XHJcbiAgICBmb3JjZS5tdWx0U2NhbGFyKHZlY3Rvci5sZW5ndGgoKSAqIHZhbHVlKTtcclxuICAgIHJldHVybiBmb3JjZTtcclxuICB9LFxyXG4gIGhvb2s6IGZ1bmN0aW9uKHZfdmVsb2NpdHksIHZfYW5jaG9yLCBrKSB7XHJcbiAgICB2YXIgZm9yY2UgPSB2X3ZlbG9jaXR5LmNsb25lKCkuc3ViKHZfYW5jaG9yKTtcclxuICAgIHZhciBkaXN0YW5jZSA9IGZvcmNlLmxlbmd0aCgpO1xyXG4gICAgaWYgKGRpc3RhbmNlID4gMCkge1xyXG4gICAgICBmb3JjZS5ub3JtYWxpemUoKTtcclxuICAgICAgZm9yY2UubXVsdFNjYWxhcigtMSAqIGsgKiBkaXN0YW5jZSk7XHJcbiAgICAgIHJldHVybiBmb3JjZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBuZXcgVmVjdG9yMigpO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cztcclxuIiwidmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcclxudmFyIFZlY3RvcjIgPSByZXF1aXJlKCcuL3ZlY3RvcjInKTtcclxudmFyIEZvcmNlID0gcmVxdWlyZSgnLi9mb3JjZScpO1xyXG52YXIgTW92ZXIgPSByZXF1aXJlKCcuL21vdmVyJyk7XHJcbnZhciBkZWJvdW5jZSA9IHJlcXVpcmUoJy4vZGVib3VuY2UnKTtcclxuXHJcbnZhciBib2R5X3dpZHRoICA9IGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGggKiAyO1xyXG52YXIgYm9keV9oZWlnaHQgPSBkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodCAqIDI7XHJcbnZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzJyk7XHJcbnZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxudmFyIGZwcyA9IDYwO1xyXG52YXIgbGFzdF90aW1lX3JlbmRlciA9IERhdGUubm93KCk7XHJcblxyXG52YXIgbW92ZXJzID0gW107XHJcbnZhciBtb3ZlcnNfbnVtID0gMTIwMDtcclxudmFyIG1heCA9IDA7XHJcblxyXG52YXIgZnRfY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbnZhciBmdF9jdHggPSBmdF9jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxudmFyIGZ0X3N0ciA9ICdAeWtvYic7XHJcbnZhciB0ZXh0X2Nvb3JkX2FycmF5ID0gW107XHJcblxyXG52YXIgdmVjdG9yX21vdXNlID0gbmV3IFZlY3RvcjIoKTtcclxuXHJcbnZhciBpbml0ID0gZnVuY3Rpb24oKSB7XHJcbiAgcmVuZGVybG9vcCgpO1xyXG4gIHNldEV2ZW50KCk7XHJcbiAgcmVzaXplQ2FudmFzKCk7XHJcbiAgdGV4dF9jb29yZF9hcnJheSA9IGdldFRleHRDb29yZCgpO1xyXG4gIGludE1vdmVyKCk7XHJcbiAgZGVib3VuY2Uod2luZG93LCAncmVzaXplJywgZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgcmVzaXplQ2FudmFzKCk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG52YXIgaW50TW92ZXIgPSBmdW5jdGlvbigpIHtcclxuICBtYXggPSB0ZXh0X2Nvb3JkX2FycmF5Lmxlbmd0aCAtIDE7XHJcbiAgXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3ZlcnNfbnVtOyBpKyspIHtcclxuICAgIHZhciBtb3ZlciA9IG5ldyBNb3ZlcigpO1xyXG4gICAgdmFyIHBvc2l0aW9uID0gbmV3IFZlY3RvcjIoYm9keV93aWR0aCAvIDIsIGJvZHlfaGVpZ2h0IC8gMik7XHJcbiAgICB2YXIgYW5jaG9yID0gbnVsbDtcclxuICAgIHZhciBzaXplID0gMDtcclxuICAgIHZhciBpbmRleCA9IFV0aWwuZ2V0UmFuZG9tSW50KDAsIG1heCk7XHJcbiAgICBcclxuICAgIHNpemUgPSBib2R5X3dpZHRoIC8gMzYwO1xyXG4gICAgYW5jaG9yID0gdGV4dF9jb29yZF9hcnJheVtpbmRleF07XHJcbiAgICBtb3Zlci5pbml0KHBvc2l0aW9uLCBhbmNob3IsIHNpemUpO1xyXG4gICAgbW92ZXJzW2ldID0gbW92ZXI7XHJcbiAgfVxyXG4gIHNjYXR0ZXJlZE1vdmVyKCk7XHJcbn07XHJcblxyXG52YXIgZ2V0VGV4dENvb3JkID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIGFycmF5ID0gW107XHJcbiAgdmFyIGltYWdlX2RhdGEgPSBudWxsO1xyXG4gIFxyXG4gIGZ0X2N0eC5iZWdpblBhdGgoKTtcclxuICBmdF9jdHguZmlsbFN0eWxlID0gJyMzMzMzMzMnO1xyXG4gIGZ0X2N0eC5mb250ID0gYm9keV93aWR0aCAvIGZ0X3N0ci5sZW5ndGggKyAncHggQXJpYWwnO1xyXG4gIGZ0X2N0eC50ZXh0QWxpZ24gPSAnY2VudGVyJztcclxuICBmdF9jdHgudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XHJcbiAgZnRfY3R4LmZpbGxUZXh0KGZ0X3N0ciwgYm9keV93aWR0aCAvIDIsIGJvZHlfaGVpZ2h0IC8gMik7XHJcbiAgaW1hZ2VfZGF0YSA9IGZ0X2N0eC5nZXRJbWFnZURhdGEoMCwgMCwgYm9keV93aWR0aCwgYm9keV9oZWlnaHQpLmRhdGE7XHJcbiAgXHJcbiAgZm9yICh2YXIgeSA9IDA7IHkgPCBib2R5X2hlaWdodDsgeSsrKSB7XHJcbiAgICBmb3IgKHZhciB4ID0gMDsgeCA8IGJvZHlfd2lkdGg7IHgrKykge1xyXG4gICAgICB2YXIgaW5kZXggPSAoeSAqIGJvZHlfd2lkdGggKyB4KSAqIDQ7XHJcbiAgICAgIHZhciByID0gaW1hZ2VfZGF0YVtpbmRleF07XHJcbiAgICAgIHZhciBnID0gaW1hZ2VfZGF0YVtpbmRleCArIDFdO1xyXG4gICAgICB2YXIgYiA9IGltYWdlX2RhdGFbaW5kZXggKyAyXTtcclxuICAgICAgdmFyIGEgPSBpbWFnZV9kYXRhW2luZGV4ICsgM107XHJcbiAgICAgIFxyXG4gICAgICBpZiAoYSA+IDApIHtcclxuICAgICAgICBhcnJheS5wdXNoKG5ldyBWZWN0b3IyKHgsIHkpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gYXJyYXk7XHJcbn07XHJcblxyXG52YXIgdXBkYXRlTW92ZXIgPSBmdW5jdGlvbigpIHtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IG1vdmVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgdmFyIG1vdmVyID0gbW92ZXJzW2ldO1xyXG4gICAgdmFyIGNvbGxpc2lvbiA9IGZhbHNlO1xyXG4gICAgXHJcbiAgICBtb3Zlci5ob29rKCk7XHJcbiAgICBtb3Zlci5hcHBseURyYWdGb3JjZSgpO1xyXG4gICAgbW92ZXIudXBkYXRlVmVsb2NpdHkoKTtcclxuICAgIG1vdmVyLnVwZGF0ZVBvc2l0aW9uKCk7XHJcbiAgICBtb3Zlci5kcmF3KGN0eCk7XHJcbiAgfVxyXG59O1xyXG5cclxudmFyIHNjYXR0ZXJlZE1vdmVyID0gZnVuY3Rpb24oKSB7XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3ZlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgIHZhciBtb3ZlciA9IG1vdmVyc1tpXTtcclxuICAgIHZhciByYWRpYW4gPSBVdGlsLmdldFJhZGlhbihVdGlsLmdldFJhbmRvbUludCgwLCAzNjApKTtcclxuICAgIHZhciB2ZWN0b3IgPSBuZXcgVmVjdG9yMihib2R5X3dpZHRoIC8gMiwgYm9keV9oZWlnaHQgLyAyKTtcclxuICAgIHZhciBzY2FsYXIgPSAwO1xyXG4gICAgdmFyIGZvcmNlID0gbnVsbDtcclxuICAgIFxyXG4gICAgbW92ZXIucG9zaXRpb24uY29weSh2ZWN0b3IpO1xyXG4gICAgc2NhbGFyID0gVXRpbC5nZXRSYW5kb21JbnQoYm9keV93aWR0aCAvIDEwLCBib2R5X3dpZHRoIC8gNCk7XHJcbiAgICBmb3JjZSA9IG5ldyBWZWN0b3IyKE1hdGguY29zKHJhZGlhbikgKiBzY2FsYXIsIE1hdGguc2luKHJhZGlhbikgKiBzY2FsYXIpO1xyXG4gICAgbW92ZXIuYXBwbHlGb3JjZShmb3JjZSk7XHJcbiAgfVxyXG59O1xyXG5cclxudmFyIGFwcGx5Rm9yY2VNb3VzZUxvb3AgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgc2NhbGFyID0gMjAwMDtcclxuICBcclxuICBhcHBseUZvcmNlTW91c2UodmVjdG9yX21vdXNlLCBzY2FsYXIpO1xyXG59O1xyXG5cclxudmFyIGFwcGx5Rm9yY2VNb3VzZSA9IGZ1bmN0aW9uKHZlY3Rvciwgc2NhbGFyX2Jhc2UpIHtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IG1vdmVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgdmFyIGRpc3RhbmNlID0gdmVjdG9yLmRpc3RhbmNlVG8obW92ZXJzW2ldLnBvc2l0aW9uKTtcclxuICAgIHZhciBkaXJlY3QgPSB2ZWN0b3IuY2xvbmUoKS5zdWIobW92ZXJzW2ldLnBvc2l0aW9uKTtcclxuICAgIHZhciBzY2FsYXIgPSAoc2NhbGFyX2Jhc2UgLSBkaXN0YW5jZSkgLyAxMDA7XHJcbiAgICB2YXIgZm9yY2UgPSBudWxsO1xyXG4gICAgXHJcbiAgICBpZiAoc2NhbGFyIDwgMCkgc2NhbGFyID0gMDtcclxuICAgIGRpcmVjdC5ub3JtYWxpemUoKTtcclxuICAgIGZvcmNlID0gZGlyZWN0Lm11bHRTY2FsYXIoc2NhbGFyICogLTEpO1xyXG4gICAgbW92ZXJzW2ldLmFwcGx5Rm9yY2UoZm9yY2UpO1xyXG4gIH07XHJcbn07XHJcblxyXG52YXIgcmVuZGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgY3R4LmNsZWFyUmVjdCgwLCAwLCBib2R5X3dpZHRoLCBib2R5X2hlaWdodCk7XHJcbiAgYXBwbHlGb3JjZU1vdXNlTG9vcCgpO1xyXG4gIHVwZGF0ZU1vdmVyKCk7XHJcbn07XHJcblxyXG52YXIgcmVuZGVybG9vcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBub3cgPSBEYXRlLm5vdygpO1xyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXJsb29wKTtcclxuXHJcbiAgaWYgKG5vdyAtIGxhc3RfdGltZV9yZW5kZXIgPiAxMDAwIC8gZnBzKSB7XHJcbiAgICByZW5kZXIoKTtcclxuICAgIGxhc3RfdGltZV9yZW5kZXIgPSBEYXRlLm5vdygpO1xyXG4gIH1cclxufTtcclxuXHJcbnZhciByZXNpemVDYW52YXMgPSBmdW5jdGlvbigpIHtcclxuICBib2R5X3dpZHRoICA9IGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGggKiAyO1xyXG4gIGJvZHlfaGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5jbGllbnRIZWlnaHQgKiAyO1xyXG5cclxuICBjYW52YXMud2lkdGggPSBib2R5X3dpZHRoO1xyXG4gIGNhbnZhcy5oZWlnaHQgPSBib2R5X2hlaWdodDtcclxuICBjYW52YXMuc3R5bGUud2lkdGggPSBib2R5X3dpZHRoIC8gMiArICdweCc7XHJcbiAgY2FudmFzLnN0eWxlLmhlaWdodCA9IGJvZHlfaGVpZ2h0IC8gMiArICdweCc7XHJcbiAgZnRfY2FudmFzLndpZHRoID0gYm9keV93aWR0aDtcclxuICBmdF9jYW52YXMuaGVpZ2h0ID0gYm9keV9oZWlnaHQ7XHJcbn07XHJcblxyXG52YXIgc2V0RXZlbnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgdmFyIGV2ZW50VG91Y2hTdGFydCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgc2NhdHRlcmVkTW92ZXIoKTtcclxuICB9O1xyXG4gIFxyXG4gIHZhciBldmVudFRvdWNoTW92ZSA9IGZ1bmN0aW9uKCkge1xyXG4gIH07XHJcbiAgXHJcbiAgdmFyIGV2ZW50VG91Y2hFbmQgPSBmdW5jdGlvbigpIHtcclxuICB9O1xyXG5cclxuICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgfSk7XHJcblxyXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdzZWxlY3RzdGFydCcsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICB9KTtcclxuXHJcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIHZlY3Rvcl9tb3VzZS5zZXQoZXZlbnQuY2xpZW50WCAqIDIsIGV2ZW50LmNsaWVudFkgKiAyKTtcclxuICAgIGV2ZW50VG91Y2hTdGFydCgpO1xyXG4gIH0pO1xyXG5cclxuICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdmVjdG9yX21vdXNlLnNldChldmVudC5jbGllbnRYICogMiwgZXZlbnQuY2xpZW50WSAqIDIpO1xyXG4gICAgZXZlbnRUb3VjaE1vdmUoKTtcclxuICB9KTtcclxuXHJcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBldmVudFRvdWNoRW5kKCk7XHJcbiAgfSk7XHJcblxyXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdmVjdG9yX21vdXNlLnNldChldmVudC50b3VjaGVzWzBdLmNsaWVudFggKiAyLCBldmVudC50b3VjaGVzWzBdLmNsaWVudFkgKiAyKTtcclxuICAgIGV2ZW50VG91Y2hTdGFydCgpO1xyXG4gIH0pO1xyXG5cclxuICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdmVjdG9yX21vdXNlLnNldChldmVudC50b3VjaGVzWzBdLmNsaWVudFggKiAyLCBldmVudC50b3VjaGVzWzBdLmNsaWVudFkgKiAyKTtcclxuICAgIGV2ZW50VG91Y2hNb3ZlKCk7XHJcbiAgfSk7XHJcblxyXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIGV2ZW50VG91Y2hFbmQoKTtcclxuICB9KTtcclxufTtcclxuXHJcbmluaXQoKTtcclxuIiwidmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcclxudmFyIFZlY3RvcjIgPSByZXF1aXJlKCcuL3ZlY3RvcjInKTtcclxudmFyIEZvcmNlID0gcmVxdWlyZSgnLi9mb3JjZScpO1xyXG5cclxudmFyIGV4cG9ydHMgPSBmdW5jdGlvbigpe1xyXG4gIHZhciBNb3ZlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBWZWN0b3IyKCk7XHJcbiAgICB0aGlzLnZlbG9jaXR5ID0gbmV3IFZlY3RvcjIoKTtcclxuICAgIHRoaXMuYWNjZWxlcmF0aW9uID0gbmV3IFZlY3RvcjIoKTtcclxuICAgIHRoaXMuYW5jaG9yID0gbmV3IFZlY3RvcjIoKTtcclxuICAgIHRoaXMucmFkaXVzID0gMDtcclxuICAgIHRoaXMubWFzcyA9IDA7XHJcbiAgICB0aGlzLmRpcmVjdGlvbiA9IDA7XHJcbiAgICB0aGlzLmsgPSAwLjE7XHJcbiAgICB0aGlzLnIgPSBVdGlsLmdldFJhbmRvbUludCgxMDAsIDIyMCk7XHJcbiAgICB0aGlzLmcgPSBVdGlsLmdldFJhbmRvbUludCgyMjAsIDI1NSk7XHJcbiAgICB0aGlzLmIgPSBVdGlsLmdldFJhbmRvbUludCgxMDAsIDE2MCk7XHJcbiAgfTtcclxuICBcclxuICBNb3Zlci5wcm90b3R5cGUgPSB7XHJcbiAgICBpbml0OiBmdW5jdGlvbihwb3NpdGlvbiwgYW5jaG9yLCBzaXplKSB7XHJcbiAgICAgIHRoaXMucmFkaXVzID0gVXRpbC5nZXRSYW5kb21JbnQoc2l6ZSwgc2l6ZSAqIDUpO1xyXG4gICAgICB0aGlzLm1hc3MgPSB0aGlzLnJhZGl1cyAvIDEwO1xyXG4gICAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb24uY2xvbmUoKTtcclxuICAgICAgdGhpcy52ZWxvY2l0eSA9IHBvc2l0aW9uLmNsb25lKCk7XHJcbiAgICAgIHRoaXMuYW5jaG9yID0gYW5jaG9yLmNsb25lKCk7XHJcbiAgICB9LFxyXG4gICAgdXBkYXRlUG9zaXRpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnBvc2l0aW9uLmNvcHkodGhpcy52ZWxvY2l0eSk7XHJcbiAgICB9LFxyXG4gICAgdXBkYXRlVmVsb2NpdHk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnZlbG9jaXR5LmFkZCh0aGlzLmFjY2VsZXJhdGlvbik7XHJcbiAgICAgIGlmICh0aGlzLnZlbG9jaXR5LmRpc3RhbmNlVG8odGhpcy5wb3NpdGlvbikgPj0gMSkge1xyXG4gICAgICAgIHRoaXMuZGlyZWN0KHRoaXMudmVsb2NpdHkpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgYXBwbHlGb3JjZTogZnVuY3Rpb24odmVjdG9yKSB7XHJcbiAgICAgIHRoaXMuYWNjZWxlcmF0aW9uLmFkZCh2ZWN0b3IpO1xyXG4gICAgfSxcclxuICAgIGFwcGx5RnJpY3Rpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgZnJpY3Rpb24gPSBGb3JjZS5mcmljdGlvbih0aGlzLmFjY2VsZXJhdGlvbiwgMC4xKTtcclxuICAgICAgdGhpcy5hcHBseUZvcmNlKGZyaWN0aW9uKTtcclxuICAgIH0sXHJcbiAgICBhcHBseURyYWdGb3JjZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBkcmFnID0gRm9yY2UuZHJhZyh0aGlzLmFjY2VsZXJhdGlvbiwgMC4yNCk7XHJcbiAgICAgIHRoaXMuYXBwbHlGb3JjZShkcmFnKTtcclxuICAgIH0sXHJcbiAgICBob29rOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGZvcmNlID0gRm9yY2UuaG9vayh0aGlzLnZlbG9jaXR5LCB0aGlzLmFuY2hvciwgdGhpcy5rKTtcclxuICAgICAgdGhpcy5hcHBseUZvcmNlKGZvcmNlKTtcclxuICAgIH0sXHJcbiAgICByZWJvdW5kOiBmdW5jdGlvbih2ZWN0b3IpIHtcclxuICAgICAgdmFyIGRvdCA9IHRoaXMuYWNjZWxlcmF0aW9uLmNsb25lKCkuZG90KHZlY3Rvcik7XHJcbiAgICAgIHRoaXMuYWNjZWxlcmF0aW9uLnN1Yih2ZWN0b3IubXVsdFNjYWxhcigyICogZG90KSk7XHJcbiAgICAgIHRoaXMuYWNjZWxlcmF0aW9uLm11bHRTY2FsYXIoMC44KTtcclxuICAgIH0sXHJcbiAgICBkaXJlY3Q6IGZ1bmN0aW9uKHZlY3Rvcikge1xyXG4gICAgICB2YXIgdiA9IHZlY3Rvci5jbG9uZSgpLnN1Yih0aGlzLnBvc2l0aW9uKTtcclxuICAgICAgdGhpcy5kaXJlY3Rpb24gPSBNYXRoLmF0YW4yKHYueSwgdi54KTtcclxuICAgIH0sXHJcbiAgICBkcmF3OiBmdW5jdGlvbihjb250ZXh0LCBtb2RlKSB7XHJcbiAgICAgIHZhciByZXNpemUgPSBNYXRoLmZsb29yKHRoaXMuYWNjZWxlcmF0aW9uLmxlbmd0aCgpIC8gNSk7XHJcbiAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJ3JnYignICsgdGhpcy5yICsgJywnICsgdGhpcy5nICsgJywnICsgdGhpcy5iICsgJyknO1xyXG4gICAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xyXG4gICAgICBjb250ZXh0LmFyYyh0aGlzLnBvc2l0aW9uLngsIHRoaXMucG9zaXRpb24ueSwgdGhpcy5yYWRpdXMgKyByZXNpemUsIDAsIE1hdGguUEkgLyAxODAsIHRydWUpO1xyXG4gICAgICBjb250ZXh0LmZpbGwoKTtcclxuICAgIH1cclxuICB9O1xyXG4gIFxyXG4gIHJldHVybiBNb3ZlcjtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cygpO1xyXG4iLCJ2YXIgZXhwb3J0cyA9IHtcclxuICBnZXRSYW5kb21JbnQ6IGZ1bmN0aW9uKG1pbiwgbWF4KXtcclxuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSkgKyBtaW47XHJcbiAgfSxcclxuICBnZXREZWdyZWU6IGZ1bmN0aW9uKHJhZGlhbikge1xyXG4gICAgcmV0dXJuIHJhZGlhbiAvIE1hdGguUEkgKiAxODA7XHJcbiAgfSxcclxuICBnZXRSYWRpYW46IGZ1bmN0aW9uKGRlZ3JlZXMpIHtcclxuICAgIHJldHVybiBkZWdyZWVzICogTWF0aC5QSSAvIDE4MDtcclxuICB9LFxyXG4gIGdldFNwaGVyaWNhbDogZnVuY3Rpb24ocmFkMSwgcmFkMiwgcikge1xyXG4gICAgdmFyIHggPSBNYXRoLmNvcyhyYWQxKSAqIE1hdGguY29zKHJhZDIpICogcjtcclxuICAgIHZhciB6ID0gTWF0aC5jb3MocmFkMSkgKiBNYXRoLnNpbihyYWQyKSAqIHI7XHJcbiAgICB2YXIgeSA9IE1hdGguc2luKHJhZDEpICogcjtcclxuICAgIHJldHVybiBbeCwgeSwgel07XHJcbiAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzO1xyXG4iLCIvLyBcclxuLy8g44GT44GuVmVjdG9yMuOCr+ODqeOCueOBr+OAgXRocmVlLmpz44GuVEhSRUUuVmVjdG9yMuOCr+ODqeOCueOBruioiOeul+W8j+OBruS4gOmDqOOCkuWIqeeUqOOBl+OBpuOBhOOBvuOBmeOAglxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vbXJkb29iL3RocmVlLmpzL2Jsb2IvbWFzdGVyL3NyYy9tYXRoL1ZlY3RvcjIuanMjTDM2N1xyXG4vLyBcclxuXHJcbnZhciBleHBvcnRzID0gZnVuY3Rpb24oKXtcclxuICB2YXIgVmVjdG9yMiA9IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgIHRoaXMueCA9IHggfHwgMDtcclxuICAgIHRoaXMueSA9IHkgfHwgMDtcclxuICB9O1xyXG4gIFxyXG4gIFZlY3RvcjIucHJvdG90eXBlID0ge1xyXG4gICAgc2V0OiBmdW5jdGlvbiAoeCwgeSkge1xyXG4gICAgICB0aGlzLnggPSB4O1xyXG4gICAgICB0aGlzLnkgPSB5O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBjb3B5OiBmdW5jdGlvbiAodikge1xyXG4gICAgICB0aGlzLnggPSB2Lng7XHJcbiAgICAgIHRoaXMueSA9IHYueTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgYWRkOiBmdW5jdGlvbiAodikge1xyXG4gICAgICB0aGlzLnggKz0gdi54O1xyXG4gICAgICB0aGlzLnkgKz0gdi55O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBhZGRTY2FsYXI6IGZ1bmN0aW9uIChzKSB7XHJcbiAgICAgIHRoaXMueCArPSBzO1xyXG4gICAgICB0aGlzLnkgKz0gcztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgc3ViOiBmdW5jdGlvbiAodikge1xyXG4gICAgICB0aGlzLnggLT0gdi54O1xyXG4gICAgICB0aGlzLnkgLT0gdi55O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBzdWJTY2FsYXI6IGZ1bmN0aW9uIChzKSB7XHJcbiAgICAgIHRoaXMueCAtPSBzO1xyXG4gICAgICB0aGlzLnkgLT0gcztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgbXVsdDogZnVuY3Rpb24gKHYpIHtcclxuICAgICAgdGhpcy54ICo9IHYueDtcclxuICAgICAgdGhpcy55ICo9IHYueTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgbXVsdFNjYWxhcjogZnVuY3Rpb24gKHMpIHtcclxuICAgICAgdGhpcy54ICo9IHM7XHJcbiAgICAgIHRoaXMueSAqPSBzO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBkaXY6IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgIHRoaXMueCAvPSB2Lng7XHJcbiAgICAgIHRoaXMueSAvPSB2Lnk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIGRpdlNjYWxhcjogZnVuY3Rpb24gKHMpIHtcclxuICAgICAgdGhpcy54IC89IHM7XHJcbiAgICAgIHRoaXMueSAvPSBzO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBtaW46IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgIGlmICggdGhpcy54IDwgdi54ICkgdGhpcy54ID0gdi54O1xyXG4gICAgICBpZiAoIHRoaXMueSA8IHYueSApIHRoaXMueSA9IHYueTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgbWF4OiBmdW5jdGlvbiAodikge1xyXG4gICAgICBpZiAoIHRoaXMueCA+IHYueCApIHRoaXMueCA9IHYueDtcclxuICAgICAgaWYgKCB0aGlzLnkgPiB2LnkgKSB0aGlzLnkgPSB2Lnk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIGNsYW1wOiBmdW5jdGlvbiAodl9taW4sIHZfbWF4KSB7XHJcbiAgICAgIGlmICggdGhpcy54IDwgdl9taW4ueCApIHtcclxuICAgICAgICB0aGlzLnggPSB2X21pbi54O1xyXG4gICAgICB9IGVsc2UgaWYgKCB0aGlzLnggPiB2X21heC54ICkge1xyXG4gICAgICAgIHRoaXMueCA9IHZfbWF4Lng7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCB0aGlzLnkgPCB2X21pbi55ICkge1xyXG4gICAgICAgIHRoaXMueSA9IHZfbWluLnk7XHJcbiAgICAgIH0gZWxzZSBpZiAoIHRoaXMueSA+IHZfbWF4LnkgKSB7XHJcbiAgICAgICAgdGhpcy55ID0gdl9tYXgueTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBmbG9vcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICB0aGlzLnggPSBNYXRoLmZsb29yKCB0aGlzLnggKTtcclxuICAgICAgdGhpcy55ID0gTWF0aC5mbG9vciggdGhpcy55ICk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIGNlaWw6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdGhpcy54ID0gTWF0aC5jZWlsKCB0aGlzLnggKTtcclxuICAgICAgdGhpcy55ID0gTWF0aC5jZWlsKCB0aGlzLnkgKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgcm91bmQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdGhpcy54ID0gTWF0aC5yb3VuZCggdGhpcy54ICk7XHJcbiAgICAgIHRoaXMueSA9IE1hdGgucm91bmQoIHRoaXMueSApO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICByb3VuZFRvWmVybzogZnVuY3Rpb24gKCkge1xyXG4gICAgICB0aGlzLnggPSAoIHRoaXMueCA8IDAgKSA/IE1hdGguY2VpbCggdGhpcy54ICkgOiBNYXRoLmZsb29yKCB0aGlzLnggKTtcclxuICAgICAgdGhpcy55ID0gKCB0aGlzLnkgPCAwICkgPyBNYXRoLmNlaWwoIHRoaXMueSApIDogTWF0aC5mbG9vciggdGhpcy55ICk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIG5lZ2F0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICB0aGlzLnggPSAtIHRoaXMueDtcclxuICAgICAgdGhpcy55ID0gLSB0aGlzLnk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIGRvdDogZnVuY3Rpb24gKHYpIHtcclxuICAgICAgcmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueTtcclxuICAgIH0sXHJcbiAgICBsZW5ndGhTcTogZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55O1xyXG4gICAgfSxcclxuICAgIGxlbmd0aDogZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMubGVuZ3RoU3EoKSk7XHJcbiAgICB9LFxyXG4gICAgbm9ybWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmRpdlNjYWxhcih0aGlzLmxlbmd0aCgpKTtcclxuICAgIH0sXHJcbiAgICBkaXN0YW5jZVRvOiBmdW5jdGlvbiAodikge1xyXG4gICAgICB2YXIgZHggPSB0aGlzLnggLSB2Lng7XHJcbiAgICAgIHZhciBkeSA9IHRoaXMueSAtIHYueTtcclxuICAgICAgcmV0dXJuIE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XHJcbiAgICB9LFxyXG4gICAgc2V0TGVuZ3RoOiBmdW5jdGlvbiAobCkge1xyXG4gICAgICB2YXIgb2xkTGVuZ3RoID0gdGhpcy5sZW5ndGgoKTtcclxuICAgICAgaWYgKCBvbGRMZW5ndGggIT09IDAgJiYgbCAhPT0gb2xkTGVuZ3RoICkge1xyXG4gICAgICAgIHRoaXMubXVsdFNjYWxhcihsIC8gb2xkTGVuZ3RoKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBjbG9uZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gbmV3IFZlY3RvcjIodGhpcy54LCB0aGlzLnkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFZlY3RvcjI7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMoKTtcclxuIl19
