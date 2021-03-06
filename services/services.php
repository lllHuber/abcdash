<?php

require_once('headers.php');
require_once('connection.php');
require_once('functions.php');
require_once('classes/class.lstv.php');


if (isset($_POST['ws']) && $_POST['ws'] != ""  ) {
	switch ($_POST['ws']) {
	case 'add_chapter':
			echo add_chapter();
			break;
		default:
			break;
	}
}



if (isset($_GET['ws']) && $_GET['ws'] != ""  ) {
	switch ($_GET['ws']) {
		case 'web_service':
			echo web_service();
			break;
		case 'get_all_items':
			echo get_all_items($_GET['enddate']);
			break;
		case 'get_all_warehouses':
			echo get_all_warehouses();
			break;
		case 'get_all_vendors':
			echo get_all_vendors();
			break;
		case 'get_all_customers':
			echo get_all_customers();
			break;
		case 'get_all_sales':
			echo get_all_sales($_GET['startdate'], $_GET['enddate']);
			break;
		case 'get_all_commissions':
			echo get_all_commissions($_GET['startdate'], $_GET['enddate']);
			break;
		case 'get_all_taxes':
			echo get_all_taxes();
			break;
		case 'get_handbook':
			echo get_handbook();
			break;
		case 'delete_chapter':
			echo delete_chapter($_GET['id']);
			break;
		default:
			break;
	}
}

function web_service() {

}

