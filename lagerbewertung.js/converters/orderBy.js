export class OrderByValueConverter {
    
    toView(array, config) {
		
		if (!$.isArray(array))
			return [];
		
		if (!config.property)
			return array;
		
        return array.sort( (program, index) => {
            
            let x = program;
            let y = index;
            
            if(config.direction.toLowerCase() !== "asc") {
                x = index;
                y = program;
            }
			
            if(x[config.property] < y[config.property])
                return -1;
            
            if(x[config.property] > y[config.property])
                return 1;
            
            return 0;
        });
        
		//return array;
    }

		
}