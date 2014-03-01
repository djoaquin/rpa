class Workspace extends Backbone.Router
  routes:
    "schools/" : "schools"
    "vulnerable/" : "vulnerable"
    "discretionary/" : "discretionary"
  schools: ->
    console.log "schools"
  vulnerable: ->
    cartodb
      .createVis('vulnerableInfra', 'http://rpa.cartodb.com/api/v2/viz/533c5970-9f4f-11e3-ad24-0ed66c7bc7f3/viz.json', zoom: 9, searchControl: true, layer_selector: false, legends: true)
      .done (vis,layers)->

        map = vis.getNativeMap()

        # Create the sublayer for subway routes
        layer = layers[1]
        layer.setInteraction(true)


        # [√] rpa_trainstations
        # [√] rpa_subwayroutes_flood
        # [√] rpa_subwaystations
        # [√] rpa_nj_hsip_hospitals_compressed
        # [√] rpa_ct_nursinghomes_namesaddressesbeds
        # [√] rpa_raillines_flood
        # ??? power plants
        # ??? public housing
        # ??? train tracks


        dbs = [
          {name: "rpa_nj_hsip_hospitals_compressed", color: "#000"}
          {name: "rpa_ct_nursinghomes_namesaddressesbeds", color: "#333"}
          {name: "rpa_raillines_flood", color: "#666"}
          {name: "rpa_subwayroutes_flood", color: "#999"}
          {name: "rpa_subwaystations", color: "#aaa"}
          {name: "rpa_trainstations", color: "#ccc"}
        ]

        # Add dots
        dbs.forEach((item)->
          layer.createSubLayer({
            sql: "SELECT * FROM #{item['name']}",
            cartocss: "##{item['name']} {marker-fill: #{item['color']};}"
          })
        )
  discretionary: ->
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

                    <canvas id="donut" width="130" height="130"></canvas>

                  </div>
                 </div>
               </div>
            </div>
          """)

        censusLayer.infowindow.set('template', tmpl("Census Tract", "namelsad10", "mhi", "disp_inc", "avg_transc", "housingcos", "avg_ttl"))
        countyLayer.infowindow.set('template', tmpl("County", "county", "avg_mhi", "disp_inc", "avg_trans", "avg_hous", "avg_ttl"))



        vent.on "infowindow:rendered", (obj)->

          return if obj["null"] is "Loading content..."

          # Create a bar chart in the infowindow for the clicked feature
          data = $(".cartodb-popup-content").data()

          chartData = [
            {value : data["taxes"],  color : "#47b3d2"}
            {value : data["housing"],  color : "#f12b15"}
            {value : data["trans"], color : "#b92b15"}
            {value : data["disp_inc"],  color : "#7c2b15"}
          ]
          ctx = $("#donut").get(0).getContext("2d");
          options =
            percentageInnerCutout: 70
            animationEasing : "easeOutQuart"
            animationSteps : 30

          new Chart(ctx).Doughnut(chartData,options)

          $(".currency").each(()->
              c = $(this).text()
              c = accounting.formatMoney(Number(c), precision:0)
              $(this).text(c)
            )

        map = vis.getNativeMap()

        map.on('zoomend', (a,b,c)->

          zoomLevel = map.getZoom()
          if zoomLevel > 10
            censusLayer.show()
            countyLayer.hide()
          else
            censusLayer.hide()
            countyLayer.show()
        )


$ ->

  new Workspace()
  Backbone.history.start(pushState: true, root: root)

