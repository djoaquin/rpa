/** simple visualization */

#schoolperformancerank2012_rparegion{
  marker-opacity: 0.9;
  marker-line-color: #FFF;
  marker-line-width: 0;
  marker-line-opacity: 1;
  marker-placement: point;
  marker-type: ellipse;
  marker-width: 5.5;
  marker-fill: #ba0000;
  marker-allow-overlap: true;


  [zoom <= 10] {
     marker-width: 2;
  }

  [zoom > 13] {
     marker-width: 15;
  }

  [schlrank = "Bottom"]{
    marker-opacity: 1;
  }
  [schlrank = "Middle"]{
    marker-opacity: 1;
    marker-fill: #fff;
  }

  [schlrank = "Top"]{
    marker-opacity: 1;
    marker-fill: #0082ac;
  }
}


/** choropleth visualization */

#schoolrank2012_racepoverty_income_rparegion{
  polygon-opacity: 1;

  line-color: #FFF;
  line-width: 0;
  line-opacity: 1;


  polygon-fill: #beb4aa;

  [ hh_median <= 40125] {
     polygon-opacity: 1;
  }
  [ hh_median > 40125][ hh_median <= 57344] {
     polygon-opacity: 0.8;
  }
  [ hh_median > 57344][ hh_median <= 76061] {
     polygon-opacity: 0.6;
  }
  [ hh_median > 76061][ hh_median <= 99075] {
     polygon-opacity: 0.4;
  }
  [ hh_median > 99075][ hh_median <= 250000] {
     polygon-opacity: 0.2;
  }
}