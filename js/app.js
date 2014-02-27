(function() {
  $(function() {
    var exampleData, maps;
    maps = {};
    cartodb.createVis('discretionaryIncome', 'http://rpa.cartodb.com/api/v2/viz/62e94d78-9f1e-11e3-b420-0ed66c7bc7f3/viz.json', {
      legends: true,
      searchControl: true,
      zoom: 8,
      infowindow: true,
      layer_selector: true
    }).done(function(vis, layers) {});
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
    nv.addGraph(function() {
      var chart;
      chart = nv.models.multiBarChart().transitionDuration(150).stacked(true).reduceXTicks(true).rotateLabels(0).showControls(false).groupSpacing(0.1);
      chart.xAxis.tickFormat(d3.format(',f'));
      chart.yAxis.tickFormat(d3.format(',.1f'));
      d3.select('#chart1 svg').datum(exampleData()).call(chart);
      nv.utils.windowResize(chart.update);
      return chart;
    });
    return cartodb.createVis('vulnerableInfra', 'http://rpa.cartodb.com/api/v2/viz/533c5970-9f4f-11e3-ad24-0ed66c7bc7f3/viz.json', {
      zoom: 8,
      searchControl: true,
      layer_selector: false
    }).done(function(vis, layers) {
      var layer;
      maps.vulnerableInfra = vis.getNativeMap();
      layer = layers[1];
      layer.createSubLayer({
        sql: "SELECT * FROM rpa_subwayroutes_flood",
        cartocss: '#rpa_subwayroutes_flood {marker-fill: #000;}'
      });
      return layer.createSubLayer({
        sql: "SELECT * FROM rpa_subwaystations",
        cartocss: '#rpa_subwaystations {marker-fill: yellow;}'
      });
    });
  });

}).call(this);
