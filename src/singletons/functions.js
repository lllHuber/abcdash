import config from 'config/config';
import { inject } from "aurelia-framework";
import { BindingEngine } from 'aurelia-binding';
import { Router } from 'aurelia-router';
import { MultiObserver } from 'singletons/multiObserver';

// 3rd Party Libraries
import { jspdf } from 'jspdf';
import { autotable } from 'jspdf-autotable';

@inject(config, Router, MultiObserver, BindingEngine)
export default class Functions {
 
	constructor(config, Router, MultiObserver, BindingEngine) {
		this.config = config;
		this.router = Router;
		this.observer = MultiObserver;
		this.observe = BindingEngine;
		this.context = this;
		this.$ui = {
			"resizable": ""	
		};
		
		this.dates = {
			"startdate": this.oneMonthBefore(),
			"enddate": this.today("date")
		};
		
		// jQueryUI
		//console.log($ui);
		
		//$(".resizable").$ui.resizable.resizable();
		
		// OrderBy
		this.direction = 'desc';
		
		// InfiniteScroll
		this.distance = null;
		
		// Filter
		this.filter = {};
		this.filterChange = 0;
		
		// Toolbars
		this.toolbar = {
			"filter"			: false,
			"export"			: false,
			
			content				: {
				"filterArticles": true,
				"filterSales": false,
				"filterCommissions": false
			}
		};

		// Store Temp Data For Editing
		this.$T = {
			"article": {},
			"amount": 0
		};
		this.resetObjects();
		
		// Store Data In $D
		this.$D = {
			"allItems"			: this.allItems,
			"allWarehouses"		: this.allWarehouses,
			"allVendors"		: this.allVendors,
			"allCustomers"		: this.allCustomers,
			"allSales"			: this.allSales,
			"allCommissions"	: this.allCommissions,
			"allTaxes"			: [
									{ "id" : "0", "label" : "0 - Gutscheine (0%)" },
									{ "id" : "1", "label" : "1 - Österreich regulär (20%)" },
									{ "id" : "2", "label"  : "2 - Österreich ermäßigt (10%)" },
									{ "id" : "3", "label"  : "3 - Deutschland ermäßigt (7%)" },
									{ "id" : "4", "label"  : "4 - Deutschland regulär (19%)" },
									{ "id" : "10", "label"  : "10 - Innergemeintschaftlich (0%)" },
									{ "id" : "20", "label"  : "20 - Export (0%)" }				
								  ]
		};
		
		// Observe Date Change
		this.observe.propertyObserver(this.dates, "startdate").subscribe((newValue, oldValue) => {
			this.allItems;
			this.allSales;
		});
		this.observe.propertyObserver(this.dates, "enddate").subscribe((newValue, oldValue) => {
			this.allItems;
			this.allSales;
		});
		this.observe.propertyObserver(this, "ekrabatt").subscribe((newValue, oldValue) => {
			// Update Discount
			this.modifyArray(this.filteredArray, "ekrabatt", this.ekrabatt);
			// Update Gesamt-EK
			this.updateTotalEK(this.filteredArray, this.ekrabatt);
		});
		this.observe.propertyObserver(this, "filteredArray").subscribe((newValue, oldValue) => {
			// Update Discount
			this.modifyArray(this.filteredArray, "ekrabatt", this.ekrabatt);
			// Update Gesamt-EK
			this.updateTotalEK(this.filteredArray, this.ekrabatt);
		});
		
		this.ekrabatt = 0;
		
		
		// Steuersatz
		
	}
	

	
	// --------------------------------------------------
	// GET DATA
	// --------------------------------------------------
	
	get allItems() {
		this.url = this.config.serviceUrl + `?ws=get_all_items&enddate=${this.dates.enddate}`;
		$("#hbrLoader").show();
		$.get(this.url, response => {
			$("#hbrLoader").hide();
			if(response.status === 'success') {
				this.$D.allItems = response.data;
			}
		}, "json");
	}
	
	get allWarehouses() {
		this.url = this.config.serviceUrl + "?ws=get_all_warehouses";
		$("#hbrLoader").show();
		$.get(this.url, response => {
			$("#hbrLoader").hide();
			if(response.status === 'success') {
				this.$D.allWarehouses = response.data;
			}
		}, "json");
	}
	
