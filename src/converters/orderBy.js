export class OrderByValueConverter {
    
    toView(array, config) {
		
		if (!$.isArray(array))
			return [];
		
		if (!config.property)
			return array;
		
        return array.sort( (value, index) => {
            
            let x = value;
            let y = index;

			if(config.direction.toLowerCase() !== "asc") {
				x = index;
				y = value;
			}

			// NUMBERS
			if($.isNumeric(x[config.property])) {
				return x[config.property] - y[config.property];
				
			// STRINGS
			} else {
				
				if(x[config.property] < y[config.property])
					return -1;
				
				if(x[config.property] > y[config.property])
					return 1;
				
				return 0;
			}
        });
    }
}