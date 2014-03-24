(function() {
  var Workspace, formatMoney, shade,
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

  shade = function(color, percent) {
    var B, G, R, f, p, t;
    f = parseInt(color.slice(1), 16);
    t = (percent < 0 ? 0 : 255);
    p = (percent < 0 ? percent * -1 : percent);
    R = f >> 16;
    G = f >> 8 & 0x00FF;
    B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
  };

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
      "carbon.html": "carbon"
    };

    Workspace.prototype.carbon = function() {
      var id, makeStackedChart, url;
      makeStackedChart = function(data, target, showXAxis) {
        var axisPos, bottomMargin, color, d, has2Samples, height, itemHeight, layer, layers, m, margin, n, stack, svg, width, x, xAxis, y, yGroupMax, yStackMax, _i, _ref, _results;
        if (showXAxis == null) {
          showXAxis = true;
        }
        n = 5;
        has2Samples = _.isArray(data[0]);
        m = has2Samples ? 2 : 1;
        stack = d3.layout.stack();
        d = (function() {
          _results = [];
          for (var _i = 0, _ref = n - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this).map(function(i) {
          if (has2Samples) {
            return [0, 1].map(function(j) {
              return {
                x: j,
                y: parseFloat(data[j][i].toFixed(2))
              };
            });
          } else {
            return [
              {
                x: 0,
                y: parseFloat(data[i].toFixed(2))
              }
            ];
          }
        });
        layers = stack(d);
        yGroupMax = d3.max(layers, function(layer) {
          return d3.max(layer, function(d) {
            return d.y;
          });
        });
        yStackMax = d3.max(layers, function(layer) {
          return d3.max(layer, function(d) {
            return d.y0 + d.y;
          });
        });
        bottomMargin = showXAxis ? 40 : 0;
        margin = {
          top: 5,
          right: 5,
          bottom: bottomMargin,
          left: 5
        };
        width = 505 - margin.left - margin.right;
        itemHeight = has2Samples ? 60 : 80;
        height = (itemHeight * m) - margin.top - margin.bottom;
        x = d3.scale.linear().domain([0, yStackMax]).range([0, width]);
        y = d3.scale.ordinal().domain(d3.range(m)).rangeRoundBands([2, height], .08);
        color = function(i) {
          return ["#f9b314", "#eb0000", "#2fb0c4", "#3f4040", "#695b94"][i];
        };
        svg = d3.select(target).append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        layer = svg.selectAll(".layer").data(layers).enter().append("g").attr("class", "layer").style("fill", function(d, i) {
          return color(i);
        });
        layer.selectAll("rect").data(function(d) {
          return d;
        }).enter().append("rect").attr("y", function(d) {
          var base;
          base = y(d.x);
          if (has2Samples) {
            if (d.x === 1) {
              return base + 20;
            } else {
              return base;
            }
          } else {
            return base;
          }
        }).attr("x", function(d) {
          return x(d.y0);
        }).attr("height", y.rangeBand()).attr("width", function(d) {
          return x(d.y);
        });
        layer.selectAll("text").data(function(d) {
          return d;
        }).enter().append("text").text(function(d) {
          return d.y;
        }).attr("font-family", "sans-serif").attr("font-size", "11px").attr("fill", "white").attr("y", function(d, i) {
          var h;
          h = margin.top + (height * (i + 1)) / 2;
          if (has2Samples) {
            if (d.x === 1) {
              return h;
            } else {
              return h - 17;
            }
          } else {
            return h;
          }
        }).attr("x", function(d) {
          return ((d.y0 + (d.y / 2)) / yStackMax * width) - parseInt(String(d.y).split("").length * 3);
        });
        xAxis = d3.svg.axis().scale(x).tickSize(0.8).tickPadding(6).orient("bottom");
        if (showXAxis) {
          axisPos = has2Samples ? height + 20 : height;
          return svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + axisPos + ")").call(xAxis);
        }
      };
      id = "carbon";
      url = "http://rpa.cartodb.com/api/v2/viz/7d0015c0-aed2-11e3-a656-0e73339ffa50/viz.json";
      return cartodb.createVis(id, url, {
        searchControl: false,
        layer_selector: false,
        legends: true,
        zoom: 9
      }).done(function(vis, layers) {
        var adjust_vis, colors, columns, county_cols, layer, layer_county, layer_zip, map, shared_cols, sublayers, tables, zip_cols;
        layer = layers[1];
        layer_county = layers[1].getSubLayer(0);
        layer_zip = layers[1].getSubLayer(1);
        layer.setInteraction(true);
        layer_zip.hide();
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
        adjust_vis = function(show_table, hide_table) {
          return _.each(sublayers, function(value, layer_name) {
            value[show_table].show();
            return value[hide_table].hide();
          });
        };
        adjust_vis(tables[1], tables[0]);
        map = vis.getNativeMap();
        map.on('zoomend', function(a, b, c) {
          var hide_table, show_table, zoomLevel;
          $(".cartodb-tooltip").hide();
          zoomLevel = map.getZoom();
          if (zoomLevel > 9) {
            hide_table = tables[1];
            show_table = tables[0];
            layer_county.hide();
            layer_zip.show();
          } else {
            hide_table = tables[0];
            show_table = tables[1];
            layer_county.show();
            layer_zip.hide();
          }
          return adjust_vis(show_table, hide_table);
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
          var $li, activeLi, activeSublayers, layerName;
          $li = $(e.target);
          layerName = $li.data("sublayer");
          $li.toggleClass("active");
          activeLi = $li.parent().find(".active");
          activeSublayers = activeLi.map(function(i, item) {
            return $(item).data("sublayer");
          });
          return _.each(layers, function(value, k) {});
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
        var color1, color2, color3, map, propertyLayerNYC, propertyLayerNoNYC, tooltip, tooltip2;
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
          template: "<div class=\"cartodb-popup\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <p>{{namelsad10}}</p>\n        <p>{{localname}}</p>\n        <p>{{retaxrate}}</p>\n        <p>{{retax_acs}}</p>\n        <p>{{med_val}}</p>\n      </div>\n   </div>\n</div>",
          layer: propertyLayerNoNYC,
          offset_top: -50
        });
        vis.container.append(tooltip.render().el);
        tooltip2 = new cdb.geo.ui.Tooltip({
          template: "<div class=\"cartodb-popup\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <p>{{namelsad10}}</p>\n        <p>{{localname}}</p>\n        <p>{{retaxrate}}</p>\n        <p>{{retax_acs}}</p>\n        <p>{{med_val}}</p>\n      </div>\n   </div>\n</div>",
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
        return vent.on("tooltip:rendered", function(data) {});
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
        var color1, color2, color3, color4, color5, tooltip, walkabilityLayer;
        color1 = "#ffefc9";
        color2 = "#fdde9c";
        color3 = "#80c5d8";
        color4 = "#7791bf";
        color5 = "#743682";
        layers[1].setInteraction(true);
        walkabilityLayer = layers[1].getSubLayer(0);
        walkabilityLayer = walkabilityLayer.setInteractivity("cartodb_id, namelsad10, localities, walk_sco_1, walk_sco_2, rail_stops, bank_score, books_scor, coffee_sco, entertainm, grocery_sc, park_score, restaurant, school_sco, shopping_s");
        tooltip = new cdb.geo.ui.Tooltip({
          template: "<div class=\"cartodb-popup\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <p>{{namelsad10}}</p>\n        <p>{{localities}}</p>\n        <p>{{walk_sco_1}}</p>\n        <p>{{walk_sco_2}}</p>\n        <p>{{rail_stops}}</p>\n        <p>{{bank_score}}</p>\n        <p>{{books_scor}}</p>\n        <p>{{coffee_sco}}</p>\n        <p>{{enternatinm}}</p>\n        <p>{{grocery_sc}}</p>\n        <p>{{park_score}}</p>\n        <p>{{restaurant}}</p>\n        <p>{{school sco}}</p>\n        <p>{{shopping_s}}</p>\n      </div>\n   </div>\n</div>",
          layer: walkabilityLayer,
          offset_top: -50
        });
        vis.container.append(tooltip.render().el);
        return vent.on("tooltip:rendered", function(data) {});
      });
    };

    Workspace.prototype.schools = function() {
      return cartodb.createVis('schoolPerf', 'http://rpa.cartodb.com/api/v2/viz/5bc0d9be-a264-11e3-bc17-0e10bcd91c2b/viz.json', {
        searchControl: true,
        layer_selector: false,
        legends: true,
        zoom: 11
      }).done(function(vis, layers) {
        var schoolLayer, tooltip;
        layers[1].setInteraction(true);
        schoolLayer = layers[1].getSubLayer(1);
        console.log(schoolLayer);
        schoolLayer = schoolLayer.setInteractivity("cartodb_id, schlrank, rank_perce, schnam, localname");
        tooltip = new cdb.geo.ui.Tooltip({
          template: "<div class=\"cartodb-popup\">\n   <div class=\"cartodb-popup-content-wrapper\">\n      <div class=\"cartodb-popup-content\">\n        <div class=\"title\"  style=\"padding-bottom:10px\">\n          <h3>{{schnam}}</h3>\n          <span>{{localname}}</span>\n        </div>\n\n        {{#rank_perce}}\n          <div>School ranking:\n            <span class=\"{{schlrank}}\"><b class=\"school-ranking\">{{rank_perce}}</b> <b> ({{schlrank}}) </b></span>\n          </div>\n        {{/rank_perce}}\n        {{^rank_perce}}\n          <div class=\"{{schlrank}}\">No data available</div>\n        {{/rank_perce}}\n      </div>\n   </div>\n</div>",
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
    var router;
    router = new Workspace();
    return Backbone.history.start({
      pushState: true,
      root: root
    });
  });

}).call(this);
