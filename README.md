# Wright! Magazine

I'm putting here the sources of my Wright! Magazine & Game engine as backup and reference for curious people. You can play with it here: http://www.kesiev.com/wright

Since I've decided to implement from scratch the nicest things I learnt, thought, played and made in my past (and present, as much as I can), this project is going to be pretty __weird__. For example, it plays videogames coded in JSON and uses HTML DOM elements (aw, old good times) or HTML5 Canvas - both supporting full screen effects. Just because.

## Features

### Project features
  
  * Many articles to [read](http://www.kesiev.com/wright/) and retro-games to [play](http://www.kesiev.com/wright/issues)!
  * Everything is opensourced, from the game engine and the games to game servers and WIP assets, like GIMP and Inkscape source material and the spreadsheets and tools used for game design
  * A simple responsive template-based PHP website in which you can read articles, configure the games and play them on desktop and mobile
  * Play on mobile devices, touchscreens or remotely on another computer or [Chromecast](https://www.google.it/chrome/devices/chromecast/) using a mobile phone as controller
  * Supports competitive online gaming via [Telegram Gaming platform](https://telegram.org/blog/games), using score publishing and chatbot via [@WrightMagBot](https://telegram.me/wrightmagbot) _(Sadly only 20 games are available due to Telegram limitations)_
  * Telegram chatbot supports inline invoking (i.e. <tt>@WrightMagBot starcat</tt> while chatting with friends)
  * Supports a number of tools for prettifying the game sources, converting [Tiled](http://www.mapeditor.org/) tilemaps to Wright engine and save data manipulation
  * Per-game PWA support

### Engine features

#### General

  * Game data is mostly JSON
  * Games can be embedded and pre-configured in any web page
  * Tape-based system: games are collected in a single folder and each game game is in a single subfolder, mimicking how [emulators](https://en.wikipedia.org/wiki/Video_game_console_emulator) usually works
  * Per-game cheats support
  * Score publishing support for online leaderboards (i.e. Telegram)
  * Optional game configuration settings panel, with keyboard, screen, audio, play mode and cheat settings
  * Configuration settings are stored locally
  * Simple built-in and configurable procedural dungeon generator

#### Remote play

  * Play remotely using another browser via [PeerJS](http://peerjs.com/) or on [Chromecast](https://www.google.it/chrome/devices/chromecast/)
  * Save games are stored on the controller, so you can continue the same game using a remote screen and on the go
  * System time is synced with the controller, so time-based games are more reliable (i.e. virtual pets)
  * Custom game data, like user generated levels, are loadable from the controller
  * Modular structure, so is possible to add more remote play channels

#### Resources

  * Multiple customizable metadata for each game (i.e. I've used them for the article linked with every game)
  * Load external spritesheets and tilemaps, images and game data

#### Game elements

  * Supports large tilemaps and multiple sprites
  * Supports nested sprites
  * Supports scene hud layer, which is always on top of the scene
  * Supports scene game hud layer, which is always on top of whole game
  * Frame-based animation system that supports animation speed and looping
  * Tagging supports for any game element (i.e. tag different objects as 'enemy' and check collisions with all of them, perform actions and changes etc. with a single statement)
  * Realtime z-Index support, both handled by DOM or linked lists
  * Basic Z coordinates for pseudo-3D games
  * Supported sprite properties: position, size, background image, background position
  * Supported sprite transformation settings: transformation origin, rotation, scale, opacity
  * Supported sprite decorations: border color

#### Text elements

  * Customizable font family, font size, horizontal alignment, line height, color, outline color
  * Supports hud elements that auto-updates via placeholders (i.e. score, health bars, flags, labels etc.)

#### Physics

  * Optional simplified rectangle-based physics engine that supports linear forces, force limits, restitution, friction and horizontal/vertical collisions events
  * Collision detections and per-element with multiple hitboxes, that can be used without physics engine

#### Camera

  * Supports multiple camera  bounding boxes (i.e. per-room bounded camera)
  * Customizable focus areas and smoothness

#### Coding

  * Stencil-based engine (i.e. build labelled element behaviours, chunk of code and appearance details and merge them together as you like and when you want. E: "bouncing" stencil + "rolling" stencil = bouncing and rolling object)
  * Customizable state machine for every game element (i.e. onStart, onDead, onFire etc.)
  * Multiple running functions for each states, both synchronous (Execute) and asynchronous (Sequences) with frame-based delays
  * Customizable per-state public methods for every game element (i.e. fire, jump etc.)
  * JSON-based programming language (i.e. <tt>{"sum":10,"to":{"_":["variable","score"]}}</tt>)
  * A lot of functions: game controls and resources, camera, hud, objects, audio, date, math, distances, collisions, array manipulations...
  * Per game element, per scene, and game wise variables
  * Logging support for easier debugging

#### User data

  * Datasette system allows loading and saving serialized data from player, like custom stages, via copy/paste and prompt

#### Game structure

  * Game data can be loaded from external files
  * Game scenes can be loaded runtime (i.e. stages can be downloaded when the player reach them)

#### Audio
  
  * Load external audio files
  * Per-channel and per-sample volume
  * Audio looping
  * Optional automatic fade-in/fade-out on scene changes
  * Audio sample playback position readable by games (i.e. for rhythm games)
  * A tiny BFXR-like noise generator for sound effects generation

#### Controls

  * Emulates joystick and pointer input devices via keyboard, mouse and touchscreen
  * Customizable keyboard controls
  * Multitouch controls when fullscreen 
  * Per-game touch controllers (Stick with A/B buttons, single button controllers, two players paddles)
  * Touch controls includes analog sticks and buttons
  * On-screen popup guide for touch controls
  * Multiple touchscreen controls layout (optimized for shooters, platformers etc.)
  * Remote gaming on another web browser or Chromecast
  * Motion controls
  * Gamepad support (with a number of exotic setups)

#### Screen

  * Per-game customizable screen size and framerate
  * Canvas and DOM rendering engines
  * Fullscreen support for desktop and mobile (touch the game screen with two fingers to use them)
  * Fallback compatibility fullscreen mode
  * Customizable screen scaling (i.e. 2x, 3x...)
  * Per-game aliased/pixelated scaling
  * Automatic frameskip
  * Disable device standby on fullscreen
  * Per-game fullscreen effects: scanlines, LCD and CRT effects etc.
  * Modular and scriptable stack-based fullscreen effects engine

#### Storage

  * LocalStorage based storage
  * Stores both raw data (i.e. highscores) and single whole JSON from games (i.e. party status on RPGs)
  * Multiple slots for game
  * Can be disabled engine-wise
