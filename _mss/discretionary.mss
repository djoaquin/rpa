/** simple visualization */

#citiesx020{
  marker-opacity: 0;

  ::labels {
    text-name: [name];
    text-face-name: 'DejaVu Sans Book';
    text-size: 10;
    text-label-position-tolerance: 10;
    text-fill: #000;
    text-halo-fill: #fff;
    text-halo-radius: 1;
    text-dy: -10;
    text-allow-overlap: true;
    text-placement: point;
    text-placement-type: simple;

  [zoom > 10]{

  }

  [zoom <= 10]{
    text-fill:transparent;
          text-halo-fill: transparent;
  }
  }
}


/** choropleth visualization */

#dispinc_rpacounty_2010 {
  //Income
  [ disp_inc <= 16000] {
     polygon-fill: #52eaff;
  }
  [ disp_inc > 16000][disp_inc <= 24000] {
     polygon-fill: #4dcfe9;
  }
  [  disp_inc > 24000][disp_inc <= 32000] {
     polygon-fill: #47b3d2;
  }
  [  disp_inc > 32000][disp_inc <= 40000 ] {
     polygon-fill: #259abc;
  }
  [  disp_inc > 40000 ] {
     polygon-fill: #0280a5;
  }
  [zoom > 10]{
    polygon-opacity:1;
  }

  [zoom <= 10]{
    polygon-opacity:0;
  }
}

/** choropleth visualization */

#dispinc_rpacounty_2010{
  polygon-opacity: 0.8;
  line-color: #FFF;
  line-width: 0;
  line-opacity: 1;
}

#dispinc_rpacounty_2010::labels {
  text-name: [county];
  text-face-name: 'DejaVu Sans Book';
  text-size: 10;
  text-label-position-tolerance: 10;
  text-fill: #000;
  text-halo-fill: #FFF;
  text-halo-radius: 1;
  text-dy: -10;
  text-allow-overlap: true;
  text-placement: point;
  text-placement-type: simple;


}

#dispinc_rpacounty_2010 {
  [ disp_inc <= 16000] {
     polygon-fill: #52eaff;
  }
  [ disp_inc > 16000][disp_inc <= 24000] {
     polygon-fill: #4dcfe9;
  }
  [  disp_inc > 24000][disp_inc <= 32000] {
     polygon-fill: #47b3d2;
  }
  [  disp_inc > 32000][disp_inc <= 40000 ] {
     polygon-fill: #259abc;
  }
  [  disp_inc > 40000 ] {
     polygon-fill: #0280a5;
  }

  [zoom > 10]{
    polygon-opacity:0;
  }

  [zoom <= 10]{
    polygon-opacity:1;
  }
}


