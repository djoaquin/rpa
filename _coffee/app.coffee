formatMoney = ->
  $(".currency").each(()->
      c = $(this).text()
      # Do not proceed if it's already been formatted
      return true if c[0] is "$"
      c = accounting.formatMoney(Number(c), precision:0)
      $(this).text(c)
    )

class Workspace extends Backbone.Router
  routes:
    "schools.html" : "schools"
    "vulnerable.html" : "vulnerable"
    "discretionary.html" : "discretionary"
  schools: ->
    cartodb
      .createVis('schoolPerf', 'http://rpa.cartodb.com/api/v2/viz/5bc0d9be-a264-11e3-bc17-0e10bcd91c2b/viz.json', searchControl: true, layer_selector: false, legends: true, zoom:11)
      .done (vis,layers)->

        # Create the sublayer for subway routes
        layers[1].setInteraction(true)
        schoolLayer = layers[1].getSubLayer(1)

        schoolLayer = schoolLayer.setInteractivity("cartodb_id, schlrank, rank_perce, schnam")


        tooltip = new cdb.geo.ui.Tooltip(
            template: """
              <div class="cartodb-popup">
                 <div class="cartodb-popup-content-wrapper">
                    <div class="cartodb-popup-content">
                      <h2 class="title">{{schnam}}</h2>
                      {{#rank_perce}}
                        <p>School ranking</p>
                        <p class="{{schlrank}}"><b class="school-ranking">{{rank_perce}}</b> <b> ({{schlrank}}) </b></p>
                      {{/rank_perce}}
                      {{^rank_perce}}
                        <p class="{{schlrank}}">No data available</p>
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
            name_column: "plant_name"
            loss_column: "total_cap"
            affected_type: "plants"
            tables: ["rpa_powerplants_eia_latlong_2013"]
          }
          hospitals: {
            flood_column: "flood"
            name_column: "name"
            loss_column: "total_beds"
            affected_type: "beds"
            tables: [
              "rpa_nj_hsip_hospitals_compressed"
              "ny_rpa_hospitalsnamesbeds_compressed"
              "rpa_ct_hospitals_names_beds"
            ]
          }
          nursing_homes:{
            flood_column: "flood"
            name_column: "name"
            loss_column: "beds"
            affected_type: "beds"
            tables: [
              "rpa_ct_nursinghomes_namesaddressesbeds"
              "rpa_nj_hsip_nursinghomes_compressed"
              "ny_rpa_nursinghomesnamesbedsflood"
            ]
          }
          # public_housing: {
          #   name_column: "project_na"
          #   loss_column: "total_unit"
          #   tables: [
          #     "rpa_publichousing_hud2013_wgs1984"
          #   ]
          # }
          train_stations: {
            flood_column: "flood"
            name_column: "station_na"
            affected_type: "stations"
            loss_column: "cartodb_id"  #TODO: replace with the real column
            tables: ["rpa_trainstations"]
          }
          rail_lines: {
            flood_column: "flood"
            name_column: "line_name"
            affected_type: "units"
            loss_column: "cartodb_id"  #TODO: replace with the real column
            tables: ["rpa_raillines_flood"]
          }
          subway_stations: {
            flood_column: "flood"
            name_column: "station_na"
            loss_column: "cartodb_id"  #TODO: replace with the real column
            affected_type: "stations"
            tables: [
              "rpa_subwaystations"
            ]
          }
          subway_routes: {
            flood_column: "am"  #TODO: replace with the real column
            name_column: "route_name"
            loss_column: "cartodb_id"  #TODO: replace with the real column
            affected_type: "routes"
            tables: [
              "rpa_subwayroutes_flood"
            ]
          }
        }

        # Describe and define the sublayers
        _.each(dbs,(value,k)->
          # Take a union of all the tables
          sql = _.map(value["tables"], (table)-> "SELECT #{table}.cartodb_id,#{table}.#{value['flood_column']}, #{table}.the_geom, #{table}.the_geom_webmercator, #{table}.#{value['name_column']}  FROM #{table}")
          sql = sql.join(" UNION ALL ")

          # Create the CSS
          css = _.map(value["tables"], (table)->
              """
                ##{table} {marker-fill: #{red};marker-line-width:0;::line {line-width: 1;line-color: #{red};}[#{value['flood_column']} < 1]{marker-fill: #575757;}[zoom <= 13] {marker-width: 5;}[zoom > 13] {marker-width: 15;}}
              """
            )
          css = css.join(" ")

          if sql and css
            sublayer = layer.createSubLayer(
              sql: sql,
              cartocss: css
              interactivity: ["cartodb_id", value['name_column']]
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
                <h3 style="margin-top:0" class="title-case">{{ #{value['name_column']} }}</h3>
                <p>Affected #{value['affected_type']}: {{ #{value['loss_column']} }}</p>
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
                      <h3 class="title">{{county}}</h3>
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

  new Workspace()
  Backbone.history.start(pushState: true, root: root)

