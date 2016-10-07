<?php

trait lstvDBInteraction {
	
	use lstvDBConnection;
	
	
	// connect to db
	public static function getPDO(){
		return self::connect('localhost', 'lscms', 'root', 'root');
	}
	
	
	
	
	

		
}




?>