var map;
var raster;
var featureOverlay;
var popup_overlay;
var features;
var modify;

$(document).ready(function () {

    /********* component init ***********/
    $('#show_hide_draw_menu').click(function () {
        $('.ui.accordion').toggle();
    });

    $('.ui.accordion').accordion({
        onOpen: function () {
            if ($(this).index(".content") == 0) {
                // fix prpblem when add text, edit text then add text again
                // init again
                switch($(this).index(".tab")){
                    case 1:
                        // the ranger wont display until tab index 1 is clicked
                        // so if ranger init at first, the function wont work
                        $("#point_arc_ranger").range({
                            min: -90,
                            max: 90,
                            start: 0,
                            step: 30,
                            onChange: function(value) {
                                $("#point_text_arc").html(value);
                            }
                        });
                        break;
                    case 2:
                        $('#line_arc_ranger').range({
                            min: -90,
                            max: 90,
                            start: 0,
                            step: 30,
                            onChange: function(value) {
                                $("#line_text_arc").html(value);
                            }
                        });
                        break;
                    case 3:
                        $('#poly_arc_ranger').range({
                            min: -90,
                            max: 90,
                            start: 0,
                            step: 30,
                            onChange: function(value) {
                                $("#poly_text_arc").html(value);
                            }
                        });
                        break;
                }
            }
        }
    });

    $('.secondary.menu > .item').tab({
        onVisible: function() {
            // the ranger wont display until tab index 1 is clicked
            // so if ranger init at first, the function wont work
            switch($(this).index(".tab")){
                case 1:
                    $("#point_arc_ranger").range({
                        min: -90,
                        max: 90,
                        start: 0,
                        step: 30,
                        onChange: function(value) {
                            $("#point_text_arc").html(value);
                        }
                    });
                    break;
                case 2:
                    $('#line_arc_ranger').range({
                        min: -90,
                        max: 90,
                        start: 0,
                        step: 30,
                        onChange: function(value) {
                            $("#line_text_arc").html(value);
                        }
                    });
                    break;
                case 3:
                    $('#poly_arc_ranger').range({
                        min: -90,
                        max: 90,
                        start: 0,
                        step: 30,
                        onChange: function(value) {
                            $("#poly_text_arc").html(value);
                        }
                    });
                    break;
            }
        }
    });

    $(".color_picker").spectrum({
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

    $('#point_button').click(function () {
        map.removeInteraction(draw); // remove old brush
        drawIconText();
    });

    $('#line_button').click(function () {
        map.removeInteraction(draw); // remove old brush
        drawLine();
    });

    $('#poly_button').click(function () {
        map.removeInteraction(draw); // remove old brush
        drawPolygon();
    });

    $(document).on('click', '.search.button', function () {
        var feature_id = $(this).parent().siblings("td").first().children("div").text();
        if (feature_id.split(' ')[0] == "line") {
            map.getView().setCenter(
                featureOverlay.getSource().getFeatureById(feature_id).getGeometry().getCoordinates()[0]
            );
        }else if(feature_id.split(' ')[0] == "polygon"){
            map.getView().setCenter(
                featureOverlay.getSource().getFeatureById(feature_id).getGeometry().getCoordinates()[0][0]
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
        if (feature_id.split(' ')[0] == "polygon") {
            var coord = feature.getGeometry().getCoordinates()[0][0];
        }else if(feature_id.split(' ')[0] == "line"){
            var coord = feature.getGeometry().getCoordinates()[0];
        }else{
            var coord = feature.getGeometry().getCoordinates();
        }
        coord[1] += 7000;
        popup_overlay.setPosition(coord);

        var type = $(this).parent().siblings("td:nth-child(2)").children("i").attr('class');
        switch(type){
            case 'font icon':
            case 'home icon':
            case 'h icon':
            case 'warning sign icon':
                var text_style = feature.getStyle().getText();
                var text_size = parseInt(((text_style.getFont()).split('px'))[0]);
                if (feature.getStyle().getImage().getImage().toString().indexOf("Image") != -1) {
                    var img = feature.getStyle().getImage().getSrc();
                }else{
                    var img = "none";
                }

                content.innerHTML =
                    "<div style='display: none;'>" + feature_id + "</div>" +
                    "<div class='ui form'>" +
                        "<div class='fields'>" +
                            "<div class='eight wide field'>" +
                                "<label>字體大小</label>" +
                                "<select id='update_text_size'>" +
                                    "<option value='8px' " + ((text_size == 8)? "selected='selected'" : "") + ">8</option>" +
                                    "<option value='9px' " + ((text_size == 9)? "selected='selected'" : "") + ">9</option>" +
                                    "<option value='10px' " + ((text_size == 10)? "selected='selected'" : "") + ">10</option>" +
                                    "<option value='11px' " + ((text_size == 11)? "selected='selected'" : "") + ">11</option>" +
                                    "<option value='12px' " + ((text_size == 12)? "selected='selected'" : "") + ">12</option>" +
                                    "<option value='13px' " + ((text_size == 13)? "selected='selected'" : "") + ">13</option>" +
                                    "<option value='20px' " + ((text_size == 20)? "selected='selected'" : "") + ">20</option>" +
                                    "<option value='40px' " + ((text_size == 40)? "selected='selected'" : "") + ">40</option>" +
                                "</select>" +
                            "</div>" +
                            "<div class='eight wide field'>" +
                                "<label>字顏色</label>" +
                                "<input type='text' id='update_color_picker' />" +
                            "</div>" +
                        "</div>" +
                        "<div class='field'>" +
                            "<label>內容</label>" +
                            "<input type='text' id='update_text_content' value='" + text_style.getText() + "'/>" +
                        "</div>" +
                        "<div class='fields'>" +
                            "<div class='field'>" +
                                "<input type='radio' name='update_point_icon' " + ((img == "none")? "checked='checked'" : "") + " value='none' tabindex='0'>" +
                                "<p>無圖示</p>" +
                            "</div>" +
                            "<div class='field'>" +
                                "<input type='radio' name='update_point_icon' " + ((img == "img/marker01.png")? "checked='checked'" : "") + " value='img/marker01.png' tabindex='0'>" +
                                "<img class='ui small image' src='img/marker01.png'>" +
                            "</div>" +
                            "<div class='field'>" +
                                "<input type='radio' name='update_point_icon' " + ((img == "img/marker02.png")? "checked='checked'" : "") + " value='img/marker02.png' tabindex='0'>" +
                                "<img class='ui small image' src='img/marker02.png'>" +
                            "</div>" +
                            "<div class='field'>" +
                                "<input type='radio' name='update_point_icon' " + ((img == "img/marker03.png")? "checked='checked'" : "") + " value='img/marker03.png' tabindex='0'>" +
                                "<img class='ui small image' src='img/marker03.png'>" +
                            "</div>" +
                        "</div>" +
                        "<div class='field'>" +
                            "<label>字角度：<span id='update_text_arc'></span></label>" +
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

            case 'arrow left icon':
                var text_style = feature.getStyle().getText();
                var text_size = parseInt(((text_style.getFont()).split('px'))[0]);
                var line_style = feature.getStyle().getStroke();
                var line_width = parseInt(line_style.getWidth());

                content.innerHTML =
                    "<div style='display: none;'>" + feature_id + "</div>" +
                    "<div class='ui form'>" +
                        "<div class='fields'>" +
                            "<div class='eight wide field'>" +
                                "<label>字體大小</label>" +
                                "<select id='update_text_size'>" +
                                    "<option value='8px' " + ((text_size == 8)? "selected='selected'" : "") + ">8</option>" +
                                    "<option value='9px' " + ((text_size == 9)? "selected='selected'" : "") + ">9</option>" +
                                    "<option value='10px' " + ((text_size == 10)? "selected='selected'" : "") + ">10</option>" +
                                    "<option value='11px' " + ((text_size == 11)? "selected='selected'" : "") + ">11</option>" +
                                    "<option value='12px' " + ((text_size == 12)? "selected='selected'" : "") + ">12</option>" +
                                    "<option value='13px' " + ((text_size == 13)? "selected='selected'" : "") + ">13</option>" +
                                    "<option value='20px' " + ((text_size == 20)? "selected='selected'" : "") + ">20</option>" +
                                    "<option value='40px' " + ((text_size == 40)? "selected='selected'" : "") + ">40</option>" +
                                "</select>" +
                            "</div>" +
                            "<div class='eight wide field'>" +
                                "<label>字顏色</label>" +
                                "<input type='text' id='update_text_color_picker' />" +
                            "</div>" +
                        "</div>" +
                        "<div class='field'>" +
                            "<label>內容</label>" +
                            "<input type='text' id='update_text_content' value='" + text_style.getText() + "'/>" +
                        "</div>" +
                        "<div class='field'>" +
                            "<label>字角度：<span id='update_text_arc'></span></label>" +
                            "<div class='ui brown range'></div>" +
                        "</div>" +
                        "<div class='fields'>" +
                            "<div class='eight wide field'>" +
                                "<label>線寬</label>" +
                                "<select id='update_line_size'>" +
                                    "<option value='8' " + ((line_width == 8)? "selected='selected'" : "") + ">8</option>" +
                                    "<option value='9' " + ((line_width == 9)? "selected='selected'" : "") + ">9</option>" +
                                    "<option value='10' " + ((line_width == 10)? "selected='selected'" : "") + ">10</option>" +
                                    "<option value='11' " + ((line_width == 11)? "selected='selected'" : "") + ">11</option>" +
                                    "<option value='12' " + ((line_width == 12)? "selected='selected'" : "") + ">12</option>" +
                                    "<option value='13' " + ((line_width == 13)? "selected='selected'" : "") + ">13</option>" +
                                    "<option value='20' " + ((line_width == 20)? "selected='selected'" : "") + ">20</option>" +
                                    "<option value='40' " + ((line_width == 40)? "selected='selected'" : "") + ">40</option>" +
                                "</select>" +
                            "</div>" +
                            "<div class='eight wide field'>" +
                                "<label>線顏色</label>" +
                                "<input type='text' id='update_line_color_picker' />" +
                            "</div>" +
                        "</div>" +
                    "</div>";
                $("#update_text_color_picker").spectrum({
                    preferredFormat: "hex",
                    color: text_style.getFill().getColor(),
                    chooseText: "套用"
                });
                $("#update_line_color_picker").spectrum({
                    preferredFormat: "hex",
                    color: line_style.getColor(),
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

            case 'square outline icon':
                var text_style = feature.getStyle().getText();
                var text_size = parseInt(((text_style.getFont()).split('px'))[0]);
                var line_style = feature.getStyle().getStroke();
                var line_width = parseInt(line_style.getWidth());
                var fill_color = feature.getStyle().getFill().getColor();
                content.innerHTML =
                    "<div style='display: none;'>" + feature_id + "</div>" +
                    "<div class='ui form'>" +
                        "<div class='fields'>" +
                            "<div class='eight wide field'>" +
                                "<label>字體大小</label>" +
                                "<select id='update_text_size'>" +
                                    "<option value='8px' " + ((text_size == 8)? "selected='selected'" : "") + ">8</option>" +
                                    "<option value='9px' " + ((text_size == 9)? "selected='selected'" : "") + ">9</option>" +
                                    "<option value='10px' " + ((text_size == 10)? "selected='selected'" : "") + ">10</option>" +
                                    "<option value='11px' " + ((text_size == 11)? "selected='selected'" : "") + ">11</option>" +
                                    "<option value='12px' " + ((text_size == 12)? "selected='selected'" : "") + ">12</option>" +
                                    "<option value='13px' " + ((text_size == 13)? "selected='selected'" : "") + ">13</option>" +
                                    "<option value='20px' " + ((text_size == 20)? "selected='selected'" : "") + ">20</option>" +
                                    "<option value='40px' " + ((text_size == 40)? "selected='selected'" : "") + ">40</option>" +
                                "</select>" +
                            "</div>" +
                            "<div class='eight wide field'>" +
                                "<label>字顏色</label>" +
                                "<input type='text' id='update_text_color_picker' />" +
                            "</div>" +
                        "</div>" +
                        "<div class='field'>" +
                            "<label>內容</label>" +
                            "<input type='text' id='update_text_content' value='" + text_style.getText() + "' />" +
                        "</div>" +
                        "<div class='field'>" +
                            "<label>字角度：<span id='update_text_arc'></span></label>" +
                            "<div class='ui brown range' id='update_arc_ranger'></div>" +
                        "</div>" +
                        "<div class='fields'>" +
                            "<div class='field'>" +
                                "<label>邊寬</label>" +
                                "<select id='update_border_size'>" +
                                    "<option value='8' " + ((line_width == 8)? "selected='selected'" : "") + ">8</option>" +
                                    "<option value='9' " + ((line_width == 9)? "selected='selected'" : "") + ">9</option>" +
                                    "<option value='10' " + ((line_width == 10)? "selected='selected'" : "") + ">10</option>" +
                                    "<option value='11' " + ((line_width == 11)? "selected='selected'" : "") + ">11</option>" +
                                    "<option value='12' " + ((line_width == 12)? "selected='selected'" : "") + ">12</option>" +
                                    "<option value='13' " + ((line_width == 13)? "selected='selected'" : "") + ">13</option>" +
                                    "<option value='20' " + ((line_width == 20)? "selected='selected'" : "") + ">20</option>" +
                                    "<option value='40' " + ((line_width == 40)? "selected='selected'" : "") + ">40</option>" +
                                "</select>" +
                            "</div>" +
                            "<div class='five wide field'>" +
                                "<label>邊框顏色</label>" +
                                "<input type='text' id='update_border_color_picker' />" +
                            "</div>" +
                            "<div class='field'>" +
                                "<label>多邊形顏色</label>" +
                                "<input type='text' id='update_poly_color_picker' />" +
                            "</div>" +
                        "</div>" +
                    "</div>";
                $("#update_text_color_picker").spectrum({
                    preferredFormat: "hex",
                    color: text_style.getFill().getColor(),
                    chooseText: "套用"
                });
                $("#update_border_color_picker").spectrum({
                    preferredFormat: "hex",
                    color: line_style.getColor(),
                    chooseText: "套用"
                });
                $("#update_poly_color_picker").spectrum({
                    preferredFormat: "hex",
                    color: fill_color,
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
            case 'home':
            case 'h':
            case 'warning_sign':
                var text_style = feature.getStyle().getText();
                var new_style = new ol.style.Style({
                    image: (($("input[name=update_point_icon]:checked").val()=="none")?
                                new ol.style.Circle({
                                    radius: 0,
                                    fill: new ol.style.Fill({ color: "rgba(0,0,0,0)",})
                                }) :
                                new ol.style.Icon({
                                    anchor: [0.5, 46],
                                    anchorXUnits: 'fraction',
                                    anchorYUnits: 'pixels',
                                    scale: 0.125,
                                    src: $("input[name=update_point_icon]:checked").val(),
                                })),
                    stroke: new ol.style.Stroke({
                        color: "rgba(0,0,0,0)",
                        width: 0,
                    }),
                    fill: new ol.style.Fill({
                        color: "rgba(0,0,0,0)",
                    }),
                    text: new ol.style.Text({
                        font: $('#update_text_size').val()+" Microsoft Yahei,sans-serif",
                        fill: new ol.style.Fill({ color: ($('#update_text_color_picker').val()=="")? text_style.getFill().getColor() : $('#update_text_color_picker').val() }),
                        stroke: new ol.style.Stroke({color: 'yellow', width: 1}),
                        rotation: parseInt($('#update_text_arc').text())*Math.PI/180,
                        text: $('#update_text_content').val(),
                        offsetY: -10
                    })
                });
                feature.setStyle(new_style);
                break;
            case 'line':
                var text_style = feature.getStyle().getText();
                var line_style = feature.getStyle().getStroke();
                var new_style = new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 0,
                        fill: new ol.style.Fill({ color: "rgba(0,0,0,0)",})
                    }) ,
                    stroke: new ol.style.Stroke({
                        color: (($('#update_line_color_picker').val()=="")? line_style.getColor() : $('#update_line_color_picker').val()),
                        width: parseInt($('#update_line_size').val()),
                    }),
                    fill: new ol.style.Fill({
                        color: "rgba(0,0,0,0)",
                    }),
                    text: new ol.style.Text({
                        font: $('#update_text_size').val()+" Microsoft Yahei,sans-serif",
                        fill: new ol.style.Fill({ color: ($('#update_text_color_picker').val()=="")? text_style.getFill().getColor() : $('#update_text_color_picker').val() }),
                        stroke: new ol.style.Stroke({color: 'yellow', width: 1}),
                        rotation: parseInt($('#update_text_arc').text())*Math.PI/180,
                        text: $('#update_text_content').val(),
                        offsetY: -10
                    })
                });
                feature.setStyle(new_style);
                break;
            case 'polygon':
                var text_style = feature.getStyle().getText();
                var line_style = feature.getStyle().getStroke();
                var poly_color = feature.getStyle().getFill().getColor();
                var new_style = new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 0,
                        fill: new ol.style.Fill({ color: "rgba(0,0,0,0)",})
                    }),
                    stroke: new ol.style.Stroke({
                        color: (($('#update_border_color_picker').val()=="")? line_style.getColor() : $('#update_border_color_picker').val()),
                        width: parseInt($('#update_border_size').val()),
                    }),
                    fill: new ol.style.Fill({
                        color: (($('#update_poly_color_picker').val()=="")? poly_color : hexToRgbA($('#update_poly_color_picker').val())),
                    }),
                    text: new ol.style.Text({
                        font: $('#update_text_size').val()+" Microsoft Yahei,sans-serif",
                        fill: new ol.style.Fill({ color: ($('#update_text_color_picker').val()=="")? text_style.getFill().getColor() : $('#update_text_color_picker').val() }),
                        stroke: new ol.style.Stroke({color: 'yellow', width: 1}),
                        rotation: parseInt($('#update_text_arc').text())*Math.PI/180,
                        text: $('#update_text_content').val(),
                        offsetY: -10
                    })
                });
                feature.setStyle(new_style);
                break;
        }

        // update edit icon
        if((feature_id.split(' '))[0] == "font" || (feature_id.split(' '))[0] == "home" || (feature_id.split(' '))[0] == "h" || (feature_id.split(' '))[0] == "warning_sign"){
            for(i=0 ; i<$("#editor > tbody > tr > td:first-child > div").length ; i++)
                if($($("#editor > tbody > tr > td:first-child > div")[i]).text() == feature_id)
                    switch($("input[name=update_point_icon]:checked").val()){
                        case 'none':
                            $($("#editor > tbody > tr > td:first-child > div")[i]).parent().siblings("td").first().html("<i class='font icon'></i>(" + $('#update_text_content').val() + ")");
                            $($("#editor > tbody > tr > td:first-child > div")[i]).text("font " + (feature_id.split(' '))[1]);
                            feature.setId("font " + (feature_id.split(' '))[1]);
                            break;
                        case 'img/marker01.png':
                            $($("#editor > tbody > tr > td:first-child > div")[i]).parent().siblings("td").first().html("<i class='home icon'></i>(" + $('#update_text_content').val() + ")");
                            $($("#editor > tbody > tr > td:first-child > div")[i]).text("home " + (feature_id.split(' '))[1]);
                            feature.setId("home " + (feature_id.split(' '))[1]);
                            break;
                        case 'img/marker02.png':
                            $($("#editor > tbody > tr > td:first-child > div")[i]).parent().siblings("td").first().html("<i class='h icon'></i>(" + $('#update_text_content').val() + ")");
                            $($("#editor > tbody > tr > td:first-child > div")[i]).text("h " + (feature_id.split(' '))[1]);
                            feature.setId("h " + (feature_id.split(' '))[1]);
                            break;
                        case 'img/marker03.png':
                            $($("#editor > tbody > tr > td:first-child > div")[i]).parent().siblings("td").first().html("<i class='warning sign icon'></i>(" + $('#update_text_content').val() + ")");
                            $($("#editor > tbody > tr > td:first-child > div")[i]).text("warning_sign " + (feature_id.split(' '))[1]);
                            feature.setId("warning_sign " + (feature_id.split(' '))[1]);
                            break;
                    }
        }

        closer.onclick();
    });
    /*************** !update feature *************/

});

