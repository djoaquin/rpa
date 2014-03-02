(function() {
  var Workspace,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Workspace = (function(_super) {
    __extends(Workspace, _super);

    function Workspace() {
      return Workspace.__super__.constructor.apply(this, arguments);
    }

    Workspace.prototype.routes = {
      "schools.html": "schools",
      "vulnerable.html": "vulnerable",
      "discretionary.html": "discretionary"
    };

    Workspace.prototype.schools = function() {
      return cartodb.createVis('schoolPerf', 'http://rpa.cartodb.com/api/v2/viz/5bc0d9be-a264-11e3-bc17-0e10bcd91c2b/viz.json', {
        searchControl: true,
        layer_selector: false,
        legends: true
      }).done(function(vis, layers) {});
    };

    Workspace.prototype.vulnerable = function() {
      return cartodb.createVis('vulnerableInfra', 'http://rpa.cartodb.com/api/v2/viz/533c5970-9f4f-11e3-ad24-0ed66c7bc7f3/viz.json', {
        zoom: 9,
        searchControl: true,
        layer_selector: false,
        legends: true
      }).done(function(vis, layers) {
        var dbs, layer, map;
        map = vis.getNativeMap();
        layer = layers[1];
        layer.setInteraction(true);
        dbs = [
          {
            color: "#000",
            tables: ["rpa_nj_hsip_hospitals_compressed"]
          }, {
            color: "#333",
            tables: ["rpa_nj_hsip_nursinghomes_compressed", "ny_rpa_nursinghomesnamesbedsflood", "rpa_ct_nursinghomes_namesaddressesbeds"]
          }, {
            color: "#999",
            tables: ["rpa_subwaystations"]
          }, {
            color: "#aaa",
            tables: ["rpa_trainstations"]
          }
        ];
        return dbs.forEach(function(item) {
          var css, sql, sublayer;
          sql = _.map(item["tables"], function(table) {
            return "SELECT " + table + ".flood, " + table + ".the_geom FROM " + table;
          });
          sql = sql.join(" UNION ALL ");
          console.log(sql);
          css = _.map(item["tables"], function(table) {
            return "#" + table + " {marker-fill: " + item['color'] + ";} #" + table + "[flood = 0] { opacity: 0.6;}";
          });
          css = css.join(" ");
          if (sql && css) {
            sublayer = layer.createSubLayer({
              sql: sql,
              cartocss: css,
              interactivity: "cartodb_id"
            });
          }
          return sublayer.on("featureOver", function() {
            return console.log("over");
          });
        });
      });
    };

    Workspace.prototype.discretionary = function() {
      var maps;
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
          return _.template("<div class=\"cartodb-popup\">\n  <a href=\"#close\" class=\"cartodb-popup-close-button close\">x</a>\n   <div class=\"cartodb-popup-content-wrapper\">\n     <div class=\"cartodb-popup-content\" data-disp_inc=\"<%=content.data." + disp_inc + "%>\" data-trans=\"<%=content.data." + trans + "%>\" data-housing=\"<%=content.data." + housing + "%>\" data-taxes=\"<%=content.data." + taxes + "%>\">\n\n      <h2 class=\"title\"><%=content.data." + type_name + "%></h2>\n\n      <div class=\"leftColumn\">\n        <div class=\"discretionary\">\n          <div>Discretionary Income</div>\n          <b class=\"currency\"><%=content.data." + disp_inc + "%></b>\n        </div>\n\n        <div class=\"trans\">\n          <div>Transportation</div>\n          <b class=\"currency\"><%=content.data." + trans + "%></b>\n        </div>\n\n        <div class=\"housing\">\n          <div>Housing and other related costs</div>\n          <b class=\"currency\"><%=content.data." + housing + "%></b>\n        </div>\n\n        <div class=\"taxes\">\n          <div>State and local personal income tax</div>\n          <b class=\"currency\"><%=content.data." + taxes + "%></b>\n        </div>\n      </div>\n\n      <div class=\"rightColumn\">\n        <div class=\"mhi text-center\">\n          <div>Median Income</div>\n          <b class=\"median-income currency\"><%=Math.round(Number(content.data." + mhi + "))%></b>\n        </div>\n\n        <canvas id=\"donut\" width=\"130\" height=\"130\"></canvas>\n\n      </div>\n     </div>\n   </div>\n</div>");
        };
        censusLayer.infowindow.set('template', tmpl("Census Tract", "namelsad10", "mhi", "disp_inc", "avg_transc", "housingcos", "avg_ttl"));
        countyLayer.infowindow.set('template', tmpl("County", "county", "avg_mhi", "disp_inc", "avg_trans", "avg_hous", "avg_ttl"));
        vent.on("infowindow:rendered", function(obj) {
          var chartData, ctx, data, options;
          if (obj["null"] === "Loading content...") {
            return;
          }
          data = $(".cartodb-popup-content").data();
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
            percentageInnerCutout: 70,
            animationEasing: "easeOutQuart",
            animationSteps: 30
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
        });
        map = vis.getNativeMap();
        return map.on('zoomend', function(a, b, c) {
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
      });
    };

    return Workspace;

  })(Backbone.Router);

  $(function() {
    new Workspace();
    return Backbone.history.start({
      pushState: true,
      root: root
    });
  });

}).call(this);
