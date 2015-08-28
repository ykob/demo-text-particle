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

},{"./vector2":5}],3:[function(require,module,exports){
var Util = require('./util');
var Vector2 = require('./vector2');
var Force = require('./force');
var debounce = require('./debounce');

var body_width  = document.body.clientWidth * 2;
var body_height = document.body.clientHeight * 2;
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var ft_canvas = document.createElement('canvas');
var ft_ctx = ft_canvas.getContext('2d');
var ft_str = 'ABC';
var fps = 60;
var last_time_render = Date.now();

var init = function() {
  renderloop();
  setEvent();
  resizeCanvas();
  getTextCoord();
  debounce(window, 'resize', function(event){
    resizeCanvas();
  });
};

var getTextCoord = function() {
  var text_coord_array = [];
  
  ctx.beginPath();
  ctx.fillStyle = '#333333';
  ctx.font = body_width / ft_str.length + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ft_str, body_width / 2, body_height / 2);
  
  //return text_coord_array;
};

var render = function() {
  //ctx.clearRect(0, 0, body_width, body_height);

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
};

var setEvent = function () {
  var eventTouchStart = function(x, y) {
  };
  
  var eventTouchMove = function(x, y) {
  };
  
  var eventTouchEnd = function(x, y) {
  };

  canvas.addEventListener('contextmenu', function (event) {
    event.preventDefault();
  });

  canvas.addEventListener('selectstart', function (event) {
    event.preventDefault();
  });

  canvas.addEventListener('mousedown', function (event) {
    event.preventDefault();
    eventTouchStart(event.clientX, event.clientY);
  });

  canvas.addEventListener('mousemove', function (event) {
    event.preventDefault();
    eventTouchMove(event.clientX, event.clientY);
  });

  canvas.addEventListener('mouseup', function (event) {
    event.preventDefault();
    eventTouchEnd();
  });

  canvas.addEventListener('touchstart', function (event) {
    event.preventDefault();
    eventTouchStart(event.touches[0].clientX, event.touches[0].clientY);
  });

  canvas.addEventListener('touchmove', function (event) {
    event.preventDefault();
    eventTouchMove(event.touches[0].clientX, event.touches[0].clientY);
  });

  canvas.addEventListener('touchend', function (event) {
    event.preventDefault();
    eventTouchEnd();
  });
};

init();

},{"./debounce":1,"./force":2,"./util":4,"./vector2":5}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvZGVib3VuY2UuanMiLCJzcmMvanMvZm9yY2UuanMiLCJzcmMvanMvbWFpbi5qcyIsInNyYy9qcy91dGlsLmpzIiwic3JjL2pzL3ZlY3RvcjIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqZWN0LCBldmVudFR5cGUsIGNhbGxiYWNrKXtcbiAgdmFyIHRpbWVyO1xuXG4gIG9iamVjdC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgY2FsbGJhY2soZXZlbnQpO1xuICAgIH0sIDUwMCk7XG4gIH0sIGZhbHNlKTtcbn07XG4iLCJ2YXIgVmVjdG9yMiA9IHJlcXVpcmUoJy4vdmVjdG9yMicpO1xuXG52YXIgZXhwb3J0cyA9IHtcbiAgZnJpY3Rpb246IGZ1bmN0aW9uKHZlY3RvciwgdmFsdWUpIHtcbiAgICB2YXIgZm9yY2UgPSB2ZWN0b3IuY2xvbmUoKTtcbiAgICBmb3JjZS5tdWx0U2NhbGFyKC0xKTtcbiAgICBmb3JjZS5ub3JtYWxpemUoKTtcbiAgICBmb3JjZS5tdWx0U2NhbGFyKHZhbHVlKTtcbiAgICByZXR1cm4gZm9yY2U7XG4gIH0sXG4gIGRyYWc6IGZ1bmN0aW9uKHZlY3RvciwgdmFsdWUpIHtcbiAgICB2YXIgZm9yY2UgPSB2ZWN0b3IuY2xvbmUoKTtcbiAgICBmb3JjZS5tdWx0U2NhbGFyKC0xKTtcbiAgICBmb3JjZS5ub3JtYWxpemUoKTtcbiAgICBmb3JjZS5tdWx0U2NhbGFyKHZlY3Rvci5sZW5ndGgoKSAqIHZhbHVlKTtcbiAgICByZXR1cm4gZm9yY2U7XG4gIH0sXG4gIGhvb2s6IGZ1bmN0aW9uKHZfdmVsb2NpdHksIHZfYW5jaG9yLCBrKSB7XG4gICAgdmFyIGZvcmNlID0gdl92ZWxvY2l0eS5jbG9uZSgpLnN1Yih2X2FuY2hvcik7XG4gICAgdmFyIGRpc3RhbmNlID0gZm9yY2UubGVuZ3RoKCk7XG4gICAgaWYgKGRpc3RhbmNlID4gMCkge1xuICAgICAgZm9yY2Uubm9ybWFsaXplKCk7XG4gICAgICBmb3JjZS5tdWx0U2NhbGFyKC0xICogayAqIGRpc3RhbmNlKTtcbiAgICAgIHJldHVybiBmb3JjZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKCk7XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHM7XG4iLCJ2YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyIFZlY3RvcjIgPSByZXF1aXJlKCcuL3ZlY3RvcjInKTtcbnZhciBGb3JjZSA9IHJlcXVpcmUoJy4vZm9yY2UnKTtcbnZhciBkZWJvdW5jZSA9IHJlcXVpcmUoJy4vZGVib3VuY2UnKTtcblxudmFyIGJvZHlfd2lkdGggID0gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aCAqIDI7XG52YXIgYm9keV9oZWlnaHQgPSBkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodCAqIDI7XG52YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhcycpO1xudmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xudmFyIGZ0X2NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xudmFyIGZ0X2N0eCA9IGZ0X2NhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xudmFyIGZ0X3N0ciA9ICdBQkMnO1xudmFyIGZwcyA9IDYwO1xudmFyIGxhc3RfdGltZV9yZW5kZXIgPSBEYXRlLm5vdygpO1xuXG52YXIgaW5pdCA9IGZ1bmN0aW9uKCkge1xuICByZW5kZXJsb29wKCk7XG4gIHNldEV2ZW50KCk7XG4gIHJlc2l6ZUNhbnZhcygpO1xuICBnZXRUZXh0Q29vcmQoKTtcbiAgZGVib3VuY2Uod2luZG93LCAncmVzaXplJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgIHJlc2l6ZUNhbnZhcygpO1xuICB9KTtcbn07XG5cbnZhciBnZXRUZXh0Q29vcmQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHRleHRfY29vcmRfYXJyYXkgPSBbXTtcbiAgXG4gIGN0eC5iZWdpblBhdGgoKTtcbiAgY3R4LmZpbGxTdHlsZSA9ICcjMzMzMzMzJztcbiAgY3R4LmZvbnQgPSBib2R5X3dpZHRoIC8gZnRfc3RyLmxlbmd0aCArICdweCBBcmlhbCc7XG4gIGN0eC50ZXh0QWxpZ24gPSAnY2VudGVyJztcbiAgY3R4LnRleHRCYXNlbGluZSA9ICdtaWRkbGUnO1xuICBjdHguZmlsbFRleHQoZnRfc3RyLCBib2R5X3dpZHRoIC8gMiwgYm9keV9oZWlnaHQgLyAyKTtcbiAgXG4gIC8vcmV0dXJuIHRleHRfY29vcmRfYXJyYXk7XG59O1xuXG52YXIgcmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gIC8vY3R4LmNsZWFyUmVjdCgwLCAwLCBib2R5X3dpZHRoLCBib2R5X2hlaWdodCk7XG5cbn07XG5cbnZhciByZW5kZXJsb29wID0gZnVuY3Rpb24oKSB7XG4gIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVybG9vcCk7XG5cbiAgaWYgKG5vdyAtIGxhc3RfdGltZV9yZW5kZXIgPiAxMDAwIC8gZnBzKSB7XG4gICAgcmVuZGVyKCk7XG4gICAgbGFzdF90aW1lX3JlbmRlciA9IERhdGUubm93KCk7XG4gIH1cbn07XG5cbnZhciByZXNpemVDYW52YXMgPSBmdW5jdGlvbigpIHtcbiAgYm9keV93aWR0aCAgPSBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoICogMjtcbiAgYm9keV9oZWlnaHQgPSBkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodCAqIDI7XG5cbiAgY2FudmFzLndpZHRoID0gYm9keV93aWR0aDtcbiAgY2FudmFzLmhlaWdodCA9IGJvZHlfaGVpZ2h0O1xuICBjYW52YXMuc3R5bGUud2lkdGggPSBib2R5X3dpZHRoIC8gMiArICdweCc7XG4gIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBib2R5X2hlaWdodCAvIDIgKyAncHgnO1xufTtcblxudmFyIHNldEV2ZW50ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgZXZlbnRUb3VjaFN0YXJ0ID0gZnVuY3Rpb24oeCwgeSkge1xuICB9O1xuICBcbiAgdmFyIGV2ZW50VG91Y2hNb3ZlID0gZnVuY3Rpb24oeCwgeSkge1xuICB9O1xuICBcbiAgdmFyIGV2ZW50VG91Y2hFbmQgPSBmdW5jdGlvbih4LCB5KSB7XG4gIH07XG5cbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgfSk7XG5cbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgfSk7XG5cbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZlbnRUb3VjaFN0YXJ0KGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpO1xuICB9KTtcblxuICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldmVudFRvdWNoTW92ZShldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKTtcbiAgfSk7XG5cbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2ZW50VG91Y2hFbmQoKTtcbiAgfSk7XG5cbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2ZW50VG91Y2hTdGFydChldmVudC50b3VjaGVzWzBdLmNsaWVudFgsIGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WSk7XG4gIH0pO1xuXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2ZW50VG91Y2hNb3ZlKGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WCwgZXZlbnQudG91Y2hlc1swXS5jbGllbnRZKTtcbiAgfSk7XG5cbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldmVudFRvdWNoRW5kKCk7XG4gIH0pO1xufTtcblxuaW5pdCgpO1xuIiwidmFyIGV4cG9ydHMgPSB7XG4gIGdldFJhbmRvbUludDogZnVuY3Rpb24obWluLCBtYXgpe1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSkgKyBtaW47XG4gIH0sXG4gIGdldERlZ3JlZTogZnVuY3Rpb24ocmFkaWFuKSB7XG4gICAgcmV0dXJuIHJhZGlhbiAvIE1hdGguUEkgKiAxODA7XG4gIH0sXG4gIGdldFJhZGlhbjogZnVuY3Rpb24oZGVncmVlcykge1xuICAgIHJldHVybiBkZWdyZWVzICogTWF0aC5QSSAvIDE4MDtcbiAgfSxcbiAgZ2V0U3BoZXJpY2FsOiBmdW5jdGlvbihyYWQxLCByYWQyLCByKSB7XG4gICAgdmFyIHggPSBNYXRoLmNvcyhyYWQxKSAqIE1hdGguY29zKHJhZDIpICogcjtcbiAgICB2YXIgeiA9IE1hdGguY29zKHJhZDEpICogTWF0aC5zaW4ocmFkMikgKiByO1xuICAgIHZhciB5ID0gTWF0aC5zaW4ocmFkMSkgKiByO1xuICAgIHJldHVybiBbeCwgeSwgel07XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cztcbiIsIi8vIFxuLy8g44GT44GuVmVjdG9yMuOCr+ODqeOCueOBr+OAgXRocmVlLmpz44GuVEhSRUUuVmVjdG9yMuOCr+ODqeOCueOBruioiOeul+W8j+OBruS4gOmDqOOCkuWIqeeUqOOBl+OBpuOBhOOBvuOBmeOAglxuLy8gaHR0cHM6Ly9naXRodWIuY29tL21yZG9vYi90aHJlZS5qcy9ibG9iL21hc3Rlci9zcmMvbWF0aC9WZWN0b3IyLmpzI0wzNjdcbi8vIFxuXG52YXIgZXhwb3J0cyA9IGZ1bmN0aW9uKCl7XG4gIHZhciBWZWN0b3IyID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHRoaXMueCA9IHggfHwgMDtcbiAgICB0aGlzLnkgPSB5IHx8IDA7XG4gIH07XG4gIFxuICBWZWN0b3IyLnByb3RvdHlwZSA9IHtcbiAgICBzZXQ6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICB0aGlzLnggPSB4O1xuICAgICAgdGhpcy55ID0geTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgY29weTogZnVuY3Rpb24gKHYpIHtcbiAgICAgIHRoaXMueCA9IHYueDtcbiAgICAgIHRoaXMueSA9IHYueTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgYWRkOiBmdW5jdGlvbiAodikge1xuICAgICAgdGhpcy54ICs9IHYueDtcbiAgICAgIHRoaXMueSArPSB2Lnk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGFkZFNjYWxhcjogZnVuY3Rpb24gKHMpIHtcbiAgICAgIHRoaXMueCArPSBzO1xuICAgICAgdGhpcy55ICs9IHM7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHN1YjogZnVuY3Rpb24gKHYpIHtcbiAgICAgIHRoaXMueCAtPSB2Lng7XG4gICAgICB0aGlzLnkgLT0gdi55O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBzdWJTY2FsYXI6IGZ1bmN0aW9uIChzKSB7XG4gICAgICB0aGlzLnggLT0gcztcbiAgICAgIHRoaXMueSAtPSBzO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBtdWx0OiBmdW5jdGlvbiAodikge1xuICAgICAgdGhpcy54ICo9IHYueDtcbiAgICAgIHRoaXMueSAqPSB2Lnk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIG11bHRTY2FsYXI6IGZ1bmN0aW9uIChzKSB7XG4gICAgICB0aGlzLnggKj0gcztcbiAgICAgIHRoaXMueSAqPSBzO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBkaXY6IGZ1bmN0aW9uICh2KSB7XG4gICAgICB0aGlzLnggLz0gdi54O1xuICAgICAgdGhpcy55IC89IHYueTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgZGl2U2NhbGFyOiBmdW5jdGlvbiAocykge1xuICAgICAgdGhpcy54IC89IHM7XG4gICAgICB0aGlzLnkgLz0gcztcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgbWluOiBmdW5jdGlvbiAodikge1xuICAgICAgaWYgKCB0aGlzLnggPCB2LnggKSB0aGlzLnggPSB2Lng7XG4gICAgICBpZiAoIHRoaXMueSA8IHYueSApIHRoaXMueSA9IHYueTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgbWF4OiBmdW5jdGlvbiAodikge1xuICAgICAgaWYgKCB0aGlzLnggPiB2LnggKSB0aGlzLnggPSB2Lng7XG4gICAgICBpZiAoIHRoaXMueSA+IHYueSApIHRoaXMueSA9IHYueTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgY2xhbXA6IGZ1bmN0aW9uICh2X21pbiwgdl9tYXgpIHtcbiAgICAgIGlmICggdGhpcy54IDwgdl9taW4ueCApIHtcbiAgICAgICAgdGhpcy54ID0gdl9taW4ueDtcbiAgICAgIH0gZWxzZSBpZiAoIHRoaXMueCA+IHZfbWF4LnggKSB7XG4gICAgICAgIHRoaXMueCA9IHZfbWF4Lng7XG4gICAgICB9XG4gICAgICBpZiAoIHRoaXMueSA8IHZfbWluLnkgKSB7XG4gICAgICAgIHRoaXMueSA9IHZfbWluLnk7XG4gICAgICB9IGVsc2UgaWYgKCB0aGlzLnkgPiB2X21heC55ICkge1xuICAgICAgICB0aGlzLnkgPSB2X21heC55O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBmbG9vcjogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy54ID0gTWF0aC5mbG9vciggdGhpcy54ICk7XG4gICAgICB0aGlzLnkgPSBNYXRoLmZsb29yKCB0aGlzLnkgKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgY2VpbDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy54ID0gTWF0aC5jZWlsKCB0aGlzLnggKTtcbiAgICAgIHRoaXMueSA9IE1hdGguY2VpbCggdGhpcy55ICk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHJvdW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnggPSBNYXRoLnJvdW5kKCB0aGlzLnggKTtcbiAgICAgIHRoaXMueSA9IE1hdGgucm91bmQoIHRoaXMueSApO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICByb3VuZFRvWmVybzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy54ID0gKCB0aGlzLnggPCAwICkgPyBNYXRoLmNlaWwoIHRoaXMueCApIDogTWF0aC5mbG9vciggdGhpcy54ICk7XG4gICAgICB0aGlzLnkgPSAoIHRoaXMueSA8IDAgKSA/IE1hdGguY2VpbCggdGhpcy55ICkgOiBNYXRoLmZsb29yKCB0aGlzLnkgKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgbmVnYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnggPSAtIHRoaXMueDtcbiAgICAgIHRoaXMueSA9IC0gdGhpcy55O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBkb3Q6IGZ1bmN0aW9uICh2KSB7XG4gICAgICByZXR1cm4gdGhpcy54ICogdi54ICsgdGhpcy55ICogdi55O1xuICAgIH0sXG4gICAgbGVuZ3RoU3E6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnk7XG4gICAgfSxcbiAgICBsZW5ndGg6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy5sZW5ndGhTcSgpKTtcbiAgICB9LFxuICAgIG5vcm1hbGl6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZGl2U2NhbGFyKHRoaXMubGVuZ3RoKCkpO1xuICAgIH0sXG4gICAgZGlzdGFuY2VUbzogZnVuY3Rpb24gKHYpIHtcbiAgICAgIHZhciBkeCA9IHRoaXMueCAtIHYueDtcbiAgICAgIHZhciBkeSA9IHRoaXMueSAtIHYueTtcbiAgICAgIHJldHVybiBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuICAgIH0sXG4gICAgc2V0TGVuZ3RoOiBmdW5jdGlvbiAobCkge1xuICAgICAgdmFyIG9sZExlbmd0aCA9IHRoaXMubGVuZ3RoKCk7XG4gICAgICBpZiAoIG9sZExlbmd0aCAhPT0gMCAmJiBsICE9PSBvbGRMZW5ndGggKSB7XG4gICAgICAgIHRoaXMubXVsdFNjYWxhcihsIC8gb2xkTGVuZ3RoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgY2xvbmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBuZXcgVmVjdG9yMih0aGlzLngsIHRoaXMueSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFZlY3RvcjI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMoKTtcbiJdfQ==
