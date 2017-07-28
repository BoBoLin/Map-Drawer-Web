
//後端處理資料庫存取之php
var back_ip = "http://140.116.245.84/geo/Drawer/db_connect.php";

$(document).ready(function () {
	/********* auto import ***********/
    /*
    當分享完後得到的url, parse出id向database拿到此id的kml資訊
    */
    var href = location.href;
    var split_href;
    var kml_id;
    if(location.href.indexOf("?") > 0)
    {
        split_href = href.split('?');
        kml_id = split_href[1];

        var formData = {type: "read", id: kml_id}
        $.ajax({
            url: back_ip,
            type: "POST",
            data: formData,
            dataType: 'jsonp',
            jsonpCallback: 'handler',
            success: function(response) {
                console.log(response);
                if(response.kml == null)  //如果id不在資料庫中, reload map首頁
                {
                    alert("The information hasn't saved.");
                    //reload main web
                    window.location.href = "http://140.116.245.84/git/Map-Drawer-Web/drawer.html";
                }

                else
                    import_kml_string(response.kml);
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                console.log(textStatus, errorThrown);
            }
        });
    }
    else
    {
        kml_id = 0;
    }
    /********* !auto import ***********/


    /*************** export KML **************/
    var exportKMLElement = document.getElementById('export-kml');
    exportKMLElement.addEventListener('click', function(e) {
        var vectorSource = featureOverlay.getSource();
        var features = [];
        /*****************handle text export*******************/
        var myTexts = "";
        vectorSource.forEachFeature(function(feature) {
            var id = feature.getId();
            var size = feature.getStyle().getText().getFont().replace("Microsoft Yahei,sans-serif","");
            var rotation = feature.getStyle().getText().getRotation();
            var content = feature.getStyle().getText().getText();
            if(content.trim()){ // if text is not empty
                myText = "<myText id=\""+id+"\" size=\""+size+"\" rotation=\""+rotation+"\"></myText>";
                myTexts += myText;
            }
            features.push(feature);
        });
        var format = new ol.format.KML();
        var string = format.writeFeatures(features);
        var pos = string.indexOf("</kml>");
        var output = string.substr(0,pos) + myTexts + "</kml>";

        var base64 = btoa(unescape(encodeURIComponent(output)));
        /*****************************************************/

        exportKMLElement.href = 'data:application/vnd.google-earth.kml+xml;base64,' + base64;
    }, false);

    /*************** !export KML **************/

    /*************** import KML *************/
    $("#import-kml").change(function(){
        var uploader_dom = document.getElementById('import-kml');
        var kml_str = "";
        var reader = new FileReader();
        reader.onload = function (event) {
            // read feature to layer
            kml_str = event.target.result;
            import_kml_string(kml_str);
        };
        reader.readAsText(uploader_dom.files[0]);
    });

    /*************** !import KML *************/

});

function import_kml_string(kml_str) {
    var format = new ol.format.KML();
    featureOverlay.getSource().addFeatures(format.readFeatures(kml_str));
    featureOverlay.setMap(map);
    var x = $.parseXML(kml_str);
    var objs = $(x).find("Placemark");
    for(var i=0;i<objs.size();i++){
        var id = $(objs[i]).attr("id");
        setDefaultFeatures();
        switch((id.split(' '))[0]){
            case 'font':
                type = "Point";
                text_content = $(objs[i]).find("name").text();
                text_color = kmlColorCodeToHex($(objs[i]).find("Style").find("LabelStyle").find("color").text());
                text_size = $(x).find("myText[id=\""+id+"\"]").attr("size");
                text_rotation = parseFloat($(x).find("myText[id=\""+id+"\"]").attr("rotation"));
                isIcon = false;
            break;
            case 'line':
                type = "LineString";
                text_content = $(objs[i]).find("name").text();
                text_color = kmlColorCodeToHex($(objs[i]).find("Style").find("LabelStyle").find("color").text());
                text_size = $(x).find("myText[id=\""+id+"\"]").attr("size");
                text_rotation = parseFloat($(x).find("myText[id=\""+id+"\"]").attr("rotation"));
                isIcon = false;
                line_color = kmlColorCodeToHex($(objs[i]).find("Style").find("LineStyle").find("color").text());
                line_width = parseInt($(objs[i]).find("Style").find("LineStyle").find("width").text());
            break;
            case 'polygon':
                type = "Polygon";
                text_content = $(objs[i]).find("name").text();
                text_color = kmlColorCodeToHex($(objs[i]).find("Style").find("LabelStyle").find("color").text());
                text_size = $(x).find("myText[id=\""+id+"\"]").attr("size");
                text_rotation = parseFloat($(x).find("myText[id=\""+id+"\"]").attr("rotation"));
                isIcon = false;
                line_color = kmlColorCodeToHex($(objs[i]).find("Style").find("LineStyle").find("color").text());
                line_width = parseInt($(objs[i]).find("Style").find("LineStyle").find("width").text());
                plane_color = hexToRgbA(kmlColorCodeToHex($(objs[i]).find("Style").find("PolyStyle").find("color").text()));
            break;
            case 'home':
            case 'h':
            case 'warning_sign':
                type = "Point";
                text_content = $(objs[i]).find("name").text();
                text_color = kmlColorCodeToHex($(objs[i]).find("Style").find("LabelStyle").find("color").text());
                text_size = $(x).find("myText[id=\""+id+"\"]").attr("size");
                text_rotation = parseFloat($(x).find("myText[id=\""+id+"\"]").attr("rotation"));
                isIcon = true;
                icon_url = $(objs[i]).find("Style").find("IconStyle").find("Icon").find("href").text();
            break;
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
                stroke: new ol.style.Stroke({color: 'yellow', width: 0.8}),
                rotation: text_rotation,
                text: text_content,
                offsetY: -10
            })
        });
        var feature = featureOverlay.getSource().getFeatureById(id);
        console.log(feature);
        feature.setStyle(s);
        var draw_type = (id.split(' '))[0];
        var $cnt = (id.split(' '))[1];
        // add to editor
        $("#editor > tbody").append(
            "<tr>" +
                "<td>" +
                    "<h2 class='ui center aligned header'>" + i + "</h2>" +
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
    };
    // draw on map
    var load_interaction = new ol.interaction.Modify({
        features: new ol.Collection(featureOverlay.getSource().getFeatures())
    });
    map.addInteraction(load_interaction);
}
