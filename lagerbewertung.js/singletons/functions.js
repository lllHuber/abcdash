import config from 'config/config';
import { inject } from "aurelia-framework";
import { Router } from 'aurelia-router';
import { MultiObserver } from 'singletons/multiObserver';

@inject(config, Router, MultiObserver)
export default class Functions {
 
	constructor(config, Router, MultiObserver) {
		this.config = config;
		this.router = Router;
		this.observer = MultiObserver;
		this.$ui = {
			"resizable": ""	
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
			"addProgram" 		: false,
			"filter"			: false,
			"edit"				: false,
			
			content				: {
				"filterPrograms": true,
				"filterSeasons" : false,
				"filterSeries"	: false
			}
		};

		// Store Temp Data For Editing
		this.$T = {
			"program": {},
			"season": {},
			"series": {}
		};
		this.resetObjects();
		
		// Store Data In $D
		this.$D = {
			"allCategories"			: this.allCategories,
			"allSeries"				: this.allSeries,
			"allSeasons"			: this.allSeasons,
			"allPrograms"			: this.allPrograms,
			"allSources"			: this.allSources,
			"allLocations"			: this.allLocations,
			"programStatus"			: this.programStatus,
			"broadcastStatus"		: this.broadcastStatus,
			"programStatusNames"	: {},
			"broadcastStatusNames"	: {},
			"locationNames"			: {},
			"sourceNames"			: {},
			"seriesNames"			: {}
		};
		
	}

	
	// --------------------------------------------------
	// GET DATA
	// --------------------------------------------------
	
	get allPrograms() {
		this.url = this.config.serviceUrl + "?ws=get_all_programs";
		$("#lstvLoader").show();
		$.get(this.url, response => {
			$("#lstvLoader").hide();
			if(response.success === true) {
				this.$D.allPrograms = response.data;
			}
		}, "json");
	}
	
	get allSeasons() {
		this.url = this.config.serviceUrl + "?ws=get_all_seasons";
		$("#lstvLoader").show();
		$.get(this.url, response => {
			$("#lstvLoader").hide();
			if(response.success === true) {
				this.$D.allSeasons = response.data;
			}
		}, "json");
	}
	
	get allSeries() {
		this.url = this.config.serviceUrl + "?ws=get_all_series";
		$("#lstvLoader").show();
		$.get(this.url, response => {
			$("#lstvLoader").hide();
			if(response.success === true) {
				this.$D.allSeries = response.data;
				$.each(this.$D.allSeries, (key, series) => {
					this.$D.seriesNames[series.seriesID] = series.series_name;
				});
			}
		}, "json");
	}
	
	get allCategories() {
		this.url = this.config.serviceUrl + "?ws=get_all_categories";
		$("#lstvLoader").show();
		$.get(this.url, response => {
			$("#lstvLoader").hide();
			if(response.success === true) {
				this.$D.allCategories = response.data;
			}
		}, "json");
	}
	
	get allSources() {
		this.url = this.config.serviceUrl + "?ws=get_all_sources";
		$("#lstvLoader").show();
		$.get(this.url, response => {
			$("#lstvLoader").hide();
			if(response.success === true) {
				this.$D.allSources = response.data;
				$.each(this.$D.allSources, (key, source) => {
					this.$D.sourceNames[source.sourceID] = source.source_name;
				});
			}
		}, "json");
	}
	
	get allLocations() {
		this.url = this.config.serviceUrl + "?ws=get_all_locations";
		$("#lstvLoader").show();
		$.get(this.url, response => {
			$("#lstvLoader").hide();
			if(response.success === true) {
				this.$D.allLocations = response.data;
				$.each(this.$D.allLocations, (key, location) => {
					this.$D.locationNames[location.program_locationID] = `${location.location_name} ${location.location_description ? '('+location.location_description+')' : ''}`;
				});
			}
		}, "json");
	}

	get programStatus() {
		this.url = this.config.serviceUrl + "?ws=get_program_status";
		$("#lstvLoader").show();
		$.get(this.url, response => {
			$("#lstvLoader").hide();
			if(response.success === true) {
				this.$D.programStatus = response.data;
				this.$D.programStatusNames = {};
				$.each(this.$D.programStatus, (key, status) => {
					this.$D.programStatusNames[status.program_status] = status.program_status_name;
				});
			}
		}, "json");
	}
	
