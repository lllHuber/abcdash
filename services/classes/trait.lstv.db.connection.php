<?php

trait lstvDBConnection {

	/**
	 * Connect to a database and return the PDO object
	 * @param string $dbHost, string $dbName, string $dbPass, (int $dbPort)
	 * @throws PDO error
	 * @return PDO object
	 * 
	 */	
	protected static function connect($dbHost, $dbName, $dbUser, $dbPass, $dbPort = 3306){
		$PDO = '';
		try {
			$DSN = 'mysql:host='.$dbHost.';dbname='.$dbName.';port='.$dbPort.'charset=utf8';
			$PDO = new PDO( 
				$DSN,
				$dbUser,
				$dbPass,
				array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8'")
			);
			$PDOerrorInfo = $PDO->errorInfo();
		} catch (Exception $e){
			$PDOerror = $e->getMessage();
		}
		
		if ($PDO) {
			return $PDO;
		} else if (isset($PDOerror)) {
			die($PDOerror);
		} else if (isset($PDOerrorInfo)) {
			die($PDOerrorInfo[2]);
		}
	}
	
	
}




?>