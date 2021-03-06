//import modules
const request = require('request');
const fs = require('fs');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const sync_request = require('sync-request');
const { write } = require('lighthouse/lighthouse-cli/printer');
var WebPageTest = require('webpagetest'); // import module WebPageTest

//important variables
var wptServer = 'https://www.webpagetest.org/';
let api_key = process.argv[2]
let url = process.argv[3];
var wpt = new WebPageTest(wptServer, api_key);
var cur_dir = process.cwd();

//sleep function
const sleep = (milliseconds) => {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

//function to set order
async function run(username, pass) {
	await web(username, pass);
	await light(username, pass);
}

//function to check website statusCode
function check_code(url) {
  	var response = sync_request(
    'GET',
    url
    );
    return response.statusCode;
}

//function to check if website need authorization
function auth(url) {
	if (check_code(url) === 200) {
		let username = '';
		let pass = '';
		run(username, pass);		
	}
	if (check_code(url) === 401) {
		let username = process.argv[4];
		let pass = process.argv[5];
		if (username === undefined || pass === undefined){
			return console.log(new Error("Empty username or password!"))
		}
		var url_split = url.split('://');
		var url_for_check = url_split[0] + '://' + username + ":" + pass + '@' + url_split[1];
		if (check_code(url_for_check) === 200) {
			run(username, pass);
		}
		if (check_code(url_for_check) === 401) {
			return console.log(new Error("Incorrect username or password!"))
		}
	}
}

//function to get url for downloading video
async function queryWPT(data, statusCode, path) {
    if (statusCode != 200) {
		await sleep(3000).then(() => { 
			console.log("Wait, video expected.")
		})
		request(data, (error, result) => {
			if (error) {
				console.log(error)
			}
			if (result.statusCode == 200) {
				//console.log(JSON.parse(result.body).data)
				return queryWPT(JSON.parse(result.body).data.videoId, result.statusCode, path)
			}
			else {
				console.log('res_code ' + result.statusCode)
				return queryWPT(data, statusCode, path)
			}
		})
    }
    else {
		await sleep(3000).then(() => { 
			console.log("Final wait before the download.")
		})
	 	console.log("Video is ready. Downloading...")
		await downloadVideo(data, path)
    }
 }

//function to download video
async function downloadVideo(url, path) {
	console.log("Video is ready.")
	var url_to_download = `https://www.webpagetest.org/video/download.php?id=${url}`
	const video_file = fs.createWriteStream(path + '/video.mp4');
	await request(url_to_download, (error, result) => {
			if (error) {
				console.log(error)
	}})
	.pipe(video_file)
}

//function to call WebPageTest and lighthouse
function web(username, pass) {
	return new Promise(resolve => {
		console.log('We are in main function.')
		wpt.runTest(url, {
			location: 'Dulles:Chrome',
			firstViewOnly: false,
			runs: 1,
			pollResults: 5,
			video: true,
			timeline: true,
			authtype: 0,
			login: username,
			password: pass
		}, function processTestResult(err, result) {
			var path = cur_dir + '/artifacts';
			if (!fs.existsSync(path)){
				fs.mkdir(path, { recursive: true }, (err) => {
				  if (err) throw err;
				});
			}
			var res = err || result;
			var testId = res.data.id;
			
			//creating waterfall and screenshot
			console.log('Creating waterfall and screenshot.')
			const img = fs.createWriteStream(path + '/screenshot.jpg');
			const wf = fs.createWriteStream(path + '/waterfall.png');

			request(result.data.runs[1].firstView.images.screenShot).pipe(img)

			request(result.data.runs[1].firstView.images.waterfall).pipe(wf)

			wpt.getTimelineData(testId, function (err, data) {
				fs.writeFileSync(path + '/timeline.json', JSON.stringify(data))
			})
			
			//creating video
			wpt.createVideo(testId, {dryRun: true, comparisonEndPoint: 'doc'}, function (error, data) {
				queryWPT(data, 100, path)
			});
		})
		resolve();
	});
}

function light(username, pass) {
	return new Promise(resolve => {
		//function to launch chrom-launcher and lighthouse
		async function launchChromeAndRunLighthouse(url, opts, config = null) {
		  return chromeLauncher.launch({chromeFlags: opts.chromeFlags}).then(chrome => {
			opts.port = chrome.port;
			return lighthouse(url, opts, config).then(results => {
			  return chrome.kill().then(() => results)
			});
		  });
		}

		var opts;
		if (username === '') {
			opts = {
			  	chromeFlags: ['--headless', '--no-sandbox'],
			    output: 'html'
			};
		}
		else {
			var buffer = Buffer.from(username + ":" + pass).toString("base64")
			opts = {
			  	chromeFlags: ['--headless', '--no-sandbox'],
			  	extraHeaders: {Authorization: 'Basic ' + buffer},
			    output: 'html'
			};
		}

		//function to run lighthouse
		launchChromeAndRunLighthouse(url, opts).then(results => {
			console.log('lighthouse ')
			write(JSON.stringify(results.artifacts.traces.defaultPass), 'json', cur_dir + '/artifacts/report-0.trace.json')
			write(JSON.stringify(results.artifacts.devtoolsLogs.defaultPass), 'json', cur_dir + '/artifacts/report-0.devtoolslog.json')
			write(results.report, 'html', cur_dir + '/artifacts/report.html')
		});
	});
}

//call function to check url authorization and call main function
auth(url);