	get broadcastStatus() {
		this.url = this.config.serviceUrl + "?ws=get_broadcast_status";
		$("#lstvLoader").show();
		$.get(this.url, response => {
			$("#lstvLoader").hide();
			if(response.success === true) {
				this.$D.broadcastStatus = response.data;
				this.$D.broadcastStatusNames = {};
				$.each(this.$D.broadcastStatus, (key, status) => {
					this.$D.broadcastStatusNames[status.broadcast_status] = status.broadcast_status_name;
				});
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
		$(`.lstvToolbar .content:not(#${toolbar})`).addClass("hide");
		
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
		$(".lstvToolbar .content").addClass("hide");
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
			if(key === "program")
				this.$T[key] = {
					"crud": true,
					"program_comments": "",
					"program_aquired": "0",
					"program_need_editing": "0",
					"program_ondemand": "0",
					"program_status": "03",
					"broadcast_status": "00",
					"program_languages": [],
					"requirements": []
				};
				
			else if(key === "season") 
				this.$T[key] = {
					"crud": true,
					"season_comments": "",
					"season_aquired": "0",
					"season_is_ongoing": "0",
					"season_ondemand": "0",
					"season_status": "03",
					"broadcast_status": "00",
					"categoryIDs": []
				};
			
			else if(key === "series") 
				this.$T[key] = {
					"crud": true,
					"series_comments": "",
					"series_aquired": "0",
					"series_ondemand": "0",
					"series_status": "03",
					"broadcast_status": "00",
					"categoryIDs": []
				};
				
			else
				this.$T[key] = { "crud": true };
		});
		// ADD OBSERVERS
		this.addProgramRequirementsObserver();
		this.addSeasonSeriesChangeObserver();
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
	
	addProgramRequirementsObserver() {
		this.observer.observe(this.$T.program, [
			"program_aquired",
			"program_need_editing",
			"program_status",
			"broadcast_status"
		], this.checkProgramRequirements.bind(this));
	}
	
	addSeasonSeriesChangeObserver() {
		this.observer.observe(this.$T.season, [
			"seriesID",
		], this.generateSeasonFormData.bind(this));
	}
	
	// --------------------------------------------------
	// FUNCTIONS
	// --------------------------------------------------
	
	getStatusName(statusID) {
		$.each(this.$D.programStatus, (key, status) => {
			if(status.program_status == statusID.toString()) {
				return `${status.program_status_name}`;
			}
		});
	}
	
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
	
	characterLimit(id, limit) {
		let length = $(id).val().length;
		if(length >= limit) {
			$(id).addClass("error");
			$(id).closest(".row").find("small").addClass("error");
			$(id).closest(".row").find("label").addClass("error");
			return false;
		} else {
			$(id).removeClass("error");
			$(id).closest(".row").find("small").removeClass("error");
			$(id).closest(".row").find("label").removeClass("error");
			return true;
		}
	}
	
	validateForm(form) {
		let missingFields = {};
		let valid = true;
		$.each($(`${form} [required]`), (key, element) => {
			// Input Group
			if($(element).find("input").length > 0) {
				let checked = 0;
				$(element).find("input").each((key, input) => {
					if(input.checked) {
						checked = 1;
					}
				});
				if(checked === 0) {
					$(element).closest(".row").find("label").addClass("error");
					valid = false;
				}
			}
			// Individual Input
			else {
				if(element.value === "") {
					missingFields[element.id] = element.value;
					$(element).addClass("error");
					$(element).closest(".row").find("label").addClass("error");
					valid = false;
				}
			}
		});
		if(!this.characterLimit("#desc_short", 100) || !this.characterLimit("#desc_long", 235)) {
			valid = false;
		}
		// Focus On First Missing Field
		$.each(missingFields, (key) => {
			$(`#${key}`).focus();
			return false;
		});
		if(!valid) {
			this.showNotification("error", "Validation errors occured!");
		}
		this.scrollTop();
		return valid;
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
	
	generateProgramFormData() {
		let episodeNo = 0;
		let seriesCode = "";
		let seasonCode = "";
		let programCode = "";
		
		// EPISODE NUMBER
		$.each(this.$D.allPrograms, (index, program) => {
			if(program.trashed != 1 && program.seasonID == this.$T.program.seasonID && parseInt(program.episode_no) > episodeNo) {
				episodeNo = program.episode_no;
			}
		});
		episodeNo++;
		this.$T.program.episode_no = episodeNo;
		if(episodeNo > 0 && episodeNo < 10) {
			episodeNo = `0${episodeNo}`;
		}
		
		// SEASON CODE / SCHEDULE CODE
		$.each(this.$D.allSeasons, (key, season) => {
			if(season.trashed != 1 &&season.seasonID == this.$T.program.seasonID) {
				seasonCode = season.season_code;
				return false;
			}
		});
		
		// Add Fill-Numbers To Match Code Pattern [seriescode][yy][mm][xx]
		$.each(this.$D.allSeries, (key, series) => {
			if(series.trashed != 1 && series.seriesID == this.$T.program.seriesID) {
				seriesCode = series.series_code;
				return false;
			}
		});
		let seasonNumber = seasonCode.replace(seriesCode, "");
		let addNumbers = 0;
		let fillNumbers = "";
		if(seasonNumber) { addNumbers = 4 - seasonNumber.length; }
		for(var i = 0; i < addNumbers; i++) {
			fillNumbers += "0";
		}
		programCode = `${seriesCode}${fillNumbers}${seasonNumber}${episodeNo}`;
		this.$T.program.program_code = programCode;
		this.$T.program.program_code_schedule = programCode;
		
		// STREAMING URLS
		this.$T.program.video_url_sd = `xrtmp://stream1.lifestyletv.se/vod/$mp4:INT/${seriesCode}/${seasonCode}/${programCode}_mq.mp4`;
		this.$T.program.video_url_hd = `xrtmp://stream1.lifestyletv.se/vod/$mp4:INT/${seriesCode}/${seasonCode}/${programCode}_hq.mp4`;
		
		// APPLY CSS CLASSES
		$("#episode_no").addClass("success");
		$("#program_code").addClass("success");
		$("#program_code_schedule").addClass("success");
		$("#video_url_sd").addClass("success");
		$("#video_url_hd").addClass("success");
		this.removeErrorClass("#seasonID");
		this.removeErrorClass("#episode_no");
		this.removeErrorClass("#program_code");
		this.removeErrorClass("#program_code_schedule");
		this.removeErrorClass("#video_url_hd");
		this.removeErrorClass("#video_url_sd");
	}
	
	generateSeasonFormData() {
		let date = new Date();
		let fullYear = date.getFullYear();
		let year = fullYear.toString().slice(2);
		let seriesCode = "";
		let seriesID = "";
		let seasonNumber = 0;
		// Get Series Code
		$.each(this.$D.allSeries, (key, series) => {
			if(series.seriesID == this.$T.season.seriesID) {
				seriesCode = series.series_code;
				seriesID = series.seriesID;
				return false;
			}
		});
		
		if(seriesCode !== "") {
			// Get Season Number
			$.each(this.$D.allSeasons, (key, season) => {
				if(season.trashed != 1 && season.seriesID == seriesID && season.season_code && season.season_code.indexOf(year) >= 0)	 {
					seasonNumber++;
					console.log(season.season_code);
				}
			});
			seasonNumber++;
			if(seasonNumber > 0 && seasonNumber < 10) {
				seasonNumber = `0${seasonNumber}`;
			}
			
			this.$T.season.season_code = seriesCode + year + seasonNumber;
			$("#season_code").removeClass("error").addClass("success");
		}
	}
	
	checkProgramRequirements() {
		// Program Is Ready To Be Aired If:
		// program status != 'rejected' or 'waiting approval'
		// program doesn't need editing
		// program is acquired (video file available)
		this.$T.program.requirements = [];

		// READY TO AIR
		if(this.$T.program.program_status !== "00" && this.$T.program.program_status !== "03" && this.$T.program.broadcast_status !== "02" && this.$T.program.broadcast_status !== "03" && this.$T.program.program_need_editing === "0" && this.$T.program.program_aquired === "1") {
			this.$T.program.requirements.push({text: "Ready to be aired", status: "success"});
		} else {
			this.$T.program.requirements.push({text: "Ready to be aired", status: "error"});
		}
		
		this.setNextScheduledAirDate(this.$T.program.programID);
		this.setOnDemandVideoStatus(this.$T.program.programID);
		
		
		
		// ON-DEMAND GRAPHIC -> AJAX CHECK IF FILE EXISTS
		this.$T.program.requirements.push({text: "On-Demand graphic", status: "error"});
	}
	
	// Updates whenever program is updated -> Too Often!!
	setNextScheduledAirDate(id) {
		this.url = this.config.serviceUrl + `?ws=get_next_air_date&id=${id}`;
		$.get(this.url, response => {
			if(response.status === "success") {
				this.$T.program.requirements.push({text: `Next scheduled air date: ${response.next_air_date}`, status: "success"});
			} else {
				this.$T.program.requirements.push({text: "Next scheduled air date", status: "error"});
			}
		}, "json");
	}
	
	setOnDemandVideoStatus(id) {
		this.url = this.config.serviceUrl + `?ws=on_demand_video_files_exist&id=${id}`;
		$.get(this.url, response => {
			if(response.status === "success") {
				this.$T.program.requirements.push({text: "On-Demand video", status: "success"});
			} else {
				this.$T.program.requirements.push({text: "On-Demand video", status: "error"});
			}
		}, "json");
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

}