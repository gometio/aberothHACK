function App() {
	var a;
	this.canvas = document.getElementById("screen");
	this.screenkey = document.getElementById("screenkey");
	try {
		var b = -1 < navigator.userAgent.toLowerCase().indexOf("firefox");
		window.AudioContext = b ? null : window.AudioContext || window.webkitAudioContext
	} catch (g) {}
	if (window.autoLoad ? this.autoLoad = window.autoLoad : this.autoLoad = sessionStorage.data && JSON.parse(sessionStorage.data), this.primary = document.getElementById("primary"), this.speechTxt = document.getElementById("tosay"), this.cmdBtn = document.getElementById("docmd"), this.cmdList = document.getElementById("commandlist"), this.escBtn = document.getElementById("esc"), this.dirpad = document.getElementById("dirpad"), this.dropper = document.getElementById("dropmode"), this.atkBtn = document.getElementById("attack"), this.border = document.getElementById("border"), this.ctrlLeft = document.getElementById("controlsleft"), this.ctrlRight = document.getElementById("controlsright"), this.ctrlAlt = document.getElementById("controlsalt"), this.dropLabel = this.dropper ? this.dropper.parentNode : null, this.altHeight = document.getElementById("altheight"), this.screenResized(), this.addEvent(window, "resize", this.screenResized), localStorage.data) try {
		this.data = JSON.parse(localStorage.data), delete this.data.sounds
	} catch (g) {
		window.log.log("Error loading data from local storage: " + g), this.data = null
	}
	this.data || (this.data = {
		gameSize: null,
		fontSize: null,
		user: "",
		pwd: ""
	});
	this.localSounds = {};
	this.changedSounds = {};
	for (var b = 0, c = localStorage.length; b < c; ++b) {
		var d = localStorage.key(b);
		if (d && 0 === d.lastIndexOf("sound", 0)) {
			if (0 === d.lastIndexOf("soundtime:", 0)) var e = "time";
			else {
				if (0 !== d.lastIndexOf("sounddata:", 0)) {
					localStorage.removeItem(d);
					continue
				}
				e = "data"
			}
			f = d.substring(10);
			(a = this.localSounds[f]) || (a = {}, this.localSounds[f] = a);
			try {
				a[e] = JSON.parse(localStorage.getItem(d))
			} catch (g) {
				this.deleteSound(f)
			}
		}
	}
	for (var f in this.localSounds) a = this.localSounds[f], a.time && a.data || (window.log.log(3, "Deleting orphan sound " + f), this.deleteSound(f));
	if (!this.autoLoad) {
		this.nameInput = document.getElementById("nameinput");
		this.passwordInput = document.getElementById("passwordinput");
		this.loadButton = document.getElementById("loadbutton");
		this.gameSize = document.getElementById("gamesize");
		this.fontSize = document.getElementById("fontsize");
		this.encryptPassword = !0;
		this.ipAddress = "192.99.0.191";
		this.screenDefinition = 0;
		a = {
			2: "Half",
			4: "Normal",
			8: "Double",
			12: "Triple"
		};
		for (b = 2; 13 > b; ++b) f = a[b], c = this.gcd(b, 4), c = b / c + "/" + 4 / c, f || 4 < (f = (b / 4).toString()).length && (f = "..."), this.addOption(this.gameSize, f, c);
		this.gameSize.value = "1/1";
		for (b = 8; 15 > b; ++b) this.addOption(this.fontSize, b, b);
		for (b = 16; 25 > b; b += 2) this.addOption(this.fontSize, b);
		this.addOption(this.fontSize, 28);
		this.addOption(this.fontSize, 36);
		this.addOption(this.fontSize, 48);
		this.addOption(this.fontSize, 72);
		this.fontSize.value = 12;
		this.rememberPassword = document.getElementById("rememberpassword");
		this.reloadOnDeath = document.getElementById("reloadondeath")
	}
	this.mouse = {
		x: 0,
		y: 0,
		button: 0
	};
	this.dirmouse = {
		x: 0,
		y: 0
	};
	this.atkmouse = {
		x: 0,
		y: 0
	};
	window.log.log(3, "App initialized.");
	this.game = new GameClient(this);
	b = this.getScaling();
	this.game.setGameAndFontSize(b.up, b.down, this.getFontSize());
	this.prepDummySound();
	this.autoLoad && this.autoStartGame() || (this.addEvent(this.loadButton, "click", this.loadButtonClick), this.addEvent(this.nameInput, "keyup", this.passwordKeyUp), this.addEvent(this.passwordInput, "keyup", this.passwordKeyUp), this.addEvent(this.gameSize, "change", this.refreshScreenDemo), this.addEvent(this.fontSize, "change", this.refreshScreenDemo), this.addEvent(this.reloadOnDeath, "change", this.reloadOnDeathChange), this.nameInput.value = this.data.user ? this.data.user : "", this.passwordInput.value = this.data.user && this.data.pwd ? this.data.pwd : "", this.data.gameSize && (this.gameSize.value = this.data.gameSize), this.data.fontSize && (this.fontSize.value = this.data.fontSize), this.data.rememberPassword && (this.rememberPassword.checked = !0), this.data.reloadOnDeath && (this.reloadOnDeath.checked = !0), this.nameInput.disabled = !1, this.passwordInput.disabled = !1, this.gameSize.disabled = !1, this.fontSize.disabled = !1, this.reloadOnDeath.disabled = !1, this.data.user && this.data.pwd && (this.loadButton.disabled = !1), this.refreshScreenDemo())
}

function GameClient(a) {
	window.log.log(4, "Creating game client");
	this.app = a;
	this.preCanvas = document.createElement("canvas");
	var b = document.location.href,
		c = b.indexOf("/", 8);
	0 <= c && (b = b.substring(0, c));
	this.resourceUrlBase = b + "/resource/";
	this.globalResourceCache = {};
	try {
		window.AudioContext && (this.audioContext = new AudioContext)
	} catch (d) {
		this.audioContext = null
	}
	window.log.log(3, "Audio framework: " + (this.audioContext ? "web audio API" : "basic"));
	b = new Audio;
	c = b.canPlayType("audio/ogg").length;
	this.audioExt = b.canPlayType("audio/mp3").length > c ? ".mp3" : ".ogg";
	window.log.log(3, "Audio format: " + this.audioExt);
	this.lastFrameBacklogSent = 0;
	this.backlog = null;
	this.whereInCommand = 0;
	this.commandType = null;
	this.numSubCommands = 0;
	this.password = this.playerName = this.subCommandIndex = null;
	this.shuttingDown = !1;
	this.activeSubWindow = this.windowId = null;
	this.posY = this.posX = this.repaintBigY = this.repaintBigX = this.repaintSmallY = this.repaintSmallX = 0;
	this.fontSize = this.font = null;
	this.fonts = [];
	this.scaleDown = this.scaleUp = null;
	this.scrollingRight = this.scrollingDown = !1;
	this.totalCopyDy = this.totalCopyDx = 0;
	this.context = a.canvas.getContext("2d");
	this.context.fillStyle = "rgba(0,0,0,1)";
	this.disableImageSmoothing(this.context);
	this.context.save();
	this.preContext = this.preCanvas.getContext("2d");
	this.disableImageSmoothing(this.preContext);
	this.ipAddress = a.ipAddress;
	this.screenDefinition = a.screenDefinition;
	this.encryptPassword = a.encryptPassword;
	a = new Uint8Array(new ArrayBuffer(6));
	this.statusMix = new DataView(a.buffer);
	a[0] = this.Types.Compression.NOT_COMPRESSED_FLAG;
	a[1] = 0;
	a[2] = 3;
	a[3] = this.Types.ClientServerMessage.CLIENT_STATUS;
	this.keyBytes = new Uint8Array(new ArrayBuffer(11));
	this.keyBytes[0] = this.Types.Compression.NOT_COMPRESSED_FLAG;
	this.keyBytes[1] = 0;
	this.keyBytes[2] = 8;
	this.keyBytes[3] = this.Types.ClientServerMessage.USER_INPUT;
	this.keyBytes[4] = this.windowId;
	this.keyBytes[5] = 0;
	this.keyBytes[6] = 0;
	this.keyBytes[7] = 1;
	this.keyBytes[8] = 16;
	this.mouseBytes = new Uint8Array(new ArrayBuffer(16));
	this.mouseMix = new DataView(this.mouseBytes.buffer);
	this.mouseBytes[0] = this.Types.Compression.NOT_COMPRESSED_FLAG;
	this.mouseBytes[1] = 0;
	this.mouseBytes[2] = 13;
	this.mouseBytes[3] = this.Types.ClientServerMessage.USER_INPUT;
	this.mouseBytes[4] = this.windowId;
	this.mouseBytes[5] = 0;
	this.mouseBytes[6] = 0;
	this.mouseBytes[7] = 1;
	this.mouseBytes[8] = 19
}

function SoundLoadHelper(a, b) {
	if (window.log.log(4, "SoundLoadHelper start"), this.client = a, this.resourceDef = b, a.app.localSounds[b.name]) {
		window.log.log(3, "SoundLoadHelper using local storage: " + b.name);
		try {
			this.request = {
				status: 200,
				response: this.fromStored(a.app.localSounds[b.name].data)
			}, this.localStorage = !0
		} catch (c) {
			window.log.log(1, "Error using local storage: " + b.name), delete a.app.localSounds[b.name], a.soundChanged = !0, a.app.changedSounds[b.name] = 2
		}
	}
	window.log.log(4, "SoundLoadHelper end")
}

function Connection(a) {
	this.client = a;
	this.socket = null;
	this.initializationComplete = !1;
	this.lastHandshakeMessageReceived = null;
	this.isListening = !1;
	this.lastBytesWritten = this.totalBytesWritten = this.totalBytesRead = 0;
	this.heartbeatSenderHandle = null;
	this.cleanCloseInitiated = !1;
	this.handshakeBytes = null;
	this.heartbeatBytes = new ArrayBuffer(6);
	a = new Uint8Array(this.heartbeatBytes);
	a[0] = this.client.Types.Compression.NOT_COMPRESSED_FLAG;
	a[1] = 0;
	a[2] = 3;
	a[3] = this.client.Types.ClientServerMessage.CLIENT_STATUS;
	(new DataView(this.heartbeatBytes)).setUint16(4, this.Types.Heartbeat.HEARTBEAT_STATUS_SIGNAL, !1)
}

function SubWindow(a, b, c, d, e, f) {
	this.client = a;
	this.id = b;
	this.x = c;
	this.y = d;
	this.width = e;
	this.height = f;
	this.currentColor = null;
	window.log.log(5, "new SubWindow: id=" + b + ", x=" + c + ", y=" + d + ", w=" + e + ", h=" + f);
	this.textLeftGap = this.Types.Misc.BASE_TEXT_SCREEN_EDGE_GAP + 1;
	this.textTopGap = this.Types.Misc.BASE_TEXT_SCREEN_EDGE_GAP;
	this.textBottomGap = ~~(this.Types.Misc.BASE_TEXT_SCREEN_EDGE_GAP * a.scaleUp / a.scaleDown + 1);
	this.textRightGap = ~~(this.Types.Misc.BASE_TEXT_SCREEN_EDGE_GAP * a.scaleUp * 3 / a.scaleDown + 3);
	this.fillRectSizeY = this.fillRectSizeX = 1;
	this.canvas = document.createElement("canvas");
	this.canvas.width = e;
	this.canvas.height = f;
	this.context = this.canvas.getContext("2d");
	this.client.disableImageSmoothing(this.context);
	this.setGraphicsToDefault()
}

function startNewGame() {
	app && app.game && app.newGame()
}
var ENABLE_LOGGING = !1,
	Logger = function(a) {
		this.logLevel = 0;
		ENABLE_LOGGING && this.setLogLevel && this.setLogLevel(a)
	};
