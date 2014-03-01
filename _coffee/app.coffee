GOOGLE_API_KEY = "AIzaSyAv_1ubjVfxNg3v7SUrNcgfZ6OUjkjBujM"


$ ->
  # DISCRETIONARY INCOME
  maps = {}
  cartodb
    .createVis('discretionaryIncome', 'http://rpa.cartodb.com/api/v2/viz/62e94d78-9f1e-11e3-b420-0ed66c7bc7f3/viz.json', legends: true, searchControl: true, zoom: 8, infowindow: true, layer_selector: true)
    .done (vis,layers)->
      dataLayers = layers[1]
      dataLayers.setInteraction(true)


      countyLayer = dataLayers.getSubLayer(0)
      censusLayer = dataLayers.getSubLayer(1)


      censusLayer.hide()

      # Customize the infowindows
      tmpl= (type,type_name,mhi,disp_inc,trans,housing,taxes)-> _.template("""
          <div class="cartodb-popup">
            <a href="#close" class="cartodb-popup-close-button close">x</a>
             <div class="cartodb-popup-content-wrapper">
               <div class="cartodb-popup-content" data-disp_inc="<%=content.data.#{disp_inc}%>" data-trans="<%=content.data.#{trans}%>" data-housing="<%=content.data.#{housing}%>" data-taxes="<%=content.data.#{taxes}%>">



                <h2 class="title"><%=content.data.#{type_name}%></h2>


                <div class="leftColumn">
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
                    <div>Median Income</div>
                    <b class="median-income currency"><%=Math.round(Number(content.data.#{mhi}))%></b>
                  </div>

                  <canvas id="donut" width="170" height="170"></canvas>

                </div>
               </div>
             </div>
          </div>
        """)

      censusLayer.infowindow.set('template', tmpl("Census Tract", "namelsad10", "mhi", "disp_inc", "avg_transc", "housingcos", "avg_ttl"))
      countyLayer.infowindow.set('template', tmpl("County", "county", "avg_mhi", "disp_inc", "avg_trans", "avg_hous", "avg_ttl"))





      map = vis.getNativeMap()
      map.on('zoomstart', (a,b,c)->
          # FIXME: this doesn't work
          censusLayer.infowindow.set('visibility',false)
          countyLayer.infowindow.set('visibility',false)
        )


      map.on('zoomend', (a,b,c)->

        zoomLevel = map.getZoom()
        if zoomLevel > 10
          censusLayer.show()
          countyLayer.hide()
        else
          censusLayer.hide()
          countyLayer.show()
      )



      dataLayers.on('featureClick', (e, latlng, pos, data, layerNumber)->

        # Create a bar chart in the infowindow for the clicked feature
        setTimeout((->

            data = $(".cartodb-popup-content").data()

            chartData = [
              {value : data["taxes"],  color : "#47b3d2"}
              {value : data["housing"],  color : "#f12b15"}
              {value : data["trans"], color : "#b92b15"}
              {value : data["disp_inc"],  color : "#7c2b15"}
            ]
            ctx = $("#donut").get(0).getContext("2d");
            options = {percentageInnerCutout: 70}
            new Chart(ctx).Doughnut(chartData,options)

            # income = $(".median-income").text()
            # income = Math.round(Number(income))
            # $(".median-income").text(income)
            $(".currency").each(()->
                c = $(this).text()
                c = accounting.formatMoney(Number(c), precision:0)
                $(this).text(c)
              )

          ),500)

      )


  # VULNERABLE INFRASTRUCTURE
  # =============================================================

  # cartodb
  #   .createVis('vulnerableInfra', 'http://rpa.cartodb.com/api/v2/viz/533c5970-9f4f-11e3-ad24-0ed66c7bc7f3/viz.json', zoom: 8, searchControl: true, layer_selector: false)
  #   .done (vis,layers)->

  #     maps.vulnerableInfra = vis.getNativeMap()

  #     # Create the sublayer for subway routes
  #     layer = layers[1]
  #     layer.createSubLayer({
  #       sql: "SELECT * FROM rpa_subwayroutes_flood",
  #       cartocss: '#rpa_subwayroutes_flood {marker-fill: #000;}'
  #     })

  #     # TODO: Create the sublayer for power plants, hospitals, nursing homes, public housing, train stations, train tracks and power plants

  #     layer.createSubLayer({
  #       sql: "SELECT * FROM rpa_subwaystations",
  #       cartocss: '#rpa_subwaystations {marker-fill: yellow;}'
  #     })
  #     # layer.createSubLayer({
  #     #   sql: "SELECT * FROM ny_rpa_nursinghomesnamesbedsflood",
  #     #   cartocss: '#ny_rpa_nursinghomesnamesbedsflood {marker-fill: yellow;}'
  #     # })
