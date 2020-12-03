//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// TABS set to 2.
//
// ORIGINAL SOURCE:
// RotatingTranslatedTriangle.js (c) 2012 matsuda
// HIGHLY MODIFIED to make:
//
// JT_MultiShader.js  for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin

/* Show how to use 3 separate VBOs with different verts, attributes & uniforms. 
-------------------------------------------------------------------------------
	Create a 'VBObox' object/class/prototype & library to collect, hold & use all 
	data and functions we need to render a set of vertices kept in one Vertex 
	Buffer Object (VBO) on-screen, including:
	--All source code for all Vertex Shader(s) and Fragment shader(s) we may use 
		to render the vertices stored in this VBO;
	--all variables needed to select and access this object's VBO, shaders, 
		uniforms, attributes, samplers, texture buffers, and any misc. items. 
	--all variables that hold values (uniforms, vertex arrays, element arrays) we 
	  will transfer to the GPU to enable it to render the vertices in our VBO.
	--all user functions: init(), draw(), adjust(), reload(), empty(), restore().
	Put all of it into 'JT_VBObox-Lib.js', a separate library file.

USAGE:
------
1) If your program needs another shader program, make another VBObox object:
 (e.g. an easy vertex & fragment shader program for drawing a ground-plane grid; 
 a fancier shader program for drawing Gouraud-shaded, Phong-lit surfaces, 
 another shader program for drawing Phong-shaded, Phong-lit surfaces, and
 a shader program for multi-textured bump-mapped Phong-shaded & lit surfaces...)
 
 HOW:
 a) COPY CODE: create a new VBObox object by renaming a copy of an existing 
 VBObox object already given to you in the VBObox-Lib.js file. 
 (e.g. copy VBObox1 code to make a VBObox3 object).

 b) CREATE YOUR NEW, GLOBAL VBObox object.  
 For simplicity, make it a global variable. As you only have ONE of these 
 objects, its global scope is unlikely to cause confusions/errors, and you can
 avoid its too-frequent use as a function argument.
 (e.g. above main(), write:    var gourardBox2 = new VBObox3();  )

 c) INITIALIZE: in your JS progam's main() function, initialize your new VBObox;
 (e.g. inside main(), write:  gourardBox2.init(); )

 d) DRAW: in the JS function that performs all your webGL-drawing tasks, draw
 your new VBObox's contents on-screen. 
 (NOTE: as it's a COPY of an earlier VBObox, your new VBObox's on-screen results
  should duplicate the initial drawing made by the VBObox you copied.  
  If that earlier drawing begins with the exact same initial position and makes 
  the exact same animated moves, then it will hide your new VBObox's drawings!
  --THUS-- be sure to comment out the earlier VBObox's draw() function call  
  to see the draw() result of your new VBObox on-screen).
  (e.g. inside drawAll(), add this:  
      gourardBox2.switchToMe();
      gourardBox2.draw();            )

 e) ADJUST: Inside the JS function that animates your webGL drawing by adjusting
 uniforms (updates to ModelMatrix, etc) call the 'adjust' function for each of your
VBOboxes.  Move all the uniform-adjusting operations from that JS function into the
'adjust()' functions for each VBObox. 

2) Customize the VBObox contents; add vertices, add attributes, add uniforms.
 ==============================================================================*/


// Global Variables  
//   (These are almost always a BAD IDEA, but here they eliminate lots of
//    tedious function arguments. 
//    Later, collect them into just a few global, well-organized objects!)
// ============================================================================
// for WebGL usage:--------------------
var gl;													// WebGL rendering context -- the 'webGL' object
																// in JavaScript with all its member fcns & data
var g_canvasID;									// HTML-5 'canvas' element ID#

