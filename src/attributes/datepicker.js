import {inject, customAttribute} from 'aurelia-framework';

@customAttribute('datepicker')
@inject(Element)
export class DatePicker {
	constructor(element) {
		this.element = element;
	}
  
	attached() {
		$(this.element).datepicker({
			dateFormat: "yy-mm-dd",
			prevText: "<",
			nextText: ">",
			showOtherMonths: true,
			monthNames: [
				"Januar",
				"Februar",
				"März",
				"April",
				"Mai",
				"Juni",
				"Juli",
				"August",
				"September",
				"Oktober",
				"November",
				"Dezember"
			]
		})
		.on('change', e => fireEvent(e.target, 'input'));
		
		//let width = `${$(this.element).outerWidth()}px !important`;
	}
  
	detached() {
		$(this.element).datepicker('destroy')
			.off('change');
	}
}

function createEvent(name) {
	var event = document.createEvent('Event');
	event.initEvent(name, true, true);
	return event;
}

function fireEvent(element, name) {
	var event = createEvent(name);
	element.dispatchEvent(event);
}