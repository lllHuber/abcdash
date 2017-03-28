import AuthService from 'singletons/authService';
import {inject, computedFrom} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {EventAggregator} from 'aurelia-event-aggregator';
import $ from 'jquery';


@inject(AuthService, HttpClient, computedFrom, EventAggregator)
export class Login {
	
	constructor(AuthService, BindingEngine, http, EventAggregator) {
        this.http = http;
        this.auth = AuthService;
		this.ea = EventAggregator;
		this.currentYear = new Date().getFullYear();
		
		this.username = "";
		this.password = "";
    }
	
	attached() {
		let credentialsChange = this.ea.subscribe('credentialsChange', this.toggleLoginButton.bind(this));
		$("input[name=userPassword]").keyup(this.checkForEnter.bind(this));
	}
	
	detached() {
		this.auth.response = '';
    }	
	
	// --------------------------------------------------
	//	FUNCTIONS
	// --------------------------------------------------
	
	enableLoginButton() {
		$(".hbrLoginButton").addClass("unlocked").prop("disabled", false);
	}
	
	disableLoginButton() {
		$(".hbrLoginButton").removeClass("unlocked").prop("disabled", true);
	}
	
	publishCredentialsChange() {
		this.credentials = {
			"username": this.username,
			"password": this.password
		};
		this.ea.publish("credentialsChange", this.credentials);
	}
	
	checkForEnter(key) {
		if(key.keyCode == 13)
			this.sendCredentials();
	}
	
	sendCredentials() {
		let result = this.auth.login(this.credentials);
	}
	
	toggleLoginButton (credentials) {
		if( credentials.username != "" && credentials.password != "" ) {
			this.enableLoginButton();
		} else {
			this.disableLoginButton();
		}
	}
}