	get allVendors() {
		this.url = this.config.serviceUrl + "?ws=get_all_vendors";
		$("#hbrLoader").show();
		$.get(this.url, response => {
			$("#hbrLoader").hide();
			if(response.status === 'success') {
				this.$D.allVendors = response.data;
			}
		}, "json");
	}
	
	get allCustomers() {
		this.url = this.config.serviceUrl + "?ws=get_all_customers";
		$("#hbrLoader").show();
		$.get(this.url, response => {
			$("#hbrLoader").hide();
			if(response.status === 'success') {
				this.$D.allCustomers = response.data;
				//console.log(this.$D.allCustomers);
			}
		}, "json");
	}
	
	get allSales() {
		this.url = this.config.serviceUrl + `?ws=get_all_sales&startdate=${this.dates.startdate}&enddate=${this.dates.enddate}`;
		console.log(this.url);
		$("#hbrLoader").show();
		$.get(this.url, response => {
			$("#hbrLoader").hide();
			if(response.status === 'success') {
				this.$D.allSales = response.sales;
				this.$D.allCommissions = response.commissions;
			}
		}, "json");
	}
	
	// --------------------------------------------------
	// TOOLBARS
	// --------------------------------------------------
	
	showToolbar(toolbar, focus) {
		this.hideAllToolbars();
		this.triggerFilter();
		this.toolbar[toolbar] = true;
		$(`#${toolbar}`).removeClass("hide");
		$(focus).focus();
	}
	
	hideToolbar(toolbar) {
		$(`#${toolbar}`).addClass("hide");
	}
	
	toggleToolbar(toolbar, focus) {
		$(`.hbrToolbar .content:not(#${toolbar})`).addClass("hide");
		
		if($(`#${toolbar}`).hasClass("hide")) {
			// Show Toolbar
			this.hideAllToolbars();
			this.toolbar[toolbar] = true;
			$(`#${toolbar}`).removeClass("hide");
			$(focus).focus();
		} else {
			// Hide Toolbar
			this.hideAllToolbars();
			this.toolbar[toolbar] = false;
			$(`#${toolbar}`).addClass("hide");
		}
	}
	
	hideAllToolbars() {
		$(".hbrToolbar .content").addClass("hide");
		$.each(this.toolbar, (key) => {
			if(key != "content") {
				this.toolbar[key] = false;
			}
		});
	}
	
	setToolbarContent(content) {
		$.each(this.toolbar.content, (key) => {
			this.toolbar.content[key] = false;	
		});
		this.toolbar.content[`filter${content}`] = true;
	}
	
	
	// --------------------------------------------------
	// SORT
	// --------------------------------------------------
	
	changeOrder(element, order) {
		this.selectedClass = "";
		this.order = order;
		
		if(this.direction == "asc") {
			this.direction = "desc";
			this.selectedClass = "arrowDownDark";
		} else {
			this.direction = "asc";
			this.selectedClass = "arrowUpDark";
		}
		$(".navOrder span").removeClass("arrowUpDark").removeClass("arrowDownDark").addClass("arrowUpLight");
		$(`.${element} span`).removeClass("arrowUpLight").addClass(this.selectedClass);
	}
	
	resetOrder() {
		this.order = false;
		$(".navOrder span").removeClass("arrowUpDark").removeClass("arrowDownDark").addClass("arrowUpLight");
	}
	
	
	// --------------------------------------------------
	// FILTER
	// --------------------------------------------------
	
	updateFilter(property, value) {
		let id = "";
		let input = property;
		
		if($.isArray(property)) {
			id = `#${property[0].split(".")[1]}`;
			this.filter[`___${property[0].split(".")[1]}`] = {};
			$.each(property, (key, val) => {
				if(value === "" || value == -1) {
					delete this.filter[`___${property[0].split(".")[1]}`];
				} else {
					this.filter[`___${property[0].split(".")[1]}`][val.split(".")[1]] = value;
				}
				this.triggerFilter();
			});
		} else {
			id = `#${property.split(".")[1]}`;
			if(value === "" || value == -1) {
				delete this.filter[property.split(".")[1]];
			} else {
				this.filter[property.split(".")[1]] = value;
			}
			this.triggerFilter();
		}
		if(Object.keys(this.filter).length !== 0) {
			this.filterApplied = true;
		} else {
			this.filterApplied = false;
		}
		this.updateForm(input, value);
		this.removeErrorClass(id);
		console.log(this.filter);
	}
	
