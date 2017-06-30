var map;
var raster;
var featureOverlay;
var popup_overlay;
var features;
var modify;

$(document).ready(function () {
    
    /********* component init ***********/
    $('.ui.accordion').accordion({
        onOpen: function () {
            if ($(this).index(".content") == 0 && $(".tab.active").index(".tab") == 1) {
                // fix prpblem when add text, edit text then add text again
                // init again
                $('.ui.range').range({
                    min: -90,
                    max: 90,
                    start: 0,
                    step: 30,
                    onChange: function(value) {
                        $('#text_arc').html(value);
                    }
                });
            }
        }
    });

    $('.secondary.menu > .item').tab({
        onVisible: function() {
            if($(this).index(".tab") == 1){
                // the ranger wont display until tab index 1 is clicked
                // so if ranger init at first, the function wont work
                $('.ui.range').range({
                    min: -90,
                    max: 90,
                    start: 0,
                    step: 30,
                    onChange: function(value) {
                        $('#text_arc').html(value);
                    }
                });
            }
        }
    });

    $("#color_picker").spectrum({
        preferredFormat: "hex",
        color: "#000000",
        chooseText: "套用"
    });
    /********* !component init ***********/

    /*************** editor popup **************/
    var container = document.getElementById('popup');
    var content = document.getElementById('popup-content');
    var closer = document.getElementById('popup-closer');

    /**
    * Create an overlay to anchor the popup to the map.
    */
    popup_overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ {
        element: container,
        autoPan: true,
        autoPanAnimation: {
          duration: 250
        }
    });

    /**
    * Add a click handler to hide the popup.
    * @return {boolean} Don't follow the href.
    */
    closer.onclick = function() {
        popup_overlay.setPosition(undefined);
        content.innerHTML = "";
        closer.blur();
        return false;
    };
    /*************** !editor popup **************/

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
        overlays: [popup_overlay],
        target: 'map',
        view: new ol.View({
            center: ol.proj.transform([120.594013,23.267667], 'EPSG:4326', 'EPSG:3857'),
            zoom: 8
        })
    });

    modify = new ol.interaction.Modify({
        features: features,
        // the SHIFT key must be pressed to delete vertices, so
        // that new vertices can be drawn at the same position
        // of existing vertices
        deleteCondition: function(event) {
            return ol.events.condition.shiftKeyOnly(event) && ol.events.condition.singleClick(event);
        }
    });
    map.addInteraction(modify);
    /************ !map init *************/

    /************ menu button listener ***********/
    $('.secondary.menu > a.item').on('click', function() {
        if( $(this).data("tab") === "one" ){
            map_move_mode();
        }
    });

    $('#text_button').click(function () {
        map.removeInteraction(draw); // remove old brush
        writeText();
    })

    $('.icon_button').click(function () {
        map.removeInteraction(draw); // remove old brush
        putIcon( $(this).css('background-image').substr(-18,16) );
    });

    $('#red_line').click(function () {
        map.removeInteraction(draw); // remove old brush
        drawLine('rgba(255, 0, 0, 0.5)', 5);
    });

    $('#green_line').click(function () {
        map.removeInteraction(draw); // remove old brush
        drawLine('rgba(0, 255, 0, 0.5)', 15);
    })

    $(document).on('click', '.search.button', function () {
        var feature_id = $(this).parent().siblings("td").first().children("div").text();
        if (feature_id.split(' ')[0] == "green_line" || feature_id.split(' ')[0] == "red_line") {
            map.getView().setCenter(
                featureOverlay.getSource().getFeatureById(feature_id).getGeometry().getCoordinates()[0]
            );
        }else{
            map.getView().setCenter(
                featureOverlay.getSource().getFeatureById(feature_id).getGeometry().getCoordinates()
            );
        }
        map.getView().setZoom(10);
    });

    $(document).on('click', '.edit.button', function () {
        var feature_id = $(this).parent().siblings("td").first().children("div").text();
        var feature = featureOverlay.getSource().getFeatureById(feature_id);
        var coord = feature.getGeometry().getCoordinates();
        coord[1] += 7000;
        popup_overlay.setPosition(coord);

        var type = $(this).parent().siblings("td:nth-child(2)").children("i").attr('class');
        switch(type){
            case 'font icon':
                var text_style = feature.getStyle().getText();
                var text_size = parseInt(((text_style.getFont()).split('px'))[0]);

                content.innerHTML =
                    "<div style='display: none;'>" + feature_id + "</div>" +
                    "<div class='ui form'>" +
                        "<div class='fields'>" +
                            "<div class='eight wide field'>" +
                                "<label>字體</label>" +
                                "<select id='update_text_size'>" +
                                    ((text_size == 8) ? "<option value='8px' selected='selected'>8</option>" : "<option value='8px'>8</option>") +
                                    ((text_size == 9) ? "<option value='9px' selected='selected'>9</option>" : "<option value='9px'>9</option>") +
                                    ((text_size == 10) ? "<option value='10px' selected='selected'>10</option>" : "<option value='10px'>10</option>") +
                                    ((text_size == 11) ? "<option value='11px' selected='selected'>11</option>" : "<option value='11px'>11</option>") +
                                    ((text_size == 12) ? "<option value='12px' selected='selected'>12</option>" : "<option value='12px'>12</option>") +
                                    ((text_size == 13) ? "<option value='13px' selected='selected'>13</option>" : "<option value='13px'>13</option>") +
                                    ((text_size == 20) ? "<option value='20px' selected='selected'>20</option>" : "<option value='20px'>20</option>") +
                                    ((text_size == 40) ? "<option value='40px' selected='selected'>40</option>" : "<option value='40px'>40</option>") +
                                "</select>" +
                            "</div>" +
                            "<div class='eight wide field'>" +
                                "<label>顏色</label>" +
                                "<input type='text' id='update_color_picker' />" +
                            "</div>" +
                        "</div>" +
                        "<div class='field'>" +
                            "<label>內容</label>" +
                            "<textarea name='' id='update_text_content' rows='3'>" + text_style.getText() + "</textarea>" +
                        "</div>" +
                        "<div class='field'>" +
                            "<label>角度：<span id='update_text_arc'></span></label>" +
                            "<div class='ui brown range'></div>" +
                        "</div>" +
                    "</div>";

                $("#update_color_picker").spectrum({
                    preferredFormat: "hex",
                    color: text_style.getFill().getColor(),
                    chooseText: "套用"
                });

                $('.ui.range').range({
                    min: -90,
                    max: 90,
                    start: parseInt((text_style.getRotation() * 180) / Math.PI),
                    step: 30,
                    onChange: function(value) {
                        $('#update_text_arc').html(value);
                    }
                });
                break;
            case 'home icon':
            case 'h icon':
            case 'warning sign icon':
                var img = feature.getStyle().getImage().getSrc();
                var text = feature.getStyle().getText().getText();

                content.innerHTML =
                    "<div style='display: none;'>" + feature_id + "</div>" +
                    "<div class='ui form'>" +
                        "<div class='eight wide field'>" +
                            "<div class='ui labeled input'>" +
                                "<div class='ui basic label'>名稱</div>" +
                                "<input type='text' id='update_icon_text' value='" + text + "'/>" +
                            "</div>" +
                        "</div>" +
                        "<div class='fields'>" +
                            "<div class='field'>" +
                                ((img == 'img/marker01.png')? "<input type='radio' name='update_icon' value='img/marker01.png' checked='true' tabindex='0'>" : "<input type='radio' name='update_icon' value='img/marker01.png' tabindex='0'>") +
                                "<img class='ui small image' src='img/marker01.png'>" +
                            "</div>" +
                            "<div class='field'>" +
                                ((img == 'img/marker02.png')? "<input type='radio' name='update_icon' value='img/marker02.png' checked='true' tabindex='0'>" : "<input type='radio' name='update_icon' value='img/marker02.png' tabindex='0'>") +
                                "<img class='ui small image' src='img/marker02.png'>" +
                            "</div>" +
                            "<div class='field'>" +
                                ((img == 'img/marker03.png')? "<input type='radio' name='update_icon' value='img/marker03.png' checked='true' tabindex='0'>" : "<input type='radio' name='update_icon' value='img/marker03.png' tabindex='0'>") +
                                "<img class='ui small image' src='img/marker03.png'>" +
                            "</div>" +
                        "</div>" +
                    "</div>";
                break;
            case 'arrow left icon': break;
        }
    });

    $(document).on('click', '.remove.button', function () {
        var feature_id = $(this).parent().siblings("td").first().children("div").text();
        featureOverlay.getSource().removeFeature( featureOverlay.getSource().getFeatureById(feature_id) );
        $(this).parent().parent().remove();
    });
    /************ !menu button listener ***********/

    /*************** update feature **************/
    $('#update').click(function () {
        var feature_id = $(this).siblings("#popup-content").children("div").first().text();
        var feature = featureOverlay.getSource().getFeatureById(feature_id);
        console.log((feature_id.split(' '))[0]);

        switch((feature_id.split(' '))[0]){
            case 'font':
                var new_style = new ol.style.Style({
                    image: "",
                    stroke: new ol.style.Stroke({
                        color: "",
                        width: "",
                    }),
                    fill: new ol.style.Fill({
                        color: "",
                    }),
                    text: new ol.style.Text({
                        font: $('#update_text_size').val()+" Microsoft Yahei,sans-serif",
                        fill: new ol.style.Fill({ color: $('#update_color_picker').val() }),
                        stroke: new ol.style.Stroke({color: 'yellow', width: 1}),
                        rotation: parseInt($('#update_text_arc').text())*Math.PI/180,
                        text: $('#update_text_content').val(),
                        offsetY: -10
                    })
                });
                feature.setStyle(new_style);
                break;
            case 'home':
            case 'h':
            case 'warning':
                var new_style = new ol.style.Style({
                    image: new ol.style.Icon(({
                                anchor: [0.5, 46],
                                anchorXUnits: 'fraction',
                                anchorYUnits: 'pixels',
                                scale: 0.125,
                                src: $("input[name=update_icon]:checked").val(),
                            })),
                    stroke: new ol.style.Stroke({
                        color: "",
                        width: "",
                    }),
                    fill: new ol.style.Fill({
                        color: "",
                    }),
                    text: new ol.style.Text({
                        font: "20px Microsoft Yahei,sans-serif",
                        fill: new ol.style.Fill({ color: "rgb(0,0,0)" }),
                        stroke: new ol.style.Stroke({color: 'yellow', width: 1}),
                        rotation: 0,
                        text: $('#update_icon_text').val(),
                        offsetY: -10
                    })
                });
                feature.setStyle(new_style);
                break;
        }

        closer.onclick();
    });
    /*************** !update feature *************/

    /*************** export KML **************/
    var exportKMLElement = document.getElementById('export-kml');
    exportKMLElement.addEventListener('click', function(e) {
        var vectorSource = featureOverlay.getSource();
        var features = [];
        vectorSource.forEachFeature(function(feature) {
            var clone = feature.clone();
            clone.setId(feature.getId());  // clone does not set the id
            clone.getGeometry().transform(ol.proj.get('EPSG:3857'), 'EPSG:4326');
            features.push(clone);
        });
        var string = new ol.format.KML().writeFeatures(features);
        var base64 = btoa(string);
        /*
        $.ajax({url: "http://140.116.245.84/geo/Drawer/db_connect.php?kml_str=" + string + "&type=insert", dataType: 'jsonp', jsonpCallback: 'handler',
            success: function(response) {
                console.log(response);
            }
        });*/

      exportKMLElement.href = 'data:application/vnd.google-earth.kml+xml;base64,' + base64;
    }, false);

    /*************** !export KML **************/

    /*************** share **************/
    //---facebook init----
    var dt;
    var time;
    var rand;

    window.fbAsyncInit = function() {
        FB.init({
            appId      : '320240928434373',
            cookie     : true,
            xfbml      : true,
            version    : 'v2.8'
        });
        FB.AppEvents.logPageView();   
    };

    (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
    //---!facebook init----

    document.getElementById('fb_share').onclick = function() {
        dt = new Date();
        time = dt.getFullYear() +""+(dt.getMonth()+1) +""+ dt.getDate() +""+dt.getHours() +""+ dt.getMinutes() +""+ dt.getSeconds();
        rand = Math.floor((Math.random() * 100000) + 1);

        var vectorSource = featureOverlay.getSource();
        var features = [];
        vectorSource.forEachFeature(function(feature) {
            var clone = feature.clone();
            clone.setId(feature.getId());  // clone does not set the id
            clone.getGeometry().transform(ol.proj.get('EPSG:3857'), 'EPSG:4326');
            features.push(clone);
        });
        var string = new ol.format.KML().writeFeatures(features);
        var url = 'http://140.116.245.84/geo/Drawer_v2/Drawer/drawer.html?' + time + "" +rand;

        FB.ui({
            method: 'share',
            href: url ,
        }, function(response){});

        $.ajax({url: "http://140.116.245.84/geo/Drawer/db_connect.php?kml_str=" + string + "&type=insert" + "&date_str=" + time+ ""+ rand, dataType: 'jsonp', jsonpCallback: 'handler',
            success: function(response) {
                console.log(response);
            }
        });


    }

    $('#emailLink').on('click', function (event) {
        dt = new Date();
        time = dt.getFullYear() +""+(dt.getMonth()+1) +""+ dt.getDate() +""+dt.getHours() +""+ dt.getMinutes() +""+ dt.getSeconds();
        rand = Math.floor((Math.random() * 100000) + 1);

        var vectorSource = featureOverlay.getSource();
        var features = [];
        vectorSource.forEachFeature(function(feature) {
            var clone = feature.clone();
            clone.setId(feature.getId());  // clone does not set the id
            clone.getGeometry().transform(ol.proj.get('EPSG:3857'), 'EPSG:4326');
            features.push(clone);
        });
        var string = new ol.format.KML().writeFeatures(features);

        var url = 'http://140.116.245.84/geo/Drawer_v2/Drawer/drawer.html?' + time + "" +rand;
        event.preventDefault();
        var email = '';
        var subject = 'share the geo info';
        var emailBody = 'url: ' + url;
        window.location = 'mailto:' + email + '?subject=' + subject + '&body=' + emailBody;

        $.ajax({url: "http://140.116.245.84/geo/Drawer/db_connect.php?kml_str=" + string + "&type=insert" + "&date_str=" + time+ ""+ rand, dataType: 'jsonp', jsonpCallback: 'handler',
            success: function(response) {
                console.log(response);
            }
        });
    });
    /*************** !share **************/

    /*************** import KML *************/
    $("#import-kml").change(function(){
        var uploader_dom = document.getElementById('import-kml');

        console.log(uploader_dom.files[0].size + " bytes");
        console.log(uploader_dom.files[0].type);

        var $kml_str = "";
        var reader = new FileReader();
        reader.onload = function (event) {
            // read feature to layer
            $kml_str = event.target.result;
            var format = new ol.format.KML();
            console.log(format.readFeatures($kml_str));
            featureOverlay.getSource().addFeatures(format.readFeatures($kml_str));
            featureOverlay.setMap(map);

            // draw on map
            var load_interaction = new ol.interaction.Modify({
                features: new ol.Collection(featureOverlay.getSource().getFeatures())
            });
            map.addInteraction(load_interaction);
        };
        reader.readAsText(uploader_dom.files[0]);
    });
});

