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
      "discretionary.html": "discretionary",
      "walkability.html": "walkability",
      "property.html": "property",
      "carbon.html": "carbon",
      "c/1.html": "discretionary",
      "c/2.html": "discretionary",
      "c/3.html": "discretionary",
      "c/4.html": "discretionary",
      "c/5.html": "discretionary",
      "c/6.html": "discretionary"
    };

    Workspace.prototype.carbon = function() {
      var id, url;
      id = "carbon";
      url = "http://rpa.cartodb.com/api/v2/viz/7d0015c0-aed2-11e3-a656-0e73339ffa50/viz.json";
      return cartodb.createVis(id, url, {
        searchControl: false,
        layer_selector: false,
        legends: true,
        zoom: 9
      }).done(function(vis, layers) {
        var activeSublayer, adjust_layer_vis, adjust_sublayer_vis, colors, columns, county_cols, default_sublayers, layer, layer_county, layer_zip, map, shared_cols, sublayers, tables, zip_cols;
        layer = layers[1];
        layer_county = layers[1].getSubLayer(0);
        layer_zip = layers[1].getSubLayer(1);
        layer.setInteraction(true);
        layer_zip.hide();
        default_sublayers = {
          county: layer_county,
          zip: layer_zip
        };
        colors = {
          transport: "#f9b314",
          housing: "#eb0000",
          food: "#2fb0c4",
          goods: "#3f4040",
          services: "#695b94",
          total: "#008000"
        };
        shared_cols = "food,goods,services,total,transport,housing";
        county_cols = "county_n," + shared_cols;
        zip_cols = "" + shared_cols + ",po_name,zip";
        columns = function(table) {
          if (table === "rpa_carbonfootprint") {
            return zip_cols;
          } else {
            return county_cols;
          }
        };
        tables = ["rpa_carbonfootprint", "rpa_carbonfootprint_county"];
        sublayers = {};
        _.each(tables, function(table, k) {
          var others, sql;
          others = ", " + columns(table);
          sql = "SELECT " + table + ".cartodb_id, " + table + ".the_geom, " + table + ".the_geom_webmercator " + others + " FROM " + table;
          return _.each(colors, function(hex, column) {
            var css, interactivity, sublayer, t, tlayers;
            css = "#" + table + " [" + column + " > 60] {\n  //Darkest\n  polygon-fill: " + hex + ";\n}\n#" + table + " [" + column + " > 40][" + column + " < 60] {\n  //Lighter\n  polygon-fill: " + (shade(hex, -0.1)) + ";\n}\n#" + table + " [" + column + " < 40] {\n  //Lightest\n  polygon-fill: " + (shade(hex, -0.2)) + ";\n}";
            interactivity = ["cartodb_id"];
            interactivity = interactivity.concat(columns(table).split(","));
            sublayer = layer.createSubLayer({
              sql: sql,
              cartocss: css,
              interactivity: interactivity
            });
            tlayers = sublayers[column];
            t = {};
            t[table] = sublayer;
            if (tlayers) {
              return sublayers[column] = _.extend(tlayers, t);
            } else {
              return sublayers[column] = t;
            }
          });
        });
        _.each(sublayers, function(value, layer_name) {
          return _.each(tables, function(table) {
            return vis.addOverlay({
              layer: value[table],
              type: 'tooltip',
              offset_top: -30,
              template: "<h3 class=\"title-case\">\n  Avg. Household Carbon Emissions (MTCO2E)\n</h3>\n{{#county_n}}\n  <b>County: <span>{{county_n}}</span></b>\n{{/county_n}}\n{{#zip}}\n  <b>Zip Code: <span>{{zip}}</span></b>\n{{/zip}}\n<div class=\"progressive\">\n\n</div>\n<div class=\"tooltip-legend clearfix\">\n  <div class=\"food\">Food</div>\n  <div class=\"goods\">Goods</div>\n  <div class=\"services\">Services</div>\n  <div class=\"transport\">Transport</div>\n  <div class=\"housing\">Housing</div>\n</div>"
            });
          });
        });
        adjust_layer_vis = function(opts) {
          default_sublayers[opts["show"]].show();
          return default_sublayers[opts["hide"]].hide();
        };
        activeSublayer = "total";
        adjust_sublayer_vis = function(opts) {
          return _.each(sublayers, function(value, layer_name) {
            value[opts["hide"]].hide();
            if (layer_name === activeSublayer) {
              return value[opts["show"]].show();
            }
          });
        };
        adjust_sublayer_vis({
          show: tables[1],
          hide: tables[0]
        });
        map = vis.getNativeMap();
        map.on('zoomend', function(a, b, c) {
          var zoomLevel;
          $(".cartodb-tooltip").hide();
          zoomLevel = map.getZoom();
          if (zoomLevel > 9) {
            adjust_sublayer_vis({
              show: tables[0],
              hide: tables[1]
            });
            return adjust_layer_vis({
              show: "zip",
              hide: "county"
            });
          } else {
            adjust_sublayer_vis({
              show: tables[1],
              hide: tables[0]
            });
            return adjust_layer_vis({
              show: "county",
              hide: "zip"
            });
          }
        });
        vent.on("tooltip:rendered", function(d, $el) {
          var data;
          data = [d["transport"], d["housing"], d["food"], d["goods"], d["services"]];
          return makeStackedChart(data, $el.find(".progressive").get(0));
        });
        vent.on("infowindow:rendered", function(d, $el) {
          var data, region;
          if (d["null"] === "Loading content...") {
            return;
          }
          data = [d["transport"], d["housing"], d["food"], d["goods"], d["services"]];
          region = [12.7, 11.7, 8.0, 6.0, 6.8];
          return makeStackedChart([data, region], $el.find(".progressive").get(0), true);
        });
        return $("#layer_selector li").on("click", function(e) {
          var $li, current_table, layerName, legend, zoomLevel;
          $li = $(e.target);
          $li.siblings("li").removeClass("active");
          $li.addClass("active");
          layerName = $li.data("sublayer");
          activeSublayer = layerName;
          legend = $(".cartodb-legend .cartodb-legend");
          legend.removeClass();
          legend.addClass("cartodb-legend " + layerName + "-layer");
          zoomLevel = map.getZoom();
          current_table = zoomLevel > 9 ? tables[0] : tables[1];
          _.each(sublayers, function(sublayer, k) {
            return sublayer[current_table].hide();
          });
          return sublayers[layerName][current_table].show();
        });
      });
    };

    Workspace.prototype.property = function() {
      var id, url;
      id = "property";
      url = "http://rpa.cartodb.com/api/v2/viz/f368bbb4-aebd-11e3-a057-0e10bcd91c2b/viz.json";
      return cartodb.createVis(id, url, {
        searchControl: false,
        layer_selector: false,
        legends: true,
        zoom: 9
      }).done(function(vis, layers) {
        var color1, color2, color3, map, propertyLayerNYC, propertyLayerNoNYC, rate_to_color, tooltip, tooltip2;
        color1 = "#ffefc9";
        color2 = "#fdde9c";
        color3 = "#80c5d8";
        layers[1].setInteraction(true);
        propertyLayerNoNYC = layers[1].getSubLayer(0);
        propertyLayerNYC = layers[1].getSubLayer(1);
        propertyLayerNoNYC = propertyLayerNoNYC.setInteractivity("namelsad10, localname, retaxrate, retax_acs, med_val");
        propertyLayerNYC = propertyLayerNYC.setInteractivity("namelsad10, localname, retaxrate, retax_acs, med_val");
        propertyLayerNYC.hide();
        tooltip = new cdb.geo.ui.Tooltip({
          template: "<div class=\"cartodb-popup\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <p><b>{{namelsad10}}</b></p>\n        <p>{{localname}}</p>\n        <p class=\"property-tax\">Property Tax: <b class=\"tax-rate\">{{retaxrate}}</b></p>\n      </div>\n   </div>\n</div>",
          layer: propertyLayerNoNYC,
          offset_top: -50
        });
        vis.container.append(tooltip.render().el);
        tooltip2 = new cdb.geo.ui.Tooltip({
          template: "<div class=\"cartodb-popup\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <p><b>{{namelsad10}}</b></p>\n        <p>{{localname}}</p>\n        <p class=\"property-tax\">Property Tax: <b class=\"tax-rate\">{{retaxrate}}</b></p>\n      </div>\n   </div>\n</div>",
          layer: propertyLayerNYC,
          offset_top: -50
        });
        vis.container.append(tooltip2.render().el);
        map = vis.getNativeMap();
        map.on('zoomend', function(a, b, c) {
          var zoomLevel;
          zoomLevel = map.getZoom();
          if (zoomLevel > 9) {
            propertyLayerNoNYC.hide();
            return propertyLayerNYC.show();
          } else {
            propertyLayerNoNYC.show();
            return propertyLayerNYC.hide();
          }
        });
        rate_to_color = function(rate) {
          rate = parseFloat(rate);
          if (rate <= 0.005) {
            return "color1";
          } else if (rate > 0.005 && rate <= 0.01) {
            return "color2";
          } else if (rate > 0.01 && rate <= 0.015) {
            return "color3";
          } else if (rate > 0.015 && rate <= 0.02) {
            return "color4";
          } else if (rate > 0.02) {
            return "color5";
          }
        };
        return vent.on("tooltip:rendered", function(data, $el) {
          var color;
          $(".tax-rate").text((parseFloat(data["retaxrate"]) * 100).toFixed(2) + "%");
          color = rate_to_color(data["retaxrate"]);
          return $el.find(".property-tax").attr("id", color);
        });
      });
    };

    Workspace.prototype.walkability = function() {
      var id, url;
      id = "walkability";
      url = "http://rpa.cartodb.com/api/v2/viz/e2c8a5ba-ae10-11e3-87a1-0e230854a1cb/viz.json";
      return cartodb.createVis(id, url, {
        searchControl: false,
        layer_selector: false,
        legends: true,
        zoom: 9
      }).done(function(vis, layers) {
        var color1, color2, color3, color4, color5, layer, score_to_color, station_layers, tooltip, walkabilityLayer;
        color1 = "#ffefc9";
        color2 = "#fdde9c";
        color3 = "#80c5d8";
        color4 = "#7791bf";
        color5 = "#743682";
        layer = layers[1];
        layer.setInteraction(true);
        walkabilityLayer = layer.getSubLayer(0);
        station_layers = [
          {
            type: "Train station",
            name_column: "station_na",
            table: "rpa_trainstations"
          }, {
            type: "Subway station",
            name_column: "station_na",
            table: "rpa_subwaystations"
          }
        ];
        _.each(station_layers, function(value, k) {
          var css, dot_color, interactivity, ret, sql, sublayer, table;
          table = value["table"];
          ret = "" + table + ".cartodb_id," + table + ".the_geom, " + table + ".the_geom_webmercator, " + table + "." + value['name_column'];
          sql = "SELECT " + ret + " FROM " + table;
          dot_color = table === "rpa_trainstations" ? "#000000" : "#ba0000";
          css = "#" + table + " {marker-fill: " + dot_color + "; marker-line-width:0;::line {line-width: 1;line-color: " + dot_color + ";}[zoom <= 10] {marker-width: 4;}[zoom > 10] {marker-width: 6;}}";
          if (table === "rpa_subwaystations") {
            css += "#" + table + "[zoom < 10] {marker-opacity: 0;}";
          }
          if (sql && css) {
            interactivity = ["cartodb_id", value['name_column']];
            sublayer = layer.createSubLayer({
              sql: sql,
              cartocss: css,
              interactivity: interactivity
            });
            return value["layer"] = sublayer;
          }
        });
        walkabilityLayer = walkabilityLayer.setInteractivity("cartodb_id, namelsad10, localities, walk_sco_1, walk_sco_2, rail_stops, bank_score, books_scor, coffee_sco, entertainm, grocery_sc, park_score, restaurant, school_sco, shopping_s");
        tooltip = new cdb.geo.ui.Tooltip({
          template: "<div class=\"cartodb-popup\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <div class='walkability-title'>\n          <p><b>{{namelsad10}}</b></p>\n          <p>{{localities}}</p>\n        </div>\n        <p class=\"walk\">Walkability: <b class=\"walkability-score\">{{walk_sco_1}}</b></p>\n        <div class=\"progress walk_sco_1\"><div class=\"progress-bar\" style=\"width:{{walk_sco_1}}%\"></div></div>\n      </div>\n   </div>\n</div>",
          layer: walkabilityLayer,
          offset_top: -50
        });
        vis.container.append(tooltip.render().el);
        score_to_color = {
          "Very Car-Dependent": "#ffefc9",
          "Car-Dependent": "#fdde9c",
          "Somewhat Walkable": "#80c5d8",
          "Very Walkable": "#7791bf",
          "Walker's Paradise": "#743682"
        };
        vent.on("infowindow:rendered", function(data, $el) {
          var color;
          color = score_to_color[data["walk_sco_2"]];
          $el.find(".progress .progress-bar").css("background-color", "#8e8e8e");
          $el.find(".progress.walk_sco_1 .progress-bar").css("background-color", color);
          return $el.find(".walkability-score").each(function() {
            var text;
            text = $(this).text();
            if (!text) {
              return;
            }
            return $(this).text(parseFloat(text).toFixed(2));
          });
        });
        return vent.on("tooltip:rendered", function(data, $el) {
          var color;
          color = score_to_color[data["walk_sco_2"]];
          return $el.find(".progress.walk_sco_1 .progress-bar").css("background-color", color);
        });
      });
    };

    Workspace.prototype.schools = function() {
      return cartodb.createVis('schoolPerf', 'http://rpa.cartodb.com/api/v2/viz/5bc0d9be-a264-11e3-bc17-0e10bcd91c2b/viz.json', {
        searchControl: true,
        layer_selector: false,
        legends: true,
        zoom: 11
      }).done(function(vis, layers) {
        var raceLayer, schoolLayer, tooltip;
        layers[1].setInteraction(true);
        raceLayer = layers[1].getSubLayer(0);
        schoolLayer = layers[1].getSubLayer(1);
        schoolLayer = schoolLayer.setInteractivity("cartodb_id, schlrank, rank_perce, schnam, localname");
        tooltip = new cdb.geo.ui.Tooltip({
          template: "<div class=\"cartodb-popup\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <div class=\"title\"  style=\"padding-bottom:10px\">\n          <h3>{{schnam}}</h3>\n          <span>{{localname}}</span>\n        </div>\n        {{#rank_perce}}\n          <div>School ranking:\n            <span class=\"{{schlrank}}\"><b class=\"school-ranking\">{{rank_perce}}</b> <b> ({{schlrank}}) </b></span>\n          </div>\n        {{/rank_perce}}\n        {{^rank_perce}}\n          <div class=\"{{schlrank}}\">No data available</div>\n        {{/rank_perce}}\n      </div>\n   </div>\n</div>",
          layer: schoolLayer,
          offset_top: -50
        });
        vis.container.append(tooltip.render().el);
        vent.on("tooltip:rendered", function(data) {
          var rank;
          rank = data["rank_perce"];
          if (!rank) {
            return;
          }
          rank = (parseFloat(rank) * 100).toFixed(2);
          return $(".school-ranking").text("" + rank + "%");
        });
        return $("#layer_selector li").on("click", function(e) {
          var $li, activeLi, activeSublayer, borders, color, css, layerName, table;
          $li = $(e.target);
          layerName = $li.data("sublayer");
          if ($li.hasClass("active")) {
            return true;
          }
          activeLi = $li.parent().find(".active");
          activeLi.removeClass("active");
          $li.toggleClass("active");
          activeSublayer = $li.data("sublayer");
          if (activeSublayer === "race") {
            table = "whiteprcnt";
            color = "#be0000";
            borders = [0.1, 0.25, 0.50, 0.75, 1];
          } else {
            table = "hh_median";
            color = "#beb4aa";
            borders = [40125, 57344, 76061, 99075, 250000];
          }
          css = "#schoolrank2012_racepoverty_income_rparegion{\n\n  polygon-fill: " + color + ";\n\n  [ " + table + " <= " + borders[0] + "] {\n     polygon-opacity: 0.2;\n  }\n  [ " + table + " > " + borders[0] + "][ " + table + " <= " + borders[1] + "] {\n     polygon-opacity: 0.4;\n  }\n  [ " + table + " > " + borders[1] + "][ " + table + " <= " + borders[2] + "] {\n     polygon-opacity: 0.6;\n  }\n  [ " + table + " > " + borders[2] + "][ " + table + " <= " + borders[3] + "] {\n     polygon-opacity: 0.8;\n  }\n  [ " + table + " > " + borders[3] + "][ " + table + " <= " + borders[4] + "] {\n     polygon-opacity: 1;\n  }\n}";
          raceLayer.setCartoCSS(css);
          return console.log(css);
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
            type: "Power plant",
            name_column: "plant_name",
            loss_column: "total_cap",
            affected_type: "plants",
            localities: true,
            tables: ["rpa_powerplants_eia_latlong_withlocalities_201"]
          },
          hospitals: {
            flood_column: "flood",
            type: "Hospital",
            name_column: "name",
            loss_column: "total_beds",
            affected_type: "beds",
            localities: true,
            tables: ["rpa_nj_hsip_hospitals_compressed_withlocalitie", "ny_rpa_hospitalsnamesbeds_withlocalities", "rpa_ct_hospitals_names_beds_withlocalities"]
          },
          nursing_homes: {
            flood_column: "flood",
            type: "Nursing home",
            name_column: "name",
            loss_column: "beds",
            affected_type: "beds",
            localities: true,
            tables: ["rpa_ct_nursinghomes_namesaddressesbeds_withloc", "rpa_nj_hsip_nursinghomes_compressed_withlocali", "ny_rpa_nursinghomesnamesbedsflood_withlocaliti"]
          },
          public_housing: {
            flood_column: "flood",
            type: "Public housing",
            name_column: "project_na",
            loss_column: "total_unit",
            affected_type: "units",
            localities: true,
            tables: ["rpa_publichousing_withlocalities_hud2013_short"]
          },
          train_stations: {
            flood_column: "flood",
            type: "Train station",
            name_column: "station_na",
            affected_type: "stations",
            loss_column: false,
            localities: false,
            tables: ["rpa_trainstations"]
          },
          rail_lines: {
            flood_column: "flood",
            type: "Rail line",
            name_column: "line_name",
            affected_type: "units",
            loss_column: false,
            localities: false,
            tables: ["rpa_raillines_flood"]
          },
          subway_stations: {
            flood_column: "flood",
            type: "Subway station",
            name_column: "station_na",
            loss_column: false,
            affected_type: "stations",
            localities: false,
            tables: ["rpa_subwaystations"]
          },
          subway_routes: {
            flood_column: "am",
            type: "Subway route",
            name_column: "route_name",
            loss_column: false,
            affected_type: "routes",
            localities: false,
            tables: ["rpa_subwayroutes_flood"]
          }
        };
        _.each(dbs, function(value, k) {
          var css, interactivity, sql, sublayer;
          sql = _.map(value["tables"], function(table) {
            var ret;
            ret = "" + table + ".cartodb_id," + table + "." + value['flood_column'] + ", " + table + ".the_geom, " + table + ".the_geom_webmercator, " + table + "." + value['name_column'];
            if (value["localities"]) {
              ret = ret + (", " + table + ".localname");
            }
            if (value["loss_column"]) {
              ret = ret + (", " + table + "." + value["loss_column"]);
            }
            return "SELECT " + ret + " FROM " + table;
          });
          sql = sql.join(" UNION ALL ");
          css = _.map(value["tables"], function(table) {
            return "#" + table + " {marker-fill: " + red + ";marker-line-width:0;::line {line-width: 1;line-color: " + red + ";}[" + value['flood_column'] + " < 1]{marker-fill: #575757;}[zoom <= 13] {marker-width: 5;}[zoom > 13] {marker-width: 15;}}";
          });
          css = css.join(" ");
          if (sql && css) {
            interactivity = ["cartodb_id", value['name_column']];
            if (value["loss_column"]) {
              interactivity.push(value['loss_column']);
            }
            if (value['localities']) {
              interactivity.push("localname");
            }
            sublayer = layer.createSubLayer({
              sql: sql,
              cartocss: css,
              interactivity: interactivity
            });
            return value["layer"] = sublayer;
          }
        });
        _.each(dbs, function(value, k) {
          return vis.addOverlay({
            layer: value["layer"],
            type: 'tooltip',
            offset_top: -30,
            template: "<div style=\"background:white;padding:5px 10px;\">\n  <div style=\"margin-bottom:10px\">\n    <h3 class=\"title-case\" style=\"margin:0\">{{ " + value['name_column'] + " }}</h3>\n    {{#localname}}\n      <span>{{localname}}</span>\n    {{/localname}}\n  </div>\n  <div>\n    " + value['type'] + "\n  </div>\n  {{#" + value['loss_column'] + " }}\n    <p>Affected " + value['affected_type'] + ": {{ " + value['loss_column'] + " }}</p>\n  {{/" + value['loss_column'] + " }}\n</div>"
          });
        });
        return $("#layer_selector li").on("click", function(e) {
          var $li, activeLi, activeSublayer, dbs_and_flood_zone, layerName;
          $li = $(e.target);
          layerName = $li.data("sublayer");
          if ($li.hasClass("active")) {
            return true;
          }
          activeLi = $li.parent().find(".active");
          activeLi.removeClass("active");
          $li.toggleClass("active");
          activeSublayer = $li.data("sublayer");
          dbs_and_flood_zone = _.extend(dbs, {
            flood_zone: []
          });
          return _.each(dbs_and_flood_zone, function(value, k) {
            if (activeSublayer === "All") {
              return value["layer"].show();
            } else {
              if (k === "flood_zone") {

              } else {
                if (k === activeSublayer || _.contains(activeSublayer, k)) {
                  return value["layer"].show();
                } else {
                  return value["layer"].hide();
                }
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
      if ($("#standalone_donut").length > 0) {
        makeChart(data, 72140, "#standalone_donut");
      }
      return cartodb.createVis('discretionaryIncome', 'http://rpa.cartodb.com/api/v2/viz/62e94d78-9f1e-11e3-b420-0ed66c7bc7f3/viz.json', {
        legends: true,
        searchControl: true,
        zoom: 8,
        infowindow: true,
        layer_selector: false
      }).done(function(vis, layers) {
        var censusLayer, countyLayer, dataLayers, map, tmpl, tooltip;
        map = vis.getNativeMap();
        map.scrollWheelZoom.disable();
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
          template: "<div class=\"cartodb-popup\" style=\"height:100px !important;overflow:hidden\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <div class=\"title\">\n          <h3 >{{county}}</h3>\n        </div>\n        <div>\n          Discretionary Income: <b class=\"currency\">{{disp_inc}}</b>\n        </div>\n      </div>\n   </div>\n</div>",
          layer: countyLayer,
          offset_top: -30
        });
        vis.container.append(tooltip.render().el);
        censusLayer = censusLayer.setInteractivity("cartodb_id, namelsad10, disp_inc, localname");
        tooltip = new cdb.geo.ui.Tooltip({
          template: "<div class=\"cartodb-popup\" style=\"height:100px !important;overflow:hidden\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <div class=\"title\">\n          <h3>{{namelsad10}}</h3>\n          <small>{{localname}}</small>\n        </div>\n        <div>\n          Discretionary Income: <b class=\"currency\">{{disp_inc}}</b>\n        </div>\n      </div>\n   </div>\n</div>",
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
    var chapter, fci, lastChapter, lci, liIndex, nextChapter, router, sch, _ref;
    router = new Workspace();
    Backbone.history.start({
      pushState: true,
      root: root
    });
    fci = 1;
    lci = 5;
    lastChapter = function(cc) {
      if (cc > fci) {
        return cc - 1;
      } else {
        return lci;
      }
    };
    nextChapter = function(cc) {
      if (cc < lci) {
        return cc + 1;
      } else {
        return fci;
      }
    };
    sch = function(anchor, chapter) {
      return anchor.attr("href", "" + root + "/c/" + chapter + ".html");
    };
    chapter = parseInt((_ref = location.pathname.match(/c\/(.+)\.html/)) != null ? _ref[1] : void 0);
    if (chapter) {
      liIndex = chapter - 1;
      $(".ch-nav li:eq(" + liIndex + ")").addClass("active");
      $(".hero-nav a, .bottom-nav a").each(function() {
        var $a;
        $a = $(this);
        if ($a.hasClass("prev")) {
          sch($a, lastChapter(chapter));
          if (chapter === fci) {
            return $a.remove();
          }
        } else {
          sch($a, nextChapter(chapter));
          if (chapter === lci) {
            return $a.remove();
          }
        }
      });
    }
    return $(".ch-nav li").each(function(i) {
      var $a;
      $a = $(this).find("a");
      return sch($a, i + 1);
    });
  });

}).call(this);