	triggerFilter() {
		this.filterChange++;
	}
	
	resetFilter(focus) {
		// Remove All Filters From Filter-Object, Except Aurelia-Observers
		$.each(this.filter, (key) => {
			if(key.indexOf("___") <= 1) {
				delete this.filter[key];
			}
		});
		this.filterApplied = false;
		this.triggerFilter();
		$("#filter form").each((index, form) => {
			form.reset();
		});
		this.resetOrder();
		this.resetObjects();
		$(focus).focus();
		this.scrollTop();
		this.removeStatusClasses();
	}
	
	updateForm(input, value) {
		if($.isArray(input)) {
			input = `${input[0].split(".")[0]}\\.${input[0].split(".")[1]}`;
		} else {
			input = `${input.split(".")[0]}\\.${input.split(".")[1]}`;
		}
		$(`#${input}`).val(value.toString());
	}
	
	// --------------------------------------------------
	// CRUD
	// --------------------------------------------------
	
	resetObjects() {
		// Properties That Represent Groups Of Checkboxes Need To Be Initialized As Empty Arrays
		$.each(this.$T, (key) => {
			if(key === "amount")
				this.$T[key] = 0;
				
			else
				this.$T[key] = { "crud": true };
		});
		// ADD OBSERVERS

	}
	
	edit(type, object) {
		this.$T[type] = object;
		this.$T[type].crud = true;
		
		if (type === "program") {
			this.updateFilter("program.seriesID", object.seriesID);
			this.router.navigate("programs");
			this.checkProgramRequirements(object);
		} else
		
		if(type === "season") {
			this.router.navigate("seasons");
			this.updateFilter("season.seriesID", object.seriesID);
			this.triggerFilter();
		} else
		
		if (type === "series") {
			this.router.navigate("series");
		}
		this.addProgramRequirementsObserver();
	}
	
	add(type, route) {
		this.resetObjects();
		this.$T[type].crud = true;
		this.router.navigate(route);
	}

	create(type, object) {
		let dataArray = [];
		if(type === "program")	dataArray = this.$D.allPrograms;
		if(type === "season")	dataArray = this.$D.allSeasons;
		if(type === "series")	dataArray = this.$D.allSeries;
		
		if(this.validateForm("#crud")) {
			this.url = this.config.serviceUrl + `?ws=create_${type}&item=${JSON.stringify(object)}`;
			$("#lstvLoader").show();
			$.get(this.url, response => {
				$("#lstvLoader").hide();
				if(response.status === "success") {
					dataArray.unshift(response.data);
					this.resetObjects();
					this.removeStatusClasses();
				}
				this.showNotification(response.status, response.msg);
				
			}, "json");
		}
	}
	
	trash(type, id) {
		let dataArray = [];
		if(type === "program")	dataArray = this.$D.allPrograms;
		if(type === "season")	dataArray = this.$D.allSeasons;
		if(type === "series")	dataArray = this.$D.allSeries;
		
		this.url = this.config.serviceUrl + `?ws=trash_${type}&id=${id}`;
		this.closeAllModals();
		$("#lstvLoader").show();
		$.get(this.url, response => {
			$("#lstvLoader").hide();
			if(response.status === "success") {
				$.each(dataArray, (index, item) => {
					if(item && item[`${type}ID`] == response.id) {
						dataArray.splice(index, 1);
						this.scrollTop();
					}
				});
				this.resetObjects();
				this.removeStatusClasses();
			}
			this.showNotification(response.status, response.msg);
		}, "json");
	}
	