//////////  featureOverlay.getSource().getFeatures()
//////////  featureOverlay.getSource().getFeatureById("h 0");
// global variable
var draw;
var type;
var point_color;
var point_radius;
var line_color;
var line_width;
var plane_color;
var text_content;
var text_size;
var text_color;
var text_rotation;
var icon_url;
var isIcon;
var brush = false;
var is_measure = false;
/**
* Overlay to show the measurement.
* @type {ol.Overlay}
*/
var measureTooltip;
/**
* The measure tooltip element.
* @type {Element}
*/
var measureTooltipElement;
/**
* Currently drawn feature.
* @type {ol.Feature}
*/
var sketch;

function setDefaultFeatures(){
    type = "Point";
    point_color = "rgba(0, 0, 0, 0)";
    point_radius = 0;
    line_color = "rgba(0, 0, 0, 0)";
    line_width = 0;
    plane_color = "rgba(0, 0, 0, 0)";
    text_content = "";
    text_size = "12px";
    text_color = "rgba(0, 0, 0, 0)";
    text_rotation = 0;
    icon_url = "https://openlayers.org/en/v4.1.1/examples/data/icon.png";
    isIcon = false;
}




function map_move_mode(){
    map.removeInteraction(draw);
    interaction = new ol.interaction.Select();
    map.addInteraction(interaction);
}

