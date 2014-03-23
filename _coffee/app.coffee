formatMoney = ->
  $(".currency").each(()->
      c = $(this).text()
      # Do not proceed if it's already been formatted
      return true if c[0] is "$"
      c = accounting.formatMoney(Number(c), precision:0)
      $(this).text(c)
    )
shade = (color, percent) ->
  f = parseInt(color.slice(1), 16)
  t = (if percent < 0 then 0 else 255)
  p = (if percent < 0 then percent * -1 else percent)
  R = f >> 16
  G = f >> 8 & 0x00FF
  B = f & 0x0000FF
  "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1)

class Workspace extends Backbone.Router
  routes:
    "schools.html" : "schools"
    "vulnerable.html" : "vulnerable"
    "discretionary.html" : "discretionary"
    "walkability.html" : "walkability"
    "property.html" : "property"
    "carbon.html" : "carbon"

  carbon: ->
    makeStackedChart = (data,target, showXAxis=true)->

      n = data.length  # number of layers
      m = 1

      stack = d3.layout.stack()
      # Transorm data, an object literal, into an array that can be fed into the function below
      d = [0..n-1]
      d = d.map((i)->
                  [0..m-1].map((j)->
                    {x: j, y: parseFloat(data[i].toFixed(2))}
                  )
               )
      layers = stack(d)


      #the largest single layer
      yGroupMax = d3.max(layers, (layer)-> d3.max(layer, (d)-> d.y ) )
      #the largest stack
      yStackMax = d3.max(layers, (layer)-> d3.max(layer, (d)-> d.y0 + d.y ) )

      bottomMargin = if showXAxis then 40 else 0
      margin  = {top: 5, right: 5, bottom: bottomMargin, left: 5}
      width   = 505 - margin.left - margin.right
      itemHeight = if showXAxis then 80 else 40
      height  = itemHeight - margin.top - margin.bottom

      x = d3.scale.linear()
          .domain([0, yStackMax])
          .range([0, width])
      y = d3.scale.ordinal()
          .domain(d3.range(m))
          .rangeRoundBands([2, height], .08)
      color = (i)->
        [
          "#f9b314"
          "#eb0000"
          "#2fb0c4"
          "#3f4040"
          "#695b94"][i]
      svg = d3.select(target).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      layer = svg.selectAll(".layer")
          .data(layers)
          .enter()
            .append("g")
            .attr("class", "layer")
            .style("fill", (d, i)-> color(i) )
      layer.selectAll("rect")
          .data((d)-> d)
          .enter().append("rect")
          .attr("y", (d)-> y(d.x))
        .attr("x", (d)-> x(d.y0))
          .attr("height", y.rangeBand())
          .attr("width", (d)-> x(d.y))
      layer.selectAll("text")
        .data((d)-> d)
        .enter()
        .append("text")
        .text((d)-> d.y )
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        .attr("fill", "white")
        .attr("y", (d, i)->
            (height/2) + 5
          )
        .attr("x", (d)-> ((d.y0 + (d.y/2))/yStackMax * width) - parseInt(String(d.y).split("").length * 3))
      xAxis = d3.svg.axis()
          .scale(x)
          .tickSize(0.8)
          .tickPadding(6)
          .orient("bottom")
      if showXAxis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)


    # makeStackedChart({a: 5, b: 55, c: 65}, ".content")


    id = "carbon"
    url = "http://rpa.cartodb.com/api/v2/viz/7d0015c0-aed2-11e3-a656-0e73339ffa50/viz.json"
    cartodb
      .createVis(id, url, searchControl: false, layer_selector: false, legends: true, zoom:9)
      .done (vis,layers)->
        layer = layers[1]
        layer_county = layers[1].getSubLayer(0)
        layer_zip = layers[1].getSubLayer(1)
        layer.setInteraction(true)
        layer_zip.hide()

        colors =
          transport: "#f9b314"
          housing: "#eb0000"
          food: "#2fb0c4"
          goods: "#3f4040"
          services: "#695b94"
          total: "#008000" #TEMPORARY


        shared_cols = "food,goods,services,total,transport,housing"
        county_cols = "county_n,#{shared_cols}"
        zip_cols = "#{shared_cols},po_name,zip"
        columns = (table)-> if table is "rpa_carbonfootprint" then zip_cols else county_cols

        # Describe and define the sublayers
        tables = ["rpa_carbonfootprint","rpa_carbonfootprint_county"]
        sublayers = {}

        _.each(tables,(table,k)->
          others = ", " + columns(table)
          sql = "SELECT #{table}.cartodb_id, #{table}.the_geom, #{table}.the_geom_webmercator #{others} FROM #{table}"

          # Create the CSS
          _.each(colors, (hex, column)->
              css = """
                      ##{table} [#{column} > 60] {
                        //Darkest
                        polygon-fill: #{hex};
                      }
                      ##{table} [#{column} > 40][#{column} < 60] {
                        //Lighter
                        polygon-fill: #{shade(hex,-0.1)};
                      }
                      ##{table} [#{column} < 40] {
                        //Lightest
                        polygon-fill: #{shade(hex,-0.2)};
                      }
                    """
              interactivity = ["cartodb_id"]
              interactivity = interactivity.concat(columns(table).split(","))
              sublayer = layer.createSubLayer(
                sql: sql,
                cartocss: css
                interactivity: interactivity
              )
              tlayers = sublayers[column]
              t = {}
              t[table] = sublayer
              if tlayers
                sublayers[column] = _.extend(tlayers, t)
              else
                sublayers[column] = t
            )
        )

        # Create a tooltip for every single sublayer
        _.each(sublayers,(value,layer_name)->
          _.each(tables, (table)->
            vis.addOverlay(
              layer: value[table]
              type: 'tooltip'
              offset_top: -30
              template: """
                <h3 class="title-case">
                  Avg. Household Carbon Emissions (MTCO2E)
                </h3>
                {{#county_n}}
                  <b>County: <span>{{county_n}}</span></b>
                {{/county_n}}
                {{#zip}}
                  <b>Zip Code: <span>{{zip}}</span></b>
                {{/zip}}
                <div class="progressive">

                </div>
                <div class="tooltip-legend clearfix">
                  <div class="food">Food</div>
                  <div class="goods">Goods</div>
                  <div class="services">Services</div>
                  <div class="transport">Transport</div>
                  <div class="housing">Housing</div>
                </div>
              """
            )
          )
        )
        adjust_vis = (show_table, hide_table)->
          # loop through sublayer and show/hide layers
          _.each(sublayers, (value, layer_name)->
              value[show_table].show()
              value[hide_table].hide()
            )
        # By default, hide the zip layer, and show the county layer
        adjust_vis(tables[1], tables[0])

        map = vis.getNativeMap()
        map.on 'zoomend', (a,b,c)->
          $(".cartodb-tooltip").hide()
          zoomLevel = map.getZoom()
          # TODO: check to ensure that this conditional is only executed during a state transition
          if zoomLevel > 9
            # hide the county layer
            # show the zip layer
            hide_table = tables[1]
            show_table = tables[0]
            layer_county.hide()
            layer_zip.show()
          else
            # show the county layer
            # hide the zip layer
            hide_table = tables[0]
            show_table = tables[1]
            layer_county.show()
            layer_zip.hide()

          adjust_vis(show_table, hide_table)

        vent.on("tooltip:rendered", (d,$el)->
            data = [d["transport"],d["housing"],d["food"],d["goods"],d["services"]]
            makeStackedChart(data, $el.find(".progressive").get(0))
          )
        vent.on "infowindow:rendered", (d, $el)->
          return if d["null"] is "Loading content..."
          # d = _.filter(data,(v,k)-> _.isNumber(v))
          data = [d["transport"],d["housing"],d["food"],d["goods"],d["services"]]
          region = [12.7, 11.7, 8.0, 6.0, 6.8]
          makeStackedChart(data, $el.find(".progressive").get(0), false)
          makeStackedChart(region, $el.find(".progressive-region").get(0), true)


  property: ->
    id = "property"
    url = "http://rpa.cartodb.com/api/v2/viz/f368bbb4-aebd-11e3-a057-0e10bcd91c2b/viz.json"
    cartodb
      .createVis(id, url, searchControl: false, layer_selector: false, legends: true, zoom:9)
      .done (vis,layers)->
        color1 = "#ffefc9"
        color2 = "#fdde9c"
        color3 = "#80c5d8"
        # Create the sublayer for subway routes
        layers[1].setInteraction(true)
        propertyLayerNoNYC = layers[1].getSubLayer(0)
        propertyLayerNYC = layers[1].getSubLayer(1)

        propertyLayerNoNYC = propertyLayerNoNYC.setInteractivity("namelsad10, localname, retaxrate, retax_acs, med_val")
        propertyLayerNYC = propertyLayerNYC.setInteractivity("namelsad10, localname, retaxrate, retax_acs, med_val")

        # Start with NYC layer well hidden
        propertyLayerNYC.hide()

        tooltip = new cdb.geo.ui.Tooltip(
            template: """
              <div class="cartodb-popup">
                 <div class="cartodb-popup-content-wrapper">
                    <div class="cartodb-popup-content">
                      <p>{{namelsad10}}</p>
                      <p>{{localname}}</p>
                      <p>{{retaxrate}}</p>
                      <p>{{retax_acs}}</p>
                      <p>{{med_val}}</p>
                    </div>
                 </div>
              </div>
            """
            layer: propertyLayerNoNYC
            offset_top: -50
        )
        vis.container.append(tooltip.render().el)

        tooltip2 = new cdb.geo.ui.Tooltip(
            template: """
              <div class="cartodb-popup">
                 <div class="cartodb-popup-content-wrapper">
                    <div class="cartodb-popup-content">
                      <p>{{namelsad10}}</p>
                      <p>{{localname}}</p>
                      <p>{{retaxrate}}</p>
                      <p>{{retax_acs}}</p>
                      <p>{{med_val}}</p>
                    </div>
                 </div>
              </div>
            """
            layer: propertyLayerNYC
            offset_top: -50
        )
        vis.container.append(tooltip2.render().el)


        map = vis.getNativeMap()
        map.on 'zoomend', (a,b,c)->
          zoomLevel = map.getZoom()
          if zoomLevel > 9
            propertyLayerNoNYC.hide()
            propertyLayerNYC.show()
          else
            propertyLayerNoNYC.show()
            propertyLayerNYC.hide()


        vent.on("tooltip:rendered", (data)->
            # console.log "Do stuff", data
          )

  walkability: ->
    id = "walkability"
    url = "http://rpa.cartodb.com/api/v2/viz/e2c8a5ba-ae10-11e3-87a1-0e230854a1cb/viz.json"
    cartodb
      .createVis(id, url, searchControl: false, layer_selector: false, legends: true, zoom:9)
      .done (vis,layers)->
        color1 = "#ffefc9"
        color2 = "#fdde9c"
        color3 = "#80c5d8"
        color4 = "#7791bf"
        color5 = "#743682"

        # TODO: how can we interpret the walkability score? (Walk_Sco_1)

        # Create the sublayer for subway routes
        layers[1].setInteraction(true)
        walkabilityLayer = layers[1].getSubLayer(0)

        walkabilityLayer = walkabilityLayer.setInteractivity("cartodb_id, namelsad10, localities, walk_sco_1, walk_sco_2, rail_stops, bank_score, books_scor, coffee_sco, entertainm, grocery_sc, park_score, restaurant, school_sco, shopping_s")


        tooltip = new cdb.geo.ui.Tooltip(
            template: """
              <div class="cartodb-popup">
                 <div class="cartodb-popup-content-wrapper">
                    <div class="cartodb-popup-content">
                      <p>{{namelsad10}}</p>
                      <p>{{localities}}</p>
                      <p>{{walk_sco_1}}</p>
                      <p>{{walk_sco_2}}</p>
                      <p>{{rail_stops}}</p>
                      <p>{{bank_score}}</p>
                      <p>{{books_scor}}</p>
                      <p>{{coffee_sco}}</p>
                      <p>{{enternatinm}}</p>
                      <p>{{grocery_sc}}</p>
                      <p>{{park_score}}</p>
                      <p>{{restaurant}}</p>
                      <p>{{school sco}}</p>
                      <p>{{shopping_s}}</p>
                    </div>
                 </div>
              </div>
            """
            layer: walkabilityLayer
            offset_top: -50
        )
        vis.container.append(tooltip.render().el)

        vent.on("tooltip:rendered", (data)->
            # console.log "Do stuff", data
          )
  schools: ->
    cartodb
      .createVis('schoolPerf', 'http://rpa.cartodb.com/api/v2/viz/5bc0d9be-a264-11e3-bc17-0e10bcd91c2b/viz.json', searchControl: true, layer_selector: false, legends: true, zoom:11)
      .done (vis,layers)->

        # Create the sublayer for subway routes
        layers[1].setInteraction(true)
        schoolLayer = layers[1].getSubLayer(1)
        console.log schoolLayer
        schoolLayer = schoolLayer.setInteractivity("cartodb_id, schlrank, rank_perce, schnam, localname")

        tooltip = new cdb.geo.ui.Tooltip(
            template: """
              <div class="cartodb-popup">
                 <div class="cartodb-popup-content-wrapper">
                    <div class="cartodb-popup-content">
                      <div class="title"  style="padding-bottom:10px">
                        <h3>{{schnam}}</h3>
                        <span>{{localname}}</span>
                      </div>

                      {{#rank_perce}}
                        <div>School ranking:
                          <span class="{{schlrank}}"><b class="school-ranking">{{rank_perce}}</b> <b> ({{schlrank}}) </b></span>
                        </div>
                      {{/rank_perce}}
                      {{^rank_perce}}
                        <div class="{{schlrank}}">No data available</div>
                      {{/rank_perce}}
                    </div>
                 </div>
              </div>
            """
            layer: schoolLayer
            offset_top: -50
        )
        vis.container.append(tooltip.render().el)

        vent.on("tooltip:rendered", (data)->
            rank = data["rank_perce"]
            return unless rank
            rank = (parseFloat(rank) * 100).toFixed(2)
            $(".school-ranking").text("#{rank}%")
          )



  vulnerable: ->
    cartodb
      .createVis('vulnerableInfra', 'http://rpa.cartodb.com/api/v2/viz/533c5970-9f4f-11e3-ad24-0ed66c7bc7f3/viz.json', zoom: 9, searchControl: true, layer_selector: false, legends: false)
      .done (vis,layers)->

        map = vis.getNativeMap()

        layer = layers[1]
        floodZoneLayer = layer.getSubLayer(0)
        layer.setInteraction(true)




        # Declare the database tables backing the layers
        red = "#ba0000"
        dbs = {
          power_plants: {
            flood_column: "flood"
            type: "Power plant"
            name_column: "plant_name"
            loss_column: "total_cap"
            affected_type: "plants"
            localities: true
            tables: ["rpa_powerplants_eia_latlong_withlocalities_201"]
          }
          hospitals: {
            flood_column: "flood"
            type: "Hospital"
            name_column: "name"
            loss_column: "total_beds"
            affected_type: "beds"
            localities: true
            tables: [
              "rpa_nj_hsip_hospitals_compressed_withlocalitie"
              "ny_rpa_hospitalsnamesbeds_withlocalities"
              "rpa_ct_hospitals_names_beds_withlocalities"
            ]
          }
          nursing_homes:{
            flood_column: "flood"
            type: "Nursing home"
            name_column: "name"
            loss_column: "beds"
            affected_type: "beds"
            localities: true
            tables: [
              "rpa_ct_nursinghomes_namesaddressesbeds_withloc"
              "rpa_nj_hsip_nursinghomes_compressed_withlocali"
              "ny_rpa_nursinghomesnamesbedsflood_withlocaliti"
            ]
          }
          public_housing: {
            flood_column: "flood"
            type: "Public housing"
            name_column: "project_na"
            loss_column: "total_unit"
            affected_type: "units"
            localities: true
            tables: [
              "rpa_publichousing_withlocalities_hud2013_short"
            ]
          }
          train_stations: {
            flood_column: "flood"
            type: "Train station"
            name_column: "station_na"
            affected_type: "stations"
            loss_column: false
            localities: false
            tables: [
              "rpa_trainstations"
            ]
          }
          rail_lines: {
            flood_column: "flood"
            type: "Rail line"
            name_column: "line_name"
            affected_type: "units"
            loss_column: false
            localities: false
            tables: ["rpa_raillines_flood"]
          }
          subway_stations: {
            flood_column: "flood"
            type: "Subway station"
            name_column: "station_na"
            loss_column: false
            affected_type: "stations"
            localities: false
            tables: [
              "rpa_subwaystations"
            ]
          }
          subway_routes: {
            flood_column: "am"  #TODO: replace with the real column
            type: "Subway route"
            name_column: "route_name"
            loss_column: false
            affected_type: "routes"
            localities: false
            tables: [
              "rpa_subwayroutes_flood"
            ]
          }
        }

        # Describe and define the sublayers
        _.each(dbs,(value,k)->
          # Take a union of all the tables
          sql = _.map(value["tables"], (table)->
              ret = "#{table}.cartodb_id,#{table}.#{value['flood_column']}, #{table}.the_geom, #{table}.the_geom_webmercator, #{table}.#{value['name_column']}"
              ret = ret + ", #{table}.localname" if value["localities"]
              ret = ret + ", #{table}.#{value["loss_column"]}" if value["loss_column"]
              "SELECT #{ret} FROM #{table}"
            )
          sql = sql.join(" UNION ALL ")

          # Create the CSS
          css = _.map(value["tables"], (table)->
              """
                ##{table} {marker-fill: #{red};marker-line-width:0;::line {line-width: 1;line-color: #{red};}[#{value['flood_column']} < 1]{marker-fill: #575757;}[zoom <= 13] {marker-width: 5;}[zoom > 13] {marker-width: 15;}}
              """
            )
          css = css.join(" ")

          if sql and css
            interactivity = ["cartodb_id", value['name_column']]
            if value["loss_column"]
              interactivity.push(value['loss_column'])
            if value['localities']
              interactivity.push("localname")
            sublayer = layer.createSubLayer(
              sql: sql,
              cartocss: css
              interactivity: interactivity
            )
            value["layer"] = sublayer
        )

        # Create a tooltip for every single sublayer
        _.each(dbs,(value,k)->
          vis.addOverlay(
            layer: value["layer"]
            type: 'tooltip'
            offset_top: -30
            template: """
              <div style="background:white;padding:5px 10px;">
                <div style="margin-bottom:10px">
                  <h3 class="title-case" style="margin:0">{{ #{value['name_column']} }}</h3>
                  {{#localname}}
                    <span>{{localname}}</span>
                  {{/localname}}
                </div>
                <div>
                  #{value['type']}
                </div>
                {{##{value['loss_column']} }}
                  <p>Affected #{value['affected_type']}: {{ #{value['loss_column']} }}</p>
                {{/#{value['loss_column']} }}
              </div>
            """
          )
        )

        # TODO: create a handler for the layer_selector. Toggle the visibility of the clicked layer.

        $("#layer_selector li").on "click", (e)->
          $li = $(e.target)
          layerName = $li.data("sublayer")

          # Toggle the active class
          $li.toggleClass("active")

          activeLi =  $li.parent().find(".active")
          activeSublayers = activeLi.map((i,item)-> $(item).data("sublayer"))

          # Show the last active layer
          dbs_and_flood_zone = _.extend(dbs,{flood_zone: []})
          _.each(dbs_and_flood_zone, (value,k)->
            if k in activeSublayers
              if k is "flood_zone"
                floodZoneLayer.show()
              else
                value["layer"].show()
            else
              if k is "flood_zone"
                floodZoneLayer.hide()
              else
                value["layer"].hide()

          )



  discretionary: ->

    makeChart = (data, mhi, id="#donut")->
      blue       =  "#47b3d2";  # disp_income
      reddish    =  "#f12b15";  # trans
      brown      =  "#b92b15";  # housing
      dark_brown =  "#7c2b15";  # taxes

      chartData = [
        {value : data["disp_inc"], color : blue }
        {value : data["trans"],    color : reddish}
        {value : data["housing"],  color : brown}
        {value : data["taxes"],    color : dark_brown}
      ]

      ctx = $(id).get(0).getContext("2d");
      donut_options =
        percentageInnerCutout: 70
        animationEasing : "easeOutQuart"
        animationSteps : 30
      options =
        tooltips:
          background: "#000"
          labelTemplate: "<%= (value / #{mhi} * 100 ).toFixed(2) %>%"
      new Chart(ctx,options).Doughnut(chartData,donut_options)

    data =
      disp_inc: 29817
      trans: 10519
      housing: 21460
      taxes: 10344

    # $ ->
    makeChart(data, 72140, "#standalone_donut")

    # DISCRETIONARY INCOME
    cartodb
      .createVis('discretionaryIncome', 'http://rpa.cartodb.com/api/v2/viz/62e94d78-9f1e-11e3-b420-0ed66c7bc7f3/viz.json', legends: true, searchControl: true, zoom: 8, infowindow: true, layer_selector: false)
      .done (vis,layers)->
        map = vis.getNativeMap()

        dataLayers = layers[1]
        dataLayers.setInteraction(true)


        countyLayer = dataLayers.getSubLayer(0)
        censusLayer = dataLayers.getSubLayer(1)


        censusLayer.hide()
        map.on('zoomend', (a,b,c)->
          zoomLevel = map.getZoom()
          if zoomLevel > 10
            censusLayer.show()
            countyLayer.hide()
            # TODO: update the zoom legend
            $(".please_zoom_in").text("Zoom out to see county level data.")
          else
            censusLayer.hide()
            countyLayer.show()
            $(".please_zoom_in").text("Zoom in to the map to see neighborhood level data.")
        )


        # Customize the infowindows
        tmpl= (type,type_name,mhi,disp_inc,trans,housing,taxes)-> _.template("""
            <div class="cartodb-popup">
              <a href="#close" class="cartodb-popup-close-button close">x</a>
               <div class="cartodb-popup-content-wrapper">
                 <div class="cartodb-popup-content" data-disp_inc="<%=content.data.#{disp_inc}%>" data-trans="<%=content.data.#{trans}%>" data-housing="<%=content.data.#{housing}%>" data-taxes="<%=content.data.#{taxes}%>">
                  <div class="title">
                    <h2>
                      <%=content.data.#{type_name}%>
                    </h2>
                    <% if("#{type}"=="Census Tract"){ %>
                      <p><%=content.data.localname  %></p>
                    <% } %>
                  </div>

                  <div class="leftColumn">
                    <b>Income Components</b>
                    <div class="discretionary">
                      <div>Discretionary Income</div>
                      <b class="currency"><%=content.data.#{disp_inc}%></b>
                    </div>

                    <div class="trans">
                      <div>Transportation</div>
                      <b class="currency"><%=content.data.#{trans}%></b>
                    </div>

                    <div class="housing">
                      <div>Housing and other related costs</div>
                      <b class="currency"><%=content.data.#{housing}%></b>
                    </div>

                    <div class="taxes">
                      <div>State and local personal income tax</div>
                      <b class="currency"><%=content.data.#{taxes}%></b>
                    </div>
                  </div>

                  <div class="rightColumn">
                    <div class="mhi text-center">
                      <div>Median <br/> Income</div>
                      <b class="median-income currency"><%=Math.round(Number(content.data.#{mhi}))%></b>
                    </div>

                    <canvas id="donut" width="130" height="130"></canvas>

                  </div>
                 </div>
               </div>
            </div>
          """)

        censusLayer.infowindow.set('template', tmpl("Census Tract", "namelsad10", "mhi", "disp_inc", "avg_transc", "housingcos", "avg_ttl"))
        countyLayer.infowindow.set('template', tmpl("County", "county", "avg_mhi", "disp_inc", "avg_trans", "avg_hous", "avg_ttl"))


        countyLayer = countyLayer.setInteractivity("cartodb_id, county, disp_inc")
        tooltip = new cdb.geo.ui.Tooltip(
            template: """
              <div class="cartodb-popup" style="height:100px !important;overflow:hidden">
                 <div class="cartodb-popup-content-wrapper">
                    <div class="cartodb-popup-content">
                      <div class="title">
                        <h3 >{{county}}</h3>
                      </div>
                      <div>
                        Discretionary Income: <b class="currency">{{disp_inc}}</b>
                      </div>
                    </div>
                 </div>
              </div>
            """
            layer: countyLayer
            offset_top: -30
        )
        vis.container.append(tooltip.render().el)

        censusLayer = censusLayer.setInteractivity("cartodb_id, namelsad10, disp_inc, localname")
        tooltip = new cdb.geo.ui.Tooltip(
            template: """
              <div class="cartodb-popup" style="height:100px !important;overflow:hidden">
                 <div class="cartodb-popup-content-wrapper">
                    <div class="cartodb-popup-content">
                      <div class="title">
                        <h3>{{namelsad10}}</h3>
                        <small>{{localname}}</small>
                      </div>
                      <div>
                        Discretionary Income: <b class="currency">{{disp_inc}}</b>
                      </div>
                    </div>
                 </div>
              </div>
            """
            layer: censusLayer
            offset_top: -30
        )
        vis.container.append(tooltip.render().el)

        vent.on("tooltip:rendered", ->
            formatMoney()
          )


        # HACK: the code below requires a feature added to a customized version of the cartodb.js liburary
        vent.on "infowindow:rendered", (obj)->
          return if obj["null"] is "Loading content..."
          # Create a bar chart in the infowindow for the clicked feature
          data = $(".cartodb-popup-content").data()
          mhi = $("#discretionaryIncome .median-income").text()
          makeChart(data, Number(mhi))
          formatMoney()


$ ->

  router = new Workspace()
  Backbone.history.start(pushState: true, root: root)
