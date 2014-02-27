

$ ->

  # DISCRETIONARY INCOME
  maps = {}
  cartodb
    .createVis('discretionaryIncome', 'http://rpa.cartodb.com/api/v2/viz/62e94d78-9f1e-11e3-b420-0ed66c7bc7f3/viz.json', legends: true, searchControl: true, zoom: 8, infowindow: true, layer_selector: true)
    .done (vis,layers)->

      # layers[1].setInteraction(true)
      # layers[1].on('featureOver', (e, latlng, pos, data, layerNumber)->
      #   # cartodb.log.log(e, latlng, pos, data, layerNumber)
      #   # TODO: create a bar chart below the map from the data for the clicked feature
      # )


  exampleData = ->
    keys = ["Transportation Cost", "Housing Cost", "Income Taxes", "Discretionary Income"]
    stream_layers(4,10+Math.random()*4,.1).map((data, i)-> {key: keys[i], values: data})
  nv.addGraph(->
    chart = nv.models.multiBarChart()
      .transitionDuration(150)
      .stacked(true)
      .reduceXTicks(true)   #If 'false', every single x-axis tick label will be rendered.
      .rotateLabels(0)      #Angle to rotate x-axis labels.
      .showControls(false)   #Allow user to switch between 'Grouped' and 'Stacked' mode.
      # .showLegend(false)
      .groupSpacing(0.1)    #Distance between each group of bars.

    chart.xAxis
        .tickFormat(d3.format(',f'))

    chart.yAxis
        .tickFormat(d3.format(',.1f'))


    d3.select('#chart1 svg')
        .datum(exampleData())
        .call(chart)

    nv.utils.windowResize(chart.update)

    chart
  )


  # VULNERABLE INFRASTRUCTURE
  # =============================================================

  cartodb
    .createVis('vulnerableInfra', 'http://rpa.cartodb.com/api/v2/viz/533c5970-9f4f-11e3-ad24-0ed66c7bc7f3/viz.json', zoom: 8, searchControl: true, layer_selector: false)
    .done (vis,layers)->

      maps.vulnerableInfra = vis.getNativeMap()

      # Create the sublayer for subway routes
      layer = layers[1]
      layer.createSubLayer({
        sql: "SELECT * FROM rpa_subwayroutes_flood",
        cartocss: '#rpa_subwayroutes_flood {marker-fill: #000;}'
      })

      # TODO: Create the sublayer for power plants, hospitals, nursing homes, public housing, train stations, train tracks and power plants

      layer.createSubLayer({
        sql: "SELECT * FROM rpa_subwaystations",
        cartocss: '#rpa_subwaystations {marker-fill: yellow;}'
      })
      # layer.createSubLayer({
      #   sql: "SELECT * FROM ny_rpa_nursinghomesnamesbedsflood",
      #   cartocss: '#ny_rpa_nursinghomesnamesbedsflood {marker-fill: yellow;}'
      # })
