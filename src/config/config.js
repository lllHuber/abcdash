let configDevelopment = {
  serviceUrl: "http://abcdash.dev:8888/services/services.php",
  authUrl: "http://abcdash.dev:8888/services/auth.php",
  tokenPrefix: "abc"
}

let configProduction = {
  serviceUrl: "http://abcdash.dev:8888/services/services.php",
  authUrl: "http://abcdash.dev:8888/services/auth.php",
  tokenPrefix: "abc"
}

let config;

if (window.location.hostname === 'localhost') {
    config = Object.assign({}, configDevelopment);
}
else {
    config = Object.assign({}, configProduction);

}

export default config;