	update(type, object) {
		let dataArray = [];
		if(type === "program")	dataArray = this.$D.allPrograms;
		if(type === "season")	dataArray = this.$D.allSeasons;
		if(type === "series")	dataArray = this.$D.allSeries;
		
		if(this.validateForm("#crud")) {
			this.url = this.config.serviceUrl + `?ws=update_${type}&item=${JSON.stringify(object)}`;
			console.log(this.url);
			$("#lstvLoader").show();
			$.get(this.url, response => {
				$("#lstvLoader").hide();
				if(response.status === "success") {
					this.scrollTop();
					//this.resetObjects();
					//this.removeStatusClasses();
				}
				this.showNotification(response.status, response.msg);
			}, "json");
		}
	}
	
	
	// --------------------------------------------------
	// OBSERVERS
	// --------------------------------------------------
	
	
	
	// --------------------------------------------------
	// FUNCTIONS
	// --------------------------------------------------
	
	showNotification(status, message) {
		if(status === "error")
			$("notification .content").html("<span class='iconic' data-glyph='x' aria-hidden='true'></span>&nbsp;&nbsp;" + message);
		else
			$("notification .content").html("<span class='iconic' data-glyph='check' aria-hidden='true'></span>&nbsp;&nbsp;" + message);
			
		$(".lstvNotification").removeClass("hide");
		$(".lstvNotification .content").removeClass("error").removeClass("success").addClass(status);
		this.hideNotification();
	}
	
	hideNotification(delay = 5000) {
		clearTimeout(this.clearNotification);
		this.clearNotification = setTimeout(() => {
			$(".lstvNotification").addClass("hide");	
		}, delay);
	}

	scrollTop() {
		$(".grid-block").scrollTop(0);
	}
	
	removeErrorClass(id) {
		// Input Group
		if($(id).find("input").length > 0) {
			$(id).find("label").removeClass("error");
		// Individual Input
		} else {
			$(id).removeClass("error");
			$(id).closest(".row").find("label").removeClass("error");
		}
	}
	
	removeStatusClasses() {
		$("form input").removeClass("error").removeClass("success");
		$("form label").removeClass("error").removeClass("success");
		$("form textarea").removeClass("error").removeClass("success");
		$("form select").removeClass("error").removeClass("success");
	}
	
	closePanel(type) {
		this.resetObjects();
		this.$T[type].crud = false;
	}
	
	closeModal(id) {
		$(id).fadeOut(250);
	}
	
	closeAllModals() {
		$(".lstvModal").addClass("hide");
	}
	
	
	openModal(id, type = false, object = false) {
		if(type && object) {
			this.$T[type] = object;
			this.$T[type].crud = true;
		}
		$(id).removeClass("hide").fadeIn(250);
	}
	
	today(type) {
		let today = new Date();
		let ss = today.getSeconds();
		let mn = today.getMinutes();
		let hh = today.getHours();
		let dd = today.getDate();
		let mm = today.getMonth() + 1;
		let yyyy = today.getFullYear();
		
		if(ss < 10) { ss = `0${ss}`; }
		if(mn < 10) { mn = `0${mn}`; } 
		if(hh < 10) { hh = `0${hh}`; } 
		if(dd < 10) { dd = `0${dd}`; } 
		if(mm < 10) { mm = `0${mm}`; }
		
		if (type == "time") {
			return `${hh}:${mn}:${ss}`;
		}
		if (type == "date") {
			return `${yyyy}-${mm}-${dd}`;
		}
		if (type == "datetime") {
			return `${yyyy}-${mm}-${dd} ${hh}:${mn}:${ss}`;
		}
		if (type == "timestamp") {
			return `${yyyy}${mm}${dd}${hh}${mn}${ss}`;
		}
		
	}

	oneMonthBefore() {
		let today = new Date();
		let dd = today.getDate();
		let mm = today.getMonth();
		let yyyy = today.getFullYear();
		
		if(dd < 10) {
			dd = `0${dd}`;
		} 
		if(mm < 10) {
			mm = `0${mm}`;
		} 
		return `${yyyy}-${mm}-${dd}`;
	}
	
	getFilteredArray(array, context) {
		context.filteredArray = array;
	}
	
