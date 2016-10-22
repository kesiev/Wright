/*
 * NUMBERS PRECISION
 */

var PREC = 1000000;
var PAD = 10 / PREC;
function FIX(value) { return Math.round(value * PREC) / PREC; }

/*
 * Browser features detector.
 */

var Supports = (function(){
	var vendors=["Khtml","ms","O","Moz","Webkit"],div=document.createElement('div'),csscache={};
	var ret={
		css:function(prop){
			if (csscache[prop]===undefined) {
				var len=vendors.length;
				if (prop in div.style) return prop;
				prop=prop.replace(/^[a-z]/, function(val) {
					csscache[prop]=val.toUpperCase();
					return csscache[prop];
				});
				while (len--) if (vendors[len]+prop in div.style) {
					csscache[prop]=vendors[len]+prop;
					return csscache[prop];
				}
			} else return csscache[prop];
		},
		setCss:function(obj,prop,value) { if (prop=this.css(prop)) obj[prop]=value; },
		browser:function(substr){ return navigator.userAgent.toLowerCase().indexOf(substr) > -1; },		
		pointerMode:function() {
			if (this.isTouch) return "touch";
			else return "mouse";
		},
		addEventListener:function(node,evt,cb,rt) {
			if (node.addEventListener) node.addEventListener(evt,cb,rt);
			else node.attachEvent("on"+evt,cb)
		},
		removeEventListener:function(node,evt,cb,rt) {
			if (node.removeEventListener) node.removeEventListener(evt,cb,rt);
			else node.detachEvent("on"+evt,cb)
		},
		setFullScreen:function(node) {
			if (Supports.nativeFullscreen) node[Supports.nativeFullscreen.request]();
			else if (!this._fullscreen.node) {
				this._fullscreen.node=node;
				this._fullscreen.position=node.style.position;
				this._fullscreen.left=node.style.left;
				this._fullscreen.right=node.style.right;
				this._fullscreen.top=node.style.top;
				this._fullscreen.bottom=node.style.bottom;
				this._fullscreen.zIndex=node.style.zIndex;
				this._fullscreen.overflow=document.body.overflow;
				node.style.position="fixed";
				node.style.left=node.style.right=node.style.top=node.style.bottom="0px";
				node.style.zIndex=100000;
				document.body.overflow="hidden";
				if (this._fullscreen.onchange) this._fullscreen.onchange();
				if (this._fullscreen.onresize) this._fullscreen.onresize();
			}
		},
		exitFullScreen:function() {
			if (Supports.nativeFullscreen)
				document[Supports.nativeFullscreen.exit]();
			else if (this._fullscreen.node) {
				this._fullscreen.node.style.position=this._fullscreen.position;
				this._fullscreen.node.style.left=this._fullscreen.left;
				this._fullscreen.node.style.right=this._fullscreen.right;
				this._fullscreen.node.style.top=this._fullscreen.top;
				this._fullscreen.node.style.bottom=this._fullscreen.bottom;
				this._fullscreen.node.style.zIndex=this._fullscreen.zIndex;
				document.body.overflow=this._fullscreen.overflow;
				this._fullscreen.node=0;				
				if (this._fullscreen.onchange) this._fullscreen.onchange();
				if (this._fullscreen.onresize) this._fullscreen.onresize();
			}
		},
		isFullScreen:function() {
			if (Supports.nativeFullscreen) return !!document[Supports.nativeFullscreen.is];
			else return !!this._fullscreen.node;
		},
		onFullScreenChange:function(fullScreenChange,fullScreenResize) {
			if (Supports.nativeFullscreen) {
				this.addEventListener(window,this.nativeFullscreen.on,fullScreenChange);
			} else {
				this._fullscreen.onchange=fullScreenChange;
				this._fullscreen.onresize=fullScreenResize;
			}
			this.addEventListener(window,"resize",fullScreenResize);
		},
		offFullScreenChange:function(fullScreenChange,fullScreenResize) {
			if (Supports.nativeFullscreen) {
				this.removeEventListener(window,this.nativeFullscreen.on,fullScreenChange);
			} else {
				this._fullscreen.onchange=0;
				this._fullscreen.onresize=0;
			}
			this.removeEventListener(window,"resize",fullScreenResize);
		},
		onFullScreenError:function(fullScreenError) {
			if (Supports.nativeFullscreen) this.addEventListener(window,this.nativeFullscreen.error,fullScreenError);
			else this._fullscreen.onerror=fullScreenError;
		},
		offFullScreenError:function(fullScreenError) {
			if (Supports.nativeFullscreen) this.removeEventListener(window,this.nativeFullscreen.error,fullScreenError);
			else this._fullscreen.onerror=0;
		}
	}
	ret.supportsScaling=ret.css("transform")&&ret.css("transformOrigin");
	ret.isFirefox=ret.browser("firefox");
	ret.isTouch=!!('ontouchstart' in window || navigator.maxTouchPoints);
	window.AudioContext=ret.isAudio=window.AudioContext||window.webkitAudioContext;
	ret.isSafari=navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
	if (div.requestFullscreen) ret.nativeFullscreen={request:"requestFullscreen",exit:"exitFullscreen",is:"fullscreenEnabled",on:"fullscreenchange",error:"fullscreenerror"};
	else if (div.webkitRequestFullscreen) ret.nativeFullscreen={request:"webkitRequestFullScreen",exit:"webkitExitFullscreen",is:"webkitIsFullScreen",on:"webkitfullscreenchange",error:"webkitfullscreenerror"};
	else if (div.mozRequestFullScreen) ret.nativeFullscreen={request:"mozRequestFullScreen",exit:"mozCancelFullScreen",is:"mozFullScreenElement",on:"mozfullscreenchange",error:"mozfullscreenerror"};
	else if (div.msRequestFullscreen) ret.nativeFullscreen={request:"msRequestFullscreen",exit:"msExitFullscreen",is:"msFullscreenElement",on:"MSFullscreenChange",error:"msfullscreenerror"};
	else ret.nativeFullscreen=false;
	if (ret.isSafari) ret.nativeFullscreen=false; // @FIXME: Safari mobile doesn't support fullscreen and desktop one doesn't support keyboard input... :\
	ret._fullscreen={};
	var elem = document.createElement('canvas');
  	ret.isCanvas=!!(elem.getContext && elem.getContext('2d'));

	return ret;
})();
// TIME
Supports.getTimestamp = function() { return (new Date()).getTime(); };
// AUDIO
Supports.applyEffect=function(context,node,effect) {
	var currTime = context.currentTime;
	node.gainNode.gain.cancelScheduledValues(0);
	switch (effect.name) {
		case "fade":{
			node.gainNode.gain.value=effect.fromVolume===undefined?node.gainNode.gain.value:effect.fromVolume;
			node.gainNode.gain.linearRampToValueAtTime(effect.toVolume===undefined?node.volume:effect.toVolume, currTime + (effect.length===undefined?1:effect.length));
			break;
		}
		case "setvolume":{
			node.gainNode.gain.value=effect.volume===undefined?node.volume:effect.volume;
			break;
		}
	}
}
// OBJECTS/VARIABLES
Supports.clone = function(obj) { return typeof obj == "object" ? JSON.parse(JSON.stringify(obj)) : obj; };
Supports.isNaN = function(obj) { return obj !== obj; }
// FILE
Supports.getFile = function(file, cb) {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4)
			if ((xmlhttp.status == 200)||(xmlhttp.status==0)) cb(xmlhttp.responseText);
			else cb();
	};
	xmlhttp.open("GET", file, true);
	xmlhttp.send();
};

/*
 * DOM-Canvas rendering and controls.
 */

