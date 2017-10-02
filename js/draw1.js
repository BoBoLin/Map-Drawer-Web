var map;
var raster;
var featureOverlay;
var popup_overlay;
var features;
var modify;
var typeSelect

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
var wgs84Sphere = new ol.Sphere(6378137);
var measure_draw;
var source = new ol.source.Vector();

$(document).ready(function () {

    /************ map init *************/
    raster = new ol.layer.Tile({
        source: new ol.source.OSM()
    });

    features = new ol.Collection();
    //sync feature
    featureOverlay = new ol.layer.Vector({
        source: new ol.source.Vector({features: features}),
    });

    map = new ol.Map({
        layers: [raster, featureOverlay],
        target: 'map',
        view: new ol.View({
            center: ol.proj.transform([120.594013,23.267667], 'EPSG:4326', 'EPSG:3857'),
            zoom: 8
        })
    });

    var want_modify_feature = new ol.Collection();
    modify = new ol.interaction.Modify({
        features: want_modify_feature,
        // the SHIFT key must be pressed to delete vertices, so
        // that new vertices can be drawn at the same position
        // of existing vertices
        deleteCondition: function(event) {
            return ol.events.condition.shiftKeyOnly(event) && ol.events.condition.singleClick(event);
        }
    });
    map.addInteraction(modify);


    document.getElementById('export-png').addEventListener('click', function() {
                console.log('!');
              map.once('postcompose', function(event) {
                var canvas = event.context.canvas;
                event.context.textAlign = 'right';
                event.context.fillText('© My Copyright Text', canvas.width -100, canvas.height - 100);
                event.context.fillText('© My Copyright Text', canvas.width - 5, canvas.height - 5);
                canvas.toBlob(function(blob) {
                  saveAs(blob, 'map.png');
                });
              });
              map.renderSync();
            });
    /************ !map init *************/


});