	exportSalesPDF() {
		var columns = [
			{title: "Artikelnummer", dataKey: "artikelnr"}, 
			{title: "Bezeichnung", dataKey: "bezeichnung"},
			{title: "Menge", dataKey: "menge"},
			{title: "EVK", dataKey: "epreis"},
			{title: "GVK", dataKey: "gpreis"},
			{title: "GVK Netto", dataKey: "gpreisnetto"},
			{title: "%", dataKey: "rabatt"},
			{title: "RgNr.", dataKey: "auftragnr"},
			{title: "Datum", dataKey: "datum"},
			{title: "Shop", dataKey: "shop"}
			
		];
				
		// Only pt supported (not mm or in)
		var pdf = new jsPDF('l', 'pt');
		var totalPagesExp = "{total_pages_count_string}";
		
		var rows = this.filteredArray;
		var arrow = "data:image/jpeg;base64,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";
		var logo = "data:image/jpeg;base64,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";
		var startdate = this.dates.startdate;
		var enddate = this.dates.enddate;
		var exportdatum = this.today("datetime");
		var timestamp = this.today("timestamp");

		// KOPFZEILE
		pdf.setFontSize(12).setTextColor(25, 61, 92).text("ABC ARTIKELVERKÄUFE", 40, 55);
		pdf.setFontSize(12).setTextColor(97, 159, 212).text(`Zeitraum: ${startdate} - ${enddate}`, 203, 55);
		pdf.addImage(arrow, 'JPEG', 188.5, 45.5, 9, 10);
		pdf.addImage(logo, 'JPEG', 767, 40, 35, 17);
		
		var columnsSummary = [
			{title: "label:", dataKey: "label"}, 
			{title: "value:", dataKey: "value"},
		];
		
		var rowsSummary = [
			{"label": "Zeitraum:", "value": `${startdate} - ${enddate}`}, 
			{"label": "Lieferant:", "value": $(".vendor").text()},
			{"label": "Shop:", "value": $(".shops").html()},
			{"label": "Anzahl Aufträge:", "value": $(".rechnungen").text()},
			{"label": "Anzahl Artikel:", "value": $(".verkauf").text()},
			{"label": "Anzahl Exemplare:", "value": $(".exemplareverkauft").text()},
			{"label": "Umsatz € (brutto):", "value": $(".umsatz").text()},
			{"label": "Umsatz € (netto):", "value": $(".umsatzNetto").text()}
		];

		pdf.autoTable(columnsSummary, rowsSummary, {
			showHeader: 'never',
			margin: {
				top: 250,
				left: 35
			},
			columnStyles: {
				label:		{ columnWidth: 110 },
				value:		{ columnWidth: 125, halign: 'right' }
			},
			bodyStyles: {
				fillColor: [255, 255, 255],
				textColor: 77
			},
			alternateRowStyles: {
				fillColor: [255, 255, 255]
			},
			addPageContent: function(data) {
				var seite = data.pageCount;
				if (typeof pdf.putTotalPages === 'function') {
					seite = seite + " von " + totalPagesExp;
				}
				pdf.setFontSize(8).setTextColor(77).text(`EVK = Einzelverkaufspreis, GVK = Gesamtverkaufspreis, % = Rabatt | Export: ${exportdatum}`, 448, 565);
				pdf.setFontSize(8).setTextColor(77).text(`Seite ${seite}`, 40, 565);
				pdf.setDrawColor(33).line(40, 62, 802, 62);
			}
		});
		
		pdf.addPage();
		
		pdf.autoTable(columns, rows, {
			styles: {
				fontSize: 9
			},
			columnStyles: {
				artikelnr:		{ columnWidth: 105 },
				bezeichnung:	{ columnWidth: 245 },
				menge:			{ columnWidth: 41, halign: 'right' },
				auftragnr:		{ columnWidth: 36 },
				epreis:			{ halign: 'right' },
				gpreis:			{ halign: 'right' },
				gpreisnetto:	{ halign: 'right', columnWidth: 59 },
				rabatt: 		{ columnWidth: 20 },
				datum:			{ columnWidth: 56 },
				shop:			{ columnWidth: 125 }
			},
			headerStyles: {
				fillColor: [255, 255, 255],
				fontStyle: 'regular',
				fontSize: 10,
				textColor: 33,
				lineHeight: 55,
			},
			bodyStyles: {
				fillColor: [230, 230, 230],
				textColor: 77
			},
			alternateRowStyles: {
				fillColor: [255, 255, 255]
			},
			margin: {
				top: 40,
				bottom: 60
			},
			addPageContent: function(data) {
				var seite = data.pageCount;
				if (typeof pdf.putTotalPages === 'function') {
					seite = seite + 1 + " von " + totalPagesExp;
				}
				pdf.setFontSize(8).setTextColor(77).text(`EVK = Einzelverkaufspreis, GVK = Gesamtverkaufspreis, % = Rabatt | Export: ${exportdatum}`, 448, 565);
				pdf.setFontSize(8).setTextColor(77).text(`Seite ${seite}`, 40, 565);
				pdf.setDrawColor(33).line(40, 62, 802, 62);
			}
		});
		
		if (typeof pdf.putTotalPages === 'function') {
			pdf.putTotalPages(totalPagesExp);
		}
		
		pdf.output('save', `${timestamp}_ABC-Artikelverkäufe_${startdate}-${enddate}.pdf`);
	}
	
