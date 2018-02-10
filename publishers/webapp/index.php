<?php

	$_CONFIG=Array(
		"wrighthome"=>"http://www.kesiev.com/wright",
		"pathdatabase"=>"../database.json",
		"fontpath"=>"../../fonts/",
		"wrightpath"=>"../../",
		"mirrorpath"=>"wright/",
		"icons"=>["48x48","72x72","96x96","144x144","168x168","192x192"]
	);

	function addDirectory($root, $subdir, $remap, &$results){
		$sub=realpath($root.$subdir);
		$files = scandir($sub);

	    foreach($files as $key => $value){
	        $path = realpath($sub.DIRECTORY_SEPARATOR.$value);
	        if(substr($value,0,1)!=".")
		        if(is_dir($path)) addDirectory($root, $subdir."/".$value, $remap."/".$value, $results);
		        else $results[] = $remap.DIRECTORY_SEPARATOR.$value;
	    }

	    return $results;
	}

	$tapeid=$_GET["issueid"];
	$tapeimage="";
	$tape=0;

	$database=json_decode(file_get_contents($_CONFIG["pathdatabase"]),true);
	for ($i=0;$i<count($database);$i++)
		if ($database[$i]["id"]==$tapeid) {
			$tape=$database[$i];
			$tapeimage=$_CONFIG["mirrorpath"]."tapes/".$tapeid."/screenshots/".$tapeid."-1.png";
			break;
		}

	if (!$tape) die("Tape not found, sorry.");

	switch ($_GET["file"]) {
		case "icon":{

		$width=$_GET["width"]*1;
		$height=$_GET["height"]*1;

		if (array_search($width."x".$height,$_CONFIG["icons"])!==FALSE) {

			/* Create some objects */
			$image = new Imagick();
			$image->readImage('homescreen.png'); 
			
			$draw = new ImagickDraw();
			$draw->setFillColor('black');
			$draw->setTextAlignment(\Imagick::ALIGN_CENTER);
			$draw->setFont($_CONFIG["wrightpath"]."publishers/site/css/permanentmarker/PermanentMarker-webfont.ttf");
			$draw->setFontSize( 16 );
			$image->annotateImage($draw, 96, 63, -3,$tape["label"]);

			$image->scaleImage($width,$height);
			$image->setImageFormat('png');

			header('Content-type: image/png');
			echo $image;
		}
		
		die();
			break;
		}		
		case "worker":{

			// Cache system files
			$cache=[
				$_CONFIG["mirrorpath"].'js/wright.js',
  				$_CONFIG["mirrorpath"].'fonts/stylesheet.css'
			];

			// Cache tape and system data
			$tapesroot=realpath($_CONFIG["wrightpath"]."tapes/");
			$wrightpath=realpath($_CONFIG["wrightpath"])."/";
			addDirectory($wrightpath,"tapes/".$tapeid,$_CONFIG["mirrorpath"]."tapes/".$tapeid,$cache);
			addDirectory($wrightpath,"system/",$_CONFIG["mirrorpath"]."system/",$cache);

			// Cache single shared/default resources
			$tapedata=json_decode(file_get_contents($_CONFIG["wrightpath"]."tapes/".$tapeid."/tape.json"),true);
			if (isset($tapedata["resources"]))
				foreach ($tapedata["resources"] as $i => $file) {
					if (substr($file,0,2)=="..") {
						// Include common resources
						$path=realpath($_CONFIG["wrightpath"]."tapes/".$tapeid."/".$file);
						array_push($cache, $_CONFIG["mirrorpath"]."tapes".substr($path,strlen($tapesroot)));
					} else if (substr($file,-5)==".font") {
						// Include common fonts
						$fontid=substr($file,0,-5);
						$fontpath=realpath($_CONFIG["fontpath"]);
						$fontdata=file_get_contents($fontpath."/stylesheet.css");
						preg_match_all("|font-family[^\n]+'".$fontid."'([^}]*)|i", $fontdata,$founddata);
						if (isset($founddata[0])) {
							preg_match_all("|url\\('?([^'\\)#?]*)|i", $founddata[0][0],$fontfiles);
							if (isset($fontfiles[1])) {
								for ($j=0;$j<count($fontfiles[1]);$j++) {
									$fontfile=realpath($_CONFIG["fontpath"].$fontfiles[1][$j]);
									array_push($cache, $_CONFIG["mirrorpath"].substr($fontfile,strlen($wrightpath)));
								}
							}
						}
					}
				}

			$cache=array_values(array_unique($cache));

			header('Content-Type: application/javascript');
			echo "
var CACHE = '".$tapeid."-wrightcache';
var precacheFiles = ".json_encode($cache).";

self.addEventListener('install', function(evt) {
  evt.waitUntil(precache().then(function() {
      return self.skipWaiting();
  })
  );
});


self.addEventListener('activate', function(event) {
      return self.clients.claim();
});

self.addEventListener('fetch', function(evt) {
  evt.respondWith(fromCache(evt.request).catch(fromServer(evt.request)));
  evt.waitUntil(update(evt.request));
});


function precache() {
  return caches.open(CACHE).then(function (cache) {
    return cache.addAll(precacheFiles);
  });
}

function fromCache(request) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      return matching || Promise.reject('no-match');
    });
  });
}

