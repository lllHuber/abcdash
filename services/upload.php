<?php

require_once('headers.php');
require_once('connection.php');
require_once('functions.php');
require_once('classes/class.lstv.php');



$resultArray = array('status' => 'error');
	
if ( isset($_FILES) && isset($_POST) ) {
	global $PDOM;
	
	$dir = "../application/assets/files/pdf-handbuch/";
	$pdf = $dir . date("Ymd-His") . "_" . basename($_FILES["pdf"]["name"]);
	$PDF = str_replace("../", "", $pdf);
	
	if (move_uploaded_file($_FILES["pdf"]["tmp_name"], $pdf)) {
		
		$stmt = $PDOM->prepare("
			INSERT INTO
				handbook_chapters
				(
					title,
					category_id,
					pdf,
					active
				)
			VALUES
				(
					:title,
					:category_id,
					:pdf,
					1
				)		
		");
		$stmt->bindParam("title", $_POST['title']);
		$stmt->bindParam("category_id", $_POST['category']);
		$stmt->bindParam("pdf", $PDF);
		
		if ( $stmt->execute() ) {
			$resultArray['status'] = 'success';
			$resultArray['chapter'] = array(
				"title" => $_POST['title'],
				"category_id" => $_POST['category'],
				"pdf" => $PDF,
				"id" => $PDOM->lastInsertId()
			);
			$resultArray['message'] = 'Das Kapitel wurde erfolgreich erstellt.';
		}			
	}	
}

echo json_encode($resultArray);

?>