var DOMInator=function(useCanvas,aliasmode){
	var useDom=!useCanvas,pixelated=aliasmode=="pixelated",degtorad=3.14/180,octx,canvas,bregexp=/<br>/gi,extracss={},txtarea = document.createElement("textarea");
	var transformProp=Supports.css("transform"),transformOriginProp=Supports.css("transformOrigin");
	var from,to,source,sources={},filters=[],filter,running=1;
	var guide=document.createElement("div");
	guide.style.position="absolute";
	guide.style.left=guide.style.top="0px";
	guide.style.width=guide.style.height="100%";
	guide.style.zIndex=100;
	guide.style.opacity=0.5;

	if (pixelated) pixelateStyle(extracss);

	/* Font rendering hacks */
	function lineHeightFixes(font,size){
		if (font=="spectrum") return size-1;
		return size;
	}
	function topFixes(font,pos){
		if ((font=="spectrum")&&Supports.isFirefox) return pos-1;
		return pos;
	}

	/* Pixelation handler */
	function pixelateStyle(style) {
		style.MozOsxFontSmoothing="grayscale";	
		if (Supports.isFirefox)
			style.imageRendering="-moz-crisp-edges";
		else {
			Supports.setCss(style,"imageRendering","pixelated");
			Supports.setCss(style,"fontSmoothing","none");
		}
	}
	function pixelatedContext(ctx) {
		ctx.webkitImageSmoothingEnabled = ctx.imageSmoothingEnabled = ctx.mozImageSmoothingEnabled = ctx.oImageSmoothingEnabled = ctx.msImageSmoothingEnabled= false;
	}

	/* Nodes and context handling */
	function createNode(type) {
		var node=document.createElement(type);
		for (var a in extracss) node.style[a]=extracss[a];
		return node;
	}
	function resetContext(ctx) { if (pixelated) pixelatedContext(ctx); }

	/* Z-Index handling */
	function __disconnect(obj) {
		if (this.__first===obj) this.__first=obj.__next;
		if (obj.__next) obj.__next.__prev=obj.__prev;
		if (obj.__prev) obj.__prev.__next=obj.__next;
		obj.__next=obj.__prev=0;
	}
	function __add(obj,pri) {
		obj.__pri=pri;
		if (this.__first) {
			var cur=this.__first;
			var pre=cur;
			while (cur&&(cur.__pri<pri)) {
				pre=cur;
				cur=cur.__next;
			}
			if (cur) {
				if (cur===this.__first) this.__first=obj;
				cur.__prev.__next=obj;
				obj.__next=cur;
				obj.__prev=cur.__prev;
				cur.__prev=obj;
			} else {
				pre.__next=obj;
				obj.__next=0;
				obj.__prev=pre;
			}
		} else {
			this.__first=obj;
			obj.__next=obj.__prev=0;
		}
	}
	function __repri(obj,pri) {
		if (obj.__pri!=pri)
			if (pri<obj.__pri) {
				if (obj.__prev) {
					var cur=obj.__prev;
					while (cur&&(cur.__pri>pri)) cur=cur.__prev;
					this.__disconnect(obj);
					obj.__pri=pri;
					if (cur) {
						obj.__next=cur.__next;
						obj.__prev=cur;
						if (cur.__next) cur.__next.__prev=obj;
						cur.__next=obj;
					} else {
						obj.__prev=0;
						obj.__next=this.__first;
						this.__first.__prev=obj;
						this.__first=obj;
					}
				} else obj.__pri=pri;
			} else if (obj.__next) {
				var cur=obj.__next;
				var pre=cur;
				while (cur&&(cur.__pri<pri)) {
					pre=cur;
					cur=cur.__next;
				}
				this.__disconnect(obj);
				obj.__pri=pri;
				if (cur) {
					if (cur===this.__first) this.__first=obj;
					obj.__next=cur;
					obj.__prev=cur.__prev;
					if (cur.__prev) cur.__prev.__next=obj;
					cur.__prev=obj;
				} else {
					obj.__next=0;
					obj.__prev=pre;
					pre.__next=obj;
				}
			} else obj.__pri=pri;
	}

	/* HTML printing */
	function decodeEntities(html) {	    
		txtarea.innerHTML = html;
		return txtarea.value.replace(bregexp,"\n");
	}
	function print(ctx,x,y,prints) {
		/* @TODO: How to disable aliasing when printing scaled text in a simple way? */
		var p;
		for (var i=0;i<prints.length;i++) {
			p=prints[i];
			if (p.s) {
				ctx.fillStyle=p.s;
				ctx.fillText(p.l, x+p.x-1, y+p.y);
				ctx.fillText(p.l, x+p.x+1, y+p.y);
				ctx.fillText(p.l, x+p.x, y+p.y-1);
				ctx.fillText(p.l, x+p.x, y+p.y+1);
			}
			ctx.fillStyle=p.c;
			ctx.fillText(p.l, x+p.x, y+p.y);
		}    	
	}
	function recalculatePrints(node) {
		var prints;
		if (octx) {
			prints={f:node.style.fontSize+"px "+node.style.fontFamily,a:node.style.textAlign,l:[]};
			var lh=lineHeightFixes(node.style.fontFamily,node.style.lineHeight);
			var ow=node.style.padding+(node.style.outline?1:0);
			var px=node.style.padding+ow;
			var y=topFixes(node.style.fontFamily,lh/2);
			var c=node.style.color||"#fff";
			var maxWidth=node.style.width-(ow*2);
			octx.font=prints.f;
			switch (node.style.textAlign) {
				case "center":{ px=node.style.width/2; break; }
				case "right":{ px=node.style.width-ow; break; }
			}
			if (node.attributes.printstext) {
				var lines=node.attributes.printstext.split('\n');
				for (var i=0;i<lines.length;i++) {
					if (node.style.whiteSpace=="nowrap")
						prints.l.push({s:node.style.outline,c:c,l:lines[i],x:px,y:y});
					else {
						var words = lines[i].split(' ');
						var line = '';
						for(var n = 0; n < words.length; n++) {
							var testLine = (line?line+' ':line) +words[n];
							var metrics = octx.measureText(testLine);
							var testWidth = metrics.width;
							if (testWidth > maxWidth && n > 0) {
								prints.l.push({s:node.style.outline,c:c,l:line,x:px,y:y});	          	
								line = words[n];
								y += lh;
							}
							else {
								line = testLine;
							}
						}
						prints.l.push({s:node.style.outline,c:c,l:line,x:px,y:y});
					}
					y += lh;			
				}
				
			}
		}
		return prints;
	}

	/* Audio */
	var audio;
	this.enableAudio=function(volume) {
		if (!audio&&Supports.isAudio) {
			audio={
				context: new AudioContext(),
				channels:{},
				defaults:{}
			};
			audio.gainNode=audio.context.createGain();
			audio.gainNode.connect(audio.context.destination);
			audio.gainNode.gain.value=volume;
		}
	};
	this.addAudioChannel=function(name,data) {
		if (audio) {
			var channel=audio.channels[name]={
				gainNode:audio.context.createGain(),
				looping:data.looping,
				playing:{},
				volume:data.volume===undefined?1:data.volume,
				applyEffect:function(effect) { 
					Supports.applyEffect(audio.context,this,effect);
				},
				stop:function() {
					for (var a in this.playing) if (this.playing[a]) this.playing[a].stop();
				},
				destroy:function() {
					this.stop();
					this.gainNode.disconnect();
				}
			};
			channel.gainNode.connect(audio.gainNode);
			channel.gainNode.gain.value=channel.volume;
			if (data.samples)
				for (var i=0;i<data.samples.length;i++)
					audio.defaults[data.samples[i]]=name;
		}
	}
	this.getAudioChannel=function(channel) {
		if (audio) return audio.channels[channel];
		else return 0;
	};
	this.getAudio=function(name,channel) {
		if (audio&&resources.items[name]) {
			if (channel===undefined) channel=audio.defaults[name];
			var ch=audio.channels[channel];
			if (ch) return ch.playing[name];
		} else return 0;
	};
	this.playAudio=function(name,channel,looping,effect) {
		if (audio&&resources.items[name]) {
			if (channel===undefined) channel=audio.defaults[name];
			var ch=audio.channels[channel];
			if (ch) {
				var sample=this.getAudio(name,channel);
				if (sample) sample.stop();
				sample=ch.playing[name]={
					source:audio.context.createBufferSource(),
					gainNode:audio.context.createGain(),
					initTime:audio.context.currentTime,
					channel:ch,
					volume:1,
					looping:looping||((looping===undefined)&&ch.looping),
					stop:function() {
						sample.source.stop(0);
						sample.gainNode.disconnect();
						sample.source.disconnect();
						sample.channel.playing[name]=0;
					},
					applyEffect:function(effect) { Supports.applyEffect(box,this,effect); },
					getter:function(attr){
						switch (attr) {
							case "position":{
								var pos=(audio.context.currentTime-this.initTime)*this.source.playbackRate.value;
								return !this.looping&&(pos>this.source.buffer.duration)?this.source.buffer.duration:pos;
							}
							case "length":{
								return this.source.buffer.duration;
							}
							case "times":{
								var times=((audio.context.currentTime-this.initTime)*this.source.playbackRate.value)/this.source.buffer.duration;
								return !this.looping&&(times>1)?1:times;
							}
						}
					}
				}
				sample.source.buffer=resources.items[name];
				if (sample.looping) sample.source.loop=true;
				sample.source.connect(sample.gainNode);
				sample.gainNode.connect(ch.gainNode);
				sample.gainNode.gain.value=sample.volume;
				if (effect) sample.applyEffect(effect);
				sample.source.start(0);
			}
		}
	};

	/* Game cycle */
	var skipFrames=0,timeout=0,fps=0,mspf=0,frameTimestamp=0,framedone=1,gamecycle=0,renderer=0,self=this;	
	function doRenderer() {
		if (!skipFrames) {
			renderer();
			self.frame();
		}
		framedone=1;
	}
	function scheduleFrame() {
		clearTimeout(timeout);
		var wait = mspf - Supports.getTimestamp() + frameTimestamp;
		if (wait<=0) wait=1;
		if (wait) timeout = setTimeout(runGameCycle, wait);
		else runGameCycle();
	};
	function runGameCycle() {
		if (running) {
			if (loading) {
				renderer();
				self.rawFrame();
				if (timeout != -1) scheduleFrame();
			} else {
				frameTimestamp = Supports.getTimestamp();
				gamecycle();
				updateControls();
				if (framedone) {
					if (skipFrames) skipFrames--;
					else if (timeout != -1) {
						framedone=0;
						if (window.requestAnimationFrame) window.requestAnimationFrame(doRenderer);
						else setTimeout(doRenderer,mspf/2);
					}
				}
				scheduleFrame();
			}
		}
	}
	this.addSkipFrames=function(frames){ skipFrames+=frames; }
	this.setGameCycle=function(cb) { gamecycle=cb; }
	this.setRenderer=function(cb) { renderer=cb;}
	this.setFps = function(cfps) {
		fps=cfps;
		mspf = 1000 / fps;
	};
	this.getFps = function() { return fps }
	this.getMspf = function() { return mspf }
	this.abort=function() {
		running=0;
		if (timeout) {
			clearTimeout(timeout);
			timeout=-1;
		}
	}
	this.setFps(25);

	/* Resources management */
	var loading=1,resources = {
		loadingNode:0,
		callback: 0,
		current: 0,
		loader: [],
		root: "",
		systemroot: "",
		items: {}
	};
	function loadNextResource() {
		if (resources&&resources.loader.length) {
			var file;
			resources.current = resources.loader.splice(0, 1)[0];
			if (resources.current[1].substr(0,1)=="~") file = resources.systemroot+resources.current[1].substr(1);
			else file = resources.root + resources.current[1];
			var ext = file.substr(file.lastIndexOf(".") + 1).toLowerCase();
			switch (ext) {
				case "font":{
					var fontFamily=resources.current[1];
					var detector = document.createElement("div");
					var span = document.createElement("span");
					detector.style.position="absolute";
					detector.style.overflow="hidden";
					detector.style.left="-200px";
					detector.style.top="-99999px";
					detector.style.width = "99999px";
					detector.style.height = "200px";
					detector.style.fontSize = "100px";
					detector.appendChild(span);
					span.innerHTML="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
					span.style.fontFamily= "arial";
					document.body.appendChild(detector);
					var oh=span.offsetWidth;
					span.style.fontFamily= "\""+fontFamily.substr(0,fontFamily.lastIndexOf("."))+"\", arial";
					var int=setInterval(function() {
						if (oh!=span.offsetWidth) {
							document.body.removeChild(detector);
							clearTimeout(int);
							loadNextResource();
						}
					},100);
					break;
				}
				case "png":{
					var cache = document.createElement("img");
					cache.style.visibility = "hidden";
					cache.style.position = "absolute";
					cache.src = file;
					cache.onload = function() {
						document.body.removeChild(cache);
						resources.items[resources.current[0]] = {url:file,img:cache};
						if (resources) setTimeout(loadNextResource, 100);
					};
					document.body.appendChild(cache);
					break;
				}
				case "json":{
					Supports.getFile(file,function(text){
						resources.items[resources.current[0]] = JSON.parse(text);
						loadNextResource();
					});
					break;
				}
				case "ogg":
				case "mp3":{
					if (audio&&Supports.isAudio) {
					  var request = new XMLHttpRequest();
					  request.open('GET', file, true);
					  request.responseType = 'arraybuffer';
					  request.onload = function() {
						audio.context.decodeAudioData(request.response, function(buffer) {
						  resources.items[resources.current[0]] = buffer;
						  loadNextResource();
						}, function(e){
							console.warn("Audio error with "+file,e);
						});
					  }
					  request.send();
					} else loadNextResource();
				  break;
				}
			}
		} else {
			finalizeFilters();
			loading=0;
			resources.loadingNode.parentNode.removeChild(resources.loadingNode);
			delete resources.loadingNode;
			resources.callback();
			resources.callback = 0;
		}
	}
	this.setResourcesRoot = function(path) { resources.root = path; };
	this.setSystemRoot = function(path) { resources.systemroot = path; };
	this.getResourcesRoot = function(path) { return resources.root };
	this.addResource = function(name, data) {
		for (var i=0;i<resources.loader.length;i++)
			if (resources.loader[i][0]==name) return;
		resources.loader.push([name, data]);
	};
	this.getResource=function(name) { return resources.items[name];}
	this.loadResources=function(cb) {
		resources.callback = cb;
		resources.loadingNode=this.createElement("div");
		resources.loadingNode.setAttribute("innerHTML","Loading...");
		resources.loadingNode.setStyle("fontFamily","sans-serif");
		resources.loadingNode.setStyle("fontSize",12);
		resources.loadingNode.setStyle("color","#ccc");
		resources.loadingNode.setStyle("width",100);
		resources.loadingNode.setStyle("height",20);
		resources.loadingNode.setStyle("lineheight",20);		
		resources.loadingNode.setStyle("left",5);
		resources.loadingNode.setStyle("top",5);
		this.appendChild(resources.loadingNode);
		loadNextResource();
	}

	/* Fullscreen handler */
	var gameScreen=0,orgScalex=0,orgScaley=0,guidetimeout;

	function removeGuide() {
		if (guidetimeout) {
			root.removeChild(guide);
			clearTimeout(guidetimeout);
			guidetimeout=0;
		}
	}

	function showGuide() {
		if (guide) {
			if (guidetimeout) clearTimeout(guidetimeout);
			else root.appendChild(guide);
			guidetimeout=setTimeout(removeGuide,3000);
		}
	}

	function fullScreenResizer() {	
		showGuide();	
		var width=document.body.clientWidth;
		var height=document.body.clientHeight;
		var scalex=width/gameScreen.style.width,scaley=height/gameScreen.style.height;
		if (scaley<scalex) scalex=scaley;
		if (useDom) scalex=Math.floor(scalex)||1;
		gameScreen.setStyle("scalex",scalex);
		gameScreen.setStyle("scaley",scalex);
		screenContainer.style.left=Math.floor((width-(gameScreen.style.width*scalex))/2)+"px";
		screenContainer.style.top=Math.floor((height-(gameScreen.style.height*scalex))/2)+"px";
	}
	function exitFullScreen(noexit) {
		removeGuide();	
		if (!noexit) Supports.exitFullScreen();
		root.style.display="inline";
		root.style.position="";
		root.style.left=root.style.right=root.style.top=root.style.bottom="";
		screenContainer.style.position="";
		gameScreen.setStyle("scalex",orgScalex);
		gameScreen.setStyle("scaley",orgScaley);
		Supports.offFullScreenChange(fullScreenChange,fullScreenResizer);
		Supports.offFullScreenError(fullScreenChange);
		if (keys.keyFullScreen) gameScreen.addEventListener("touchstart",fullscreenTouchToggle);
		if (touchlayout) disableTouchcontroller();
	}
	function fullScreenChange() { if (!Supports.isFullScreen()) exitFullScreen(true); }
	function gotoFullScreen() {
		if (!Supports.isFullScreen()) {
			orgScalex=gameScreen.style.scalex;
			orgScaley=gameScreen.style.scaley;
			root.style.display="block";
			root.style.position="absolute";
			screenContainer.style.position="absolute";
			root.style.left=root.style.right=root.style.top=root.style.bottom="0px";
			Supports.onFullScreenChange(fullScreenChange,fullScreenResizer);
			Supports.onFullScreenError(fullScreenChange);
			if (keys.keyFullScreen) gameScreen.removeEventListener("touchstart",fullscreenTouchToggle);
			if (touchlayout) enableTouchcontroller();
			Supports.setFullScreen(root);
		}
	}
	function toggleFullScreen() {
		if (Supports.isFullScreen()) exitFullScreen(); else gotoFullScreen();
	}
	function fullscreenTouchToggle(e) {
		if (e.touches.length > 1) {
			gotoFullScreen();
			e.preventDefault();
		}
	}
	var root=document.createElement("div");
	root.style.display="inline";
	root.style.backgroundColor="#000";
	var screenContainer=document.createElement("div");
	root.appendChild(screenContainer);
	
	/* Destruction */
	function destroy() {
		running=resources=0;
		if (audio) for (var a in audio.channels) audio.channels[a].destroy();
	}
		
	/* Fake node */
	this.createElement=function(nodeName,model,domnode) {
		if (!model) model={};
		model.style={};
		model.attributes={};
		model.__draw=1;
		if (domnode)
			model._node=domnode;
		else if (useDom) {
			model._node=document.createElement(nodeName);
			for (var a in extracss) model._node.style[a]=extracss[a];
		}
		if (useCanvas) {
			model.__first=0;
			model.__disconnect=__disconnect;
			model.__add=__add;
			model.__repri=__repri;    		
		}
		if (model._node) {

			// DOM Mode (or root canvas)
			model.setStyle=function(k,v) {
				var resize=0;
				this.style[k]=v;
				switch (k) {
					case "backgroundImage":{
						this._node.style.backgroundImage=v?"url('"+v.url+"')":"";
						break;
					}
					case "backgroundPositionY":
					case "backgroundPositionX":{
						this._node.style.backgroundPosition=this.style.backgroundPositionX+"px "+this.style.backgroundPositionY+"px";
						break;
					}
					case "borderWidth":
					case "borderStyle":
					case "borderColor": {
						this._node.style.border=this.style.borderWidth+"px "+this.style.borderStyle+" "+this.style.borderColor;
						break;
					}
					case "scalex":
					case "scaley":
					case "angle":
					case "left":
					case "top":{
						if (useDom) this._node.style[transformProp]="translate("+this.style.left + "px," + this.style.top + "px) scale(" + this.style.scalex + "," + this.style.scaley + ") rotate(" + this.style.rotate + "deg)";
						else resize=1;
						break;
					}
					case "originX":
					case "originY":{
						this._node.style[transformOriginProp]=this.style.originX+" "+this.style.originY;
						break;
					}
					case "outline":{
						this._node.style.textShadow=v?"0px 1px 0 " + v + ", 1px 0px 0 " + v + ", -1px 0px 0 " + v + ", 0px -1px 0 " + v:"";
						break;
					}
					case "width":
					case "height":{
						if (useDom) this._node.style[k]=v+"px";
						else resize=1;
						break;
					}
					case "fontFamily":
					case "lineHeight":{
						this._node.style.lineHeight=lineHeightFixes(this.style.fontFamily,this.style.lineHeight)+"px";
						this._node.style.fontFamily=this.style.fontFamily;
						break;						
					}
					case "width":
					case "height":{
						this._node.style[k]=v+"px";
						break;
					}
					default:{
						this._node.style[k]=v;
					}
				}

				/* Canvas scaling */
				if (resize&&useCanvas) {
					this._node.width=this.style.width;
					this._node.height=this.style.height;
					this._node.style.width=(this.style.width*this.style.scalex)+"px";
					this._node.style.height=(this.style.height*this.style.scaley)+"px";
				}
			}
			model.setAttribute=function(k,v) { this.attributes[k]=this._node[k]=v; }
			model.addEventListener=function(evt,cb,rt) { Supports.addEventListener(this._node,evt,cb,rt); }
			model.removeEventListener=function(evt,cb,rt) { Supports.removeEventListener(this._node,evt,cb,rt); }
			model.focus=function() { this._node.focus(); }

		} else {

			// Canvas Mode
			model.setStyle=function(k,v) {		
				switch (k) {
					case "originY":
					case "originX":{
						this.style[k]=parseInt(v);
						v=v+"";
						this.style[k+"unit"]=v[v.length-1]=="%";
						break;
					}
					case "zIndex":{
						if (this.parentNode&&this.parentNode.__repri) this.parentNode.__repri(this,v);
						this.style[k]=v;
						break;
					}
					case "color":
					case "outline":
					case "textAlign":
					case "width":
					case "height":
					case "fontSize":
					case "fontFamily":
					case "padding":
					case "lineHeight":{
						this.attributes.prints=0;
						this.style[k]=v;
						if ((k=="width")||(k=="height")) this.attributes.blit=0;
						break;
					}
					case "backgroundImage":
					case "backgroundPositionY":
					case "backgroundPositionX":{
						this.style[k]=v;
						this.attributes.blit=0;
						break;
					}
					case "opacity":{
						this.__isComposite=v!=1;
						this.style[k]=v;
						break;
					}
					default:{
						this.style[k]=v;
					}
				}
				this.__draw=(this.style.display!="none")&&(this.style.opacity>0);
			}
			model.setAttribute=function(k,v) {
				switch (k) {
					case "innerHTML":{
						this.attributes.printstext=decodeEntities(v+"");
						this.attributes.prints=0;
						break;
					}
				}
				this.attributes[k]=v;
			}
			model.addEventListener= model.removeEventListener = model.focus = function() { }
		}

		if (useDom) {
			model.redraw=function(){}
		} else {
			model.redraw=function(ctx,alpha) {			
				ctx.save();
				resetContext(ctx);

				var tx,ty,ang=this.style.rotate*degtorad,sx=this._node?1:this.style.scalex,sy=this._node?1:this.style.scaley;
				var border=this.style.borderWidth>0?this.style.borderWidth:0;
				var border2=border*2,hborder=border/2;
				var w=this.style.width+border2,h=this.style.height+border2;	     
				if (this.style.originXunit==1) tx=w/100*this.style.originX; else tx=this.style.originX;
				if (this.style.originYunit==1) ty=h/100*this.style.originY; else ty=this.style.originY;

				if (this.style.backgroundImage&&!this.attributes.blit) {
					this.attributes.blit={
						dx:0,
						dy:0,
						x:-this.style.backgroundPositionX,
						y:-this.style.backgroundPositionY,
						w:this.style.width,
						h:this.style.height
					};
					if (this.attributes.blit.x<0) {
						this.attributes.blit.dx=-this.attributes.blit.x;
						this.attributes.blit.w+=this.attributes.blit.x;
						this.attributes.blit.x=0;
					}
					if ((this.attributes.blit.x+this.attributes.blit.w)>this.style.backgroundImage.img.width)
						this.attributes.blit.w=this.style.backgroundImage.img.width-this.attributes.blit.x;
					if (this.attributes.blit.y<0) {
						this.attributes.blit.dy=-this.attributes.blit.y;
						this.attributes.blit.h+=this.attributes.blit.y;
						this.attributes.blit.y=0;
					}
					if ((this.attributes.blit.y+this.attributes.blit.h)>this.style.backgroundImage.img.height)
						this.attributes.blit.h=this.style.backgroundImage.img.height-this.attributes.blit.y;
					if ((this.attributes.blit.w>0)&&(this.attributes.blit.h>0)) this.attributes.blit.valid=1;
				}

				/* Composite mode (for correct group filters) */
				if (this.__first&&this.__isComposite) {
					var cctx;

					if (!this.__canvas) {
						this.__canvas=createNode("canvas");
						cctx=this.__ctx=model.__canvas.getContext("2d");
					} else cctx=this.__ctx;
					resetContext(cctx);

					this.__canvas.width=this.style.width;
					this.__canvas.height=this.style.height;

					if (this.style.backgroundColor) {
						cctx.fillStyle=this.style.backgroundColor;
						cctx.fillRect(0,0,this.style.width,this.style.height);
					}

					if (this.style.backgroundImage&&this.attributes.blit.valid)
						cctx.drawImage(this.style.backgroundImage.img,this.attributes.blit.x,this.attributes.blit.y,this.attributes.blit.w,this.attributes.blit.h,this.attributes.blit.dx,this.attributes.blit.dy,this.attributes.blit.w,this.attributes.blit.h);

					if (this.attributes.printstext) {
						if (!this.attributes.prints) this.attributes.prints=recalculatePrints(this);
						cctx.font=this.attributes.prints.f;
						cctx.textAlign=this.attributes.prints.a;
						cctx.textBaseline = 'middle';
						print(cctx,0,0,this.attributes.prints.l);
					}

					var cur=this.__first;
					while(cur) {
						if (cur.__draw) cur.redraw(cctx,1);
						cur=cur.__next;
					}

					ctx.transform(sx,0,0,sy,this.style.left+tx, this.style.top+ty);
					ctx.rotate(ang);
					ctx.translate(-tx, -ty);

					ctx.globalAlpha=this.style.opacity;

					if (border) {
						ctx.beginPath();
						ctx.strokeStyle=this.style.borderColor;
						ctx.lineWidth=border;
						ctx.rect(hborder,hborder,w-border,h-border);
						ctx.stroke();
					}

					if (this.style.width&&this.style.height) ctx.drawImage(this.__canvas,border,border);

					  /*
					  ctx.translate(tx, ty);
					  ctx.rotate(-ang);
					  ctx.transform(1/sx,0,0,1/sy,-this.style.left-tx,-this.style.top-ty);
					  */
				} else {
					/* Blitted elements without childs - no compositing */

					ctx.transform(sx,0,0,sy,this.style.left+tx, this.style.top+ty);
					ctx.rotate(ang);
					ctx.translate(-tx, -ty);

					alpha*=this.style.opacity;
					ctx.globalAlpha=alpha;

					if (this.style.backgroundColor) {
						ctx.fillStyle=this.style.backgroundColor;
						ctx.fillRect(border,border,this.style.width,this.style.height);
					}

					if (this.style.backgroundImage&&this.attributes.blit.valid)
						ctx.drawImage(this.style.backgroundImage.img,this.attributes.blit.x,this.attributes.blit.y,this.attributes.blit.w,this.attributes.blit.h,border+this.attributes.blit.dx,border+this.attributes.blit.dy,this.attributes.blit.w,this.attributes.blit.h);

					if (border) {
						ctx.beginPath();
						ctx.strokeStyle=this.style.borderColor;
						ctx.lineWidth=border;
						ctx.rect(hborder,hborder,w-border,h-border);
						ctx.stroke();
					}

					ctx.translate(border,border);
					ctx.beginPath();
					ctx.rect(0,0,this.style.width,this.style.height);
					ctx.clip();

					if (this.attributes.printstext) {
						if (!this.attributes.prints) this.attributes.prints=recalculatePrints(this);
						ctx.font=this.attributes.prints.f;
						ctx.textAlign=this.attributes.prints.a;
						ctx.textBaseline = 'middle';
						print(ctx,0,0,this.attributes.prints.l);
					}

					var cur=this.__first;
					while(cur) {
						if (cur.__draw) cur.redraw(ctx,alpha);
						cur=cur.__next;
					}

				}
				ctx.restore();
			}
		}

		model.appendChild=function(node) {
			if (node.parentNode) node.parentNode.removeChild(node);
			if (useDom) this._node.appendChild(node._node||node);
			else this.__add(node,node.style.zIndex||0);
			node.parentNode=this;
		}

		model.removeChild=function(node) {
			if (useDom) this._node.removeChild(node._node||node);
			else if (node.parentNode==this) this.__disconnect(node);
			node.parentNode=0;
		}
	
		model.setAttribute=function(k,v) {
			if (useCanvas) {
				switch (k) {
					case "innerHTML":{
						this.attributes.printstext=decodeEntities(v+"");
						this.attributes.prints=0;
						break;
					}
				}
			}
			this.attributes[k]=v;
			if (this._node) this._node[k]=v;
		}

		model.setStyle("position","absolute");
		model.setStyle("left",0);
		model.setStyle("top",0);
		model.setStyle("borderStyle","solid");
		model.setStyle("borderWidth",0);
		model.setStyle("borderColor","#000");
		model.setStyle("overflow","hidden");
		model.setStyle("opacity",1);
		model.setStyle("scalex",1);
		model.setStyle("scaley",1);
		model.setStyle("rotate",0);
		model.setStyle("color","#000");
		model.setStyle("lineHeight",10);
		model.setStyle("padding",0);
		model.setStyle("originX","50%");
		model.setStyle("originY","50%");
		model.setAttribute("innerHTML","");

		return model;
  	}

  	gameScreen=this.createElement("div",this,createNode(useDom?"div":"canvas"));
	screenContainer.appendChild(gameScreen._node);
	this.setStyle("position","relative");

	this.initialize=function(node) {
		if (!root.parentNode) node.appendChild(root);
		scheduleFrame();
	}

	/* Controls: keyboard/touch controller */
	var key=this.key={};
	var keys=this.keys={};
	var hwkeys=[],touchlayout=0,analogTouch=0,keyAtouch=0,keyBtouch=0;
	var analogMap=[
		{keyLeft:1,keyRight:0,keyUp:1,keyDown:0},
		{keyLeft:1,keyRight:0,keyUp:0,keyDown:0},
		{keyLeft:1,keyRight:0,keyUp:0,keyDown:1},
		{keyLeft:0,keyRight:0,keyUp:0,keyDown:1},
		{keyLeft:0,keyRight:1,keyUp:0,keyDown:1},
		{keyLeft:0,keyRight:1,keyUp:0,keyDown:0},
		{keyLeft:0,keyRight:1,keyUp:1,keyDown:0},
		{keyLeft:0,keyRight:0,keyUp:1,keyDown:0}
	],analogIdle={keyLeft:0,keyRight:0,keyUp:0,keyDown:0},analogCurrent={keyLeft:0,keyRight:0,keyUp:0,keyDown:0};
	function setAnalog(state) {
		for (var a in analogCurrent)
			if (analogCurrent[a]!=state[a]) {
				if (state[a]) keyDown(keys[a]); else keyUp(keys[a]);
				analogCurrent[a]=state[a];
			}
	}
	function touchcontrollerTouchStart(e) {
		var touch,button;
		for (var a=0;a<e.changedTouches.length;a++) {
			touch=e.changedTouches[a];
			for (var b=0;b<touchlayout.length;b++) {
				button=touchlayout[b];
				if (
					(touch.clientX>=button.x1*document.body.clientWidth)&&
					(touch.clientX<=button.x2*document.body.clientWidth)&&
					(touch.clientY>=button.y1*document.body.clientHeight)&&
					(touch.clientY<=button.y2*document.body.clientHeight)
				) {
					button.pressed=1;
					button.id=touch.identifier;
					switch (button.type) {
						case 1:{
							button.center={x:touch.clientX,y:touch.clientY};
							setAnalog(analogIdle);
							break;
						}
						default:{ keyDown(keys[button.button]); }
					}
				}
			}
		}
		e.preventDefault(); 
	}
	function touchcontrollerTouchEnd(e) {
		var touch,button;
		for (var a=0;a<e.changedTouches.length;a++) {
			touch=e.changedTouches[a];
			for (var b=0;b<touchlayout.length;b++) {
				button=touchlayout[b];
				if (button.pressed&&(button.id==touch.identifier)) {
					button.id=button.pressed=0;
					switch (button.type) {
						case 1:{
							setAnalog(analogIdle);
							button.status=0;
							break;
						}
						default:{ keyUp(keys[button.button]); }
					}
				}
			}
		}
		e.preventDefault(); 
	}
	function touchcontrollerTouchMove(e) {
		var touch,button,pos,ang,dx,dy,dist;
		for (var a=0;a<e.changedTouches.length;a++) {
			touch=e.changedTouches[a];
			for (var b=0;b<touchlayout.length;b++) {
				button=touchlayout[b];
				if (button.pressed&&(button.id==touch.identifier)) {
					switch (button.type) {
						case 1:{
							pos=analogIdle;
							dx=button.center.x-touch.clientX;
							dy=button.center.y-touch.clientY;
							dist=Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
							if (dist>button.deadzone) {
								ang=(Math.atan2(dx,dy)  * 180 / Math.PI)-22;
								if (ang < 0) ang = 360 + ang;
								pos=analogMap[Math.floor(ang/45)];
							}
							setAnalog(pos);
							break;
						}
					}
				}
			}
		}
		e.preventDefault(); 
	}
	function enableTouchcontroller() {
		Supports.addEventListener(root,"touchstart",touchcontrollerTouchStart);
		Supports.addEventListener(root,"touchend",touchcontrollerTouchEnd);
		Supports.addEventListener(root,"touchmove",touchcontrollerTouchMove);
	}
	function disableTouchcontroller() {
		Supports.removeEventListener(root,"touchstart",touchcontrollerTouchStart);
		Supports.removeEventListener(root,"touchend",touchcontrollerTouchEnd);
		Supports.removeEventListener(root,"touchmove",touchcontrollerTouchMove);
	}
	function keyDown(key) {
		hwkeys[key]=1;
		if (key==keys.keyFullScreen) toggleFullScreen();
	};
	function keyUp(key) { if (hwkeys[key]==1) hwkeys[key]=2; else hwkeys[key]=0; };
	function onkeydown(e) { keyDown(e.keyCode); e.preventDefault(); };
	function onkeyup(e) { keyUp(e.keyCode); };

	// CONTROLS: POINTER
	var pointer=this.pointer={x:0,y:0,width:1,height:1};
	var detectPositionInPage=0,positionInPage=0;
	function getPositionInPage(obj) {
		var x = y = 0;
		if (obj.offsetParent) {
			do {
				x += obj.offsetLeft;
				y += obj.offsetTop;
			} while (obj = obj.offsetParent);
		}
		return {x:x,y:y};
	}
	function touchHandler(e) {
		if (!positionInPage) positionInPage=getPositionInPage(gameScreen._node);
		if (e.changedTouches.length==1) {
			var touch=e.changedTouches[0];
			posx = touch.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = touch.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			keyDown(-1);
			pointer.x=Math.floor((posx-positionInPage.x)/gameScreen.style.scalex);
			pointer.y=Math.floor((posy-positionInPage.y)/gameScreen.style.scaley);
			e.preventDefault();
		}
	}		

	/* Controls: mouse/touch pointer */
	var controls;
	this.setControls=function(cont) {
		controls=cont;
		if (controls.keyboard) {
			for (var a in controls.keyboard) keys[a]=controls.keyboard[a];
			gameScreen.addEventListener("keydown",onkeydown);
			gameScreen.addEventListener("keyup",onkeyup);
			if (keys.keyFullScreen) gameScreen.addEventListener("touchstart",fullscreenTouchToggle);
		}
		// POINTER CONTROLS
		if (controls.pointer) {
			keys.keyPointer=-1;
			detectPositionInPage=1;
			gameScreen.setStyle("cursor","none");
			switch (controls.pointer.id) {
				case "mouse":{
					gameScreen.addEventListener("mousemove",function(e){
						if (!positionInPage) positionInPage=getPositionInPage(gameScreen._node);
						var posx = 0;
						var posy = 0;
						if (!e) { var e = window.event; }
						if (e.pageX || e.pageY) {
							posx = e.pageX;
							posy = e.pageY;
						}
						else if (e.clientX || e.clientY) {
							posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
							posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
						}
						pointer.x=Math.floor((posx-positionInPage.x)/gameScreen.style.scalex);
						pointer.y=Math.floor((posy-positionInPage.y)/gameScreen.style.scaley);
					});
					gameScreen.addEventListener("mousedown",function(e){
						keyDown(-1);
						e.preventDefault();
					});
					gameScreen.addEventListener("mouseup",function(e){
						keyUp(-1);
						e.preventDefault();
					});
					break;
				}
				case "touch":{
					gameScreen.addEventListener("touchstart",touchHandler);
					gameScreen.addEventListener("touchmove",touchHandler);
					gameScreen.addEventListener("touchend",function(e){ keyUp(-1); });
					break;
				}
			}
		}
		// TOUCH CONTROLLER
		if (controls.touchcontroller&&DOMInator.TOUCHLAYOUTS[controls.touchcontroller.layout]) {
			touchlayout=Supports.clone(DOMInator.TOUCHLAYOUTS[controls.touchcontroller.layout].buttons);
			for (var i=0;i<touchlayout.length;i++) {
				var area=document.createElement("div");
				area.style.textAlign="center";
				area.style.position="absolute";
				area.style.left=(touchlayout[i].x1*100)+"%";
				area.style.top=(touchlayout[i].y1*100)+"%";
				area.style.width=((touchlayout[i].x2-touchlayout[i].x1)*100)+"%";
				area.style.height=((touchlayout[i].y2-touchlayout[i].y1)*100)+"%";
				area.style.backgroundColor=touchlayout[i].bgcolor;
				area.style.overflow="hidden";
				area.style.fontSize="8vw";
				area.style.fontFamily="sans-serif";
				area.style.color=touchlayout[i].color;
				area.style.borderRadius="10px";
				area.innerHTML=touchlayout[i].label;
				guide.appendChild(area);
			}
		}
	}
	function updateControls() {
		if (keys) {
			var ckey;
			for (var a in keys) {
				ckey=hwkeys[keys[a]];
				if (ckey>0) {
					if (key[a]) key[a] ++;
					else key[a] = 1;
					hwkeys[keys[a]]=(ckey==2?0:3);
				}
				else if (key[a] > 0) key[a] = -1;
				else if (key[a]) key[a] ++;
				else key[a] = 0;
			}			
		}
		if (detectPositionInPage) {
			detectPositionInPage++;
			if (detectPositionInPage>25) {
				positionInPage=0;
				detectPositionInPage=1;
			}
		}
	}

	/* Game page element focus */
	this.setAttribute("tabIndex", 1);
	(function(obj){setTimeout(function() { obj._node.focus(); }, 1000);})(this);

	/* Filters */
	this.addFilter=function(filter) {
		if (filter.image) this.addResource(filter.image,filter.image);
		filters.push(filter);
	}

	// RENDERER SPECIFIC METHODS
	if (useDom) {

		var filterzindex=100;
		sources.out=this;
		
		function addDivSource(name,style) {
			if (!sources[name]) {
				var node=createNode("div");
				node.style.width=style.width+"px";
				node.style.height=style.height+"px";
				node.style.position="absolute";
				node.style.left=node.style.top="0px";
				sources[name]=node;
			}
			return sources[name];
		}

		function finalizeFilters() {
			for (var i=0;i<filters.length;i++) {
				var filter=filters[i];
				var image=filter.image?resources.items[filter.image]:0;		
				if (!filter.of||(filter.every==0))
				if (filter.generate) {
					switch (filter.generate) {
						case "texture":{
							var source=addDivSource(filter.to,sources.out.style);
							source.style.opacity=filter.alpha||1;
							source.style.backgroundImage="url('"+image.url+"')";
							break;
						}
					}
				} else {
					if (!filter.to) source=sources.out; else
					source=sources[filter.to];
					if (filter.blit&&sources[filter.blit]) {
						sources[filter.blit].style.opacity*=filter.alpha||1;
						sources[filter.blit].style.zIndex=filterzindex;
						source.appendChild(sources[filter.blit]);
					}
				}	
			}
		}

		this.destroy=function(){
			destroy();
			if (root.parentNode) root.parentNode.removeChild(root);
		};
		
		this.frame=function(){};
		this.rawFrame=function(){};

	} else {

		var run;
		octx=this._node.getContext("2d", {alpha: false});
		sources.out={node:this._node,ctx:octx};

		function addCanvasSource(name,style) {
			if (!sources[name]) {
				sources[name]={};
				sources[name].node=createNode("canvas");
				sources[name].node.style.display="none";
				document.body.appendChild(sources[name].node)
				sources[name].ctx=sources[name].node.getContext("2d");
			}
			sources[name].node.width=style.width;
			sources[name].node.height=style.height;			
			return sources[name];
		}

		function finalizeFilters() {
			for (var i=0;i<filters.length;i++) {
				var filter=filters[i];
				if (filter.image) filter._image=resources.items[filter.image];
			}
		}

		function removeCanvasSource(source) {
			if (source&&source.node&&source.node.parentNode) source.node.parentNode.removeChild(source.node);
		}

		this.destroy=function() {
			destroy();
			for (var a in sources) removeCanvasSource(sources[a]);
			if (root.parentNode) root.parentNode.removeChild(root);
		}

		this.rawFrame=function() {
			if (this.style.width&&this.style.height) this.redraw(sources.out.ctx,1);
		}
		
		this.frame=function() {
			if (this.style.width&&this.style.height) {
				for (var i=0;i<filters.length;i++) {
					filter=filters[i];
					if (filter.of) {
						if (filter.counter===undefined) filter.counter=0; else
						filter.counter=(filter.counter+1)%filter.of;
						run=filter.counter==filter.every;
					} else run=1;
					if (run)
						if (filter.generate) {
							source=addCanvasSource(filter.to,this.style);						
							switch (filter.generate) {
								case "texture":{
									pixelateStyle(source.node);
									pixelatedContext(source.ctx);
									source.ctx.globalAlpha=filter.alpha||1;
									var tx=Math.ceil(this.style.width/filter._image.img.width),ty=Math.ceil(this.style.height/filter._image.img.height);
									for (var y=0;y<ty;y++)
										for (var x=0;x<tx;x++)
											source.ctx.drawImage(filter._image.img,x*filter._image.img.width,y*filter._image.img.height);
									break;
								}
								case "color":{
									source.ctx.fillStyle=filter.color;
									source.ctx.fillRect(0,0,source.node.width,source.node.height);
									break;
								}
								case "noise":{
									 var w = source.node.width,
								        h = source.node.height,
								        idata = source.ctx.getImageData(0, 0, w, h),
								        buffer32 = new Uint32Array(idata.data.buffer),
								        len = buffer32.length,
								        j = 0;
									    for(; j < len;)  buffer32[j++] = ((255 * Math.random())|0) << 24;
										source.ctx.putImageData(idata, 0, 0);
									  break;
								}
							}
							if (!filter.live) {
								filters.splice(i,1);
								i--;
							}
						} else {
							if (!filter.to) source=sources.out; else
							if (filter.to&&!sources[filter.to]) source=addCanvasSource(filter.to,this.style); else
							source=sources[filter.to];
							if (filter.render) {
								this.redraw(source.ctx,1);
							} else if (filter.blit&&sources[filter.blit]) {
								source.ctx.globalAlpha=filter.alpha||1;
								source.ctx.filter=filter.filter||"none";
								source.ctx.drawImage(sources[filter.blit].node,filter.left||0,filter.top||0);
							}						
						}
				}
			}
		}
	}
}

