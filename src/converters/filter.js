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
		let rechnungen = [];
		let multipleStrings = [];
		let exemplare = 0;
		let exemplareverkauft = 0;
		let gesamtwert = 0;
		let umsatzNetto = 0;
		let umsatzNettoKommission = 0;
		let gesamtEK = 0;
		let gesamtRabatt = 0;
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
			// gesamtwert, exemplare
			$.each(tempArray, (index, item) => {
				if (item.lagerbestand) { exemplare = exemplare + item.lagerbestand; }
				if (item.menge) { exemplareverkauft = exemplareverkauft + item.menge; }
				if (item.gesamtwert) { gesamtwert = gesamtwert + parseFloat(item.gesamtwert); }
				if (item.gpreisnetto) { umsatzNetto = umsatzNetto + parseFloat(item.gpreisnetto); }
				if (item.cgpreisnetto) { umsatzNettoKommission = umsatzNettoKommission + parseFloat(item.cgpreisnetto); }
				if (item.cgekpreis) { gesamtEK = gesamtEK + parseFloat(item.cgekpreis); }
				if (item.rabatt && item.rabatt > 0) { gesamtRabatt = gesamtRabatt + parseFloat(item.ekpreis) * parseFloat(item.menge) / 100 * parseFloat(item.rabatt); }
				// zähle rechnungen
				if (item.auftragnr) {
					if (rechnungen.includes(item.auftragnr) === false) {
						rechnungen.push(item.auftragnr);
					}
				}
			});
			
			let amount = tempArray.length;
			if(filter.updateAmount) {
				$(".itemCount").text(`${amount} Ergebnisse gefunden`);
				$(".amount").text(`${amount}`);
				$(".verkauf").text(`${amount}`);
				$(".rechnungen").text(rechnungen.length);
			}
			
			gesamtwert = gesamtwert.toFixed(2);
			umsatzNetto = umsatzNetto.toFixed(2);
			umsatzNettoKommission = umsatzNettoKommission.toFixed(2);
			gesamtEK = gesamtEK.toFixed(2);
			gesamtRabatt = gesamtRabatt.toFixed(2);
			
			$(".exemplare").text(exemplare);
			$(".exemplareverkauft").text(exemplareverkauft);
			$(".totalValue").text(gesamtwert);
			$(".umsatzNetto").text(umsatzNetto);
			$(".umsatzNettoKommission").text(umsatzNettoKommission);
			$(".gesamtEK").text(gesamtEK);
			$(".gesamtRabatt").text(gesamtRabatt);
			$(".format").text('Alle Formate');	
			$(".shops").text('Alle Shops');	
			$(".vendor").text('Alle Lieferanten');
			
			filter.getFilteredArray(tempArray, filter.context);
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
							
							// SEARCH FOR "EITHER, ... OR" IF STRING CONTAINS A COMMA
							if(value.toLowerCase().indexOf(", ") >= 0) {
								multipleStrings = value.toLowerCase().split(", ") ;
								$.each(multipleStrings, (index, string) => {
									if(program[property].toLowerCase().indexOf(string) >= 0 || value === "") {
										matchedFilters++;
									}	
								});
							}
							
							// SEARCH FOR STRING AS IS
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
			
			// gesamtwert, exemplare
			$.each(filteredArray, (index, item) => {
				if (item.lagerbestand) { exemplare = exemplare + item.lagerbestand; }
				if (item.menge) { exemplareverkauft = exemplareverkauft + item.menge; }
				if (item.gesamtwert) { gesamtwert = gesamtwert + parseFloat(item.gesamtwert); }
				if (item.gpreisnetto) { umsatzNetto = umsatzNetto + parseFloat(item.gpreisnetto); }
				if (item.cgpreisnetto) { umsatzNettoKommission = umsatzNettoKommission + parseFloat(item.cgpreisnetto); }
				if (item.cgekpreis) { gesamtEK = gesamtEK + parseFloat(item.cgekpreis); }
				if (item.rabatt && item.rabatt > 0) { gesamtRabatt = gesamtRabatt + parseFloat(item.ekpreis) * parseFloat(item.menge) / 100 * parseFloat(item.rabatt); }
				
				// zähle rechnungen
				if (item.auftragnr) {
					if (rechnungen.includes(item.auftragnr) === false) {
						rechnungen.push(item.auftragnr);
					}
				}
			});
			gesamtwert = gesamtwert.toFixed(2);
			umsatzNetto = umsatzNetto.toFixed(2);
			umsatzNettoKommission = umsatzNettoKommission.toFixed(2);
			gesamtEK = gesamtEK.toFixed(2);
			gesamtRabatt = gesamtRabatt.toFixed(2);
			if(filter.filter.gruppe) {
				$(".format").text(filter.filter.gruppe);	
			}
			if(filter.filter.shop) {
				$(".shops").text(filter.filter.shop);	
			}
			if(filter.filter.lieferant) {
				$(".vendor").text(filter.filter.lieferant);	
			}
			let amount = filteredArray.length;
			$(".itemCount").text(`${amount} Ergebnisse gefunden`);
			$(".verkauf").text(amount);
			$(".amount").text(amount);
			$(".exemplare").text(exemplare);
			$(".exemplareverkauft").text(exemplareverkauft);
			$(".totalValue").text(gesamtwert);
			$(".umsatzNetto").text(umsatzNetto);
			$(".umsatzNettoKommission").text(umsatzNettoKommission);
			$(".gesamtEK").text(gesamtEK);
			$(".gesamtRabatt").text(gesamtRabatt);
			$(".rechnungen").text(rechnungen.length);
		}
		
		filter.getFilteredArray(filteredArray, filter.context);
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