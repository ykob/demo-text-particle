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
  var movers_num = 1200;
  var max = text_coord_array.length - 1;
  
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
    var scalar = 30000;
    
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvZGVib3VuY2UuanMiLCJzcmMvanMvZm9yY2UuanMiLCJzcmMvanMvbWFpbi5qcyIsInNyYy9qcy9tb3Zlci5qcyIsInNyYy9qcy91dGlsLmpzIiwic3JjL2pzL3ZlY3RvcjIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmplY3QsIGV2ZW50VHlwZSwgY2FsbGJhY2spe1xyXG4gIHZhciB0aW1lcjtcclxuXHJcbiAgb2JqZWN0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcclxuICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICBjYWxsYmFjayhldmVudCk7XHJcbiAgICB9LCA1MDApO1xyXG4gIH0sIGZhbHNlKTtcclxufTtcclxuIiwidmFyIFZlY3RvcjIgPSByZXF1aXJlKCcuL3ZlY3RvcjInKTtcclxuXHJcbnZhciBleHBvcnRzID0ge1xyXG4gIGZyaWN0aW9uOiBmdW5jdGlvbih2ZWN0b3IsIHZhbHVlKSB7XHJcbiAgICB2YXIgZm9yY2UgPSB2ZWN0b3IuY2xvbmUoKTtcclxuICAgIGZvcmNlLm11bHRTY2FsYXIoLTEpO1xyXG4gICAgZm9yY2Uubm9ybWFsaXplKCk7XHJcbiAgICBmb3JjZS5tdWx0U2NhbGFyKHZhbHVlKTtcclxuICAgIHJldHVybiBmb3JjZTtcclxuICB9LFxyXG4gIGRyYWc6IGZ1bmN0aW9uKHZlY3RvciwgdmFsdWUpIHtcclxuICAgIHZhciBmb3JjZSA9IHZlY3Rvci5jbG9uZSgpO1xyXG4gICAgZm9yY2UubXVsdFNjYWxhcigtMSk7XHJcbiAgICBmb3JjZS5ub3JtYWxpemUoKTtcclxuICAgIGZvcmNlLm11bHRTY2FsYXIodmVjdG9yLmxlbmd0aCgpICogdmFsdWUpO1xyXG4gICAgcmV0dXJuIGZvcmNlO1xyXG4gIH0sXHJcbiAgaG9vazogZnVuY3Rpb24odl92ZWxvY2l0eSwgdl9hbmNob3IsIGspIHtcclxuICAgIHZhciBmb3JjZSA9IHZfdmVsb2NpdHkuY2xvbmUoKS5zdWIodl9hbmNob3IpO1xyXG4gICAgdmFyIGRpc3RhbmNlID0gZm9yY2UubGVuZ3RoKCk7XHJcbiAgICBpZiAoZGlzdGFuY2UgPiAwKSB7XHJcbiAgICAgIGZvcmNlLm5vcm1hbGl6ZSgpO1xyXG4gICAgICBmb3JjZS5tdWx0U2NhbGFyKC0xICogayAqIGRpc3RhbmNlKTtcclxuICAgICAgcmV0dXJuIGZvcmNlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKCk7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzO1xyXG4iLCJ2YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xyXG52YXIgVmVjdG9yMiA9IHJlcXVpcmUoJy4vdmVjdG9yMicpO1xyXG52YXIgRm9yY2UgPSByZXF1aXJlKCcuL2ZvcmNlJyk7XHJcbnZhciBNb3ZlciA9IHJlcXVpcmUoJy4vbW92ZXInKTtcclxudmFyIGRlYm91bmNlID0gcmVxdWlyZSgnLi9kZWJvdW5jZScpO1xyXG5cclxudmFyIGJvZHlfd2lkdGggID0gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aCAqIDI7XHJcbnZhciBib2R5X2hlaWdodCA9IGRvY3VtZW50LmJvZHkuY2xpZW50SGVpZ2h0ICogMjtcclxudmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXMnKTtcclxudmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG52YXIgZnBzID0gNjA7XHJcbnZhciBsYXN0X3RpbWVfcmVuZGVyID0gRGF0ZS5ub3coKTtcclxuXHJcbnZhciBtb3ZlcnMgPSBbXTtcclxuXHJcbnZhciBmdF9jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxudmFyIGZ0X2N0eCA9IGZ0X2NhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG52YXIgZnRfc3RyID0gJ0B5a29iJztcclxudmFyIHRleHRfY29vcmRfYXJyYXkgPSBbXTtcclxuXHJcbnZhciB2ZWN0b3JfbW91c2UgPSBuZXcgVmVjdG9yMigpO1xyXG5cclxudmFyIGluaXQgPSBmdW5jdGlvbigpIHtcclxuICByZW5kZXJsb29wKCk7XHJcbiAgc2V0RXZlbnQoKTtcclxuICByZXNpemVDYW52YXMoKTtcclxuICB0ZXh0X2Nvb3JkX2FycmF5ID0gZ2V0VGV4dENvb3JkKCk7XHJcbiAgaW50TW92ZXIoKTtcclxuICBkZWJvdW5jZSh3aW5kb3csICdyZXNpemUnLCBmdW5jdGlvbihldmVudCl7XHJcbiAgICByZXNpemVDYW52YXMoKTtcclxuICB9KTtcclxufTtcclxuXHJcbnZhciBpbnRNb3ZlciA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBtb3ZlcnNfbnVtID0gMTIwMDtcclxuICB2YXIgbWF4ID0gdGV4dF9jb29yZF9hcnJheS5sZW5ndGggLSAxO1xyXG4gIFxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbW92ZXJzX251bTsgaSsrKSB7XHJcbiAgICB2YXIgbW92ZXIgPSBuZXcgTW92ZXIoKTtcclxuICAgIHZhciByYWRpYW4gPSBVdGlsLmdldFJhZGlhbihVdGlsLmdldFJhbmRvbUludCgwLCAzNjApKTtcclxuICAgIHZhciBwb3NpdGlvbiA9IG5ldyBWZWN0b3IyKGJvZHlfd2lkdGggLyAyLCBib2R5X2hlaWdodCAvIDIpO1xyXG4gICAgdmFyIGFuY2hvciA9IG51bGw7XHJcbiAgICB2YXIgZm9yY2UgPSBudWxsO1xyXG4gICAgdmFyIHNjYWxhciA9IDA7XHJcbiAgICB2YXIgc2l6ZSA9IDA7XHJcbiAgICB2YXIgcmFkID0gVXRpbC5nZXRSYWRpYW4oVXRpbC5nZXRSYW5kb21JbnQoMCwgMzYwKSk7XHJcbiAgICB2YXIgaW5kZXggPSBVdGlsLmdldFJhbmRvbUludCgwLCBtYXgpO1xyXG4gICAgXHJcbiAgICBzaXplID0gYm9keV93aWR0aCAvIDM2MDtcclxuICAgIHNjYWxhciA9IFV0aWwuZ2V0UmFuZG9tSW50KGJvZHlfd2lkdGggLyAxMCwgYm9keV93aWR0aCAvIDIpO1xyXG4gICAgZm9yY2UgPSBuZXcgVmVjdG9yMihNYXRoLmNvcyhyYWRpYW4pICogc2NhbGFyLCBNYXRoLnNpbihyYWRpYW4pICogc2NhbGFyKTtcclxuICAgIGFuY2hvciA9IHRleHRfY29vcmRfYXJyYXlbaW5kZXhdO1xyXG4gICAgbW92ZXIuaW5pdChwb3NpdGlvbiwgYW5jaG9yLCBzaXplKTtcclxuICAgIG1vdmVyLmFwcGx5Rm9yY2UoZm9yY2UpO1xyXG4gICAgbW92ZXJzW2ldID0gbW92ZXI7XHJcbiAgfVxyXG59O1xyXG5cclxudmFyIGdldFRleHRDb29yZCA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBhcnJheSA9IFtdO1xyXG4gIHZhciBpbWFnZV9kYXRhID0gbnVsbDtcclxuICBcclxuICBmdF9jdHguYmVnaW5QYXRoKCk7XHJcbiAgZnRfY3R4LmZpbGxTdHlsZSA9ICcjMzMzMzMzJztcclxuICBmdF9jdHguZm9udCA9IGJvZHlfd2lkdGggLyBmdF9zdHIubGVuZ3RoICsgJ3B4IEFyaWFsJztcclxuICBmdF9jdHgudGV4dEFsaWduID0gJ2NlbnRlcic7XHJcbiAgZnRfY3R4LnRleHRCYXNlbGluZSA9ICdtaWRkbGUnO1xyXG4gIGZ0X2N0eC5maWxsVGV4dChmdF9zdHIsIGJvZHlfd2lkdGggLyAyLCBib2R5X2hlaWdodCAvIDIpO1xyXG4gIGltYWdlX2RhdGEgPSBmdF9jdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIGJvZHlfd2lkdGgsIGJvZHlfaGVpZ2h0KS5kYXRhO1xyXG4gIFxyXG4gIGZvciAodmFyIHkgPSAwOyB5IDwgYm9keV9oZWlnaHQ7IHkrKykge1xyXG4gICAgZm9yICh2YXIgeCA9IDA7IHggPCBib2R5X3dpZHRoOyB4KyspIHtcclxuICAgICAgdmFyIGluZGV4ID0gKHkgKiBib2R5X3dpZHRoICsgeCkgKiA0O1xyXG4gICAgICB2YXIgciA9IGltYWdlX2RhdGFbaW5kZXhdO1xyXG4gICAgICB2YXIgZyA9IGltYWdlX2RhdGFbaW5kZXggKyAxXTtcclxuICAgICAgdmFyIGIgPSBpbWFnZV9kYXRhW2luZGV4ICsgMl07XHJcbiAgICAgIHZhciBhID0gaW1hZ2VfZGF0YVtpbmRleCArIDNdO1xyXG4gICAgICBcclxuICAgICAgaWYgKGEgPiAwKSB7XHJcbiAgICAgICAgYXJyYXkucHVzaChuZXcgVmVjdG9yMih4LCB5KSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGFycmF5O1xyXG59O1xyXG5cclxudmFyIHVwZGF0ZU1vdmVyID0gZnVuY3Rpb24oKSB7XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3ZlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgIHZhciBtb3ZlciA9IG1vdmVyc1tpXTtcclxuICAgIHZhciBjb2xsaXNpb24gPSBmYWxzZTtcclxuICAgIFxyXG4gICAgbW92ZXIuaG9vaygpO1xyXG4gICAgbW92ZXIuYXBwbHlEcmFnRm9yY2UoKTtcclxuICAgIG1vdmVyLnVwZGF0ZVZlbG9jaXR5KCk7XHJcbiAgICBtb3Zlci51cGRhdGVQb3NpdGlvbigpO1xyXG4gICAgbW92ZXIuZHJhdyhjdHgpO1xyXG4gIH1cclxufTtcclxuXHJcbnZhciBhcHBseUZvcmNlTW91c2VMb29wID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHNjYWxhciA9IDIwMDA7XHJcbiAgXHJcbiAgYXBwbHlGb3JjZU1vdXNlKHZlY3Rvcl9tb3VzZSwgc2NhbGFyKTtcclxufTtcclxuXHJcbnZhciBhcHBseUZvcmNlTW91c2UgPSBmdW5jdGlvbih2ZWN0b3IsIHNjYWxhcl9iYXNlKSB7XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3ZlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgIHZhciBkaXN0YW5jZSA9IHZlY3Rvci5kaXN0YW5jZVRvKG1vdmVyc1tpXS5wb3NpdGlvbik7XHJcbiAgICB2YXIgZGlyZWN0ID0gdmVjdG9yLmNsb25lKCkuc3ViKG1vdmVyc1tpXS5wb3NpdGlvbik7XHJcbiAgICB2YXIgc2NhbGFyID0gKHNjYWxhcl9iYXNlIC0gZGlzdGFuY2UpIC8gMTAwO1xyXG4gICAgdmFyIGZvcmNlID0gbnVsbDtcclxuICAgIFxyXG4gICAgaWYgKHNjYWxhciA8IDApIHNjYWxhciA9IDA7XHJcbiAgICBkaXJlY3Qubm9ybWFsaXplKCk7XHJcbiAgICBmb3JjZSA9IGRpcmVjdC5tdWx0U2NhbGFyKHNjYWxhciAqIC0xKTtcclxuICAgIG1vdmVyc1tpXS5hcHBseUZvcmNlKGZvcmNlKTtcclxuICB9O1xyXG59O1xyXG5cclxudmFyIHJlbmRlciA9IGZ1bmN0aW9uKCkge1xyXG4gIGN0eC5jbGVhclJlY3QoMCwgMCwgYm9keV93aWR0aCwgYm9keV9oZWlnaHQpO1xyXG4gIGFwcGx5Rm9yY2VNb3VzZUxvb3AoKTtcclxuICB1cGRhdGVNb3ZlcigpO1xyXG59O1xyXG5cclxudmFyIHJlbmRlcmxvb3AgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcclxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVybG9vcCk7XHJcblxyXG4gIGlmIChub3cgLSBsYXN0X3RpbWVfcmVuZGVyID4gMTAwMCAvIGZwcykge1xyXG4gICAgcmVuZGVyKCk7XHJcbiAgICBsYXN0X3RpbWVfcmVuZGVyID0gRGF0ZS5ub3coKTtcclxuICB9XHJcbn07XHJcblxyXG52YXIgcmVzaXplQ2FudmFzID0gZnVuY3Rpb24oKSB7XHJcbiAgYm9keV93aWR0aCAgPSBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoICogMjtcclxuICBib2R5X2hlaWdodCA9IGRvY3VtZW50LmJvZHkuY2xpZW50SGVpZ2h0ICogMjtcclxuXHJcbiAgY2FudmFzLndpZHRoID0gYm9keV93aWR0aDtcclxuICBjYW52YXMuaGVpZ2h0ID0gYm9keV9oZWlnaHQ7XHJcbiAgY2FudmFzLnN0eWxlLndpZHRoID0gYm9keV93aWR0aCAvIDIgKyAncHgnO1xyXG4gIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBib2R5X2hlaWdodCAvIDIgKyAncHgnO1xyXG4gIGZ0X2NhbnZhcy53aWR0aCA9IGJvZHlfd2lkdGg7XHJcbiAgZnRfY2FudmFzLmhlaWdodCA9IGJvZHlfaGVpZ2h0O1xyXG59O1xyXG5cclxudmFyIHNldEV2ZW50ID0gZnVuY3Rpb24gKCkge1xyXG4gIHZhciBldmVudFRvdWNoU3RhcnQgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBzY2FsYXIgPSAzMDAwMDtcclxuICAgIFxyXG4gICAgYXBwbHlGb3JjZU1vdXNlKHZlY3Rvcl9tb3VzZSwgc2NhbGFyKTtcclxuICB9O1xyXG4gIFxyXG4gIHZhciBldmVudFRvdWNoTW92ZSA9IGZ1bmN0aW9uKCkge1xyXG4gIH07XHJcbiAgXHJcbiAgdmFyIGV2ZW50VG91Y2hFbmQgPSBmdW5jdGlvbigpIHtcclxuICB9O1xyXG5cclxuICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgfSk7XHJcblxyXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdzZWxlY3RzdGFydCcsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICB9KTtcclxuXHJcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIHZlY3Rvcl9tb3VzZS5zZXQoZXZlbnQuY2xpZW50WCAqIDIsIGV2ZW50LmNsaWVudFkgKiAyKTtcclxuICAgIGV2ZW50VG91Y2hTdGFydCgpO1xyXG4gIH0pO1xyXG5cclxuICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdmVjdG9yX21vdXNlLnNldChldmVudC5jbGllbnRYICogMiwgZXZlbnQuY2xpZW50WSAqIDIpO1xyXG4gICAgZXZlbnRUb3VjaE1vdmUoKTtcclxuICB9KTtcclxuXHJcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBldmVudFRvdWNoRW5kKCk7XHJcbiAgfSk7XHJcblxyXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdmVjdG9yX21vdXNlLnNldChldmVudC50b3VjaGVzWzBdLmNsaWVudFggKiAyLCBldmVudC50b3VjaGVzWzBdLmNsaWVudFkgKiAyKTtcclxuICAgIGV2ZW50VG91Y2hTdGFydCgpO1xyXG4gIH0pO1xyXG5cclxuICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdmVjdG9yX21vdXNlLnNldChldmVudC50b3VjaGVzWzBdLmNsaWVudFggKiAyLCBldmVudC50b3VjaGVzWzBdLmNsaWVudFkgKiAyKTtcclxuICAgIGV2ZW50VG91Y2hNb3ZlKCk7XHJcbiAgfSk7XHJcblxyXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIGV2ZW50VG91Y2hFbmQoKTtcclxuICB9KTtcclxufTtcclxuXHJcbmluaXQoKTtcclxuIiwidmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcclxudmFyIFZlY3RvcjIgPSByZXF1aXJlKCcuL3ZlY3RvcjInKTtcclxudmFyIEZvcmNlID0gcmVxdWlyZSgnLi9mb3JjZScpO1xyXG5cclxudmFyIGV4cG9ydHMgPSBmdW5jdGlvbigpe1xyXG4gIHZhciBNb3ZlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBWZWN0b3IyKCk7XHJcbiAgICB0aGlzLnZlbG9jaXR5ID0gbmV3IFZlY3RvcjIoKTtcclxuICAgIHRoaXMuYWNjZWxlcmF0aW9uID0gbmV3IFZlY3RvcjIoKTtcclxuICAgIHRoaXMuYW5jaG9yID0gbmV3IFZlY3RvcjIoKTtcclxuICAgIHRoaXMucmFkaXVzID0gMDtcclxuICAgIHRoaXMubWFzcyA9IDA7XHJcbiAgICB0aGlzLmRpcmVjdGlvbiA9IDA7XHJcbiAgICB0aGlzLmsgPSAwLjE7XHJcbiAgICB0aGlzLnIgPSBVdGlsLmdldFJhbmRvbUludCgxMDAsIDIyMCk7XHJcbiAgICB0aGlzLmcgPSBVdGlsLmdldFJhbmRvbUludCgyMjAsIDI1NSk7XHJcbiAgICB0aGlzLmIgPSBVdGlsLmdldFJhbmRvbUludCgxMDAsIDE2MCk7XHJcbiAgfTtcclxuICBcclxuICBNb3Zlci5wcm90b3R5cGUgPSB7XHJcbiAgICBpbml0OiBmdW5jdGlvbihwb3NpdGlvbiwgYW5jaG9yLCBzaXplKSB7XHJcbiAgICAgIHRoaXMucmFkaXVzID0gVXRpbC5nZXRSYW5kb21JbnQoc2l6ZSwgc2l6ZSAqIDUpO1xyXG4gICAgICB0aGlzLm1hc3MgPSB0aGlzLnJhZGl1cyAvIDEwO1xyXG4gICAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb24uY2xvbmUoKTtcclxuICAgICAgdGhpcy52ZWxvY2l0eSA9IHBvc2l0aW9uLmNsb25lKCk7XHJcbiAgICAgIHRoaXMuYW5jaG9yID0gYW5jaG9yLmNsb25lKCk7XHJcbiAgICB9LFxyXG4gICAgdXBkYXRlUG9zaXRpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnBvc2l0aW9uLmNvcHkodGhpcy52ZWxvY2l0eSk7XHJcbiAgICB9LFxyXG4gICAgdXBkYXRlVmVsb2NpdHk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnZlbG9jaXR5LmFkZCh0aGlzLmFjY2VsZXJhdGlvbik7XHJcbiAgICAgIGlmICh0aGlzLnZlbG9jaXR5LmRpc3RhbmNlVG8odGhpcy5wb3NpdGlvbikgPj0gMSkge1xyXG4gICAgICAgIHRoaXMuZGlyZWN0KHRoaXMudmVsb2NpdHkpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgYXBwbHlGb3JjZTogZnVuY3Rpb24odmVjdG9yKSB7XHJcbiAgICAgIHRoaXMuYWNjZWxlcmF0aW9uLmFkZCh2ZWN0b3IpO1xyXG4gICAgfSxcclxuICAgIGFwcGx5RnJpY3Rpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgZnJpY3Rpb24gPSBGb3JjZS5mcmljdGlvbih0aGlzLmFjY2VsZXJhdGlvbiwgMC4xKTtcclxuICAgICAgdGhpcy5hcHBseUZvcmNlKGZyaWN0aW9uKTtcclxuICAgIH0sXHJcbiAgICBhcHBseURyYWdGb3JjZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBkcmFnID0gRm9yY2UuZHJhZyh0aGlzLmFjY2VsZXJhdGlvbiwgMC4yNCk7XHJcbiAgICAgIHRoaXMuYXBwbHlGb3JjZShkcmFnKTtcclxuICAgIH0sXHJcbiAgICBob29rOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGZvcmNlID0gRm9yY2UuaG9vayh0aGlzLnZlbG9jaXR5LCB0aGlzLmFuY2hvciwgdGhpcy5rKTtcclxuICAgICAgdGhpcy5hcHBseUZvcmNlKGZvcmNlKTtcclxuICAgIH0sXHJcbiAgICByZWJvdW5kOiBmdW5jdGlvbih2ZWN0b3IpIHtcclxuICAgICAgdmFyIGRvdCA9IHRoaXMuYWNjZWxlcmF0aW9uLmNsb25lKCkuZG90KHZlY3Rvcik7XHJcbiAgICAgIHRoaXMuYWNjZWxlcmF0aW9uLnN1Yih2ZWN0b3IubXVsdFNjYWxhcigyICogZG90KSk7XHJcbiAgICAgIHRoaXMuYWNjZWxlcmF0aW9uLm11bHRTY2FsYXIoMC44KTtcclxuICAgIH0sXHJcbiAgICBkaXJlY3Q6IGZ1bmN0aW9uKHZlY3Rvcikge1xyXG4gICAgICB2YXIgdiA9IHZlY3Rvci5jbG9uZSgpLnN1Yih0aGlzLnBvc2l0aW9uKTtcclxuICAgICAgdGhpcy5kaXJlY3Rpb24gPSBNYXRoLmF0YW4yKHYueSwgdi54KTtcclxuICAgIH0sXHJcbiAgICBkcmF3OiBmdW5jdGlvbihjb250ZXh0LCBtb2RlKSB7XHJcbiAgICAgIHZhciByZXNpemUgPSBNYXRoLmZsb29yKHRoaXMuYWNjZWxlcmF0aW9uLmxlbmd0aCgpIC8gNSk7XHJcbiAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJ3JnYignICsgdGhpcy5yICsgJywnICsgdGhpcy5nICsgJywnICsgdGhpcy5iICsgJyknO1xyXG4gICAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xyXG4gICAgICBjb250ZXh0LmFyYyh0aGlzLnBvc2l0aW9uLngsIHRoaXMucG9zaXRpb24ueSwgdGhpcy5yYWRpdXMgKyByZXNpemUsIDAsIE1hdGguUEkgLyAxODAsIHRydWUpO1xyXG4gICAgICBjb250ZXh0LmZpbGwoKTtcclxuICAgIH1cclxuICB9O1xyXG4gIFxyXG4gIHJldHVybiBNb3ZlcjtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cygpO1xyXG4iLCJ2YXIgZXhwb3J0cyA9IHtcclxuICBnZXRSYW5kb21JbnQ6IGZ1bmN0aW9uKG1pbiwgbWF4KXtcclxuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSkgKyBtaW47XHJcbiAgfSxcclxuICBnZXREZWdyZWU6IGZ1bmN0aW9uKHJhZGlhbikge1xyXG4gICAgcmV0dXJuIHJhZGlhbiAvIE1hdGguUEkgKiAxODA7XHJcbiAgfSxcclxuICBnZXRSYWRpYW46IGZ1bmN0aW9uKGRlZ3JlZXMpIHtcclxuICAgIHJldHVybiBkZWdyZWVzICogTWF0aC5QSSAvIDE4MDtcclxuICB9LFxyXG4gIGdldFNwaGVyaWNhbDogZnVuY3Rpb24ocmFkMSwgcmFkMiwgcikge1xyXG4gICAgdmFyIHggPSBNYXRoLmNvcyhyYWQxKSAqIE1hdGguY29zKHJhZDIpICogcjtcclxuICAgIHZhciB6ID0gTWF0aC5jb3MocmFkMSkgKiBNYXRoLnNpbihyYWQyKSAqIHI7XHJcbiAgICB2YXIgeSA9IE1hdGguc2luKHJhZDEpICogcjtcclxuICAgIHJldHVybiBbeCwgeSwgel07XHJcbiAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzO1xyXG4iLCIvLyBcclxuLy8g44GT44GuVmVjdG9yMuOCr+ODqeOCueOBr+OAgXRocmVlLmpz44GuVEhSRUUuVmVjdG9yMuOCr+ODqeOCueOBruioiOeul+W8j+OBruS4gOmDqOOCkuWIqeeUqOOBl+OBpuOBhOOBvuOBmeOAglxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vbXJkb29iL3RocmVlLmpzL2Jsb2IvbWFzdGVyL3NyYy9tYXRoL1ZlY3RvcjIuanMjTDM2N1xyXG4vLyBcclxuXHJcbnZhciBleHBvcnRzID0gZnVuY3Rpb24oKXtcclxuICB2YXIgVmVjdG9yMiA9IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgIHRoaXMueCA9IHggfHwgMDtcclxuICAgIHRoaXMueSA9IHkgfHwgMDtcclxuICB9O1xyXG4gIFxyXG4gIFZlY3RvcjIucHJvdG90eXBlID0ge1xyXG4gICAgc2V0OiBmdW5jdGlvbiAoeCwgeSkge1xyXG4gICAgICB0aGlzLnggPSB4O1xyXG4gICAgICB0aGlzLnkgPSB5O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBjb3B5OiBmdW5jdGlvbiAodikge1xyXG4gICAgICB0aGlzLnggPSB2Lng7XHJcbiAgICAgIHRoaXMueSA9IHYueTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgYWRkOiBmdW5jdGlvbiAodikge1xyXG4gICAgICB0aGlzLnggKz0gdi54O1xyXG4gICAgICB0aGlzLnkgKz0gdi55O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBhZGRTY2FsYXI6IGZ1bmN0aW9uIChzKSB7XHJcbiAgICAgIHRoaXMueCArPSBzO1xyXG4gICAgICB0aGlzLnkgKz0gcztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgc3ViOiBmdW5jdGlvbiAodikge1xyXG4gICAgICB0aGlzLnggLT0gdi54O1xyXG4gICAgICB0aGlzLnkgLT0gdi55O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBzdWJTY2FsYXI6IGZ1bmN0aW9uIChzKSB7XHJcbiAgICAgIHRoaXMueCAtPSBzO1xyXG4gICAgICB0aGlzLnkgLT0gcztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgbXVsdDogZnVuY3Rpb24gKHYpIHtcclxuICAgICAgdGhpcy54ICo9IHYueDtcclxuICAgICAgdGhpcy55ICo9IHYueTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgbXVsdFNjYWxhcjogZnVuY3Rpb24gKHMpIHtcclxuICAgICAgdGhpcy54ICo9IHM7XHJcbiAgICAgIHRoaXMueSAqPSBzO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBkaXY6IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgIHRoaXMueCAvPSB2Lng7XHJcbiAgICAgIHRoaXMueSAvPSB2Lnk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIGRpdlNjYWxhcjogZnVuY3Rpb24gKHMpIHtcclxuICAgICAgdGhpcy54IC89IHM7XHJcbiAgICAgIHRoaXMueSAvPSBzO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBtaW46IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgIGlmICggdGhpcy54IDwgdi54ICkgdGhpcy54ID0gdi54O1xyXG4gICAgICBpZiAoIHRoaXMueSA8IHYueSApIHRoaXMueSA9IHYueTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgbWF4OiBmdW5jdGlvbiAodikge1xyXG4gICAgICBpZiAoIHRoaXMueCA+IHYueCApIHRoaXMueCA9IHYueDtcclxuICAgICAgaWYgKCB0aGlzLnkgPiB2LnkgKSB0aGlzLnkgPSB2Lnk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIGNsYW1wOiBmdW5jdGlvbiAodl9taW4sIHZfbWF4KSB7XHJcbiAgICAgIGlmICggdGhpcy54IDwgdl9taW4ueCApIHtcclxuICAgICAgICB0aGlzLnggPSB2X21pbi54O1xyXG4gICAgICB9IGVsc2UgaWYgKCB0aGlzLnggPiB2X21heC54ICkge1xyXG4gICAgICAgIHRoaXMueCA9IHZfbWF4Lng7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCB0aGlzLnkgPCB2X21pbi55ICkge1xyXG4gICAgICAgIHRoaXMueSA9IHZfbWluLnk7XHJcbiAgICAgIH0gZWxzZSBpZiAoIHRoaXMueSA+IHZfbWF4LnkgKSB7XHJcbiAgICAgICAgdGhpcy55ID0gdl9tYXgueTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBmbG9vcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICB0aGlzLnggPSBNYXRoLmZsb29yKCB0aGlzLnggKTtcclxuICAgICAgdGhpcy55ID0gTWF0aC5mbG9vciggdGhpcy55ICk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIGNlaWw6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdGhpcy54ID0gTWF0aC5jZWlsKCB0aGlzLnggKTtcclxuICAgICAgdGhpcy55ID0gTWF0aC5jZWlsKCB0aGlzLnkgKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgcm91bmQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdGhpcy54ID0gTWF0aC5yb3VuZCggdGhpcy54ICk7XHJcbiAgICAgIHRoaXMueSA9IE1hdGgucm91bmQoIHRoaXMueSApO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICByb3VuZFRvWmVybzogZnVuY3Rpb24gKCkge1xyXG4gICAgICB0aGlzLnggPSAoIHRoaXMueCA8IDAgKSA/IE1hdGguY2VpbCggdGhpcy54ICkgOiBNYXRoLmZsb29yKCB0aGlzLnggKTtcclxuICAgICAgdGhpcy55ID0gKCB0aGlzLnkgPCAwICkgPyBNYXRoLmNlaWwoIHRoaXMueSApIDogTWF0aC5mbG9vciggdGhpcy55ICk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIG5lZ2F0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICB0aGlzLnggPSAtIHRoaXMueDtcclxuICAgICAgdGhpcy55ID0gLSB0aGlzLnk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIGRvdDogZnVuY3Rpb24gKHYpIHtcclxuICAgICAgcmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueTtcclxuICAgIH0sXHJcbiAgICBsZW5ndGhTcTogZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55O1xyXG4gICAgfSxcclxuICAgIGxlbmd0aDogZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMubGVuZ3RoU3EoKSk7XHJcbiAgICB9LFxyXG4gICAgbm9ybWFsaXplOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmRpdlNjYWxhcih0aGlzLmxlbmd0aCgpKTtcclxuICAgIH0sXHJcbiAgICBkaXN0YW5jZVRvOiBmdW5jdGlvbiAodikge1xyXG4gICAgICB2YXIgZHggPSB0aGlzLnggLSB2Lng7XHJcbiAgICAgIHZhciBkeSA9IHRoaXMueSAtIHYueTtcclxuICAgICAgcmV0dXJuIE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XHJcbiAgICB9LFxyXG4gICAgc2V0TGVuZ3RoOiBmdW5jdGlvbiAobCkge1xyXG4gICAgICB2YXIgb2xkTGVuZ3RoID0gdGhpcy5sZW5ndGgoKTtcclxuICAgICAgaWYgKCBvbGRMZW5ndGggIT09IDAgJiYgbCAhPT0gb2xkTGVuZ3RoICkge1xyXG4gICAgICAgIHRoaXMubXVsdFNjYWxhcihsIC8gb2xkTGVuZ3RoKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBjbG9uZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gbmV3IFZlY3RvcjIodGhpcy54LCB0aGlzLnkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFZlY3RvcjI7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMoKTtcclxuIl19