// transfer kml color code "abgr" to normal hex color code "#rgb"
function kmlColorCodeToHex(code){
    var r = code[6]+code[7];
    var g = code[4]+code[5];
    var b = code[2]+code[3];
    return "#"+r+g+b;
}
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

// set default features to prevent some error
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

/*
function drawPoint(color,radius){
    setDefaultFeatures();
    type = "Point";
    point_color = color;
    point_radius = radius;
    runBrush();
}
*/

function drawLine(){
    setDefaultFeatures();
    type = "LineString";

    text_content = $('#line_text_content').val();//content;
    text_color = $('#line_menu > .fields').first().children(".field:nth-child(2)").children('.color_picker').val();//color;
    text_size = $('#line_text_size').val();//size;
    text_rotation = parseInt($('#line_text_arc').text())*Math.PI/180;

    line_color = $('#line_menu > .fields:nth-child(4)').children(".field:nth-child(2)").children('.color_picker').val();
    line_width = parseInt($('#line_size').val());

    runBrush("line");
}

function drawPolygon(){
    setDefaultFeatures();
    type = "Polygon";

    text_content = $('#poly_text_content').val();//content;
    text_color = $('#poly_menu > .fields').first().children(".field:nth-child(2)").children('.color_picker').val();//color;
    text_size = $('#poly_text_size').val();//size;
    text_rotation = parseInt($('#poly_text_arc').text())*Math.PI/180;

    line_color = $('#poly_menu > .fields:nth-child(4)').children(".field:nth-child(2)").children('.color_picker').val();
    line_width = parseInt($("#poly_border_size").val());

    if ($('#poly_menu > .fields:nth-child(4)').children(".field:nth-child(3)").children('.color_picker').val() == "") {
        plane_color = hexToRgbA("#000000");
    }else{
        plane_color = hexToRgbA($('#poly_menu > .fields:nth-child(4)').children(".field:nth-child(3)").children('.color_picker').val());
    }
    runBrush("polygon");
}

