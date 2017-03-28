
let configDevelopment = {
  serviceUrl: "http://abc.dev/abcdash/services/services.php",
  authUrl: "http://abc.dev/abcdash/services/auth.php",
  tokenPrefix: "abc"
}








let configProduction = {
  serviceUrl: "http://abcserver/dash/services/services.php",
  authUrl: "http://abcserver/dash/services/auth.php",
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