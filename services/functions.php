<?php
require_once('connection.php');


// --------------------------------------------------
// VALIDATE USER INPUT
// --------------------------------------------------


// specify which get parameters are allowed and return their values in an array
function return_allowed_get_params($allowed_params = []) {
    $allowed_array = [];
    foreach($allowed_params as $param) {
        if(isset($_GET[$param])) {
            $allowed_array[$param] = $_GET[$param];
        } else {
        $allowed_array[$param] = NULL;
        }
    }
    return $allowed_array;
}

// check if variable is empty (ignore white space)
function not_empty($value) {
    $trimmed_value = trim($value);
    return isset($trimmed_value) && $trimmed_value !== '';
}

// has_length($value, ['min'=>5, 'max=>10', 'exact'=>7])
function has_length($value, $options = []) {
    if(isset($options['max']) && (strlen($value) > (int)$options['max'])) {
        return false;
    }
    if(isset($options['min']) && (strlen($value) < (int)$options['min'])) {
        return false;
    }
    if(isset($options['exact']) && (strlen($value) != (int)$options['exact'])) {
        return false;
    }
    return true;
}

// is_number($value, ['min'=>1, 'max'=>5])
function is_number($value, $options = []) {
    if(!is_numeric($value)) {
        return false;
    }
    if(isset($options['max']) && ($value > (int)$options['max'])) {
        return false;
    }
    if(isset($options['min']) && ($value < (int)$options['min'])) {
        return false;
    }
    return true;
}

// check if value is in array
function is_in_array($needle, $haystack = []) {
    return in_array($needle, $haystack);
}






// --------------------------------------------------
// DB INTERACTION
// --------------------------------------------------

function isUnique($database, $table, $column, $value) {
    global $PDO;
    $stmt = $PDO->prepare("SELECT COUNT(*) FROM {$database}.{$table} WHERE {$column} = :value");
    $stmt->bindParam(':value', $value);
    if($stmt->execute()) {
        $rowCount = $stmt->fetch();
        if($rowCount[0] == 0) {
            return true;
        }
    }
}

function getDatabaseResult($database, $table, $columns, $values) {
    global $PDO;
    $match = '';
    for ($i = 0; $i < count($columns); $i++) {
        $match .= ' '.$columns[$i].' = ? ';
        if($i != (count($columns) - 1)) {
            $match .= ' AND ';            
        }
    }
    $stmt = $PDO->prepare("SELECT * FROM {$database}.{$table} WHERE {$match}");
    foreach ($values as $key => $value) {
        $stmt->bindValue($key + 1, $value);
    }
    if($stmt->execute()) {
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if($result) {
            return $result;
        } 
    }
}

function getNumRows($value, $database, $table, $column) {
    global $PDO;
    $stmt = $PDO->prepare("SELECT COUNT(*) FROM {$database}.{$table} WHERE {$column} = :value");
    $stmt->bindParam(':value', $value);
    if($stmt->execute()) {
        $rowCount = $stmt->fetch();
        return $rowCount[0];
    }
}

function getResultArray($stmt) {
    global $PDO;
    if($stmt->execute()) {
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if($result && count($result) > 0) {
            return $result;
        } else {
            return 'no result found';
        }
    }
}

function getNextRow($stmt) {
    global $PDO;
    if($stmt->execute()) {
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if($result && count($result) > 0) {
            return $result;
        } else {
            return 'no result found';
        }
    }
}






// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

function dump($variable) {
}





?>