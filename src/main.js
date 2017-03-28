import AuthService from 'singletons/authService';
import "../node_modules/whatwg-fetch/fetch";
import $ from "jquery";
import 'jquery-ui';

export function configure(aurelia) {
	aurelia.use
		.standardConfiguration()
		//.developmentLogging()
		.plugin("aurelia-animator-css")
		.plugin("aurelia-ui-virtualization")
		.globalResources(
			
			// Custom Elements
			"elements/graphic.html",
			"elements/panel.html",
			"elements/icon.html",
			"elements/loader.html",
			"elements/callout.html",
			"elements/sysMessage.html",
			"elements/notification.html",
			"elements/closeButton.html",
			"elements/modal.html",
			
			// Custom Attributes
			"attributes/datepicker.js",
			
			// Value Converters
			"converters/orderBy.js",
			"converters/replaceWhiteSpace.js",
			"converters/filter.js"
		)
	;
		
	aurelia.start().then(() => {
		let auth = aurelia.container.get(AuthService);
		let root = auth.isAuthenticated ? 'app' : 'login';
		aurelia.setRoot(root);
	});
}