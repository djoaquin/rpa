(function() {
  this.stream_layers = function(n, m, o) {
    var bump;
    bump = function(a) {
      var i, w, x, y, z;
      x = 1 / (.1 + Math.random());
      y = 2 * Math.random() - .5;
      z = 10 / (.1 + Math.random());
      i = 0;
      while (i < m) {
        w = (i / m - y) * z;
        a[i] += x * Math.exp(-w * w);
        i++;
      }
    };
    if (arguments.length < 3) {
      o = 0;
    }
    return d3.range(n).map(function() {
      var a, i;
      a = [];
      i = void 0;
      i = 0;
      while (i < m) {
        a[i] = o + o * Math.random();
        i++;
      }
      i = 0;
      while (i < 5) {
        bump(a);
        i++;
      }
      return a.map(stream_index);
    });
  };

  this.stream_waves = function(n, m) {
    return d3.range(n).map(function(i) {
      return d3.range(m).map(function(j) {
        var x;
        x = 20 * j / m - i / 3;
        return 2 * x * Math.exp(-.5 * x);
      }).map(stream_index);
    });
  };

  this.stream_index = function(d, i) {
    return {
      x: i,
      y: Math.max(0, d)
    };
  };

}).call(this);