function update(request) {
  return caches.open(CACHE).then(function (cache) {
    return fetch(request).then(function (response) {
      return cache.put(request, response);
    });
  });
}

function fromServer(request){
	return fetch(request).then(function(response){ return response})
}";
			die();
		}
		case "manifest":{
			$manifest=[
			  "name"=>$tape["label"],
			  "short_name"=>$tape["label"],
			  "lang"=>"en",
			  "start_url"=>"index.html",
			  "display"=>"fullscreen",
			  "theme_color"=> "#000000",
			  "background_color"=> "#000000",
			  "icons"=>[]
			];
			for ($i=0;$i<count($_CONFIG["icons"]);$i++)
				array_push($manifest["icons"], [
			      "src"=>"homescreen-".$_CONFIG["icons"][$i].".png",
			      "sizes"=>$_CONFIG["icons"][$i],
			      "type"=>"image/png"
			    ]);
			echo json_encode($manifest);
			die();
			break;
		}
	}

?><html>
<head>
	<title><?= $tape["label"] ?></title>
	<link rel="manifest" href="manifest.json">

	<meta name="mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="application-name" content="<?= $tape["label"] ?>">
	<meta name="apple-mobile-web-app-title" content="<?= $tape["label"] ?>">
	<meta name="msapplication-starturl" content="index.html">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="icon" type="image/png" sizes="48x48" href="homescreen-48x48.png">
	<link rel="icon" type="image/png" sizes="72x72" href="homescreen-72x72.png">
	<link rel="icon" type="image/png" sizes="96x96" href="homescreen-96x96.png">
	<link rel="icon" type="image/png" sizes="144x144" href="homescreen-144x144.png">
	<link rel="icon" type="image/png" sizes="168x168" href="homescreen-168x168.png">
	<link rel="icon" type="image/png" sizes="192x192" href="homescreen-192x192.png">

	<style>
		BODY { background-color: #000; margin:0; padding:0; }
		#intro {
			height: 100%;
			position: relative;
		}		
		#intro .background {
			z-index: 1;
			position: absolute;
			background-repeat: no-repeat;
			background-position: center;
			background-size: cover;
			top:0;
			left:0;
			bottom:0;
			right:0;
			opacity: 0.2;
		}
		#settings {
			background-color: #fff;
		}
		#settings, #intro {
			color: #000;
			font-family: helvetica, sans-serif;
			font-size: 12px;
		}
		.section {
			background-color: #2a56c6;
			color:#fff;
			padding:10px;
		}
		.sublabel {
			display:block;
			margin:5px;
			color:#c8c8c8;
		}
		.label, .value {
			display:block;
			margin:5px;
		}
		.row {
			padding:5px;
			display:block;
			border-bottom: 1px solid #c8c8c8;
			overflow-x:hidden;
		}
		#playbuttoncontainer {
			z-index: 10;
			display:none;
			position: absolute;
			bottom:50px;
			left:0;
			right:0;
			text-align: center;
		}
		.hintlabel {
			z-index: 10;
			color:#fff;
			position: absolute;
			bottom:5px;
			height:20px;
			left:0;
			right:0;
			line-height: 20px;
			text-align: center;
			background-color: rgba(0,0,0,0.75);
		}
		.banner {
			z-index: 10;
			color:#fff;
			position: absolute;
			top:5px;
			height:20px;
			left:0;
			right:0;
			line-height: 20px;
			text-align: center;
			background-color: rgba(0,0,0,0.75);
		}
		.banner A { color: #7f7fff; }
		.startgamerow { text-align: center; padding:10px 0 50px 0;}
		#settings INPUT[type=text], #settings SELECT { border:3px solid #c8c8c8; padding:0 10px; margin:0; border-radius: 5px; line-height: 30px; height:30px; }
		.startgame {
			border-radius: 5px;
			height:50px;
			text-align: center;
			cursor: pointer;
			font-weight: bold;
			border:3px solid #c8c8c8;
			margin:0;
			font-family: helvetica, sans-serif;
			font-size: 12px;
			width:90%;
			overflow:hidden;
			background-color: #fff;
			color:#000;
		}
		#playbutton {
			color:#fff;
			border:0;
			border-radius: 10px;
			text-align: center;
			cursor: pointer;
			font-size: 50px;
			height:100px;
			line-height:100px;
			width:90%;
			background-color: #E74C3C;
			border-bottom: 5px solid #BD3E31;
			text-shadow: 0px -2px #BD3E31;
		}		
		.title1,.title2 {
			font-weight: bold;
			font-size: 50px;
			text-align: center;
			z-index: 20;
			color:#fff;
			position: absolute;
			left:10px;
			right:10px;
			top:50px;
		}
		.title2 {
			color:#333333;
			z-index: 10;
			top:70px;
			text-shadow: 0 0 10px #333333;
		}
		.title1 {  
			text-shadow: 0 0 10px rgba(255,255,255,0.5);
		    animation-name: floating;
		    animation-duration: 3s;
		    animation-iteration-count: infinite;
		    animation-timing-function: ease-in-out;
		}
		@keyframes floating {
		    from { transform: translate(0,  0px); }
		    50%  { transform: translate(0, 10px); }
		    to   { transform: translate(0, -0px); }    
		}
	</style>
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<link rel="stylesheet" href="<?= $_CONFIG["mirrorpath"] ?>fonts/stylesheet.css" type="text/css" charset="utf-8" />
	<script type="text/javascript" src="<?= $_CONFIG["mirrorpath"] ?>js/wright.js"></script>
	<script>
	if ('serviceWorker' in navigator) {
		if (!navigator.serviceWorker.controller) {
		  navigator.serviceWorker.register('worker.js', { scope: './'}).then(function(reg) {
		    console.log('Service worker has been registered for scope: '+ reg.scope);
		  });
		}
	}
	 </script>
