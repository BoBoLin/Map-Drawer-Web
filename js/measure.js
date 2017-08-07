var measure;

/**
* Currently drawn feature.
* @type {ol.Feature}
*/
var sketch;

/**
* The help tooltip element.
* @type {Element}
*/
var helpTooltipElement;

/**
* Overlay to show the help messages.
* @type {ol.Overlay}
*/
var helpTooltip;

/**
* The measure tooltip element.
* @type {Element}
*/
var measureTooltipElement;

/**
* Overlay to show the measurement.
* @type {ol.Overlay}
*/
var measureTooltip;

$(document).ready(function () {
    var wgs84Sphere = new ol.Sphere(6378137);

    var raster = new ol.layer.Tile({
    source: new ol.source.OSM()
    });

    var source = new ol.source.Vector();

    var map = new ol.Map({
    layers: [raster],
    target: 'map',
    view: new ol.View({
        projection: 'EPSG:4326',
        center: [120.594013,23.267667],
        zoom: 8
    })
    });

    var typeSelect = document.getElementById('type');

    var draw; // global so we can remove it later

    /**
    * Format length output.
    * @param {ol.geom.LineString} line The line.
    * @return {string} The formatted length.
    */
    var formatLength = function(line) {
      var length;

      var coordinates = line.getCoordinates();
      length = 0;
      var sourceProj = map.getView().getProjection();
      for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
        var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
        length += wgs84Sphere.haversineDistance(c1, c2);
      }
      
      var output;
      if (length > 100) {
        output = (Math.round(length / 1000 * 100) / 100) +
            ' ' + 'km';
      } else {
        output = (Math.round(length * 100) / 100) +
            ' ' + 'm';
      }
      return output;
    };

    /**
    * Format area output.
    * @param {ol.geom.Polygon} polygon The polygon.
    * @return {string} Formatted area.
    */
    var formatArea = function(polygon) {
      var area;
    
      var sourceProj = map.getView().getProjection();
      var geom = /** @type {ol.geom.Polygon} */(polygon.clone().transform(
          sourceProj, 'EPSG:4326'));
      var coordinates = geom.getLinearRing(0).getCoordinates();
      area = Math.abs(wgs84Sphere.geodesicArea(coordinates)); 

      var output;
      if (area > 10000) {
        output = (Math.round(area / 1000000 * 100) / 100) +
            ' ' + 'km<sup>2</sup>';
      } else {
        output = (Math.round(area * 100) / 100) +
            ' ' + 'm<sup>2</sup>';
      }
      return output;
    };

    function addInteraction() {
      var type = (typeSelect.value == 'area' ? 'Polygon' : 'LineString');
      draw = new ol.interaction.Draw({
        source: source,
        type: /** @type {ol.geom.GeometryType} */ (type),
        style: new ol.style.Style({
          fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
          }),
          stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 0, 0.5)',
            lineDash: [10, 10],
            width: 2
          }),
          image: new ol.style.Circle({
            radius: 5,
            stroke: new ol.style.Stroke({
              color: 'rgba(0, 0, 0, 0.7)'
            }),
            fill: new ol.style.Fill({
              color: 'rgba(255, 255, 255, 0.2)'
            })
          })
        })
      });

      map.addInteraction(draw);

      createMeasureTooltip();
      createHelpTooltip();

      var listener;
      draw.on('drawstart',
          function(evt) {
            // set sketch
            sketch = evt.feature;

            /** @type {ol.Coordinate|undefined} */
            var tooltipCoord = evt.coordinate;

            listener = sketch.getGeometry().on('change', function(evt) {
              var geom = evt.target;
              var output;
              if (geom instanceof ol.geom.Polygon) {
                output = formatArea(geom);
                tooltipCoord = geom.getInteriorPoint().getCoordinates();
              } else if (geom instanceof ol.geom.LineString) {
                output = formatLength(geom);
                tooltipCoord = geom.getLastCoordinate();
              }
              measureTooltipElement.innerHTML = output;
              measureTooltip.setPosition(tooltipCoord);
            });
          }, this);

      draw.on('drawend',
          function() {
            measureTooltipElement.className = 'tooltip tooltip-static';
            measureTooltip.setOffset([0, -7]);
            // unset sketch
            sketch = null;
            // unset tooltip so that a new one can be created
            measureTooltipElement = null;
            createMeasureTooltip();
            ol.Observable.unByKey(listener);
          }, this);
    }

    
    /**
    * Let user change the geometry type.
    */
    typeSelect.onchange = function() {
      map.removeInteraction(draw);
      addInteraction();
    };
    
    $('#start').click(function(){
      measure = new ol.layer.Vector({
      source: source,
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
          color: '#ffcc33',
          width: 2
        }),
        image: new ol.style.Circle({
          radius: 7,
          fill: new ol.style.Fill({
            color: '#ffcc33'
          })
        })
      })
      });

      /**
      * Message to show when the user is drawing a polygon.
      * @type {string}
      */
      var continuePolygonMsg = 'Click to continue drawing the polygon';

      /**
      * Message to show when the user is drawing a line.
      * @type {string}
      */
      var continueLineMsg = 'Click to continue drawing the line';

      /**
      * Handle pointer move.
      * @param {ol.MapBrowserEvent} evt The event.
      */
      createMeasureTooltip();
      createHelpTooltip();

      var pointerMoveHandler = function(evt) {
        if (evt.dragging) {
          return;
        }
        /** @type {string} */
        var helpMsg = 'Click to start drawing';

        if (sketch) {
          var geom = (sketch.getGeometry());
          if (geom instanceof ol.geom.Polygon) {
            helpMsg = continuePolygonMsg;
          } else if (geom instanceof ol.geom.LineString) {
            helpMsg = continueLineMsg;
          }
        }

        helpTooltipElement.innerHTML = helpMsg;
        helpTooltip.setPosition(evt.coordinate);

        helpTooltipElement.classList.remove('hidden');
      };

      map.on('pointermove', pointerMoveHandler);

      map.getViewport().addEventListener('mouseout', function() {
        helpTooltipElement.classList.add('hidden');
      });

      map.addLayer(measure);
      addInteraction();
    });
    //addInteraction();

    $('#measure_clean').click(function () {
      if (measure) {
        map.removeLayer(measure);
      }
      measure.getSource().clear();
      map.addLayer(measure);
      var staticTooltip = document.getElementsByClassName("tooltip-static");
      var length = staticTooltip.length;
      for(var i = 0; i < length; i++)
      {
        //staticTooltip[0].parentNode.removeChild(staticTooltip[0]);
        if (staticTooltip[0]) {
          staticTooltip[0].parentNode.removeChild(staticTooltip[0]);
        }
      }
      createMeasureTooltip();
      
      //$( ".tooltip" ).remove();
      //$('.ol-overlay-container').css({ "left": "none", "bottom": "none", "display": "none" });
    });

    /**
    * Creates a new help tooltip
    */
    function createHelpTooltip() {
    if (helpTooltipElement) {
      helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    }
    helpTooltipElement = document.createElement('div');
    helpTooltipElement.className = 'tooltip hidden';
    helpTooltip = new ol.Overlay({
      element: helpTooltipElement,
      offset: [15, 0],
      positioning: 'center-left'
    });
    map.addOverlay(helpTooltip);
    }

    /**
    * Creates a new measure tooltip
    */
    function createMeasureTooltip() {
    if (measureTooltipElement) {
      measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'tooltip tooltip-measure';
    measureTooltip = new ol.Overlay({
      element: measureTooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center'
    });
    map.addOverlay(measureTooltip);
    }

});