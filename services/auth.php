<?php

$http_origin = $_SERVER['HTTP_ORIGIN'];

if ($http_origin == "http://localhost:7777" || $http_origin == "http://lifestyletv.se") {
	header("Access-Control-Allow-Origin: $http_origin");
	header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
	header('Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS');
	header('Access-Control-Allow-Credentials: true');
}

require_once('headers.php');
require_once('connection.php');
require_once('functions.php');



if(isset($_POST)) {

	if(file_get_contents('php://input')) {
		
		$data = file_get_contents('php://input');
		$data = json_decode($data);
		
		$email = $data->username;
		$password = sha1($data->password);
		
		$userData = getDatabaseResult('lifestyletv', 'users', array('email', 'password'), array($email, $password));

		// LOGIN SUCCESSFUL
		if($userData) {
			
			// Limit To 1 Result
			$userData = $userData[0];
			
			// Build Result Array
			$resultArray = array(
				'username' => $userData['username'],
				'firstName' => $userData['first_name'],
				'lastName' => $userData['last_name'],
				'email' => $userData['email'],
				'image' => $userData['image'],
				'lsods' => $userData['lsods'],
				'lscms' => $userData['lscms']
			);			

			// Build JSON Web Token
			$header = new stdClass();
			$header->typ = "JWT";
			$header->alg = "HS256";
			$header = json_encode($header, TRUE);
			$header = base64_encode($header);
			
			$payload = json_encode($resultArray, TRUE);
			$payload = base64_encode($payload);
			
			$signature = hash_hmac('sha256', $header.'.'.$payload, $GLOBALS['secret']);
			
			$jwt = $header.'.'.$payload.'.'.$signature;
			
			// Return JSON Web Token
			echo json_encode(array('status' => 'success', 'message' => 'Login successful', 'data' =>$jwt));
		
		// LOGIN INVALID
		} else {
			echo json_encode(array('status' => 'error', 'message' => 'Login invalid'));
		}
		
	} else {
		echo json_encode(array('status' => 'error', 'message' => 'Invalid request'));
		die();
	}
}









?>