	exportCommissionsPDF() {
		var columns = [
			{title: "Artikelnummer", dataKey: "artikelnr"}, 
			{title: "Bezeichnung", dataKey: "bezeichnung"},
			{title: "Menge", dataKey: "menge"},
			{title: "Datum", dataKey: "datum"},
			{title: "Shop", dataKey: "shop"},
			{title: "EVK", dataKey: "epreis"},
			{title: "GVK", dataKey: "gpreis"},
			{title: "ST %", dataKey: "eksteuer"},
			{title: "GVK Netto", dataKey: "cgpreisnetto"},
			{title: "%", dataKey: "ekrabatt"},
			{title: "GEK", dataKey: "cgekpreis"}			
		];
				
		// Only pt supported (not mm or in)
		var pdf = new jsPDF('l', 'pt');
		var totalPagesExp = "{total_pages_count_string}";
		
		var rows = this.filteredArray;
		var arrow = "data:image/jpeg;base64,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";
		var logo = "data:image/jpeg;base64,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";
		var startdate = this.dates.startdate;
		var enddate = this.dates.enddate;
		var exportdatum = this.today("datetime");
		var timestamp = this.today("timestamp");

		// KOPFZEILE
		pdf.setFontSize(12).setTextColor(25, 61, 92).text("ABC KOMMISSIONSVERKÄUFE", 40, 55);
		pdf.setFontSize(12).setTextColor(97, 159, 212).text(`Zeitraum: ${startdate} - ${enddate}`, 240, 55);
		pdf.addImage(arrow, 'JPEG', 225, 45.5, 9, 10);
		pdf.addImage(logo, 'JPEG', 767, 40, 35, 17);
		
		var columnsSummary = [
			{title: "label:", dataKey: "label"}, 
			{title: "value:", dataKey: "value"},
		];
		
		var rowsSummary = [
			{"label": "Zeitraum:", "value": `${startdate} - ${enddate}`}, 
			{"label": "Lieferant:", "value": $(".vendor").text()},
			{"label": "Shop:", "value": $(".shops").html()},
			{"label": "Anzahl Aufträge:", "value": $(".rechnungen").text()},
			{"label": "Anzahl Artikel:", "value": $(".verkauf").text()},
			{"label": "Anzahl Exemplare:", "value": $(".exemplareverkauft").text()},
			{"label": "", "value": ""},
			{"label": "Umsatz € (netto):", "value": $(".umsatzNettoKommission").text()},
			{"label": "Rabatt %:", "value": $(".ekrabatt").val()},
			{"label": "Gesamt-EK €:", "value": $(".gesamtEK").text()}
		];

		pdf.autoTable(columnsSummary, rowsSummary, {
			showHeader: 'never',
			margin: {
				top: 250,
				left: 35
			},
			columnStyles: {
				label:		{ columnWidth: 110 },
				value:		{ columnWidth: 125, halign: 'right' }
			},
			bodyStyles: {
				fillColor: [255, 255, 255],
				textColor: 77
			},
			alternateRowStyles: {
				fillColor: [255, 255, 255]
			},
			addPageContent: function(data) {
				var seite = data.pageCount;
				if (typeof pdf.putTotalPages === 'function') {
					seite = seite + " von " + totalPagesExp;
				}
				pdf.setFontSize(8).setTextColor(77).text(`Export: ${exportdatum}`, 700, 565);
				pdf.setFontSize(8).setTextColor(77).text(`Seite ${seite}`, 40, 565);
				pdf.setDrawColor(33).line(40, 62, 802, 62);
			}
		});
		
		pdf.addPage();
		
		pdf.autoTable(columns, rows, {
			styles: {
				fontSize: 9
			},
			columnStyles: {
				artikelnr:		{ columnWidth: 105 },
				bezeichnung:	{ columnWidth: 200 },
				menge:			{ columnWidth: 41, halign: 'right' },
				datum:			{ columnWidth: 56 },
				shop:			{ columnWidth: 110 },
				epreis:			{ halign: 'right' },
				gpreis:			{ halign: 'right' },
				eksteuer:		{ columnWidth: 35, halign: 'right' },
				cgpreisnetto:	{ halign: 'right', columnWidth: 59 },
				ekrabatt: 		{ columnWidth: 20 },
				cgekpreis:		{ columnWidth: 35, halign: 'right' }
			},
			headerStyles: {
				fillColor: [255, 255, 255],
				fontStyle: 'regular',
				fontSize: 10,
				textColor: 33,
				lineHeight: 55,
			},
			bodyStyles: {
				fillColor: [230, 230, 230],
				textColor: 77
			},
			alternateRowStyles: {
				fillColor: [255, 255, 255]
			},
			margin: {
				top: 40,
				bottom: 60
			},
			createdCell: function (cell, data) {
				var value = data.row.raw.cgekpreis;
				value = parseFloat(value).toFixed(2);
				data.row.raw.cgekpreis = value;
			},
			addPageContent: function(data) {
				var seite = data.pageCount;
				if (typeof pdf.putTotalPages === 'function') {
					seite = seite + 1 + " von " + totalPagesExp;
				}
				pdf.setFontSize(8).setTextColor(77).text(`EVK = Einzelverkaufspreis, GVK = Gesamtverkaufspreis, ST = Steuer, % = Rabatt, GEK = Gesamteinkaufspreis | Export: ${exportdatum}`, 295, 565);
				pdf.setFontSize(8).setTextColor(77).text(`Seite ${seite}`, 40, 565);
				pdf.setDrawColor(33).line(40, 62, 802, 62);
			}
		});
		
		if (typeof pdf.putTotalPages === 'function') {
			pdf.putTotalPages(totalPagesExp);
		}
		
		pdf.output('save', `${timestamp}_ABC-Kommissionsverkäufe_${startdate}-${enddate}.pdf`);
	}
	