// For multiple VBOs & Shaders:-----------------
worldBox = new VBObox0();		  // Holds VBO & shaders for 3D 'world' ground-plane grid, etc;
gouraudBox = new VBObox1();		  // "  "  for first set of custom-shaded 3D parts
gourardBox2 = new VBObox3();     // "  "  for second set of custom-shaded 3D parts
phongBox = new VBObox4();     // "  "  for second set of custom-shaded 3D parts
phongBox2 = new VBObox5();
blackBox = new VBObox6();

// For animation:---------------------
var g_lastMS = Date.now();			// Timestamp (in milliseconds) for our 
                                // most-recently-drawn WebGL screen contents.  
                                // Set & used by moveAll() fcn to update all
                                // time-varying params for our webGL drawings.
// For mouse/keyboard:------------------------
var g_show = 1;								// 0==Show, 1==Hide VBO0 contents on-screen.
var light = 1;
var g_EyeX = 20, g_EyeY = 0, g_EyeZ = 11; 
var theta = 180;
var g_LookAtX = g_EyeX + Math.cos(theta * (Math.PI/180));
var g_LookAtY = g_EyeY + Math.sin(theta * (Math.PI/180));
var g_LookatZ = 10.6;

var diffuseVal;
var specularVal;
var ambientVal;
var shinyVal;

var matlSel = MATL_RED_PLASTIC;
var matl0 = new Material(matlSel);




var aspect;

function main() {
//=============================================================================
  // Retrieve the HTML-5 <canvas> element where webGL will draw our pictures:
  g_canvasID = document.getElementById('webgl');	
  var xtraMargin = 16;
  g_canvasID.width = window.innerWidth - xtraMargin;
  g_canvasID.height = (window.innerHeight*3/4) - xtraMargin; 
  // Create the the WebGL rendering context: one giant JavaScript object that
  // contains the WebGL state machine adjusted by large sets of WebGL functions,
  // built-in variables & parameters, and member data. Every WebGL function call
  // will follow this format:  gl.WebGLfunctionName(args);

  // Create the the WebGL rendering context: one giant JavaScript object that
  // contains the WebGL state machine, adjusted by big sets of WebGL functions,
  // built-in variables & parameters, and member data. Every WebGL func. call
  // will follow this format:  gl.WebGLfunctionName(args);
  //SIMPLE VERSION:  gl = getWebGLContext(g_canvasID); 
  // Here's a BETTER version:
  gl = g_canvasID.getContext("webgl", { preserveDrawingBuffer: true});
	// This fancier-looking version disables HTML-5's default screen-clearing, so 
	// that our drawMain() 
	// function will over-write previous on-screen results until we call the 
	// gl.clear(COLOR_BUFFER_BIT); function. )
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.clearColor(0.2, 0.2, 0.2, 1);	  // RGBA color for clearing <canvas>
  document.onkeydown= function(ev){keydown(ev); };
  gl.enable(gl.DEPTH_TEST);
  g_worldMat = new Matrix4();	


  // Initialize each of our 'vboBox' objects: 
  worldBox.init(gl);		// VBO + shaders + uniforms + attribs for our 3D world,
                        // including ground-plane,                       
  gouraudBox.init(gl);		//  "		"		"  for 1st kind of shading & lighting
  gourardBox2.init(gl);    //  "   "   "  for 2nd kind of shading & lighting
  phongBox.init(gl);
  phongBox2.init(gl);
  blackBox.init(gl);
  setCamera();
  setVals();
  gl.clearColor(0.2, 0.2, 0.2, 1);	  // RGBA color for clearing <canvas>
  
  // ==============ANIMATION=============
  // Quick tutorials on synchronous, real-time animation in JavaScript/HTML-5: 
  //    https://webglfundamentals.org/webgl/lessons/webgl-animation.html
  //  or
  //  	http://creativejs.com/resources/requestanimationframe/
  //		--------------------------------------------------------
  // Why use 'requestAnimationFrame()' instead of the simpler-to-use
  //	fixed-time setInterval() or setTimeout() functions?  Because:
  //		1) it draws the next animation frame 'at the next opportunity' instead 
  //			of a fixed time interval. It allows your browser and operating system
  //			to manage its own processes, power, & computing loads, and to respond 
  //			to on-screen window placement (to skip battery-draining animation in 
  //			any window that was hidden behind others, or was scrolled off-screen)
  //		2) it helps your program avoid 'stuttering' or 'jittery' animation
  //			due to delayed or 'missed' frames.  Your program can read and respond 
  //			to the ACTUAL time interval between displayed frames instead of fixed
  //		 	fixed-time 'setInterval()' calls that may take longer than expected.
  //------------------------------------
  var tick = function() {		    // locally (within main() only), define our 
                                // self-calling animation function. 
    requestAnimationFrame(tick, g_canvasID); // browser callback request; wait
                                // til browser is ready to re-draw canvas, then
    timerAll();  // Update all time-varying params, and
    drawAll();                // Draw all the VBObox contents
    g_canvasID.width = window.innerWidth - xtraMargin;
    g_canvasID.height = (window.innerHeight*3/4) - xtraMargin; 
    };
  //------------------------------------
  tick();                       // do it again!
}

