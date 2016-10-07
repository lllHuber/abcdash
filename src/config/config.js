
let configDevelopment = {
  
  serviceUrl: "http://lsods.dev/services/services.php",
  authUrl: "http://lsods.dev/services/auth.php",
  tokenPrefix: "lstv",
  
  programStatus: {
    "00" : "rejected",
    "01" : "approved",
    "02" : "approved&nbsp;&&nbsp;proofed",
    "03" : "awaiting&nbsp;approval"
  },
  
  broadcastStatus: {
    "00" : "new",
    "01" : "active",
    "02" : "archived",
    "03" : "missing"
  }
  
}








let configProduction = {
  serviceUrl: "http://lsods.dev/services/services.php",
  authUrl: "http://lsods.dev/services/auth.php",
  tokenPrefix: "lstv"
}

let config;

if (window.location.hostname === 'localhost') {
    config = Object.assign({}, configDevelopment);
}
else {
    config = Object.assign({}, configProduction);

}

export default config;