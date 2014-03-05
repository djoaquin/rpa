class Workspace extends Backbone.Router
  routes:
    "schools.html" : "schools"
    "vulnerable.html" : "vulnerable"
    "discretionary.html" : "discretionary"
  schools: ->
    cartodb
      .createVis('schoolPerf', 'http://rpa.cartodb.com/api/v2/viz/5bc0d9be-a264-11e3-bc17-0e10bcd91c2b/viz.json', searchControl: true, layer_selector: false, legends: true)
      .done (vis,layers)->

        # Create the sublayer for subway routes
        layer = layers[1]
        layer.setInteraction(true)

        # FIXME: how can I access the sublayers correctly?
        # poverty_layer = layer.getSubLayer(0)
        # schools_layer = layer.getSubLayer(1)

        # • Create a tooltip on hover with these values:
        #   - county or census track name
        #   - disposable income

        # vis.addOverlay(
        #   type: 'tooltip'
        #   template: """
        #     <div style="background:white;padding:5px 10px;">
        #       <h3 style="margin-top:0">{{ schname }}</h3>
        #       <p>Affected #{value['affected_type']}: {{ #{value['loss_column']} }}</p>
        #     </div>
        #   """
        # )

        vent.on "infowindow:rendered", (obj)->

          return if obj["null"] is "Loading content..."

          rank = $(".school-ranking").text()
          rank = (parseFloat(rank) * 100).toFixed(2)
          $(".school-ranking").text("#{rank}%")


  vulnerable: ->
    cartodb
      .createVis('vulnerableInfra', 'http://rpa.cartodb.com/api/v2/viz/533c5970-9f4f-11e3-ad24-0ed66c7bc7f3/viz.json', zoom: 9, searchControl: true, layer_selector: false, legends: false)
      .done (vis,layers)->

        map = vis.getNativeMap()

        layer = layers[1]
        layer.setInteraction(true)


        tmpl= -> _.template("""
            <div class="cartodb-popup">
               <div class="cartodb-popup-content-wrapper">
                  <div class="cartodb-popup-content">
                    <h2 class="title"><%=content.data.#{type_name}%></h2>
                  </div>
               </div>
            </div>
          """)

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
          # subway_routes: {
          #   flood_column: "am"  #TODO: replace with the real column
          #   name_column: "route_name"
          #   loss_column: "cartodb_id"  #TODO: replace with the real column
          #   affected_type: "routes"
          #   tables: [
          #     "rpa_subwayroutes_flood"
          #   ]
          # }
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
            template: """
              <div style="background:white;padding:5px 10px;">
                <h3 style="margin-top:0">{{ #{value['name_column']} }}</h3>
                <p>Affected #{value['affected_type']}: {{ #{value['loss_column']} }}</p>
              </div>
            """
          )
        )




        # TODO: create a handler for the layer_selector. Toggle the visibility of the clicked layer.


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
      console.log id
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
      .createVis('discretionaryIncome', 'http://rpa.cartodb.com/api/v2/viz/62e94d78-9f1e-11e3-b420-0ed66c7bc7f3/viz.json', legends: true, searchControl: true, zoom: 8, infowindow: true, layer_selector: true)
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
          else
            censusLayer.hide()
            countyLayer.show()
        )


        # Customize the infowindows
        tmpl= (type,type_name,mhi,disp_inc,trans,housing,taxes)-> _.template("""
            <div class="cartodb-popup">
              <a href="#close" class="cartodb-popup-close-button close">x</a>
               <div class="cartodb-popup-content-wrapper">
                 <div class="cartodb-popup-content" data-disp_inc="<%=content.data.#{disp_inc}%>" data-trans="<%=content.data.#{trans}%>" data-housing="<%=content.data.#{housing}%>" data-taxes="<%=content.data.#{taxes}%>">

                  <h2 class="title">
                    <%=content.data.#{type_name}%>
                  </h2>

                  <div class="leftColumn">
                    <% if("#{type}"=="Census Tract"){ %>
                      <p><%=content.data.localname  %></p>
                    <% } %>
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


        # TODO: the tooltip does not work when there is also an infowindow overlay. How do I make them work together?

        # countyLayer.set(interactivity: ["disp_inc"])
        # countyTooltip = vis.addOverlay(
        #   type: "tooltip"
        #   template: """
        #     <div id="tooltip">
        #       {{county}} - {{disp_inc}}
        #     </div>
        #   """
        # )


        # HACK: the code below requires a feature added to a customized version of the cartodb.js liburary
        vent.on "infowindow:rendered", (obj)->

          return if obj["null"] is "Loading content..."

          # Create a bar chart in the infowindow for the clicked feature
          data = $(".cartodb-popup-content").data()

          mhi = $("#discretionaryIncome .median-income").text()
          console.log mhi
          makeChart(data, Number(mhi))


          # TODO: make the tooltip show the percentage value of each slice


          $(".currency").each(()->
              c = $(this).text()
              c = accounting.formatMoney(Number(c), precision:0)
              $(this).text(c)
            )





$ ->

  new Workspace()
  Backbone.history.start(pushState: true, root: root)

