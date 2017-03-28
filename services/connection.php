<?php

require_once('constants.php');

// --------------------------------------------------
// PDO CONNECTION MYSQL
// --------------------------------------------------

$PDOM = '';
try {
    //try connection
    $DSN = 'mysql:host='.$GLOBALS['dbHost'].';dbname='.$GLOBALS['dbName'].';port='.$GLOBALS['dbPort'].'charset=utf8';
    $PDOM = new PDO( 
        $DSN,
        $GLOBALS['dbUser'],
        $GLOBALS['dbPass'],
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
    //try connection
    $PDOF = new PDO('odbc:Amicron');
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