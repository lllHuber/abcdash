/**
 *	AURELIA FILTER TO SEARCH THROUGH AN ARRAY OF OBJECTS
 *	
 *	An object will be included in the search result if one of the following conditions are met:
 *		- if value is a string: partial match is sufficient
 *		- if value is a number: exact match is required
 *		- if value is an array: one of the properties needs to be an exact match (numbers or strings)
 *
 *	This filter can also use the value of a single input field
 *	and compare it with multiple properties of the object to find a match
 *	 -> either/or-scenario: only one property has to match according to the conditions mentioned above
 *	    to include the object in the search result
 *
 *	DOCUMENTATION BELOW
 *	
 */

export class FilterValueConverter {
	
	toView(array, filter) {

		let tempArray = [];
		let filteredArray = [];
		let matchedFilters = 0;
		let matchedSubFilters = 0;
		
		if(filter.updateAmount !== false) {
			filter.updateAmount = true;			
		}
		
		// Array Not Set -> Return Empty Array
		if (!$.isArray(array))
			return [];
		
		// Remove Trashed Programs
		$.each(array, (index, program) => {
			if(!program.hasOwnProperty("trashed") || program.trashed != 1) {
				tempArray.push(program);
			}
		});
		
		// No Filter Applied -> Return Array
		let appliedFilters = Object.keys(filter.filter).length;
		if(appliedFilters === 0) {
			let amount = tempArray.length;
			if(filter.updateAmount) {
				$(".itemCount").text(`${amount} items found`);
			}
			return tempArray;		
		}
		
		// Value Of Filter Property Not Set -> Remove Property From Filter
		$.each(filter.filter, (key, value) => {
			if($.type(value) === undefined) {
				delete filter.filter[key];
			}
		});
		
		// Loop Through Each Program
		tempArray.filter((program) => {
			matchedFilters = 0;
			matchedSubFilters = 0;
			
			// Loop Through Each Applied Filter
			$.each(filter.filter, (property, value) => {
				
				// Ignore Aurelia get And set Properties
				if(property.indexOf("get ") === -1 && property.indexOf("set ") === -1) {
				
					// If Program Property Is Set
					if (program[property] !== null && value !== "") {
						
						// COMPARE NUMBERS
						if($.isNumeric(program[property]) && $.isNumeric(value)) {
							if(program[property] == value) {
								matchedFilters++;
							}
						} else
						
						// COMPARE STRINGS
						if($.type(program[property]) === "string" && $.type(value) === "string") {
							if(program[property].toLowerCase().indexOf(value.toLowerCase()) >= 0 || value === "") {
								matchedFilters++;
							}
						} else
						
						// PROPERTY IS MULTI-OBJECT (ONE INPUT FIELD CAN SEARCH FOR MULTIPLE PROPERTIES)
						if($.type(property) === "string" && property.indexOf("___") >= 0) {
							
							// ONE LEVEL DEEP COMPARISONS
							$.each(value, (prop, val) => {
								
								// COMPARE NUMBERS
								if($.isNumeric(program[prop]) && $.isNumeric(val)) {
									if(program[prop] == val) {
										matchedSubFilters++;
									}
								} else
								
								// COMPARE STRINGS
								if($.type(program[prop]) === "string" && $.type(val) === "string") {
									if(program[prop].toLowerCase().indexOf(val.toLowerCase()) >= 0 || val === "") {
										matchedSubFilters++;
									}
								} else
								
								// PROPERTY IS ARRAY (ONE INPUT FIELD CAN SEARCH FOR ONE PROPERTY WHICH IS AN ARRAY)
								if($.type(program[prop]) === "array") {
									for(var i = 0; i < program[prop].length; i++) {
										if(val.toString() == program[prop][i]) {
											matchedSubFilters++;
											break;
										}
									}
								}
							});
							if(matchedSubFilters > 0) {
								matchedFilters++;
							}
						} else
						
						// PROPERTY IS ARRAY (ONE INPUT FIELD CAN SEARCH FOR ONE PROPERTY WHICH IS AN ARRAY)
						if($.type(program[property]) === "array") {
							for(var i = 0; i < program[property].length; i++) {
								if(value.toString() == program[property][i]) {
									matchedFilters++;
									break;
								}
							}
						}				
										
					// If Filter = "" (If "All" Is Selected)
					} else if (value === "") {
						matchedFilters++;
						
					} else if (program[property] === null) {
						//matchedFilters++;
					}
				}
			});
			
			// If Program Matches All Filters -> Include In Search Result
			if (matchedFilters == appliedFilters) {
				filteredArray.push(program);
			}
			
		});
		if(filter.updateAmount) {
			let amount = filteredArray.length;
			$(".itemCount").text(`${amount} items found`);
		}
		
		return filteredArray;
	}
}

/**
 * DOCUMENTATION:
 *
 *	 DEPENDENCIES: jQuery
 * 
 *	 USAGE IN VIEW:
 *	 	Functions:
 *	 	- updateFilter('<property to search>', <value to search for>)
 *	 	- updateFilter(['<property>', '<property>'], <value to search for>)
 *	 	- resetFilter('<id of input to focus on>')
 *	 	Repeater:
 *	 	- repeat.for="item of items | filter: { 'filter': filter, 'trigger': filterChange }"
 *
 *	 DEFINITION IN VIEW-MODEL:
 *	 	constructor() {
 *			this.filter = {};
 *			this.filterChange = 0;
 *		}
 *		
 *	 	updateFilter(property, value) {
 *			if($.isArray(property)) {
 *				this.filter[`__${property[0]}`] = {};
 *				$.each(property, (key, val) => {
 *					if(value === "") {
 *						delete this.filter[`__${property[0]}`];
 *					} else {
 *						this.filter[`__${property[0]}`][val] = value;
 *					}
 *					this.triggerFilter();
 *				});
 *			} else {
 *				if(value === "") {
 *					delete this.filter[property];
 *				} else {
 *					this.filter[property] = value;
 *				}
 *				this.triggerFilter();
 *			}
 *		}
 *	
 *		triggerFilter() {
 *			this.filterChange++;
 *		}
 *		
 *		resetFilter(focus) {
 *			this.filter = {};
 *			$(focus).focus();
 *		}
 */