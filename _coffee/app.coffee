

$ ->
  cartodb
    .createVis('discretionaryIncome', 'http://rpa.cartodb.com/api/v2/viz/62e94d78-9f1e-11e3-b420-0ed66c7bc7f3/viz.json')
    .done (vis,layers)->
      layers[1].setInteraction(true)
      layers[1].on('featureOver', (e, latlng, pos, data, layerNumber)->
        # cartodb.log.log(e, latlng, pos, data, layerNumber)
        # TODO: create a bar chart below the map from the data for the clicked feature
      )
      map = vis.getNativeMap()
      map.setZoom(8)
      # TODO: Create the sublayer for the census tracts
      # cartodb.createLayer(map, "http://rpa.cartodb.com/api/v2/viz/4ad76c8c-9f38-11e3-89a8-0e49973114de/viz.json")


  exampleData = ->
    keys = ["Transportation Cost", "Housing Cost", "Income Taxes", "Discretionary Income"]
    stream_layers(4,10+Math.random()*10,.1).map((data, i)-> {key: keys[i], values: data})
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