</head>
<body onload="onl()">
	<div id="intro">
		<div id="playbuttoncontainer"><input type="button" id="playbutton" value="Play" onclick="clickRun()"></div>
		<div class="background" style="background-image:url('<?= $tapeimage ?>')"></div>
		<div class="banner">A <a target="_blank" href="<?= $_CONFIG["wrighthome"] ?>">Wright! Magazine</a> game </div>
		<div class="title1"><?= htmlentities($tape["label"]) ?></div>
		<div class="title2"><?= htmlentities($tape["label"]) ?></div>
		<div class="hintlabel">Scroll down for more settings.</div>
	</div>
	<div id="settings"></div>
	<div id="game"></div>
</body>
<script>

function clickRun() {
	document.getElementById('startgame').click();
}

function onl() {
	Supports.nativeFullscreen=0;
	Supports.isOffline=true;
	runSingleWright('<?= $tapeid ?>',{
		tapesRoot:'<?= $_CONFIG["mirrorpath"] ?>tapes/',
		systemRoot:'<?= $_CONFIG["mirrorpath"] ?>system/',
		gameContainer:document.getElementById('game'),
		settingsContainer:document.getElementById('settings'),
		scale:1,	
		onReady:function() {
			window._WRIGHT.getGame().node.gotoFullScreen();
		},
		onRun:function(){
			var intro=document.getElementById('intro');
			var settings=document.getElementById('settings');
			intro.parentNode.removeChild(intro);
			settings.parentNode.removeChild(settings);
			document.body.scrollTop = document.documentElement.scrollTop = 0;
		},
		onLoaded:function() {
			document.getElementById('playbuttoncontainer').style.display="block";
		}
	});
}
</script>
</html>