DOMInator.CONTROLS={
	pointer:{
		keyboard:{
			keyFullScreen: {label:"Fullscreen",subLabel:"Touch with two fingers the game area to enable fullscreen and touch controls.",subLabelDisabled:!Supports.isTouch,default:70}
		},
		pointer:{
			id:{
				options:[
					{id:"mouse",label:"Mouse (click for Trigger)"},
					{id:"touch",label:"Touch screen (tap for Trigger)",isDisabled:!Supports.isTouch}
				],
				default:Supports.pointerMode()
			}
		}
	},
	standard:{
		keyboard:{
			keyUp: {label:"Up",default:38},
			keyDown: {label:"Down",default:40},
			keyLeft: {label:"Left",default:37},
			keyRight: {label:"Right",default:39},
			keyA: {label:"A/Start",default:90},
			keyB: {label:"B/Option",default:88},
			keyFullScreen: {label:"Fullscreen",subLabel:"Touch with two fingers the game area to enable fullscreen and touch controls.",subLabelDisabled:!Supports.isTouch,default:70}
		},
		touchcontroller:{
			layout:{
				allowed:["platformerpad","joypad","sidedpad"],
				default:"platformerpad"
			}
		}
	},
	paddles:{
		keyboard:{
			keyUp1: {label:"Player 1 up",default:87},
			keyDown1: {label:"Player 1 down",default:83},
			keyUp2: {label:"Player 2 up",default:38},
			keyDown2: {label:"Player 2 down",default:40},
			keyA: {label:"Start",default:32},
			keyFullScreen: {label:"Fullscreen",subLabel:"Touch with two fingers the game area to enable fullscreen and touch controls.",subLabelDisabled:!Supports.isTouch,default:70}
		},
		touchcontroller:{
			layout:{
				allowed:["paddlespad"],
				default:"paddlespad"
			}
		}
	}
};

DOMInator.TOUCHLAYOUTS={
	platformerpad:{
		label:"Horizontally: stick, B then A button. Another up button on top right.",
		buttons:[
			{x1:0,y1:0,x2:0.33,y2:1,type:1,deadzone:10,bgcolor:"#f00",color:"#000",label:"Stick"},
			{x1:0.33,y1:0,x2:1,y2:0.5,button:"keyUp",bgcolor:"#0f0",color:"#000",label:"Up"},
			{x1:0.33,y1:0.5,x2:0.66,y2:1,button:"keyB",bgcolor:"#0f0",color:"#000",label:"B"},
			{x1:0.66,y1:0.5,x2:1,y2:1,button:"keyA",bgcolor:"#00f",color:"#000",label:"A"}
		]
	},
	joypad:{
		label:"Stick on left, A bottom/right, B top/right",
		buttons:[
			{x1:0,y1:0,x2:0.5,y2:1,type:1,deadzone:10,bgcolor:"#f00",color:"#000",label:"Stick"},
			{x1:0.5,y1:0,x2:1,y2:0.5,button:"keyB",bgcolor:"#0f0",color:"#000",label:"B"},
			{x1:0.5,y1:0.5,x2:1,y2:1,button:"keyA",bgcolor:"#00f",color:"#000",label:"A"}
		]
	},
	sidedpad:{
		label:"Horizontally: stick, B then A button",
		buttons:[
			{x1:0,y1:0,x2:0.33,y2:1,type:1,deadzone:10,bgcolor:"#f00",color:"#000",label:"Stick"},
			{x1:0.33,y1:0,x2:0.66,y2:1,button:"keyB",bgcolor:"#0f0",color:"#000",label:"B"},
			{x1:0.66,y1:0,x2:1,y2:1,button:"keyA",bgcolor:"#00f",color:"#000",label:"A"}
		]
	},
	paddlespad:{
		label:"Player 1 up/down buttons on left, Player 2 on right",
		buttons:[
			{x1:0,y1:0,x2:0.4,y2:0.5,button:"keyUp1",bgcolor:"#f00",color:"#000",label:"Up 1"},
			{x1:0,y1:0.5,x2:0.4,y2:1,button:"keyDown1",bgcolor:"#ff0",color:"#000",label:"Down 1"},
			{x1:0.6,y1:0,x2:1,y2:0.5,button:"keyUp2",bgcolor:"#00f",color:"#000",label:"Up 2"},
			{x1:0.6,y1:0.5,x2:1,y2:1,button:"keyDown2",bgcolor:"#f0f",color:"#000",label:"Down 2"},
			{x1:0.4,y1:0,x2:0.6,y2:1,button:"keyA",bgcolor:"#fff",color:"#000",label:"Start"},
		]
	}
};

DOMInator.RENDERERS=[
	{id:0,label:"DOM"},
	{id:1,label:"Canvas",isDisabled:!Supports.isCanvas}
];

DOMInator.FILTERS={
	none:[
		{
			label:"(None)",
			filter:[{render:1}]
		}
	],
	retro:[
		{
			label:"Scanlines",
			filter:[
		        {"generate":"texture","image":"~/scanlines.png","alpha":0.1,"to":"scanlines"},
		        {"render":1},
		        {"blit":"scanlines"}
		    ]
		},
		{
			label:"Disabled",
			filter:[{render:1}]
		},
		{
			label:"Retro LCD",
			filter:[
		        {"generate":"texture","image":"~/scanlines.png","alpha":0.1,"to":"scanlines"},
		        {"render":1,"to":"currentframe"},
		        {"blit":"currentframe","alpha":0.4},
		        {"blit":"scanlines"}
		    ]
		},		
		{
			label:"Retro CRT",
			filter:[
		        {"generate":"texture","image":"~/crt.png","alpha":0.1,"to":"crt"},
		        {"generate":"texture","image":"~/scanlines.png","alpha":0.2,"to":"scanlines"},
		        {"generate":"noise","to":"noise","live":1},
		        {"render":1,"to":"currentframe"},
		        {"blit":"currentframe"},
		        {"blit":"trailframe","filter":"saturate(5)","alpha":0.4},
		        {"blit":"currentframe","to":"trailframe","alpha":0.6},
		        {"every":0,"of":2,"blit":"scanlines"},
		        {"every":1,"of":2,"blit":"scanlines","top":1},
		        {"blit":"crt"},
		        {"blit":"noise","alpha":0.1},
		        {"blit":"currentframe","filter":"blur(10px)","alpha":0.5},			        
		    ]	
		},
		{
			label:"Compat Retro CRT",
			filter:[
		        {"generate":"texture","image":"~/crt.png","alpha":0.1,"to":"crt"},
		        {"generate":"texture","image":"~/scanlines.png","alpha":0.2,"to":"scanlines"},
		        {"generate":"noise","to":"noise","live":1},
		        {"render":1,"to":"currentframe"},
		        {"blit":"oldframe","alpha":0.5,"left":-1,"top":-1},
		        {"blit":"oldframe","alpha":0.5,"left":-1,"top":0},
		        {"blit":"oldframe","alpha":0.5,"left":-1,"top":1},
		        {"blit":"oldframe","alpha":0.5,"left":0,"top":-1},
		        {"blit":"oldframe","alpha":0.5,"left":0,"top":0},
		        {"blit":"oldframe","alpha":0.5,"left":0,"top":1},
		        {"blit":"oldframe","alpha":0.5,"left":1,"top":-1},
		        {"blit":"oldframe","alpha":0.5,"left":1,"top":0},
		        {"blit":"oldframe","alpha":0.5,"left":1,"top":1},
		        {"blit":"currentframe","alpha":0.7},
		        {"every":0,"of":2,"blit":"scanlines"},
		        {"every":1,"of":2,"blit":"scanlines","top":1},
		        {"blit":"crt"},
		        {"blit":"noise","alpha":0.1},
		        {"blit":"currentframe","to":"oldframe"}
		    ]	
		}
	]
};


/*
 * Game library
 */

