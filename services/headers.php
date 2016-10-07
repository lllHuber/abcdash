<?php

$http_origin = $_SERVER['HTTP_ORIGIN'];

if ($http_origin == "http://localhost:7777") {

	header("Access-Control-Allow-Origin: $http_origin");
	header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
	header('Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS');
	header('Access-Control-Allow-Credentials: true');
}

?>