function setVals(){
  diffuseVal = matl0.K_diff;
  ambientVal = matl0.K_ambi;
  specularVal = matl0.K_spec;
  shinyVal = matl0.K_shiny;
}

function timerAll() {
//=============================================================================
// Find new values for all time-varying parameters used for on-screen drawing
  // use local variables to find the elapsed time.
  var nowMS = Date.now();             // current time (in milliseconds)
  var elapsedMS = nowMS - g_lastMS;   // 
  g_lastMS = nowMS;                   // update for next webGL drawing.
  if(elapsedMS > 1000.0) {            
    // Browsers won't re-draw 'canvas' element that isn't visible on-screen 
    // (user chose a different browser tab, etc.); when users make the browser
    // window visible again our resulting 'elapsedMS' value has gotten HUGE.
    // Instead of allowing a HUGE change in all our time-dependent parameters,
    // let's pretend that only a nominal 1/30th second passed:
    elapsedMS = 1000.0/30.0;
    }
}

function drawAll() {
//=============================================================================
  // Clear on-screen HTML-5 <canvas> object:
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.viewport(0,											// Viewport lower-left corner
    0, 			// location(in pixels)
    g_canvasID.width, 				// viewport width,
    g_canvasID.height);			// viewport height in pixels.
  aspect = g_canvasID.width/g_canvasID.height;
  var b4Draw = Date.now();
  var b4Wait = b4Draw - g_lastMS;
  setCamera();
  document.getElementById("x").innerHTML = document.getElementById("lx").value.toString() +", "+document.getElementById("ly").value.toString() +", "+document.getElementById("lz").value.toString().toString()
  document.getElementById("a").innerHTML = document.getElementById("a_r").value.toString() +", "+document.getElementById("a_g").value.toString() +", "+document.getElementById("a_b").value.toString().toString()
  document.getElementById("d").innerHTML = document.getElementById("d_r").value.toString() +", "+document.getElementById("d_g").value.toString() +", "+document.getElementById("d_b").value.toString().toString()
  document.getElementById("s").innerHTML = document.getElementById("s_r").value.toString() +", "+document.getElementById("s_g").value.toString() +", "+document.getElementById("s_b").value.toString().toString()
  worldBox.switchToMe();  // Set WebGL to render from this VBObox.
  worldBox.adjust();		  // Send new values for uniforms to the GPU, and
  worldBox.draw();
  if(light){
    document.getElementById("0").style.backgroundColor = "yellow";
    if(g_show == 1) { // IF user didn't press HTML button to 'hide' VBO1:
    gouraudBox.switchToMe();  // Set WebGL to render from this VBObox.
  	gouraudBox.adjust();		  // Send new values for uniforms to the GPU, and
    gouraudBox.draw();
    document.getElementById("1").style.backgroundColor = "yellow";			  // draw our VBO's contents using our shaders.
    }
  else{
    document.getElementById("1").style.backgroundColor = null;
    }
	if(g_show == 2) { // IF user didn't press HTML button to 'hide' VBO2:
	  gourardBox2.switchToMe();  // Set WebGL to render from this VBObox.
  	gourardBox2.adjust();		  // Send new values for uniforms to the GPU, and
    gourardBox2.draw();
    document.getElementById("2").style.backgroundColor = "yellow";			  // draw our VBO's contents using our shaders.
    }
    else{
      document.getElementById("2").style.backgroundColor = null;
      }
  if(g_show == 3){
    phongBox.switchToMe();  // Set WebGL to render from this VBObox.
  	phongBox.adjust();		  // Send new values for uniforms to the GPU, and
    phongBox.draw();
    document.getElementById("3").style.backgroundColor = "yellow";			  // draw our VBO's contents using our shaders.
  }
  else{
    document.getElementById("3").style.backgroundColor = null;
    }
  if(g_show  == 4){
    phongBox2.switchToMe();  // Set WebGL to render from this VBObox.
  	phongBox2.adjust();		  // Send new values for uniforms to the GPU, and
    phongBox2.draw();
    document.getElementById("4").style.backgroundColor = "yellow";			  // draw our VBO's contents using our shaders.
  }
  else{
    document.getElementById("4").style.backgroundColor = null;
    }
  }
else{
  blackBox.switchToMe();  // Set WebGL to render from this VBObox.
  blackBox.adjust();		  // Send new values for uniforms to the GPU, and
  blackBox.draw();
  document.getElementById("0").style.backgroundColor = null;
}


    
  
/* // ?How slow is our own code?  	
var aftrDraw = Date.now();
var drawWait = aftrDraw - b4Draw;
console.log("wait b4 draw: ", b4Wait, "drawWait: ", drawWait, "mSec");
*/
}

