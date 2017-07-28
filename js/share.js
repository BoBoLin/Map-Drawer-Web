
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

        var vectorSource = featureOverlay.getSource();
        var features = [];
        /*****************handle text export*******************/
        var myTexts = "";
        vectorSource.forEachFeature(function(feature) {
            var id = feature.getId();
            var size = feature.getStyle().getText().getFont().replace("Microsoft Yahei,sans-serif","");;
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
        var kml_s = string.substr(0,pos) + myTexts + "</kml>";

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

        var vectorSource = featureOverlay.getSource();
        var features = [];
        /*****************handle text export*******************/
        var myTexts = "";
        vectorSource.forEachFeature(function(feature) {
            var id = feature.getId();
            var size = feature.getStyle().getText().getFont().replace("Microsoft Yahei,sans-serif","");;
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
        var kml_s = string.substr(0,pos) + myTexts + "</kml>";

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