import config from 'config/config';
import { inject } from "aurelia-framework";
import { BindingEngine } from 'aurelia-binding';
import { Router } from 'aurelia-router';
import { MultiObserver } from 'singletons/multiObserver';

@inject(config, Router, MultiObserver, BindingEngine)
export default class Functions {
 
	constructor(config, Router, MultiObserver, BindingEngine) {
		this.config = config;
		this.router = Router;
		console.log(this.router);
		this.observer = MultiObserver;
		this.observe = BindingEngine;
		this.$ui = {
			"resizable": ""	
		};
		
		this.dates = {
			"startdate": this.oneMonthBefore(),
			"enddate": this.today()
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
				"filterSales": false
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
			"allSales"			: this.allSales
		};
		
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
				this.$D.allSales = response.data;
				console.log(this.$D.allSales);
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
	
	today() {
		let today = new Date();
		let dd = today.getDate();
		let mm = today.getMonth() + 1;
		let yyyy = today.getFullYear();
		
		if(dd < 10) {
			dd = `0${dd}`;
		} 
		if(mm < 10) {
			mm = `0${mm}`;
		} 
		return `${yyyy}-${mm}-${dd}`;
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
	
	exportPDF() {
		console.log("export");
		var columns = [
			{title: "ID", dataKey: "id"},
			{title: "Name", dataKey: "name"}, 
			{title: "Country", dataKey: "country"}
		];
		var rows = [
			{"id": 1, "name": "Shaw", "country": "Tanzania"},
			{"id": 2, "name": "Nelson", "country": "Kazakhstan"},
			{"id": 3, "name": "Garcia", "country": "Madagascar"}
		];
		
		// Only pt supported (not mm or in)
		var doc = new jsPDF('p', 'pt');
		doc.autoTable(columns, rows, {
			styles: {fillColor: [100, 255, 255]},
			columnStyles: {
				id: {fillColor: 255}
			},
			margin: {top: 60},
			beforePageContent: function(data) {
				doc.text("Header", 40, 30);
			}
		});
		doc.save('table.pdf');
				
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

}