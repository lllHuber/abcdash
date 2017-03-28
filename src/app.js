// Import Modules
import AuthService from "singletons/authService";
import config from 'config/config';
import Functions from "singletons/functions";
import { inject } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';

// Import Dependent Classes From View-Models
import {Dashboard} from 'dashboard';
import {Lagerbestand} from 'lagerbestand';
import {Kunden} from 'kunden';


@inject(AuthService, config, EventAggregator, Functions, Dashboard, Lagerbestand, Kunden)
export class App {
	
	constructor(AuthService, config, EventAggregator, Functions, Dashboard, Lagerbestand, Kunden) {
		// Define Dependencies
		this.currentYear = new Date().getFullYear();
		this.auth = AuthService;
		this.config = config;
		this.ea = EventAggregator;
		this.functions = Functions;
		this.dashboard = Dashboard;
		this.lagerbestand = Lagerbestand;
		this.kunden = Kunden;
	}

	
	// --------------------------------------------------
	// MAIN NAVIGATION ROUTER
	// --------------------------------------------------
	
	configureRouter(config, router) {
		config.title = "ABC Dash";
		config.map([
			// EXAMPLE ROUTE
			// { route: ['page', 'page'], name: 'page', moduleId: 'page', nav: true, title: 'Page' },
			{ route: ['lagerbestand', 'lagerbestand'], name: 'lagerbestand', moduleId: 'lagerbestand', nav: true, title: 'Lagerbestand',
				settings: { icon: 'list' }
			},
			{ route: ['kunden', 'kunden'], name: 'kunden', moduleId: 'kunden', nav: true, title: 'Kunden',
				settings: { icon: 'person-genderless' }
			},
			
			{ route: ['', 'dashboard'], name: 'dashboard', moduleId: 'dashboard', nav: false, title: 'Dashboard' }
		]);
		this.router = router;
	}	
}