function Box(parent, type, sub, statemanager, useCanvas, aliasmode) {

	var box = {
		// Logic
		uid: 0,
		rects: 0,
		cell: 0,
		cellsignature: 0,
		cleanprops: {},
		displayed: 0,
		coderunning:0,
		isdirty:1,
		// Code
		running:1,
		// Object types
		type: {},
		// Physics
		forceX: 0,
		forceY: 0,
		forceZ: 0,
		// States
		stateManager: statemanager||0,
		states: {},
		state: "",
		nextState: "default",
		// Position
		x: 0,
		y: 0,
		z: 0,
		hitbox: 0,
		priority: 0,
		visible: 1,
		// HTML Properties
		color: "",
		html: undefined,
		font: "",
		outline: 0,
		bgcolor: "transparent",
		fontSize: 20,
		lineHeight: 20,
		border: 0,
		textAlign: "left",
		// Transformation
		originX: "50%",
		originY: "50%",
		flipX: 0,
		flipY: 0,
		angle: 0,
		scale: 1,
		alpha: 1,
		// Image
		tileX: 0,
		tileY: 0,
		frame: 0,
		width: 0,
		height: 0,
		// Animations
		animation: 0,
		animations: {},
		animationcount: 0,
		animationframe: 0,
		animationplay: 0,
		// Nodes
		screen: 0,
		parent: 0,
		childs: [],
		removed: 0,

		// Childs management
		remove: function() {
			this.screen.removeObject(this);
			return this;
		},
		add: function(type, statemanager) { return this.screen.addObject(this, type, statemanager); },

		// States Management
		getState: function(name) {
			if (!name) name = this.state;
			if (!this.states[name]) {
				this.states[name] = {
					parent: this,
					name: name,
					code: [],
					do: function(cb, args) { this.code.push([1, cb, [args || {}, {}]]); },
					undo: function(cb) {
						for (var i = 0; i < this.code.length; i++)
							if (this.code[i][1] == cb) {
								this.code[i][0] = 0;
								break;
							}
						return this;
					},
					remove: function() {
						delete this.parent.states[this.name];
						return this;
					}
				};
				if (this.stateManager) this.stateManager.add(this, name, this.states[name]);
				this.screen.updateNeedRunning(this);
			}
			return this.states[name];
		},
		// Macro attributes
		at: function(s) { return this.setX(s.x || 0).setY(s.y || 0); },
		size: function(s) { return this.setWidth(s.width || 0).setHeight(s.height || 0); },
		setHitbox: function(h) {
			this.hitbox = Supports.clone(h instanceof Array ? h : [h]);
			this.screen.dirtyRects(this);
			return this;
		},
		// Rectangles
		getRects: function() {
			if (!this.rects) this.rects=Box.getRects(this);
			return this.rects;
		},
		// Animation
		setAnimations: function(animations) {
			this.animations = animations;
			return this.changeAnimation(this.animation);
		},
		setAnimation: function(name) {
			if (this.animation != name) return this.changeAnimation(name);
			else return this;
		},
		changeAnimation: function(name) {
			this.animation = name;
			this.animationcount = 0;
			this.animationframe = -1;
			this.animationplay = 1;
			this.screen.updateNeedRunning(this);
			return this;
		},
		// Types
		addType: function(type) {
			this.screen.addObjectType(this, type);
			return this;
		},
		removeType: function(type) {
			this.screen.removeObjectType(this, type);
			return this;
		},
		// States
		setState: function(state) {
			if (this.state != state) return this.changeState(state);
			else return this;
		},
		changeState: function(state) {
			this.nextState = state;
			this.screen.updateNeedRunning(this);
			return this;
		},
		// Code
		do: function(cb, args) {
			this.getState().do(cb, args);
			return this;
		},
		undo: function(cb) {
			this.getState().undo(cb);
			return this;
		},
		stop: function(run) {
			this.running = run;
			return this;
		},
		run: function() { return this.stop(1); }
	};

	if (sub) {
		box.screen = parent.screen;
		box.node=box.screen.node.createElement("div");
	} else {
		box.screen = box;
		box.node=new DOMInator(useCanvas,aliasmode);
	}

	// INIT - Style
	var a,model=Box._[type] || Box._.basic;
	if (model.set) for (a in model.set) box[a] = model.set[a];
	if (model.css) for (a in model.css) box.node.setStyle(a,model.css[a]);

	// INIT - Property creation
	for (var i = 0; i < Box._props.length; i++)
		box["set" + Box.capitalize(Box._props[i])] = (function(k) {
			return function(v) {
				if (this[k] != v) {
					this[k] = v;
					this.cleanprops[k] = 0;
					if (!this.removed) this.screen.scheduleObjectChange(this);
				}
				return this;
			};
		})(Box._props[i]);
	for (var i = 0; i < Box._dirtyrectsprops.length; i++)
		box["set" + Box.capitalize(Box._dirtyrectsprops[i])] = (function(k) {
			return function(v) {
				v=v||0;
				if (this[k] != v) {
					this[k] = v;
					this.cleanprops[k] = 0;
					this.screen.dirtyRects(this);
				}
				return this;
			};
		})(Box._dirtyrectsprops[i]);
	for (var i = 0; i < Box._casacadedirtyrectsprops.length; i++) {
		box["update" + Box.capitalize(Box._casacadedirtyrectsprops[i])] = (function(k) {
			return function() {
				this.cleanprops[k] = 0;
				this.screen.dirtyRects(this,1);
				return this;
			};
		})(Box._casacadedirtyrectsprops[i]);
		box["set" + Box.capitalize(Box._casacadedirtyrectsprops[i])] = (function(k) {
			return function(v) {
				v=v||0;
				if (this[k] != v) {
					this[k] = v;
					this.cleanprops[k] = 0;
					this.screen.dirtyRects(this,1);
				}
				return this;
			};
		})(Box._casacadedirtyrectsprops[i]);
	}
	for (var i = 0; i < Box._translaterectsprops.length; i++) {
		box["update" + Box.capitalize(Box._translaterectsprops[i])] = (function(k) {
			return function() {
				this.cleanprops[k] = 0;
				if (this==this.screen.gridreference) this.screen.gridcoords[k]=this[k];
				this.screen.translateRects(this,k,0);
				return this;
			};
		})(Box._translaterectsprops[i]);
		box["set" + Box.capitalize(Box._translaterectsprops[i])] = (function(k) {
			return function(v) {
				v=v||0;
				if (this[k] != v) {
					var d=v-this[k];
					this[k] = v;
					this.cleanprops[k] = 0;
					if (this==this.screen.gridreference) this.screen.gridcoords[k]=v;
					this.screen.translateRects(this,k,d);
				}
				return this;
			};
		})(Box._translaterectsprops[i]);
	}
	// INIT - Subobject or Screen
	if (sub) {
		// BOX - Finalize
		box.parent = parent;
		parent.childs.push(box);
		box.screen.newUID(box);
		if (parent.removed) box.remove();
		else {
			box.screen.scheduleObjectChange(box);
			box.screen.scheduleObjectMovement(box);
		}
	} else {

		// FILTERS (DOMInator Proxy)
		box.addFilter=function(filter){ return this.node.addFilter(filter); }

		// AUDIO (DOMInator Proxy)
		box.enableAudio=function(volume) { return this.node.enableAudio(volume); }
		box.addAudioChannel=function(name,data) { return this.node.addAudioChannel(name,data); }
		box.getAudioChannel=function(channel) { return this.node.getAudioChannel(channel); }
		box.getAudio=function(name,channel) { return this.node.getAudio(name,channel); }
		box.playAudio=function(name,channel,looping,effect) { return this.node.playAudio(name,channel,looping,effect); }

		// CONTROLS (DOMInator Proxy)
		box.setControls = function(controls) {
			this.node.setControls(controls);
			this.keys=this.node.keys;
			this.key=this.node.key;
			this.pointer=this.node.pointer;
			return this;
		};

		// ABORT
		box.abort = function() { return this.node.abort(); };	

		// RESOURCES LOADER (DOMInator Proxy)	
		box.setResourcesRoot = function(path) { return this.node.setResourcesRoot(path); };
		box.setSystemRoot = function(path) { return this.node.setSystemRoot(path); };
		box.getResourcesRoot = function() { return this.node.getResourcesRoot(); };
		box.getResource = function(name) { return this.node.getResource(name); };		
		box.addResource = function(name, data) { return this.node.addResource(name, data); };		
		box.loadResources = function(cb)  { return this.node.loadResources(cb); };	

		// SCREEN - UID generator
		box.uids = { 0: box };
		box.newUID = function(obj) {
			var uid;
			do {
				uid = Math.floor(Math.random() * 100000000);
			} while (box.uids[uid]);
			obj.uid = uid;
			box.uids[uid] = obj;
			return uid;
		};
		box.releaseUID = function(uid) { delete this.uids[uid]; };

		// SCREEN - Garbage management		
		box.garbage = { objects: [] };
		box.addObject = function(tox, type, statemanager) {
			var obj = Box(tox, type, 1, statemanager);
			return obj;
		};
		box.removeObject = function(obj, skipchilds) {
			if (!obj.removed) {
				obj.removed = 1;
				for (var a in obj.type) this.types[a].length--;
				if (!skipchilds)
					for (var i = 0; i < obj.childs.length; i++) this.removeObject(obj.childs[i]);
				this.updateNeedRunning(obj);
				this.garbage.objects.push(obj);
				if (obj.node.parentNode) this.scheduleObjectRemove(obj); // Removal is casacaded by browser :)
			}
		};
		box.destroy = function() {
			for (var i in this.uids) this.removeObject(this.uids[i], 1);
			this.clean();
			if (this.timeout) clearTimeout(this.timeout);
			this.node.destroy();
			this.timeout=-1;
		};
		box.clean = function() {
			var obj;
			for (var i = 0; i < this.garbage.objects.length; i++) {
				obj = this.garbage.objects[i];
				for (var a in obj.type) this.removeObjectType(obj, a, 1);
				this.removeCell(obj);
				this.releaseUID(obj.uid);
				delete obj.childs;
			}
			this.garbage.objects.length=0;
		};

		// RECTANGLES
		box.cellstoupdate={}; // Cells to be updated (on screen + left from screen)
		box.objectstoupdate={}; // Not visible single objects to be updated (went out of scene when moving by itself)

		box.dirtyRects=function(obj,casacade) {
			if (!obj.removed) {
				obj.rects=0;
				this.dirtygrid[obj.uid] = 1;
				this.scheduleObjectMovement(obj);
				if (casacade)
					for (var i = 0; i < obj.childs.length; i++) this.dirtyRects(obj.childs[i],1);
			}
		};
		box.translateRect=function(obj,k,v) {
			if (obj.rects) {
				obj.rects.rect[k]=FIX(obj.rects.rect[k]+v);
				obj.rects.screen[k]=FIX(obj.rects.screen[k]+v);
				obj.rects.outer[k]=FIX(obj.rects.outer[k]+v);
			}
			if (obj.childs)
				for (var i = 0; i < obj.childs.length; i++) this.translateRect(obj.childs[i],k,v);
		},
		box.translateRects=function(obj,k,v) {
			if (!obj.removed) {
				if (obj===this.gridreference) {
					box.mergeCells(box.cellstoupdate,box,0,0,"*"); // Prepare scrolled cells to be updated later, for removing no longer visible objects.
					if (obj.screen.rects) {
						obj.screen.rects.rect[k]=FIX(obj.screen.rects.rect[k]-v);
						obj.screen.rects.screen[k]=FIX(obj.screen.rects.screen[k]-v);
						obj.screen.rects.outer[k]=FIX(obj.screen.rects.outer[k]-v);
					}
					// Recalculate all translations except into gridreference.
					// - Cancel previous translation - skip them is unconvenient.
					// - Outer rectangles don't need redraw since are still at their place.
					this.recalculateRects(this,obj);
					this.scheduleObjectMovement(obj);  // Schedule its movement changes (visibility will be checked there)				
				} else {
					this.dirtygrid[obj.uid] = 1;
					if (obj.rects) {
						obj.rects.rect[k]=FIX(obj.rects.rect[k]+v);
						obj.rects.screen[k]=FIX(obj.rects.screen[k]+v);
						obj.rects.outer[k]=FIX(obj.rects.outer[k]+v);
					}
					for (var i = 0; i < obj.childs.length; i++) this.translateRects(obj.childs[i],k,v); // Translate all childs rects.
					this.scheduleObjectMovement(obj,1); // Schedule its movement change (visibility will be checked there)
				}
			}
		};
		box.recalculateRects=function(obj,except) {
			if (!obj.removed&&(obj!=except)) {
				obj.rects=0;
				this.dirtygrid[obj.uid] = 1;
				for (var i=0;i<obj.childs.length;i++) this.recalculateRects(obj.childs[i],except);
			}
		};

		// SCREEN - Render management
		box.scheduleObjectMovement = function(obj,recursive) {
			obj.isdirty=1;
			if (obj.node.parentNode&&!this.isOnScreen(obj)) // If this object left the screen...
				box.objectstoupdate[obj.uid]=obj; // ...prepare for removal.
			// ... else it will be updated since it's in a visible cell.
			if (recursive)
				for (var i=0;i<obj.childs.length;i++)
					if (!obj.childs[i].removed) this.scheduleObjectMovement(obj.childs[i],1);
		}
		box.scheduleObjectChange = function(obj,recursive) {
			obj.isdirty=1;
			if (recursive)
				for (var i=0;i<obj.childs.length;i++)
					if (!obj.childs[i].removed) this.scheduleObjectChange(obj.childs[i],1);
		};
		box.scheduleObjectRemove = function(obj,recursive) {
			obj.isdirty=1;
			box.objectstoupdate[obj.uid]=obj;
			if (recursive)
				for (var i=0;i<obj.childs.length;i++)
					if (!obj.childs[i].removed) this.scheduleObjectRemove(obj.childs[i],1);
		};
		box.isOnScreen=function(obj){
			if (obj.type.unoptimize) return true;
			var rect=obj.getRects().screen;
			return !((rect.x+this.gridcoords.x>=this.width)||((rect.x+this.gridcoords.x+rect.width)<1)||(rect.y+this.gridcoords.y>=this.height)||((rect.y+this.gridcoords.y+rect.height)<1));
		};
		box.applyChange=function(obj) {
			var displayed, pad, w, h,onscreen;
			var node = obj.node;
			onscreen=this.isOnScreen(obj);
			if (node) {
				if (obj.isdirty) {
					obj.isdirty=0;
					if (obj.removed) {
						if (obj.node.parentNode) obj.node.parentNode.removeChild(obj.node);
						delete obj.node;
					} else {
						pad = obj.border ? 2 : 0;
						w = obj.width - pad;
						h = obj.height - pad;
						if (w < 0) w = 0;
						if (h < 0) h = 0;
						displayed = obj.visible && w && h;
						if (!obj.displayed&&displayed) node.setStyle("display","block");
						if (obj.displayed&&!displayed) node.setStyle("display","none");
						if (!obj.cleanprops.tileX || !obj.cleanprops.tileY || !obj.cleanprops.frame || !obj.cleanprops.width) {
							node.setStyle("backgroundPositionX",-obj.tileX - (obj.frame * obj.width));
							node.setStyle("backgroundPositionY", -obj.tileY);
							obj.cleanprops.tileX = obj.cleanprops.tileY = obj.cleanprops.frame = 1;
						}
						if (!obj.cleanprops.width || !obj.cleanprops.border) {
							node.setStyle("width",w);
							obj.cleanprops.width = 1;
						}
						if (!obj.cleanprops.height || !obj.cleanprops.border) {
							node.setStyle("height",h);
							obj.cleanprops.height = 1;
						}
						if (!obj.cleanprops.color) {
							node.setStyle("color",obj.color);
							obj.cleanprops.color = 1;
						}
						if (!obj.cleanprops.bgcolor) {
							node.setStyle("backgroundColor",obj.bgcolor);
							obj.cleanprops.bgcolor = 1;
						}
						if (!obj.cleanprops.border) {
							node.setStyle("borderWidth",obj.border?1:0);
							node.setStyle("borderColor",obj.border);
							obj.cleanprops.border = 1;
						}
						if (!obj.cleanprops.zIndex) {
							node.setStyle("zIndex",obj.zIndex);
							obj.cleanprops.zIndex = 1;
						}
						if (!obj.cleanprops.textAlign) {
							node.setStyle("textAlign",obj.textAlign);
							obj.cleanprops.textAlign = 1;
						}
						if (!obj.cleanprops.x || !obj.cleanprops.y || !obj.cleanprops.z || !obj.cleanprops.scale  || !obj.cleanprops.flipX || !obj.cleanprops.flipY || !obj.cleanprops.angle) {
							node.setStyle("scalex",obj.flipX ? -obj.scale : obj.scale);
							node.setStyle("scaley",obj.flipY ? -obj.scale : obj.scale);
							node.setStyle("rotate",obj.angle);
							node.setStyle("left",Math.floor(obj.x));
							node.setStyle("top",Math.floor(obj.y + obj.z));
							obj.cleanprops.x = obj.cleanprops.y = obj.cleanprops.z = obj.cleanprops.flipX = obj.cleanprops.flipY = obj.cleanprops.angle = obj.cleanprops.scale = 1;
						}
						if (!obj.cleanprops.originX || !obj.cleanprops.originY) {
							node.setStyle("originX",obj.originX);
							node.setStyle("originY",obj.originY);
							obj.cleanprops.originX = obj.cleanprops.originY = 1;
						}
						if (!obj.cleanprops.alpha) {
							node.setStyle("opacity",obj.alpha);
							obj.cleanprops.alpha = 1;
						}
						if (!obj.cleanprops.font) {
							node.setStyle("fontFamily",obj.font);
							obj.cleanprops.font = 1;
						}
						if (!obj.cleanprops.lineHeight) {
							node.setStyle("lineHeight",obj.lineHeight);
							obj.cleanprops.lineHeight = 1;
						}
						if (!obj.cleanprops.fontSize) {
							node.setStyle("fontSize",obj.fontSize);
							obj.cleanprops.fontSize = 1;
						}
						if (!obj.cleanprops.outline) {
							node.setStyle("outline",obj.outline);
							obj.cleanprops.outline = 1;
						}
						if (!obj.cleanprops.image) {
							if (obj.image) node.setStyle("backgroundImage", this.node.getResource(obj.image));
							else node.setStyle("backgroundImage","");
							obj.cleanprops.image = 1;
						}
						if (!obj.cleanprops.html) {
							if (obj.html !== undefined) node.setAttribute("innerHTML",obj.html);
							obj.cleanprops.html = 1;
						}
						obj.displayed = displayed;
						if (onscreen&&!node.parentNode) obj.parent.node.appendChild(node);
						else if (!onscreen&&node.parentNode) obj.parent.node.removeChild(node);
					}
				} else {
					if (onscreen&&!node.parentNode) obj.parent.node.appendChild(node);
					else if (!onscreen&&node.parentNode) obj.parent.node.removeChild(node);
				}
			}
		}

		box.applyChanges = function() {
			var a,j,cell;
			box.updateGrid(); // Make sure that all cells are correctly set up

			// Updates single changed objects
			for (a in box.objectstoupdate) {
				box.applyChange(box.objectstoupdate[a]);
				delete box.objectstoupdate[a];
			}

			// Updates cells scheduled for update and visible cells
			box.mergeCells(box.cellstoupdate,box,0,0,"*"); // Add visible cells to the one to update
			box.cellstoupdate["*"]=1; // Add unoptimized objects to the one to update
			for (a in box.cellstoupdate) {
				cell=box.grid[a];
				if (cell&&cell.length)
					for (j in cell.items) box.applyChange(cell.items[j]);
				delete box.cellstoupdate[a];
			}
		};

		// SCREEN - Type manager
		box.types = {};
		box.addObjectType = function(obj, type) {
			if (type instanceof Array)
				for (var i = 0; i < type.length; i++) this.addObjectType(obj, type[i]);
			else if (!obj.type[type]) {
				this.dirtygrid[obj.uid] = 1;
				if (!this.types[type]) {
					this.types[type] = {
						typeId: type,
						length:1,
						items: []
					};
				} else this.types[type].length++;
				this.types[type].items.push(obj);
				obj.type[type] = 1;
			}
		};
		box.removeObjectType = function(obj, type,skipcount) {
			if (type instanceof Array)
				for (var i = 0; i < type.length; i++) this.removeObjectType(obj, type[i]);
			else if (obj.type[type]) {
				this.dirtygrid[obj.uid] = 1;
				this.types[type].items.splice(this.types[type].items.indexOf(obj), 1);
				delete obj.type[type];
				if (!this.types[type].items.length) delete this.types[type];
				else if (!skipcount) this.types[type].length--;
			}
		};
		box.getType=function(id){
			var type=this.types[id];
			if (type&&type.length) return type;
		};
		box.getObjectTyped=function(id){
			var type=this.getType(id);
			if (type)
				for (var i=0;i<type.items.length;i++) if (!type.items[i].removed) return type.items[i];
		};

		// SCREEN - Grid manager
		box.grid = {};
		box.gridreference=0;
		box.gridcoords={x:0,y:0};
		box.gridsize = { width: 128, height: 128 };
		box.dirtygrid = {};
		box.setGridSize = function(size) {
			if (size) this.gridsize=size;
			return this;
		};
		box.setGridReference=function(obj) {
			this.gridreference=obj;
			this.gridcoords.x=0;
			this.gridcoords.y=0;
			for (var i in this.uids)
				if (!this.uids[i].removed) {
					this.dirtygrid[i]=1;
					this.uids[i].rects=0;
				}
			return this;
		},
		box.getCellsSignature = function(obj,dx,dy) {
			dx=dx||0;
			dy=dy||0;
			var
				outer = obj.getRects ? obj.getRects().outer : Box.getRects(obj).outer,
				cx1 = Math.floor((outer.x +dx) / this.gridsize.width),
				cy1 = Math.floor((outer.y +dy) / this.gridsize.height),
				cx2 = Math.ceil((outer.x +dx+ outer.width) / this.gridsize.width),
				cy2 = Math.ceil((outer.y + dy+outer.height) / this.gridsize.height);			
			var ret=cx1 + "," + cy1 + "-" + cx2 + "," + cy2 + "-";
			if (obj.type) for (var a in obj.type) ret+= a+"-";
			return ret;
		};
		box.mergeCells = function(cells,obj,dx,dy,addtype) {
			dx=dx||0;
			dy=dy||0;
			var
				outer = obj.getRects ? obj.getRects().outer : Box.getRects(obj).outer,
				cx1 = Math.floor((outer.x +dx) / this.gridsize.width),
				cy1 = Math.floor((outer.y +dy) / this.gridsize.height),
				cx2 = Math.ceil((outer.x +dx+ outer.width) / this.gridsize.width),
				cy2 = Math.ceil((outer.y + dy+outer.height) / this.gridsize.height);
			for (var x = cx1; x < cx2; x++)
				for (var y = cy1; y < cy2; y++)
					cells[x + "," + y+"-"+addtype]=1;
			return cells;
		};
		box.getCells = function(obj,dx,dy,addtype) {
			dx=dx||0;
			dy=dy||0;
			var
				outer = obj.getRects ? obj.getRects().outer : Box.getRects(obj).outer,
				cells = [],
				cx1 = Math.floor((outer.x +dx) / this.gridsize.width),
				cy1 = Math.floor((outer.y +dy) / this.gridsize.height),
				cx2 = Math.ceil((outer.x +dx+ outer.width) / this.gridsize.width),
				cy2 = Math.ceil((outer.y + dy+outer.height) / this.gridsize.height);
			if (addtype)
				for (var x = cx1; x < cx2; x++)
					for (var y = cy1; y < cy2; y++)
						cells.push(x + "," + y+"-"+addtype);
			else {
				if (obj.type.unoptimize) cells.push("*");
				for (var x = cx1; x < cx2; x++)
						for (var y = cy1; y < cy2; y++)
							cells.push(x + "," + y+"-*");
				for (var a in obj.type)
					for (var x = cx1; x < cx2; x++)
						for (var y = cy1; y < cy2; y++)
							cells.push(x + "," + y+"-"+a);
			}
			return cells;
		};
		box.removeCell = function(obj) {
				if (obj.cell) {
					for (var i = 0; i < obj.cell.length; i++)
						if (this.grid[obj.cell[i]].length==1) delete this.grid[obj.cell[i]];
						else {
							delete this.grid[obj.cell[i]].items[obj.uid];
							this.grid[obj.cell[i]].length--;
						}
					obj.cell = 0;
					obj.cellsignature = 0;
				}
				delete this.dirtygrid[obj.uid];
			},
		box.updateCell = function(obj) {
			if (obj.removed) box.removeCell(obj);
			else {
				var cellsignature = this.getCellsSignature(obj);
				if (!obj.cell || (cellsignature != obj.cellsignature)) {
					var cell = this.getCells(obj);
					if (obj.cell) this.removeCell(obj);
					for (var i = 0; i < cell.length; i++) {
						if (!this.grid[cell[i]]) this.grid[cell[i]] = {items:{},length:0};
						this.grid[cell[i]].items[obj.uid]=obj;
						this.grid[cell[i]].length++;
					}
					obj.cell = cell;
					obj.cellsignature = cellsignature;
				}
				delete this.dirtygrid[obj.uid];
			}
		},
		box.updateGrid = function() {
			var ret = 0;
			for (var a in this.dirtygrid) this.updateCell(this.uids[a]);
		},

		// SCREEN - Collisions
		box.iterateCollisions=function(a,b,getcollision,dx,dy,ignorehitbox,extra,cb) {
			if (!a||a.removed) return;
			if (typeof b == "string") b=this.types[b];
			if (!b) return;
			var col,ret;
			// Collision with type
			if (b instanceof Array) {
				for (var x=0;x<b.length;x++)
					if (!b[x].removed&&(a!==b[x])&&(col=Box.isColliding(a,b[x],getcollision,dx,dy,ignorehitbox)))
						if (ret=cb(col,a,b[x],extra)) return ret;
			} else if (b.typeId) {
				this.updateGrid();
				var cur,itm, cells = this.getCells(a,dx,dy,b.typeId), done = {};
				for (var c = 0; c < cells.length; c++)
					if (cur = this.grid[cells[c]])
						for (var o in cur.items) {
							itm=cur.items[o];
							if (!itm.removed && (a !== itm) && (!done[itm.uid])) {
								done[itm.uid] = 1;
								col=Box.isColliding(a,itm,getcollision,dx,dy,ignorehitbox);
								if (col&&(ret=cb(col,a,itm,extra)))
									if (extra&&extra.all) extra.all.push(ret);
									else return ret;
							}
						}
			} else if (col=Box.isColliding(a,b,getcollision,dx,dy,ignorehitbox)) return cb(col,a,b,extra);
		},

		// SCREEN - Code execution
		box.needrunning=[];
		box.updateNeedRunning=function(obj){
			var needrunning=!obj.removed&&obj.uid&&(obj.animations[obj.animation]||obj.states[obj.state]||obj.states[obj.nextState]);
			if (!obj.coderunning&&needrunning) this.needrunning.push(obj);
			else if (obj.coderunning&&!needrunning) this.needrunning[this.needrunning.indexOf(obj)]=0;
			obj.coderunning=needrunning;
		};
		box.runCode = function(obj) {
			// STATE CHANGE
			var i, statedata, state = obj.state;
			if (obj.nextState != state) {
				obj.state = obj.nextState;
				statedata = obj.getState();
				for (i = 0; i < statedata.code.length; i++) statedata.code[i][2][1] = {};
				if (obj.stateManager) obj.stateManager.change(obj, state, obj.state,statedata);
			} else statedata = obj.getState();

			// STATE CODE
			if (!obj.removed && obj.running && statedata.code)
				for (i = 0; i < statedata.code.length; i++)
					if (statedata.code[i][0] && statedata.code[i][1]) statedata.code[i][1].apply( obj, statedata.code[i][2]);
			for (i = 0; i < statedata.code.length; i++) if (!statedata.code[i][0]) statedata.code.splice(i--, 1);
			
			// ANIMATION
			var animation = obj.animations[obj.animation];
			if (typeof animation == "string") animation = obj.animations[animation];
			if (animation && obj.animationplay)
				if (obj.animationcount) obj.animationcount--;
				else {
					var
					animationframes = animation.frames instanceof Array ? animation.frames : 0,
					animationframescount = animation.frames instanceof Array ? animationframes.length : animation.frames;
					if (obj.animationframe + 1 >= (animationframescount || 1))
						if (animation.loopTo !== undefined) obj.animationframe = animation.loopTo < 0 ? animationframescount - 1 + animation.loopTo : animation.loopTo;
					else obj.animationplay = 0;
					else obj.animationframe++;
					obj.setFrame((animation.frame || 0) + (animationframes ? animationframes[obj.animationframe] : obj.animationframe));
					obj.animationcount = animation.speed === undefined ? 4 : animation.speed;
				}
		};

		// SCREEN - Frames manager
		box.setFps=function(fps) {
			this.node.setFps(fps);
			return this;
		}
		box.addSkipFrames=function(frames) { return this.node.addSkipFrames(frames); }
		box.getFps=function() { return this.node.getFps(); }
		box.getMspf=function() { return this.node.getMspf(); }
		box.node.setRenderer(function(cb) { box.applyChanges();});
		box.node.setGameCycle(function(cb) {
			box.runCode(box);
			box.needrunning.sort(box.sortPriority);
			for (i = 0; i < box.needrunning.length; i++)
				if (box.needrunning[i]) box.runCode(box.needrunning[i]);
				else {
					box.needrunning.splice(i,1);
					i--;
				}
			box.clean();
		});

		// SCREEN - Finalize
		box.parent = 0;
		box.node.parentNode=parent;
		box.node.initialize(parent);
	}
	return box;
}
// Defaults
Box._props = [
	"visible",
	"alpha", "zIndex", "color", "image", "html", "flipX", "flipY", "tileX",
	"tileY", "angle", "scale", "originX", "originY", "font", "outline", "bgcolor",
	"frame", "fontSize", "lineHeight", "border", "textAlign", "priority"
];
Box._dirtyrectsprops = ["width", "height"];
Box._casacadedirtyrectsprops = ["z"];
Box._translaterectsprops = ["x", "y"];
Box._baserects = {
	rect: {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	},
	screen: {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	},
	outer: {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	}
};
Box._ = {
	aliased:{
		css:{} // CSS fixes applied everywhere
	},
	pixelated:{
		css:{} // CSS fixes applied everywhere
	},
	game: {
		css: {
			display: "none",
			position: "relative",
			overflow: "hidden"
		}
	},
	layer: {
		css: {
			display: "none",
			position: "absolute",
			overflow: "hidden"
		}
	},
	label: {
		css: {
			display: "none",
			position: "absolute",
			whiteSpace: "nowrap",
			overflow: "hidden",
			paddingLeft: "1px"
		},
		set: {
			fontSize: 20,
			height: 20,
			lineHeight: 20
		}
	},
	basic: {
		css: {
			display: "none",
			position: "absolute",
			backgroundRepeat: "no-repeat",
			overflow: "hidden"
		}
	}
};

