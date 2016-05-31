'use strict';
var spawn = require('child_process').spawn;
var optimist = require('optimist');
var path = require('path');
module.exports = function () {
  var loadLib = function (code, Path, isCanary) {
    // Removing trailing newline from stdout.
    Path = Path.trim();
    if (code !== 127 && Path) {
      var argv = optimist
        .usage('Usage: ryan [test files] {OPTIONS}')
        .wrap(80)
        .option('version', {
          alias: 'v',
          desc : 'Shows the version of the ryan & local ryan installation'
        })
        .option('reporter', {
          alias: 'r',
          type : 'string',
          desc : 'Reporter(s) you would like to invoke'
        })
        .option('driver', {
          alias: 'd',
          type : 'string',
          desc : 'Driver(s) you would like to invoke'
        })
        .option('browser', {
          alias: 'b',
          type : 'string',
          desc : 'Browser(s) you would like to invoke'
        })
        .option('viewport', {
          type: 'integer',
          desc: 'Viewport dimensions you would like to invoke'
        })
        .option('baseUrl', {
          alias: 'u',
          type : 'string',
          desc : 'Base URL to append all .open()\'s with if relative path is given'
        })
        .check(function (argv) {
          // output some version info
          if (argv.version) {
            var fs = require('fs');
            var cliVersion = JSON.parse(fs.readFileSync(__dirname + '/package.json')).version;
            console.log('Version:', cliVersion);            
            console.log('');
            throw '';
          }
          // show help
          if (argv.help) {
            throw '';
          }
        })
        .argv;

      // building viewport option
      var viewportDimensions, viewportWidth, viewportHeight, viewportOption;
      if( argv.viewport ) {
        viewportDimensions = argv.viewport.split(',');
        viewportWidth = +viewportDimensions[0];
        viewportHeight = +viewportDimensions[1];
        viewportOption = ( isNaN( viewportWidth ) || isNaN( viewportHeight ) ) ? {} : { width: viewportWidth, height: viewportHeight };
      }
      // run Master
      var MasterLib = require(Path);
      var ryan = new MasterLib({
        tests: argv._,
        driver: argv.driver ? argv.driver.split(',') : [],
        reporter: argv.reporter ? argv.reporter.split(',') : [],
        browser: argv.browser ? argv.browser.split(',') : [],
        viewport: argv.viewport ? viewportOption : {},
        logLevel: argv.logLevel,
        baseUrl: argv.baseUrl,
        noColors: argv.nocolors,
        noSymbols: argv.nosymbols,
        remote: argv.remote
      });

      ryan.run();

    } else {       
      // check if the version flag is given, then spit out additional version info
      if (process.argv[2] && (process.argv[2] === '-v' || process.argv[2] === '--version')) {
        var fs = require('fs');

        var cliVersion = JSON.parse(fs.readFileSync(__dirname + '/package.json')).version;
        console.log('Version:', cliVersion);
      } else {
        console.log('No local installation found');
        process.exit(127);
      }
    }
  }; //end lib
  //first search install path
  // Search for installed using node's built-in require() logic.
  var child = spawn(process.execPath, ['-p', '-e', 'require.resolve("cb-server")']); 
  var path  = '';
  child.stdout.on('data', function (data) {
    path += data;
  });

  child.on('exit', function(code) {
    if(path){
      console.log('0.1 ---------------- found path'); 
      console.log('->',path);
      loadLib(code, path, false);      
    }else{
      console.log('-->',path);
      console.log('0.1 ---------------- not found path'); 
    }  
  });
};