	round(value, decimals) {
		var number = Number(Math.round(value+'e'+decimals)+'e-'+decimals);
		
		if(number.toString().indexOf(".") !== -1) {
			var dd = number.toString().split(".")[1].length;
			var diff = decimals - Number(dd);
			
			if(diff > 0) {
				for (var i = 1; i <= diff; i++) {
					number = number + "0";
				}
			}
		} else {
			number = number + ".";
			for (var j = 1; j <= decimals; j++) {
				number = number + "0";
			}
		}
		return number;
	}
	
	modifyArray(array, key, newValue) {
		$.each(array, (index, object) => {
			object[key] = newValue;
		});
	}
	
	updateTotalEK(array, discount) {
		let gesamtEK = 0;
		
		if ($.isNumeric(discount)) {
			discount = parseFloat(discount);
			
			$.each(array, (index, object) => {
				var cgpreisnetto = parseFloat(object.cgpreisnetto);
				
				if (cgpreisnetto < 0) {
					object.cgekpreis = cgpreisnetto;
					object.ekrabatt = 0;
				} else {
					object.cgekpreis = (cgpreisnetto / 100) * (100 - discount);
				}
				gesamtEK = gesamtEK + object.cgekpreis;
			});
		} else {
			$.each(array, (index, object) => {
				var cgpreisnetto = parseFloat(object.cgpreisnetto);
				if (cgpreisnetto < 0) {
					object.cgekpreis = cgpreisnetto;
					object.ekrabatt = 0;
				} else {
					object.cgekpreis = cgpreisnetto;
				}
				gesamtEK = gesamtEK + object.cgekpreis;
			});
		}
		gesamtEK = this.round(gesamtEK, 2);
		$(".gesamtEK").text(gesamtEK);			
	}

}