function drawPoint(color,radius){
    setDefaultFeatures();
    type = "Point";
    point_color = color;
    point_radius = radius;
    runBrush();
}

function drawLine(color,width){
    setDefaultFeatures();
    type = "LineString";
    line_color = color;
    line_width = width;

    var draw_type = "";
    switch(color){
        case 'rgba(255, 0, 0, 0.5)':    draw_type = "red_line"; break;
        case 'rgba(0, 255, 0, 0.5)':    draw_type = "green_line"; break;
    }
    runBrush(draw_type);
}

function drawPolygon(polygon_plane_color,polygon_line_color){
    setDefaultFeatures();
    type = "Polygon";
    plane_color = polygon_plane_color;
    line_color = polygon_line_color;
    line_width = 3;
    runBrush();
}

function drawCircle(circle_plane_color,circle_line_color){
    setDefaultFeatures();
    type = "Circle";
    plane_color = circle_plane_color;
    line_color = circle_line_color;
    line_width = 3;
    runBrush();
}

function writeText(/*content,color,size,rotation*/){
    setDefaultFeatures();
    type = "Point";
    text_content = $('#text_content').val();//content;
    text_color = $('#color_picker').val();//color;
    text_size = $('#text_size').val();//size;
    text_rotation = parseInt($('#text_arc').html())*Math.PI/180;
    runBrush("font");
}

