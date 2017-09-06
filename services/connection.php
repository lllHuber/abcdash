<?php

require_once('constants.php');

// --------------------------------------------------
// PDO CONNECTION MYSQL
// --------------------------------------------------

$PDOM = '';
try {
    //try connection
    $DSNM = 'mysql:host='.$GLOBALS['mdbHost'].';dbname='.$GLOBALS['mdbName'].';port='.$GLOBALS['mdbPort'].'charset=utf8';
    $PDOM = new PDO( 
        $DSNM,
        $GLOBALS['mdbUser'],
        $GLOBALS['mdbPass'],
        array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8'")
    );
    $PDOerrorInfo = $PDOM->errorInfo();
} catch (Exception $e){
    //catch errors    
    $PDOerror = $e->getMessage();
}

// error handling
if ($PDOM) {
    //echo 'database connection successful!';
} else if (isset($PDOerror)) {
    //echo $PDOerror;
} else if (isset($PDOerrorInfo)) {
    //echo $PDOerrorInfo[2];
}


// --------------------------------------------------
// PDO CONNECTION FIREBIRD
// --------------------------------------------------

$PDOF = '';
try {
    $PDOF = new PDO("odbc:Amicron");    
    $PDOerrorInfo = $PDOF->errorInfo();
} catch (Exception $e){
    //catch errors    
    $PDOerror = $e->getMessage();
}

// error handling
if ($PDOF) {
    //echo 'database connection successful!';
} else if (isset($PDOerror)) {
    //echo $PDOerror;
} else if (isset($PDOerrorInfo)) {
    //echo $PDOerrorInfo[2];
}















?>