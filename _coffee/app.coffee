GOOGLE_API_KEY = "AIzaSyAv_1ubjVfxNg3v7SUrNcgfZ6OUjkjBujM"

$ ->

  # DISCRETIONARY INCOME
  maps = {}
  cartodb
    .createVis('discretionaryIncome', 'http://rpa.cartodb.com/api/v2/viz/62e94d78-9f1e-11e3-b420-0ed66c7bc7f3/viz.json', legends: true, searchControl: true, zoom: 8, infowindow: true, layer_selector: true)
    .done (vis,layers)->
      dataLayers  = layers[1]
      censusLayer = dataLayers.getSubLayer(1)
      countyLayer = dataLayers.getSubLayer(0)

      censusLayer.hide()

      map = vis.getNativeMap()
      google.maps.event.addListener(map, 'zoom_changed', ->
        zoomLevel = map.getZoom()
        if zoomLevel > 10
          censusLayer.show()
          countyLayer.hide()
        else
          censusLayer.hide()
          countyLayer.show()
      )

      # Cutomize the infowindows
      censusLayer.infowindow.set('template', $('#infowindow_template').html());
      countyLayer.infowindow.set('template', $('#infowindow_template').html());


      dataLayers.setInteraction(true)
      dataLayers.on('featureClick', (e, latlng, pos, data, layerNumber)->
        cartodb.log.log(e, latlng, pos, data, layerNumber)
        # TODO: create a bar chart in the infowindow for the clicked feature


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
