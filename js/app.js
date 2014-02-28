(function() {
  var GOOGLE_API_KEY;

  GOOGLE_API_KEY = "AIzaSyAv_1ubjVfxNg3v7SUrNcgfZ6OUjkjBujM";

  $(function() {
    var maps;
    maps = {};
    return cartodb.createVis('discretionaryIncome', 'http://rpa.cartodb.com/api/v2/viz/62e94d78-9f1e-11e3-b420-0ed66c7bc7f3/viz.json', {
      legends: true,
      searchControl: true,
      zoom: 8,
      infowindow: true,
      layer_selector: true
    }).done(function(vis, layers) {
      var censusLayer, countyLayer, dataLayers, map;
      dataLayers = layers[1];
      censusLayer = dataLayers.getSubLayer(1);
      countyLayer = dataLayers.getSubLayer(0);
      censusLayer.hide();
      map = vis.getNativeMap();
      google.maps.event.addListener(map, 'zoom_changed', function() {
        var zoomLevel;
        zoomLevel = map.getZoom();
        if (zoomLevel > 10) {
          censusLayer.show();
          return countyLayer.hide();
        } else {
          censusLayer.hide();
          return countyLayer.show();
        }
      });
      censusLayer.infowindow.set('template', $('#infowindow_template').html());
      countyLayer.infowindow.set('template', $('#infowindow_template').html());
      dataLayers.setInteraction(true);
      return dataLayers.on('featureClick', function(e, latlng, pos, data, layerNumber) {
        return cartodb.log.log(e, latlng, pos, data, layerNumber);
      });
    });
  });

}).call(this);