ENABLE_LOGGING && window.addEventListener("load", function() {
	window.log.log(5, "window.onload log start");
	var a = document.getElementById("dirpad");
	if (a) {
		var b = document.createElement("textarea");
		b.id = "dbgtxt";
		b.rows = 15;
		a.parentNode.insertBefore(b, a);
		a.parentNode.insertBefore(document.createElement("article"), a);
		Logger.prototype.dbgTxt = b
	}
	window.log.log(5, "window.onload log end")
});
Logger.prototype.checkValidPosition = function(a, b) {
	a >= b && window.log.log(1, "Specified position is beyond the end of data available (byte " + a + "/" + b + ".")
};
window.console && (window.console.log = window.console.log || function() {}, window.console.debug = window.console.debug || window.console.log, window.console.info = window.console.info || window.console.log, window.console.warn = window.console.warn || window.console.log, window.console.error = window.console.error || window.console.log);
Logger.prototype.setLogLevel = function(a) {
	this.logLevel = a;
	this.clear2();
	this.maxLines = 1E5
};
Logger.prototype.clear2 = function() {
	this.clear();
	this.lineCount = 0
};
var dummy = function() {
	this.log(3, "clear not yet bound; enter this into the console...");
	this.log(3, "  window.log.clear = clear; window.log.logLevel = 4;")
};
Logger.prototype.clear = dummy;
Logger.prototype.logSoundStorage = function(a, b, c, d, e) {
	if (ENABLE_LOGGING) try {
		var f = 2 * JSON.stringify(localStorage).length;
		this.log(a, "Storage attempt: " + b + "/" + c + "/" + d + " items in " + e + "ms; " + (localStorage.length - 1) / 2 + " sounds in cache; approx " + f + " bytes")
	} catch (g) {
		this.log(a, "Failed to summarize sound storage attempt.")
	}
};
Logger.prototype.resizeTextArea = function(a, b) {
	try {
		if (this.dbgTxt)
			if (a && a.parentNode === this.dbgTxt.parentNode) {
				this.dbgTxt.hidden = !1;
				var c = ~~(a.width / 10);
				this.dbgTxt.rows = ~~((b.height - a.height) / 17);
				this.dbgTxt.cols = c
			} else this.dbgTxt.hidden = !0
	} catch (d) {
		this.log(level, "Failed to resize log textbox.")
	}
};
Logger.prototype.log = function(a, b) {
	if ("number" != typeof a || !isFinite(a) || !b) throw "Bad log params";
	if (!(this.logLevel < a) && window.console) {
		if (this.clear === dummy) {
			if (4 < a) return
		} else ++this.lineCount > this.maxLines && (this.clear2(), this.log(3, "auto-cleared log after " + this.maxLines + " lines"));
		switch (a) {
			case 0:
			case 1:
				var c = window.console.error;
				break;
			case 2:
				c = window.console.warn;
				break;
			case 3:
				c = window.console.info;
				break;
			default:
				c = window.console.debug
		}
		this.dbgTxt && (this.dbgTxt.value += b + "\n");
		var d = new Date,
			e = d.getHours().toString(),
			f = d.getMinutes().toString(),
			g = d.getSeconds().toString(),
			d = d.getMilliseconds().toString();
		2 > e.length && (e = "0" + e);
		2 > f.length && (f = "0" + f);
		2 > g.length && (g = "0" + g);
		2 == d.length ? d = "0" + d : 1 == d.length && (d = "00" + d);
		b = a.toString() + " " + e + ":" + f + ":" + g + "." + d + " " + b;
		c.call(window.console, b)
	}
};
window.log = new Logger(3);
App.prototype.Types = {
	KeyAction: {
		KEY_PRESSED: 0,
		KEY_RELEASED: 1,
		KEY_TYPED: 2,
		SPECIAL_ACTION: 11,
		SPECIAL_ACTION_BUFFER_SPEECH: 12,
		SPECIAL_ACTION_DROP_EQUIPPED: 13
	},
	SpecialAction: {
		BEGIN_FIGHTING: 1,
		END_FIGHTING: 2,
		ABOUT_TO_SPEAK: 5,
		SPEAK_SPEECH_BUFFER: 6
	},
	MouseAction: {
		MOUSE_PRESSED: 0,
		MOUSE_RELEASED: 1
	},
	Misc: {
		NUM_POSSIBLE_KEYS: 256,
		MAX_SUB_WINDOWS: 255
	}
};
App.prototype.deleteSound = function(a, b) {
	if (b) delete this.localSounds[a], this.changedSounds[a] = 2, this.game.lastSoundStore = 0;
	else try {
		localStorage.removeItem("soundtime:" + a), localStorage.removeItem("sounddata:" + a)
	} catch (c) {
		window.log.log(2, "Error deleting sound " + a + ": " + c)
	}
};
App.prototype.clearSounds = function() {
	try {
		for (var a = localStorage.length - 1; 0 <= a; --a) {
			var b = localStorage.key(a);
			0 === b.lastIndexOf("sound", 0) && localStorage.removeItem(b)
		}
		window.log.log(2, "Cleared sound cache.")
	} catch (c) {
		window.log.log(1, "Failed to clear sound cache: " + c)
	}
};
App.prototype.storeSounds = function() {
	window.log.log(3, "Storing sounds...");
	var a = (new Date).getTime(),
		b = this.changedSounds,
		c = this.localSounds,
		d = 0,
		e = 0,
		f = 0;
	try {
		for (var g in b) c[g] || (this.deleteSound(g), delete b[g], ++f);
		try {
			var h = !0;
			for (g in b)
				if (2 === b[g] ? (localStorage.setItem("sounddata:" + g, JSON.stringify(c[g].data)), ++d) : ++e, localStorage.setItem("soundtime:" + g, JSON.stringify(c[g].time)), delete b[g], 10 < (new Date).getTime() - a) {
					h = !1;
					break
				}
			h && (this.game.soundChanged = !1, this.game.lastSoundStore = this.game.getTimestamp())
		} catch (n) {
			window.log.log(2, "Error storing sounds: " + n);
			var b = null,
				m = (new Date).getTime(),
				k;
			for (k in c) {
				var l = c[k].time;
				l < m && (m = l, b = k)
			}
			b && (this.deleteSound(b), delete c[b], window.log.log(3, "Cleared oldest sound."))
		}
	} catch (n) {
		window.log.log(1, "Unexpected error storing sounds: " + n), this.clearSounds()
	}
	a = (new Date).getTime() - a;
	window.log.logSoundStorage(3, d, e, f, a)
};
App.prototype.addOption = function(a, b, c, d) {
	var e = document.createElement("option");
	e.text = b;
	e.value = c || b;
	d && (e.disabled = !0);
	a.add(e)
};
App.prototype.prepDummySound = function() {
	this.silentSound = {
		id: "silent",
		name: "silence_0.25s",
		volume: 1,
		pan: 0,
		type: this.game.Types.ResourceType.RESOURCE_TYPE_SOUND_EFFECT_NO_DATA
	};
	this.game.loadSoundData(this.silentSound)
};
App.prototype.playDummySound = function() {
	!this.playedDummySound && this.game && this.game.globalResourceCache[this.silentSound.id] && (window.log.log(3, "Playing silent sound"), this.game.useResource(this.silentSound), this.playedDummySound = !0)
};
App.prototype.screenResized = function(a) {
	if (this.dirpad || this.atkBtn) {
		a = window.innerWidth;
		var b = window.innerHeight,
			c = this.canvas.width;
		this.dirpad && (c += this.dirpad.width);
		this.atkBtn && (c += this.atkBtn.width);
		a >= b && a > c + 10 ? (this.moveElement(this.dirpad, this.ctrlLeft), this.moveElement(this.atkBtn, this.ctrlRight), this.dirpad.className = "", this.atkBtn.className = "") : (this.moveElement(this.dirpad, this.ctrlAlt), this.moveElement(this.atkBtn, this.ctrlAlt), this.moveElement(this.altHeight, null), this.moveElement(this.altHeight, this.ctrlAlt), this.dirpad.className = "padleft", this.atkBtn.className = "padright")
	}
};
App.prototype.moveElement = function(a, b) {
	if (a) {
		var c = a.parentNode;
		c !== b && (c && c.removeChild(a), b && b.appendChild(a))
	}
};
App.prototype.loadButtonClick = function(a) {
	window.log.log(5, "loadButtonClick start");
	return this.tryStartingGame(this.nameInput.value, this.passwordInput.value), window.log.log(5, "loadButtonClick end"), !1
};
App.prototype.passwordKeyUp = function(a) {
	var b = this.nameInput.value,
		c = this.passwordInput.value;
	return this.loadButton.disabled = !b || !c, 13 !== a.keyCode || this.loadButton.disabled || this.tryStartingGame(b, c), 13 !== a.keyCode
};
App.prototype.reloadOnDeathChange = function(a) {
	this.data.reloadOnDeath = this.reloadOnDeath.checked;
	localStorage.data = JSON.stringify(this.data)
};
App.prototype.gcd = function(a, b) {
	for (var c, d = a, e = b; e;) c = d % e, d = e, e = c;
	return d
};
App.prototype.getScaling = function(a) {
	if (this.autoLoad) return {
		up: this.autoLoad.scaleup,
		down: this.autoLoad.scaledown
	};
	var b = this.gameSize.value,
		b = b ? b.split("/") : [1, 1],
		b = {
			up: Number(b[0]),
			down: Number(b[1])
		};
	return a && (this.data.gameSize = this.gameSize.value, localStorage.data = JSON.stringify(this.data)), b
};
App.prototype.getFontSize = function(a) {
	if (this.autoLoad) return this.autoLoad.fontsize;
	var b = Number(this.fontSize.value);
	return a && (this.data.fontSize = b, localStorage.data = JSON.stringify(this.data)), b
};
App.prototype.getRememberPassword = function() {
	var a = this.rememberPassword.checked;
	return this.data.rememberPassword = a, localStorage.data = JSON.stringify(this.data), a
};
App.prototype.refreshScreenDemo = function(a) {
	a = this.getScaling();
	var b = this.getFontSize();
	this.game.setGameAndFontSize(a.up, a.down, b);
	this.game.setOnScreenMessage("");
	this.game.setOnScreenMessage("Aberoth")
};
App.prototype.addEvent = function(a, b, c) {
	if (a) {
		this.listenerLookup || (this.listenerLookup = {});
		var d = a.type + ":" + a.id,
			e = this.listenerLookup[d];
		if (e || (e = {}, this.listenerLookup[d] = e), e[b]) throw "Unexpectedly found multiple listeners for event " + b + " on " + d + ".";
		c = c.bind(this);
		switch (b) {
			case "mousedown":
				b = [b, "touchstart"];
				break;
			case "mousemove":
				b = [b, "touchmove"];
				break;
			case "mouseup":
				b = [b, "mouseout", "touchend", "touchcancel"];
				break;
			default:
				b = [b]
		}
		for (var d = 0, f = b.length; d < f; ++d) e[b[d]] = c, a.addEventListener(b[d], c)
	}
};
App.prototype.removeEvents = function(a) {
	if (a) {
		a.disabled = !0;
		var b = a.type + ":" + a.id;
		if (this.listenerLookup && this.listenerLookup[b]) {
			for (var c in this.listenerLookup[b]) a.removeEventListener(c, this.listenerLookup[b][c]);
			delete this.listenerLookup[b]
		}
	}
};
App.prototype.resizeElements = function(a, b) {
	a || (a = this.game.applyScaleUp(640, !0));
	b || (b = this.game.applyScaleUp(480, !0));
	this.canvas.width = a;
	this.canvas.height = b;
	window.log.resizeTextArea(this.dirpad, this.canvas)
};
App.prototype.prepForStart = function() {
	if (!this.game) return !1;
	this.nameInput && (this.rememberPassword.disabled = !0, this.reloadOnDeath.disabled = !0, this.removeEvents(this.nameInput), this.removeEvents(this.passwordInput), this.removeEvents(this.loadButton), this.removeEvents(this.gameSize), this.removeEvents(this.fontSize));
	var a = document.getElementById("start");
	return a && (a.style.display = "none"), !0
};
App.prototype.tryStartingGame = function(a, b) {
	if (this.prepForStart(), !this.game.started) {
		var c = this.rememberPassword.checked;
		this.data.rememberPassword = c;
		this.data.user = a;
		this.data.pwd = c ? b : "";
		this.data.reloadOnDeath = this.reloadOnDeath.checked;
		localStorage.data = JSON.stringify(this.data);
		var c = this.getScaling(!0),
			d = this.getFontSize(!0);
		a || (a = MD5((new Date).getTime().toString()));
		this.game.run(a, b, c.up, c.down, d, this.ipAddress, this.screenDefinition, this.encryptPassword, this.data.reloadOnDeath)
	}
};
App.prototype.autoStartGame = function() {
	return !!this.prepForStart() && (this.game.run(this.autoLoad.username, this.autoLoad.password, this.autoLoad.scaleup, this.autoLoad.scaledown, this.autoLoad.fontsize, this.autoLoad.ipaddress, this.autoLoad.screendefinition, this.autoLoad.encryptpassword, this.autoLoad.reloadOnDeath, this.autoLoad.javaversion), !0)
};
App.prototype.startSucceeded = function() {
	window.autoLoad || (sessionStorage.data = JSON.stringify(this.getSessionInfo()))
};
App.prototype.getSessionInfo = function() {
	return {
		username: this.game.playerName,
		password: this.game.password,
		scaleup: this.game.scaleUp,
		scaledown: this.game.scaleDown,
		fontsize: this.game.fontSize,
		ipaddress: this.game.ipAddress,
		screendefinition: this.game.screenDefinition,
		encryptpassword: this.game.encryptPassword,
		reloadOnDeath: this.game.reloadOnDeath
	}
};
App.prototype.bindGuiEvents = function(a) {
	window.log.log(4, "Binding GUI events");
	this.keysPressed = {};
	a = document;
	if (this.screenkey && (this.screenkey.tabindex = 0, this.screenkey.focus(), a = this.screenkey), this.addEvent(window, "blur", this.lostFocus), this.addEvent(a, "keyup", this.keyUp), this.addEvent(a, "keydown", this.keyDown), this.addEvent(this.canvas, "contextmenu", this.doNothing), this.addEvent(this.canvas, "mousedown", this.mouseDown), this.addEvent(this.canvas, "mouseup", this.mouseUp), this.addEvent(this.canvas, "mousemove", this.mouseMove), this.speechTxt) {
		this.dirSize = ~~(this.dirpad.width / 3);
		this.speechTxt.maxlength = 100;
		this.dirKeys = [
			[36, 38, 33],
			[37, 0, 39],
			[35, 40, 34]
		];
		this.dirSrcs = [
			["direction_up_left.png", "direction_up.png", "direction_up_right.png"],
			["direction_left.png", "direction_none.png", "direction_right.png"],
			["direction_down_left.png", "direction_down.png", "direction_down_right.png"]
		];
		a = "drop gold;makecamp;unfriendly;friendly;skills;quests;volume up;volume down".split(";");
		(!this.game.playerName || 10 < this.game.playerName.length) && a.push("champion");
		var b = "hide;membership;music up;music down;quest;spells;resistances;rr;infamy;flipcoin;sleep;password;allies;unarchenemy;vaulttrust;drop hat;drop right glove;drop left glove;drop right hand;drop left hand;drop belt;drop right foot;drop left foot;drop all equipped;say hello;say goodbye;say quest".split(";");
		a.sort();
		b.sort();
		for (var c = 0, d = a.length; c < d; ++c) this.addOption(this.cmdList, a[c]);
		this.addOption(this.cmdList, "------------------", "", !0);
		c = 0;
		for (d = b.length; c < d; ++c) this.addOption(this.cmdList, b[c]);
		this.addEvent(this.dirpad, "click", this.doNothing);
		this.addEvent(this.dirpad, "mousedown", this.dirMouseDown);
		this.addEvent(this.dirpad, "mouseup", this.dirMouseUp);
		this.addEvent(this.dirpad, "mousemove", this.dirMouseMove);
		this.addEvent(this.atkBtn, "click", this.doNothing);
		this.addEvent(this.atkBtn, "mousedown", this.atkMouseDown);
		this.addEvent(this.atkBtn, "mousemove", this.atkMouseMove);
		this.addEvent(this.atkBtn, "mouseup", this.atkMouseUp);
		this.addEvent(this.cmdBtn, "click", this.cmdBtnClick);
		this.addEvent(this.escBtn, "click", this.escBtnClick);
		this.addEvent(this.speechTxt, "keyup", this.speechKeyUp);
		this.cmdBtn.disabled = !1;
		this.cmdList.disabled = !1;
		this.speechTxt.disabled = !1;
		this.escBtn.disabled = !1;
		this.dirpad.disabled = !1;
		this.atkBtn.disabled = !1;
		this.dropper.disabled = !1
	}
};
App.prototype.stop = function() {
	this.removeEvents(this.dirpad);
	this.removeEvents(this.atkBtn);
	this.removeEvents(this.cmdBtn);
	this.removeEvents(this.escBtn);
	this.removeEvents(this.speechTxt);
	this.storeSounds()
};
App.prototype.doNothing = function(a) {
	return a && a.preventDefault && a.preventDefault(), !1
};
App.prototype.newGame = function() {
	var a = this.getSessionInfo();
	a.username = MD5((new Date).getTime().toString());
	a.password = "";
	sessionStorage.data = JSON.stringify(a);
	this.game.stop(!0, !0)
};
App.prototype.cmdBtnClick = function(a) {
	window.log.log(4, "cmdBtnClick");
	if (a = this.cmdList.value) 0 === a.lastIndexOf("say ", 0) && (a = a.substring(4)), this.speechTxt.value = a, a = document.activeElement, this.sayString(), document.activeElement = a
};
App.prototype.speechKeyUp = function(a) {
	var b = !1;
	switch (this.getKeyCode(a)) {
		case 13:
			this.sayString();
			this.screenkey.focus();
			break;
		case 27:
			this.escBtnClick();
			break;
		default:
			b = !0, this.game.sendKeyCommand(this.Types.SpecialAction.ABOUT_TO_SPEAK, this.Types.KeyAction.SPECIAL_ACTION)
	}
	return b || event.preventDefault(), b
};
App.prototype.escBtnClick = function(a) {
	this.game.sendKeyCommand(27, this.Types.KeyAction.KEY_PRESSED);
	this.game.sendKeyCommand(27, this.Types.KeyAction.KEY_RELEASED);
	this.speechTxt.value = ""
};
App.prototype.sayString = function() {
	for (var a = this.speechTxt.value, b = 0, c = a.length; b < c; ++b) this.game.sendKeyCommand(a.charCodeAt(b), this.Types.KeyAction.SPECIAL_ACTION_BUFFER_SPEECH);
	this.game.sendKeyCommand(this.Types.SpecialAction.SPEAK_SPEECH_BUFFER, this.Types.KeyAction.SPECIAL_ACTION);
	this.speechTxt.value = ""
};
App.prototype.lostFocus = function(a) {
	if (window.log.log(5, "lostFocus"), !this.game.shuttingDown) {
		this.outEvent = this.downEvent = null;
		for (var b in this.keysPressed) this.game.sendKeyCommand(b, this.Types.KeyAction.KEY_RELEASED);
		this.keysPressed = {};
		this.game.sendKeyCommand(this.Types.SpecialAction.END_FIGHTING, this.Types.KeyAction.SPECIAL_ACTION);
		this.game.sendMouseCommandInner(this.Types.Misc.MAX_SUB_WINDOWS, 1, this.Types.MouseAction.MOUSE_RELEASED, 0, 0);
		this.game.sendMouseCommandInner(this.Types.Misc.MAX_SUB_WINDOWS, 2, this.Types.MouseAction.MOUSE_RELEASED, 0, 0)
	}
	window.log.log(5, "lostFocus end")
};
App.prototype.keyDown = function(a) {
	window.log.log(5, "keyDown start");
	var b = this.getKeyCode(a);
	if (b < this.Types.Misc.NUM_POSSIBLE_KEYS) {
		var c = !this.keysPressed[b];
		(c && (this.keysPressed[b] = !0, this.game.sendKeyCommand(b, this.Types.KeyAction.KEY_PRESSED)), c || 8 === b) && (b = this.keyCode2Ascii(b, a.shiftKey)) && this.game.sendKeyCommand(b, this.Types.KeyAction.KEY_TYPED)
	}
	return window.log.log(5, "keyDown end"), this.doNothing(a)
};
App.prototype.keyUp = function(a) {
	window.log.log(5, "keyUp start");
	var b = this.getKeyCode(a);
	return b < this.Types.Misc.NUM_POSSIBLE_KEYS && this.keysPressed[b] && (delete this.keysPressed[b], this.game.sendKeyCommand(b, this.Types.KeyAction.KEY_RELEASED)), window.log.log(5, "keyUp end"), this.doNothing(a)
};
App.prototype.mouseDown = function(a) {
	window.log.log(5, "mouseDown start");
	this.screenkey && this.screenkey.focus();
	this.setMouseCoordinates(a, this.canvas, this.mouse);
	var b = this.getJavaMouseEvent(a),
		c = this.game.sendMouseCommand(b, this.Types.MouseAction.MOUSE_PRESSED, this.dropper && this.dropper.checked);
	return 1 === b.button && (this.downEvent = b, this.outEvent = null, this.downWin = c, b.time = (new Date).getTime()), window.log.log(5, "mouseDown start"), this.doNothing(a)
};
App.prototype.mouseUp = function(a) {
	window.log.log(5, "mouseUp start");
	this.setMouseCoordinates(a, this.canvas, this.mouse);
	var b = a === this.downEvent ? a : this.getJavaMouseEvent(a, !this.downEvent);
	return 1 === b.button && (this.downEvent = null), this.game.sendMouseCommand(b, this.Types.MouseAction.MOUSE_RELEASED), window.log.log(5, "mouseUp end"), this.doNothing(a)
};
App.prototype.mouseMove = function(a) {
	if (window.log.log(5, "mouseMove start"), this.setMouseCoordinates(a, this.canvas, this.mouse)) {
		if ("touchmove" === a.type && !this.downWin && (this.outEvent && (window.log.log(3, "Touch return"), this.downEvent = this.outEvent, this.outEvent = null), this.downEvent)) {
			var b = (new Date).getTime();
			70 < b - this.downEvent.time && (this.game.sendMouseCommandInner(0, 1, this.Types.MouseAction.MOUSE_RELEASED, this.downEvent.x, this.downEvent.y), this.game.sendMouseCommandInner(0, 1, this.Types.MouseAction.MOUSE_PRESSED, this.mouse.x, this.mouse.y), this.downEvent.x = this.mouse.x, this.downEvent.y = this.mouse.y, this.downEvent.time = b)
		}
	} else this.downEvent && (window.log.log(3, "Touch out"), this.outEvent = this.downEvent, this.mouseUp(this.downEvent));
	return window.log.log(5, "mouseMove end"), this.doNothing(a)
};
App.prototype.dirMouseDown = function(a) {
	return window.log.log(4, "dirMouseDown"), 1 === this.getJavaMouseEvent(a).button && (this.dirDown = !0), this.dirDown ? this.dirMouseMove(a) : this.doNothing(a)
};
App.prototype.dirMouseMove = function(a) {
	return window.log.log(5, "dirMouseMove"), this.setMouseCoordinates(a, this.dirpad, this.dirmouse) ? this.dirDown && this.considerArrowKey() : this.adjustDirKeys(1, 1), this.doNothing(a)
};
App.prototype.dirMouseUp = function(a) {
	return window.log.log(4, "dirMouseUp"), this.dirDown = !1, this.adjustDirKeys(1, 1), this.doNothing(a)
};
App.prototype.atkMouseDown = function(a) {
	return window.log.log(4, "atkMouseDown"), 1 === this.getJavaMouseEvent(a).button && (this.atkDown = !0), this.atkDown ? this.atkMouseMove(a) : this.doNothing(a)
};
App.prototype.atkMouseMove = function(a) {
	window.log.log(5, "atkMouseMove");
	var b = this.setMouseCoordinates(a, this.atkBtn, this.atkmouse);
	return !b && this.attacking ? (this.attacking = !1, this.game.sendKeyCommand(this.Types.SpecialAction.END_FIGHTING, this.Types.KeyAction.SPECIAL_ACTION), this.atkBtn.src = "./img/attack_released.png") : b && !this.attacking && this.atkDown && (this.attacking = !0, this.game.sendKeyCommand(this.Types.SpecialAction.BEGIN_FIGHTING, this.Types.KeyAction.SPECIAL_ACTION), this.atkBtn.src = "./img/attack_pressed.png"), this.doNothing(a)
};
App.prototype.atkMouseUp = function(a) {
	return window.log.log(4, "atkMouseUp"), this.atkDown = !1, this.attacking = !1, this.game.sendKeyCommand(this.Types.SpecialAction.END_FIGHTING, this.Types.KeyAction.SPECIAL_ACTION), this.atkBtn.src = "./img/attack_released.png", this.doNothing(a)
};
App.prototype.adjustDirKeys = function(a, b) {
	for (var c = !1, d = this.dirKeys[b][a], e = 0; 3 > e; ++e)
		for (var f = 0; 3 > f; ++f) {
			var g = this.dirKeys[f][e];
			this.keysPressed[g] && (g === d ? c = !0 : (delete this.keysPressed[g], this.game.sendKeyCommand(g, this.Types.KeyAction.KEY_RELEASED)))
		}
	d && !c && (this.keysPressed[d] = !0, this.game.sendKeyCommand(d, this.Types.KeyAction.KEY_PRESSED));
	c = "/img/" + this.dirSrcs[b][a]; - 1 === this.dirpad.src.indexOf(c, !this.dirpad.src.length - c.length) && (this.dirpad.src = "." + c)
};
App.prototype.considerArrowKey = function() {
	var a = 0;
	this.dirmouse.x < this.dirSize ? a += 3 : this.dirmouse.x >= 2 * this.dirSize && (a += 6);
	this.dirmouse.y < this.dirSize && ++a;
	this.adjustDirKeys(~~(this.dirmouse.x / this.dirSize), ~~(this.dirmouse.y / this.dirSize))
};
App.prototype.getJavaMouseEvent = function(a, b) {
	this.playDummySound();
	var c = {
		x: this.mouse.x,
		y: this.mouse.y
	};
	return b ? c.button = 3 : a.button ? 2 === a.button ? c.button = 3 : c.button = a.button : c.button = 1, c
};
App.prototype.setMouseCoordinates = function(a, b, c) {
	return a.changedTouches && a.changedTouches.length ? a = a.changedTouches[0] : a.touches && a.touches.length && (a = a.touches[0]), (a.pageX || 0 === a.pageX) && (c.x = a.pageX - b.offsetLeft - b.clientLeft, c.y = a.pageY - b.offsetTop - b.clientTop, c.inBounds = 0 <= c.x && c.x < b.width && 0 <= c.y && c.y < b.height), c.inBounds
};
App.prototype.getKeyCode = function(a) {
	this.keySubs || (this.keySubs = {
		59: 186,
		61: 187,
		173: 189
	});
	a = a.which;
	return this.keySubs[a] && (a = this.keySubs[a]), a
};
App.prototype.keyCode2Ascii = function(a, b) {
	return this.key2Ascii || (this.key2Ascii = {
		8: 8,
		9: 9,
		13: 10,
		27: 27,
		32: 32,
		46: 127,
		48: 48,
		49: 49,
		50: 50,
		51: 51,
		52: 52,
		53: 53,
		54: 54,
		55: 55,
		56: 56,
		57: 57,
		65: 97,
		66: 98,
		67: 99,
		68: 100,
		69: 101,
		70: 102,
		71: 103,
		72: 104,
		73: 105,
		74: 106,
		75: 107,
		76: 108,
		77: 109,
		78: 110,
		79: 111,
		80: 112,
		81: 113,
		82: 114,
		83: 115,
		84: 116,
		85: 117,
		86: 118,
		87: 119,
		88: 120,
		89: 121,
		90: 122,
		96: 48,
		97: 49,
		98: 50,
		99: 51,
		100: 52,
		101: 53,
		102: 54,
		103: 55,
		104: 56,
		105: 57,
		106: 42,
		107: 43,
		109: 45,
		110: 46,
		111: 47,
		186: 59,
		187: 61,
		188: 44,
		189: 45,
		190: 46,
		191: 47,
		192: 96,
		219: 91,
		220: 92,
		221: 93,
		222: 39
	}, this.shift2Ascii = {
		8: 8,
		9: 9,
		13: 10,
		27: 27,
		32: 32,
		46: 127,
		48: 41,
		49: 33,
		50: 64,
		51: 35,
		52: 36,
		53: 37,
		54: 94,
		55: 38,
		56: 42,
		57: 40,
		65: 65,
		66: 66,
		67: 67,
		68: 68,
		69: 69,
		70: 70,
		71: 71,
		72: 72,
		73: 73,
		74: 74,
		75: 75,
		76: 76,
		77: 77,
		78: 78,
		79: 79,
		80: 80,
		81: 81,
		82: 82,
		83: 83,
		84: 84,
		85: 85,
		86: 86,
		87: 87,
		88: 88,
		89: 89,
		90: 90,
		96: 48,
		97: 49,
		98: 50,
		99: 51,
		100: 52,
		101: 53,
		102: 54,
		103: 55,
		104: 56,
		105: 57,
		106: 42,
		107: 43,
		109: 45,
		110: 46,
		111: 47,
		186: 58,
		187: 43,
		188: 60,
		189: 95,
		190: 62,
		191: 63,
		192: 126,
		219: 123,
		220: 124,
		221: 125,
		222: 34
	}), b ? this.shift2Ascii[a] : this.key2Ascii[a]
};
GameClient.prototype.Types = {
	ClientServerMessage: {
		FRAME_RECEIVED: 13,
		USER_INPUT: 14,
		CLIENT_STATUS: 22
	},
	ServerClientMessage: {
		ONE_FRAME_WITH_INFO: 12,
		CREATE_WINDOW: 20,
		ONE_FRAME_NO_INFO: 23
	},
	FrameCommands: {
		DRAW_FILLED_RECT_AT_Y_PLUS_ONE: 0,
		DRAW_FILLED_RECT_AT_BLOCK_XY: 1,
		DRAW_FILLED_RECT_AT_DY: 2,
		DRAW_FILLED_RECT_AT_X_PLUS_ONE: 3,
		DRAW_FILLED_RECT_AT_DX: 4,
		DRAW_FILLED_RECT_AT_XY: 5,
		SET_COLOR: 6,
		CACHE_CURRENT_COLOR: 7,
		SET_ON_SCREEN_TEXT: 8,
		MOVE_ON_SCREEN_TEXT: 9,
		DRAW_PIXEL: 18,
		COPY_AREA: 21,
		SUB_WINDOW: 24,
		SET_FILLED_RECT_SIZE: 25,
		USE_GLOBAL_RESOURCE: 26,
		DRAW_FILLED_RECT_AT_Y_PLUS_ONE_REPEAT: 27,
		SET_COLOR_BASED_ON_CACHE: 28,
		SET_COLOR_WITH_ALPHA: 29,
		COLOR_CACHE_COMMANDS_START: 30,
		COLOR_CACHE_COMMANDS_STOP: 256
	},
	SubWindowId: {
		MAIN_WINDOW_ID: 0,
		HIT_POINTS_WINDOW_ID: 1
	},
	Compression: {
		NOT_COMPRESSED_FLAG: 255
	},
	Font: {
		PLAIN_TEXT: 0,
		ITALIC: 1,
		BOLD: 2,
		SMALL: 3,
		NUM_FONTS: 4
	},
	OnScreenTextCode: {
		CLEAR_ALL_ON_SCREEN_TEXT: 0,
		ID_STATS_IN_LOWER_LEFT_WHITE: 2,
		ID_HINTS_IN_LOWER_LEFT_YELLOW: 3,
		ID_BROADCAST_MESSAGE: 4,
		ID_STATUS_IN_UPPER_LEFT_WHITE: 65001,
		CENTER_OF_SCREEN_Y: 65535
	},
	SubWindowAction: {
		CREATE_SUB_WINDOW: 0,
		SWITCH_TO_SUB_WINDOW: 1,
		SWITCH_BACK_TO_PREVIOUS_WINDOW: 2,
		DESTROY_SUB_WINDOW: 3
	},
	ResourceType: {
		RESOURCE_TYPE_IMAGE_NO_DATA: 0,
		RESOURCE_TYPE_PNG: 1,
		RESOURCE_TYPE_SOUND_EFFECT_NO_DATA: 2,
		RESOURCE_TYPE_SOUND_EFFECT: 3,
		RESOURCE_TYPE_MOVE_SOUND_EFFECT: 4,
		RESOURCE_TYPE_IMAGE_RAW: 5,
		RESOURCE_TYPE_STOP_SOUND_EFFECT: 6
	},
	BandwidthCheck: {
		PING_ID_BANDWIDTH_CHECK_LOW: 1,
		PING_ID_BANDWIDTH_CHECK_HIGH: 3
	}
};
GameClient.prototype.setGameAndFontSize = function(a, b, c) {
	if (!this.connection && (a == this.scaleUp && b == this.scaleDown || (this.scaleUp = a, this.scaleDown = b, this.app.resizeElements(), this.sizeX = this.preCanvas.width = this.app.canvas.width, this.sizeY = this.preCanvas.height = this.app.canvas.height, this.context.fillRect(0, 0, this.sizeX, this.sizeY), this.preContext.clearRect(0, 0, this.sizeX, this.sizeY)), c != this.fontSize)) {
		this.fontSize = c;
		for (a = this.Types.Font.NUM_FONTS - 1; 0 <= a; --a) this.fonts[a] = this.getFontMetrics(a);
		this.font = this.fonts[this.Types.Font.PLAIN_TEXT]
	}
};
GameClient.prototype.getFontMetrics = function(a) {
	var b = null,
		c = this.fontSize;
	switch (a) {
		case this.Types.Font.PLAIN_TEXT:
			break;
		case this.Types.Font.ITALIC:
			b = "italic";
			break;
		case this.Types.Font.BOLD:
			b = "bold";
			break;
		case this.Types.Font.SMALL:
			b = null;
			c -= Math.max(Math.round(.2 * c), 1);
			break;
		default:
			window.log.log(1, "Unexpected font style code: " + a)
	}
	a = c.toString() + "px sans-serif";
	b && (a = b + " " + a);
	this.preContext.font = a;
	b = Math.ceil(1.1 * this.preContext.measureText("M").width);
	c = Math.ceil(b / 4);
	return {
		asString: a,
		ascent: b,
		descent: c,
		height: b + c + 1,
		measureText: function(a, b) {
			return b.font = this.asString, b.measureText(a).width
		}
	}
};
GameClient.prototype.run = function(a, b, c, d, e, f, g, h, m, k) {
	window.log.log(4, "Preparing to start");
	this.playerName = "HACKED CLIENT";
	this.password = b;
	this.setGameAndFontSize(c, d, e);
	this.ipAddress = f;
	this.screenDefinition = g;
	this.encryptPassword = h;
	this.reloadOnDeath = m;
	this.javaVersion = k;
	this.setOnScreenMessage("");
	this.connection = new Connection(this);
	this.backlog = new Queue;
	this.whereInCommand = 0;
	this.connection.createSocket()
};
GameClient.prototype.onServerMessage = function(a) {
	if (!this.shuttingDown) {
		window.log.log(5, "onServerMessage start");
		try {
			for (var b = 0; b < a.length;) {
				if (a.length < b + 3) {
					window.log.log(1, "Message from server was too short to even specify length (" + a.length + ").");
					break
				}
				var c = 0,
					d = !0,
					e = a[b],
					f = a[b + 1],
					g = a[b + 2];
				if (e === this.Types.Compression.NOT_COMPRESSED_FLAG && (d = !1, e = 0), c = e, c *= 256, c += f, c *= 256, c += g, a.length < b + 3 + c) {
					window.log.log(1, "Declared length (" + c + ") of message from server extends beyond end of buffer (" + a.length + ") from offset " + b);
					break
				}
				var h = this.backlog.getLength();
				this.soundChanged && 3 > h && h <= this.lastFrameBacklogSent && 300 < this.getTimestamp() - this.lastSoundStore && this.app.storeSounds();
				var m = h != this.lastFrameBacklogSent;
				window.log.log(m && (7 < h || 7 < this.lastFrameBacklogSent) ? 3 : 5, "backlog: " + this.lastFrameBacklogSent + " -> " + h);
				m && (this.statusMix.setUint16(4, h, !1), this.connection.sendData(this.statusMix.buffer, "frameBacklog"), this.lastFrameBacklogSent = h);
				var k = new Uint8Array(a.buffer, b + 3, c),
					l = d ? (new Zlib.Inflate(k)).decompress(k) : k;
				l && 0 < l.length && (this.backlog.enqueue({
					bytes: l,
					mix: new DataView(l.buffer, l.byteOffset)
				}), 1 == this.backlog.getLength() && setTimeout(this.processServerCommand.bind(this), 0));
				b += 3 + c
			}
		} catch (n) {
			throw window.log.log(1, "Error parsing server message:\n" + n), this.stop(), n
		}
		window.log.log(5, "onServerMessage end")
	}
};
GameClient.prototype.processServerCommand = function() {
	if (!this.shuttingDown) {
		window.log.log(5, "processServerCommand start");
		try {
			switch (this.backlog.peek().bytes[0]) {
				case this.Types.ServerClientMessage.CREATE_WINDOW:
					this.onCreateWindowMessage();
					break;
				case this.Types.ServerClientMessage.ONE_FRAME_WITH_INFO:
				case this.Types.ServerClientMessage.ONE_FRAME_NO_INFO:
					this.onOneFrameMessage();
					break;
				default:
					window.log.log(1, "Unexpected message type from server: " + inflated[0])
			}
		} catch (a) {
			throw window.log.log(1, "Error processing command from server:\n" + a), this.stop(), a
		}
		window.log.log(5, "processServerCommand end")
	}
};
GameClient.prototype.onCreateWindowMessage = function() {
	window.log.log(4, "onCreateWindowMessage start");
	var a = this.backlog.peek(),
		b = a.bytes,
		c = a.mix,
		d = 1;
	if (this.windowId = b[d], ++d, this.title = this.stringFromLengthString(a, d), d += this.title.length + 2, this.sizeX = this.intFromTwoCharString(c, d), d += 2, this.sizeY = this.intFromTwoCharString(c, d), d += 2, 2 !== b[d]) throw "Unexpected input request from server.";
	this.allSubWindows = [];
	this.lastFrameBacklogSent = this.previousSubWindowId = this.largestValidSubwindowId = 0;
	this.sizeX = this.applyScaleUp(this.sizeX, !0);
	this.sizeY = this.applyScaleUp(this.sizeY, !0);
	this.app.resizeElements(this.sizeX, this.sizeY);
	a = new SubWindow(this, this.Types.SubWindowId.MAIN_WINDOW_ID, 0, 0, this.sizeX, this.sizeY);
	this.allSubWindows[a.id] = a;
	a.id > this.largestValidSubwindowId && (this.largestValidSubwindowId = a.id);
	this.activeSubWindow = a;
	this.colorCache = [];
	this.onScreenMessage = null;
	this.recalculateEntireScreenSize();
	this.repaintSmallX = this.entireScreenSizeX;
	this.repaintSmallY = this.entireScreenSizeY;
	this.repaintBigY = this.repaintBigX = 0;
	this.lastSoundStore = this.getTimestamp();
	this.app.bindGuiEvents();
	this.considerNextFrame();
	window.log.log(4, "onCreateWindowMessage end")
};
GameClient.prototype.considerNextFrame = function() {
	this.backlog.dequeue();
	0 !== this.backlog.getLength() ? setTimeout(this.processServerCommand.bind(this), 0) : this.connection.cleanCloseInitiated && this.stop()
};
GameClient.prototype.onOneFrameMessage = function() {
	window.log.log(5, "onOneFrameMessage start: " + this.whereInCommand);
	try {
		var a = (new Date).getTime(),
			b = this.backlog.peek(),
			c = b.bytes,
			d = b.mix;
		for (0 === this.whereInCommand && (this.commandType = c[this.whereInCommand], ++this.whereInCommand, this.numSubCommands = this.intFromThreeCharString(d, this.whereInCommand), this.subCommandIndex = -1, this.whereInCommand += 3, window.log.log(5, "Received 1-frame message: " + (this.commandType === this.Types.ServerClientMessage.ONE_FRAME_WITH_INFO) + ", " + this.numSubCommands)); ++this.subCommandIndex < this.numSubCommands;) {
			var e = c[this.whereInCommand];
			try {
				switch (window.log.log(6, "onOneFrameMessage start subCmd: " + e), e) {
					case this.Types.FrameCommands.DRAW_FILLED_RECT_AT_Y_PLUS_ONE:
					case this.Types.FrameCommands.DRAW_FILLED_RECT_AT_X_PLUS_ONE:
					case this.Types.FrameCommands.DRAW_FILLED_RECT_AT_DY:
					case this.Types.FrameCommands.DRAW_FILLED_RECT_AT_DX:
					case this.Types.FrameCommands.DRAW_FILLED_RECT_AT_XY:
					case this.Types.FrameCommands.DRAW_FILLED_RECT_AT_BLOCK_XY:
					case this.Types.FrameCommands.DRAW_FILLED_RECT_AT_Y_PLUS_ONE_REPEAT:
						var b = 1,
							f = 0,
							g = 0;
						switch (e) {
							case this.Types.FrameCommands.DRAW_FILLED_RECT_AT_Y_PLUS_ONE:
								g = 1;
								++this.whereInCommand;
								break;
							case this.Types.FrameCommands.DRAW_FILLED_RECT_AT_X_PLUS_ONE:
								f = 1;
								++this.whereInCommand;
								break;
							case this.Types.FrameCommands.DRAW_FILLED_RECT_AT_DY:
								window.log.checkValidPosition(this.whereInCommand + 1, c.length);
								g = c[this.whereInCommand + 1];
								this.whereInCommand += 2;
								break;
							case this.Types.FrameCommands.DRAW_FILLED_RECT_AT_DX:
								window.log.checkValidPosition(this.whereInCommand + 1, c.length);
								f = c[this.whereInCommand + 1];
								this.whereInCommand += 2;
								break;
							case this.Types.FrameCommands.DRAW_FILLED_RECT_AT_XY:
								window.log.checkValidPosition(this.whereInCommand + 4, c.length);
								this.posX = this.intFromTwoCharString(d, this.whereInCommand + 1);
								this.posY = this.intFromTwoCharString(d, this.whereInCommand + 3);
								this.whereInCommand += 5;
								break;
							case this.Types.FrameCommands.DRAW_FILLED_RECT_AT_BLOCK_XY:
								window.log.checkValidPosition(this.whereInCommand + 2, c.length);
								this.posX = c[this.whereInCommand + 1] * this.activeSubWindow.fillRectSizeX;
								this.posY = c[this.whereInCommand + 2] * this.activeSubWindow.fillRectSizeY;
								this.whereInCommand += 3;
								break;
							case this.Types.FrameCommands.DRAW_FILLED_RECT_AT_Y_PLUS_ONE_REPEAT:
								window.log.checkValidPosition(this.whereInCommand + 1, c.length);
								g = 1;
								b = c[this.whereInCommand + 1];
								this.whereInCommand += 2;
								break;
							default:
								window.log.log(1, "  DRAW_FILLED_RECT_[unknown]: " + e), ++this.whereInCommand
						}
						0 != g && (this.posY += g * this.activeSubWindow.fillRectSizeY + 10);
						0 != f && (this.posX += f * this.activeSubWindow.fillRectSizeX + 10);
						this.drawFilledRect(this.posX, this.posY, this.activeSubWindow.fillRectSizeX, this.activeSubWindow.fillRectSizeY * b, this.activeSubWindow.drawExtraXWhenScaling, this.activeSubWindow.drawExtraYWhenScaling);
						0 != g && 1 < b && (this.posY += g * this.activeSubWindow.fillRectSizeY * (b - 1));
						break;
					case this.Types.FrameCommands.SET_COLOR:
						window.log.checkValidPosition(this.whereInCommand + 3, c.length);
						l = this.getRgbaString(c[this.whereInCommand + 1], c[this.whereInCommand + 2], c[this.whereInCommand + 3], 1);
						this.activeSubWindow.setColor(l);
						this.whereInCommand += 4;
						break;
					case this.Types.FrameCommands.SET_COLOR_WITH_ALPHA:
						window.log.checkValidPosition(this.whereInCommand + 4, c.length);
						l = this.getRgbaString(c[this.whereInCommand + 1], c[this.whereInCommand + 2], c[this.whereInCommand + 3], c[this.whereInCommand + 4] / 255);
						this.activeSubWindow.setColor(l);
						this.whereInCommand += 5;
						break;
					case this.Types.FrameCommands.SET_COLOR_BASED_ON_CACHE:
						window.log.checkValidPosition(this.whereInCommand + 2, c.length);
						var h = c[this.whereInCommand + 1],
							m = c[this.whereInCommand + 2],
							k = this.colorCache[h],
							l = this.getRgbaString(k.r + ((m >> 5) - 4), k.g + (((31 & m) >> 2) - 4), k.b + ((3 & m) - 2), 1);
						this.activeSubWindow.setColor(l);
						this.whereInCommand += 3;
						break;
					case this.Types.FrameCommands.CACHE_CURRENT_COLOR:
						window.log.checkValidPosition(this.whereInCommand + 1, c.length);
						var h = c[this.whereInCommand + 1],
							n = (p = this.activeSubWindow.getColor()).substring(5, p.length - 1).split(","),
							l = {
								r: ~~n[0],
								g: ~~n[1],
								b: ~~n[2],
								a: n[3]
							};
						this.colorCache[h] = l;
						this.whereInCommand += 2;
						break;
					case this.Types.FrameCommands.SET_FILLED_RECT_SIZE:
						window.log.checkValidPosition(this.whereInCommand + 5, c.length);
						this.activeSubWindow.fillRectSizeX = this.intFromTwoCharString(d, this.whereInCommand + 1);
						this.activeSubWindow.fillRectSizeY = this.intFromTwoCharString(d, this.whereInCommand + 3);
						var r = c[this.whereInCommand + 5];
						this.activeSubWindow.drawExtraXWhenScaling = 0 != (1 & r);
						this.activeSubWindow.drawExtraYWhenScaling = 0 != (2 & r);
						this.whereInCommand += 6;
						break;
					case this.Types.FrameCommands.DRAW_PIXEL:
						window.log.checkValidPosition(this.whereInCommand + 4, c.length);
						this.drawFilledRect(this.intFromTwoCharString(d, this.whereInCommand + 1), this.intFromTwoCharString(d, this.whereInCommand + 3), 1, 1, !0, !0);
						this.whereInCommand += 5;
						break;
					case this.Types.FrameCommands.SET_ON_SCREEN_TEXT:
					case this.Types.FrameCommands.MOVE_ON_SCREEN_TEXT:
						this.onTextCommand();
						break;
					case this.Types.FrameCommands.SUB_WINDOW:
						this.onSubWindowCommand();
						break;
					case this.Types.FrameCommands.USE_GLOBAL_RESOURCE:
						this.onUseGlobalResourceCommand();
						break;
					case this.Types.FrameCommands.COPY_AREA:
						this.onCopyAreaCommand();
						break;
					default:
						if (window.log.checkValidPosition(this.whereInCommand, c.length), e < this.Types.FrameCommands.COLOR_CACHE_COMMANDS_START || e >= this.Types.FrameCommands.COLOR_CACHE_COMMANDS_STOP) throw "Unexpected server-client command code: " + e;
						var h = c[this.whereInCommand] - this.Types.FrameCommands.COLOR_CACHE_COMMANDS_START,
							l = this.colorCache[h],
							p = this.getRgbaString(l.r, l.g, l.b, l.a);
						this.activeSubWindow.setColor(p);
						++this.whereInCommand
				}
				window.log.log(6, "onOneFrameMessage end subCmd");
				var t = (new Date).getTime() - a;
				if (13 < t) return window.log.log(4, "onOneFrameMessage yielding after " + t + " ms (" + this.whereInCommand + " / " + c.length + " bytes)"), void setTimeout(this.onOneFrameMessage.bind(this), 0)
			} catch (w) {
				throw window.log.log(1, "Error processing command code " + e + ":\n" + w), w
			}
		}
		window.log.log(5, "onOneFrameMessage finished core frame");
		try {
			if (this.commandType === this.Types.ServerClientMessage.ONE_FRAME_WITH_INFO) {
				window.log.log(5, "onOneFrameMessage started ack check");
				var u = c[this.whereInCommand + 3];
				if (0 != u) {
					window.log.log(5, "  Sending ack");
					a = 0;
					u >= this.Types.BandwidthCheck.PING_ID_BANDWIDTH_CHECK_LOW && u <= this.Types.BandwidthCheck.PING_ID_BANDWIDTH_CHECK_HIGH && (a = 1024 << u - this.Types.BandwidthCheck.PING_ID_BANDWIDTH_CHECK_LOW);
					a = 5 + a;
					65535 < a && (a = 65535);
					var x = new ArrayBuffer(3 + a),
						q = new Uint8Array(x),
						v = new DataView(x);
					q[0] = this.Types.Compression.NOT_COMPRESSED_FLAG;
					v.setUint16(1, a, !1);
					q[3] = this.Types.ClientServerMessage.FRAME_RECEIVED;
					q[4] = c[this.whereInCommand];
					q[5] = c[this.whereInCommand + 1];
					q[6] = c[this.whereInCommand + 2];
					q[7] = u;
					for (var y = q.length - 1; 7 < y; --y) q[y] = ~~(256 * Math.random());
					this.connection.sendToServer(q, "frameAck");
					this.whereInCommand += 4
				}
				window.log.log(5, "onOneFrameMessage finished ack check")
			}
		} catch (w) {
			throw window.log.log(1, "Error sending frame acknowledgement:\n" + w), w
		}
		window.log.log(this.whereInCommand == c.length ? 6 : 2, "Finished sub-commands at position " + this.whereInCommand + "/" + c.length);
		this.repaintScene();
		this.whereInCommand = 0;
		this.considerNextFrame();
		window.log.log(5, "onOneFrameMessage end")
	} catch (w) {
		window.log.log(1, "Error processing a block of a frame command:\n" + w), this.stop()
	}
};
GameClient.prototype.onCopyAreaCommand = function() {
	var a = this.backlog.peek(),
		b = a.bytes,
		c = a.mix;
	window.log.checkValidPosition(this.whereInCommand + 14, b.length);
	var a = this.intFromTwoCharString(c, this.whereInCommand + 1),
		d = this.intFromTwoCharString(c, this.whereInCommand + 3),
		e = this.intFromTwoCharString(c, this.whereInCommand + 5),
		f = this.intFromTwoCharString(c, this.whereInCommand + 7),
		g = this.intFromTwoCharString(c, this.whereInCommand + 9),
		c = this.intFromTwoCharString(c, this.whereInCommand + 11);
	0 != b[this.whereInCommand + 13] && (g = -g);
	0 != b[this.whereInCommand + 14] && (c = -c);
	a = this.applyScaleUp(a, !1);
	d = this.applyScaleUp(d, !1);
	e = this.applyScaleUp(e, !1);
	f = this.applyScaleUp(f, !1);
	this.totalCopyDx += g;
	this.totalCopyDy += c;
	g = this.applyScaleUp(g, !1);
	c = this.applyScaleUp(c, !1);
	this.needsSpecialScaling() && (this.scrollingRight = 0 > g, this.scrollingDown = 0 > c, 0 != this.totalCopyDx * this.scaleUp % this.scaleDown && (0 < g && g++, 0 > g && g--), 0 != this.totalCopyDy * this.scaleUp % this.scaleDown && (0 < c && c++, 0 > c && c--));
	this.activeSubWindow.copyArea(a, d, e, f, g, c);
	this.updatePaintArguments(a + g + this.activeSubWindow.x, d + c + this.activeSubWindow.y, e, f);
	this.whereInCommand += 15
};
GameClient.prototype.needsSpecialScaling = function() {
	return 2 == this.activeSubWindow.fillRectSizeX && 4 == this.scaleDown && (3 == this.scaleUp || 5 == this.scaleUp || 7 == this.scaleUp)
};
GameClient.prototype.onTextCommand = function() {
	var a = this.backlog.peek(),
		b = a.bytes,
		c = a.mix;
	window.log.checkValidPosition(this.whereInCommand + 7, b.length);
	var d = b[this.whereInCommand],
		e = this.intFromTwoCharString(c, this.whereInCommand + 1),
		f = this.intFromTwoCharString(c, this.whereInCommand + 3),
		c = this.intFromTwoCharString(c, this.whereInCommand + 5),
		g = b[this.whereInCommand + 7];
	this.whereInCommand += 8;
	var h = null,
		m = null;
	d === this.Types.FrameCommands.SET_ON_SCREEN_TEXT && (window.log.checkValidPosition(this.whereInCommand + 2, b.length), m = b[this.whereInCommand], b[this.whereInCommand + 1], h = this.stringFromLengthString(a, this.whereInCommand + 2), this.whereInCommand += h.length + 4);
	e !== this.Types.OnScreenTextCode.ID_BROADCAST_MESSAGE ? (a = c === this.Types.OnScreenTextCode.CENTER_OF_SCREEN_Y, f = this.applyScaleUp(f, !1), c = this.applyScaleUp(c, !1), d = this.activeSubWindow.processOnScreenTextCommand(e, d, h, f, c, g, m, a), this.updatePaintArguments(d.x, d.y, d.width, d.height)) : this.setOnScreenMessage(h)
};
ArrayBuffer.prototype.slice || (ArrayBuffer.prototype.slice = function(a, b) {
	var c = new Uint8Array(this);
	void 0 == b && (b = c.length);
	for (var d = new ArrayBuffer(b - a), e = new Uint8Array(d), f = e.length - 1; 0 <= f; --f) e[f] = c[f + a];
	return d
});
GameClient.prototype.onUseGlobalResourceCommand = function() {
	var a = this.backlog.peek(),
		b = a.bytes,
		c = a.mix;
	window.log.checkValidPosition(this.whereInCommand + 3, b.length);
	a = {
		id: this.intFromTwoCharString(c, this.whereInCommand + 1),
		type: b[this.whereInCommand + 3]
	};
	window.log.log(4, "RESOURCE: " + a.type);
	var d = 0;
	switch (a.type) {
		case this.Types.ResourceType.RESOURCE_TYPE_IMAGE_RAW:
			window.log.checkValidPosition(this.whereInCommand + 10 + 1, b.length);
			a.x = this.intFromTwoCharString(c, this.whereInCommand + 4);
			a.y = this.intFromTwoCharString(c, this.whereInCommand + 6);
			var e = b[this.whereInCommand + 10],
				c = b[this.whereInCommand + 10 + 1],
				d = 4 * e * c;
			window.log.checkValidPosition(this.whereInCommand + 10 + 1 + d, b.length);
			b = new Uint8Array(b.buffer.slice(this.whereInCommand + 10 + 2, this.whereInCommand + 10 + 2 + d));
			this.whereInCommand += 12 + d;
			var f = this.applyScaleUp(e, !1),
				g = this.applyScaleUp(c, !1),
				d = document.createElement("canvas");
			d.width = f;
			d.height = g;
			f = d.getContext("2d");
			this.scaleImage(b, e, c, f);
			this.globalResourceCache[a.id] = d;
			this.useResource(a);
			break;
		case this.Types.ResourceType.RESOURCE_TYPE_IMAGE_NO_DATA:
			window.log.checkValidPosition(this.whereInCommand + 9, b.length);
			a.x = this.intFromTwoCharString(c, this.whereInCommand + 4);
			a.y = this.intFromTwoCharString(c, this.whereInCommand + 6);
			this.whereInCommand += 8;
			this.useResource(a);
			break;
		case this.Types.ResourceType.RESOURCE_TYPE_SOUND_EFFECT:
			e = !0;
		case this.Types.ResourceType.RESOURCE_TYPE_SOUND_EFFECT_NO_DATA:
			window.log.checkValidPosition(this.whereInCommand + 7, b.length);
			a.pan = this.doubleFromChar(b[this.whereInCommand + 4]);
			f = this.doubleFromChar(b[this.whereInCommand + 5], 80);
			a.volume = Math.pow(10, f / 20);
			1 < a.volume && (a.volume = 1);
			a.instanceId = this.intFromTwoCharString(c, this.whereInCommand + 6);
			this.whereInCommand += 8;
			e ? (window.log.checkValidPosition(this.whereInCommand + 1, b.length), d = this.intFromTwoCharString(c, this.whereInCommand), window.log.checkValidPosition(this.whereInCommand + 1 + d, b.length), a.name = this.asciiBuffer2String(b, this.whereInCommand + 2, d), this.whereInCommand += 2 + d, this.loadSoundData(a)) : this.useResource(a);
			break;
		case this.Types.ResourceType.RESOURCE_TYPE_STOP_SOUND_EFFECT:
			window.log.checkValidPosition(this.whereInCommand + 7, b.length);
			e = this.intFromTwoCharString(c, this.whereInCommand + 6);
			if ((a = this.globalResourceCache[a.id]) && a.playing) {
				if (c = a.playing[e])
					if (c.sourceNode) c.sourceNode.stop ? c.sourceNode.stop(0) : c.sourceNode.noteOff ? c.sourceNode.noteOff(0) : window.log.log(2, "Failed to stop web audio API sound.");
					else if (c.audio)
					if (c.audio.pause) {
						c.audio.pause();
						try {
							c.audio.currentTime = 0
						} catch (h) {
							c.audio.muted = !0, c.audio.play()
						}
					} else window.log.log(2, "Failed to stop basic sound.");
				else window.log.log(2, "Failed to stop unknown sound");
				delete a.playing[e]
			}
			this.whereInCommand += 8;
			break;
		default:
			window.log.checkValidPosition(this.whereInCommand + 7, b.length), window.log.log(2, "Unexpected resource type: " + a.type), this.whereInCommand += 8
	}
};
GameClient.prototype.bilinear = function(a, b, c, d, e, f) {
	var g, h, m = function(a, b, c, d, e, f) {
			var g = 1 - e,
				h = 1 - f;
			return a * g * h + b * e * h + c * g * f + d * e * f
		},
		k = e / b;
	for (g = 0; g < f; ++g) {
		var l = g / k;
		var n = Math.floor(l);
		var r = Math.ceil(l) > c - 1 ? c - 1 : Math.ceil(l);
		for (h = 0; h < e; ++h) {
			var p = h / k;
			var t = Math.floor(p);
			var u = Math.ceil(p) > b - 1 ? b - 1 : Math.ceil(p);
			var x = 4 * (h + e * g);
			var q = 4 * (t + b * n);
			var v = 4 * (u + b * n);
			var y = 4 * (t + b * r);
			u = 4 * (u + b * r);
			p -= t;
			t = l - n;
			var w = m(a[q], a[v], a[y], a[u], p, t);
			d[x] = w;
			w = m(a[q + 1], a[v + 1], a[y + 1], a[u + 1], p, t);
			d[x + 1] = w;
			w = m(a[q + 2], a[v + 2], a[y + 2], a[u + 2], p, t);
			d[x + 2] = w;
			q = m(a[q + 3], a[v + 3], a[y + 3], a[u + 3], p, t);
			d[x + 3] = q
		}
	}
};
GameClient.prototype.scaleImage = function(a, b, c, d) {
	var e = d.canvas;
	var f = e.width;
	var g = e.height,
		e = f / b;
	if (1 === e) {
		for (b = (f = d.getImageData(0, 0, f, g)).data.length; 0 <= b; --b) f.data[b] = a[b];
		d.putImageData(f, 0, 0)
	} else {
		var h = Math.floor(e),
			e = h ? h * b : f,
			h = h ? h * c : g,
			m = Math.floor((f - e) / 2),
			g = Math.floor((g - h) / 2);
		f = d.getImageData(m, g, e, h);
		this.bilinear(a, b, c, f.data, e, h);
		d.putImageData(f, m, g)
	}
};
GameClient.prototype.loadSoundData = function(a) {
	window.log.log(4, "loadSoundData: " + a.name);
	this.globalResourceCache[a.id] ? this.useResource(a) : (a.url = this.resourceUrlBase + a.name + this.audioExt, (new SoundLoadHelper(this, a)).go())
};
GameClient.prototype.soundEnded = function() {
	delete this.resourceDef.resourceCore.playing[this.resourceDef.instanceId]
};
GameClient.prototype.getTimestamp = function() {
	return ~~((new Date).getTime() / 1E3)
};
GameClient.prototype.useResource = function(a) {
	try {
		window.log.log(4, "useResource start: " + a.id + "/" + a.type);
		var b = this.globalResourceCache[a.id];
		if (!b) return;
		switch (a.type) {
			case this.Types.ResourceType.RESOURCE_TYPE_IMAGE_RAW:
			case this.Types.ResourceType.RESOURCE_TYPE_IMAGE_NO_DATA:
				var c = this.applyScaleUp(a.x, !1),
					d = this.applyScaleUp(a.y, !1);
				this.activeSubWindow.drawImage(b, c, d);
				this.updatePaintArguments(c + this.activeSubWindow.x, d + this.activeSubWindow.y, b.width, b.height);
				break;
			case this.Types.ResourceType.RESOURCE_TYPE_SOUND_EFFECT_NO_DATA:
			case this.Types.ResourceType.RESOURCE_TYPE_SOUND_EFFECT:
				if (a.resourceCore = b, b.audios) {
					for (var c = null, e = b.audios.length - 1; 0 <= e; --e) {
						var f = b.audios[e];
						if ((f.ended || !f.currentTime) && !f.seeking) {
							(c = b.audios[e]).muted = !1;
							window.log.log(4, "basic sound(" + a.id + "): " + e);
							break
						}
					}
					c || (window.log.log(4, "basic sound(" + a.id + "): adding " + b.audios.length), (c = new Audio(b.url)).addEventListener("ended", this.soundEnded), b.audios.push(c));
					c.resourceDef = a;
					c.volume = a.volume;
					a.audio = c;
					b.playing[a.instanceId] = a;
					c.play()
				} else {
					var g = b.name,
						h = this.app.localSounds[g];
					if (h) {
						var m = this.getTimestamp();
						h.time = m;
						this.app.changedSounds[g] || (this.app.changedSounds[g] = 1);
						this.soundChanged = !0
					}
					var k = this.audioContext.createPanner(),
						l = a.pan / 127,
						n = Math.sqrt(1 - l * l),
						l = l / a.volume,
						n = n / a.volume;
					k.setPosition(l, n, 5);
					k.aberothCoords = l + ", " + n + ", 0";
					a.panNode = k;
					k.connect(this.audioContext.destination);
					window.log.log(4, "webaudio sound(" + a.id + "): " + a.gainDb + " / " + a.volume + "/" + a.pan + " / " + (a.panNode ? a.panNode.aberothCoords : "null"));
					var r = this.audioContext.createBufferSource();
					r.buffer = b.buffer;
					r.resourceDef = a;
					b.playing[a.instanceId] = a;
					r.addEventListener ? r.addEventListener("onended", this.soundEnded) : setTimeout(this.soundEnded.bind(r), 1E3 * r.buffer.duration);
					r.connect(k);
					a.sourceNode = r;
					r.start ? r.start(0) : r.noteOn(0)
				}
				break;
			case this.Types.ResourceType.RESOURCE_TYPE_MOVE_SOUND_EFFECT:
				break;
			default:
				window.log.log(2, "Unexpected resource type: " + a.type)
		}
	} catch (p) {
		throw window.log.log(1, "Error using resource:\n" + p), p
	}
	window.log.log(4, "useResource end")
};
GameClient.prototype.onSubWindowCommand = function() {
	var a = this.backlog.peek(),
		b = a.bytes,
		c = a.mix;
	window.log.checkValidPosition(this.whereInCommand + 8, b.length);
	var d = b[this.whereInCommand + 4],
		a = b[this.whereInCommand + 8];
	switch (this.whereInCommand += 12, d) {
		case this.Types.SubWindowAction.CREATE_SUB_WINDOW:
			window.log.checkValidPosition(this.whereInCommand + 28, b.length);
			var b = this.intFromTwoCharString(c, this.whereInCommand),
				d = this.intFromTwoCharString(c, this.whereInCommand + 8),
				e = this.intFromTwoCharString(c, this.whereInCommand + 16),
				f = this.intFromTwoCharString(c, this.whereInCommand + 24);
			this.whereInCommand += 32;
			b = this.applyScaleUp(b, !4);
			d = this.applyScaleUp(d, !4);
			e = this.applyScaleUp(e, !0);
			f = this.applyScaleUp(f, !0);
			c = this.allSubWindows[a];
			a = new SubWindow(this, a, b, d, e, f);
			this.allSubWindows[a.id] = a;
			c && c.destroyWindow();
			a.id > this.largestValidSubwindowId && (this.largestValidSubwindowId = a.id);
			this.recalculateEntireScreenSize();
			this.previousSubWindowId = this.activeSubWindow.id;
			this.activeSubWindow = a;
			break;
		case this.Types.SubWindowAction.SWITCH_TO_SUB_WINDOW:
			this.previousSubWindowId = this.activeSubWindow.id;
			this.activeSubWindow = this.allSubWindows[a];
			break;
		case this.Types.SubWindowAction.SWITCH_BACK_TO_PREVIOUS_WINDOW:
			a = this.activeSubWindow.id;
			this.activeSubWindow = this.allSubWindows[this.previousSubWindowId];
			this.previousSubWindowId = a;
			break;
		case this.Types.SubWindowAction.DESTROY_SUB_WINDOW:
			c = this.allSubWindows[a];
			this.allSubWindows[a] = null;
			null != c && c.destroyWindow();
			this.recalculateEntireScreenSize();
			break;
		default:
			window.log.log(1, "  SUB_WINDOW ??: " + a)
	}
};
GameClient.prototype.drawFilledRect = function(a, b, c, d, e, f) {
	if (this.needsSpecialScaling()) {
		var g;
		this.scrollingRight ? (g = !0, 0 != this.totalCopyDx * this.scaleUp % this.scaleDown && (g = !1)) : (g = !1, 0 != this.totalCopyDx * this.scaleUp % this.scaleDown && (g = !0));
		var h;
		var m = this.applyScaleUp(a, g);
		this.scrollingDown ? (h = !0, 0 != this.totalCopyDy * this.scaleUp % this.scaleDown && (h = !1)) : (h = !1, 0 != this.totalCopyDy * this.scaleUp % this.scaleDown && (h = !0));
		var k = this.applyScaleUp(b, h);
		c = this.applyScaleUp(a + c, g);
		b = this.applyScaleUp(b + d, h)
	} else m = this.applyScaleUp(a, !e), k = this.applyScaleUp(b, !f), c = this.applyScaleUp(a + c, e), b = this.applyScaleUp(b + d, f);
	c -= m;
	d = b - k;
	this.activeSubWindow.fillRect(m, k, c, d);
	this.updatePaintArguments(m + this.activeSubWindow.x, k + this.activeSubWindow.y, c, d)
};
GameClient.prototype.stop = function(a, b) {
	this.shuttingDown || (window.log.log(3, "Client shutting down"), this.shuttingDown = !0, this.app.stop(), this.connection && (this.connection.shutDown(), this.connection = null), a || this.connection && this.connection.suppressShutdownMessage || this.setOnScreenMessage("Session has ended."), b ? document.location.reload() : this.died && this.reloadOnDeath && setTimeout(function() {
		document.location.reload()
	}, 0))
};
GameClient.prototype.setOnScreenMessage = function(a) {
	(a || this.onScreenMessage) && a !== this.onScreenMessage && ((window.log.log(4, "setOnScreenMessage start: " + a), this.onScreenMessage = a, null != this.windowId) ? (this.updatePaintArguments(0, 0, this.entireScreenSizeX, this.font ? this.font.height + 5 : 50), this.repaintScene()) : (this.context.fillStyle = "rgba(0,0,0,1)", this.context.fillRect(0, 0, this.sizeX, this.sizeY), a = this.getMessageToDisplay(), 0 < a.length && (this.preContext.clearRect(0, 0, this.sizeX, this.sizeY), this.drawOnScreenMessage(a, 0), this.context.drawImage(this.preCanvas, 0, 0, this.sizeX, this.sizeY, 0, 0, this.sizeX, this.sizeY))), window.log.log(4, "setOnScreenMessage end"))
};
GameClient.prototype.getMessageToDisplay = function() {
	var a = this.onScreenMessage;
	return a || (a = ""), a
};
GameClient.prototype.drawOnScreenMessage = function(a, b) {
	if (a) {
		this.preContext.font = this.font.asString;
		this.preContext.fillStyle = "rgba(0,0,0,1)";
		var c = ~~((b - (this.font.measureText(a, this.context) + 2)) / 2);
		1 > c && (c = 1);
		for (var d = c + 5, e = d - 3; e < d; ++e)
			for (var f = this.font.height + 4, g = f - 3; g < f; ++g) this.preContext.fillText(a, e, g);
		this.preContext.fillStyle = "rgba(255,255,255,1)";
		this.preContext.fillText(a, c + 3, this.font.height + 2)
	}
};
GameClient.prototype.greatestSubWindow = function(a, b) {
	if (this.app.keysPressed[17]) return 0;
	for (var c = this.largestValidSubwindowId; 0 < c; --c) {
		var d = this.allSubWindows[c];
		if (d && a >= d.x && a < d.x + d.width && b >= d.y && b < d.y + d.height) return c
	}
	return 0
};
GameClient.prototype.recalculateEntireScreenSize = function() {
	for (var a = 0, b = 0, c = this.largestValidSubwindowId; 0 <= c; --c) {
		var d = this.allSubWindows[c];
		d && (d.x + d.width > a && (a = d.x + d.width), d.y + d.height > b && (b = d.y + d.height))
	}
	this.entireScreenSizeX == a && this.entireScreenSizeY == b || (this.entireScreenSizeX = a, this.entireScreenSizeY = b);
	this.updatePaintArguments(0, 0, this.entireScreenSizeX, this.entireScreenSizeY)
};
GameClient.prototype.repaintScene = function() {
	var a = {
		xMin: this.repaintSmallX,
		yMin: this.repaintSmallY,
		xMax: this.repaintBigX,
		yMax: this.repaintBigY
	};
	if (a.dx = a.xMax - a.xMin, a.dy = a.yMax - a.yMin, 0 < a.dx && 0 < a.dy) {
		0 < a.xMin && (--a.xMin, ++a.dx);
		a.xMin + a.dx < this.entireScreenSizeX && ++a.dx;
		0 < a.yMin && (--a.yMin, ++a.dy);
		a.yMin + a.dy < this.entireScreenSizeY && ++a.dy;
		this.preContext.clearRect(a.xMin, a.yMin, a.dx, a.dy);
		for (var b = 0; b <= this.largestValidSubwindowId; ++b) {
			var c = this.allSubWindows[b];
			c && c.drawOntoMainWindow(this.preContext, a)
		}
		null != this.onScreenMessage && (b = this.getMessageToDisplay(), this.drawOnScreenMessage(b, this.entireScreenSizeX));
		0 < a.dx && 0 < a.dy && this.context.drawImage(this.preCanvas, a.xMin, a.yMin, a.dx, a.dy, a.xMin, a.yMin, a.dx, a.dy)
	}
	this.repaintSmallX = this.entireScreenSizeX;
	this.repaintSmallY = this.entireScreenSizeY;
	this.repaintBigY = this.repaintBigX = 0
};
GameClient.prototype.updatePaintArguments = function(a, b, c, d) {
	a + c > this.repaintBigX && (this.repaintBigX = Math.min(a + c, this.entireScreenSizeX));
	b + d > this.repaintBigY && (this.repaintBigY = Math.min(b + d, this.entireScreenSizeY));
	b < this.repaintSmallY && (this.repaintSmallY = Math.max(b, 0));
	a < this.repaintSmallX && (this.repaintSmallX = Math.max(a, 0))
};
GameClient.prototype.applyScaleUp = function(a, b) {
	var c = a * this.scaleUp,
		d = ~~(c / this.scaleDown);
	return b && 0 != c % this.scaleDown && ++d, d
};
GameClient.prototype.applyScaleDown = function(a) {
	return ~~(a * this.scaleDown / this.scaleUp)
};
GameClient.prototype.getRgbaString = function(a, b, c, d) {
	return "rgba(" + a + "," + b + "," + c + "," + d + ")"
};
GameClient.prototype.intFromThreeCharString = function(a, b) {
	return (a.getUint16(b, !1) << 8) + a.getUint8(b + 2)
};
GameClient.prototype.intFromTwoCharString = function(a, b) {
	return a.getUint16(b, !1)
};
GameClient.prototype.doubleFromChar = function(a, b) {
	var c = 128 > a ? a : a - 256;
	return -128 === c && (c = -127), b ? c * b / 127 : c
};
GameClient.prototype.stringFromLengthString = function(a, b) {
	var c = this.intFromTwoCharString(a.mix, b);
	return this.asciiBuffer2String(a.bytes, b + 2, c)
};
GameClient.prototype.asciiBuffer2String = function(a, b, c) {
	var d = "",
		e = b;
	for (b += c; e < b; ++e) d += String.fromCharCode(a[e]);
	return d
};
GameClient.prototype.disableImageSmoothing = function(a) {
	a.imageSmoothingEnabled = !1;
	a.ImageSmoothingEnabled = !1;
	a.mozImageSmoothingEnabled = !1;
	a.webkitImageSmoothingEnabled = !1
};
GameClient.prototype.sendKeyCommand = function(a, b) {
	this.shuttingDown || (this.keyBytes[9] = a, this.keyBytes[10] = b, this.connection.sendToServer(this.keyBytes.buffer, "key"))
};
GameClient.prototype.sendMouseCommand = function(a, b, c) {
	if (this.shuttingDown) return -1;
	var d = a.x,
		e = a.y,
		f = this.greatestSubWindow(d, e);
	c && f && (a.button = 3);
	a = a.button;
	return d -= this.allSubWindows[f].x, e -= this.allSubWindows[f].y, d = this.applyScaleDown(d), e = this.applyScaleDown(e), this.sendMouseCommandInner(f, a, b, d, e), f
};
GameClient.prototype.sendMouseCommandInner = function(a, b, c, d, e) {
	this.shuttingDown || (this.mouseBytes[9] = a, this.mouseBytes[10] = b, this.mouseBytes[11] = c, this.mouseMix.setUint16(12, d, !1), this.mouseMix.setUint16(14, e, !1), this.connection.sendToServer(this.mouseBytes.buffer, "mouse"))
};
SoundLoadHelper.prototype.fromStored = function(a) {
	var b = a.charCodeAt(0),
		c = 65535 === b ? 0 : 1,
		d = new ArrayBuffer(2 * a.length - 2 + c),
		e = new DataView(d);
	c && e.setUint8(0, b);
	for (var b = c, c = 1, f = a.length; c < f; ++c) {
		var g = a.charCodeAt(c);
		e.setUint16(b, g, !1);
		b += 2
	}
	return d
};
SoundLoadHelper.prototype.toStored = function(a) {
	var b = 1 & a.byteLength,
		c = new DataView(a),
		d = String.fromCharCode(b ? c.getUint8(0) : 65535);
	for (a = a.byteLength; b < a; b += 2) var e = c.getUint16(b, !1),
		d = d + String.fromCharCode(e);
	return d
};
SoundLoadHelper.prototype.go = function() {
	window.log.log(4, "SoundLoadHelper.go start");
	this.localStorage ? this.onLoad() : (window.log.log(3, "SoundLoadHelper requesting from server: " + this.resourceDef.name), this.request = new XMLHttpRequest, this.request.open("GET", this.resourceDef.url, !0), this.request.responseType = "arraybuffer", this.request.onload = this.onLoad.bind(this), this.request.onerror = this.onError.bind(this), this.request.send());
	window.log.log(4, "SoundLoadHelper.go end")
};
SoundLoadHelper.prototype.onLoad = function(a) {
	window.log.log(4, "SoundLoadHelper.onLoad start");
	try {
		var b = this.client,
			c = (this.request.response, this.resourceDef);
		if (200 !== this.request.status && 0 !== this.request.status) this.onError("request status " + this.request.status);
		else {
			var d = new Audio(c.url),
				e = {
					url: c.url,
					audios: [d],
					playing: {},
					name: c.name
				};
			d.addEventListener("ended", GameClient.prototype.soundEnded);
			b.globalResourceCache[c.id] = e;
			b.useResource(c)
		}
	} catch (f) {
		window.log.log(1, "SoundLoadHelper.onLoad error: " + f)
	}
	window.log.log(4, "SoundLoadHelper.onLoad end")
};
SoundLoadHelper.prototype.onDecode = function(a) {
	window.log.log(4, "SoundLoadHelper.onDecode start");
	try {
		this.client.globalResourceCache[this.resourceDef.id] = {
			url: this.resourceDef.url,
			buffer: a,
			playing: {},
			name: this.resourceDef.name
		}, window.log.log(4, "playing " + this.resourceDef.id + "/" + this.resourceDef.name), this.client.useResource(this.resourceDef)
	} catch (b) {
		window.log.log(1, "SoundLoadHelper.onDecode error: " + b)
	}
	window.log.log(4, "SoundLoadHelper.onDecode end")
};
SoundLoadHelper.prototype.onError = function(a) {
	window.log.log(4, "SoundLoadHelper.onError start");
	window.log.log(1, "Failed to load sound: " + this.resourceDef.url);
	this.localStorage && (window.log.log(2, "Refetching failed sound from server..."), this.localStorage = !1, this.client.app.deleteSound(this.resourceDef.name, !0), setTimeout(this.go.bind(this), 0));
	window.log.log(4, "SoundLoadHelper.onError end")
};
Connection.prototype.Types = {
	Handshake: {
		HANDSHAKE_MESSAGE_ERROR_STRING: 0,
		HANDSHAKE_MESSAGE_SUCCESS: 1,
		HANDSHAKE_MESSAGE_DISPLAY_STRING: 2,
		HANDSHAKE_MESSAGE_WAIT_IN_LINE: 3,
		HANDSHAKE_MESSAGE_LINE_TOO_LONG: 4,
		HANDSHAKE_MESSAGE_PASSWORD_CHALLENGE: 5
	},
	Heartbeat: {
		CLIENT_HEARTBEAT_SECONDS: 30,
		HEARTBEAT_STATUS_SIGNAL: 65E3
	}
};
Connection.prototype.createSocket = function() {
	window.log.log(4, "Connection.createSocket");
	var a = this.client.javaVersion;
	a || (a = "js_compress");
	this.handshakeBytes = this.ascii2ArrayBuffer(this.client.playerName + "\x00" + (this.client.password && this.client.encryptPassword ? "encryptMD5" : this.client.password) + "\x00" + this.client.screenDefinition + "\x00" + this.client.scaleUp + "\x00" + this.client.scaleDown + "\x00" + this.client.fontSize + "\x00Windows\x00" + a + "\x00false\x00false\x000\x00true\x00");
	this.socket = new WebSocket("ws://" + this.client.ipAddress + ":80/GameClientHTML5");
	this.socket.binaryType = "arraybuffer";
	this.socket.onopen = this.onSocketOpen.bind(this);
	this.socket.onmessage = this.onSocketMessage.bind(this);
	this.socket.onerror = this.onSocketError.bind(this);
	this.socket.onclose = this.onSocketClose.bind(this)
};
Connection.prototype.onSocketOpen = function(a) {
	if (window.log.log(3, "Connected to Aberoth server."), !this.handshakeBytes) return window.log.log(1, "Socket was opened, but handshake wasn't ready."), void this.shutDown();
	this.sendData(this.handshakeBytes, "handshake");
	this.isListening = !0
};
Connection.prototype.onSocketMessage = function(a) {
	if (this.isListening) {
		if (!(a.data instanceof ArrayBuffer)) return window.log.log(1, "Expected server message to be an ArrayBuffer."), void this.shutDown();
		a = new Uint8Array(a.data);
		if (this.lastHandshakeMessageReceived != this.Types.Handshake.HANDSHAKE_MESSAGE_SUCCESS) return window.log.log(4, "Connection.onSocketMessage: handshake"), void this.receiveHandshake(a);
		this.client.onServerMessage(a)
	} else window.log.log(4, "Connection.onSocketMessage: [not listening]")
};
Connection.prototype.onSocketError = function(a) {
	window.log.log(1, "Aberoth socket error");
	this.shutDown()
};
Connection.prototype.onSocketClose = function() {
	window.log.log(3, "Connection closed");
	this.cleanCloseInitiated || this.shutDown()
};
Connection.prototype.receiveHandshake = function(a) {
	window.log.log(4, "Connection.receiveHandshake");
	var b = a[0];
	a = this.client.asciiBuffer2String(a, 1, a.length - 2);
	switch (b) {
		case this.Types.Handshake.HANDSHAKE_MESSAGE_SUCCESS:
		case this.Types.Handshake.HANDSHAKE_MESSAGE_ERROR_STRING:
		case this.Types.Handshake.HANDSHAKE_MESSAGE_DISPLAY_STRING:
			var c = a;
			break;
		case this.Types.Handshake.HANDSHAKE_MESSAGE_WAIT_IN_LINE:
			c = "";
			0 === a ? c = "You are at the front of the line to get in." : 1 == a ? c = "There is one player in line ahead of you." : 1 < a && (c = "There are " + a + " players in line ahead of you.");
			c = "Aberoth is filled to capacity.  " + c + "  Please wait...";
			break;
		case this.Types.Handshake.HANDSHAKE_MESSAGE_LINE_TOO_LONG:
			c = "The line to get in to Aberoth is full (" + a + " players).  Please try again later.";
			break;
		case this.Types.Handshake.HANDSHAKE_MESSAGE_PASSWORD_CHALLENGE:
			var d = MD5(this.client.password + a);
			break;
		default:
			c = "Unexpected handshake response: " + b + " (" + a + ")", b = this.Types.Handshake.HANDSHAKE_MESSAGE_ERROR_STRING
	}
	this.lastHandshakeMessageReceived = b;
	c && this.client.setOnScreenMessage(c);
	d = this.ascii2ArrayBuffer(d ? d + "\x00" : "\x00");
	this.sendData(d, "handshakeAck");
	b === this.Types.Handshake.HANDSHAKE_MESSAGE_ERROR_STRING ? this.shutDown(!0) : b === this.Types.Handshake.HANDSHAKE_MESSAGE_SUCCESS && (window.log.log(5, "completed handshake"), this.totalBytesRead = 0, this.totalBytesWritten = 0, this.lastBytesWritten = 0, this.heartbeatSenderHandle = setInterval(this.sendHeartbeat.bind(this), 1E3 * this.Types.Heartbeat.CLIENT_HEARTBEAT_SECONDS), this.initializationComplete = !0, this.client.app.startSucceeded())
};
Connection.prototype.sendData = function(a, b) {
	if (this.socket && 1 === this.socket.readyState) {
		if (a instanceof ArrayBuffer) {
			window.log.log(7, "Connection.sendData: Received buffer.");
			var c = a
		} else {
			if (!a.buffer) return window.log.log(1, "Connection.sendData: ERROR Unexpected data format."), void this.shutDown();
			window.log.log(7, "Connection.sendData: Got buffer from view.");
			c = a.buffer
		}
		this.socket.send(c)
	}
};
Connection.prototype.sendToServer = function(a, b) {
	this.sendData(a, b);
	this.totalBytesWritten += a.length
};
Connection.prototype.sendHeartbeat = function() {
	var a = this.lastBytesWritten === this.totalBytesWritten;
	window.log.log(4, "Connection.sendHeartbeat: " + a);
	a ? this.sendData(this.heartbeatBytes, "heartbeat") : this.lastBytesWritten = this.totalBytesWritten
};
Connection.prototype.shutDown = function(a) {
	window.log.log(4, "Connection.shutDown");
	this.cleanCloseInitiated || (this.cleanCloseInitiated = !0, this.suppressShutdownMessage = a, this.isListening = !1, this.heartbeatSenderHandle && (clearInterval(this.heartbeatSenderHandle), this.heartbeatSenderHandle = null), this.socket && (this.sendData(new ArrayBuffer(0), "FINISHED_WRITING_SIGNAL"), this.socket.close(), this.socket = null), this.client.backlog.getLength() || this.client.stop(a))
};
Connection.prototype.ascii2ArrayBuffer = function(a) {
	for (var b = new ArrayBuffer(a.length), c = new Uint8Array(b), d = a.length - 1; 0 <= d; --d) c[d] = a.charCodeAt(d);
	return b
};
SubWindow.prototype.Types = {
	TextAlign: {
		JUSTIFY_CENTER: 0,
		JUSTIFY_LEFT: 1,
		JUSTIFY_RIGHT: 2
	},
	Misc: {
		SHADOW_PIXELS: 2,
		BASE_TEXT_SCREEN_EDGE_GAP: 4
	}
};
SubWindow.prototype.destroyWindow = function() {
	this.context = null;
	this.canvas && (this.canvas.parentNode && this.canvas.parentNode.removeChild(this.canvas), this.canvas = null)
};
SubWindow.prototype.setGraphicsToDefault = function() {
	this.setColor(this.id === this.client.Types.SubWindowId.MAIN_WINDOW_ID || this.id === this.client.Types.SubWindowId.HIT_POINTS_WINDOW_ID ? "rgba(0,0,0,1)" : "rgba(0, 0, 0, 0)");
	this.context.fillRect(0, 0, this.width, this.height)
};
SubWindow.prototype.drawOntoMainWindow = function(a, b) {
	var c = Math.max(b.xMin - this.x, 0),
		d = Math.max(b.yMin - this.y, 0),
		e = Math.min(b.xMax - this.x, this.width) - c,
		f = Math.min(b.yMax - this.y, this.height) - d;
	if (!(0 >= e || 0 >= f) && (a.drawImage(this.canvas, c, d, e, f, this.x + c, this.y + d, e, f), null != this.allOnScreenText))
		for (var g in this.allOnScreenText) this.drawShadowedText(a, this.allOnScreenText[g])
};
SubWindow.prototype.copyArea = function(a, b, c, d, e, f) {
	c = this.context.getImageData(a, b, c, d);
	this.context.putImageData(c, a + e, b + f)
};
SubWindow.prototype.fillRect = function(a, b, c, d) {
	this.context.clearRect(a, b, c, d);
	this.context.fillRect(a, b, c, d)
};
SubWindow.prototype.setColor = function(a) {
	this.currentColor = a;
	this.context.fillStyle = a
};
SubWindow.prototype.getColor = function() {
	return this.currentColor
};
SubWindow.prototype.drawImage = function(a, b, c) {
	this.context.drawImage(a, b, c)
};
SubWindow.prototype.createOnScreenText = function(a, b, c, d, e, f, g, h) {
	return {
		justification: b,
		rawText: a,
		textLines: c,
		textBoundsInSubWindow: e,
		baseLine: d,
		color: f,
		rgba: g,
		specialAttributes: h
	}
};
SubWindow.prototype.createTextLineAndInfo = function(a, b, c) {
	return {
		text: a,
		yOffset: b,
		width: c
	}
};
SubWindow.prototype.drawShadowedText = function(a, b) {
	switch (a.fillStyle = "rgba(0,0,0,1)", b.specialAttributes) {
		case this.client.Types.Font.ITALIC:
		case this.client.Types.Font.BOLD:
		case this.client.Types.Font.SMALL:
			a.font = this.client.fonts[b.specialAttributes].asString;
			break;
		default:
			a.font = this.client.fonts[this.client.Types.Font.PLAIN_TEXT].asString
	}
	for (g = 0; g < b.textLines.length; ++g) {
		var c = b.textLines[g];
		var d = this.getIndent(b, c);
		for (var e = 0; 3 > e; ++e)
			for (var f = 0; 3 > f; ++f) 1 === e && 1 === f || a.fillText(c.text, b.baseLine.x + this.x + e + d, b.baseLine.y + this.y + f + c.yOffset)
	}
	for (var g = 0; g < b.textLines.length; ++g) c = b.textLines[g], d = this.getIndent(b, c), a.fillStyle = b.color, a.fillText(c.text, b.baseLine.x + this.x + 1 + d, b.baseLine.y + this.y + 1 + c.yOffset)
};
SubWindow.prototype.getIndent = function(a, b) {
	var c = 0,
		d = a.textBoundsInSubWindow.width - b.width;
	switch (a.justification) {
		case this.Types.TextAlign.JUSTIFY_CENTER:
			c = ~~(d / 2);
			break;
		case this.Types.TextAlign.JUSTIFY_RIGHT:
			c = d
	}
	return c
};
SubWindow.prototype.processOnScreenTextCommand = function(a, b, c, d, e, f, g, h) {
	var m = [],
		k = this.allOnScreenText && this.allOnScreenText[a];
	if (k && m.push(k), a === this.client.Types.OnScreenTextCode.CLEAR_ALL_ON_SCREEN_TEXT) {
		if (this.allOnScreenText) {
			for (var l in this.allOnScreenText) m.push(this.allOnScreenText[l]);
			this.allOnScreenText = {}
		}
	} else {
		if (b === this.client.Types.FrameCommands.MOVE_ON_SCREEN_TEXT) {
			if (!k) return null;
			b = k.rawText;
			c = k.color;
			l = k.rgba;
			g = k.specialAttributes
		} else b = c, c = this.context.fillStyle, l = this.currentColor;
		if (b) {
			for (var k = null, n = this.getLines(b), r = [], p = 0, t = this.client.fonts[g], u = 0; u < n.length; ++u) {
				var x = n[u],
					q = t.measureText(x, this.context),
					q = q + this.Types.Misc.SHADOW_PIXELS;
				k ? q > k.width && (k.width = q) : k = {
					width: q
				};
				r.push(this.createTextLineAndInfo(x, p, q));
				p += t.height
			}
			k ? k.height = p : k = {
				width: 0,
				height: 0
			};
			k.x = 0;
			k.y = -t.height;
			k.height += this.Types.Misc.SHADOW_PIXELS;
			var n = !0,
				p = this.Types.TextAlign.JUSTIFY_CENTER;
			switch (a) {
				case this.client.Types.OnScreenTextCode.ID_STATUS_IN_UPPER_LEFT_WHITE:
					var v = {
						x: 0,
						y: 0
					};
					c = "white";
					p = this.Types.TextAlign.JUSTIFY_LEFT;
					"You die." === b && (this.client.died = !0);
					break;
				case this.client.Types.OnScreenTextCode.ID_STATS_IN_LOWER_LEFT_WHITE:
					v = {
						x: 0,
						y: this.height
					};
					c = "white";
					p = this.Types.TextAlign.JUSTIFY_LEFT;
					break;
				case this.client.Types.OnScreenTextCode.ID_HINTS_IN_LOWER_LEFT_YELLOW:
					v = {
						x: 0,
						y: this.height
					};
					c = "rgba(255,252,191,1)";
					p = this.Types.TextAlign.JUSTIFY_LEFT;
					break;
				default:
					h ? (n = !1, v = {
						x: d - ~~(k.width / 2),
						y: ~~(this.height / 2) + t.descent
					}) : v = {
						x: d - ~~(k.width / 2),
						y: e - k.height
					}
			}
			v.y -= t.height * f;
			n && this.forceTextOnScreen(v, k, t);
			d = this.createOnScreenText(b, p, r, v, k, c, l, g);
			this.allOnScreenText || (this.allOnScreenText = {});
			this.allOnScreenText[a] = d;
			m.push(d)
		} else this.allOnScreenText && delete this.allOnScreenText[a]
	}
	return this.determineRepaintArea(m)
};
SubWindow.prototype.forceTextOnScreen = function(a, b, c) {
	var d = this.width;
	a.x + b.width + this.textRightGap > d && (a.x = d - (b.width + this.textRightGap));
	a.y + c.descent + this.textBottomGap > this.height && (a.y = this.height - (c.descent + this.textBottomGap));
	a.x < this.textLeftGap && (a.x = this.textLeftGap);
	a.y < this.textTopGap + c.ascent && (a.y = this.textTopGap + c.ascent)
};
SubWindow.prototype.determineRepaintArea = function(a) {
	for (var b = 4294967295, c = b, d = -4294967295, e = d, f = 0, g = a.length; f < g; ++f) {
		var h = a[f],
			m = h.baseLine.x + h.textBoundsInSubWindow.x,
			k = h.baseLine.x + h.textBoundsInSubWindow.x + h.textBoundsInSubWindow.width,
			l = h.baseLine.y + h.textBoundsInSubWindow.y,
			h = h.baseLine.y + h.textBoundsInSubWindow.y + h.textBoundsInSubWindow.height;
		m < b && (b = m);
		k > d && (d = k);
		l < c && (c = l);
		h > e && (e = h)
	}
	a = {};
	f = 1 + Math.ceil(this.client.fonts[this.client.Types.Font.PLAIN_TEXT].height / 6);
	return a.x = this.x + b + -f, a.y = this.y + c - f, a.width = d - b + 2 * f, a.height = e - c + 2 * f, a
};
SubWindow.prototype.getLines = function(a) {
	var b = [];
	if (!a) return b;
	for (var c = 0, d = a.length - 1; 0 <= d; --d) {
		var e = a.indexOf("\n", c);
		if (0 > e) {
			b.push(a.substring(c));
			break
		}
		b.push(a.substring(c, e));
		c = e + 1
	}
	return b
};
var app;
window.addEventListener("load", function() {
	window.log.log(5, "window.onload start");
	app = new App;
	window.log.log(5, "window.onload end")
});
