import { Aurelia, inject, bindable } from 'aurelia-framework';
import { HttpClient, json } from 'aurelia-fetch-client';
import config from '../config/config';

@inject(config, Aurelia, HttpClient)
export default class AuthService {

	response = null;
	session = null;
	isAuthenticated = false;
	initSession = this.startSession();
	
	constructor(config, Aurelia, HttpClient) {

		this.http = HttpClient;
		this.app = Aurelia;
		this.config = config;
	}	

	login(credentials) {
        this.http.fetch(this.config.authUrl, {
			credentials: 'include',
			method: 'post',
			body: json(credentials)
		})
		.then(result => result.json())
        .then(result => {
			this.response = result;
			if(result.status == "success") {
				// LOGIN
				sessionStorage[config.tokenPrefix + "AuthToken"] = result.data;
				this.response = result;
				this.startSession();
				if(this.isAuthenticated) {
					this.app.setRoot('app');
				}
		    }
        })
		.catch(error => {
			console.log(error);
		});
	}

	logout() {
		this.destroySession();
	}
	
	startSession() {
		this.jwt = sessionStorage.getItem(config.tokenPrefix + "AuthToken");
		
		if(this.jwt === null) {
			this.session = null;
			return;
		
		} else {
			this.user = JSON.parse(atob(this.jwt.split(".")[1]));
			this.isAuthenticated = true;
		}
	}
	
	destroySession() {
		sessionStorage.removeItem(config.tokenPrefix + "AuthToken");
		this.session = null;
		this.app.setRoot('login');
	}
	
	can(permission) {
		return true; // why not?
	}
}