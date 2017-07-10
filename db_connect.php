<?php

header("Content-type: application/json; charset=utf-8"); 

$servername = "";
$username = "";
$password = "";
$dbname = "geo";

$type = $_POST["type"];  //判斷為insert or read

//------- insert to db -------------
if($type == 'insert')
{
	$kml_str = $_POST["kml_str"];
	$date_str = $_POST["date_str"];
	$conn = new mysqli($servername, $username, $password, $dbname);
	// Check connection
	if ($conn->connect_error) {
	    die("Connection failed: " . $conn->connect_error);
	}
	date_default_timezone_set('Asia/Taipei');
	$t = time();
	$pretty_date = date("Y-m-d H:i:s", ($t));

	$sql = "INSERT INTO kml (id, kml_content, date)
	VALUES ('$date_str', '$kml_str', '$pretty_date')";

	if ($conn->query($sql) === TRUE) {
	    //echo "New record created successfully\n";
	    $status =  "ok";
	} else {
	    //echo "Error: " . $sql . "<br>" . $conn->error;
	    $status =  "err";
	}
	$conn->close();

	$data = json_encode(array("error" => $status));
	echo "handler(" . $data . ");";
}

//------- read from db -------------
else if($type == 'read')
{
	$read_id = $_POST["id"];

	mysql_connect("localhost", "root", "diclabisgood");
	mysql_select_db("geo");
	mysql_query("set name utf8"); //以utf8讀取資料,讓資料可以讀取中文
	$data = mysql_query("SELECT * FROM kml WHERE id = '$read_id'");

	$rs=mysql_fetch_row($data);
	//echo $rs[0]."　";
	//echo $rs[2]."<br>";

	$data = json_encode(array("kml" => $rs[1]));

	//jsonp 方法 
	//echo "{$_GET['callback']}($data)";
	echo "handler(" . $data . ");";

}

?>