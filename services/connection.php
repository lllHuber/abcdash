<?php

require_once('constants.php');

// --------------------------------------------------
// PDO CONNECTION
// --------------------------------------------------

$PDO = '';
try {
    //try connection
    $DSN = 'mysql:host='.$GLOBALS['dbHost'].';dbname='.$GLOBALS['dbName'].';port='.$GLOBALS['dbPort'].'charset=utf8';
    $PDO = new PDO( 
        $DSN,
        $GLOBALS['dbUser'],
        $GLOBALS['dbPass'],
        array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8'")
    );
    $PDOerrorInfo = $PDO->errorInfo();
} catch (Exception $e){
    //catch errors    
    $PDOerror = $e->getMessage();
}

// error handling
if ($PDO) {
    //echo 'database connection successful!';
} else if (isset($PDOerror)) {
    //echo $PDOerror;
} else if (isset($PDOerrorInfo)) {
    //echo $PDOerrorInfo[2];
}


?>