function putIcon(url){
    setDefaultFeatures();
    type = "Point";
    icon_url = url;
    console.log( icon_url);
    isIcon = true;
    text_content = $('#icon_text').val();//content;
    text_color = "rgb(0,0,0)";
    text_size = "20px";

    var draw_type = "";
    switch(icon_url){
        case 'img/marker01.png': draw_type = "home";        break;
        case 'img/marker02.png': draw_type = "h";           break;
        case 'img/marker03.png': draw_type = "warning sign";    break;
    }
    runBrush(draw_type);
}

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
        output = (Math.round(length / 1000 * 100) / 100) + ' km';
    } else {
        output = (Math.round(length * 100) / 100) + ' m';
    }
    return output;
};

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

$text_point_cnt = 0;
$home_point_cnt = 0;
$h_point_cnt = 0;
$tri_point_cnt = 0;
$red_line_cnt = 0;
$green_line_cnt = 0;
function runBrush(draw_type) {
    draw = new ol.interaction.Draw({
        features: features,
        type: /** @type {ol.geom.GeometryType} */ (type)
    });
    map.addInteraction(draw);


    if(is_measure)  createMeasureTooltip();


    draw.on('drawstart',function(event){
        var $cnt;
        switch(draw_type){
            case "font":  $cnt = $text_point_cnt; $text_point_cnt++;        break;
            case "home":  $cnt = $home_point_cnt; $home_point_cnt++;        break;
            case "h":     $cnt = $h_point_cnt;    $h_point_cnt++;           break;
            case "warning sign":   $cnt = $tri_point_cnt;  $tri_point_cnt++;    break;
            case "red_line":   $cnt = $red_line_cnt;   $red_line_cnt++;     break;
            case "green_line": $cnt = $green_line_cnt; $green_line_cnt++;   break;
            default:      $cnt = 0;     break;
        }

        var s = new ol.style.Style({
            image: getImage(),
            stroke: new ol.style.Stroke({
                color: line_color,
                width: line_width,
            }),
            fill: new ol.style.Fill({
                color: plane_color,
            }),
            text: new ol.style.Text({
                font: text_size+" Microsoft Yahei,sans-serif",
                fill: new ol.style.Fill({ color: text_color }),
                stroke: new ol.style.Stroke({color: 'yellow', width: 1}),
                rotation: text_rotation,
                text: text_content,
                offsetY: -10
            })
        });
        event.feature.setStyle(s);


        // set current feature ID
        sketch = event.feature;
        sketch.setId(draw_type + " " + $cnt);
        // add to editor
        $("#editor > tbody").append(
            "<tr>" +
                "<td>" +
                    "<h2 class='ui center aligned header'>" + ($text_point_cnt+$home_point_cnt+$h_point_cnt+$tri_point_cnt+$red_line_cnt+$green_line_cnt) + "</h2>" +
                    "<div style='display: none;'>" + (draw_type + " " + $cnt) + "</div>" +
                "</td>" +
                "<td>" +
                    "<i class='" + ((draw_type=="red_line"||draw_type=="green_line")? "arrow left" : draw_type) + " icon'></i>" +
                    "(" + text_content + ")" +
                "</td>" +
                "<td>" +
                    "<button class='ui icon search button'><i class='search icon'></i></button>" +
                "</td>" +
                "<td>" +
                    "<button class='ui icon edit button'><i class='edit icon'></i></button>" +
                "</td>" +
                "<td>" +
                    "<button class='ui icon remove button'><i class='remove icon'></i></button>" +
                "</td>" +
            "</tr>"
        );

        /** @type {ol.Coordinate|undefined} */
        var tooltipCoord = event.coordinate;
        /*
        listener = sketch.getGeometry().on('change', function(evt) {
            var geom = evt.target;
            var output;
            if (geom instanceof ol.geom.LineString) {
                output = formatLength(geom);
                tooltipCoord = geom.getLastCoordinate();
            }
            measureTooltipElement.innerHTML = output;
            measureTooltip.setPosition(tooltipCoord);
        });
        */
    }, this);

}

function getImage(){
    var image;
    if(isIcon){
        image = new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            scale: 0.125,
            src: icon_url,
        }));
    }
    else{
        image = new ol.style.Circle({
            radius: point_radius,
            fill: new ol.style.Fill({ color: point_color,})
        });
    }
    return image;
}