/*
function drawCircle(circle_plane_color,circle_line_color){
    setDefaultFeatures();
    type = "Circle";
    plane_color = circle_plane_color;
    line_color = circle_line_color;
    line_width = 3;
    runBrush();
}
*/

function drawIconText(/*content,color,size,rotation*/){
    setDefaultFeatures();
    type = "Point";
    text_content = $('#point_text_content').val();//content;
    text_color = $('#point_menu > .fields').first().children(".field:nth-child(2)").children('.color_picker').val();//color;
    text_size = $('#point_text_size').val();//size;
    text_rotation = parseInt($('#point_text_arc').html())*Math.PI/180;
    var draw_type = "font";
    if ($("input[name=point_icon]:checked").val() != "none") {
        icon_url = $("input[name=point_icon]:checked").val();
        isIcon = true;
        switch(icon_url){
            case 'img/marker01.png': draw_type = "home";        break;
            case 'img/marker02.png': draw_type = "h";           break;
            case 'img/marker03.png': draw_type = "warning_sign";    break;
        }
    }
    runBrush(draw_type);
}

/*
function putIcon(url){
    setDefaultFeatures();
    type = "Point";

    console.log( icon_url);

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
*/

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

var $cnt = 0;
// draw the shape on the map and append it to editor to make it editable
function runBrush(draw_type) {
    draw = new ol.interaction.Draw({
        features: features,
        type: /** @type {ol.geom.GeometryType} */ (type)
    });
    map.addInteraction(draw);


    if(is_measure)  createMeasureTooltip();


    draw.on('drawstart',function(event){
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
                stroke: new ol.style.Stroke({color: 'yellow', width: 0.8}),
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
                    "<h2 class='ui center aligned header'>" + $cnt + "</h2>" +
                    "<div style='display: none;'>" + (draw_type + " " + $cnt) + "</div>" +
                "</td>" +
                "<td>" +
                    "<i class='" + ((draw_type=="line")? "arrow left" : (draw_type=="polygon")? "square outline" : (draw_type=="warning_sign")? "warning sign" : draw_type) + " icon'></i>" +
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
        $cnt++;

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

// to choose if the point is a circle or a image
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

function hexToRgbA(hex){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+', 0.5)';
    }
    throw new Error('Bad Hex');
}