function lit() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO0'.
  if(light != 1) light = 1;				// show,
  else light = 0;										// hide.
}

function VBO1toggle() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO1'.
  g_show = 1;
  document.getElementById("1").style.backgroundColor = "yellow";
  document.getElementById("2").style.backgroundColor = null;
  document.getElementById("3").style.backgroundColor = null;
  document.getElementById("4").style.backgroundColor = null;							// hide.
}

function VBO2toggle() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO2'.
  g_show = 2;
  document.getElementById("2").style.backgroundColor = "yellow";
  document.getElementById("1").style.backgroundColor = null;
  document.getElementById("3").style.backgroundColor = null;
  document.getElementById("4").style.backgroundColor = null;

}

function VBO3toggle() {
  //=============================================================================
  // Called when user presses HTML-5 button 'Show/Hide VBO2'.
  g_show = 3;	
  document.getElementById("3").style.backgroundColor = "yellow";
  document.getElementById("2").style.backgroundColor = null;
  document.getElementById("1").style.backgroundColor = null;
  document.getElementById("4").style.backgroundColor = null;								// hide.
  }

function VBO4toggle() {
  //=============================================================================
  // Called when user presses HTML-5 button 'Show/Hide VBO2'.
  g_show = 4;
  document.getElementById("4").style.backgroundColor = "yellow";
  document.getElementById("2").style.backgroundColor = null;
  document.getElementById("3").style.backgroundColor = null;
  document.getElementById("1").style.backgroundColor = null;								// hide.
  }

function setCamera() {
  //============================================================================
  // PLACEHOLDER:  sets a fixed camera at a fixed position for use by
  // ALL VBObox objects.  REPLACE This with your own camera-control code.
  
    g_worldMat.setIdentity();
    g_worldMat.perspective(30, aspect, 1.0, 500.0);
    g_worldMat.lookAt(g_EyeX, g_EyeY, g_EyeZ,	// center of projection
      g_LookAtX, g_LookAtY, g_LookatZ,	// look-at point 
      0, 0, 1);
    // READY to draw in the 'world' coordinate system.
  //------------END COPY
  
  }