function get_all_items($enddate = false) {
	global $PDOF;
	$resultArray = array('status' => 'error');
	
	// DEFINE VARIABLES
	if(!$enddate) {
		$enddate = Date('Y-m-d');
	}
	$stichjahr = Date('Y');
	
	$bestand = array();
	$artikelbestand = array();
	$html = '';
	$array = array();
	
	$verlustfaktor = array(
		0 => 0.5,
		1 => 0.5,
		2 => 0.3,
		3 => 0.1,
		4 => 0.05
	);
	
	
	// Lies Alle Artikel Aus Amicron DB
	$stmt = $PDOF->query("
		SELECT
			ARTIKEL.ARTIKELNR,
			ARTIKEL.LFDNR,
			ARTIKEL.BEZEICHNUNG,
			ARTIKEL.BESTAND,
			ARTIKEL.LETZTERVERKAUF,
			ARTIKEL.VK1 AS NETTOPREIS,
			ARTIKEL.VK1BRUTTO AS BRUTTOPREIS,
			ARTIKEL.ANGELEGTAM AS EINGESTELLT,
			ARTIKEL.LAGERLFDNR AS LAGER,
			ARTIKEL.LIEFERANTLFDNR,
      LIST(ARTBUCH.ANGELEGTAM, ',') AS BUCHUNGSTAG,
			LIST(ARTBUCH.BEWEGUNG, ',') AS BEWEGUNG,
			LAGER.LAGER,
			LAGER.LFDNR AS LAGERID,
			ADRESSEN.LFDNR AS ADRESSENLFDNR,
			ADRESSEN.SUCHBEGRIFF AS LIEFERANT,
			ADRESSEN.LAND AS LIEFERANTLAND
		FROM
			ARTIKEL
		LEFT JOIN
			ARTBUCH
		ON
			ARTBUCH.ARTIKELLFDNR = ARTIKEL.LFDNR
		LEFT JOIN
			LAGER
		ON
			ARTIKEL.LAGERLFDNR = LAGER.LFDNR
		LEFT JOIN
			ADRESSEN
		ON
			ADRESSEN.LFDNR = ARTIKEL.LIEFERANTLFDNR
		WHERE
			ARTBUCH.ANGELEGTAM <= '{$enddate} 23:59:59'
        GROUP BY
        	ARTIKEL.ARTIKELNR,
            ARTIKEL.LFDNR,
            ARTIKEL.BEZEICHNUNG,
			ARTIKEL.BESTAND,
			ARTIKEL.LETZTERVERKAUF,
            ARTIKEL.VK1,
			ARTIKEL.VK1BRUTTO,
            ARTIKEL.ANGELEGTAM,
			ARTIKEL.LAGERLFDNR,
			LAGER.LAGER,
			LAGER.LFDNR,
			ADRESSEN.LFDNR,
			ADRESSEN.SUCHBEGRIFF,
			ADRESSEN.LAND,
			ARTIKEL.LIEFERANTLFDNR
		ORDER BY
			ARTIKEL.BEZEICHNUNG
	");
	
	if($stmt->execute()) {
	
		$bestand = $stmt->fetchAll(PDO::FETCH_ASSOC);
		
		// Bereinige Artikelbuchungen
		foreach($bestand as $key => $artikel) {
			
			// Keine Geschenkgutscheine
			if (preg_match("/Geschenkgutschein/", $artikel['BEZEICHNUNG']) || preg_match("/Gutschein/", $artikel['BEZEICHNUNG'])) {
				continue;
			}
			
			// Keine Antiquarischen Artikel
			if (preg_match("/A$/", trim($artikel['ARTIKELNR']))) {
				continue;
			}
			
			// KEIN BIFI ( = GESUNDKOST)
			if (preg_match("/BIFI/i", trim($artikel['ARTIKELNR']))) {
				continue;
			}
			
			// KEIN WG ( = GESUNDKOST)
			if (preg_match("/WG/i", trim($artikel['ARTIKELNR']))) {
				continue;
			}
			
			// Kein "Flucht zu Gott"
			if (preg_match("/Flucht zu Gott/i", trim($artikel['BEZEICHNUNG']))) {
				continue;
			}
			
			// Kein "Komm in die Stille"
			if (preg_match("/Komm in die Stille/i", trim($artikel['BEZEICHNUNG']))) {
				continue;
			}
			
			// Kein "Leben an der Kraftquelle"
			if (preg_match("/Leben an der Kraftquelle/i", trim($artikel['BEZEICHNUNG']))) {
				continue;
			}
			
			// Kein "Zeichen der Hoffnung"
			if (preg_match("/Zeichen der Hoffnung/i", trim($artikel['BEZEICHNUNG']))) {
				continue;
			}
			
			// Füge Artikelgruppe "Bücher, Hörbücher" hinzu
			if (preg_match("/DVD/i", trim($artikel['BEZEICHNUNG'])) ||
				preg_match("/CD/i", trim($artikel['BEZEICHNUNG'])) ||
				preg_match("/MP3/i", trim($artikel['BEZEICHNUNG']))) {

				// Hörbücher zählen zu Büchern -> inkludieren
				if(!preg_match("/Hörbuch/i", trim($artikel['BEZEICHNUNG'])) &&
				   !preg_match("/Hörbücher/i", trim($artikel['BEZEICHNUNG']))) {
					$artikel['GRUPPE'] = '2'; // DVDs, CDs, MP3s, Hörspiele
				}
			}
			
			// Füge Artikelgruppe "DVDs, CDs, MP3s, Hörspiele" hinzu
			if (!preg_match("/DVD/i", trim($artikel['BEZEICHNUNG'])) &&
				!preg_match("/CD/i", trim($artikel['BEZEICHNUNG'])) &&
				!preg_match("/MP3/i", trim($artikel['BEZEICHNUNG']))) {
				$artikel['GRUPPE'] = '1'; // Bücher, Hörbücher
			} else
			
			// Hörbücher zählen zu Büchern -> exkludieren
			if(preg_match("/Hörbuch/i", trim($artikel['BEZEICHNUNG'])) ||
			   preg_match("/Hörbücher/i", trim($artikel['BEZEICHNUNG']))) {
				$artikel['GRUPPE'] = '1'; // Bücher, Hörbücher
			}
			
			
			

			// Artikel muss Einen Bestand Haben
			if($artikel['BESTAND'] <= 0) {
				continue;
			}
	
			// Artikel darf noch nicht im Bestand sein
			$s = 0;
			foreach($artikelbestand as $element) {
				if(isset($element['artikelnr']) && $element['artikelnr'] == $artikel['ARTIKELNR']) {
					$s = 1;
					break;
				}
			}
			
			// Wandle Arrays In Listen Um
			$buchungstag = explode(',',$artikel['BUCHUNGSTAG']);
			$bewegung = explode(',',$artikel['BEWEGUNG']);
			
			// Ordne Arrays Nach Datum (NEU -> ALT)
			$artikel['BEWEGUNG'] = array();
			foreach ($bewegung as $key => $item) {
				$artikel['BEWEGUNG'][] = array (
					'BUCHUNGSTAG' => $buchungstag[$key],
					'BEWEGUNG' => $bewegung[$key]
				);
			}
			usort($artikel['BEWEGUNG'], 'sortByDate');

			$lagerbestand = $artikel['BESTAND'];
							
			// WARENEINGÄNGE
			$gesamtwert = 0;
			// Keine Wareneingänge vorhanden - Lagerbestand kommt vom Erstellungsdatum des Artikels
			if(count($artikel['BEWEGUNG']) == 0 ) {
		
				$alter = $stichjahr - explode('-', $artikel['EINGESTELLT'])[0];
				if($alter > 4) { $alter = 4; }
				$wert = $artikel['NETTOPREIS'] * $verlustfaktor[$alter] * $lagerbestand;
				$gesamtwert = $gesamtwert + $wert;
				//$html .= '<small>'.explode(' ', $artikel['EINGESTELLT'])[0].': '.$lagerbestand.' Artikel (Wert: '.round($wert, 2).'€)</small><br>';
				//$html .= explode(' ', $artikel['EINGESTELLT'])[0].': '.$lagerbestand.' Artikel (Wert: '.round($wert, 2).'€); ';
				$array[] = explode(' ', $artikel['EINGESTELLT'])[0].': '.$lagerbestand.' Artikel (Wert: '.round($wert, 2).'€)';
			
			// Bewegungen vorhanden	
			} else {
				$x = 0;
				$y = 0;
				$z = 0;
				$einkäufe = 0;
				$anzahl = count($artikel['BEWEGUNG']);
				for($i = 0; $i < count($artikel['BEWEGUNG']); $i++) {
					
					// Artikel muss Zuwachs haben
					if($artikel['BEWEGUNG'][$i]['BEWEGUNG'] > 0) {
		
					
						$einkauf = round($artikel['BEWEGUNG'][$i]['BEWEGUNG']);
						$datum = explode(' ', $artikel['BEWEGUNG'][$i]['BUCHUNGSTAG'])[0];
						
						$alter = $stichjahr - explode('-', $artikel['BEWEGUNG'][$i]['BUCHUNGSTAG'])[0];
						if($alter > 4) { $alter = 4; }
						
						// Relevante Wareneingänge
						$einkäufe = $einkäufe + $einkauf;
						if($lagerbestand - $einkäufe < 0) {
							$check = $lagerbestand - ($einkäufe - $einkauf);
							if($check != 0) {
								$wert = $artikel['NETTOPREIS'] * $verlustfaktor[$alter] * $check;
								$gesamtwert = $gesamtwert + $wert;
								//$html .= '<small>'.$datum.': '.$check.' Artikel (Wert: '.round($wert, 2).'€)</small><br>';
								//$html .= $datum.': '.$check.' Artikel (Wert: '.round($wert, 2).'€); ';
								$array[] = $datum.': '.$check.' Artikel (Wert: '.round($wert, 2).'€)';
							}
							break;
						} else {
							$wert = $artikel['NETTOPREIS'] * $verlustfaktor[$alter] * $einkauf;
							$gesamtwert = $gesamtwert + $wert;
							//$html .= '<small>'.$datum.': '.$einkauf.' Artikel (Wert: '.round($wert, 2).'€)</small><br>';
							//$html .= $datum.': '.$einkauf.' Artikel (Wert: '.round($wert, 2).'€); ';
							$array[] = $datum.': '.$einkauf.' Artikel (Wert: '.round($wert, 2).'€)';
							$x++;
						}
					}
				}
				
				// Falls nur Bewegungen mit 0 Zuwachs vorhanden -> letzter Wareneingang = Erstellungsdatum des Artikels
				// Falls nur eine Bewegung verzeichnet -> letzter Wareneingang = Erstellungsdatum des Artikels
				if($x == 0 && $y > 0) {
					$wert = $artikel['NETTOPREIS'] * $verlustfaktor[$alter] * $artikel['BEWEGUNG'][$i]['BEWEGUNG'];
					$gesamtwert = $gesamtwert + $wert;
					//$html .= '<small>'.explode(' ', $artikel['EINGESTELLT'])[0].': '.round($artikel['BEWEGUNG'][$i]['BEWEGUNG']).' Artikel (Wert: '.round($wert, 2).'€)</small>';
					//$html .= explode(' ', $artikel['EINGESTELLT'])[0].': '.round($artikel['BEWEGUNG'][$i]['BEWEGUNG']).' Artikel (Wert: '.round($wert, 2).'€); ';
					$array = explode(' ', $artikel['EINGESTELLT'])[0].': '.round($artikel['BEWEGUNG'][$i]['BEWEGUNG']).' Artikel (Wert: '.round($wert, 2).'€)';
				}
			}
			
			// Falls nicht vorhanden -> Neu anlegen
			if($s === 0) {
				$artikelbestand[] = array(
					'artikelnr' => ''.$artikel['ARTIKELNR'].'',
					'bezeichnung' => $artikel['BEZEICHNUNG'],
					'lagerbestand' => round($artikel['BESTAND']),
					'vknetto' => number_format((float)round($artikel['NETTOPREIS'], 2), 2, '.', ''),
					'vkbrutto' => number_format((float)round($artikel['BRUTTOPREIS'], 2), 2, '.', ''),
					'alter' => $array,
					'gesamtwert' => number_format((float)round($gesamtwert, 2), 2, '.', ''),
					'letzterverkauf' => explode(' ', $artikel['LETZTERVERKAUF'])[0],
					'lager' => $artikel['LAGER'],
					'lagerID' => $artikel['LAGERID'],
					'gruppe' => $artikel['GRUPPE'],
					'liefarantid' => $artikel['LIEFERANTLFDNR'],
					'lieferant' => $artikel['LIEFERANT']
					
				);
			// Falls neuere Buchung -> Ersetzen
			} else {
				
			}
			$html = '';
			$array = array();

		}
		
		$resultArray['status'] = 'success';
		$resultArray['message'] = 'All items were loaded successfully.';
		$resultArray['data'] = $artikelbestand;
	}
	
	echo json_encode($resultArray);	
}

function get_all_warehouses() {
	global $PDOF;
	$resultArray = array('status' => 'error');
	
	$stmt = $PDOF->query("SELECT LFDNR, LAGER FROM LAGER ORDER BY LAGER");
	
	if($stmt->execute()) {
		$lager = $stmt->fetchAll(PDO::FETCH_ASSOC);
		
		$resultArray['status'] = 'success';
		$resultArray['message'] = 'All items were loaded successfully.';
		$resultArray['data'] = $lager;
	}
	
	echo json_encode($resultArray);
}

function get_all_vendors() {
	global $PDOF;
	$resultArray = array('status' => 'error');
	
	$stmt = $PDOF->query("
		SELECT
			ADRESSEN.LFDNR,
			ARTIKEL.LIEFERANTLFDNR AS LIEFERANTID,
			ADRESSEN.SUCHBEGRIFF AS LIEFERANT
		FROM
			ARTIKEL
		JOIN
			ADRESSEN
		ON
			ADRESSEN.LFDNR = ARTIKEL.LIEFERANTLFDNR	
	");

	if($stmt->execute()) {
		$result = $stmt->fetchAll(PDO::FETCH_ASSOC);
		$vendors = array();
		// Identify unique vendors
		for($i = 0; $i < count($result); $i++) {
			$vendor = array(
				'lieferantid' => $result[$i]['LIEFERANTID'],
				'lieferant' => $result[$i]['LIEFERANT']
			);
			
			if($vendor['lieferant'] && !in_array($vendor, $vendors)) {
				array_push($vendors, $vendor);
			}
			
			usort($vendors, 'sortByName');
		}
				
		$resultArray['status'] = 'success';
		$resultArray['message'] = 'All vendors were loaded successfully.';
		$resultArray['data'] = $vendors;
	}
	
	echo json_encode($resultArray);
}

function get_all_customers() {
	global $PDOF;
	$resultArray = array('status' => 'error');
	
	$stmt = $PDOF->query("
		SELECT
			SUM(UMSATZ.ZAHLBETRAG)
		FROM
			UMSATZ
		WHERE
			KUNDENLFDNR = 138.500	
	");
	
	if($stmt->execute()) {
		$kunden = $stmt->fetchAll(PDO::FETCH_ASSOC);
		$resultArray['data'] = $kunden;
	}	

	echo json_encode($resultArray);
}


function get_all_sales($startdate = false, $enddate = false) {
	global $PDOF;
	$resultArray = array('status' => 'error');
	
	$allSales = get_sales($startdate, $enddate);
	if($allSales) {
		$resultArray['status'] = 'success';
		$resultArray['message'] = 'All sales were loaded successfully';
		$resultArray['data'] = $allSales;
	}
	
	echo json_encode($resultArray);
}

function get_all_commissions($startdate = false, $enddate = false) {
	global $PDOF;
	$resultArray = array('status' => 'error');
	$CC = 0;
	
	$allSales = get_sales($startdate, $enddate);
	
	if($allSales) {
		$comCount = 0;
		$itemCount = 0;
		for($i = 0; $i < count($allSales); $i++) {
			
			// SET EK-TAX TO VENDOR COUNTRY	
			if ($allSales[$i]['steuersatz']) {
					
				if ($allSales[$i]['steuersatz'] == 1) { $eksteuer = 20; $vksteuer = 20; }
				if ($allSales[$i]['steuersatz'] == 2) { $eksteuer = 10; $vksteuer = 10; }
				if ($allSales[$i]['steuersatz'] == 3) { $eksteuer = 7; $vksteuer = 7; }
				if ($allSales[$i]['steuersatz'] == 4) { $eksteuer = 19; $vksteuer = 19; }
				if ($allSales[$i]['steuersatz'] == 10) { $eksteuer = 0; $vksteuer = 0; }
				if ($allSales[$i]['steuersatz'] == 20) { $eksteuer = 0; $vksteuer = 0; }
				if ($allSales[$i]['steuersatz'] == 0) { $eksteuer = 0; $vksteuer = 0; }
				
				if($eksteuer == 0) {
					if ($allSales[$i]['artikelsteuer'] == 1) { $eksteuer = 20; $vksteuer = 20; }
					if ($allSales[$i]['artikelsteuer'] == 2) { $eksteuer = 10; $vksteuer = 10; }
					if ($allSales[$i]['artikelsteuer'] == 3) { $eksteuer = 7; $vksteuer = 7; }
					if ($allSales[$i]['artikelsteuer'] == 4) { $eksteuer = 19; $vksteuer = 19; }
				}
								
				if($allSales[$i]['lieferantland']) {
					// DEUTSCHLAND
					if ($allSales[$i]['lieferantland'] == 'DE') {
						if ($eksteuer == 20) { $eksteuer = 19; }
						if ($eksteuer == 10) { $eksteuer = 7; }
					}
					
					// ÖSTERREICH
					if ($allSales[$i]['lieferantland'] == 'AT') {
						if ($eksteuer == 7) { $eksteuer = 10; }
						if ($eksteuer == 19) { $eksteuer = 20; }
					}
				}
				
			} else {
				$eksteuer = 0;
			}
			
			// COMMISSIONS
			if ($allSales[$i]['lagerid'] == '17047') {
			
				// ADD TAX
				if($allSales[$i]['steuer'] == 'N') {
					$allSales[$i]['epreis'] = $allSales[$i]['epreis'] * ($vksteuer/100 + 1);
				}
				// SET EK-RPRICE FOR COMMISSIONS
				$cgpreisnetto = number_format( (number_format($allSales[$i]['menge']*$allSales[$i]['epreis'], 2) * 100  / (100 + $eksteuer) ), 2);
				
				$commissions[$comCount] = array(
					'artikelnr' => (string)preg_replace('/\s+/', '', $allSales[$i]['artikelnr']),
					'bezeichnung' => $allSales[$i]['bezeichnung'],
					'epreis' => number_format($allSales[$i]['epreis'], 2),
					'gpreis' => number_format($allSales[$i]['menge']*$allSales[$i]['epreis'], 2),
					'cgpreisnetto' => $cgpreisnetto,
					'menge' => (float)$allSales[$i]['menge'],
					'datum' => explode(' ', $allSales[$i]['datum'])[0],
					'auftragnr' => (string)preg_replace('/\s+/', '', $allSales[$i]['auftragnr']),
					'steuersatz' => preg_replace('/\s+/', '', $allSales[$i]['steuersatz']),
					'lager' => $allSales[$i]['lager'],
					'lagerid' => $allSales[$i]['lagerid'],
					'shop' => $allSales[$i]['shop'],
					'lieferantid' => $allSales[$i]['lieferantid'],
					'lieferant' => $allSales[$i]['lieferant'],
					'eksteuer' => $eksteuer,
					'ekrabatt' => 0,
					'cgekpreis' => (string)$cgpreisnetto,
					'steuerinkl' => $allSales[$i]['steuer'],
					'id' => $allSales[$i]['id']
				);
				$comCount++;
			}
		}
		
		$resultArray['status'] = 'success';
		$resultArray['message'] = 'All commissions were loaded successfully';
		$resultArray['data'] = $commissions;
	}
	
	echo json_encode($resultArray);
}

function get_sales_by_item($startdate = false, $enddate = false) {
	global $PDOF;
	$resultArray = array('status' => 'error');
	$CC = 0;
	
	$allSales = get_sales($startdate, $enddate);
	
	if($allSales) {
		$comCount = 0;
		$itemCount = 0;
		for($i = 0; $i < count($allSales); $i++) {
			
		}
		
		$resultArray['status'] = 'success';
		$resultArray['message'] = 'All commissions were loaded successfully';
		$resultArray['data'] = $commissions;
	}
	
	echo json_encode($resultArray);
	
}

function get_all_taxes() {
	global $PDOF;
	$resultArray = array('status' => 'error');
	
	$stmt = $PDOF->query("
		SELECT
			STEUERSATZ as id,
			BEZEICHNUNG as label
		FROM
			STSATZ
	");
	
	if($stmt->execute()) {
		$allTaxes = $stmt->fetchAll(PDO::FETCH_ASSOC);
		
		// Trim Whitespace
		for ( $i = 0; $i < count($allTaxes); $i++ ) {
			$allTaxes[$i]['ID'] = trim($allTaxes[$i]['ID']);			
		}
				
		$resultArray['data'] = $allTaxes;
		$resultArray['status'] = 'success';
		$resultArray['message'] = 'All taxes were loaded succefully.';
	}	

	echo json_encode($resultArray);
}

function get_handbook() {
	global $PDOM;
	$resultArray = array('status' => 'error');

	$stmtCategories = $PDOM->query("SELECT id, title FROM	handbook_categories	WHERE	active = 1");
	$stmtChapters = $PDOM->query("SELECT category_id, title, id, pdf FROM	handbook_chapters	WHERE	active = 1");
	
	if( $stmtCategories->execute() && $stmtChapters->execute() ) {
		
		$categories = $stmtCategories->fetchAll(PDO::FETCH_ASSOC);
		$chapters = $stmtChapters->fetchAll(PDO::FETCH_ASSOC);
		
		$resultArray['status'] = 'success';
		$resultArray['message'] = 'The handbook was loaded successfully';
		$resultArray['categories'] = $categories;
		$resultArray['chapters'] = $chapters;
	}
	echo json_encode($resultArray);
}

function delete_chapter($id) {
	global $PDOM;
	$resultArray = array('status' => 'error');
	
	if($id) {
		$stmt = $PDOM->prepare("
			UPDATE
				handbook_chapters
			SET
				active = 0
			WHERE
				id = :id
		");
		$stmt->bindParam(':id', $id, PDO::PARAM_INT);
		
		if( $stmt->execute() ) {
			$resultArray['status'] = 'success';
			$resultArray['message'] = 'Das Kapitel wurde erfolgreich gelöscht';
		}
	}
	echo json_encode($resultArray);
}

/*
function add_chapter($chapter) {
	global $PDOM;
	$resultArray = array('status' => 'error');
	
	$data = array();

	if(isset($chapter) {  
			$error = false;
			$files = array();
	
			$uploaddir = './application/assets/files/pdf-handbuch/';
			foreach($_FILES as $file) {
					if(move_uploaded_file($file['tmp_name'], $uploaddir .basename($file['name']))) {
							$files[] = $uploaddir .$file['name'];
					} else {
							$error = true;
					}
			}
			$data = ($error) ? array('error' => 'There was an error uploading your files') : array('files' => $files);
	}
	else {
			$data = array('success' => 'Form was submitted', 'formData' => $_POST);
	}
	
	echo json_encode($data);
	
	
	//echo json_encode($resultArray);
}
*/


/*
			
			// SALES BY ITEM
			if(!valueInArray($salesByItem, 'artikelnr', $result[$i]['ARTIKELNR'])) {
				$salesByItem[$itemCount] = array(
					'artikelnr' => (string)preg_replace('/\s+/', '', $result[$i]['ARTIKELNR']),
					'bezeichnung' => $bezeichnung,
					'epreis' => number_format($result[$i]['EPREIS'], 2),
					'gpreis' => number_format($result[$i]['MENGE']*$result[$i]['EPREIS'], 2),
					'cgpreisnetto' => $cgpreisnetto,
					'menge' => (float)$result[$i]['MENGE'],
					'datum' => explode(' ', $result[$i]['DATUM'])[0],
					'auftragnr' => (string)preg_replace('/\s+/', '', $result[$i]['AUFTRAGNR']),
					'steuersatz' => preg_replace('/\s+/', '', $result[$i]['STEUERSATZ']),
					'lager' => $result[$i]['LAGER'],
					'lagerid' => $result[$i]['LAGERID'],
					'shop' => $result[$i]['FREIFELD3'],
					'lieferantid' => $result[$i]['LIEFERANTLFDNR'],
					'lieferant' => $result[$i]['LIEFERANT'],
					'eksteuer' => $eksteuer,
					'ekrabatt' => 0,
					'cgekpreis' => (string)$cgpreisnetto
				);
				$itemCount++;
			}
			$CC++;



*/






















// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

function get_sales($startdate = false, $enddate = false) {
	global $PDOF;
	$sales = array();

	
	if($enddate == false) {
		$enddate = Date('Y-m-d');
	}
	if($startdate == false) {
		$startdate = Date('Y-m-d', strtotime('-1 month'));
	}

	$stmt = $PDOF->query("
		SELECT
			ARTIKEL.LFDNR,
			ARTIKEL.BEZEICHNUNG,
			ARTIKEL.LIEFERANTLFDNR,
			ARTIKEL.STEUERSATZ AS ARTIKELSTEUER,
			AUFTRAG.LFDNR,
			AUFTRAG.AUFTRAGNR,
			AUFTRAG.DATUM,
			AUFTRAG.AUFTRAGART,
			AUFTRAG.STORNIERTAM,
			AUFTRAG.ANGELEGTAM,
			AUFTRAG.STEUERINKL,
			AUFTRAG.LAND,
			AUFTRAG.FREIFELD3,
			ADRESSEN.LFDNR AS ADRESSENLFDNR,
			ADRESSEN.SUCHBEGRIFF AS LIEFERANT,
			ADRESSEN.LAND AS LIEFERANTLAND,
			ATRPOS.AUFTRAGLFDNR,
			ATRPOS.BEZEICHNUNG AS TITEL,
			ATRPOS.ARTIKELNR,
			ATRPOS.STEUERSATZ,
			ATRPOS.MENGE,
			ATRPOS.EPREIS,
			ATRPOS.GPREIS,
			ATRPOS.GPREISNETTO,
			ATRPOS.EKPREIS,
			ATRPOS.ARTIKELLFDNR,
			ATRPOS.LAGERLFDNR,
			ATRPOS.ARTGEBUCHT,
			ATRPOS.RABATT,
			LAGER.LFDNR AS LAGERID,
			LAGER.LAGER
		FROM
			ATRPOS
		JOIN
			AUFTRAG
		ON
			AUFTRAG.LFDNR = ATRPOS.AUFTRAGLFDNR
		LEFT JOIN
			ARTIKEL
		ON
			ARTIKEL.LFDNR = ATRPOS.ARTIKELLFDNR
		LEFT JOIN
			LAGER
		ON
			ARTIKEL.LAGERLFDNR = LAGER.LFDNR
		LEFT JOIN
			ADRESSEN
		ON
			ADRESSEN.LFDNR = ARTIKEL.LIEFERANTLFDNR
		WHERE
			AUFTRAG.DATUM BETWEEN '{$startdate}' AND '{$enddate}'
		AND
			AUFTRAG.STORNIERTAM IS NULL
		AND
			AUFTRAG.GEBUCHT = 'J'
		AND
			(
				AUFTRAG.AUFTRAGART = 4
			OR
				AUFTRAG.AUFTRAGART = 5
			OR
				AUFTRAG.AUFTRAGART = 6
			)
		ORDER BY
			AUFTRAG.AUFTRAGNR DESC		
	");

	if($stmt->execute()) {
		$result = $stmt->fetchAll(PDO::FETCH_ASSOC);
		
		$art = array(
			4 => 'RG',
			5 => 'RB',
			6 => 'GS'
		);
		
		$steuer = array(
			'J' => 'inkl',
			'N' => 'zzgl',
			'0' => 'ohne'
		);
		
				
		for($i = 0; $i < count($result); $i++) {
			
			// SET COUNTRY
			if ($result[$i]['LAND'] == '') {
				$result[$i]['LAND'] = 'AT';
			}
			
			// SET DISCOUNT
			if(number_format($result[$i]['RABATT'], 0) == 0) {
				$rabatt = '';
			} else {
				$rabatt = number_format($result[$i]['RABATT'], 0);
			}
			
			// SET CORRECT TITLE
			if ($result[$i]['BEZEICHNUNG'] == '') {
				$bezeichnung = $result[$i]['TITEL'];
			} else {
				$bezeichnung = $result[$i]['BEZEICHNUNG'];
			}
						
			// SET SHOP
			if (!$result[$i]['FREIFELD3']) { $result[$i]['FREIFELD3'] = "Adventist Book Center"; }
			
			// SET EMPTY STRINGS
			if (!$result[$i]['LIEFERANT']) { $result[$i]['LIEFERANT'] = "";	}

			// SALES
			$sales[$i] = array(
				'artikelnr' => (string)preg_replace('/\s+/', '', $result[$i]['ARTIKELNR']),
				'artikelsteuer' => $result[$i]['ARTIKELSTEUER'],
				'bezeichnung' => $bezeichnung,
				'epreis' => number_format($result[$i]['EPREIS'], 2),
				'gpreis' => number_format($result[$i]['GPREIS'], 2),
				'gpreisnetto' => number_format($result[$i]['GPREISNETTO'], 2),
				'ekpreis' => number_format($result[$i]['EKPREIS'], 2),
				'menge' => (float)$result[$i]['MENGE'],
				'gekpreis' => number_format($result[$i]['MENGE']*$result[$i]['EKPREIS'], 2),
				'auftragnr' => (string)preg_replace('/\s+/', '', $result[$i]['AUFTRAGNR']),
				'datum' => explode(' ', $result[$i]['DATUM'])[0],
				'land' => $result[$i]['LAND'],
				'steuer' => $steuer[$result[$i]['STEUERINKL']],
				'steuersatz' => preg_replace('/\s+/', '', $result[$i]['STEUERSATZ']),
				'rabatt' => $rabatt,
				'art' => $art[$result[$i]['AUFTRAGART']],
				'lager' => $result[$i]['LAGER'],
				'lagerid' => $result[$i]['LAGERID'],
				'shop' => $result[$i]['FREIFELD3'],
				'lieferantid' => $result[$i]['LIEFERANTLFDNR'],
				'lieferant' => $result[$i]['LIEFERANT'],
				'lieferantland' => $result[$i]['LIEFERANTLAND'],
				'id' => $i
			);
		}
	}
	return $sales;
}

function sortByDate($a, $b) {
	return strnatcmp($b['BUCHUNGSTAG'], $a['BUCHUNGSTAG']);
}

function sortByName($a, $b) {
	return strnatcasecmp ($a['lieferant'], $b['lieferant']);
}

function valueInArray(array $array, $key, $value) {
    foreach ($array as $element) {
        if (!empty($array["{$key}"]) && valueInArray($array["{$key}"], $value)) {
            return true;
        }
    }
    return false;
}



?>