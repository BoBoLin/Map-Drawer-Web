
//後端處理資料庫存取之php
var back_ip = "http://140.116.245.84/geo/Drawer/db_connect.php";

$(document).ready(function () {

	/*************** share **************/
    //---facebook init----
    var dt;
    var time;
    var rand;

    window.fbAsyncInit = function() {
        FB.init({
            appId      : '320240928434373', //appId是先註冊好的
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

    //點選fb share
    document.getElementById('fb_share').onclick = function() {
        //將id 使用時間+亂數組成
        dt = new Date();
        time = dt.getFullYear() +""+(dt.getMonth()+1) +""+ dt.getDate() +""+dt.getHours() +""+ dt.getMinutes() +""+ dt.getSeconds();
        rand = Math.floor((Math.random() * 100000) + 1);

        var sourceProj = map.getView().getProjection();
        var vectorSource;
        var features = [];
        var myTexts = [];
        if(featureOverlay){
            vectorSource = featureOverlay.getSource(); 
            vectorSource.forEachFeature(function(feature) {               
                feature.setGeometry(feature.getGeometry().clone().transform(sourceProj, 'EPSG:4326') );
                var text = feature.getStyle().getText().getText();
                var pos = getPosition(feature);
                var rotation = feature.getStyle().getText().getRotation();
                var myText = {text:text,pos:pos,rotation:rotation};
                myTexts.push(myText);
                features.push(feature);
            });                       
        }
        // measure layer
        /*
        var mVectorSource;
        if(measure){
            mVectorSource = measure.getSource();        
            mVectorSource.forEachFeature(function(feature){
                feature.setGeometry(feature.getGeometry().clone().transform(sourceProj, 'EPSG:4326') );
                features.push(feature);
            });
        }
        */
        var format = new ol.format.KML();
        var kml_str = format.writeFeatures(features);
        if(featureOverlay){
            vectorSource = featureOverlay.getSource(); 
            vectorSource.forEachFeature(function(feature) {
                feature.setGeometry(feature.getGeometry().clone().transform('EPSG:4326', sourceProj) );
            });                       
        }
        // measure layer
        var mVectorSource;
        if(measure){
            mVectorSource = measure.getSource();        
            mVectorSource.forEachFeature(function(feature){
                feature.setGeometry(feature.getGeometry().clone().transform('EPSG:4326', sourceProj) );
            });
        }        
        var doc = $.parseXML(kml_str);
        var objs = $(doc).find("Placemark");
        for(var i=0;i<objs.size();i++){
            //add empty iconstyle (to prevent have pin.png in google earth)
            var iconStyleLength = $(objs[i]).find("IconStyle").length;
            if(iconStyleLength==0){
                $(objs[i]).find("Style").append("<IconStyle><Icon></Icon></IconStyle>");
            }
            // add text rotation
            var rotation = getRotation(myTexts,objs[i]);
            $(objs[i]).find("Style").append("<MyRotationStyle>"+rotation+"</MyRotationStyle>");
        }
        var kml_s = $(doc).find("kml").prop('outerHTML');

        var url = 'http://140.116.245.84/git/Map-Drawer-Web/drawer.html?' + time + "" +rand;

        FB.ui({
            method: 'share',
            href: url ,
        }, function(response){});

        //將kml與id資訊建檔於database
        var formData = {kml_str: kml_s, type: "insert", date_str: time+ ""+ rand}
        $.ajax({
            url: back_ip,
            type: "POST",
            data: formData,
            dataType: 'jsonp',
            jsonpCallback: 'handler',
            success: function(response) {
                console.log(response);
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                console.log(textStatus, errorThrown);
            }
        });
    };

    //點選email share
    $('#emailLink').on('click', function (event) {
        dt = new Date();
        time = dt.getFullYear() +""+(dt.getMonth()+1) +""+ dt.getDate() +""+dt.getHours() +""+ dt.getMinutes() +""+ dt.getSeconds();
        rand = Math.floor((Math.random() * 100000) + 1);

        var sourceProj = map.getView().getProjection();
        var vectorSource;
        var features = [];
        var myTexts = [];
        if(featureOverlay){
            vectorSource = featureOverlay.getSource(); 
            vectorSource.forEachFeature(function(feature) {               
                feature.setGeometry(feature.getGeometry().clone().transform(sourceProj, 'EPSG:4326') );
                var text = feature.getStyle().getText().getText();
                var pos = getPosition(feature);
                var rotation = feature.getStyle().getText().getRotation();
                var myText = {text:text,pos:pos,rotation:rotation};
                myTexts.push(myText);
                features.push(feature);
            });                       
        }
        // measure layer
        /*
        var mVectorSource;
        if(measure){
            mVectorSource = measure.getSource();        
            mVectorSource.forEachFeature(function(feature){
                feature.setGeometry(feature.getGeometry().clone().transform(sourceProj, 'EPSG:4326') );
                features.push(feature);
            });
        }
        */
        var format = new ol.format.KML();
        var kml_str = format.writeFeatures(features);
        if(featureOverlay){
            vectorSource = featureOverlay.getSource(); 
            vectorSource.forEachFeature(function(feature) {
                feature.setGeometry(feature.getGeometry().clone().transform('EPSG:4326', sourceProj) );
            });                       
        }
        // measure layer
        var mVectorSource;
        if(measure){
            mVectorSource = measure.getSource();        
            mVectorSource.forEachFeature(function(feature){
                feature.setGeometry(feature.getGeometry().clone().transform('EPSG:4326', sourceProj) );
            });
        }        
        var doc = $.parseXML(kml_str);
        var objs = $(doc).find("Placemark");
        for(var i=0;i<objs.size();i++){
            //add empty iconstyle (to prevent have pin.png in google earth)
            var iconStyleLength = $(objs[i]).find("IconStyle").length;
            if(iconStyleLength==0){
                $(objs[i]).find("Style").append("<IconStyle><Icon></Icon></IconStyle>");
            }
            // add text rotation
            var rotation = getRotation(myTexts,objs[i]);
            $(objs[i]).find("Style").append("<MyRotationStyle>"+rotation+"</MyRotationStyle>");
        }
        var kml_s = $(doc).find("kml").prop('outerHTML');

        var url = 'http://140.116.245.84/git/Map-Drawer-Web/drawer.html?' + time + "" +rand;
        event.preventDefault();
        var email = '';
        var subject = 'share the geo info';
        var emailBody = 'url: ' + url;
        window.location = 'mailto:' + email + '?subject=' + subject + '&body=' + emailBody;

        var formData = {kml_str: kml_s, type: "insert", date_str: time+ ""+ rand}

        //將kml與id資訊建檔於database
        $.ajax({
            url: back_ip,
            type: "POST",
            data: formData,
            dataType: 'jsonp',
            jsonpCallback: 'handler',
            success: function(response) {
                console.log(response);
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                console.log(textStatus, errorThrown);
            }
        });

    });
    /*************** !share **************/

});