// UTILS
Box.sortPriority = function(a, b) { return !a && !b ? 0 : !a ? 1: !b ? -1 : a.priority - b.priority ? a.priority < b.priority ? -1 : 1 : 0; };
Box.limit = function(val, min, max) {
	if (val < min) return min;
	else if (val > max) return max;
	else return val;
};
Box.capitalize = function(str) { return str.substr(0, 1).toUpperCase() + str.substr(1); };
// UTILS - Distances
Box.distanceX = function(a, b, dx1) {
	if (a && b) {
		dx1 = dx1 || 0;
		var r1 = a.getRects ? a.getRects().rect : a,
			r2 = b.getRects ? b.getRects().rect : b,
			dx2=0;
		if (r1.absolute!=r2.absolute)
			if (r1.absolute) dx1-=b.screen.gridreference.x;
			else if (r2.absolute) dx2-=a.screen.gridreference.x;
		return FIX(Math.abs(r2.x + dx2+((r2.width||0) / 2) - r1.x - dx1 - ((r1.width||0) / 2)));
	}
};
Box.distanceY = function(a, b, dy1) {
	if (a && b) {
		dy1 = dy1 || 0;
		var r1 = a.getRects ? a.getRects().rect : a,
			r2 = b.getRects ? b.getRects().rect : b,
			dy2=0;
		if (r1.absolute!=r2.absolute)
			if (r1.absolute) dy1-=b.screen.gridreference.y;
			else if (r2.absolute) dy2-=a.screen.gridreference.y;
		return FIX(Math.abs(r2.y + ((r2.height||0) / 2) +dy2- r1.y - dy1 - ((r1.height||0) / 2)));
	}
};
Box.distanceZ = function(a, b, dz1) { return Math.abs(b.z+(dz1||0)-a.z); };
Box.distance = function(a, b, dx1, dy1) {
	if (a && b) {
		dx1 = dx1 || 0;
		dy1 = dy1 || 0;
		var r1 = a.getRects ? a.getRects().rect : a,
			r2 = b.getRects ? b.getRects().rect : b,
			dx2=0,dy2=0;
		if (r1.absolute!=r2.absolute)
			if (r1.absolute) { dx1-=b.screen.gridreference.x; dy1-=b.screen.gridreference.y; }
			else if (r2.absolute) { dx2-=a.screen.gridreference.x; dy2-=a.screen.gridreference.y; }
		return FIX(Math.sqrt(Math.pow(r2.x + ((r2.width||0) / 2) +dx2- r1.x - dx1 - ((r1.width||0) /
			2), 2) + Math.pow(r2.y + ((r2.height||0) / 2)+dy2 - r1.y - dy1 - ((r1.height||0) / 2),
			2)));
	}
};
// UTILS - Angles
Box.angleTo=function(a,b) {
	var dx = b.x + ((b.width||0) / 2) - a.x - ((a.width||0) / 2),
		dy = a.y + ((a.height||0) / 2) - b.y - ((b.height||0) / 2),
		ang = (Math.atan2(dx, dy) * 180 / Math.PI);
	if (ang < 0) ang = 360 + ang;
	return ang;
}
// UTILS - Angle toward
Box.angleToward=function(v) {
	var ang = (Math.atan2(v.forceX, -v.forceY) * 180 / Math.PI);
	if (ang < 0) ang = 360 + ang;
	return ang;
}
// UTILS - Vector Length
Box.vectorLength=function(v) { return FIX(Math.sqrt((v.forceX*v.forceX)+(v.forceY*v.forceY))); }
// UTILS - Rectangles
Box.getRects=function(obj){
	var pr = obj.parent ? obj.parent.getRects() : Box._baserects,
		dx=obj.x-(obj===obj.screen?obj.screen.gridcoords.x:0),
		dy=obj.y-(obj===obj.screen?obj.screen.gridcoords.y:0),
		z=obj.z||0;
	var ret = {
		rect: {
			x: pr.rect.x+dx,
			y: pr.rect.y+dy,
			width: obj.width,
			height: obj.height,
			hitbox:obj.hitbox
		},
		outer: {
			x: pr.rect.x+dx,
			y: pr.rect.y+dy,
			width: obj.width,
			height: obj.height
		},
		screen: {
			x: pr.screen.x+dx,
			y: pr.screen.y+dy+ z,
			width: obj.width,
			height: obj.height
		}
	};
	if (z > 0) ret.outer.height += z;
	else {
		ret.outer.y += z;
		ret.outer.height -= z;
	}
	if (obj.hitbox) {
		var hb, bx, by;
		for (var i = 0; i < obj.hitbox.length; i++) {
			hb = obj.hitbox[i];
			bx = ret.rect.x + hb.x;
			by = ret.rect.y + hb.y;
			if (bx < ret.outer.x) {
				ret.outer.width += ret.outer.x - bx;
				ret.outer.x = bx;
			}
			if (by < ret.outer.y) {
				ret.outer.height += ret.outer.y - by;
				ret.outer.y = by;
			}
			if (bx + hb.width > ret.outer.x + ret.outer.width) ret.outer.width = bx + hb.width - ret.outer.x;
			if (by + hb.height > ret.outer.y + ret.outer.height) ret.outer.height = by + hb.height - ret.outer.y;
		}
	}
	return ret;
}
// UTILS - Collisions
Box.isColliding = function(a, b, getcollision, dx1, dy1,ignorehitbox) {
	if (!b || a.removed || b.removed) return false;
	dx1 = dx1 || 0;
	dy1 = dy1 || 0;
	var hit = false,
		hb1x, hb1y, hb1rx, hb1ry, hb2x, hb2y, hb2rx, hb2ry, r1 = a.getRects ? a.getRects()
		.rect : a, dx2=0,dy2=0,
		r2 = b.getRects ? b.getRects().rect : b,
		hb1 = (!ignorehitbox && a.hitbox) || [0],
		hb2 = (!ignorehitbox && b.hitbox) || [0];
	if (r1.absolute!=r2.absolute)
		if (r1.absolute) { dx1-=b.screen.gridreference.x; dy1-=b.screen.gridreference.y; }
		else if (r2.absolute) { dx2-=a.screen.gridreference.x; dy2-=a.screen.gridreference.y; }
	for (var i = 0; i < hb1.length; i++) {
		hb1x = FIX((r1.x || 0) + (hb1[i] ? hb1[i].x : 0) + dx1);
		hb1y = FIX((r1.y || 0) + (hb1[i] ? hb1[i].y : 0) + dy1);
		hb1rx = FIX(hb1x + (hb1[i] ? hb1[i].width : r1.width) - 1);
		hb1ry = FIX(hb1y + (hb1[i] ? hb1[i].height : r1.height) - 1);
		for (var j = 0; j < hb2.length; j++) {
			hb2x = FIX((r2.x || 0) + (hb2[j] ? hb2[j].x : 0) +dx2);
			hb2y = FIX((r2.y || 0) + (hb2[j] ? hb2[j].y : 0) +dy2);
			hb2rx = FIX(hb2x +(hb2[j] ? hb2[j].width : r2.width) - 1);
			hb2ry = FIX(hb2y + (hb2[j] ? hb2[j].height : r2.height) - 1);
			if (!((hb1x > hb2rx) || (hb1rx < hb2x) || (hb1y > hb2ry) || (hb1ry < hb2y))) {
				if (!getcollision) return true;
				if (!hit) hit = {
					x: 0,
					rx: 0,
					y: 0,
					ry: 0
				};
				if (hb1x <= hb2rx) hit.x = Math.max(hit.x, FIX(hb2rx - hb1x + PAD));
				if (hb1rx >= hb2x) hit.rx = Math.max(hit.rx, FIX(hb1rx - hb2x + PAD));
				if (hb1y <= hb2ry) hit.y = Math.max(hit.y, FIX(hb2ry - hb1y + PAD));
				if (hb1ry >= hb2y) hit.ry = Math.max(hit.ry, FIX(hb1ry - hb2y + PAD));
			}
		}
	}
	return hit;
};
Box.isOutside = function(a, b, getcollision, dx1, dy1,ignorehitbox) {
	if (!b || b.removed) return false;
	dx1 = dx1 || 0;
	dy1 = dy1 || 0;
	var hit = false,
		hb1x, hb1y, hb1rx, hb1ry, hb2x, hb2y, hb2rx, hb2ry, r1 = a.getRects ? a.getRects()
		.rect : a, dx2=0,dy2=0,
		r2 = b.getRects ? b.getRects().rect : b,
		hb1 = (!ignorehitbox && a.hitbox) || [0],
		hb2 = (!ignorehitbox && b.hitbox) || [0];
	if (r1.absolute!=r2.absolute)
		if (r1.absolute) { dx1-=b.screen.gridreference.x; dy1-=b.screen.gridreference.y; }
		else if (r2.absolute) { dx2-=a.screen.gridreference.x; dy2-=a.screen.gridreference.y; }
	for (var i = 0; i < hb1.length; i++) {
		hb1x = FIX((r1.x || 0) + (hb1[i] ? hb1[i].x : 0) + dx1);
		hb1y = FIX((r1.y || 0) + (hb1[i] ? hb1[i].y : 0) + dy1);
		hb1rx = FIX(hb1x + (hb1[i] ? hb1[i].width : r1.width) - 1);
		hb1ry = FIX(hb1y + (hb1[i] ? hb1[i].height : r1.height) - 1);
		for (var j = 0; j < hb2.length; j++) {
			hb2x = FIX((r2.x || 0) + (hb2[j] ? hb2[j].x : 0) +dx2);
			hb2y = FIX((r2.y || 0) + (hb2[j] ? hb2[j].y : 0) +dy2);
			hb2rx = FIX(hb2x +(hb2[j] ? hb2[j].width : r2.width) - 1);
			hb2ry = FIX(hb2y + (hb2[j] ? hb2[j].height : r2.height) - 1);
			if ((hb1x < hb2x) || (hb1rx > hb2rx) || (hb1y < hb2y) || (hb1ry > hb2ry)) {
				if (!getcollision) return true;
				if (!hit) hit = {
					x: 0,
					rx: 0,
					y: 0,
					ry: 0
				};
				if (hb1x < hb2x) hit.x = FIX(Math.max(hit.x, hb2x - hb1x+ PAD));
				if (hb1rx > hb2rx) hit.rx = FIX(Math.max(hit.rx, hb1rx - hb2rx+ PAD));
				if (hb1y < hb2y) hit.y = FIX(Math.max(hit.y, hb2y - hb1y+ PAD));
				if (hb1ry > hb2ry) hit.ry = FIX(Math.max(hit.ry, hb1ry - hb2ry+ PAD));
			}
		}
	}
	return hit;
};
// UTILS - File Handling
Box.Cache = function() {
	return {
		data: {},
		ids: [],
		size: 10,
		has: function(key) {
			var pos = this.ids.indexOf(key);
			if (pos != -1) {
				this.ids.splice(pos, 1);
				this.ids.unshift(key);
				return this.data[key];
			}
		},
		add: function(key, value) {
			this.ids.unshift(key);
			this.data[key] = value;
			while (this.ids[this.size]) {
				delete this.data[this.ids[this.size]];
				this.ids.splice(this.size, 1);
			}
		}
	};
};

/*
 * GAME ENGINE
 */

