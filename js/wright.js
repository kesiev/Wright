/*
 * NUMBERS PRECISION
 */

var PREC = 1000000;
var PAD = 10 / PREC;
function FIX(value) { return Math.round(value * PREC) / PREC; }

var Supports = (function(){
	var vendors=["Khtml","ms","O","Moz","Webkit"],div=document.createElement('div');
	var ret={
		css:function(prop){
			var len=vendors.length;
			if (prop in div.style) return prop;
			prop=prop.replace(/^[a-z]/, function(val) { return val.toUpperCase(); });
			while (len--) if (vendors[len]+prop in div.style) return vendors[len]+prop;
		},
		setCss:function(obj,prop,value) { if (prop=this.css(prop)) obj[prop]=value; },
		browser:function(substr){ return navigator.userAgent.toLowerCase().indexOf(substr) > -1; },
		lineHeightFixes:function(font,size){
			if ((font=="spectrum")&&(this.isFirefox)&&(size>10)) return size*0.8;
			return size;
		},
		pointerMode:function() {
			if ('ontouchstart' in document.documentElement) return "touch";
			else return "mouse";
		}
	}
	ret.isFirefox=ret.browser("firefox");
	return ret;
})();

/*
 * GAME LIBRARY
 */

function Box(parent, type, sub, statemanager) {

	var box = {
		// Logic
		uid: 0,
		rects: 0,
		cell: 0,
		cellsignature: 0,
		cleanprops: {},
		displayed: 0,
		coderunning:0,
		onscreen:0,
	    // Code
	    running:1,
		// HTML Node
		node: document.createElement("div"),
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
			this.hitbox = Box.clone(h instanceof Array ? h : [h]);
			this.screen.dirtyRects(this);
			return this;
		},
		// Rectangles
		getRects: function() {
			if (!this.rects) {
				if (this.screen.statsmanager) this.screen.stats.updatedRects[this.uid]=this;
				this.screen.stats.calculatedRects++;
				this.rects=Box.getRects(this);
			}
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

	// INIT - Style
	var a,model=Box._[type] || Box._.basic;
	if (model.set) for (a in model.set) box[a] = model.set[a];
	if (model.css) for (a in model.css) box.node.style[a] = model.css[a];

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
				if (this[k] != v) {
					this[k] = v;
					this.cleanprops[k] = 0;
					this.screen.dirtyRects(this);
				}
				return this;
			};
		})(Box._dirtyrectsprops[i]);
	for (var i = 0; i < Box._casacadedirtyrectsprops.length; i++)
		box["set" + Box.capitalize(Box._casacadedirtyrectsprops[i])] = (function(k) {
			return function(v) {
				if (this[k] != v) {
					this[k] = v;
					this.cleanprops[k] = 0;
					this.screen.dirtyRects(this,1);
				}
				return this;
			};
		})(Box._casacadedirtyrectsprops[i]);
	for (var i = 0; i < Box._translaterectsprops.length; i++)
		box["set" + Box.capitalize(Box._translaterectsprops[i])] = (function(k) {
			return function(v) {
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
	// INIT - Screen vs. object
	if (!sub) {
		// DOM Callbacks
		function onkeydown(e) {
			box.keyDown(e.keyCode);
			e.preventDefault();
		};
		function onkeyup(e) { box.keyUp(e.keyCode); };
		// SCREEN - Stats
		box.stats = {
			updatedRects:{},
			// Process based
			frameProcessStart: 0,
			frameProcessEnd: 0,
			frameProcessTime: 0,
			garbageCount: 0,
			calculatedRects: 0,
			movedCells: 0,
			overload:0,
			cellsCount:0,
			cellsUsage:0,
			listUsage:0,
			iteratedObjects:0,
			load:0,
			// Persistent / Process Based
			elementsCount: 0,
			uidsCount: 1,
			typesCount: 0,
			nodesOnScreen:0,
			runningCount:0,
			// Render based
			frameRenderStart: 0,
			frameRenderEnd: 0,
			frameRenderTime: 0,
			changesCount: 0,
			objectChangedCount: 0,
			objectWastedCount:0
		};
		box.node.innerHTML="<div style=\"font-size:12px;font-family:sans-serif;position:absolute;right:10px;bottom:10px;text-align:center;color:#ccc\">Loading...</div>";
		box.statsmanager = 0;
		box.aliasmode="pixelated";
		// ALIAS
		box.setAliasMode=function(mode) { this.aliasmode=mode; }
		// AUDIO
		box.enableAudio=function(volume) {
			if (!this.audio) {
				window.AudioContext=window.AudioContext||window.webkitAudioContext;
				if (window.AudioContext) {
					this.audio={
						context: new AudioContext(),
						channels:{},
						defaults:{}
					};
					this.audio.gainNode=this.audio.context.createGain();
					this.audio.gainNode.connect(this.audio.context.destination);
					this.audio.gainNode.gain.value=volume;
				}
			}
		};
		box.addAudioChannel=function(name,data) {
			if (this.audio) {
				var channel=this.audio.channels[name]={
					gainNode:this.audio.context.createGain(),
					looping:data.looping,
					playing:{},
					volume:data.volume===undefined?1:data.volume,
					applyEffect:function(effect) { Box.applyEffect(box,this,effect); },
					stop:function() {
						for (var a in this.playing) if (this.playing[a]) this.playing[a].stop();
						this.applyEffect({name:"setvolume"});
					},
					destroy:function() {
						this.stop();
						this.gainNode.disconnect();
					}
				};
				channel.gainNode.connect(this.audio.gainNode);
				channel.gainNode.gain.value=channel.volume;
				if (data.samples)
					for (var i=0;i<data.samples.length;i++)
						this.audio.defaults[data.samples[i]]=name;
			}
		}
		box.getAudioChannel=function(channel) {
			if (this.audio) return this.audio.channels[channel];
			else return 0;
		};
		box.getAudio=function(name,channel) {
			if (this.audio&&this.resources.items[name]) {
				if (channel===undefined) channel=this.audio.defaults[name];
				var ch=this.audio.channels[channel];
				if (ch) return ch.playing[name];
			} else return 0;
		};
		box.playAudio=function(name,channel,looping,effect) {
			if (this.audio&&this.resources.items[name]) {
				if (channel===undefined) channel=this.audio.defaults[name];
				var ch=this.audio.channels[channel];
				if (ch) {
					var audio=this.getAudio(name,channel);
					if (audio) audio.stop();
					audio=ch.playing[name]={
						source:this.audio.context.createBufferSource(),
						gainNode:this.audio.context.createGain(),
						initTime:this.audio.context.currentTime,
						channel:ch,
						volume:1,
						looping:looping||((looping===undefined)&&ch.looping),
						stop:function() {
							audio.source.stop(0);
							audio.gainNode.disconnect();
							audio.source.disconnect();
							audio.channel.playing[name]=0;
						},
						applyEffect:function(effect) { Box.applyEffect(box,this,effect); },
						getter:function(attr){
							switch (attr) {
								case "position":{
									var pos=(box.audio.context.currentTime-this.initTime)*this.source.playbackRate.value;
									return !this.looping&&(pos>this.source.buffer.duration)?this.source.buffer.duration:pos;
								}
								case "length":{
									return this.source.buffer.duration;
								}
								case "times":{
									var times=((box.audio.context.currentTime-this.initTime)*this.source.playbackRate.value)/this.source.buffer.duration;
									return !this.looping&&(times>1)?1:times;
								}
							}
						}
					}
					audio.source.buffer=this.resources.items[name];
					if (audio.looping) audio.source.loop=true;
					audio.source.connect(audio.gainNode);
					audio.gainNode.connect(ch.gainNode);
					audio.gainNode.gain.value=audio.volume;
					if (effect) audio.applyEffect(effect);
					audio.source.start(0);
				}
			}
		};
		// STATES
		box.setStatsManager = function(obj) {
			this.statsmanager = obj;
			obj.initialize(this);
			return this;
		};
		// RECTANGLES
		box.dirtyRects=function(obj,casacade) {
			if (!obj.removed) {
				obj.rects=0;
				this.dirtygrid[obj.uid] = 1;
				this.scheduleObjectChange(obj);
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
				var onscreen=obj.onscreen;
				if (obj===this.gridreference) {
					if (obj.screen.rects) {
						obj.screen.rects.rect[k]=FIX(obj.screen.rects.rect[k]-v);
						obj.screen.rects.screen[k]=FIX(obj.screen.rects.screen[k]-v);
						obj.screen.rects.outer[k]=FIX(obj.screen.rects.outer[k]-v);
					}
					onscreen=this.isOnScreen(obj);
					if (onscreen||obj.onscreen)  this.scheduleObjectChange(obj,1);
					// Recalculate all translations except into gridreference.
					// - Cancel previous translation - skip them is unconvenient.
					// - Outer rectangles don't need redraw since are still at their place.
					this.recalculateRects(this,obj);
				} else {
					this.dirtygrid[obj.uid] = 1;
					if (obj.rects) {
						obj.rects.rect[k]=FIX(obj.rects.rect[k]+v);
						obj.rects.screen[k]=FIX(obj.rects.screen[k]+v);
						obj.rects.outer[k]=FIX(obj.rects.outer[k]+v);
						onscreen=this.isOnScreen(obj);
					} else onscreen=1; // Since we don't know if the next position will be onscreen we will check this later
					if (onscreen||obj.onscreen) this.scheduleObjectChange(obj);
					for (var i = 0; i < obj.childs.length; i++) this.translateRects(obj.childs[i],k,v);
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
		// SCREEN - Initialization
		box.resources = {
			callback: 0,
			current: 0,
			loader: [],
			root: "",
			items: {}
		};
		// SCREEN - UID generator
		box.uids = { 0: box };
		box.newUID = function(obj) {
			var uid;
			do {
				uid = Math.floor(Math.random() * 100000000);
			} while (box.uids[uid]);
			this.stats.uidsCount++;
			obj.uid = uid;
			box.uids[uid] = obj;
			return uid;
		};
		box.releaseUID = function(uid) {
			this.stats.uidsCount--;
			delete this.uids[uid];
		};
		// SCREEN - Keyboard
		box.key = {};
		box.hwkeys = [];
		box.node.tabIndex = 1;
		setTimeout(function() { box.node.focus(); }, 1000);
		Box.on("keydown",box.node,onkeydown);
		Box.on("keyup",box.node,onkeyup);
		box.keyDown = function(key) {
			this.hwkeys[key]=1;
		};
		box.keyUp = function(key) {
			if (this.hwkeys[key]==1) this.hwkeys[key]=2; else this.hwkeys[key]=0;
		};
		box.setKeys = function(keys) {
			this.keys = keys;
			return this;
		};
		box.setGridSize = function(size) {
			if (size) this.gridsize=size;
			return this;
		};
		box.updateKeys = function() {
			var key;
			for (var a in this.keys) {
				key=this.hwkeys[this.keys[a]];
				if (key>0) {
					if (this.key[a]) this.key[a] ++;
					else this.key[a] = 1;
					this.hwkeys[this.keys[a]]=(key==2?0:3);
				}
				else if (this.key[a] > 0) this.key[a] = -1;
				else if (this.key[a]) this.key[a] ++;
				else this.key[a] = 0;
			}
		};
		// SCREEN - Pointer
		box.positionInPage=0;
		box.pointer = {x:0,y:0,width:1,height:1};
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
			if (!box.positionInPage) box.positionInPage=getPositionInPage(box.node);
			if (e.changedTouches.length==1) {
				var touch=e.changedTouches[0];
				posx = touch.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
				posy = touch.clientY + document.body.scrollTop + document.documentElement.scrollTop;
				box.keyDown(-1);
				box.pointer.x=Math.floor((posx-box.positionInPage.x)/box.scale);
				box.pointer.y=Math.floor((posy-box.positionInPage.y)/box.scale);
				e.preventDefault();
			}
		}
		box.enablePointer = function (mode) {
			this.keys.keyPointer=-1;
			box.getPositionInPage=1;
			box.node.style.cursor="none";
			switch (mode) {
				case "mouse":{
					Box.on("mousemove",box.node,function(e){
						if (!box.positionInPage) box.positionInPage=getPositionInPage(box.node);
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
						box.pointer.x=Math.floor((posx-box.positionInPage.x)/box.scale);
						box.pointer.y=Math.floor((posy-box.positionInPage.y)/box.scale);
					});
					Box.on("mousedown",box.node,function(e){
						box.keyDown(-1);
						e.preventDefault();
					});
					Box.on("mouseup",box.node,function(e){
						box.keyUp(-1);
						e.preventDefault();
					});
					break;
				}
				case "touch":{
					Box.on("touchstart",box.node,touchHandler);
					Box.on("touchmove",box.node,touchHandler);
					Box.on("touchend",box.node,function(e){ box.keyUp(-1); });
					break;
				}
			}
		}
		// SCREEN - Garbage management
		box.garbage = { objects: [] };
		box.addObject = function(tox, type, statemanager) {
			this.stats.elementsCount++;
			var obj = Box(tox, type, 1, statemanager);
			return obj;
		};
		box.removeObject = function(obj, skipchilds) {
			if (!obj.removed) {
				this.stats.elementsCount--;
				obj.removed = 1;
				for (var a in obj.type) this.types[a].length--;
				if (!skipchilds)
					for (var i = 0; i < obj.childs.length; i++) this.removeObject(obj.childs[i]);
				this.updateNeedRunning(obj);
				this.garbage.objects.push(obj);
				if (obj.node.parentNode) this.scheduleObjectChange(obj); // Removal is casacaded by browser :)
				else  this.unscheduleObjectChange(obj);
			}
		};
		box.destroy = function() {
			this.resources = 0;
			for (var i in this.uids) this.removeObject(this.uids[i], 1);
			this.clean();
			if (this.node.parentNode) this.node.parentNode.removeChild(this.node);
			if (this.timeout) clearTimeout(this.timeout);
			if (this.audio) for (var a in this.audio.channels) this.audio.channels[a].destroy();
			this.timeout=-1;
		};
		box.clean = function() {
			var obj;
			for (var i = 0; i < this.garbage.objects.length; i++) {
				this.stats.garbageCount++;
				obj = this.garbage.objects[i];
				for (var a in obj.type) this.removeObjectType(obj, a, 1);
				this.removeCell(obj);
				this.releaseUID(obj.uid);
				delete obj.childs;
			}
			this.garbage.objects.length=0;
		};
		// SCREEN - Render management
		box.changes = {};
		box.scheduleObjectChange = function(obj,recursive) {
			if (this.isOnScreen(obj)||obj.onscreen) this.changes[obj.uid] = obj;
			if (recursive)
				for (var i=0;i<obj.childs.length;i++)
					if (!obj.childs[i].removed) this.scheduleObjectChange(obj.childs[i],1);
		};
		box.unscheduleObjectChange = function(obj) { delete this.changes[obj.uid]; };
		box.isOnScreen=function(obj){
			if (obj.unoptimize) return true;
			var rect=obj.getRects().screen;
			return !((rect.x+this.gridcoords.x>=this.width)||((rect.x+this.gridcoords.x+rect.width)<1)||(rect.y+this.gridcoords.y>=this.height)||((rect.y+this.gridcoords.y+rect.height)<1));
		};
		box.applyChanges = function() {
			var obj, displayed, pad, node, w, h,rect,onscreen=0,oc;
			this.stats.objectChangedCount = 0;
			this.stats.objectWastedCount=0;
			this.stats.changesCount=0;
			this.stats.frameRenderStart = Box.getTimestamp();
			for (var a in this.changes) {
				oc=this.stats.changesCount;
				obj = this.changes[a];
				delete this.changes[a];
				if (obj.removed) {
					if (obj.node) {
						if (obj.node.parentNode) {
							this.stats.nodesOnScreen--;
							this.stats.changesCount++;
							obj.node.parentNode.removeChild(obj.node);
						}
						delete obj.node;
					}
				} else {
					pad = obj.border ? 2 : 0;
					node = obj.node;
					w = obj.width - pad;
					h = obj.height - pad;
					if (w < 0) w = 0;
					if (h < 0) h = 0;
					onscreen=this.isOnScreen(obj);
					displayed = obj.visible && w && h;
					if (!obj.displayed&&displayed) {
						node.style.display = "block";
						this.stats.changesCount++;
					}
					if (obj.displayed&&!displayed) {
						node.style.display = "none";
						this.stats.changesCount++;
					}
					if (!obj.cleanprops.tileX || !obj.cleanprops.tileY || !obj.cleanprops.frame ||
						!obj.cleanprops.width) {
						node.style.backgroundPosition = (-obj.tileX - (obj.frame * obj.width)) + "px " + (-obj.tileY) + "px";
						obj.cleanprops.tileX = obj.cleanprops.tileY = obj.cleanprops.frame = 1;
						this.stats.changesCount++;
					}
					if (!obj.cleanprops.width || !obj.cleanprops.border) {
						node.style.width = w + "px";
						obj.cleanprops.width = 1;
						this.stats.changesCount++;
					}
					if (!obj.cleanprops.height || !obj.cleanprops.border) {
						node.style.height = h + "px";
						obj.cleanprops.height = 1;
						this.stats.changesCount++;
					}
					if (!obj.cleanprops.color) {
						node.style.color = obj.color;
						obj.cleanprops.color = 1;
						this.stats.changesCount++;
					}
					if (!obj.cleanprops.bgcolor) {
						node.style.backgroundColor = obj.bgcolor;
						obj.cleanprops.bgcolor = 1;
						this.stats.changesCount++;
					}
					if (!obj.cleanprops.border) {
						node.style.border = obj.border ? "1px solid " + obj.border : "";
						obj.cleanprops.border = 1;
						this.stats.changesCount++;
					}
					if (!obj.cleanprops.zIndex) {
						node.style.zIndex = obj.zIndex;
						obj.cleanprops.zIndex = 1;
						this.stats.changesCount++;
					}
					if (!obj.cleanprops.textAlign) {
						node.style.textAlign = obj.textAlign;
						obj.cleanprops.textAlign = 1;
						this.stats.changesCount++;
					}
					Box._translator(this,node,obj);
					if (!obj.cleanprops.alpha) {
						node.style.opacity = obj.alpha;
						obj.cleanprops.alpha = 1;
						this.stats.changesCount++;
					}
					if (!obj.cleanprops.font) {
						node.style.fontFamily = obj.font;
						obj.cleanprops.font = 1;
						this.stats.changesCount++;
					}
					if (!obj.cleanprops.lineHeight) {
						node.style.lineHeight = Supports.lineHeightFixes(obj.font,obj.lineHeight) + "px";
						obj.cleanprops.lineHeight = 1;
						this.stats.changesCount++;
					}
					if (!obj.cleanprops.fontSize) {
						node.style.fontSize = obj.fontSize + "px";
						obj.cleanprops.fontSize = 1;
						this.stats.changesCount++;
					}
					if (!obj.cleanprops.outline) {
						if (obj.outline) node.style.textShadow = "0px 1px 0 " + obj.outline +
							", 1px 0px 0 " + obj.outline + ", -1px 0px 0 " + obj.outline +
							", 0px -1px 0 " + obj.outline;
						obj.cleanprops.outline = 1;
						this.stats.changesCount++;
					}
					if (!obj.cleanprops.image) {
						if (obj.image) node.style.backgroundImage = "url('" + this.resources.items[obj.image] + "')";
						else node.style.backgroundImage="";
						obj.cleanprops.image = 1;
						this.stats.changesCount++;
					}
					if (!obj.cleanprops.html) {
						if (obj.html !== undefined) node.innerHTML = obj.html;
						obj.cleanprops.html = 1;
						this.stats.changesCount++;
					}
					obj.displayed = displayed;
					if (!node.parentNode) {
						this.stats.changesCount++;
						this.stats.nodesOnScreen++;
						obj.parent.node.appendChild(node);
					}
					if (onscreen&&!obj.node.parentNode) {
						this.stats.changesCount++;
						this.stats.nodesOnScreen--;
						obj.parent.node.appendChild(obj.node);
					} else if (!onscreen&&obj.node.parentNode) {
						this.stats.changesCount++;
						this.stats.nodesOnScreen--;
						obj.parent.node.removeChild(obj.node);
					}
				}
				obj.onscreen=onscreen;
				if (oc!=this.stats.changesCount) this.stats.objectChangedCount++;
				else this.stats.objectWastedCount++;
			}
			this.stats.frameRenderEnd = Box.getTimestamp();
			this.stats.frameRenderTime =this.stats.frameRenderEnd - this.stats.frameRenderStart;
			if (this.statsmanager && this.statsmanager.onApplyChanges) this.statsmanager.onApplyChanges(this);
		};
		// SCREEN - Type manager
		box.types = {};
		box.addObjectType = function(obj, type) {
			if (type instanceof Array)
				for (var i = 0; i < type.length; i++) this.addObjectType(obj, type[i]);
			else if (!obj.type[type]) {
				this.dirtygrid[obj.uid] = 1;
				if (!this.types[type]) {
					this.stats.typesCount++;
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
				if (!this.types[type].items.length) {
					this.stats.typesCount--;
					delete this.types[type];
				} else if (!skipcount) this.types[type].length--;
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
		box.gridsize = {
			width: 128,
			height: 128
		};
		box.dirtygrid = {};
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
			else
				for (var a in obj.type)
					for (var x = cx1; x < cx2; x++)
						for (var y = cy1; y < cy2; y++)
							cells.push(x + "," + y+"-"+a);
			return cells;
		};
		box.removeCell = function(obj) {
				if (obj.cell) {
					for (var i = 0; i < obj.cell.length; i++) {
						delete this.grid[obj.cell[i]].items[obj.uid];
						this.grid[obj.cell[i]].length--;
						if (!this.grid[obj.cell[i]].length) {
							this.stats.cellsCount--;
							delete this.grid[obj.cell[i]];
						}
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
					this.stats.movedCells++;
					if (obj.cell) this.removeCell(obj);
					for (var i = 0; i < cell.length; i++) {
						if (!this.grid[cell[i]]) {
							this.stats.cellsCount++;
							this.grid[cell[i]] = {items:{},length:0};
						}
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
				this.stats.listUsage++;
				for (var x=0;x<b.length;x++) {
					this.stats.iteratedObjects++;
					if (!b[x].removed&&(a!==b[x])&&(col=Box.isColliding(a,b[x],getcollision,dx,dy,ignorehitbox)))
						if (ret=cb(col,a,b[x],extra)) return ret;
				}
			} else if (b.typeId) {
				this.stats.cellsUsage++;
				this.updateGrid();
				var cur,itm, cells = this.getCells(a,dx,dy,b.typeId), done = {};
				for (var c = 0; c < cells.length; c++)
					if (cur = this.grid[cells[c]])
						for (var o in cur.items) {
							this.stats.iteratedObjects++;
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
		// SCREEN - Destroying/Abort
		box.abort = function() { this.timeout = -1; };
		// SCREEN - Resources loader
		box.resources = {
			callback: 0,
			current: 0,
			loader: [],
			root: "",
			items: {}
		};
		box.setResourcesRoot = function(path) { this.resources.root = path; };
		box.addResource = function(name, data) { this.resources.loader.push([name, data]); };
		box.loadNextResource = function() {
			if (box.resources)
				if (box.resources.loader.length) {
					box.resources.current = box.resources.loader.splice(0, 1)[0];
					var file = box.resources.root + box.resources.current[1];
					var ext = file.substr(file.lastIndexOf(".") + 1).toLowerCase();
					switch (ext) {
						case "font":{
							// Coming soon :)
							box.loadNextResource();
							break;
						}
						case "png":{
							var cache = document.createElement("img");
							cache.style.visibility = "hidden";
							cache.style.position = "absolute";
							cache.src = file;
							cache.onload = function() {
								box.node.removeChild(cache);
								box.resources.items[box.resources.current[0]] = file;
								if (box.resources) setTimeout(box.loadNextResource, 100);
							};
							box.node.appendChild(cache);
							break;
						}
						case "json":{
							Box.getFile(file,function(text){
								box.resources.items[box.resources.current[0]] = JSON.parse(text);
								box.loadNextResource();
							});
							break;
						}
						case "ogg":
						case "mp3":{
							if (box.audio) {
							  var request = new XMLHttpRequest();
							  request.open('GET', file, true);
							  request.responseType = 'arraybuffer';
							  request.onload = function() {
							    box.audio.context.decodeAudioData(request.response, function(buffer) {
							      box.resources.items[box.resources.current[0]] = buffer;
							      box.loadNextResource();
							    }, function(e){
							    	console.warn("Audio error with "+file,e);
							    });
							  }
							  request.send();
							} else box.loadNextResource();
						  break;
						}
					}
				} else {
					box.node.innerHTML="";
					box.resources.callback();
					box.resources.callback = 0;
				}
		};
		box.loadResources = function(cb) {
			box.resources.callback = cb;
			box.loadNextResource();
		};
		// SCREEN - Code execution
		box.needrunning=[];
		box.updateNeedRunning=function(obj){
			var needrunning=!obj.removed&&obj.uid&&(obj.animations[obj.animation]||obj.states[obj.state]||obj.states[obj.nextState]);
			if (!obj.coderunning&&needrunning) {
				this.stats.runningCount++;
				this.needrunning.push(obj);
			} else if (obj.coderunning&&!needrunning) {
				this.stats.runningCount--;
				this.needrunning[this.needrunning.indexOf(obj)]=0;
			}
			obj.coderunning=needrunning;
		};
		box.runCode = function(obj) {
			var i, statedata, state = obj.state;
			if (obj.nextState != state) {
				obj.state = obj.nextState;
				statedata = obj.getState();
				for (i = 0; i < statedata.code.length; i++) statedata.code[i][2][1] = {};
				if (obj.stateManager) obj.stateManager.change(obj, state, obj.state,statedata);
			} else statedata = obj.getState();
			if (!obj.removed && obj.running && statedata.code)
				for (i = 0; i < statedata.code.length; i++)
					if (statedata.code[i][0] && statedata.code[i][1]) statedata.code[i][1].apply( obj, statedata.code[i][2]);
			for (i = 0; i < statedata.code.length; i++) if (!statedata.code[i][0]) statedata.code.splice(i--, 1);
			var animation = obj.animations[obj.animation];
			if (typeof animation == "string") animation = obj.animations[animation];
			if (animation && obj.animationplay)
				if (obj.animationcount) obj.animationcount--;
				else {
					var
						animationframes = animation.frames instanceof Array ? animation.frames :
						0,
						animationframescount = animation.frames instanceof Array ?
						animationframes.length : animation.frames;
					if (obj.animationframe + 1 >= (animationframescount || 1))
						if (animation.loopTo !== undefined) obj.animationframe = animation.loopTo < 0 ? animationframescount - 1 + animation.loopTo : animation.loopTo;
						else obj.animationplay = 0;
					else obj.animationframe++;
					obj.setFrame((animation.frame || 0) + (animationframes ? animationframes[obj.animationframe] : obj.animationframe));
					obj.animationcount = animation.speed === undefined ? 4 : animation.speed;
				}
		};
		// SCREEN - Frames manager
		box.skipFrames = 0;
		box.timeout = 0;
		box.fps = 0;
		box.mspf = 0;
		box.frameTimestamp = 0;
		box.framedone=1;
		box.setFps = function(fps) {
			box.fps = fps;
			box.mspf = 1000 / fps;
			return this;
		};
		box.setFps(25);
		box.doApplyChanges = function() {
			box.applyChanges();
			box.framedone=1;
		};
		box.doProcessFrame = function() { box.processFrame(); };
		box.scheduleFrame = function() {
			clearTimeout(this.timeout);
			var wait = this.mspf - Box.getTimestamp() + this.frameTimestamp;
			if (wait<=0) {
				this.stats.overload=-wait;
				this.stats.load=1;
				wait=1;
			} else {
				this.stats.overload=0;
				this.stats.load=1-(wait/this.mspf);
			}
			if (wait) this.timeout = setTimeout(box.doProcessFrame, wait);
			else this.processFrame();
		};
		box.processFrame = function() {
			if (!this.removed) {
				if (this.getPositionInPage) {
					this.getPositionInPage++;
					if (this.getPositionInPage>box.fps) {
						this.positionInPage=0;
						this.getPositionInPage=1;
					}
				}
				this.stats.garbageCount = 0;
				this.stats.calculatedRects = 0;
				this.stats.movedCells = 0;
				this.stats.cellsUsage=0;
				this.stats.listUsage=0;
				this.stats.iteratedObjects=0;
				if (this.statsmanager) this.stats.updatedRects={};
				this.frameTimestamp = this.stats.frameProcessStart = Box.getTimestamp();
				if (!this.resources.loader.length) {
					this.runCode(this);
					this.needrunning.sort(this.sortPriority);
					for (i = 0; i < this.needrunning.length; i++)
						if (this.needrunning[i]) this.runCode(this.needrunning[i]);
						else {
							this.needrunning.splice(i,1);
							i--;
						}
					this.clean();
					this.updateKeys();
					if (this.framedone) {
						this.framedone=0;
						if (window.requestAnimationFrame) window.requestAnimationFrame(this.doApplyChanges);
						else setTimeout(this.doApplyChanges,box.mspf/2);
					}
					if (this.skipFrames) {
						this.skipFrames--;
						this.processFrame();
					} else if (this.timeout != -1) this.scheduleFrame();
				} else if (this.timeout != -1) this.scheduleFrame();
				this.stats.frameProcessEnd = Box.getTimestamp();
				this.stats.frameProcessTime = this.stats.frameProcessEnd - this.stats.frameProcessStart;
				if (this.statsmanager && this.statsmanager.onProcessFrame) this.statsmanager.onProcessFrame(this);
			}
		};
		// SCREEN - Finalize
		box.screen = box;
		box.parent = 0;
		parent.appendChild(box.node);
		box.processFrame();
	} else {
		for (a in Box._[parent.screen.aliasmode].css) box.node.style[a] = Box._[parent.screen.aliasmode].css[a];
		// BOX - Finalize
		box.screen = parent.screen;
		box.parent = parent;
		parent.childs.push(box);
		box.screen.newUID(box);
		if (parent.removed) box.remove();
		else box.screen.scheduleObjectChange(box);
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
	background: {
		css: {
			display: "none",
			position: "absolute",
			overflow: "hidden"
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

Box._transform=Supports.css("transform");
Box._transformOrigin=Supports.css("transformOrigin");

if (Box._transform&&Box._transformOrigin) {
	Box.supportsScaling=1;
	Box._translator=function(self,node,obj) {
		if (!obj.cleanprops.x || !obj.cleanprops.y || !obj.cleanprops.z || !obj.cleanprops.scale  || !obj.cleanprops.flipX || !obj.cleanprops.flipY || !obj.cleanprops.angle) {
			node.style[Box._transform] =
				"translate("+Math.floor(obj.x) + "px," + Math.floor(obj.y + obj.z) +
				"px"+") scale(" + (obj.flipX ? -obj.scale : obj.scale) + "," + (obj.flipY ?
					-obj.scale : obj.scale) + ") rotate(" + obj.angle + "deg)";
			obj.cleanprops.x = obj.cleanprops.y = obj.cleanprops.z = obj.cleanprops.flipX = obj.cleanprops.flipY = obj.cleanprops.angle = 1;
			self.stats.changesCount++;
		}
		if (!obj.cleanprops.originX || !obj.cleanprops.originY) {
			node.style[Box._transformOrigin] = obj.originX + " " + obj.originY;
			obj.cleanprops.originX = obj.cleanprops.originY = 1;
			self.stats.changesCount++;
		}
	}
} else {
	Box.supportsScaling=0;
	Box._translator=function(self,node,obj) {
		if (!obj.cleanprops.x || !obj.cleanprops.y || !obj.cleanprops.z || !obj.cleanprops.scale  || !obj.cleanprops.flipX || !obj.cleanprops.flipY || !obj.cleanprops.angle) {
			node.style.left = obj.x+"px";
			node.style.top = obj.y+"px";
			obj.cleanprops.x = obj.cleanprops.y = obj.cleanprops.z = obj.cleanprops.flipX = obj.cleanprops.flipY = obj.cleanprops.angle = 1;
			self.stats.changesCount++;
		}
		if (!obj.cleanprops.originX || !obj.cleanprops.originY) {
			obj.cleanprops.originX = obj.cleanprops.originY = 1;
			self.stats.changesCount++;
		}
	}
}

if (Supports.isFirefox) {
    Box._.pixelated.css.imageRendering="-moz-crisp-edges";
    Box._.pixelated.css.MozOsxFontSmoothing="grayscale";
} else {
	Supports.setCss(Box._.pixelated.css,"imageRendering","pixelated");
	Supports.setCss(Box._.pixelated.css,"fontSmoothing","none");
}

// DOM events
Box.on=function(evt,elm,cb) {
	if (elm.addEventListener) elm.addEventListener(evt, cb, false);
	else elm.attachEvent("on" + evt, cb);
}
Box.off=function(evt,elm,cb) {
	if (elm.addEventListener) elm.removeEventListener(evt, cb, false);
	else elm.detachEvent("on" + evt, cb);
}
// AUDIO
Box.applyEffect=function(box,node,effect) {
	var currTime = box.audio.context.currentTime+0.0001;
	switch (effect.name) {
		case "fade":{
			node.gainNode.gain.linearRampToValueAtTime(effect.fromVolume===undefined?node.gainNode.gain.value:effect.fromVolume, currTime);
			node.gainNode.gain.linearRampToValueAtTime(effect.toVolume===undefined?node.volume:effect.toVolume, currTime + (effect.length===undefined?1:effect.length));
			break;
		}
		case "setvolume":{
			node.gainNode.gain.setValueAtTime(effect.volume===undefined?node.volume:effect.volume, currTime);
			break;
		}
	}
}
// UTILS
Box.getTimestamp = function() { return (new Date()).getTime(); };
Box.sortPriority = function(a, b) { return !a && !b ? 0 : !a ? 1: !b ? -1 : a.priority - b.priority ? a.priority < b.priority ? -1 : 1 : 0; };
Box.limit = function(val, min, max) {
	if (val < min) return min;
	else if (val > max) return max;
	else return val;
};
Box.capitalize = function(str) { return str.substr(0, 1).toUpperCase() + str.substr(1); };
Box.clone = function(obj) { return typeof obj == "object" ? JSON.parse(JSON.stringify(obj)) : obj; };
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
	//if (this.screen.statsmanager) this.screen.stats.updatedRects[this.uid]=this;
	//this.screen.stats.calculatedRects++;
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
Box.getFile = function(file, cb) {
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
 * GAME ENGINE
 */

function Wright(gameId,container,mods) {

	function seededRandom() {
	    variables.randomSeed = (variables.randomSeed * 9301 + 49297) % 233280;
	    return variables.randomSeed / 233280;
	}

	var ANGLETOLLERANCE=45;
	var CONTROLS={
		standard:{
			keyUp: {label:"Up",keyCode:38},
			keyDown: {label:"Down",keyCode:40},
			keyLeft: {label:"Left",keyCode:37},
			keyRight: {label:"Right",keyCode:39},
			keyA: {label:"A/Start",keyCode:90},
			keyB: {label:"B/Option",keyCode:88}
		}
	};
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
				if (ox != this.x) {
					this.screen.dirtygrid[this.uid] = 1;
					this.cleanprops.x = 0;
					if (!this.removed) this.screen.scheduleObjectChange(this);
				}
				if (oy != this.y) {
					this.screen.dirtygrid[this.uid] = 1;
					this.cleanprops.y = 0;
					if (!this.removed) this.screen.scheduleObjectChange(this);
				}
				if (oz != this.z) {
					this.rects=0;
					this.screen.dirtygrid[this.uid] = 1;
					this.cleanprops.z = 0;
					if (!this.removed) this.screen.scheduleObjectChange(this);
				}
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
				return ret?JSON.parse(ret):undefined;
			}
		}
	};

	// HUD

	function hudget(from,tox,str) {
		if ((typeof str == "string") && (str.indexOf(".") != -1)) return get(from,tox, {"_": str.split(".")});
		else return str;
	}

	function fillPlaceholders(from,tox,text) {
		var j, ret, sub, elm, val, sym, sym2, total, len;
		return text.replace(LABELEXP, function(match, slice) {
			if (slice) {
				sub = slice.split("|");
				val = get(from, tox, {"_": sub[1].split(".")});
				switch (sub[0]) {
					case "text":{ return val || ""; }
					case "number": {
						sym = ((val * 1) || sub[2] || 0)+"";
						sym2 = hudget(from,tox,sub[3]) * 1;
						if (sym2) while (sym.length<sym2) sym="0"+sym;
						return sym;
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
						if (curtape.stencils[p]) ret = Box.clone(curtape.stencils[p]);
						else {
							console.warn("Stencil ["+p+"] not found.");
							ret=0;
						}
						break;
					}
					case "resource":{
						p=get(from, tox, struct[++id]);
						if (game.resources.items[p]) ret = Box.clone(game.resources.items[p]);
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
					case "new":{ ret = Box.clone(get(from, tox, struct[++id])); break; }
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
						if (ret < a1) value = a1;
						if (ret > a2) value = a2;
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
										if (game.statsmanager&&p.__debugcollides) game.statsmanager._complexCollision.push(rect);
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
								item.x = FIX(item.x + col.x - col.rx);
								item.y = FIX(item.y + col.y - col.ry);
								if (item.screen) {
									item.screen.translateRect(item,"x",col.x-col.rx);
									item.screen.translateRect(item,"y",col.y-col.ry);
									item.screen.dirtygrid[item.uid] = 1;
									item.cleanprops.x = 0;
									item.cleanprops.y = 0;
									item.screen.scheduleObjectChange(item);
								}
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
		var cam=Box.clone(area);
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
					case "box":{ break; }
					case "log":{ printLog(from,tox,template.log); break; }
					case "object":{
						iterateComposedList(from, tox, get(from, tox, template.object), function(item) {
							subfather = item.into === undefined ? father : get(from, tox, item.into);
							applyStencil(subfather.add(item.box, StateManager), from, item);
						});
						break;
					}
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
							hb.push(Box.clone(item));
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
		game.skipFrames = 1;
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
		if (!scene) transition = 0;
		switch (transition) { // Fade out/fade in
			case 1:{
				gamerunning = 0;
				iterateComposedList(scene, scene, audiochannel, function(item) {
					var channel=game.getAudioChannel(item);
					if (channel) channel.applyEffect({name:"fade",toVolume:0,length:game.mspf/100});
				});
				game.undo(Code.Fade).do(Code.Fade,{
					as: scene,
					to: 0,
					then: function() {
						game.undo(Code.Fade);
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
					delay: Math.ceil(game.fps/2),
					then: function() {
						game.undo(Code.Delay);
						plugTape(-2, audiochannel, idscene, curtape);
					}
				});
				break;
			}
			default:{
				iterateComposedList(scene, scene, audiochannel, function(item) {
					var channel=game.getAudioChannel(item);
					if (channel) channel.stop();
				});
				if (tape) {
					curtape = tape;
					Storage.initialize(tape);
				}
				if (curtape.scenes[idscene]) runScene(idscene, curtape.scenes[idscene], transition);
				else {
					var file = game.resources.root + (curtape.hardware.scenes || "scenes") +"/" + idscene + ".json";
					var cache = filecache.has(file);
					if (cache) runScene(idscene, JSON.parse(cache), transition);
					else Box.getFile(file, function(text) {
						filecache.add(file, text);
						runScene(idscene, JSON.parse(text), transition);
					});
				}
			}
		}
	}

	// GAME ENGINE STATS (Not used ATM)

	var Monitor={
		_complexCollision:[],
		initialize:function(ob){
			if(!this.initialized && window.SmoothieChart) {
				this.initialized=1;
				var smc=document.createElement("canvas");
				smc.width=400;
				smc.height=100;
				document.getElementById("debugdock").appendChild(smc);
				this.smoothie = new SmoothieChart();
				this.smoothie.streamTo(smc);
				this.smoothieline = new TimeSeries();
				this.smoothie.addTimeSeries(this.smoothieline);
			}
			if (this.canvas) this.canvas.parentNode.removeChild(this.canvas);
			this._complexCollision=[];
			this.canvas=document.createElement("canvas");
			this.canvas.style.zIndex=10000;
			this.canvas.style.position="absolute";
			this.canvas.style.left=0;
			this.canvas.style.top=0;
			this.ctx=this.canvas.getContext("2d");
			ob.node.appendChild(this.canvas);
		},
		debugRect:function(ob,showchanged){
			var r;
			if (showchanged) {
				this.canvas.width=ob.width;
				this.canvas.height=ob.height;
			}
			for (var j in ob.uids){
				o=ob.uids[j];
				if (o.__debugrect){
					a=o.getRects().rect;
					this.ctx.strokeStyle=o.__debugrect;
					this.ctx.strokeRect(a.x+o.screen.gridcoords.x+0.5,a.y+o.screen.gridcoords.y+0.5,a.width-1,a.height-1);
				}
				if (o.__debugscreen){
					a=o.getRects().screen;
					this.ctx.strokeStyle=o.__debugscreen;
					this.ctx.fillStyle="#000";
					this.ctx.strokeRect(a.x+o.screen.gridcoords.x+0.5,a.y+o.screen.gridcoords.y+0.5,a.width-1,a.height-1);
					if (!o.onscreen) {
						this.ctx.fillStyle="rgba(255,255,0,0.8)";
						this.ctx.fillRect(a.x+o.screen.gridcoords.x,a.y+o.screen.gridcoords.y,a.width,a.height);
					}
				}
				if (o.__debugouter){
					a=o.getRects().outer;
					this.ctx.strokeStyle=o.__debugouter;
					this.ctx.strokeRect(a.x+o.screen.gridcoords.x+0.5,a.y+o.screen.gridcoords.y+0.5,a.width-1,a.height-1);
				}
				if (o.__debughitbox){
					a=o.getRects().rect;
					this.ctx.fillStyle=o.__debughitbox;
					if (o.hitbox)
						for (var i=0;i<o.hitbox.length;i++)
							this.ctx.fillRect(a.x+o.hitbox[i].x+o.screen.gridcoords.x,a.y+o.hitbox[i].y+o.screen.gridcoords.y,o.hitbox[i].width,o.hitbox[i].height);
				}
			}
			for (var i in ob.stats.updatedRects) {
				o=ob.stats.updatedRects[i];
				a=o.getRects().screen;
				this.ctx.strokeStyle="#f00";
				this.ctx.strokeRect(a.x+o.screen.gridcoords.x+0.5,a.y+o.screen.gridcoords.y+0.5,a.width-1,a.height-1);
			}
			if (showchanged) {
				for (var i=0;i<this._complexCollision.length;i++) {
					a=this._complexCollision[i];
					this.ctx.strokeStyle="#f00";
					this.ctx.strokeRect(a.x+game.gridcoords.x+0.5,a.y+game.gridcoords.y+0.5,a.width-1,a.height-1);
					this.ctx.fillStyle="rgba(255,0,0,0.7)";
					for (var j=0;j<a.hitbox.length;j++) {
						o=a.hitbox[j];
						this.ctx.fillRect(a.x+game.gridcoords.x+o.x,a.y+game.gridcoords.y+o.y,o.width,o.height);
					}
				}
				this._complexCollision=[];
			}
		},
		onProcessFrame:function(ob){
			if (this.smoothie) {
				//this.smoothieline.append(new Date().getTime(), ob.stats.garbageCount);
				//this.smoothieline.append(new Date().getTime(), ob.stats.calculatedRects);
				//this.smoothieline.append(new Date().getTime(), ob.stats.frameProcessTime/40);
				//this.smoothieline.append(new Date().getTime(), ob.stats.overload);
				//this.smoothieline.append(new Date().getTime(), ob.stats.elementsCount);
				//this.smoothieline.append(new Date().getTime(), ob.stats.uidsCount);
				//this.smoothieline.append(new Date().getTime(), ob.stats.typesCount);
				//this.smoothieline.append(new Date().getTime(), ob.stats.movedCells);
				//this.smoothieline.append(new Date().getTime(), ob.stats.cellsCount);
				//this.smoothieline.append(new Date().getTime(), ob.stats.cellsUsage);
				//this.smoothieline.append(new Date().getTime(), ob.stats.iteratedObjects);
				//this.smoothieline.append(new Date().getTime(), ob.stats.runningCount);
				//this.smoothieline.append(new Date().getTime(), ob.stats.load);
				//this.smoothieline.append(new Date().getTime(), ob.stats.objectWastedCount);
				//this.smoothieline.append(new Date().getTime(), ob.stats.listUsage);
			}
			this.debugRect(ob,true);
		},
		onApplyChanges:function(ob){
			if (this.smoothie) {
				//this.smoothieline.append(new Date().getTime(), ob.stats.frameRenderTime);
				//this.smoothieline.append(new Date().getTime(), ob.stats.changesCount);
				this.smoothieline.append(new Date().getTime(), ob.stats.objectChangedCount);
				//this.smoothieline.append(new Date().getTime(),game.node.getElementsByTagName("div").length);
				//this.smoothieline.append(new Date().getTime(),ob.stats.nodesOnScreen);
			}
			this.debugRect(ob);
		}
	};

	// GUI CREATION

	function node(parent,type,cn,content) {
		var ret=document.createElement(type);
		if (cn) ret.className=cn;
		if (content) ret.innerHTML=content;
		parent.appendChild(ret);
		return ret;
	}

	// KEYBOARD SETTINGS

	var controls,controlsmode,settingkey=0;
	function waitKey(e) {
		controls[settingkey.id]=e.keyCode;
		localStorage["wrightControls_"+controlsmode]=JSON.stringify(controls);
		settingkey.elm.value=keySymbol(e.keyCode);
		settingkey=0;
		Box.off("keydown",document,waitKey);
		e.preventDefault();
	}
	function setupKey() {
		var self=this,id=this.getAttribute("_id");
		if (settingkey) {
			settingkey.elm.value=settingkey.value;
			Box.off("keydown",document,waitKey);
		}
		settingkey={elm:this,value:this.value,id:id};
		this.value="Press a key...";
		Box.on("keydown",document,waitKey);
	}
	function keySymbol(code) { return (KEYSYMBOLS[code]||String.fromCharCode(code))+" ("+code+")"; }

	/*
	 * GAME STARTER
	 */

	if (!mods) mods={};
	container.innerHTML="";
	tv = node(container,"div");
	tv.style.margin="auto";

	function runGame(mode) {
		tv.innerHTML="";
		game = Box(tv, "game");
		game.setGridSize(hardware.gridSize).setKeys(controls).setColor("#fff").setBgcolor("#000").size(hardware).setFps(hardware.fps||25).setScale(mode.scale).setOriginX(0).setOriginY(0).do(Code.GameManager);
		if (hardware.aliasMode) game.setAliasMode(hardware.aliasMode);
		if (mode.volume&&gamedata.audioChannels) game.enableAudio(mode.volume/100);
		if (hardware.usePointer) game.enablePointer(mode.pointer||Supports.pointerMode());
		tv.style.width = (game.width * game.scale) + "px";
		tv.style.height = (game.height * game.scale) + "px";
		game.setResourcesRoot("tapes/" + gameId + "/");
		for (var k in gamedata.resources) game.addResource(k, gamedata.resources[k]);
		for (var k in gamedata.audioChannels) game.addAudioChannel(k, gamedata.audioChannels[k]);
		game.loadResources(function() {
			if (hardware.texture) game.add("background").setZIndex(30).at({ x: 0, y: 0 }).size({ width: game.width, height: game.height }).setImage(hardware.texture).setAlpha(0.1);
			plugTape(0, 0, "intro", gamedata);
		 	// game.setStatsManager(Monitor); // Uncomment for stats.
		});
	}

	/*
	 * INITIALIZATION
	 */

	Box.getFile("tapes/" + gameId + "/tape.json?" + Math.random(), function(text) {
		filecache = Box.Cache();
		gamedata = JSON.parse(text);
		hardware = gamedata.hardware || DEFAULTHARDWARE;
		if (!gamedata.scenes) gamedata.scenes = { intro: {} };
		var cheatslist=gamedata.cheats;
		var hasAudio=gamedata.audioChannels;
		var hasPointer=gamedata.hardware.usePointer;
		controlsmode=hardware.controls||"standard";
		var controlsset=CONTROLS[controlsmode];
		if (localStorage["wrightControls_"+controlsmode]) controls=JSON.parse(localStorage["wrightControls_"+controlsmode]);
		else controls={};
		for (var a in controlsset) if (controls[a]===undefined) controls[a]=controlsset[a].keyCode;
		var scale=mods.scale||(localStorage["wrightScale"]*1)||3;
		var volume=(mods.volume===undefined?((localStorage["wrightVolume"]||100)*1):mods.volume)||0;
		var pointer=(mods.pointer===undefined?(localStorage["wrightPointer"]||Supports.pointerMode()):mods.pointer)||"mouse";
		if (!Box.supportsScaling) scale=1;
		if (mods.noui) runGame({scale:scale,volume:hasAudio?volume:0});
		else {
			var pointerOption,havecheats,row,itm,magazine=node(tv,"div","magazine");
			var pointers=[{id:"mouse",label:"Mouse (click for Trigger)"},{id:"touch",label:"Touch screen (tap for Trigger)"}];
			node(magazine,"div","logo","Wright!");
			node(magazine,"h1",0,gamedata.genre||"Game");
			var article=node(magazine,"div","article");
			node(article,"div","text","<h2>"+(gamedata.name||"No title")+"</h2><h3>"+(gamedata.author||"Unknown author")+", "+(gamedata.year||"Unknown year")+"</h3><p class='content'>"+(gamedata.description||"We're sorry but the description of this game is missing and is not available. Just play the game!"));
			if (gamedata.screenshots) {
				row=node(article,"p","screenshots");
				for (var i=0;i<gamedata.screenshots.length;i++)
					node(row,"div","screenshot").style.backgroundImage="url('tapes/"+gameId+"/screenshots/"+gamedata.screenshots[i]+"')";
			}
			node(article,"h3",0,"Settings");
			for (var a in controlsset) {
				row=node(article,"p");
				node(row,"span","label",controlsset[a].label+":");
				itm=node(row,"input","input");
				itm.setAttribute("readonly","readonly");
				itm.setAttribute("_id",a);
				itm.value=keySymbol(controls[a]);
				Box.on("click",itm,setupKey);
			}
			if (hasPointer) {
				row=node(article,"p");
				node(row,"span","label","Pointer/Gun:");
				var pointerOption=node(row,"select","input");
				for (var i=0;i<pointers.length;i++) {
					itm=node(pointerOption,"option",0,pointers[i].label);
					itm.value=pointers[i].id;
					if (pointer==pointers[i].id) itm.setAttribute("selected","selected");
				}
			}
			row=node(article,"p");
			node(row,"span","label","Resolution:");
			var resolution=node(row,"select","input"),resolutions=Box.supportsScaling?7:1;
			for (var i=1;i<resolutions;i++) {
				itm=node(resolution,"option",0,(hardware.width*i)+"x"+(hardware.height*i)+" (x"+i+")");
				if (i==scale) itm.setAttribute("selected","selected");
			}
			if (hasAudio) {
				row=node(article,"p");
				node(row,"span","label","Sound:");
				var audio=node(row,"select","input");
				node(audio,"option",0,"Disabled");
				for (var i=10;i<=100;i+=10) {
					itm=node(audio,"option",0,"Volume "+i+"%");
					if (i==volume) itm.setAttribute("selected","selected");
				}
			}
			node(article,"h3",0,"Cheats");
			for (var a in cheatslist) {
				havecheats=true;
				row=node(article,"p");
				itm=node(row,"input");
				itm.type="checkbox";
				itm.setAttribute("_id",a);
				Box.on("click",itm,function() { cheats[this.getAttribute("_id")]=this.checked;})
				node(row,"span",0,cheatslist[a]);
			}
			if (!havecheats) node(article,"p",0,"Sorry, no cheats for this game. Is all up to you!");
			itm=node(node(article,"p","runner"),"button",0,"Start game");
			Box.on("click",itm,function(){
				scale=localStorage["wrightScale"]=resolution.selectedIndex+1;
				if (hasPointer)
					pointer=localStorage["wrightPointer"]=pointerOption.options[pointerOption.selectedIndex].value;
				else
					pointer=0;
				if (hasAudio) volume=localStorage["wrightVolume"]=audio.selectedIndex*10; else volume=0;
				Box.off("keydown",document,waitKey);
				runGame({scale:scale,volume:volume,pointer:pointer});
			});
			node(magazine,"h4",0,"Wright engine &copy;2015");
		}
	});

	return {
		destroy:function() {
			Box.off("keydown",document,waitKey);
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

var _WRIGHT;
function runWright(name,container,mods) {
	if (_WRIGHT) _WRIGHT.destroy();
	setTimeout(function(){
		window.scrollTo(0, 0);
		_WRIGHT=Wright(name,container||document.getElementById("wrightContainer"),mods);
	},10);
}
