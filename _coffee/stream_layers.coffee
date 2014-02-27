@stream_layers = (n, m, o) ->
  bump = (a) ->
    x = 1 / (.1 + Math.random())
    y = 2 * Math.random() - .5
    z = 10 / (.1 + Math.random())
    i = 0

    while i < m
      w = (i / m - y) * z
      a[i] += x * Math.exp(-w * w)
      i++
    return
  o = 0  if arguments.length < 3
  d3.range(n).map ->
    a = []
    i = undefined
    i = 0
    while i < m
      a[i] = o + o * Math.random()
      i++
    i = 0
    while i < 5
      bump a
      i++
    a.map stream_index

# Another layer generator using gamma distributions.
@stream_waves = (n, m) ->
  d3.range(n).map (i) ->
    d3.range(m).map((j) ->
      x = 20 * j / m - i / 3
      2 * x * Math.exp(-.5 * x)
    ).map stream_index

@stream_index = (d, i) ->
  x: i
  y: Math.max(0, d)