function Wright(gameId,mods) {

	function seededRandom() {
		variables.randomSeed = (variables.randomSeed * 9301 + 49297) % 233280;
		return variables.randomSeed / 233280;
	}

	var ANGLETOLLERANCE=45;
	var DEFAULTHARDWARE={
		width: 320,
		height: 200,
		fps: 25
	};
	var KEYSYMBOLS={
		8:"Backspace",
		9:"Tab",
		13:"Enter",
		16:"Shift",
		17:"Ctrl",
		18:"Alt",
		19:"Pause/break",
		20:"Caps lock",
		27:"Escape",
		32:"Space",
		33:"Page up",
		34:"Page down",
		35:"End",
		36:"Home",
		37:"Left arrow",
		38:"Up arrow",
		39:"Right arrow",
		40:"Down arrow",
		45:"Insert",
		46:"Delete",
		91:"Left window",
		92:"Right window",
		93:"Select key",
		96:"Numpad 0",
		97:"Numpad 1",
		98:"Numpad 2",
		99:"Numpad 3",
		100:"Numpad 4",
		101:"Numpad 5",
		102:"Numpad 6",
		103:"Numpad 7",
		104:"Numpad 8",
		105:"Numpad 9",
		106:"Multiply",
		107:"Add",
		109:"Subtract",
		110:"Decimal point",
		111:"Divide",
		112:"F1",
		113:"F2",
		114:"F3",
		115:"F4",
		116:"F5",
		117:"F6",
		118:"F7",
		119:"F8",
		120:"F9",
		121:"F10",
		122:"F11",
		123:"F12",
		144:"Num lock",
		145:"Scroll lock",
		186:";",
		187:"=",
		188:",",
		189:"-",
		190:".",
		191:"/",
		192:"`",
		219:"[",
		220:"\\",
		221:"]",
		222:"'"
	};
	
	var LABELEXP = /\%([^\%]*)\%/g;

	var game, system, camera, gametypes;
	var tv=0, scenehud=0, hardware=0, gamedata=0, filecache=0, hud=0, scene=0, variables=0, gamerunning=0, curtape=0, database = 0, cheats={};

	function printLog(from,tox,text) {
		if (typeof text == "string") console.log(fillPlaceholders(from,tox,text));
		else console.log(get(from,tox,text));
	}

	var StateManager = {
		add: function(subj, state, data) {
			data.set = [];
			data.execute = [];
			data.actions = {};
		},
		change: function(subj, fromstate, tostate, data) {
			iterateComposedList(subj, subj, data.set, function(set) {
				applyStencil(subj, subj, set);
			});
			execute(subj, subj, data.execute);
		}
	};

	var _Code = {
		sort: {
			zIndex: function(a, b) { return a.zIndex - b.zIndex ? a.zIndex > b.zIndex ? -1 : 1 : 0; }
		},
		collide: function(applyphysics, self, force, opforce, restitution, friction, subj, hit, wall) {
			if (typeof wall == "object") {
				if (applyphysics) {
					if (wall[restitution] !== undefined) self._events[force] *= -get(self, self, wall[restitution]);
					else if (wall.restitution !== undefined) self._events[force] *= -get(self, self, wall.restitution);
					if (opforce) {
						if (wall[friction] !== undefined) self._events[opforce] *= get(self, self, wall[friction]);
						else if (wall.friction !== undefined) self._events[opforce] *= get(self, self, wall.friction);
					}
				}
				if (wall.execute) self._events.execute.push([hit, get(subj, hit, wall.execute)]);
				if (wall.firstExecute) self._events.firstExecute.push([hit, get(subj, hit, wall.firstExecute)]);
			} else self._events[force] = 0;
		},
		wallsXcollision:function(col,self,hit,wall) {
			var apply;
			if (wall.only && (wall.only.top || wall.only.bottom)) self._events.hz.push(hit);
			if (
				(!wall.only) ||
				(
					(wall.only.left && (self.forceX > 0)) ||
					(wall.only.right && (self.forceX < 0))
				) && !Box.isColliding(self, hit, true, -self.forceX, self.forceY)
			) {
				if (apply = !Box.isColliding(self._events.oldrect, hit)) {
					if (self.forceX < 0) {
						self.touchLeft = hit;
						self.x = FIX(self.x + col.x);
						self.screen.translateRect(self,"x",col.x);
					} else if (self.forceX > 0) {
						self.touchRight = hit;
						self.x = FIX(self.x - col.rx);
						self.screen.translateRect(self,"x",-col.rx);
					}
				}
				_Code.collide(apply, self, "forceX", "forceY", "restitutionX", "frictionY", self, hit, wall);
			}
		},
		wallsX: function(wall, self) {
			var s, p, hit, set, col, apply;
			if (wall.type)
				iterateComposedList(self, self, get(self, self,wall.type), function(type){
					game.iterateCollisions(self, get(self, self, type),1,0,0,0,wall,_Code.wallsXcollision);
				});
			else if (wall.area)
				iterateComposedList(self, self, get(self, self,wall.area), function(area){
					hit = get(self, self, area);
					if (col = Box.isOutside(self, hit, true)) {
						if (self.forceX < 0) {
							self.touchLeft = hit;
							self.x = FIX(self.x + col.x);
							self.screen.translateRect(self,"x",col.x);
						} else if (self.forceX > 0) {
							self.touchRight = hit;
							self.x = FIX(self.x - col.rx);
							self.screen.translateRect(self,"x",-col.rx);
						} else col = 0;
						if (col) _Code.collide(1, self, "forceX", "forceY", "restitutionX", "frictionY", self, hit, wall);
					}
				});
			else if (
				(wall.cameraBound && (camera.bound && camera.currentCamera && camera.currentCamera.bound)) ||
				(wall.camera && camera.currentCamera)
			) {
				hit = camera.currentCamera;
				if (col = Box.isOutside(self, hit, true,0,0,1)) {
					if (self.forceX < 0) {
						self.touchLeft = hit;
						self.x = FIX(self.x + col.x);
						self.screen.translateRect(self,"x",col.x);
					} else if (self.forceX > 0) {
						self.touchRight = hit;
						self.x = FIX(self.x - col.rx);
						self.screen.translateRect(self,"x",-col.rx);
					} else col = 0;
					if (col) _Code.collide(1, self, "forceX", "forceY", "restitutionX","frictionY", self, hit, wall);
				}
			}
		},
		wallsYcollision:function(col,self,hit,wall) {
			var apply;
			if (
				(!wall.only) ||
				(
					(wall.only.top && (self.forceY > 0)) ||
					(wall.only.bottom && (self.forceY < 0))
				) && (self._events.hz.indexOf(hit) == -1)
			) {
				if (apply = !Box.isColliding(self._events.oldrect, hit)) {
					if (self.forceY < 0) {
						self.touchUp = hit;
						self.y = FIX(self.y + col.y);
						self.screen.translateRect(self,"y",col.y);
					} else if (self.forceY > 0) {
						self.touchDown = hit;
						self.y = FIX(self.y - col.ry);
						self.screen.translateRect(self,"y",-col.ry);
					}
				}
				_Code.collide(apply, self, "forceY", "forceX", "restitutionY","frictionX", self, hit, wall);
			}
		},
		wallsY: function(wall, self) {
			var s, p, hit, set, col, apply, type;
			if (wall.type)
				iterateComposedList(self, self, get(self, self,wall.type), function(type){
					game.iterateCollisions(self,get(self, self, type),1,0,0,0,wall,_Code.wallsYcollision);
				});
			else if (wall.area)
				iterateComposedList(self, self, wall.area, function(area){
					hit = get(self, self, area);
					if (col = Box.isOutside(self, hit, true)) {
						if (self.forceY < 0) {
							self.touchUp = hit;
							self.y = FIX(self.y + col.y);
							self.screen.translateRect(self,"y",col.y);
						} else if (self.forceY > 0) {
							self.touchDown = hit;
							self.y = FIX(self.y - col.ry);
							self.screen.translateRect(self,"y",-col.ry);
						} else col = 0;
						if (col) _Code.collide(1, self, "forceY", "forceX", "restitutionY","frictionX", self, hit, wall);
					}
				});
			else if (
				(wall.cameraBound && (camera.bound && camera.currentCamera && camera.currentCamera.bound)) ||
				(wall.camera && camera.currentCamera)
			) {
				hit = camera.currentCamera;
				if (col = Box.isOutside(self, hit, true,0,0,1)) {
					if (self.forceY < 0) {
						self.touchUp = hit;
						self.y = FIX(self.y + col.y);
						self.screen.translateRect(self,"y",col.y);
					} else if (self.forceY > 0) {
						self.touchDown = hit;
						self.y = FIX(self.y - col.ry);
						self.screen.translateRect(self,"y",-col.ry);
					} else col = 0;
					if (col) _Code.collide(1, self, "forceY", "forceX", "restitutionY","frictionX", self, hit, wall);
				}
			}
		},
		wallsZ: function(wall, self) {
			var s, p, hit, set, col;
			if (wall.z !== undefined) {
				iterateComposedList(self, self, get(self, self,wall.z), function(z){
					var z = get(self, self, z);
					if (self.z > z) {
						self.z = z;
						self.touchZ=1;
						_Code.collide(1, self, "forceZ", 0, "restitutionZ", 0, self, hit, wall);
					}
				});
			}
		},
		applyLimit: function(value, limit) {
			if (limit) {
				if (value < limit[0]) return limit[0];
				if (value > limit[1]) return limit[1];
			}
			return value;
		},
		pad: function(lft, rgt) { return game.key[lft] > 0 ? -1 : game.key[rgt] > 0 ? 1 : 0; },
		_findcamera: function(item, from) { if (!item.disabled && !Box.isOutside(from, item,0,0,0,1)) return item; },
		collision:function(col,rect,item,args) {
			if (args) {
				if (args.covering && (item.zIndex <= args.zIndex)) return;
				if ((args.distance !== undefined) && (Box.distance(rect, item) > args.distance)) return;
				if ((args.distancex !== undefined) && (Box.distanceX(rect, item) > args.distancex)) return;
				if ((args.distancey !== undefined) && (Box.distanceY(rect, item) > args.distancey)) return;
				if ((args.distancez !== undefined) && (Box.distanceZ(rect, item) > args.distancez)) return;
			}
			return item;
		}
	};

	var Code = {
		Log: function(data) { printLog(this, this, data); },
		Physics: function(data) {
			if (gamerunning && (!data.when || get(this, this, data.when))) {
				var gx = get(this, this, data.gravityX) || 0,
					gy = get(this, this, data.gravityY) || 0,
					gz = get(this, this, data.gravityZ) || 0,
					walls = get(this, this, data.walls),
					limitX = get(this, this, data.limitX) || 0,
					limitY = get(this, this, data.limitY) || 0,
					limitZ = get(this, this, data.limitZ) || 0,
					ox = this.x,
					oy = this.y,
					oz = this.z,
					or=this.getRects().rect;
				if (limitX) limitX = [get(this, this, limitX[0]), get(this, this, limitX[1])];
				if (limitY) limitY = [get(this, this, limitY[0]), get(this, this, limitY[1])];
				if (limitZ) limitZ = [get(this, this, limitZ[0]), get(this, this, limitZ[1])];
				this._events = {
					hz: [],
					execute: [],
					firstExecute:[],
					oldrect: {x:or.x,y:or.y,width:or.width,height:or.height,hitbox:or.hitbox},
					forceX: 1,
					forceY: 1,
					forceZ: 1
				};
				this.forceX = FIX(_Code.applyLimit(this.forceX + gx, limitX));
				this.forceY = FIX(_Code.applyLimit(this.forceY + gy, limitY));
				this.forceZ = FIX(_Code.applyLimit(this.forceZ + gz, limitZ));
				this.touchUp = this.touchDown = this.touchLeft = this.touchRight = this.touchZ = 0;
				this.x = FIX(this.x + this.forceX);
				this.screen.translateRect(this,"x", this.forceX);
				if (walls) iterateComposedList(this, this, walls, _Code.wallsX);
				this.y = FIX(this.y + this.forceY);
				this.screen.translateRect(this,"y", this.forceY);
				if (walls) iterateComposedList(this, this, walls, _Code.wallsY);
				this.z = FIX(this.z + this.forceZ);
				if (walls) iterateComposedList(this, this, walls, _Code.wallsZ);
				if (this._events.firstExecute.length)
					for (var i = 0; i < this._events.firstExecute.length; i++)
						execute(this, this._events.firstExecute[i][0], this._events.firstExecute[i][1]);
				if (this._events.forceX != 1) this.forceX = _Code.applyLimit(FIX(this.forceX * this._events.forceX), limitX);
				if (this._events.forceY != 1) this.forceY = _Code.applyLimit(FIX(this.forceY * this._events.forceY), limitY);
				if (this._events.forceZ != 1) this.forceZ = _Code.applyLimit(FIX(this.forceZ * this._events.forceZ), limitZ);
				if (this._events.execute.length)
					for (var i = 0; i < this._events.execute.length; i++)
						execute(this, this._events.execute[i][0], this._events.execute[i][1]);
				delete this._events;
				if (ox != this.x) this.updateX();
				if (oy != this.y) this.updateY();
				if (oz != this.z) this.updateZ();
			}
		},
		Player: function(data) {
			if (gamerunning && (!data.when || get(this, this, data.when))) {
				var d, horizontal = get(this, this, data.horizontal),
					vertical = get(this, this, data.vertical),
					jump = get(this, this, data.jump);
				if (horizontal)
					if (typeof horizontal == "object") {
						var control = get(this, this, horizontal.control),
							speed = get(this, this, horizontal.speed),
							gotoZero = get(this, this, horizontal.gotoZero),
							zeroValue = get(this, this, horizontal.zeroValue) || 0;
						if (control) d = _Code.pad("keyLeft", "keyRight") * (speed === undefined ? 1 : speed);
						else d = 0;
						if (gotoZero && !d)
							if (Math.abs(zeroValue-this.forceX) < gotoZero) d = zeroValue-this.forceX;
							else d = gotoZero * (this.forceX-zeroValue > 0 ? -1 : 1);
						this.forceX += d;
					} else this.forceX += _Code.pad("keyLeft", "keyRight");
				if (vertical)
					if (typeof vertical == "object") {
						var control = get(this, this, vertical.control),
							speed = get(this, this, vertical.speed),
							gotoZero = get(this, this, vertical.gotoZero),
							zeroValue = get(this, this, vertical.zeroValue) || 0;
						if (control) d = _Code.pad("keyUp", "keyDown") * (speed === undefined ? 1 : speed);
						else d = 0;
						if (gotoZero && !d)
							if (Math.abs(zeroValue-this.forceY) < gotoZero) d = zeroValue-this.forceY;
							else d = gotoZero * (this.forceY-zeroValue > 0 ? -1 : 1);
						this.forceY += d;
					} else this.forceY += _Code.pad("keyUp", "keyDown");
				if (jump) {
					var forceY = get(this, this, jump.forceY),
						cut = get(this, this, jump.cut),
						count = get(this, this, jump.count),
						audio = get(this, this, jump.playAudio);
					if (this.touchDown) {
						if (game.key.keyUp == 1) {
							this.forceY = forceY;
							if (audio) game.playAudio(audio);
							this.currentJump = {
								cut: 0,
								count: 1
							};
						} else if (this.currentJump) delete this.currentJump;
					} else if (this.currentJump) {
						if ((cut !== undefined) && !this.currentJump.cut && (this.forceY * forceY > 0) && (game.key.keyUp == -1)) {
							this.forceY *= cut;
							this.currentJump.cut = 1;
						}
						if (count && (this.currentJump.count < count) && (game.key.keyUp == 1)) {
							this.forceY = forceY;
							this.currentJump.count++;
						}
					}
				}
			}
		},
		ZPerspective: function(data, local) {
			if (local.startingZ === undefined) {
				local.startingZ = data.startingZ === undefined ? 1000 : data.startingZ;
				local.add = data.add ? data.add : 0;
			}
			if (this.y != local.y) {
				local.y = this.y;
				this.setZIndex(Math.floor(local.startingZ + this.y + this.height + local.add));
			}
		},
		Execute: function(data) {
			if (gamerunning) execute(this, this, data);
		},
		Sequence: function(data, local) {
			var dest, goto, lock, busy, ret, wait, line, linelocal, sub, id;
			if (local.stopped === undefined) local.stopped = 0;
			if (local.running === undefined) local.running = 1;
			if (local.sub === undefined) local.sub = [{
				id: 0,
				data: data instanceof Array ? data : [data],
				linelocal: []
			}];
			while (local.running) {
				sub = local.sub[local.sub.length - 1];
				if (sub.id >= sub.data.length)
					if (local.sub.length > 1) local.sub.pop();
					else {
						local.running = 0;
						break;
					}
				else {
					line = get(this, this, sub.data[sub.id]);
					linelocal = sub.linelocal[sub.id];
					wait = lock = busy = 0;
					goto = undefined;
					if (!linelocal || linelocal.execute) {
						ret = execute(this, this, line, local);
						if (linelocal) delete linelocal.execute;
					} else
						ret = 1;
					if (ret) {
						if ((line.wait !== undefined) && (!linelocal || !linelocal.waitdone)) {
							if ((line.loopTo === undefined) && (line.loop === undefined) && line.until) { // Until is refered to loopTo when specified
								if (!get(this, this, line.until)) busy = wait = 1;
							} else {
								if (!linelocal) linelocal = sub.linelocal[sub.id] = {};
								if (linelocal.towait === undefined) linelocal.towait = get(this, this,line.wait)||1;
								else linelocal.towait--;
								if (!linelocal.towait||(linelocal.towait<0)) {
									delete linelocal.towait;
									linelocal.waitdone = 1;
								} else lock = busy = wait = 1;
							}
						}
						if (!busy && ((line.loopTo !== undefined) || (line.loop !== undefined)) && (!linelocal || !linelocal.looptodone)) {
							dest = line.loop === undefined ? line.loopTo < 0 ? sub.id + line.loopTo : line.loopTo : sub.id;
							if (line.until) {
								if (!get(this, this, line.until)) {
									busy = 1;
									goto = dest;
								}
							} else if (line.cycles !== undefined) {
								if (!linelocal) linelocal = sub.linelocal[sub.id] = {};
								if (linelocal.cycles === undefined) linelocal.cycles = get(this, this, line.cycles);
								linelocal.execute = 1;
								delete linelocal.waitdone;
								linelocal.cycles--;
								if (linelocal.cycles <= 0) {
									delete linelocal.cycles;
									linelocal.looptodone = 1;
								} else {
									lock = busy = 1;
									goto = dest;
								}
							} else goto = dest;
						}
						if (!busy && (line.goto !== undefined)) goto = line.goto;
						if (!lock) delete sub.linelocal[sub.id];
						if (goto !== undefined) sub.id = goto - 1;
					}
					if (wait) break;
					else  sub.id++;
				}
			}
		},
		// DON'T USE THIS CODE IN GAMES! FOR INTERNAL USE!
		Fade: function(data, local) {
			if (local.speed === undefined) {
				if (data.to === undefined) data.to = data.from > 0.5 ? 0 : 1;
				if (data.speed === undefined) data.speed = 0.1;
				local.done = 0;
				local.speed = get(this, this, data.speed);
				local.wait = get(this, this, data.wait);
				local.to = get(this, this, data.to);
				local.then = get(this, this, data.then);
				local.as = data.as || this;
			}
			if (local.done) {
				if (local.done == 1) {
					if (local.then) execute(this, this, local.then);
					local.done = 2;
				}
			} else if (local.wait) local.wait--;
			else if (Math.abs(local.as.alpha - local.to) < Math.abs(local.speed)) {
				local.as.setAlpha(local.to);
				local.done = 1;
			} else local.as.setAlpha(local.as.alpha + (local.speed * (local.as.alpha < local.to ? 1 : -1)));
		},
		Delay: function(data, local) {
			if (local.delay === undefined) {
				local.delay = data.delay;
				local.then=data.then;
			}
			if (local.done) {
				if (local.done == 1) {
					if (local.then) execute(this, this, local.then);
					local.done = 2;
				}
			} else if (local.delay) local.delay--;
			else local.done=1;
		},
		GameManager: function() {
			updateHud();
			if (scene && camera && camera.follow) {
				var nextcamera, gx, gy, dx, dy,sx=0,sy=0, rect = camera.follow.getRects ? camera.follow.getRects().rect : camera.follow;
				if (camera.cameras) {
					if (camera.currentCamera && !Box.isColliding(rect, camera.currentCamera,0,0,0,1)) {
						if (camera.currentCamera && camera.currentCamera.onExitExecute) execute(scene, scene, camera.currentCamera.onExitExecute);
						camera.currentCamera = 0;
					}
					nextcamera = iterateComposedList(rect, scene, camera.cameras, _Code._findcamera);
					if (nextcamera && (camera.currentCamera != nextcamera)) {
						camera.currentCamera = nextcamera;
						if (camera.currentCamera && camera.currentCamera.onEnterExecute) execute(scene, scene, camera.currentCamera.onEnterExecute);
					}
				} else camera.currentCamera=scene.getRects().rect;
				sx=scene.x;
				sy=scene.y;
				gx = rect.x +sx - (camera.x + camera.focusX);
				if (gx > 0) {
					gx = rect.x +sx + rect.width - (camera.x + camera.focusX + camera.focusWidth);
					if (gx < 0) gx = 0;
				}
				gy = rect.y + sy - (camera.y + camera.focusY);
				if (gy > 0) {
					gy = rect.y +sy + rect.height - (camera.y + camera.focusY + camera.focusHeight);
					if (gy < 0) gy = 0;
				}
				dx = camera.x + gx - sx;
				dy = camera.y + gy - sy;
				if (camera.currentCamera) {
					if (dx < camera.currentCamera.x) dx = camera.currentCamera.x;
					if ((dx + camera.width) > (camera.currentCamera.x + camera.currentCamera.width)) dx = camera.currentCamera.x + camera.currentCamera.width - camera.width;
					if (dy < camera.currentCamera.y) dy = camera.currentCamera.y;
					if ((dy + camera.height) > (camera.currentCamera.y + camera.currentCamera.height)) dy = camera.currentCamera.y + camera.currentCamera.height - camera.height;
				}
				gx = Math.floor(dx-camera.x)+sx;
				gy = Math.floor(dy-camera.y)+sy;
				if (camera.reset) camera.reset = 0;
				else {
					if (Math.abs(gx) > 1) gx *= camera.smoothness;
					if (Math.abs(gy) > 1) gy *= camera.smoothness;
				}
				scene.setX(scene.x - gx);
				scene.setY(scene.y - gy);
			}
		}
	};

	var SceneGenerators={

		tilemap:function(template,father,from,tox) {
			iterateComposedList(from, tox, get(from, tox, template.tilemap), function(tilemap) {
				var map = get(from, tox, tilemap.map),
					tile = mw = mh = 0,
					tilewidth = get(from, tox, tilemap.tileWidth) || 16,
					tileheight = get(from, tox, tilemap.tileHeight) || 16,
					atx = get(from, tox, tilemap.x) || 0,
					aty = get(from, tox, tilemap.y) || 0,
					tilez = tilemap.zIndex ? get(from, tox, tilemap.zIndex) : undefined,
					alpha = tilemap.alpha ? get(from, tox, tilemap.alpha) : undefined;
				for (var y = 0; y < map.length; y++)
					for (var x = 0; x < map[y].length; x++)
						if (curtape.stencils[map[y][x]]) {
							tile = father.add(0, StateManager).setWidth(tilewidth).setHeight(tileheight).at({
								x: (tilewidth * x) + atx,
								y: (tileheight * y) + aty
							});
							if (tilez !== undefined) tile.setZIndex(tilez);
							if (alpha !== undefined) tile.setAlpha(alpha);
							applyStencil(tile, tox, curtape.stencils[map[y][x]]);
							if (tile.x + tile.width > mw) mw = tile.x + tile.width;
							if (tile.y + tile.height > mh) mh = tile.y + tile.height;
						}
				from.size({
					width: (tilemap.width || mw),
					height: (tilemap.height || mh)
				});
			});
		},

		// From TLOA: https://github.com/kesiev/TheLastOfAt
		// A (bad) dungeon generator thought for code golfing but it fits the purpose and has a lot of parameters :)
		dungeon:function(template,father,from,tox) {

			function random(n) { return Math.floor(seededRandom()*n); }

			var args={
				gridWidth:get(from, tox, template.dungeon.gridWidth)||1,
				gridHeight:get(from, tox, template.dungeon.gridHeight)||1,
				mapWidth:get(from, tox, template.dungeon.mapWidth)||64,
				mapHeight:get(from, tox, template.dungeon.mapHeight)||64,
				minRoomSize:get(from, tox, template.dungeon.minRoomSize)||6,
				maxRoomSize:get(from, tox, template.dungeon.maxRoomSize)||16,
				complexity:get(from, tox, template.dungeon.complexity)||6,
				separateRooms:get(from, tox, template.dungeon.separateRooms),
				allowRoomOverlap:get(from, tox, template.dungeon.allowRoomOverlap),

				tileWidth:get(from, tox, template.dungeon.tileWidth)||16,
				tileHeight:get(from, tox, template.dungeon.tileHeight)||16,
				x:get(from, tox, template.dungeon.x)||0,
				y:get(from, tox, template.dungeon.y)||0,
				width:get(from, tox, template.dungeon.width),
				height:get(from, tox, template.dungeon.height),


				roomWallRenderer:get(from, tox, template.dungeon.roomWallRenderer)||0,
				roomFloorRenderer:get(from, tox, template.dungeon.roomFloorRenderer)||0,
				corridorWallRenderer:get(from, tox, template.dungeon.corridorWallRenderer)||0,
				corridorFloorRenderer:get(from, tox, template.dungeon.corridorFloorRenderer)||0,
				backgroundRenderer:get(from, tox, template.dungeon.backgroundRenderer)||0,
				environmentRenderer:get(from, tox, template.dungeon.environmentRenderer)||0,
				doorRenderer:get(from, tox, template.dungeon.doorRenderer)||0,
				zIndex:get(from, tox, template.dungeon.zIndex)||0
			};

			var sidemargin=args.separateRooms?0:1;
			var roomborder=args.separateRooms?1:0;
			var minwidth=Math.floor((args.minRoomSize+(roomborder*2))/args.gridWidth)*args.gridWidth;
			var minheight=Math.floor((args.minRoomSize+(roomborder*2))/args.gridHeight)*args.gridHeight;
			var roomwidthdelta=Math.floor((args.maxRoomSize-args.minRoomSize)/args.gridWidth);
			var roomheightdelta=Math.floor((args.maxRoomSize-args.minRoomSize)/args.gridHeight);
			var roomleftdelta=Math.floor((args.mapWidth-minwidth-roomwidthdelta-(sidemargin*2))/args.gridWidth);
			var roomtopdelta=Math.floor((args.mapHeight-minheight-roomheightdelta-(sidemargin*2))/args.gridHeight);
			var mw=args.mapWidth*args.tileWidth,mh=args.mapHeight*args.tileHeight;

			var map = [];
			for (var y = 0; y < args.mapHeight; y++) {
				map[y] = [];
				for (var x = 0; x < args.mapWidth; x++)
					map[y][x]={mapX:x,mapY:y,x:(args.tileWidth * x) + args.x,y:(args.tileHeight * y) + args.y, height:args.tileHeight, width: args.tileWidth,data:{cellType:0}};
			}

			// Make rooms
			var rw,rh,rx,ry,ok,room,roomId=0,env={rooms:[]},stopper=500;
			for (var i=0;i<1+args.complexity;i++) {
				rh=minheight+(random(1+roomheightdelta)*args.gridHeight);
				rw=minwidth+(random(1+roomwidthdelta)*args.gridWidth);
				rx=(random(1+roomleftdelta)*args.gridWidth)+sidemargin;
				ry=(random(1+roomtopdelta)*args.gridHeight)+sidemargin;
				ok=true;
				room={mapX:rx+roomborder,mapY:ry+roomborder,mapWidth:rw-(roomborder*2),mapHeight:rh-(roomborder*2),walkables:[]};
				for (var y=0;y<rh;y++)
					for (var x=0;x<rw;x++)
						ok&=!map[ry+y][rx+x].data.cellType;
				if (!args.allowRoomOverlap&&!ok) {
					i--;
					if (!stopper--) break;
				} else {
					room.x=(args.tileWidth * room.mapX) + args.x;
					room.y=(args.tileWidth * room.mapY) + args.y;
					room.width=args.tileWidth * room.mapWidth;
					room.height=args.tileWidth * room.mapHeight;
					for (var y=0;y<rh;y++)
						for (var x=0;x<rw;x++) {
							if (args.separateRooms&&((y==0)||(x==0)||(x==rw-1)||(y==rh-1)))
								map[ry+y][rx+x].data={cellType:2,isRoom:1,isWall:1,isRoomWall:1,roomId:roomId,mapX:x,mapY:y} // Wall
							else {
								room.walkables.push(map[ry+y][rx+x]);
								map[ry+y][rx+x].data={cellType:1,isRoom:1,isFloor:1,isRoomFloor:1,roomId:roomId,mapX:x,mapY:y}; // Floor
							}
						}
					env.rooms[roomId++]=room;
				}
			}

			// Add corridors
			var prev,start,end,gap,startroom,endroom,door,doors=[];
			for (var i=0;i<env.rooms.length-1;i++) {
				startroom=i;
				endroom=i+1;
				door=0;
				start={x:env.rooms[startroom].mapX+sidemargin+random(env.rooms[startroom].mapWidth-(sidemargin*2)),y:env.rooms[startroom].mapY+sidemargin+random(env.rooms[startroom].mapHeight-(sidemargin*2))};
				end={x:env.rooms[endroom].mapX+sidemargin+random(env.rooms[endroom].mapWidth-(sidemargin*2)),y:env.rooms[endroom].mapY+sidemargin+random(env.rooms[endroom].mapHeight-(sidemargin*2))};
				while ((start.x!=end.x)||(start.y!=end.y)) {
					if (start.y!=end.y) {
						gap=start.y>end.y?-1:1;
						if ((start.y+gap>0)&&(start.y+gap<args.mapHeight-1)) start.y+=gap; else gap=0;
					} else {
						gap=start.x>end.x?-1:1;
						if ((start.x+gap>0)&&(start.x+gap<args.mapWidth-1)) start.x+=gap; else gap=0;
					}
					if (gap) {
						for (var y=start.y-1;y<start.y+2;y++)
							for (var x=start.x-1;x<start.x+2;x++)
								if (!map[y][x].data.cellType) map[y][x].data={cellType:3,isCorridor:1,isWall:1,isCorridorWall:1,mapX:x,mapY:y,fromRoom:startroom,toRoom:endroom};
						if (map[start.y][start.x].data.cellType!=1) {
								if (!map[start.y][start.x].data.isRoom)
									door=0;
								else if (!door)
									door=doors.push({
										mapX:start.x,mapY:start.y,x:(args.tileWidth * start.x) + args.x,y:(args.tileHeight * start.y) + args.y, height:args.tileHeight, width: args.tileWidth,data:{fromRoom:startroom,toRoom:endroom}
									});
							map[start.y][start.x].data={cellType:4,isFloor:1,isCorridor:1,isCorridorFloor:1,fromRoom:startroom,toRoom:endroom}; // Corridor
							prev={x:start.x,y:start.y};
						} else door=0;
					}
				}
			}

			// Render
			var cell,renderer;
			for (var x = 0; x < args.mapWidth; x++)
				for (var y = 0; y < args.mapHeight; y++) {
					cell=map[y][x];
					renderer=0;
					cell.data.maskSides=
						(map[y-1]&&map[y-1][x]&&(map[y-1][x].data.cellType==cell.data.cellType)&&1)|
						(map[y][x+1]&&(map[y][x+1].data.cellType==cell.data.cellType)&&2)|
						(map[y+1]&&map[y+1][x]&&(map[y+1][x].data.cellType==cell.data.cellType)&&4)|
						(map[y][x-1]&&(map[y][x-1].data.cellType==cell.data.cellType)&&8);
					cell.data.maskCorners=
						(map[y-1]&&map[y-1][x-1]&&(map[y-1][x-1].data.cellType==cell.data.cellType)&&1)|
						(map[y-1]&&map[y-1][x+1]&&(map[y-1][x+1].data.cellType==cell.data.cellType)&&2)|
						(map[y+1]&&map[y+1][x+1]&&(map[y+1][x+1].data.cellType==cell.data.cellType)&&4)|
						(map[y+1]&&map[y+1][x-1]&&(map[y+1][x-1].data.cellType==cell.data.cellType)&&8);
					cell.data.room=env.rooms[cell.data.roomId];
					renderer=0;
					switch (cell.data.cellType) {
						case 0:{renderer=args.backgroundRenderer; break;}
						case 1:{renderer=args.roomFloorRenderer; break;}
						case 2:{renderer=args.roomWallRenderer; break;}
						case 3:{renderer=args.corridorWallRenderer; break;}
						case 4:{renderer=args.corridorFloorRenderer; break;}
					}
					if (renderer) execute(cell, tox, get(cell, tox, renderer));
				}

			if (args.doorRenderer)
				for (var d = 0; d < doors.length; d++)
					execute(doors[d], tox, get(cell, tox, args.doorRenderer));

			if (args.environmentRenderer)
				execute(env, tox, get(env, tox, args.environmentRenderer));

			from.size({
				width: args.x + (args.width || mw),
				height: args.y + (args.height || mh)
			});


		}

	}

	var Storage={
		initialize:function(tap){ this.id=tap.name; },
		setter:function(key,value) { if (window.localStorage) localStorage["GAME_"+this.id+"_"+key]=JSON.stringify(value); },
		getter:function(key){
			if (window.localStorage) {
				var ret=localStorage["GAME_"+this.id+"_"+key];
				return ret&&(ret!="undefined")?JSON.parse(ret):undefined;
			}
		}
	};

	// HUD

	function hudget(from,tox,str) {
		if ((typeof str == "string") && (str.indexOf(".") != -1)) return get(from,tox, {"_": str.split(".")});
		else return str;
	}

	function fillPlaceholders(from,tox,text) {
		var j, ret, sub, val, sym, sym2, sym3, total, len;
		return text.replace(LABELEXP, function(match, slice) {
			if (slice) {
				sub = slice.split("|");
				val = get(from, tox, {"_": sub[1].split(".")});
				switch (sub[0]) {
					case "text":{ return val || ""; }
					case "number": {
						sym = ((val * 1) || sub[2] || 0)+"";
						sym2 = hudget(from,tox,sub[3]) * 1;
						sym3 = sub[4]||"0";
						if (sym2) {
							len = sym2-sym.length;
							if (len>0) for (j=0;j<len;j++) sym=sym3+sym;
						}
						return sym;
					}
					case "boolean": {
						if (val) return hudget(from,tox,sub[2]);
						else return hudget(from,tox,sub[3]);
					}
					case "repeatPercent": {
						total = hudget(from,tox,sub[2]) * 1;
						len = hudget(from,tox,sub[3]) * 1;
						sym = hudget(from,tox,sub[4]);
						sym2 = hudget(from,tox,sub[5]) || "";
						val = Math.ceil((val / total) * len);
						ret = "";
						for (j = 0; j < len; j++) ret += j < val ? sym : sym2;
						return ret;
					}
					case "repeat":{
						sym = hudget(from,tox,sub[2]);
						ret = "";
						for (j = 0; j < val; j++) ret += sym;
						return ret;
					}
					default:{ return val; }
				}
			} else return "%";
		});
	}

	function updateHud() {
		if (game.types.hud) {
			var huds=game.types.hud.items;
			for (var i = 0; i < huds.length; i++) {
				elm = huds[i];
				switch (elm.hudType) {
					case "label":{
						elm.setHtml(fillPlaceholders(scene,scene,elm.label));
						break;
					}
				}
			}
		}
	}

	// GETTERS AND ITERATORS

	function iterateComposedList(from, tox, list, cb) {
		var ret;
		if ((typeof list == "object")&&list.typeId) {
			for (var i = 0; i < list.items.length; i++)
				if (!list.items[i].removed) {
					ret = cb(list.items[i], from, tox);
					if (ret !== undefined) return ret;
				}
		} else if (list instanceof Array)
			for (var i = 0; i < list.length; i++) {
				ret = iterateComposedList(from, tox, get(from, tox, list[i]), cb);
				if (ret !== undefined) return ret;
			} else {
				ret = cb(get(from, tox, list), from, tox);
				if (ret !== undefined) return ret;
			}
	}

	function mergeList(into, list) {
		if (list instanceof Array)
			for (var i = 0; i < list.length; i++) into.push(list[i]);
		else into.push(list);
	}

	function decide(from, tox, opts) { // @TODO: priority, probability of choice.
		var valid = [];
		iterateComposedList(from,tox,get(from, tox, opts),function(item){
			if ((item.when === undefined) || get(from, tox, item.when))
				iterateComposedList(from, tox, item.options, function(subitem) {
					valid.push(subitem)
				});
		});
		return valid.length ? valid[Math.floor(seededRandom() * valid.length)] : undefined;
	}

	function merge(from,tox,obj,hst){
		for (var k in obj)
			if (obj[k] instanceof Array) merge(from,tox,obj[k]);
			else obj[k]=get(from,tox,obj[k]);
		return obj;
	}

	function get(from, tox, struct, prev) {
		if ((typeof struct == "object") && (struct._ !== undefined)) {
			var ret, p, tkn, sub, id = 0;
			struct = struct._ instanceof Array ? struct._ : [struct._];
			if (prev < 0) {
				id = struct.length + prev;
				prev = 0;
			}
			prev = prev || 0;
			for (; id < struct.length - prev; id++) {
				tkn = get(from, tox, struct[id]);
				if (game.keys[tkn]) ret = game.key[tkn];
				else switch (tkn) {
					case "cheat":{ ret=cheats; break; }
					case "this": { ret=from; break; }
					case "that": { ret=tox; break; }
					case "scene": { ret=scene; break; }
					case "pointer": { ret=game.pointer; break; }
					case "key": { ret=game.key; break; }
					case "stencil":{
						p=get(from, tox, struct[++id]);
						if (curtape.stencils[p]) ret = Supports.clone(curtape.stencils[p]);
						else {
							console.warn("Stencil ["+p+"] not found.");
							ret=0;
						}
						break;
					}
					case "resource":{
						p=get(from, tox, struct[++id]);
						if (ret=game.getResource(p)) ret = Supports.clone(ret);
						else {
							console.warn("Resource ["+p+"] not found.");
							ret=0;
						}
						break;
					}
					case "object":{ ret = game.getType(get(from, tox, struct[++id]))||0; break; }
					case "variable":{ ret = variables; break; }
					case "camera":{ ret = camera.cameras; break; }
					case "currentCamera":{ ret = camera.currentCamera; break; }
					case "hud":{ ret = hud; break; }
					case "scenehud":{ ret = scenehud; break; }
					case "storage":{ ret=Storage; break; }
					case "audio":{
						var ch,nm=get(from, tox, struct[++id]);
						if (struct[id+1]=="withChannel") {
							id++;
							ch=get(from, tox, struct[++id])
						}
						ret=game.getAudio(nm,ch);
						break;
					}
					case "date":{
						p=new Date();
						ret={
							allMilliseconds:p.getTime(),
							allDays:Math.floor(p.getTime()/86400000),
							day:p.getDate(),
							month:p.getMonth(),
							year:p.getFullYear(),
							hours:p.getHours(),
							minutes:p.getMinutes(),
							seconds:p.getSeconds()
						};
						break;
					}
					case "merged":{ ret=merge(from,tox,ret); break; }
					case "new":{ ret = Supports.clone(get(from, tox, struct[++id])); break; }
					case "arrayOf":{
						p = get(from, tox, struct[++id]);
						ret = [];
						if (typeof p == "object") {
							if (p.typeId !== undefined) p=p.items;
							for (var a in p)
								if ((typeof p[a]!="object")||!p[a].removed) ret.push(p[a]);
						}  // @TODO: Handle arrays, once needed.
						break;
					}
					case "then":{
						p = get(from, tox, struct[++id]);
						if (ret) {
							ret=p;
							if (struct[id+1]=="else") id+=2;
						} else if (struct[id+1]=="else") {
							id++;
							p = get(from, tox, struct[++id]);
							ret=p;
						}
						break
					}
					case "capitalize":{
						ret=Box.capitalize(ret);
						break;
					}
					case "proportionalValue":{
						p = get(from, tox, struct[++id]);
						var value = get(from, tox, p.value);
						var a1 = get(from, tox, p.proportion[0]),
							a2 = get(from, tox, p.proportion[1]);
						var b1 = get(from, tox, p.proportion[2]),
							b2 = get(from, tox, p.proportion[3]);
						if (value < a1) value = a1;
						if (value > a2) value = a2;
						ret = b1 + (((b2 - b1) * (value - a1)) / (a2 - a1));
						break;
					}
					case "limitValue":{
						p = get(from, tox, struct[++id]);
						var a1 = get(from, tox, p[0]),
							a2 = get(from, tox, p[1]);
						if (ret < a1) ret = a1;
						if (ret > a2) ret = a2;
						break;
					}
					case "randomNumber":{
						p = get(from, tox, struct[++id]);
						if (p instanceof Array) {
							var v1 = get(from, tox, p[0]),
								v2 = get(from, tox, p[1]);
							ret = v1 + Math.floor(seededRandom() * (v2 - v1 + 1));
						} else ret = p;
						break;
					}
					case "randomObject":{
						p = get(from, tox, struct[++id]);
						if ((typeof p=="object")&&p.typeId) {
							if (p.length) do {ret=p.items[Math.floor(seededRandom() * p.items.length)];} while(ret.removed);
							else ret=0;
						} // @TODO: Handle arrays, once needed.
						break;
					}
					case "randomValue":{
						p = get(from, tox, struct[++id]);
						if (p instanceof Array) ret = p[Math.floor(seededRandom() * p.length)];
						else ret = p;
						break;
					}
					case "minimum":{
						var c;
						p = get(from, tox, struct[++id]);
						ret=get(from, tox, p[0]);
						for (var i=1;i<p.length;i++) {
							c=get(from, tox, p[i]);
							if (c<ret) ret=c;
						}
						break;
					}
					case "maximum":{
						var c;
						p = get(from, tox, struct[++id]);
						ret=get(from, tox, p[0]);
						for (var i=1;i<p.length;i++) {
							c=get(from, tox, p[i]);
							if (c>ret) ret=c;
						}
						break;
					}
					case "decide":{ ret = decide(from, tox, get(from, tox, struct[++id])); break; }
					case "xCenteredWith":{
						p = get(from, tox, struct[++id]);
						ret = FIX(p.x + Math.floor((p.width - ret.width) / 2));
						break;
					}
					case "yCenteredWith":{
						p = get(from, tox, struct[++id]);
						ret = FIX(p.y + Math.floor((p.height - ret.height) / 2));
						break;
					}
					case "xAlignedToGrid":{
						p=get(from, tox, struct[++id]);
						var cellWidth=get(from, tox, p.cellWidth)||1,xOrigin=get(from, tox, p.xOrigin)||0,xCenter=get(from,tox,p.xCenter)||0;
						ret=FIX((Math.floor((ret+xCenter-xOrigin)/cellWidth)*cellWidth)+xOrigin);
						break;
					}
					case "yAlignedToGrid":{
						p=get(from, tox, struct[++id]);
						var cellHeight=get(from, tox, p.cellHeight)||1,yOrigin=get(from, tox, p.yOrigin)||0,yCenter=get(from,tox,p.yCenter)||0;
						ret=FIX((Math.floor((ret+yCenter-yOrigin)/cellHeight)*cellHeight)+yOrigin);
						break;
					}
					case "nearestTo":{
						var tdis,dis;
						p=get(from, tox, struct[++id]);
						iterateComposedList(from, tox, ret, function(item) {
							if (item!=p) {
								tdis=Box.distance(item, p);
								if ((dis===undefined)||(tdis<dis)) {
									dis=tdis;
									ret=item;
								}
							}
						});
						break;
					}
					case "angleTo":{ ret=FIX(Box.angleTo(ret,get(from, tox, struct[++id]))); break; }
					case "angleToward":{ret=FIX(Box.angleToward(get(from, tox, struct[++id]))); break; }
					case "vectorLength":{ret=FIX(Box.vectorLength(get(from, tox, struct[++id]))); break; }
					case "shortestAngleTo":{
						p=((get(from,tox,struct[++id])-ret)%360)+180;
						ret=FIX((p-Math.floor(p/360)*360)-180);
						break;
					}
					case "objectTyped":{ ret = game.getObjectTyped(get(from, tox, struct[++id]))||0; break; }
					case "abs":{ ret = FIX(Math.abs(ret)); break; }
					case "floor":{ ret = FIX(Math.floor(ret)); break; }
					case "ceil":{ ret = FIX(Math.ceil(ret)); break; }
					case "round":{ ret = FIX(Math.round(ret)); break; }
					case "pointAt":{
						p=get(from, tox, struct[++id]);
						ret= {x:ret.x+(p&&p.x?p.x:0),y:ret.y+(p&&p.y?p.y:0),width:1,height:1};
						break;
					}
					case ".":{ ret = ret + get(from, tox, struct[++id]); break; }
					case "+":{ ret = FIX(ret + get(from, tox, struct[++id])); break; }
					case "mod":
					case "%":{ ret = FIX(ret % get(from, tox, struct[++id])); break; }
					case "-":{ ret = FIX(ret - get(from, tox, struct[++id])); break; }
					case "*":{ ret = FIX(ret * get(from, tox, struct[++id])); break; }
					case "/":{ ret = FIX(ret / get(from, tox, struct[++id])); break; }
					case "^":{ ret = Math.pow(ret,get(from, tox, struct[++id])); break; }
					case "sin":{ ret = Math.sin(ret); break; }
					case "cos":{ ret = Math.cos(ret); break; }
					case "not":{ ret = !ret; break; }
					case "and":{
						id++;
						ret = ret && get(from, tox, struct[id]);
						break;
					}
					case "or":{
						id++;
						ret = ret || get(from, tox, struct[id]);
						break;
					}
					case "distanceTo":{
						ret = Box.distance(ret, get(from, tox, struct[++id]));
						break;
					}
					case "complexCollidesWith":
					case "collidesWith":{
						sub = 0;
						if (gamerunning) {
							p = get(from, tox, struct[++id]);
							var list, complex = tkn == "complexCollidesWith", rect = ret;
							if (complex) list = get(from, tox, p.subject);
							else list = p;
							if (list) {
								var args;
								if (complex) {
									args={
										zIndex:ret.zIndex,
										sortby:get(from, tox, p.sortBy),
										distance:get(from, tox, p.distance),
										distancex:get(from, tox, p.distanceX),
										distancey:get(from, tox, p.distanceY),
										distancez:get(from, tox, p.distanceZ),
										all:get(from, tox, p.all) ? [] : 0,
										covering:get(from, tox, p.covering) ? 1 : 0
									};
									if (p.hitbox) {
										rect = ret.getRects ? ret.getRects().rect : ret;
										rect={x:rect.x,y:rect.y,width:rect.width,height:rect.height,hitbox:[]};
										iterateComposedList(from, tox, p.hitbox, function(item) {
											rect.hitbox.push({
												x: get(from, tox, item.x) || 0,
												y: get(from, tox, item.y) || 0,
												width: get(from, tox, item.width) || 1,
												height: get(from, tox, item.height) || 1
											});
										});
									}
									if (args.covering) args.sortby = "zIndex";
									if (args.sortby) {
										if (list.typeId) list=list.items;
										list = list.sort(_Code.sort[args.sortby]); // @TODO: This touches a private list of Box. Could be better.
									}
								}
								sub=game.iterateCollisions(rect,list,0,0,0,0,args,_Code.collision);
								if (args&&args.all) sub=args.all.length?args.all:0;
							}
						}
						ret = sub;
						break;
					}
					case "isTyped":{ ret = ret && ret.type && ret.type[get(from, tox, struct[++id])] ? 1 : 0; break; }
					case "isHit":{ ret = ret == 1 ? 1 : 0; break; }
					case "isDown":{ ret = ret >= 1 ? 1 : 0; break; }
					case "isUp":{ ret = (!ret || (ret <= 0)) ? 1 : 0; break; }
					case "isReleased":{ ret = ret == -1 ? 1 : 0; break; }
					case "isUnder":{
						p = Box.angleTo(ret,get(from, tox, struct[++id]));
						ret=(p<ANGLETOLLERANCE)||(p>360-ANGLETOLLERANCE) ? 1 : 0;
						break;
					}
					case "isOver":{
						p = Box.angleTo(ret,get(from, tox, struct[++id]));
						ret=(p<(180+ANGLETOLLERANCE))&&(p>(180-ANGLETOLLERANCE)) ? 1 : 0;
						break;
					}
					case "isOnTheRightOf":{
						p = Box.angleTo(ret,get(from, tox, struct[++id]));
						ret=(p<(90+ANGLETOLLERANCE))&&(p>(90-ANGLETOLLERANCE)) ? 1 : 0;
						break;
					}
					case "isOnTheLeftOf":{
						p = Box.angleTo(ret,get(from, tox, struct[++id]));
						ret=(p<(270+ANGLETOLLERANCE))&&(p>(270-ANGLETOLLERANCE)) ? 1 : 0;
						break;
					}
					case "search":{
						sub=0;
						p=get(from, tox, struct[++id]);
						for (var a in p) p[a]=get(from,tox,p[a]);
						for (var a in ret) {
							sub=1;
							for (var b in p)
								if (ret[a][b]!==p[b]) {
									sub=0;
									break;
								}
							if (sub) break;
						}
						if (sub) ret=ret[a];
						else ret=0;
						break;
					}
					case "isSameOf":
					case "isNotSameOf":
					case "isGreaterThan":
					case "isLessThan":
					case "isGreaterEqualThan":
					case "isLessEqualThan":
					case "isNotEqualTo":
					case "isEqualTo":{
						sub = get(from, tox, struct[++id]);
						switch (tkn) {
							case "isSameOf":{ ret = (ret === sub ? 1 : 0); break; }
							case "isNotSameOf":{ ret = (ret !== sub ? 1 : 0); break; }
							case "isNotEqualTo":{ ret = (ret != sub ? 1 : 0); break; }
							case "isEqualTo":{ ret = (ret == sub ? 1 : 0); break; }
							case "isGreaterThan":{ ret = (ret > sub ? 1 : 0); break; }
							case "isLessThan":{ ret = (ret < sub ? 1 : 0); break; }
							case "isGreaterEqualThan":{ ret = (ret >= sub ? 1 : 0); break; }
							case "isLessEqualThan":{ ret = (ret <= sub ? 1 : 0); break; }
						}
						break;
					}
					case "count":{ ret = ret ? ret.length : 0; break; }
					default:{
						if (ret !== undefined) {
							if (ret instanceof Array) ret=ret[tkn*1];
							else if (ret.getter) ret=ret.getter(tkn);
							else ret=ret[tkn];
						} else ret = tkn;
					}
				}
			}
			return ret;
		} else return struct;
	}

	// SETTER

	function set(from, tox, struct, value) {
		if ((typeof struct == "object") && (struct._ !== undefined)) {
			var subj = get(from, tox, struct, 1),
				name = get(from, tox, struct, -1);
			value = get(from, tox, value);
			if (subj instanceof Array)
				if (typeof name == "number") {
					subj[name] = value;
					return;
				} else subj = subj[0];
			if (typeof subj == "object") {
				if (subj.setter) subj.setter(name,value);
				else if (typeof subj["set" + Box.capitalize(name)] == "function") subj["set" + Box.capitalize(name)](value);
				else if (typeof(subj[name]) == "function") subj[name](value);
				else subj[name] = value;
			}
		}
	}

	// EXECUTE CODE

	function executeLine(from, tox, line, sequence) {
		var ret,perform=1, update, curtox=tox, curfrom=from;

		// DO NOT USE: wait, loopTo, until, goto
		if (line.when !== undefined) {
			perform = get(from, tox, line.when);
			if (typeof perform == "object") curtox = perform;
		}
		if (ret === undefined) ret = perform;
		if (perform) {
			if (line.object !== undefined) {
				var father = line.into === undefined ? scene : get(from, tox, line.into), newtox=0,cre;
				iterateComposedList(from, tox, get(from, tox, line.object), function(item) {
					cre=applyStencil(father.add(item.box, StateManager), from, item);
					if (!newtox) newtox=cre;
					else if (newtox instanceof Array) newtox.push(cre);
					else newtox=[newtox,cre];
				});
				curtox = newtox;
			}
			// When tox is confirmed.
			if (line.as !== undefined) {
				var tmp = curfrom;
				curfrom = get(curfrom, curtox, line.as);
				curtox = tmp;
			}
			if (line.with !== undefined) curfrom = get(curfrom, curtox, line.with);
			if (line.abort) game.abort();
			// Object manipulators
			if (curfrom)
				iterateComposedList(curfrom, curtox, curfrom, function(item) {
					if (line.log) printLog(item,curtox,line.log);
					if (line.print) scene.setHtml(get(item, curtox, line.print));
					if (line.subsequence)
						if (sequence) {
							var data = get(item, curtox, line.subsequence);
							sequence.sub.push({
								id: 0,
								data: data instanceof Array ? data : [data],
								linelocal: []
							});
						} else console.warn("Skipping sequence",line.subsequence);
					if (line.set) iterateComposedList(item, curtox, get(item, curtox, line.set), function(subitem) { applyStencil(item, curtox, subitem); });
					if (line.sum !== undefined) set(item, curtox, line.to, FIX(get(item, curtox, line.to) + get(item, curtox, line.sum)));
					if (line.subtract !== undefined) set(item, curtox, line.to, FIX(get(item, curtox, line.to) - get(item, curtox, line.subtract)));
					if (line.multiply !== undefined) set(item, curtox, line.to, FIX(get(item, curtox, line.to) * get(item, curtox, line.multiply)));
					if (line.assign !== undefined) set(item, curtox, line.to, get(item, curtox, line.assign));
					if (line.pushInto !== undefined) {
						var into= get(item, curtox, line.pushInto);
						if (into && (into instanceof Array)) into.push(item);
					}
					if (line.unshiftInto !== undefined) {
						var into= get(item, curtox, line.unshiftInto);
						if (into && (into instanceof Array)) into.unshift(item);
					}
					if (line.unpush !== undefined) {
						var from= get(item, curtox, line.from);
						if (from && (from instanceof Array)) {
							var pos=from.indexOf(get(item, curtox, line.unpush));
							if (pos!=-1) from.splice(pos,1);
						}
					}
					if (line.sort) {
						var by= get(item, curtox, line.by);
						var list= get(item, curtox, line.sort);
						var reversed=get(item, curtox, line.reversed)?1:0;
						if (list && (list instanceof Array))
							list.sort(function(a,b){
								if (reversed) return a[by]==b[by]?0:a[by]<b[by]?1:-1;
								else return a[by]==b[by]?0:a[by]<b[by]?-1:1;
							});
					}
					if (line.shuffle) {
						var list=get(item, curtox, line.shuffle);
						if (list && (list instanceof Array)) {
							var a,b;
							for (var i=0;i<list.length*2;i++) {
								a=Math.floor(seededRandom()*list.length);
								b=Math.floor(seededRandom()*list.length);
								p=list[a];
								list[a]=list[b];
								list[b]=p
							}
						}
					}
					if (line.remove !== undefined) item.remove();
					if (line.placeInto !== undefined) {
						var placeInto=get(item,curtox,line.placeInto);
						if (placeInto) {
							var col=Box.isOutside(item, placeInto, true);
							if (col) {
								item.setX(FIX(item.x + col.x - col.rx));
								item.setY(FIX(item.y + col.y - col.ry));
							}
						}
					}
					if (line.applyVector||line.sumVector) {
						var angle, fx, fy, vector=line.applyVector||line.sumVector;
						if (vector.toward === undefined) angle = get(item, curtox, vector.angle);
						else angle = Box.angleTo(item,get(item, curtox, vector.toward));
						angle *=  Math.PI /180;
						var length = get(item, curtox, vector.length);
						fx = FIX(angle == 180 ? 0 : length * Math.sin(angle));
						fy = FIX(angle == 270 ? 0 : -length * Math.cos(angle));
						if (line.applyVector) {
							item.forceX=fx;
							item.forceY=fy;
						} else {
							item.forceX+=fx;
							item.forceY+=fy;
						}
					}
					if (line.stopChannel) {
						var channel=game.getAudioChannel(get(item, curtox, line.stopChannel));
						if (channel) channel.stop();
					}
					if (line.stopAudio) {
						var audio=game.getAudio(get(item,curtox,line.stopAudio),get(item,curtox,line.withChannel));
						if (audio) audio.stop();
					}
					if (line.playAudio) game.playAudio(get(item,curtox,line.playAudio),get(item,curtox,line.withChannel),get(item,curtox,line.withLooping),get(item,curtox,line.withEffect));
					if (line.applyEffect) {
						var element;
						if (line.toAudio!==undefined) element=game.getAudio(get(item,curtox,line.toAudio),get(item,curtox,line.withChannel));
						else if (line.toChannel!==undefined) element=game.getAudioChannel(get(item,curtox,line.toChannel));
						if (element) element.applyEffect(get(item,curtox,line.applyEffect));
					}
					if (line.executeAction !== undefined) {
						var statedata = item.getState();
						iterateComposedList(item, curtox, get(item, curtox, line.executeAction),
							function(subitem) {
								if (statedata.actions[subitem]) {
									if (statedata.actions[subitem].set)
										iterateComposedList(item, curtox, get(item, curtox, statedata.actions[subitem].set), function(setter) {
											applyStencil(item, curtox, get(item, curtox, setter));
										});
									if (statedata.actions[subitem].execute) execute(item, curtox, get(item, curtox, statedata.actions[subitem].execute),sequence);
								}
							});
					}
					if (line["switch"] !== undefined) {
						var value=get(item,curtox,line["switch"]),cases=get(item,curtox,line["case"]);
						if (cases[value]) execute(item, curtox, get(item, curtox, cases[value]),sequence);
					}
					if (line.execute !== undefined) execute(item, curtox, get(item, curtox, line.execute),sequence);
					if (line.decide !== undefined) {
						var decision=decide(item,curtox, get(item, curtox, line.decide));
						if (decision) execute(item, curtox, decision,sequence);
					}
				});

			if (line.restartScene !== undefined) plugTape(line.withTransition === undefined ? 1 : line.withTransition, get(curfrom, curtox, line.withChannel), variables.idScene);
			if (line.gotoScene !== undefined) plugTape(line.withTransition === undefined ? 1 : line.withTransition, get(curfrom, curtox, line.withChannel), get(curfrom, curtox, line.gotoScene));
			if (!gamerunning) return 1;
		} else if (line.elseExecute !== undefined) execute(curfrom, curtox, get(curfrom,curtox, line.elseExecute), sequence);
		return ret;
	}

	function execute(from, tox, lines, sequence) {
		var ret=0;
		if (typeof lines == "function") lines.apply(tox, [from]);
		else if (gamerunning)
			iterateComposedList(from, tox, lines, function(line) {
				var times = get(from, tox, line.times);
				if (times !== undefined)
					for (var t = 0; t < times; t++) ret|=executeLine(from,tox,line,sequence);
				else if (line.foreach !== undefined)
					iterateComposedList(from, tox, get(from,tox,line.foreach), function(item) {
						ret|=executeLine(item,tox,line,sequence);
					});
				else ret=executeLine(from,tox,line,sequence);
			});
		return ret;
	}

	// APPLY STATES CHANGES

	function applyStatesModel(from, tox, states, supername) {
		iterateComposedList(from, tox, get(from, tox, states), function(item) {
			var statename = supername || get(from, tox, item.name) || "default", statedata = from.getState(statename);
			if (item.like) iterateComposedList(from, tox, get(from, tox, item.like), function(item) {
					applyStatesModel(from, tox, item, statename);
				});
			if (item.code) iterateComposedList(from, tox, get(from, tox, item.code), function(item) {
					statedata.do(Code[item.name], item.data);
				});
			if (item.actions) iterateComposedList(from, tox, get(from, tox, item.actions), function(item) {
				if (!statedata.actions[item.name]) statedata.actions[item.name] = {
					set: [],
					execute: []
				};
				if (item.set !== undefined) mergeList(statedata.actions[item.name].set,item.set);
				if (item.execute !== undefined) mergeList(statedata.actions[item.name].execute, item.execute);
			});
			if (item.set) mergeList(statedata.set, item.set);
			if (item.execute) mergeList(statedata.execute, item.execute);
		});
	}

	// APPLY OBJECT CHANGES

	function addCamera(from,tox,area) {
		var cam=Supports.clone(area);
		for (var a in cam) cam[a]= get(from, tox, cam[a]);
		camera.cameras.push(cam);
	}

	function applyStencil(from, tox, template) {
		if (!template) debugger;
		if (template.set) iterateComposedList(from, tox, get(from, tox, template.set), function(item) {
			applyStencil(from, tox, item);
		});

		var s, subfather, father = template.into === undefined ? from : get(from, tox, template.into);
		for (var a in template)
			if (!SceneGenerators[a])
				switch (a) {
					case "withChannel":
					case "withEffect":
					case "withLooping":
					case "into":
					case "execute":
					case "set":
					case "object":
					case "box":{ break; }
					case "log":{ printLog(from,tox,template.log); break; }
					case "states":{ applyStatesModel(from, tox, template.states); break; }
					case "type":{
						iterateComposedList(from, tox, get(from, tox, template.type), function(item) {
							from.addType(item);
						});
						break;
					}
					case "removeType":{
						iterateComposedList(from, tox, get(from, tox, template.removeType),function(item) {
							from.removeType(item);
						});
						break;
					}
					case "follow":{
						if (get(from, tox, template.follow)) camera.follow = from;
						else camera.follow=null;
						break;
					}
					case "cameraX":{ camera.x = get(from, tox, template.cameraX); break; }
					case "cameraY":{ camera.y = get(from, tox, template.cameraY); break; }
					case "cameraWidth":{ camera.width = get(from, tox, template.cameraWidth); break; }
					case "cameraHeight":{ camera.height = get(from, tox, template.cameraHeight); break; }
					case "cameraFocusX":{ camera.focusX = get(from, tox, template.cameraFocusX); break; }
					case "cameraFocusY":{ camera.focusY = get(from, tox, template.cameraFocusY); break; }
					case "cameraFocusWidth":{ camera.focusWidth = get(from, tox, template.cameraFocusWidth); break; }
					case "cameraFocusHeight":{ camera.focusHeight = get(from, tox, template.cameraFocusHeight); break; }
					case "cameraBound":{ camera.bound = get(from, tox, template.cameraBound); break; }
					case "cameraSmoothness":{ camera.smoothness = get(from, tox, template.cameraSmoothness); break; }
					case "cameras":{
						camera.currentCamera = 0;
						if (template.cameras == 0) camera.cameras = 0;
						else {
							camera.cameras = [];
							iterateComposedList(from, tox, get(from, tox, template.cameras),function(area) { addCamera(from,tox,area) });
						}
						break;
					}
					case "addCamera":{
						camera.currentCamera = 0;
						if (!camera.cameras) camera.cameras = [];
						if (template.addCamera) iterateComposedList(from, tox, get(from, tox, template.addCamera),function(area) { addCamera(from,tox,area) });
						break;
					}
					case "hitbox":{
						var hb = [];
						iterateComposedList(from, tox, get(from, tox, template.hitbox), function(item) {
							hb.push(Supports.clone(item));
						});
						from.setHitbox(hb);
						break;
					}
					case "playAudio":{
						game.playAudio(get(from, tox, template.playAudio),get(from, tox, template.withChannel),get(from, tox, template.withLooping),get(from, tox, template.withEffect));
						break;
					}
					case "stopAudio":{
						var audio=game.getAudio(get(from, tox, template.stopAudio),get(from, tox, template.withChannel));
						if (audio) audio.stop();
						break;
					}
					case "changeAnimation":{
						from.changeAnimation(get(from, tox, template.changeAnimation));
						break;
					}
					default:{
						set(from, tox, {
							_: ["this", a]
						}, get(from, tox, template[a]));
					}
				}
		if (template.object)
			iterateComposedList(from, tox, get(from, tox, template.object), function(item) {
				subfather = item.into === undefined ? father : get(from, tox, item.into);
				applyStencil(subfather.add(item.box, StateManager), from, item);
			});	
		for (var a in SceneGenerators) if (template[a]!==undefined) SceneGenerators[a](template,father,from,tox);
		if (template.execute) execute(from, tox, get(from, tox, template.execute));
		return from;
	}

	// SCENE MANAGER

	function runScene(idscene, data, transition) {
		var elm, firstrun;
		if (!variables) {
			variables = {};
			firstrun = 1;
		}
		gamerunning = 1;
		if (scene) scene.remove();
		if (scenehud) scenehud.remove();
		scene = game.add("layer", StateManager).size(game).setPriority(1000).setZIndex(5).at({
			x: 0,
			y: 0
		});
		game.setGridReference(scene);
		scenehud = game.add("layer").size(game).setZIndex(10);
		camera = {
			reset: 1,
			follow: 0,
			bound: 0,
			currentCamera: 0,
			cameras: 0,
			smoothness: 0.5,
			focusX: Math.floor(game.width / 3),
			focusY: Math.floor(game.height / 3),
			focusWidth: Math.floor(game.width / 3) * 1,
			focusHeight: Math.floor(game.height / 3) * 1,
			x: 0,
			y: 0,
			width: game.width,
			height: game.height
		};
		variables.idScene = idscene;
		variables.randomSeed = (new Date()).getTime();
		game.addSkipFrames(1);
		if (firstrun) {
			hud = game.add("layer").size(game).setZIndex(20);
			if (curtape.execute) execute(scene, scene, curtape.execute);
		}
		applyStencil(scene, scene, data);
		updateHud();
		switch (transition) {
			case -1:{
				scene.setAlpha(0);
				game.undo(Code.Fade).do(Code.Fade, {
					as: scene,
					to: 1,
					wait:2,
					then: function() {
						game.undo(Code.Fade);
					}
				});
				break;
			}
		}
	}

	// BOOTSTRAPPER

	function plugTape(transition, audiochannel, idscene, tape) {
		var channels=[];
		if (!scene) transition = 0;
		switch (transition) { // Fade out/fade in
			case 1:{
				gamerunning = 0;
				iterateComposedList(scene, scene, audiochannel, function(item) {
					var channel=game.getAudioChannel(item);
					if (channel) {
						channels.push([channel,channel.volume]);
						channel.applyEffect({name:"fade",toVolume:0,length:game.getMspf()/100});
					}
				});
				game.undo(Code.Fade).do(Code.Fade,{
					as: scene,
					to: 0,
					then: function() {
						game.undo(Code.Fade);
						for (var i=0;i<channels.length;i++) {
							channels[i][0].stop();
							channels[i][0].applyEffect({name:"setvolume",volume:channels[i][1]})
						}
						plugTape(-1, audiochannel, idscene, curtape);
					}
				});
				break;
			}
			// case 2: // Seamless transition
			case 3:{ // Fake load/unpacking
				gamerunning = 0;
				scene.setAlpha(0);
				scenehud.setAlpha(0);
				iterateComposedList(scene, scene, audiochannel, function(item) {
					var channel=game.getAudioChannel(item);
					if (channel) channel.stop();
				});
				game.undo(Code.Delay).do(Code.Delay,{
					delay: Math.ceil(game.getFps()/2),
					then: function() {
						game.undo(Code.Delay);
						plugTape(-2, audiochannel, idscene, curtape);
					}
				});
				break;
			}
			default:{				
				if (tape) {
					curtape = tape;
					Storage.initialize(tape);
				}
				if (curtape.scenes[idscene]) runScene(idscene, curtape.scenes[idscene], transition);
				else {
					var file = game.getResourcesRoot() + (curtape.hardware.scenes || "scenes") +"/" + idscene + ".json";
					var cache = filecache.has(file);
					if (cache) runScene(idscene, JSON.parse(cache), transition);
					else Supports.getFile(file, function(text) {
						filecache.add(file, text);
						runScene(idscene, JSON.parse(text), transition);
					});
				}
			}
		}
	}

	// GUI CREATION

	function node(parent,type,cn,content) {
		var ret=document.createElement(type);
		if (cn) ret.className=cn;
		if (content) ret.innerHTML=content;
		parent.appendChild(ret);
		return ret;
	}

	// KEYBOARD SETTINGS

	var controlset,controlsmode,usercontrols,settingkey=0;
	function waitKey(e) {
		usercontrols.keyboard[settingkey.id]=e.keyCode;
		settingkey.elm.value=keySymbol(e.keyCode);
		settingkey=0;
		Supports.removeEventListener(document,"keydown",waitKey);
		e.preventDefault();
	}
	function setupKey() {
		var self=this,id=this.getAttribute("_id");
		if (settingkey) {
			settingkey.elm.value=settingkey.value;
			Supports.removeEventListener(document,"keydown",waitKey);
		}
		settingkey={elm:this,value:this.value,id:id};
		this.value="Press a key...";
		Supports.addEventListener(document,"keydown",waitKey);
	}
	function keySymbol(code) { return (KEYSYMBOLS[code]||String.fromCharCode(code))+" ("+code+")"; }
	function getAlternative(alternatives) {  for (var i=0;i<alternatives.length;i++) if ((alternatives[i]!==undefined)&&(!Supports.isNaN(alternatives[i]))&&(alternatives[i]!==null)) return alternatives[i];}

	/*
	 * GAME STARTER
	 */

	if (!mods) mods={};
	if (!mods.gameContainer) return false; // No game container specified
	if (!mods.tapesRoot) mods.tapesRoot="";
	if (!mods.systemRoot) mods.systemRoot="system";

	mods.gameContainer.innerHTML="";
	tv = node(mods.gameContainer,"div");
	tv.style.margin="auto";

	function runGame(mode) {
		if (mods.onRun) mods.onRun();
		var controls={};
		for (var a in controlsset) controls[a]=usercontrols[a];
		tv.innerHTML="";
		game = Box(tv, "game", 0, 0, mode.renderer, hardware.aliasMode||"pixelated");
		game.setGridSize(hardware.gridSize).setControls(controls).setColor("#fff").setBgcolor("#000").size(hardware).setFps(hardware.fps||25).setScale(mode.scale).setOriginX(0).setOriginY(0);
		game.getState("default").do(Code.GameManager);
		if (mode.volume&&gamedata.audioChannels) game.enableAudio(mode.volume/100);
		tv.style.width = (game.width * game.scale) + "px";
		tv.style.height = (game.height * game.scale) + "px";
		game.setResourcesRoot(mods.tapesRoot + gameId + "/");
		game.setSystemRoot(mods.systemRoot);
		for (var k in gamedata.resources) game.addResource(k, gamedata.resources[k]);
		for (var k in gamedata.audioChannels) game.addAudioChannel(k, gamedata.audioChannels[k]);
		if (mode.filter) for (var i=0;i<mode.filter.length;i++) game.addFilter(mode.filter[i]);
		game.loadResources(function() { plugTape(0, 0, "intro", gamedata); });
	}

	/*
	 * INITIALIZATION
	 */

	Supports.getFile(mods.tapesRoot + gameId + "/tape.json?" + Math.random(), function(text) {
		filecache = Box.Cache();
		gamedata = JSON.parse(text);
		if (!gamedata.scenes) gamedata.scenes = { intro: {} };

		// Detect game features
		hardware = getAlternative([
			gamedata.hardware,
			DEFAULTHARDWARE
		]);
		controlsmode=getAlternative([
			hardware.controls,
			"standard"
		]);
		var cheatslist=gamedata.cheats;
		var hasAudio=gamedata.audioChannels;
		var filters=getAlternative([
			hardware.filter instanceof Array?hardware.filter:null,
			typeof hardware.filter == "string"?DOMInator.FILTERS[hardware.filter]:null,
			DOMInator.FILTERS.none
		]);

		// Get controls
		controlsset=DOMInator.CONTROLS[controlsmode];
		usercontrols=getAlternative([
			localStorage["wrightControls_"+controlsmode]?JSON.parse(localStorage["wrightControls_"+controlsmode]):null,
			{}
		]);
		for (var a in controlsset) {
			usercontrols[a]=getAlternative([usercontrols[a],{}]);
			for (var b in controlsset[a]) usercontrols[a][b]=getAlternative([usercontrols[a][b],controlsset[a][b].default]);
		}

		// Get screen settings
		var scale;
		if (!Supports.supportsScaling) scale=1;
		else scale=getAlternative([
			mods.scale,
			localStorage["wrightScale"]*1,
			2
		]);
		var renderer=getAlternative([
			mods.renderer,
			localStorage["wrightRenderer"]*1,
			Supports.isCanvas?1:0
		]);
		var filter=getAlternative([
			mods.filter,
			localStorage["wrightFilter"],
			filters[0].label
		]);
		
		// Get audio settings
		var volume=getAlternative([
			mods.volume,
			(localStorage["wrightVolume"]||100)*1,
			0
		]);

		if (mods.settingsContainer) {
			var sublabels="",havecheats,row,itm;

			node(mods.settingsContainer,"div","section","Settings");
			if (controlsset.keyboard)
				for (var a in controlsset.keyboard)
					if (!controlsset.keyboard[a].isDisabled) {
						row=node(mods.settingsContainer,"div","row");
						node(row,"div","label",controlsset.keyboard[a].label+":");
						itm=node(node(row,"div","value"),"input","input");
						itm.setAttribute("readonly","readonly");
						itm.setAttribute("_id",a);
						itm.value=keySymbol(usercontrols.keyboard[a]);
						Supports.addEventListener(itm,"click",setupKey);
						if (controlsset.keyboard[a].subLabel&&!controlsset.keyboard[a].subLabelDisabled) {
							sublabels+="<li>"+controlsset.keyboard[a].subLabel+"</li>";
							node(mods.settingsContainer,"div","sublabel",controlsset.keyboard[a].subLabel);
						}
					}

			var touchcontrollerCombo;
			if (controlsset.touchcontroller) {
				row=node(mods.settingsContainer,"div","row");
				node(row,"span","label","Touch controls:");
				touchcontrollerCombo=node(node(row,"div","value"),"select","input");
				console.log(controlsset);
				for (var j=0;j<controlsset.touchcontroller.layout.allowed.length;j++) {
					var i=controlsset.touchcontroller.layout.allowed[j];
					itm=node(touchcontrollerCombo,"option",0,DOMInator.TOUCHLAYOUTS[i].label);
					itm.value=i;
					if (usercontrols.touchcontroller.layout==i) itm.setAttribute("selected","selected");
				}				
			}

			var pointerCombo;
			if (controlsset.pointer) {
				row=node(mods.settingsContainer,"div","row");
				node(row,"span","label","Pointer/Gun:");
				pointerCombo=node(node(row,"div","value"),"select","input");
				for (var i=0;i<controlsset.pointer.id.options.length;i++)
					if (!controlsset.pointer.id.options[i].isDisabled) {
						itm=node(pointerCombo,"option",0,controlsset.pointer.id.options[i].label);
						itm.value=controlsset.pointer.id.options[i].id;
						if (usercontrols.pointer.id==controlsset.pointer.id.options[i].id) itm.setAttribute("selected","selected");
					}
			}

			row=node(mods.settingsContainer,"div","row");
			node(row,"span","label","Renderer:");
			var rendererCombo=node(node(row,"div","value"),"select","input");
			for (var i=0;i<DOMInator.RENDERERS.length;i++)
				if (!DOMInator.RENDERERS[i].isDisabled) {
					itm=node(rendererCombo,"option",0,DOMInator.RENDERERS[i].label);
					itm.value=DOMInator.RENDERERS[i].id;
					if (renderer==DOMInator.RENDERERS[i].id) itm.setAttribute("selected","selected");
				}

			row=node(mods.settingsContainer,"div","row");
			node(row,"span","label","Screen filter:");
			var filterCombo=node(node(row,"div","value"),"select","input");
			for (var i=0;i<filters.length;i++) {
				itm=node(filterCombo,"option",0,filters[i].label);
				itm.value=filters[i].label;
				if (filter==filters[i].label) itm.setAttribute("selected","selected");
			}

			row=node(mods.settingsContainer,"div","row");
			node(row,"span","label","Resolution:");
			var resolutionCombo=node(node(row,"div","value"),"select","input"),resolutions=Supports.supportsScaling?7:1;
			for (var i=1;i<resolutions;i++) {
				itm=node(resolutionCombo,"option",0,(hardware.width*i)+"x"+(hardware.height*i)+" (x"+i+")");
				if (i==scale) itm.setAttribute("selected","selected");
			}

			if (hasAudio) {
				row=node(mods.settingsContainer,"div","row");
				node(row,"span","label","Sound:");
				var audioCombo=node(node(row,"div","value"),"select","input");
				node(audioCombo,"option",0,"Disabled");
				if (Supports.isAudio)
					for (var i=10;i<=100;i+=10) {
						itm=node(audioCombo,"option",0,"Volume "+i+"%");
						if (i==volume) itm.setAttribute("selected","selected");
					}
			}

			node(mods.settingsContainer,"div","section","Cheats");
			for (var a in cheatslist) {
				havecheats=true;
				row=node(mods.settingsContainer,"div","row");
				itm=node(row,"input");
				itm.type="checkbox";
				itm.setAttribute("_id",a);
				Supports.addEventListener(itm,"click",function() { cheats[this.getAttribute("_id")]=this.checked;});
				node(row,"span",0,cheatslist[a]);
			}
			if (!havecheats) node(mods.settingsContainer,"div","row","Sorry, no cheats for this game. It's all up to you!");
			
			itm=node(node(mods.settingsContainer,"div","startgamerow"),"button","startgame","Start game");
			Supports.addEventListener(itm,"click",function(){
				var filterset;
				if (pointerCombo) usercontrols.pointer.id=pointerCombo.options[pointerCombo.selectedIndex].value;
				if (touchcontrollerCombo) usercontrols.touchcontroller.layout=touchcontrollerCombo.options[touchcontrollerCombo.selectedIndex].value;
				localStorage["wrightControls_"+controlsmode]=JSON.stringify(usercontrols);
				renderer=localStorage["wrightRenderer"]=rendererCombo.options[rendererCombo.selectedIndex].value*1;
				scale=localStorage["wrightScale"]=resolutionCombo.selectedIndex+1;
				filter=localStorage["wrightFilter"]=filterCombo.options[filterCombo.selectedIndex].value;
				for (var i=0;i<filters.length;i++) if (filters[i].label==filter) filterset=filters[i].filter;
				if (hasAudio) volume=localStorage["wrightVolume"]=audioCombo.selectedIndex*10; else volume=0;
				Supports.removeEventListener(document,"keydown",waitKey);
				mods.settingsContainer.innerHTML=sublabels?"<ul>"+sublabels+"</ul>":"";
				runGame({scale:scale,volume:volume,renderer:renderer,filter:filterset||DOMInator.FILTERS.none[0].filter});
			});
		} else {
			var filterset;
			for (var i=0;i<filters.length;i++)
				if (filters[i].label==filter) filterset=filters[i].filter;
			runGame({scale:scale,volume:hasAudio?volume:0,renderer:renderer,filter:filterset||DOMInator.FILTERS.none[0].filter});
		}
	});

	return {
		destroy:function() {
			Supports.removeEventListener(document,"keydown",waitKey);
			if (game) {
				game.destroy();
				game=0;
			}
			if (tv&&tv.parentNode) {
				tv.parentNode.removeChild(tv);
				tv=0;
			}
		}
	}
}

function runSingleWright(name,mods) {
	if (window._WRIGHT) window._WRIGHT.destroy();
	window._WRIGHT=Wright(name,mods);
}