function keydown(ev) {
	//------------------------------------------------------
	//HTML calls this'Event handler' or 'callback function' when we press a key:
		g_DisplaceX = (g_LookAtX - g_EyeX) * 0.5;
		g_DisplaceY = (g_LookAtY - g_EyeY) * 0.5;
		g_DisplaceZ = (g_LookatZ - g_EyeZ) * 0.5;

		rotatedX = (g_DisplaceX * Math.cos(90 * (Math.PI/180))) - (g_DisplaceY * Math.sin(90 * (Math.PI/180)));
		rotatedY = (g_DisplaceX * Math.sin(90 * (Math.PI/180))) + (g_DisplaceY * Math.cos(90 * (Math.PI/180)));
    theta = theta
    
    if(ev.keyCode == 77){
      matlSel = (matlSel +1)%MATL_DEFAULT;
      matl0.setMatl(matlSel);
      setVals();
      drawAll();
      console.log("Hi");
    }

		if(ev.keyCode == 39) { // The right arrow key was pressed
	//      g_EyeX += 0.01;
					g_EyeX -= rotatedX;		// INCREASED for perspective camera)
					g_EyeY -= rotatedY;
					g_LookAtX -= rotatedX;
					g_LookAtY -= rotatedY;
					//circleAng = (Math.asin(g_EyeX/g_EyeY) * (180/Math.PI)) % 360;
		} else 
		if(ev.keyCode == 38) { // The up arrow key was pressed
			//      g_EyeX += 0.01;
							g_EyeX += g_DisplaceX;
							g_EyeY += g_DisplaceY;
							g_EyeZ += g_DisplaceZ;

							g_LookAtX += g_DisplaceX;
							g_LookAtY += g_DisplaceY;
							g_LookatZ += g_DisplaceZ;
							//circleAng = (Math.asin(g_EyeX/g_EyeY) * (180/Math.PI)) % 360;
				} else 
		if(ev.keyCode == 40) { // The up arrow key was pressed
			//      g_EyeX += 0.01;
							g_EyeX -= g_DisplaceX;
							g_EyeY -= g_DisplaceY;
							g_EyeZ -= g_DisplaceZ;

							g_LookAtX -= g_DisplaceX;
							g_LookAtY -= g_DisplaceY;
							g_LookatZ -= g_DisplaceZ;
							//circleAng = (Math.asin(g_EyeX/g_EyeY) * (180/Math.PI)) % 360;
				} else
    if(ev.keyCode == 68) { //D Key
      console.log(theta)
							theta -= 0.5;
							g_LookAtX = g_EyeX + Math.cos(theta * (Math.PI/180));
							g_LookAtY = g_EyeY + Math.sin(theta * (Math.PI/180));
				} else 
    if(ev.keyCode == 65) { //A Key
              console.log(theta)
							theta += 0.5;
							g_LookAtX = g_EyeX + Math.cos(theta * (Math.PI/180));
							g_LookAtY = g_EyeY + Math.sin(theta * (Math.PI/180));
				} else
		if(ev.keyCode == 87) { //W Key
							g_LookatZ += 0.04;
				} else
		if(ev.keyCode == 83) { //S Keyaw
							g_LookatZ -= 0.04;
				} else 
		if (ev.keyCode == 37) { // The left arrow key was pressed
	//      g_EyeX -= 0.01;
					g_EyeX += rotatedX;		// INCREASED for perspective camera)
					g_EyeY += rotatedY;

					g_LookAtX += rotatedX;
					g_LookAtY += rotatedY;
					//circleAng = (Math.asin(g_EyeX/g_EyeY) * (180/Math.PI)) % 360;
		} else { return; } // Prevent the unnecessary drawing   
	}