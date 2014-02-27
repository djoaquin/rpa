(function() {
  $(function() {
    var exampleData;
    cartodb.createVis('discretionaryIncome', 'http://rpa.cartodb.com/api/v2/viz/62e94d78-9f1e-11e3-b420-0ed66c7bc7f3/viz.json').done(function(vis, layers) {
      var map;
      layers[1].setInteraction(true);
      layers[1].on('featureOver', function(e, latlng, pos, data, layerNumber) {});
      map = vis.getNativeMap();
      return map.setZoom(8);
    });
    exampleData = function() {
      var keys;
      keys = ["Transportation Cost", "Housing Cost", "Income Taxes", "Discretionary Income"];
      return stream_layers(4, 10 + Math.random() * 4, .1).map(function(data, i) {
        return {
          key: keys[i],
          values: data
        };
      });
    };
    return nv.addGraph(function() {
      var chart;
      chart = nv.models.multiBarChart().transitionDuration(150).stacked(true).reduceXTicks(true).rotateLabels(0).showControls(false).groupSpacing(0.1);
      chart.xAxis.tickFormat(d3.format(',f'));
      chart.yAxis.tickFormat(d3.format(',.1f'));
      d3.select('#chart1 svg').datum(exampleData()).call(chart);
      nv.utils.windowResize(chart.update);
      return chart;
    });
  });

}).call(this);
