(function() {
  var Workspace, formatMoney,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  formatMoney = function() {
    return $(".currency").each(function() {
      var c;
      c = $(this).text();
      if (c[0] === "$") {
        return true;
      }
      c = accounting.formatMoney(Number(c), {
        precision: 0
      });
      return $(this).text(c);
    });
  };

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
        legends: true,
        zoom: 10
      }).done(function(vis, layers) {
        var schoolLayer, tooltip;
        layers[1].setInteraction(true);
        schoolLayer = layers[1].getSubLayer(1);
        schoolLayer = schoolLayer.setInteractivity("cartodb_id, schlrank, rank_perce, schnam");
        tooltip = new cdb.geo.ui.Tooltip({
          template: "<div class=\"cartodb-popup\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <h2 class=\"title\">{{schnam}}</h2>\n        {{#rank_perce}}\n          <p>School ranking</p>\n          <p class=\"{{schlrank}}\"><b class=\"school-ranking\">{{rank_perce}}</b> <b> ({{schlrank}}) </b></p>\n        {{/rank_perce}}\n        {{^rank_perce}}\n          <p class=\"{{schlrank}}\">No data available</p>\n        {{/rank_perce}}\n      </div>\n   </div>\n</div>",
          layer: schoolLayer,
          offset_top: -50
        });
        vis.container.append(tooltip.render().el);
        return vent.on("tooltip:rendered", function(data) {
          var rank;
          rank = data["rank_perce"];
          if (!rank) {
            return;
          }
          rank = (parseFloat(rank) * 100).toFixed(2);
          return $(".school-ranking").text("" + rank + "%");
        });
      });
    };

    Workspace.prototype.vulnerable = function() {
      return cartodb.createVis('vulnerableInfra', 'http://rpa.cartodb.com/api/v2/viz/533c5970-9f4f-11e3-ad24-0ed66c7bc7f3/viz.json', {
        zoom: 9,
        searchControl: true,
        layer_selector: false,
        legends: false
      }).done(function(vis, layers) {
        var dbs, floodZoneLayer, layer, map, red;
        map = vis.getNativeMap();
        layer = layers[1];
        floodZoneLayer = layer.getSubLayer(0);
        layer.setInteraction(true);
        red = "#ba0000";
        dbs = {
          power_plants: {
            flood_column: "flood",
            name_column: "plant_name",
            loss_column: "total_cap",
            affected_type: "plants",
            tables: ["rpa_powerplants_eia_latlong_2013"]
          },
          hospitals: {
            flood_column: "flood",
            name_column: "name",
            loss_column: "total_beds",
            affected_type: "beds",
            tables: ["rpa_nj_hsip_hospitals_compressed", "ny_rpa_hospitalsnamesbeds_compressed", "rpa_ct_hospitals_names_beds"]
          },
          nursing_homes: {
            flood_column: "flood",
            name_column: "name",
            loss_column: "beds",
            affected_type: "beds",
            tables: ["rpa_ct_nursinghomes_namesaddressesbeds", "rpa_nj_hsip_nursinghomes_compressed", "ny_rpa_nursinghomesnamesbedsflood"]
          },
          train_stations: {
            flood_column: "flood",
            name_column: "station_na",
            affected_type: "stations",
            loss_column: "cartodb_id",
            tables: ["rpa_trainstations"]
          },
          rail_lines: {
            flood_column: "flood",
            name_column: "line_name",
            affected_type: "units",
            loss_column: "cartodb_id",
            tables: ["rpa_raillines_flood"]
          },
          subway_stations: {
            flood_column: "flood",
            name_column: "station_na",
            loss_column: "cartodb_id",
            affected_type: "stations",
            tables: ["rpa_subwaystations"]
          },
          subway_routes: {
            flood_column: "am",
            name_column: "route_name",
            loss_column: "cartodb_id",
            affected_type: "routes",
            tables: ["rpa_subwayroutes_flood"]
          }
        };
        _.each(dbs, function(value, k) {
          var css, sql, sublayer;
          sql = _.map(value["tables"], function(table) {
            return "SELECT " + table + ".cartodb_id," + table + "." + value['flood_column'] + ", " + table + ".the_geom, " + table + ".the_geom_webmercator, " + table + "." + value['name_column'] + "  FROM " + table;
          });
          sql = sql.join(" UNION ALL ");
          css = _.map(value["tables"], function(table) {
            return "#" + table + " {marker-fill: " + red + ";marker-line-width:0;::line {line-width: 1;line-color: " + red + ";}[" + value['flood_column'] + " < 1]{marker-fill: #575757;}[zoom <= 13] {marker-width: 5;}[zoom > 13] {marker-width: 15;}}";
          });
          css = css.join(" ");
          if (sql && css) {
            sublayer = layer.createSubLayer({
              sql: sql,
              cartocss: css,
              interactivity: ["cartodb_id", value['name_column']]
            });
            return value["layer"] = sublayer;
          }
        });
        _.each(dbs, function(value, k) {
          return vis.addOverlay({
            layer: value["layer"],
            type: 'tooltip',
            offset_top: -30,
            template: "<div style=\"background:white;padding:5px 10px;\">\n  <h3 style=\"margin-top:0\" class=\"title-case\">{{ " + value['name_column'] + " }}</h3>\n  <p>Affected " + value['affected_type'] + ": {{ " + value['loss_column'] + " }}</p>\n</div>"
          });
        });
        return $("#layer_selector li").on("click", function(e) {
          var $li, activeLi, activeSublayers, dbs_and_flood_zone, layerName;
          $li = $(e.target);
          layerName = $li.data("sublayer");
          $li.toggleClass("active");
          activeLi = $li.parent().find(".active");
          activeSublayers = activeLi.map(function(i, item) {
            return $(item).data("sublayer");
          });
          dbs_and_flood_zone = _.extend(dbs, {
            flood_zone: []
          });
          return _.each(dbs_and_flood_zone, function(value, k) {
            if (__indexOf.call(activeSublayers, k) >= 0) {
              if (k === "flood_zone") {
                return floodZoneLayer.show();
              } else {
                return value["layer"].show();
              }
            } else {
              if (k === "flood_zone") {
                return floodZoneLayer.hide();
              } else {
                return value["layer"].hide();
              }
            }
          });
        });
      });
    };

    Workspace.prototype.discretionary = function() {
      var data, makeChart;
      makeChart = function(data, mhi, id) {
        var blue, brown, chartData, ctx, dark_brown, donut_options, options, reddish;
        if (id == null) {
          id = "#donut";
        }
        blue = "#47b3d2";
        reddish = "#f12b15";
        brown = "#b92b15";
        dark_brown = "#7c2b15";
        chartData = [
          {
            value: data["disp_inc"],
            color: blue
          }, {
            value: data["trans"],
            color: reddish
          }, {
            value: data["housing"],
            color: brown
          }, {
            value: data["taxes"],
            color: dark_brown
          }
        ];
        ctx = $(id).get(0).getContext("2d");
        donut_options = {
          percentageInnerCutout: 70,
          animationEasing: "easeOutQuart",
          animationSteps: 30
        };
        options = {
          tooltips: {
            background: "#000",
            labelTemplate: "<%= (value / " + mhi + " * 100 ).toFixed(2) %>%"
          }
        };
        return new Chart(ctx, options).Doughnut(chartData, donut_options);
      };
      data = {
        disp_inc: 29817,
        trans: 10519,
        housing: 21460,
        taxes: 10344
      };
      makeChart(data, 72140, "#standalone_donut");
      return cartodb.createVis('discretionaryIncome', 'http://rpa.cartodb.com/api/v2/viz/62e94d78-9f1e-11e3-b420-0ed66c7bc7f3/viz.json', {
        legends: true,
        searchControl: true,
        zoom: 8,
        infowindow: true,
        layer_selector: false
      }).done(function(vis, layers) {
        var censusLayer, countyLayer, dataLayers, map, tmpl, tooltip;
        map = vis.getNativeMap();
        dataLayers = layers[1];
        dataLayers.setInteraction(true);
        countyLayer = dataLayers.getSubLayer(0);
        censusLayer = dataLayers.getSubLayer(1);
        censusLayer.hide();
        map.on('zoomend', function(a, b, c) {
          var zoomLevel;
          zoomLevel = map.getZoom();
          if (zoomLevel > 10) {
            censusLayer.show();
            countyLayer.hide();
            return $(".please_zoom_in").text("Zoom out to see county level data.");
          } else {
            censusLayer.hide();
            countyLayer.show();
            return $(".please_zoom_in").text("Zoom in to the map to see neighborhood level data.");
          }
        });
        tmpl = function(type, type_name, mhi, disp_inc, trans, housing, taxes) {
          return _.template("<div class=\"cartodb-popup\">\n  <a href=\"#close\" class=\"cartodb-popup-close-button close\">x</a>\n   <div class=\"cartodb-popup-content-wrapper\">\n     <div class=\"cartodb-popup-content\" data-disp_inc=\"<%=content.data." + disp_inc + "%>\" data-trans=\"<%=content.data." + trans + "%>\" data-housing=\"<%=content.data." + housing + "%>\" data-taxes=\"<%=content.data." + taxes + "%>\">\n      <div class=\"title\">\n        <h2>\n          <%=content.data." + type_name + "%>\n        </h2>\n        <% if(\"" + type + "\"==\"Census Tract\"){ %>\n          <p><%=content.data.localname  %></p>\n        <% } %>\n      </div>\n\n      <div class=\"leftColumn\">\n        <b>Income Components</b>\n        <div class=\"discretionary\">\n          <div>Discretionary Income</div>\n          <b class=\"currency\"><%=content.data." + disp_inc + "%></b>\n        </div>\n\n        <div class=\"trans\">\n          <div>Transportation</div>\n          <b class=\"currency\"><%=content.data." + trans + "%></b>\n        </div>\n\n        <div class=\"housing\">\n          <div>Housing and other related costs</div>\n          <b class=\"currency\"><%=content.data." + housing + "%></b>\n        </div>\n\n        <div class=\"taxes\">\n          <div>State and local personal income tax</div>\n          <b class=\"currency\"><%=content.data." + taxes + "%></b>\n        </div>\n      </div>\n\n      <div class=\"rightColumn\">\n        <div class=\"mhi text-center\">\n          <div>Median <br/> Income</div>\n          <b class=\"median-income currency\"><%=Math.round(Number(content.data." + mhi + "))%></b>\n        </div>\n\n        <canvas id=\"donut\" width=\"130\" height=\"130\"></canvas>\n\n      </div>\n     </div>\n   </div>\n</div>");
        };
        censusLayer.infowindow.set('template', tmpl("Census Tract", "namelsad10", "mhi", "disp_inc", "avg_transc", "housingcos", "avg_ttl"));
        countyLayer.infowindow.set('template', tmpl("County", "county", "avg_mhi", "disp_inc", "avg_trans", "avg_hous", "avg_ttl"));
        countyLayer = countyLayer.setInteractivity("cartodb_id, county, disp_inc");
        tooltip = new cdb.geo.ui.Tooltip({
          template: "<div class=\"cartodb-popup\" style=\"height:100px !important;overflow:hidden\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <h2 class=\"title\">{{county}}</h2>\n        <p class=\"currency\">{{disp_inc}}</p>\n      </div>\n   </div>\n</div>",
          layer: countyLayer,
          offset_top: -30
        });
        vis.container.append(tooltip.render().el);
        censusLayer = censusLayer.setInteractivity("cartodb_id, namelsad10, disp_inc");
        tooltip = new cdb.geo.ui.Tooltip({
          template: "<div class=\"cartodb-popup\" style=\"height:100px !important;overflow:hidden\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <h2 class=\"title\">{{namelsad10}}</h2>\n        <p class=\"currency\">{{disp_inc}}</p>\n      </div>\n   </div>\n</div>",
          layer: censusLayer,
          offset_top: -30
        });
        vis.container.append(tooltip.render().el);
        vent.on("tooltip:rendered", function() {
          return formatMoney();
        });
        return vent.on("infowindow:rendered", function(obj) {
          var mhi;
          if (obj["null"] === "Loading content...") {
            return;
          }
          data = $(".cartodb-popup-content").data();
          mhi = $("#discretionaryIncome .median-income").text();
          makeChart(data, Number(mhi));
          return formatMoney();
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
