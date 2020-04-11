const https = require('https');

/*
 * Schedules a given web API query via HTTPS to occur at regular intervals and return the
 * result of each query via a callback function.
 */
class HttpsApiIntervalQuery {
	// Object vars:
	//   queryInterval
	//   requestString
	//   callback
	//   intervalHandle
	
	constructor(queryInterval, url, name, params, callback) {
		this.queryInterval = queryInterval;
		this.callback = callback;
		
		// The supplied callback should be a function with one input variable
		// representing a JSON response from the api
		this.callback = callback;
		
		//Start building the api request string
		this.requestString = url + name + "?";
		
		// Stringify the JSON params and break down into individual param/value pairs
		let stringParams = JSON.stringify(params);
		
		// Remove braces and quotes from string
		let requestParamsString = stringParams.replace(/[{}"]/g, "");
		
		// Create an array of strings. Each string contains a paramater/value pair
		let individualRequestParamPairs = requestParamsString.split(",");
		console.log("individualRequestParamPairs: " + individualRequestParamPairs);
		
		// Iterate through the parameter/value pairs to assemble the final API request string
		for(var i = 0; i < individualRequestParamPairs.length; i++) {
			// create an array where element 0 contains the parameter name and
			// element 1 contains the parameter value
			let pair = individualRequestParamPairs[i].split(":");
			// Insert an "=" between the parameter/value pair and add the result to the request string
			this.requestString += pair[0] + '=' + pair[1];
			
			// If we haven't reached the last parameter pair, add the "&" 
			// separator between this pair and the next in the string
			if (i < individualRequestParamPairs.length - 1) {
				this.requestString += "&";
			}
		}
	}
	
	setInterval(newInterval) {
		this.queryInterval = newInterval;
		this.start();
	}
	
	// Stop making the regular API request
	stop() {
		clearInterval(this.intervalHandle);
	}
	
	// Start running the API request
	start() {
		this.intervalHandle = setInterval(this.sendRequestAndCallBack.bind(this), this.queryInterval);
	}
	
	getInterval() {
		return this.queryInterval;
	}
	
	getRequestString() {
		return this.requestString;
	}
	
	sendRequestAndCallBack() {
		https.get(this.requestString, (response) => {
			let data = [];
		
			response.on('data', (dataFragment) => {
				data += dataFragment;
			});
		
			response.on('end', () => {
				this.callback(data);
			});
		
			response.on('error', (error) => {
				console.log(error);
			});
		});
	}
}

module.exports = HttpsApiIntervalQuery;