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
