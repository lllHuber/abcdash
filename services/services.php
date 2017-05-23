<?php

require_once('headers.php');
require_once('connection.php');
require_once('functions.php');
require_once('classes/class.lstv.php');

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
            LIST(ARTBUCH.ANGELEGTAM, ',') AS BUCHUNGSTAG,
			LIST(ARTBUCH.BEWEGUNG, ',') AS BEWEGUNG,
			LAGER.LAGER,
			LAGER.LFDNR AS LAGERID
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
			LAGER.LFDNR
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
					$artikel['GRUPPE'] = 'DVDs, CDs, MP3s, Hörspiele';
				}
			}
			
			// Füge Artikelgruppe "DVDs, CDs, MP3s, Hörspiele" hinzu
			if (!preg_match("/DVD/i", trim($artikel['BEZEICHNUNG'])) &&
				!preg_match("/CD/i", trim($artikel['BEZEICHNUNG'])) &&
				!preg_match("/MP3/i", trim($artikel['BEZEICHNUNG']))) {
				$artikel['GRUPPE'] = 'Bücher, Hörbücher';
			} else
			
			// Hörbücher zählen zu Büchern -> exkludieren
			if(preg_match("/Hörbuch/i", trim($artikel['BEZEICHNUNG'])) ||
			   preg_match("/Hörbücher/i", trim($artikel['BEZEICHNUNG']))) {
				$artikel['GRUPPE'] = 'Bücher, Hörbücher';
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
					'gruppe' => $artikel['GRUPPE']
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
		
		$comCount = 0;
				
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
			
			// SET EK-TAX TO VENDOR COUNTRY
			if ($result[$i]['STEUERSATZ']) {
				
				if ($result[$i]['STEUERSATZ'] == 1) { $eksteuer = 20; }
				if ($result[$i]['STEUERSATZ'] == 2) { $eksteuer = 10; }
				if ($result[$i]['STEUERSATZ'] == 3) { $eksteuer = 7; }
				if ($result[$i]['STEUERSATZ'] == 4) { $eksteuer = 19; }
				if ($result[$i]['STEUERSATZ'] == 10) { $eksteuer = 0; }
				if ($result[$i]['STEUERSATZ'] == 20) { $eksteuer = 0; }
				if ($result[$i]['STEUERSATZ'] == 0) { $eksteuer = 0; }
				
				if($result[$i]['LIEFERANTLAND']) {

					// DEUTSCHLAND
					if ($result[$i]['LIEFERANTLAND'] == 'DE') {
						if ($result[$i]['STEUERSATZ'] == 1) { $eksteuer = 19; }
						if ($result[$i]['STEUERSATZ'] == 2) { $eksteuer = 7; }
					}
					
					// ÖSTERREICH
					if ($result[$i]['LIEFERANTLAND'] == 'AT') {
						if ($result[$i]['STEUERSATZ'] == 3) { $eksteuer = 10; }
						if ($result[$i]['STEUERSATZ'] == 4) { $eksteuer = 20; }
					}
				}
				
			} else {
				$eksteuer = '';
			}
			
			// SET EK-RPRICE FOR COMMISSIONS
			$cgpreisnetto = number_format(((number_format($result[$i]['MENGE']*$result[$i]['EPREIS'], 2)) / 100) * (100 - $eksteuer), 2);
			
			// SET EMPTY STRINGS
			if (!$result[$i]['LIEFERANT']) { $result[$i]['LIEFERANT'] = "";	}
			
			$sales[$i] = array(
				'artikelnr' => (string)preg_replace('/\s+/', '', $result[$i]['ARTIKELNR']),
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
				'lieferant' => $result[$i]['LIEFERANT']
			);
			
			if ($result[$i]['LAGERID'] == '17047') {
				$commissions[$comCount] = array(
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
				$comCount++;
			}
		}
		
		$resultArray['status'] = 'success';
		$resultArray['message'] = 'All sales were loaded successfully';
		$resultArray['sales'] = $sales;
		$resultArray['commissions'] = $commissions;
		
		/*
		echo count($sales);
		echo '<pre>';
		print_r($sales);
		echo '</pre>';
		*/
		
	}

	echo json_encode($resultArray);	
}




// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------


function sortByDate($a, $b) {
	return strnatcmp($b['BUCHUNGSTAG'], $a['BUCHUNGSTAG']);
}

function sortByName($a, $b) {
	return strnatcasecmp ($a['lieferant'], $b['lieferant']);
}





?>