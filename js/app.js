(function() {
  var GOOGLE_API_KEY;

  GOOGLE_API_KEY = "AIzaSyAv_1ubjVfxNg3v7SUrNcgfZ6OUjkjBujM";

  $(function() {
    var maps;
    $(document).on("DOMNodeInserted", function(e) {
      if (e.target.className === "cartodb-popup-content") {
        return setTimeout((function() {
          var chartData, ctx, data, options;
          data = $(".cartodb-popup-content").data();
          console.log(data[0]);
          chartData = [
            {
              value: data["taxes"],
              color: "#47b3d2"
            }, {
              value: data["housing"],
              color: "#f12b15"
            }, {
              value: data["trans"],
              color: "#b92b15"
            }, {
              value: data["disp_inc"],
              color: "#7c2b15"
            }
          ];
          ctx = $("#donut").get(0).getContext("2d");
          options = {
            percentageInnerCutout: 70
          };
          new Chart(ctx).Doughnut(chartData, options);
          return $(".currency").each(function() {
            var c;
            c = $(this).text();
            c = accounting.formatMoney(Number(c), {
              precision: 0
            });
            return $(this).text(c);
          });
        }), 100);
      }
    });
    maps = {};
    return cartodb.createVis('discretionaryIncome', 'http://rpa.cartodb.com/api/v2/viz/62e94d78-9f1e-11e3-b420-0ed66c7bc7f3/viz.json', {
      legends: true,
      searchControl: true,
      zoom: 8,
      infowindow: true,
      layer_selector: true
    }).done(function(vis, layers) {
      var censusLayer, countyLayer, dataLayers, map, tmpl;
      dataLayers = layers[1];
      dataLayers.setInteraction(true);
      countyLayer = dataLayers.getSubLayer(0);
      censusLayer = dataLayers.getSubLayer(1);
      censusLayer.hide();
      tmpl = function(type, type_name, mhi, disp_inc, trans, housing, taxes) {
        return _.template("<div class=\"cartodb-popup\">\n  <a href=\"#close\" class=\"cartodb-popup-close-button close\">x</a>\n   <div class=\"cartodb-popup-content-wrapper\">\n     <div class=\"cartodb-popup-content\" data-disp_inc=\"<%=content.data." + disp_inc + "%>\" data-trans=\"<%=content.data." + trans + "%>\" data-housing=\"<%=content.data." + housing + "%>\" data-taxes=\"<%=content.data." + taxes + "%>\">\n\n\n\n      <h2 class=\"title\"><%=content.data." + type_name + "%></h2>\n\n\n      <div class=\"leftColumn\">\n        <div class=\"discretionary\">\n          <div>Discretionary Income</div>\n          <b class=\"currency\"><%=content.data." + disp_inc + "%></b>\n        </div>\n\n        <div class=\"trans\">\n          <div>Transportation</div>\n          <b class=\"currency\"><%=content.data." + trans + "%></b>\n        </div>\n\n        <div class=\"housing\">\n          <div>Housing and other related costs</div>\n          <b class=\"currency\"><%=content.data." + housing + "%></b>\n        </div>\n\n        <div class=\"taxes\">\n          <div>State and local personal income tax</div>\n          <b class=\"currency\"><%=content.data." + taxes + "%></b>\n        </div>\n      </div>\n\n      <div class=\"rightColumn\">\n        <div class=\"mhi text-center\">\n          <div>Median Income</div>\n          <b class=\"median-income currency\"><%=Math.round(Number(content.data." + mhi + "))%></b>\n        </div>\n\n        <canvas id=\"donut\" width=\"170\" height=\"170\"></canvas>\n\n      </div>\n     </div>\n   </div>\n</div>");
      };
      censusLayer.infowindow.set('template', tmpl("Census Tract", "namelsad10", "mhi", "disp_inc", "avg_transc", "housingcos", "avg_ttl"));
      countyLayer.infowindow.set('template', tmpl("County", "county", "avg_mhi", "disp_inc", "avg_trans", "avg_hous", "avg_ttl"));
      map = vis.getNativeMap();
      map.on('zoomend', function(a, b, c) {
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
      return dataLayers.on('featureClick', function(e, latlng, pos, data, layerNumber) {});
    });
  });

}).call(this);
