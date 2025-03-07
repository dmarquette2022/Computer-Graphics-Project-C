//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

// Tabs set to 2

/*=====================
  VBObox-Lib.js library: 
  ===================== 
Note that you don't really need 'VBObox' objects for any simple, 
    beginner-level WebGL/OpenGL programs: if all vertices contain exactly 
		the same attributes (e.g. position, color, surface normal), and use 
		the same shader program (e.g. same Vertex Shader and Fragment Shader), 
		then our textbook's simple 'example code' will suffice.
		  
***BUT*** that's rare -- most genuinely useful WebGL/OpenGL programs need 
		different sets of vertices with  different sets of attributes rendered 
		by different shader programs.  THUS a customized VBObox object for each 
		VBO/shader-program pair will help you remember and correctly implement ALL 
		the WebGL/GLSL steps required for a working multi-shader, multi-VBO program.
		
One 'VBObox' object contains all we need for WebGL/OpenGL to render on-screen a 
		set of shapes made from vertices stored in one Vertex Buffer Object (VBO), 
		as drawn by calls to one 'shader program' that runs on your computer's 
		Graphical Processing Unit(GPU), along with changes to values of that shader 
		program's one set of 'uniform' varibles.  
The 'shader program' consists of a Vertex Shader and a Fragment Shader written 
		in GLSL, compiled and linked and ready to execute as a Single-Instruction, 
		Multiple-Data (SIMD) parallel program executed simultaneously by multiple 
		'shader units' on the GPU.  The GPU runs one 'instance' of the Vertex 
		Shader for each vertex in every shape, and one 'instance' of the Fragment 
		Shader for every on-screen pixel covered by any part of any drawing 
		primitive defined by those vertices.
The 'VBO' consists of a 'buffer object' (a memory block reserved in the GPU),
		accessed by the shader program through its 'attribute' variables. Shader's
		'uniform' variable values also get retrieved from GPU memory, but their 
		values can't be changed while the shader program runs.  
		Each VBObox object stores its own 'uniform' values as vars in JavaScript; 
		its 'adjust()'	function computes newly-updated values for these uniform 
		vars and then transfers them to the GPU memory for use by shader program.
EVENTUALLY you should replace 'cuon-matrix-quat03.js' with the free, open-source
   'glmatrix.js' library for vectors, matrices & quaternions: Google it!
		This vector/matrix library is more complete, more widely-used, and runs
		faster than our textbook's 'cuon-matrix-quat03.js' library.  
		--------------------------------------------------------------
		I recommend you use glMatrix.js instead of cuon-matrix-quat03.js
		--------------------------------------------------------------
		for all future WebGL programs. 
You can CONVERT existing cuon-matrix-based programs to glmatrix.js in a very 
    gradual, sensible, testable way:
		--add the glmatrix.js library to an existing cuon-matrix-based program;
			(but don't call any of its functions yet).
		--comment out the glmatrix.js parts (if any) that cause conflicts or in	
			any way disrupt the operation of your program.
		--make just one small local change in your program; find a small, simple,
			easy-to-test portion of your program where you can replace a 
			cuon-matrix object or function call with a glmatrix function call.
			Test; make sure it works. Don't make too large a change: it's hard to fix!
		--Save a copy of this new program as your latest numbered version. Repeat
			the previous step: go on to the next small local change in your program
			and make another replacement of cuon-matrix use with glmatrix use. 
			Test it; make sure it works; save this as your next numbered version.
		--Continue this process until your program no longer uses any cuon-matrix
			library features at all, and no part of glmatrix is commented out.
			Remove cuon-matrix from your library, and now use only glmatrix.

	------------------------------------------------------------------
	VBObox -- A MESSY SET OF CUSTOMIZED OBJECTS--NOT REALLY A 'CLASS'
	------------------------------------------------------------------
As each 'VBObox' object can contain:
  -- a DIFFERENT GLSL shader program, 
  -- a DIFFERENT set of attributes that define a vertex for that shader program, 
  -- a DIFFERENT number of vertices to used to fill the VBOs in GPU memory, and 
  -- a DIFFERENT set of uniforms transferred to GPU memory for shader use.  
  THUS:
		I don't see any easy way to use the exact same object constructors and 
		prototypes for all VBObox objects.  Every additional VBObox objects may vary 
		substantially, so I recommend that you copy and re-name an existing VBObox 
		prototype object, and modify as needed, as shown here. 
		(e.g. to make the VBObox0 object, copy the VBObox2 constructor and 
		all its prototype functions, then modify their contents for VBObox0 
		activities.)

*/

// Written for EECS 351-2,	Intermediate Computer Graphics,
//							Northwestern Univ. EECS Dept., Jack Tumblin
// 2016.05.26 J. Tumblin-- Created; tested on 'TwoVBOs.html' starter code.
// 2017.02.20 J. Tumblin-- updated for EECS 351-1 use for Project C.
// 2018.04.11 J. Tumblin-- minor corrections/renaming for particle systems.
//    --11e: global 'gl' replaced redundant 'myGL' fcn args; 
//    --12: added 'SwitchToMe()' fcn to simplify 'init()' function and to fix 
//      weird subtle errors that sometimes appear when we alternate 'adjust()'
//      and 'draw()' functions of different VBObox objects. CAUSE: found that
//      only the 'draw()' function (and not the 'adjust()' function) made a full
//      changeover from one VBObox to another; thus calls to 'adjust()' for one
//      VBObox could corrupt GPU contents for another.
//      --Created vboStride, vboOffset members to centralize VBO layout in the 
//      constructor function.
//    -- 13 (abandoned) tried to make a 'core' or 'resuable' VBObox object to
//      which we would add on new properties for shaders, uniforms, etc., but
//      I decided there was too little 'common' code that wasn't customized.
//=============================================================================


//=============================================================================
//=============================================================================
function VBObox0() {
  //=============================================================================
  //=============================================================================
  // CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
  // needed to render vertices from one Vertex Buffer Object (VBO) using one 
  // separate shader program (a vertex-shader & fragment-shader pair) and one
  // set of 'uniform' variables.
  
  // Constructor goal: 
  // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
  // written into code) in all other VBObox functions. Keeping all these (initial)
  // values here, in this one coonstrutor function, ensures we can change them 
  // easily WITHOUT disrupting any other code, ever!
    
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
    //
    'uniform mat4 u_ModelMat0;\n' +
    'attribute vec4 a_Pos0;\n' +
    'attribute vec3 a_Colr0;\n'+
    'varying vec3 v_Colr0;\n' +
    //
    'void main() {\n' +
    '  gl_Position = u_ModelMat0 * a_Pos0;\n' +
    '	 v_Colr0 = a_Colr0;\n' +
    ' }\n';
  
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision mediump float;\n' +
    'varying vec3 v_Colr0;\n' +
    'void main() {\n' +
    '  gl_FragColor = vec4(v_Colr0, 1.0);\n' + 
    '}\n';
    
    
    this.floatsPerVertex = 7;
    this.gndVerts;
    this.makeGroundGrid();
    this.vboContents = this.gndVerts;
    
    this.vboVerts = this.gndVerts.length/this.floatsPerVertex;						// # of vertices held in 'vboContents' array
    
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                  // bytes req'd by 1 vboContents array element;
                                  // (why? used to compute stride and offset 
                                  // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;               
                                  // total number of bytes stored in vboContents
                                  // (#  of floats in vboContents array) * 
                                  // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts; 
                                  // (== # of bytes to store one complete vertex).
                                  // From any attrib in a given vertex in the VBO, 
                                  // move forward by 'vboStride' bytes to arrive 
                                  // at the same attrib for the next vertex. 
  
                //----------------------Attribute sizes
    this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                  // attribute named a_Pos0. (4: x,y,z,w values)
    this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
    console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
                    this.vboFcount_a_Colr0) *   // every attribute in our VBO
                    this.FSIZE == this.vboStride, // for agreeement with'stride'
                    "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");
  
                //----------------------Attribute offsets  
    this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
                                  // of 1st a_Pos0 attrib value in vboContents[]
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                  // (4 floats * bytes/float) 
                                  // # of bytes from START of vbo to the START
                                  // of 1st a_Colr0 attrib value in vboContents[]
                //-----------------------GPU memory locations:
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                  // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
                                  // set by compile/link of VERT_SRC and FRAG_SRC.
                            //------Attribute locations in our shaders:
    this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
    this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute
  
                //---------------------- Uniform locations &values in our shaders
    this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform
    
    
  }
  
  VBObox0.prototype.init = function() {
  //=============================================================================
  // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
  // kept in this VBObox. (This function usually called only once, within main()).
  // Specifically:
  // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
  //  executable 'program' stored and ready to use inside the GPU.  
  // b) create a new VBO object in GPU memory and fill it by transferring in all
  //  the vertex data held in our Float32array member 'VBOcontents'. 
  // c) Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
  // -------------------
  // CAREFUL!  before you can draw pictures using this VBObox contents, 
  //  you must call this VBObox object's switchToMe() function too!
  //--------------------
  // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create executable Shaders on the GPU. Bye!');
      return;
    }
  // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
  //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
  
    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
  
  // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create VBO in GPU. Bye!'); 
      return;
    }
    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                    this.vboLoc);				  // the ID# the GPU uses for this buffer.
  
    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                      this.vboContents, 		// JavaScript Float32Array
                     gl.STATIC_DRAW);			// Usage hint.
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.
  
    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if(this.a_PosLoc < 0) {
      console.log(this.constructor.name + 
                  '.init() Failed to get GPU location of attribute a_Pos0');
      return -1;	// error exit.
    }
     this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if(this.a_ColrLoc < 0) {
      console.log(this.constructor.name + 
                  '.init() failed to get the GPU location of attribute a_Colr0');
      return -1;	// error exit.
    }
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs: 
    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
    if (!this.u_ModelMatLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_ModelMat1 uniform');
      return;
    }  
  }

  VBObox0.prototype.makeGroundGrid = function() {
    //==============================================================================
    // Create a list of vertices that create a large grid of lines in the x,y plane
    // centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.
    
      var xcount = 100;			// # of lines to draw in x,y to make the grid.
      var ycount = 100;		
      var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
      var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
      var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
      
      // Create an (global) array to hold this ground-plane's vertices:
      this.gndVerts = new Float32Array(this.floatsPerVertex*2*(xcount+ycount));
      
                // draw a grid made of xcount+ycount lines; 2 vertices per line.
                
      var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
      var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
      
      // First, step thru x values as we make vertical lines of constant-x:
      for(v=0, j=0; v<2*xcount; v++, j+= this.floatsPerVertex) {
        if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
          this.gndVerts[j] = -xymax + (v  )*xgap;	// x
          this.gndVerts[j+1] = -xymax;								// y
          this.gndVerts[j+2] = 0.0;									// z
          this.gndVerts[j+3] = 1.0;									// w
        }
        else {				// put odd-numbered vertices at (xnow, +xymax, 0).
          this.gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
          this.gndVerts[j+1] = xymax;								// y
          this.gndVerts[j+2] = 0.0;									// z
          this.gndVerts[j+3] = 1.0;									// w.
        }
        this.gndVerts[j+4] = xColr[0];			// red
        this.gndVerts[j+5] = xColr[1];			// grn
        this.gndVerts[j+6] = xColr[2];			// blu
      }
      // Second, step thru y values as wqe make horizontal lines of constant-y:
      // (don't re-initialize j--we're adding more vertices to the array)
      for(v=0; v<2*ycount; v++, j+= this.floatsPerVertex) {
        if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
          this.gndVerts[j  ] = -xymax;								// x
          this.gndVerts[j+1] = -xymax + (v  )*ygap;	// y
          this.gndVerts[j+2] = 0.0;									// z
          this.gndVerts[j+3] = 1.0;									// w.
        }
        else {					// put odd-numbered vertices at (+xymax, ynow, 0).
          this.gndVerts[j  ] = xymax;								// x
          this.gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
          this.gndVerts[j+2] = 0.0;									// z
          this.gndVerts[j+3] = 1.0;									// w.
        }
        this.gndVerts[j+4] = yColr[0];			// red
        this.gndVerts[j+5] = yColr[1];			// grn
        this.gndVerts[j+6] = yColr[2];			// blu
      }
    }
  VBObox0.prototype.switchToMe = function() {
  //==============================================================================
  // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
  //
  // We only do this AFTER we called the init() function, which does the one-time-
  // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
  // even then, you are STILL not ready to draw our VBObox's contents onscreen!
  // We must also first complete these steps:
  //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
  //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
  //  c) tell the GPU to connect the shader program's attributes to that VBO.
  
  // a) select our shader program:
    gl.useProgram(this.shaderLoc);	
  //		Each call to useProgram() selects a shader program from the GPU memory,
  // but that's all -- it does nothing else!  Any previously used shader program's 
  // connections to attributes and uniforms are now invalid, and thus we must now
  // establish new connections between our shader program's attributes and the VBO
  // we wish to use.  
    
  // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
  //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
  //    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
                      this.vboLoc);			    // the ID# the GPU uses for our VBO.
  
  // c) connect our newly-bound VBO to supply attribute variable values for each
  // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
  // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
      this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
      this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
      gl.FLOAT,			// type == what data type did we use for those numbers?
      false,				// isNormalized == are these fixed-point values that we need
                    //									normalize before use? true or false
      this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                    // stored attrib for this vertex to the same stored attrib
                    //  for the next vertex in our VBO.  This is usually the 
                    // number of bytes used to store one complete vertex.  If set 
                    // to zero, the GPU gets attribute values sequentially from 
                    // VBO, starting at 'Offset'.	
                    // (Our vertex size in bytes: 4 floats for pos + 3 for color)
      this.vboOffset_a_Pos0);						
                    // Offset == how many bytes from START of buffer to the first
                    // value we will actually use?  (We start with position).
    gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
                          gl.FLOAT, false, 
                          this.vboStride, this.vboOffset_a_Colr0);
                  
  // --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
  }
  
  VBObox0.prototype.isReady = function() {
  //==============================================================================
  // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
  // this objects VBO and shader program; else return false.
  // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
  
  var isOK = true;
  
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
      console.log(this.constructor.name + 
                  '.isReady() false: shader program at this.shaderLoc not in use!');
      isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                '.isReady() false: vbo at this.vboLoc not in use!');
      isOK = false;
    }
    return isOK;
  }
  
  VBObox0.prototype.adjust = function() {
  //==============================================================================
  // Update the GPU to newer, current values we now store for 'uniform' vars on 
  // the GPU; and (if needed) update each attribute's stride and offset in VBO.
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.adjust() call you needed to call this.switchToMe()!!');
    }  
    this.a_red =    document.getElementById("a_r").value/100
    this.a_green =  document.getElementById("a_g").value/100 
    this.a_blue =   document.getElementById("a_b").value/100

    this.s_red =    document.getElementById("s_r").value/100 
    this.s_green =  document.getElementById("s_g").value/100 
    this.s_blue =   document.getElementById("s_b").value/100

    this.d_red =    document.getElementById("d_r").value/100 
    this.d_green =  document.getElementById("d_g").value/100 
    this.d_blue =   document.getElementById("d_b").value/100

    
    // Adjust values for our uniforms,
    //this.ModelMat.setRotate(0, 0, 0, 1);	  // rotate drawing axes,
    //this.ModelMat.translate(0, 0, 0);							// then translate them.
    //  Transfer new uniforms' values to the GPU:-------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    this.ModelMat.setIdentity();
    this.ModelMat.set(g_worldMat);	// use our global, shared camera.
    gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
                        false, 				// use matrix transpose instead?
                        this.ModelMat.elements);	// send data from Javascript.
    // Adjust the attributes' stride and offset (if necessary)
    // (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
    this.reload();
  }
  
  VBObox0.prototype.draw = function() {
  //=============================================================================
  // Render current VBObox contents.
  
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.draw() call you needed to call this.switchToMe()!!');
    }  

    // ----------------------------Draw the contents of the currently-bound VBO:
    gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
                    // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                    //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
                    0, 								// location of 1st vertex to draw;
                    this.vboVerts);		// number of vertices to draw on-screen.
  }
  
  VBObox0.prototype.reload = function() {
  //=============================================================================
  // Over-write current values in the GPU inside our already-created VBO: use 
  // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
  // contents to our VBO without changing any GPU memory allocations.
  
   gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                    0,                  // byte offset to where data replacement
                                        // begins in the VBO.
                      this.vboContents);   // the JS source-data array used to fill VBO
  }
  
  function VBObox1() {
    //=============================================================================
    //=============================================================================
    // CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
    // needed to render vertices from one Vertex Buffer Object (VBO) using one 
    // separate shader program (a vertex-shader & fragment-shader pair) and one
    // set of 'uniform' variables.
    
    // Constructor goal: 
    // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
    // written into code) in all other VBObox functions. Keeping all these (initial)
    // values here, in this one coonstrutor function, ensures we can change them 
    // easily WITHOUT disrupting any other code, ever!
      
      this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
      'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
      //
      'uniform mat4 u_ModelMat0;\n' +
      'uniform mat4 u_NormalMatrix;\n' +
      'uniform vec3 u_LightPosition;\n' +  // Position of the light source
      'uniform vec3 u_eyePos;\n' +
      'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
      'uniform vec3 u_DiffuseLight;\n' +   // Diffuse light color
      'uniform vec3 u_SpecularLight;\n' +   // Specular light color
      'uniform float shininessVal;\n' +
      'uniform vec3 Ka;\n' +
      'uniform vec3 Kd;\n' +
      'uniform vec3 Ks;\n' +
      'attribute vec4 a_Pos0;\n' +
      'attribute vec3 a_Normal;\n' +
      'varying vec4 v_Colr0;\n' +

      //
      'void main() {\n' +
      '  gl_Position = u_ModelMat0 * a_Pos0;\n' +
      '  vec4 vertexPosition = u_ModelMat0 * a_Pos0;\n' +
      '  vec4 transVec = u_NormalMatrix * vec4(a_Normal, 0.0);\n' +
      '  vec3 eyeDirection = normalize(u_eyePos - normalize(a_Pos0.xyz));\n' +
      '  vec3 lightVec = normalize(u_LightPosition - vec3(a_Pos0));\n' +
      '  vec3 normVec = normalize(transVec.xyz);\n' +
      '  vec3 reflect = reflect(-lightVec, normVec);\n' +
      '  float nDotL = max(dot(lightVec, normVec), 0.0);\n' +
      '  float rDotV = max(dot(reflect, eyeDirection), 0.0);\n' +
      '  float spec = pow(rDotV, shininessVal);\n' +
      '  vec3 ambient = u_AmbientLight * Ka;\n' +
      '  vec3 diffuse = nDotL * u_DiffuseLight * Kd;\n' +
      '  vec3 specular = spec * u_SpecularLight * Ks;\n' +
      '  v_Colr0 = vec4(diffuse + ambient + specular, 1.0);\n' +
      ' }\n';
    
      this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
      'precision mediump float;\n' +
      'varying vec4 v_Colr0;\n' +
      'void main() {\n' +
      '  gl_FragColor = vec4(v_Colr0);\n' + 
      '}\n';
      
      this.indices;
      this.floatsPerVertex = 10;
      this.sphVerts;
      this.makeUnitSphere();
      this.vboContents = new Float32Array(this.sphVerts);
      this.vboVerts = this.sphVerts.length/this.floatsPerVertex;						// # of vertices held in 'vboContents' array

      
      this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                    // bytes req'd by 1 vboContents array element;
                                    // (why? used to compute stride and offset 
                                    // in bytes for vertexAttribPointer() calls)
      this.vboBytes = this.vboContents.length * this.FSIZE;               
                                    // total number of bytes stored in vboContents
                                    // (#  of floats in vboContents array) * 
                                    // (# of bytes/float).
      this.vboStride = this.vboBytes / this.vboVerts; 
                                    // (== # of bytes to store one complete vertex).
                                    // From any attrib in a given vertex in the VBO, 
                                    // move forward by 'vboStride' bytes to arrive 
                                    // at the same attrib for the next vertex. 
    
                  //----------------------Attribute sizes
      this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                    // attribute named a_Pos0. (4: x,y,z,w values)
      this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
      console.log(this.FSIZE);
      console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
                      this.vboFcount_a_Colr0 +
                      3) *   // every attribute in our VBO
                      this.FSIZE == this.vboStride, // for agreeement with'stride'
                      "Uh oh! VBObox5.vboStride disagrees with attribute-size values!");
    
                  //----------------------Attribute offsets  
      this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
                                    // of 1st a_Pos0 attrib value in vboContents[]
      this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                    // (4 floats * bytes/float) 
                                    // # of bytes from START of vbo to the START
                                    // of 1st a_Colr0 attrib value in vboContents[]
                  //-----------------------GPU memory locations:
      this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                    // returned by gl.createBuffer() function call
      this.shaderLoc;								// GPU Location for compiled Shader-program  
                                    // set by compile/link of VERT_SRC and FRAG_SRC.
                              //------Attribute locations in our shaders:
      this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
      this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute
      this.a_NormalLoc;
      this.u_eyePosLoc;
      this.normals;
      this.spin = 0;

      this.u_DiffuseLightLoc;
      this.u_SpecLightLoc;
      this.u_LightPositionLoc;
      this.u_AmbientLightLoc;
      this.u_KdLoc;
      this.u_KaLoc;
      this.u_KsLoc;
      this.shinyLoc;
      this.light_x = document.getElementById("lx").value
    this.light_y = document.getElementById("ly").value
    this.light_z = document.getElementById("lz").value


      this.a_red =    document.getElementById("a_r").value/100
    this.a_green =  document.getElementById("a_g").value/100 
    this.a_blue =   document.getElementById("a_b").value/100

    this.s_red =    document.getElementById("s_r").value/100 
    this.s_green =  document.getElementById("s_g").value/100 
    this.s_blue =   document.getElementById("s_b").value/100

    this.d_red =    document.getElementById("d_r").value/100 
    this.d_green =  document.getElementById("d_g").value/100 
    this.d_blue =   document.getElementById("d_b").value/100


      this.u_NormalMatLoc;
      this.NormalMatrix = new Matrix4();
    
                  //---------------------- Uniform locations &values in our shaders
      this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
      this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform
      
    }
    
    VBObox1.prototype.init = function() {
    //=============================================================================
    // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
    // kept in this VBObox. (This function usually called only once, within main()).
    // Specifically:
    // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
    //  executable 'program' stored and ready to use inside the GPU.  
    // b) create a new VBO object in GPU memory and fill it by transferring in all
    //  the vertex data held in our Float32array member 'VBOcontents'. 
    // c) Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
    // -------------------
    // CAREFUL!  before you can draw pictures using this VBObox contents, 
    //  you must call this VBObox object's switchToMe() function too!
    //--------------------
    // a) Compile,link,upload shaders-----------------------------------------------
      this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
      if (!this.shaderLoc) {
        console.log(this.constructor.name + 
                    '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
      }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
    
      gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
    
    // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
      console.log('Failed to create the buffer object');
      return -1;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vboLoc);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);




    /*
      this.vboLoc = gl.createBuffer();	
      if (!this.vboLoc) {
        console.log(this.constructor.name + 
                    '.init() failed to create VBO in GPU. Bye!'); 
        return;
      }
      // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
      //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
      // (positions, colors, normals, etc), or 
      //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
      // that each select one vertex from a vertex array stored in another VBO.
      gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                      this.vboLoc);				  // the ID# the GPU uses for this buffer.
    
      // Fill the GPU's newly-created VBO object with the vertex data we stored in
      //  our 'vboContents' member (JavaScript Float32Array object).
      //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
      //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
      gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                        this.vboContents, 		// JavaScript Float32Array
                       gl.STATIC_DRAW);			// Usage hint.
      */




      //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
      //	(see OpenGL ES specification for more info).  Your choices are:
      //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
      //				contents rarely or never change.
      //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
      //				contents may change often as our program runs.
      //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
      // 			times and then discarded; for rapidly supplied & consumed VBOs.
    
      // c1) Find All Attributes:---------------------------------------------------
      //  Find & save the GPU location of all our shaders' attribute-variables and 
      //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
      this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
      if(this.a_PosLoc < 0) {
        console.log(this.constructor.name + 
                    '.init() Failed to get GPU location of attribute a_Pos0');
        return -1;	// error exit.
      }
      /*
       this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
      if(this.a_ColrLoc < 0) {
        console.log(this.constructor.name + 
                    '.init() failed to get the GPU location of attribute a_Colr0');
        return -1;	// error exit.
      }
      */
    
     this.u_eyePosLoc = gl.getUniformLocation(this.shaderLoc, 'u_eyePos');
     if (!this.u_eyePosLoc) { 
       console.log(this.constructor.name + 
                   '.init() failed to get GPU location for u_eyePos uniform');
       return;
     } 

     this.u_KdLoc = gl.getUniformLocation(this.shaderLoc, 'Kd');
     if (!this.u_KdLoc) { 
       console.log(this.constructor.name + 
                   '.init() failed to get GPU location for Kd uniform');
       return;
     } 

     this.u_KaLoc = gl.getUniformLocation(this.shaderLoc, 'Ka');
     if (!this.u_KaLoc) { 
       console.log(this.constructor.name + 
                   '.init() failed to get GPU location for Ka uniform');
       return;
     } 

     this.u_KsLoc = gl.getUniformLocation(this.shaderLoc, 'Ks');
     if (!this.u_KsLoc) { 
       console.log(this.constructor.name + 
                   '.init() failed to get GPU location for Ks uniform');
       return;
     } 

     this.u_DiffuseLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_DiffuseLight');
     if (!this.u_DiffuseLightLoc) { 
       console.log(this.constructor.name + 
                   '.init() failed to get GPU location for u_DiffuseLight uniform');
       return;
     }

     this.u_SpecLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_SpecularLight');
      if (!this.u_SpecLightLoc) { 
        console.log(this.constructor.name + 
                    '.init() failed to get GPU location for u_SpecularLight uniform');
        return;
      } 

      this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
      if(this.a_NormalLoc < 0) {
        console.log(this.constructor.name + 
                    '.init() Failed to get GPU location of attribute a_Normal');
        return -1;	// error exit.
      }

      this.shinyLoc = gl.getUniformLocation(this.shaderLoc, 'shininessVal');
      if (!this.shinyLoc) { 
        console.log(this.constructor.name + 
                    '.init() failed to get GPU location for u_ShininessVal uniform');
        return;
      } 
      
      this.u_NormalMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
      if (!this.u_NormalMatLoc) { 
        console.log(this.constructor.name + 
                    '.init() failed to get GPU location for u_NormalMatrix uniform');
        return;
      }  

      this.u_AmbientLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_AmbientLight');
      if (!this.u_AmbientLightLoc) { 
        console.log(this.constructor.name + 
                    '.init() failed to get GPU location for u_AmbientLight uniform');
        return;
      } 

      this.u_LightPositionLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
      if (!this.u_LightPositionLoc) { 
        console.log(this.constructor.name + 
                    '.init() failed to get GPU location for u_NormalMatrix uniform');
        return;
      }  
      // c2) Find All Uniforms:-----------------------------------------------------
      //Get GPU storage location for each uniform var used in our shader programs: 
      this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
      if (!this.u_ModelMatLoc) { 
        console.log(this.constructor.name + 
                    '.init() failed to get GPU location for u_ModelMat1 uniform');
        return;
      }  
    }
  
    VBObox1.prototype.switchToMe = function() {
    //==============================================================================
    // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
    //
    // We only do this AFTER we called the init() function, which does the one-time-
    // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
    // even then, you are STILL not ready to draw our VBObox's contents onscreen!
    // We must also first complete these steps:
    //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
    //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
    //  c) tell the GPU to connect the shader program's attributes to that VBO.
    
    // a) select our shader program:
      gl.useProgram(this.shaderLoc);	
    //		Each call to useProgram() selects a shader program from the GPU memory,
    // but that's all -- it does nothing else!  Any previously used shader program's 
    // connections to attributes and uniforms are now invalid, and thus we must now
    // establish new connections between our shader program's attributes and the VBO
    // we wish to use.  
      
    // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
    //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
    var posBuffer = gl.createBuffer();
    var normBuffer = gl.createBuffer();
        if (!posBuffer) {
          console.log('Failed to create the posbuffer object');
          return false;
        }
        if (!normBuffer) {
          console.log('Failed to create the normBuffer object');
          return false;
        }
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vboContents), gl.STATIC_DRAW);
    gl.vertexAttribPointer(this.a_PosLoc, 4, gl.FLOAT, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(this.a_PosLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
    gl.vertexAttribPointer(this.a_NormalLoc, 3, gl.FLOAT, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(this.a_NormalLoc);


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vboLoc);
    /*
    //    supply values to use as attributes in our newly-selected shader program:
      gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
                        this.vboLoc);			    // the ID# the GPU uses for our VBO.
    
    // c) connect our newly-bound VBO to supply attribute variable values for each
    // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
    // this sets up data paths from VBO to our shader units:
      // 	Here's how to use the almost-identical OpenGL version of this function:

      

      /*
      //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
      gl.vertexAttribPointer(
        this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
        this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,			// type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
                      //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                      // stored attrib for this vertex to the same stored attrib
                      //  for the next vertex in our VBO.  This is usually the 
                      // number of bytes used to store one complete vertex.  If set 
                      // to zero, the GPU gets attribute values sequentially from 
                      // VBO, starting at 'Offset'.	
                      // (Our vertex size in bytes: 4 floats for pos + 3 for color)
        this.vboOffset_a_Pos0);						
                      // Offset == how many bytes from START of buffer to the first
                      // value we will actually use?  (We start with position).
      gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
                            gl.FLOAT, false, 
                            this.vboStride, this.vboOffset_a_Colr0);
      gl.vertexAttribPointer(
        this.a_NormalLoc,//index == ID# for the attribute var in your GLSL shader pgm;
        3,// # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,			// type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
                      //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                      // stored attrib for this vertex to the same stored attrib
                      //  for the next vertex in our VBO.  This is usually the 
                      // number of bytes used to store one complete vertex.  If set 
                      // to zero, the GPU gets attribute values sequentially from 
                      // VBO, starting at 'Offset'.	
                      // (Our vertex size in bytes: 4 floats for pos + 3 for color)
        this.FSIZE * 7);						
                      // Offset == how many bytes from START of buffer to the first
                      // value we will actually use?  (We start with position).

                    
    // --Enable this assignment of each of these attributes to its' VBO source:
      gl.enableVertexAttribArray(this.a_PosLoc);
      gl.enableVertexAttribArray(this.a_ColrLoc);
      gl.enableVertexAttribArray(this.a_NormalLoc);

      */
    }
    
    VBObox1.prototype.isReady = function() {
    //==============================================================================
    // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
    // this objects VBO and shader program; else return false.
    // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
    
    var isOK = true;
    
      if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name + 
                    '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
      }
      if(gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING) != this.vboLoc) {
          console.log(this.constructor.name + 
                  '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
      }
      return isOK;
    }

    VBObox1.prototype.adjust = function() {
    //==============================================================================
    // Update the GPU to newer, current values we now store for 'uniform' vars on 
    // the GPU; and (if needed) update each attribute's stride and offset in VBO.
    
      // check: was WebGL context set to use our VBO & shader program?
      if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                  '.adjust() call you needed to call this.switchToMe()!!');
      }
      this.a_red =    document.getElementById("a_r").value/100
    this.a_green =  document.getElementById("a_g").value/100 
    this.a_blue =   document.getElementById("a_b").value/100

    this.s_red =    document.getElementById("s_r").value/100 
    this.s_green =  document.getElementById("s_g").value/100 
    this.s_blue =   document.getElementById("s_b").value/100

    this.d_red =    document.getElementById("d_r").value/100 
    this.d_green =  document.getElementById("d_g").value/100 
    this.d_blue =   document.getElementById("d_b").value/100

    this.light_x = document.getElementById("lx").value
    this.light_y = document.getElementById("ly").value
    this.light_z = document.getElementById("lz").value

  
      gl.uniform1f(this.shinyLoc, shinyVal);
      gl.uniform3f(this.u_KsLoc, specularVal[0], specularVal[1], specularVal[2]);
      gl.uniform3f(this.u_KdLoc, diffuseVal[0], diffuseVal[1], diffuseVal[2]);
      gl.uniform3f(this.u_KaLoc, ambientVal[0], ambientVal[1], ambientVal[2]);
      gl.uniform3f(this.u_LightPositionLoc, this.light_x, this.light_y,this.light_z)
      gl.uniform3f(this.u_AmbientLightLoc, this.a_red,this.a_green,this.a_blue);
      gl.uniform3f(this.u_DiffuseLightLoc, this.d_red,this.d_green,this.d_blue);
      gl.uniform3f(this.u_SpecLightLoc, this.s_red,this.s_green,this.s_blue);
      gl.uniform3f(this.u_eyePosLoc, g_EyeX, g_EyeY, g_EyeZ);
      
      this.ModelMat.setIdentity();
    this.ModelMat.set(g_worldMat);	// use our global, shared camera.
    this.spin+=0.3
    this.ModelMat.translate(0,0,4)
    this.ModelMat.scale(3,3,3)
    this.ModelMat.rotate(this.spin,0,0,1);
      gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.ModelMat.elements);	// send data from Javascript.
// Adjust the attributes' stride and offset (if necessary)
// (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
    this.NormalMatrix.setIdentity();
    this.NormalMatrix.translate(0,0,4)
    this.NormalMatrix.scale(3,3,3)
    this.NormalMatrix.rotate(this.spin,0,0,1);
    gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.NormalMatrix.elements);	// send data from Javascript.
    }
    
    VBObox1.prototype.draw = function() {
    //=============================================================================
    // Render current VBObox contents.
    
    
      // check: was WebGL context set to use our VBO & shader program?
      if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                  '.draw() call you needed to call this.switchToMe()!!');
      }  
  
      // ----------------------------Draw the contents of the currently-bound VBO:
      gl.drawElements(gl.TRIANGLES, 	    // select the drawing primitive to draw,
                      // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                      //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
                     this.indices.length,
                     gl.UNSIGNED_SHORT,
                     0);		// number of vertices to draw on-screen.
    }
    
    VBObox1.prototype.reload = function() {
    //=============================================================================
    // Over-write current values in the GPU inside our already-created VBO: use 
    // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
    // contents to our VBO without changing any GPU memory allocations.
    
     gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                      0,                  // byte offset to where data replacement
                                          // begins in the VBO.
                        this.vboContents);   // the JS source-data array used to fill VBO
    }


VBObox1.prototype.makeUnitSphere = function()
{
  var SPHERE_DIV = 26;

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  this.sphVerts = [];
  this.indices = [];
  this.normals = [];

  // Generate coordinates
  for (j = 0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      this.sphVerts.push(si * sj);  // X
      this.normals.push(si * sj);  // X
      this.sphVerts.push(cj);       // Y
      this.normals.push(cj);       // Y
      this.sphVerts.push(ci * sj);  // Z
      this.normals.push(ci * sj);  // Z
      this.sphVerts.push(1);        // W
    }
  }

  // Generate indices
  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV+1) + i;
      p2 = p1 + (SPHERE_DIV+1);

      this.indices.push(p1);
      this.indices.push(p2);
      this.indices.push(p1 + 1);

      this.indices.push(p1 + 1);
      this.indices.push(p2);
      this.indices.push(p2 + 1);
    }
  }
}

VBObox1.prototype.makeTriangle = function(){
  // Node 0 (apex, +z axis; 			color--blue, 				surf normal (all verts):
  var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);						 
	// for surface normals:
	var sq23 = Math.sqrt(2.0/3.0)
	var sq29 = Math.sqrt(2.0/9.0)
	var sq89 = Math.sqrt(8.0/9.0)
	var thrd = 1.0/3.0;
  this.triangleVerts = [
    0.0,	 0.0, sq2, 1.0,			0.0, 	0.0,	1.0,		 sq23,	sq29, thrd,
  // Node 1 (base: lower rt; red)
        c30, -0.5, 0.0, 1.0, 			1.0,  0.0,  0.0, 		sq23,	sq29, thrd,
  // Node 2 (base: +y axis;  grn)
        0.0,  1.0, 0.0, 1.0,  		0.0,  1.0,  0.0,		sq23,	sq29, thrd, 
// Face 1: (left side).		Unit Normal Vector: N1 = (-sq23, sq29, thrd)
  // Node 0 (apex, +z axis;  blue)
        0.0,	 0.0, sq2, 1.0,			0.0, 	0.0,	1.0,	 -sq23,	sq29, thrd,
  // Node 2 (base: +y axis;  grn)
        0.0,  1.0, 0.0, 1.0,  		0.0,  1.0,  0.0,	 -sq23,	sq29, thrd,
  // Node 3 (base:lower lft; white)
       -c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0, 	 -sq23,	sq29,	thrd,
// Face 2: (lower side) 	Unit Normal Vector: N2 = (0.0, -sq89, thrd)
  // Node 0 (apex, +z axis;  blue) 
        0.0,	 0.0, sq2, 1.0,			0.0, 	0.0,	1.0,		0.0, -sq89,	thrd,
 // Node 3 (base:lower lft; white)
       -c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0, 		0.0, -sq89,	thrd,          																							//0.0, 0.0, 0.0, // Normals debug
  // Node 1 (base: lower rt; red) 
        c30, -0.5, 0.0, 1.0, 			1.0,  0.0,  0.0, 		0.0, -sq89,	thrd,
// Face 3: (base side)  Unit Normal Vector: N2 = (0.0, 0.0, -1.0)
 // Node 3 (base:lower lft; white)
       -c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0, 		0.0, 	0.0, -1.0,
 // Node 2 (base: +y axis;  grn)
        0.0,  1.0, 0.0, 1.0,  		0.0,  1.0,  0.0,		0.0, 	0.0, -1.0,
 // Node 1 (base: lower rt; red)
        c30, -0.5, 0.0, 1.0, 			1.0,  0.0,  0.0, 		0.0, 	0.0, -1.0,
];
}






//=============================================================================
//=============================================================================

function VBObox3() {
  //=============================================================================
  //=============================================================================
  // CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
  // needed to render vertices from one Vertex Buffer Object (VBO) using one 
  // separate shader program (a vertex-shader & fragment-shader pair) and one
  // set of 'uniform' variables.
  
  // Constructor goal: 
  // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
  // written into code) in all other VBObox functions. Keeping all these (initial)
  // values here, in this one coonstrutor function, ensures we can change them 
  // easily WITHOUT disrupting any other code, ever!
    
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
    //
    'uniform mat4 u_ModelMat0;\n' +
    'uniform mat4 u_NormalMatrix;\n' +
    'uniform vec3 u_LightPosition;\n' +  // Position of the light source
    'uniform vec3 u_eyePos;\n' +
    'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
    'uniform vec3 u_DiffuseLight;\n' +   // Diffuse light color
    'uniform vec3 u_SpecularLight;\n' +   // Specular light color
    'uniform float shininessVal;\n' +
    'uniform vec3 Ka;\n' +
    'uniform vec3 Kd;\n' +
    'uniform vec3 Ks;\n' +
    'attribute vec4 a_Pos0;\n' +
    'attribute vec3 a_Normal;\n' +
    'varying vec4 v_Colr0;\n' +

    //
    'void main() {\n' +
    '  vec4 color = vec4(0.5, 0.5, 0.5, 1.0);\n' +
    '  gl_Position = u_ModelMat0 * a_Pos0;\n' +
    '  vec4 vertexPosition = u_ModelMat0 * a_Pos0;\n' +
    '  vec4 transVec = u_NormalMatrix * vec4(a_Normal, 0.0);\n' +
    '  vec3 eyeDirection = normalize(u_eyePos - normalize(a_Pos0.xyz));\n' +
    '  vec3 lightVec = normalize(u_LightPosition - vec3(a_Pos0));\n' +
    '  vec3 normVec = normalize(transVec.xyz);\n' +
    '  vec3 H = normalize(lightVec + eyeDirection); \n' +
    '  float nDotL = max(dot(lightVec, normVec), 0.0);\n' +
    '  float nDotH = max(dot(H, normVec), 0.0);\n' +
    '  float spec = pow(nDotH, shininessVal);\n' +
    '  vec3 ambient = u_AmbientLight * Ka;\n' +
    '  vec3 diffuse = nDotL * u_DiffuseLight * Kd;\n' +
    '  vec3 specular = spec * u_SpecularLight * Ks;\n' +
    '  v_Colr0 = vec4(diffuse + ambient + specular, 1.0);\n' +
    ' }\n';
  
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision mediump float;\n' +
    'varying vec4 v_Colr0;\n' +
    'void main() {\n' +
    '  gl_FragColor = vec4(v_Colr0);\n' + 
    '}\n';
    
    this.indices;
    this.floatsPerVertex = 10;
    this.sphVerts;
    this.makeUnitSphere();
    this.vboContents = new Float32Array(this.sphVerts);
    this.vboVerts = this.sphVerts.length/this.floatsPerVertex;						// # of vertices held in 'vboContents' array

    
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                  // bytes req'd by 1 vboContents array element;
                                  // (why? used to compute stride and offset 
                                  // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;               
                                  // total number of bytes stored in vboContents
                                  // (#  of floats in vboContents array) * 
                                  // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts; 
                                  // (== # of bytes to store one complete vertex).
                                  // From any attrib in a given vertex in the VBO, 
                                  // move forward by 'vboStride' bytes to arrive 
                                  // at the same attrib for the next vertex. 
  
                //----------------------Attribute sizes
    this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                  // attribute named a_Pos0. (4: x,y,z,w values)
    this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
    console.log(this.FSIZE);
    console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
                    this.vboFcount_a_Colr0 +
                    3) *   // every attribute in our VBO
                    this.FSIZE == this.vboStride, // for agreeement with'stride'
                    "Uh oh! VBObox5.vboStride disagrees with attribute-size values!");
  
                //----------------------Attribute offsets  
    this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
                                  // of 1st a_Pos0 attrib value in vboContents[]
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                  // (4 floats * bytes/float) 
                                  // # of bytes from START of vbo to the START
                                  // of 1st a_Colr0 attrib value in vboContents[]
                //-----------------------GPU memory locations:
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                  // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
                                  // set by compile/link of VERT_SRC and FRAG_SRC.
                            //------Attribute locations in our shaders:
    this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
    this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute
    this.a_NormalLoc;
    this.u_eyePosLoc;
    this.normals;
    this.spin = 0;

    this.u_DiffuseLightLoc;
    this.u_SpecLightLoc;
    this.u_LightPositionLoc;
    this.u_AmbientLightLoc;
    this.u_KdLoc;
    this.u_KaLoc;
    this.u_KsLoc;
    this.shinyLoc;
    this.light_x = document.getElementById("lx").value
    this.light_y = document.getElementById("ly").value
    this.light_z = document.getElementById("lz").value
    this.a_red =    document.getElementById("a_r").value/100
    this.a_green =  document.getElementById("a_g").value/100 
    this.a_blue =   document.getElementById("a_b").value/100

    this.s_red =    document.getElementById("s_r").value/100 
    this.s_green =  document.getElementById("s_g").value/100 
    this.s_blue =   document.getElementById("s_b").value/100

    this.d_red =    document.getElementById("d_r").value/100 
    this.d_green =  document.getElementById("d_g").value/100 
    this.d_blue =   document.getElementById("d_b").value/100


    this.u_NormalMatLoc;
    this.NormalMatrix = new Matrix4();
  
                //---------------------- Uniform locations &values in our shaders
    this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform
    
  }
  
  VBObox3.prototype.init = function() {
  //=============================================================================
  // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
  // kept in this VBObox. (This function usually called only once, within main()).
  // Specifically:
  // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
  //  executable 'program' stored and ready to use inside the GPU.  
  // b) create a new VBO object in GPU memory and fill it by transferring in all
  //  the vertex data held in our Float32array member 'VBOcontents'. 
  // c) Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
  // -------------------
  // CAREFUL!  before you can draw pictures using this VBObox contents, 
  //  you must call this VBObox object's switchToMe() function too!
  //--------------------
  // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create executable Shaders on the GPU. Bye!');
      return;
    }
  // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
  //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
  
    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
  
  // b) Create VBO on GPU, fill it------------------------------------------------
  this.vboLoc = gl.createBuffer();
  if (!this.vboLoc) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vboLoc);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);




  /*
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create VBO in GPU. Bye!'); 
      return;
    }
    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                    this.vboLoc);				  // the ID# the GPU uses for this buffer.
  
    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                      this.vboContents, 		// JavaScript Float32Array
                     gl.STATIC_DRAW);			// Usage hint.
    */




    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.
  
    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if(this.a_PosLoc < 0) {
      console.log(this.constructor.name + 
                  '.init() Failed to get GPU location of attribute a_Pos0');
      return -1;	// error exit.
    }
    /*
     this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if(this.a_ColrLoc < 0) {
      console.log(this.constructor.name + 
                  '.init() failed to get the GPU location of attribute a_Colr0');
      return -1;	// error exit.
    }
    */
  
   this.u_eyePosLoc = gl.getUniformLocation(this.shaderLoc, 'u_eyePos');
   if (!this.u_eyePosLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for u_eyePos uniform');
     return;
   } 

   this.u_KdLoc = gl.getUniformLocation(this.shaderLoc, 'Kd');
   if (!this.u_KdLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for Kd uniform');
     return;
   } 

   this.u_KaLoc = gl.getUniformLocation(this.shaderLoc, 'Ka');
   if (!this.u_KaLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for Ka uniform');
     return;
   } 

   this.u_KsLoc = gl.getUniformLocation(this.shaderLoc, 'Ks');
   if (!this.u_KsLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for Ks uniform');
     return;
   } 

   this.u_DiffuseLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_DiffuseLight');
   if (!this.u_DiffuseLightLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for u_DiffuseLight uniform');
     return;
   }

   this.u_SpecLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_SpecularLight');
    if (!this.u_SpecLightLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_SpecularLight uniform');
      return;
    } 

    this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_NormalLoc < 0) {
      console.log(this.constructor.name + 
                  '.init() Failed to get GPU location of attribute a_Normal');
      return -1;	// error exit.
    }

    this.shinyLoc = gl.getUniformLocation(this.shaderLoc, 'shininessVal');
    if (!this.shinyLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_ShininessVal uniform');
      return;
    } 
    
    this.u_NormalMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
    if (!this.u_NormalMatLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_NormalMatrix uniform');
      return;
    }  

    this.u_AmbientLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_AmbientLight');
    if (!this.u_AmbientLightLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_AmbientLight uniform');
      return;
    } 

    this.u_LightPositionLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
    if (!this.u_LightPositionLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_NormalMatrix uniform');
      return;
    }  
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs: 
    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
    if (!this.u_ModelMatLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_ModelMat1 uniform');
      return;
    }  
  }

  VBObox3.prototype.switchToMe = function() {
  //==============================================================================
  // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
  //
  // We only do this AFTER we called the init() function, which does the one-time-
  // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
  // even then, you are STILL not ready to draw our VBObox's contents onscreen!
  // We must also first complete these steps:
  //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
  //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
  //  c) tell the GPU to connect the shader program's attributes to that VBO.
  
  // a) select our shader program:
    gl.useProgram(this.shaderLoc);	
  //		Each call to useProgram() selects a shader program from the GPU memory,
  // but that's all -- it does nothing else!  Any previously used shader program's 
  // connections to attributes and uniforms are now invalid, and thus we must now
  // establish new connections between our shader program's attributes and the VBO
  // we wish to use.  
    
  // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
  //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
  var posBuffer = gl.createBuffer();
  var normBuffer = gl.createBuffer();
      if (!posBuffer) {
        console.log('Failed to create the posbuffer object');
        return false;
      }
      if (!normBuffer) {
        console.log('Failed to create the normBuffer object');
        return false;
      }
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vboContents), gl.STATIC_DRAW);
  gl.vertexAttribPointer(this.a_PosLoc, 4, gl.FLOAT, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(this.a_PosLoc);

  gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
  gl.vertexAttribPointer(this.a_NormalLoc, 3, gl.FLOAT, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(this.a_NormalLoc);


  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vboLoc);
  /*
  //    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
                      this.vboLoc);			    // the ID# the GPU uses for our VBO.
  
  // c) connect our newly-bound VBO to supply attribute variable values for each
  // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
  // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:

    

    /*
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
      this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
      this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
      gl.FLOAT,			// type == what data type did we use for those numbers?
      false,				// isNormalized == are these fixed-point values that we need
                    //									normalize before use? true or false
      this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                    // stored attrib for this vertex to the same stored attrib
                    //  for the next vertex in our VBO.  This is usually the 
                    // number of bytes used to store one complete vertex.  If set 
                    // to zero, the GPU gets attribute values sequentially from 
                    // VBO, starting at 'Offset'.	
                    // (Our vertex size in bytes: 4 floats for pos + 3 for color)
      this.vboOffset_a_Pos0);						
                    // Offset == how many bytes from START of buffer to the first
                    // value we will actually use?  (We start with position).
    gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
                          gl.FLOAT, false, 
                          this.vboStride, this.vboOffset_a_Colr0);
    gl.vertexAttribPointer(
      this.a_NormalLoc,//index == ID# for the attribute var in your GLSL shader pgm;
      3,// # of floats used by this attribute: 1,2,3 or 4?
      gl.FLOAT,			// type == what data type did we use for those numbers?
      false,				// isNormalized == are these fixed-point values that we need
                    //									normalize before use? true or false
      this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                    // stored attrib for this vertex to the same stored attrib
                    //  for the next vertex in our VBO.  This is usually the 
                    // number of bytes used to store one complete vertex.  If set 
                    // to zero, the GPU gets attribute values sequentially from 
                    // VBO, starting at 'Offset'.	
                    // (Our vertex size in bytes: 4 floats for pos + 3 for color)
      this.FSIZE * 7);						
                    // Offset == how many bytes from START of buffer to the first
                    // value we will actually use?  (We start with position).

                  
  // --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
    gl.enableVertexAttribArray(this.a_NormalLoc);

    */
  }
  
  VBObox3.prototype.isReady = function() {
  //==============================================================================
  // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
  // this objects VBO and shader program; else return false.
  // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
  
  var isOK = true;
  
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
      console.log(this.constructor.name + 
                  '.isReady() false: shader program at this.shaderLoc not in use!');
      isOK = false;
    }
    if(gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                '.isReady() false: vbo at this.vboLoc not in use!');
      isOK = false;
    }
    return isOK;
  }

  VBObox3.prototype.adjust = function() {
  //==============================================================================
  // Update the GPU to newer, current values we now store for 'uniform' vars on 
  // the GPU; and (if needed) update each attribute's stride and offset in VBO.
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.adjust() call you needed to call this.switchToMe()!!');
    }  
    this.a_red =    document.getElementById("a_r").value/100
    this.a_green =  document.getElementById("a_g").value/100 
    this.a_blue =   document.getElementById("a_b").value/100

    this.s_red =    document.getElementById("s_r").value/100 
    this.s_green =  document.getElementById("s_g").value/100 
    this.s_blue =   document.getElementById("s_b").value/100

    this.d_red =    document.getElementById("d_r").value/100 
    this.d_green =  document.getElementById("d_g").value/100 
    this.d_blue =   document.getElementById("d_b").value/100

    this.light_x = document.getElementById("lx").value
    this.light_y = document.getElementById("ly").value
    this.light_z = document.getElementById("lz").value

    gl.uniform3f(this.u_LightPositionLoc, this.light_x, this.light_y,this.light_z)
    gl.uniform3f(this.u_AmbientLightLoc, this.a_red,this.a_green,this.a_blue);
    gl.uniform3f(this.u_DiffuseLightLoc, this.d_red,this.d_green,this.d_blue)
    gl.uniform3f(this.u_SpecLightLoc, this.s_red,this.s_green,this.s_blue);
    gl.uniform1f(this.shinyLoc, shinyVal);
    gl.uniform3f(this.u_KsLoc, specularVal[0], specularVal[1], specularVal[2]);
    gl.uniform3f(this.u_KdLoc, diffuseVal[0], diffuseVal[1], diffuseVal[2]);
    gl.uniform3f(this.u_KaLoc, ambientVal[0], ambientVal[1], ambientVal[2]);
    gl.uniform3f(this.u_eyePosLoc, g_EyeX, g_EyeY, g_EyeZ);
    
    // Adjust values for our uniforms,
    this.ModelMat.setIdentity();
    this.ModelMat.set(g_worldMat);	// use our global, shared camera.
    this.spin+=0.3
    this.ModelMat.translate(0,0,4)
    this.ModelMat.scale(3,3,3)
    this.ModelMat.rotate(this.spin,0,0,1);
      gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.ModelMat.elements);	// send data from Javascript.
// Adjust the attributes' stride and offset (if necessary)
// (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
    this.NormalMatrix.setIdentity();
    this.NormalMatrix.translate(0,0,4)
    this.NormalMatrix.scale(3,3,3)
    this.NormalMatrix.rotate(this.spin,0,0,1);
    gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.NormalMatrix.elements);	// send data from Javascript.

    
  }
  
  VBObox3.prototype.draw = function() {
  //=============================================================================
  // Render current VBObox contents.
  
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.draw() call you needed to call this.switchToMe()!!');
    }  

    // ----------------------------Draw the contents of the currently-bound VBO:
    gl.drawElements(gl.TRIANGLES, 	    // select the drawing primitive to draw,
                    // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                    //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
                   this.indices.length,
                   gl.UNSIGNED_SHORT,
                   0);		// number of vertices to draw on-screen.
  }
  
  VBObox3.prototype.reload = function() {
  //=============================================================================
  // Over-write current values in the GPU inside our already-created VBO: use 
  // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
  // contents to our VBO without changing any GPU memory allocations.
  
   gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                    0,                  // byte offset to where data replacement
                                        // begins in the VBO.
                      this.vboContents);   // the JS source-data array used to fill VBO
  }


VBObox3.prototype.makeUnitSphere = function()
{
var SPHERE_DIV = 26;

var i, ai, si, ci;
var j, aj, sj, cj;
var p1, p2;

this.sphVerts = [];
this.indices = [];
this.normals = [];

// Generate coordinates
for (j = 0; j <= SPHERE_DIV; j++) {
  aj = j * Math.PI / SPHERE_DIV;
  sj = Math.sin(aj);
  cj = Math.cos(aj);
  for (i = 0; i <= SPHERE_DIV; i++) {
    ai = i * 2 * Math.PI / SPHERE_DIV;
    si = Math.sin(ai);
    ci = Math.cos(ai);

    this.sphVerts.push(si * sj);  // X
    this.normals.push(si * sj);  // X
    this.sphVerts.push(cj);       // Y
    this.normals.push(cj);       // Y
    this.sphVerts.push(ci * sj);  // Z
    this.normals.push(ci * sj);  // Z
    this.sphVerts.push(1);        // W
  }
}

// Generate indices
for (j = 0; j < SPHERE_DIV; j++) {
  for (i = 0; i < SPHERE_DIV; i++) {
    p1 = j * (SPHERE_DIV+1) + i;
    p2 = p1 + (SPHERE_DIV+1);

    this.indices.push(p1);
    this.indices.push(p2);
    this.indices.push(p1 + 1);

    this.indices.push(p1 + 1);
    this.indices.push(p2);
    this.indices.push(p2 + 1);
  }
}
}

//PHONG SHADING WITH BLINN PHONG LIGHTING

function VBObox4() {
  //=============================================================================
  //=============================================================================
  // CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
  // needed to render vertices from one Vertex Buffer Object (VBO) using one 
  // separate shader program (a vertex-shader & fragment-shader pair) and one
  // set of 'uniform' variables.
  
  // Constructor goal: 
  // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
  // written into code) in all other VBObox functions. Keeping all these (initial)
  // values here, in this one coonstrutor function, ensures we can change them 
  // easily WITHOUT disrupting any other code, ever!
    
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
    //
    'uniform mat4 u_ModelMat0;\n' +
    'uniform mat4 u_NormalMatrix;\n' +
    'uniform vec3 u_Kd; \n' +
    'attribute vec4 a_Pos0;\n' +
    'attribute vec3 a_Normal;\n' +
    	//-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
	  'varying vec3 v_Kd; \n' +							// Phong Lighting: diffuse reflectance
    // (I didn't make per-pixel Ke,Ka,Ks;
    // we use 'uniform' values instead)
    'varying vec4 v_Position; \n' +				
    'varying vec3 v_Normal; \n' +					// Why Vec3? its not a point, hence w==0

    //
    'void main() {\n' +
    '  gl_Position = u_ModelMat0 * a_Pos0;\n' +
    '  v_Position = a_Pos0;\n' +
    '  v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));\n' +
    '  v_Kd = u_Kd;\n'  +
    ' }\n';
  
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision highp float;\n' +
    'precision highp int;\n' +
    'uniform vec3 Ka;\n' +						// Phong Reflectance: ambient
	  // no Phong Reflectance: diffuse? -- no: use v_Kd instead for per-pixel value
    'uniform vec3 Ks;\n' +						// Phong Reflectance: specular
    'uniform float u_ShininessVal;\n' +				// Phong Reflectance: 1 < shiny < 128
    'uniform vec3 u_eyePos;\n' + 	// Camera/eye location in world coords.
    'uniform vec3 u_LightPosition;\n' +
    'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
    'uniform vec3 u_DiffuseLight;\n' +   // Diffuse light color
    'uniform vec3 u_SpecularLight;\n' +   // Specular light color


    'varying vec3 v_Kd; \n' +							// Phong Lighting: diffuse reflectance
    'varying vec4 v_Position; \n' +				
    'varying vec3 v_Normal; \n' +					// Why Vec3? its not a point, hence w==0
    'varying vec4 v_Colr0;\n' +
    'void main() {\n' +
    
    '  vec3 normal = normalize(v_Normal);\n' +
    '  vec3 lightVec = normalize(u_LightPosition - vec3(v_Position));\n' +
    '  vec3 eyeDirection = normalize(u_eyePos - normalize(v_Position.xyz));\n' +
    '  float nDotL = max(dot(lightVec, normal), 0.0);\n' +

    '  vec3 H = normalize(lightVec + eyeDirection); \n' +
    '  float nDotH = max(dot(H, normal), 0.0);\n' +
    '  float spec = pow(nDotH, float(u_ShininessVal));\n' +
    '  vec3 ambient = u_AmbientLight * Ka;\n' +
    '  vec3 diffuse = nDotL * u_DiffuseLight * v_Kd;\n' +
    '  vec3 specular = spec * u_SpecularLight * Ks;\n' +
    '  gl_FragColor = vec4(ambient + diffuse + specular, 1.0);\n' + 

    '}\n';
    
    this.indices;
    this.floatsPerVertex = 10;
    this.sphVerts;
    this.makeUnitSphere();
    this.vboContents = new Float32Array(this.sphVerts);
    this.vboVerts = this.sphVerts.length/this.floatsPerVertex;						// # of vertices held in 'vboContents' array

    
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                  // bytes req'd by 1 vboContents array element;
                                  // (why? used to compute stride and offset 
                                  // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;               
                                  // total number of bytes stored in vboContents
                                  // (#  of floats in vboContents array) * 
                                  // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts; 
                                  // (== # of bytes to store one complete vertex).
                                  // From any attrib in a given vertex in the VBO, 
                                  // move forward by 'vboStride' bytes to arrive 
                                  // at the same attrib for the next vertex. 
  
                //----------------------Attribute sizes
    this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                  // attribute named a_Pos0. (4: x,y,z,w values)
    this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
    console.log(this.FSIZE);
    console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
                    this.vboFcount_a_Colr0 +
                    3) *   // every attribute in our VBO
                    this.FSIZE == this.vboStride, // for agreeement with'stride'
                    "Uh oh! VBObox5.vboStride disagrees with attribute-size values!");
  
                //----------------------Attribute offsets  
    this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
                                  // of 1st a_Pos0 attrib value in vboContents[]
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                  // (4 floats * bytes/float) 
                                  // # of bytes from START of vbo to the START
                                  // of 1st a_Colr0 attrib value in vboContents[]
                //-----------------------GPU memory locations:
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                  // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
                                  // set by compile/link of VERT_SRC and FRAG_SRC.
                            //------Attribute locations in our shaders:
    this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
    this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute
    this.a_NormalLoc;
    this.u_eyePosLoc;
    this.normals;
    this.spin = 0;

    this.u_DiffuseLightLoc;
    this.u_SpecLightLoc;
    this.u_LightPositionLoc;
    this.u_AmbientLightLoc;
    this.u_KdLoc;
    this.u_KaLoc;
    this.u_KsLoc;
    this.shinyLoc;
    this.light_x = document.getElementById("lx").value
    this.light_y = document.getElementById("ly").value
    this.light_z = document.getElementById("lz").value
    this.a_red =    document.getElementById("a_r").value/100
    this.a_green =  document.getElementById("a_g").value/100 
    this.a_blue =   document.getElementById("a_b").value/100

    this.s_red =    document.getElementById("s_r").value/100 
    this.s_green =  document.getElementById("s_g").value/100 
    this.s_blue =   document.getElementById("s_b").value/100

    this.d_red =    document.getElementById("d_r").value/100 
    this.d_green =  document.getElementById("d_g").value/100 
    this.d_blue =   document.getElementById("d_b").value/100

    this.u_NormalMatLoc;
    this.NormalMatrix = new Matrix4();
  
                //---------------------- Uniform locations &values in our shaders
    this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform
    
  }
  
  VBObox4.prototype.init = function() {
  //=============================================================================
  // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
  // kept in this VBObox. (This function usually called only once, within main()).
  // Specifically:
  // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
  //  executable 'program' stored and ready to use inside the GPU.  
  // b) create a new VBO object in GPU memory and fill it by transferring in all
  //  the vertex data held in our Float32array member 'VBOcontents'. 
  // c) Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
  // -------------------
  // CAREFUL!  before you can draw pictures using this VBObox contents, 
  //  you must call this VBObox object's switchToMe() function too!
  //--------------------
  // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create executable Shaders on the GPU. Bye!');
      return;
    }
  // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
  //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
  
    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
  
  // b) Create VBO on GPU, fill it------------------------------------------------
  this.vboLoc = gl.createBuffer();
  if (!this.vboLoc) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vboLoc);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);




  /*
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create VBO in GPU. Bye!'); 
      return;
    }
    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                    this.vboLoc);				  // the ID# the GPU uses for this buffer.
  
    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                      this.vboContents, 		// JavaScript Float32Array
                     gl.STATIC_DRAW);			// Usage hint.
    */




    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.
  
    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if(this.a_PosLoc < 0) {
      console.log(this.constructor.name + 
                  '.init() Failed to get GPU location of attribute a_Pos0');
      return -1;	// error exit.
    }
    /*
     this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if(this.a_ColrLoc < 0) {
      console.log(this.constructor.name + 
                  '.init() failed to get the GPU location of attribute a_Colr0');
      return -1;	// error exit.
    }
    */
  
   this.u_eyePosLoc = gl.getUniformLocation(this.shaderLoc, 'u_eyePos');
   if (!this.u_eyePosLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for u_eyePos uniform');
     return;
   } 

   this.u_KdLoc = gl.getUniformLocation(this.shaderLoc, 'u_Kd');
   if (!this.u_KdLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for Kd uniform');
     return;
   } 

   this.u_KaLoc = gl.getUniformLocation(this.shaderLoc, 'Ka');
   if (!this.u_KaLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for Ka uniform');
     return;
   } 

   this.u_KsLoc = gl.getUniformLocation(this.shaderLoc, 'Ks');
   if (!this.u_KsLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for Ks uniform');
     return;
   } 

   this.u_DiffuseLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_DiffuseLight');
   if (!this.u_DiffuseLightLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for u_DiffuseLight uniform');
     return;
   }

   this.u_SpecLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_SpecularLight');
    if (!this.u_SpecLightLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_SpecularLight uniform');
      return;
    } 

    this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_NormalLoc < 0) {
      console.log(this.constructor.name + 
                  '.init() Failed to get GPU location of attribute a_Normal');
      return -1;	// error exit.
    }

    this.shinyLoc = gl.getUniformLocation(this.shaderLoc, 'u_ShininessVal');
    if (!this.shinyLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_ShininessVal uniform');
      return;
    } 
    
    this.u_NormalMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
    if (!this.u_NormalMatLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_NormalMatrix uniform');
      return;
    }  

    this.u_AmbientLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_AmbientLight');
    if (!this.u_AmbientLightLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_AmbientLight uniform');
      return;
    } 

    this.u_LightPositionLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
    if (!this.u_LightPositionLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_NormalMatrix uniform');
      return;
    }  
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs: 
    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
    if (!this.u_ModelMatLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_ModelMat1 uniform');
      return;
    }  

  }

  VBObox4.prototype.switchToMe = function() {
  //==============================================================================
  // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
  //
  // We only do this AFTER we called the init() function, which does the one-time-
  // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
  // even then, you are STILL not ready to draw our VBObox's contents onscreen!
  // We must also first complete these steps:
  //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
  //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
  //  c) tell the GPU to connect the shader program's attributes to that VBO.
  
  // a) select our shader program:
    gl.useProgram(this.shaderLoc);	
  //		Each call to useProgram() selects a shader program from the GPU memory,
  // but that's all -- it does nothing else!  Any previously used shader program's 
  // connections to attributes and uniforms are now invalid, and thus we must now
  // establish new connections between our shader program's attributes and the VBO
  // we wish to use.  
    
  // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
  //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
  var posBuffer = gl.createBuffer();
  var normBuffer = gl.createBuffer();
      if (!posBuffer) {
        console.log('Failed to create the posbuffer object');
        return false;
      }
      if (!normBuffer) {
        console.log('Failed to create the normBuffer object');
        return false;
      }
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vboContents), gl.STATIC_DRAW);
  gl.vertexAttribPointer(this.a_PosLoc, 4, gl.FLOAT, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(this.a_PosLoc);

  gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
  gl.vertexAttribPointer(this.a_NormalLoc, 3, gl.FLOAT, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(this.a_NormalLoc);


  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vboLoc);
  /*
  //    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
                      this.vboLoc);			    // the ID# the GPU uses for our VBO.
  
  // c) connect our newly-bound VBO to supply attribute variable values for each
  // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
  // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:

    

    /*
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
      this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
      this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
      gl.FLOAT,			// type == what data type did we use for those numbers?
      false,				// isNormalized == are these fixed-point values that we need
                    //									normalize before use? true or false
      this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                    // stored attrib for this vertex to the same stored attrib
                    //  for the next vertex in our VBO.  This is usually the 
                    // number of bytes used to store one complete vertex.  If set 
                    // to zero, the GPU gets attribute values sequentially from 
                    // VBO, starting at 'Offset'.	
                    // (Our vertex size in bytes: 4 floats for pos + 3 for color)
      this.vboOffset_a_Pos0);						
                    // Offset == how many bytes from START of buffer to the first
                    // value we will actually use?  (We start with position).
    gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
                          gl.FLOAT, false, 
                          this.vboStride, this.vboOffset_a_Colr0);
    gl.vertexAttribPointer(
      this.a_NormalLoc,//index == ID# for the attribute var in your GLSL shader pgm;
      3,// # of floats used by this attribute: 1,2,3 or 4?
      gl.FLOAT,			// type == what data type did we use for those numbers?
      false,				// isNormalized == are these fixed-point values that we need
                    //									normalize before use? true or false
      this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                    // stored attrib for this vertex to the same stored attrib
                    //  for the next vertex in our VBO.  This is usually the 
                    // number of bytes used to store one complete vertex.  If set 
                    // to zero, the GPU gets attribute values sequentially from 
                    // VBO, starting at 'Offset'.	
                    // (Our vertex size in bytes: 4 floats for pos + 3 for color)
      this.FSIZE * 7);						
                    // Offset == how many bytes from START of buffer to the first
                    // value we will actually use?  (We start with position).

                  
  // --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
    gl.enableVertexAttribArray(this.a_NormalLoc);

    */
  }
  
  VBObox4.prototype.isReady = function() {
  //==============================================================================
  // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
  // this objects VBO and shader program; else return false.
  // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
  
  var isOK = true;
  
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
      console.log(this.constructor.name + 
                  '.isReady() false: shader program at this.shaderLoc not in use!');
      isOK = false;
    }
    if(gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                '.isReady() false: vbo at this.vboLoc not in use!');
      isOK = false;
    }
    return isOK;
  }

  VBObox4.prototype.adjust = function() {
  //==============================================================================
  // Update the GPU to newer, current values we now store for 'uniform' vars on 
  // the GPU; and (if needed) update each attribute's stride and offset in VBO.
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.adjust() call you needed to call this.switchToMe()!!');
    }  
    this.a_red =    document.getElementById("a_r").value/100
    this.a_green =  document.getElementById("a_g").value/100 
    this.a_blue =   document.getElementById("a_b").value/100

    this.s_red =    document.getElementById("s_r").value/100 
    this.s_green =  document.getElementById("s_g").value/100 
    this.s_blue =   document.getElementById("s_b").value/100

    this.d_red =    document.getElementById("d_r").value/100 
    this.d_green =  document.getElementById("d_g").value/100 
    this.d_blue =   document.getElementById("d_b").value/100

    this.light_x = document.getElementById("lx").value
    this.light_y = document.getElementById("ly").value
    this.light_z = document.getElementById("lz").value

    gl.uniform3f(this.u_LightPositionLoc, this.light_x, this.light_y,this.light_z)
    gl.uniform3f(this.u_AmbientLightLoc, this.a_red,this.a_green,this.a_blue);
    gl.uniform3f(this.u_DiffuseLightLoc, this.d_red,this.d_green,this.d_blue)
    gl.uniform3f(this.u_SpecLightLoc, this.s_red,this.s_green,this.s_blue);
    gl.uniform1f(this.shinyLoc, shinyVal);
    gl.uniform3f(this.u_KsLoc, specularVal[0], specularVal[1], specularVal[2]);
    gl.uniform3f(this.u_KdLoc, diffuseVal[0], diffuseVal[1], diffuseVal[2]);
    gl.uniform3f(this.u_KaLoc, ambientVal[0], ambientVal[1], ambientVal[2]);
    gl.uniform3f(this.u_eyePosLoc, g_EyeX, g_EyeY, g_EyeZ);
    
    // Adjust values for our uniforms,
    this.ModelMat.setIdentity();
    this.ModelMat.set(g_worldMat);	// use our global, shared camera.
    this.spin+=0.3
    this.ModelMat.translate(0,0,4)
    this.ModelMat.scale(3,3,3)
    this.ModelMat.rotate(this.spin,0,0,1);
      gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.ModelMat.elements);	// send data from Javascript.
// Adjust the attributes' stride and offset (if necessary)
// (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
    this.NormalMatrix.setIdentity();
    this.NormalMatrix.translate(0,0,4)
    this.NormalMatrix.scale(3,3,3)
    this.NormalMatrix.rotate(this.spin,0,0,1);
    gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.NormalMatrix.elements);	// send data from Javascript.

    
  }
  
  VBObox4.prototype.draw = function() {
  //=============================================================================
  // Render current VBObox contents.
  
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.draw() call you needed to call this.switchToMe()!!');
    }  

    // ----------------------------Draw the contents of the currently-bound VBO:
    gl.drawElements(gl.TRIANGLES, 	    // select the drawing primitive to draw,
                    // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                    //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
                   this.indices.length,
                   gl.UNSIGNED_SHORT,
                   0);		// number of vertices to draw on-screen.
  }
  
  VBObox4.prototype.reload = function() {
  //=============================================================================
  // Over-write current values in the GPU inside our already-created VBO: use 
  // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
  // contents to our VBO without changing any GPU memory allocations.
  
   gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                    0,                  // byte offset to where data replacement
                                        // begins in the VBO.
                      this.vboContents);   // the JS source-data array used to fill VBO
  }


VBObox4.prototype.makeUnitSphere = function()
{
var SPHERE_DIV = 26;

var i, ai, si, ci;
var j, aj, sj, cj;
var p1, p2;

this.sphVerts = [];
this.indices = [];
this.normals = [];

// Generate coordinates
for (j = 0; j <= SPHERE_DIV; j++) {
  aj = j * Math.PI / SPHERE_DIV;
  sj = Math.sin(aj);
  cj = Math.cos(aj);
  for (i = 0; i <= SPHERE_DIV; i++) {
    ai = i * 2 * Math.PI / SPHERE_DIV;
    si = Math.sin(ai);
    ci = Math.cos(ai);

    this.sphVerts.push(si * sj);  // X
    this.normals.push(si * sj);  // X
    this.sphVerts.push(cj);       // Y
    this.normals.push(cj);       // Y
    this.sphVerts.push(ci * sj);  // Z
    this.normals.push(ci * sj);  // Z
    this.sphVerts.push(1);        // W
  }
}

// Generate indices
for (j = 0; j < SPHERE_DIV; j++) {
  for (i = 0; i < SPHERE_DIV; i++) {
    p1 = j * (SPHERE_DIV+1) + i;
    p2 = p1 + (SPHERE_DIV+1);

    this.indices.push(p1);
    this.indices.push(p2);
    this.indices.push(p1 + 1);

    this.indices.push(p1 + 1);
    this.indices.push(p2);
    this.indices.push(p2 + 1);
  }
}
}

function VBObox5() {
  //=============================================================================
  //=============================================================================
  // CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
  // needed to render vertices from one Vertex Buffer Object (VBO) using one 
  // separate shader program (a vertex-shader & fragment-shader pair) and one
  // set of 'uniform' variables.
  
  // Constructor goal: 
  // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
  // written into code) in all other VBObox functions. Keeping all these (initial)
  // values here, in this one coonstrutor function, ensures we can change them 
  // easily WITHOUT disrupting any other code, ever!
    
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
    //
    'uniform mat4 u_ModelMat0;\n' +
    'uniform mat4 u_NormalMatrix;\n' +
    'uniform vec3 u_Kd; \n' +
    'attribute vec4 a_Pos0;\n' +
    'attribute vec3 a_Normal;\n' +
    	//-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
	  'varying vec3 v_Kd; \n' +							// Phong Lighting: diffuse reflectance
    // (I didn't make per-pixel Ke,Ka,Ks;
    // we use 'uniform' values instead)
    'varying vec4 v_Position; \n' +				
    'varying vec3 v_Normal; \n' +					// Why Vec3? its not a point, hence w==0

    //
    'void main() {\n' +
    '  gl_Position = u_ModelMat0 * a_Pos0;\n' +
    '  v_Position = a_Pos0;\n' +
    '  v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));\n' +
    '  v_Kd = u_Kd;\n'  +
    ' }\n';
  
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision highp float;\n' +
    'precision highp int;\n' +
    'uniform vec3 Ka;\n' +						// Phong Reflectance: ambient
	  // no Phong Reflectance: diffuse? -- no: use v_Kd instead for per-pixel value
    'uniform vec3 Ks;\n' +						// Phong Reflectance: specular
    'uniform float u_ShininessVal;\n' +				// Phong Reflectance: 1 < shiny < 128
    'uniform vec3 u_eyePos;\n' + 	// Camera/eye location in world coords.
    'uniform vec3 u_LightPosition;\n' +
    'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
    'uniform vec3 u_DiffuseLight;\n' +   // Diffuse light color
    'uniform vec3 u_SpecularLight;\n' +   // Specular light color

    'varying vec3 v_Kd; \n' +							// Phong Lighting: diffuse reflectance
    'varying vec4 v_Position; \n' +				
    'varying vec3 v_Normal; \n' +					// Why Vec3? its not a point, hence w==0
    'varying vec4 v_Colr0;\n' +
    'void main() {\n' +
    
    '  vec3 normal = normalize(v_Normal);\n' +
    '  vec3 lightVec = normalize(u_LightPosition - vec3(v_Position));\n' +
    '  vec3 eyeDirection = normalize(u_eyePos - normalize(v_Position.xyz));\n' +
    '  float nDotL = max(dot(lightVec, normal), 0.0);\n' +
    '  vec3 reflect = reflect(-lightVec, normal);\n' +
    '  float rDotV = max(dot(reflect, eyeDirection), 0.0);\n' +

    '  float spec = pow(rDotV, float(u_ShininessVal));\n' +
    '  vec3 ambient = u_AmbientLight * Ka;\n' +
    '  vec3 diffuse = nDotL * u_DiffuseLight * v_Kd;\n' +
    '  vec3 specular = spec * u_SpecularLight * Ks;\n' +
    '  gl_FragColor = vec4(ambient + diffuse + specular, 1.0);\n' + 

    '}\n';
    
    this.indices;
    this.floatsPerVertex = 10;
    this.sphVerts;
    this.makeUnitSphere();
    this.vboContents = new Float32Array(this.sphVerts);
    this.vboVerts = this.sphVerts.length/this.floatsPerVertex;						// # of vertices held in 'vboContents' array

    
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                  // bytes req'd by 1 vboContents array element;
                                  // (why? used to compute stride and offset 
                                  // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;               
                                  // total number of bytes stored in vboContents
                                  // (#  of floats in vboContents array) * 
                                  // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts; 
                                  // (== # of bytes to store one complete vertex).
                                  // From any attrib in a given vertex in the VBO, 
                                  // move forward by 'vboStride' bytes to arrive 
                                  // at the same attrib for the next vertex. 
  
                //----------------------Attribute sizes
    this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                  // attribute named a_Pos0. (4: x,y,z,w values)
    this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
    console.log(this.FSIZE);
    console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
                    this.vboFcount_a_Colr0 +
                    3) *   // every attribute in our VBO
                    this.FSIZE == this.vboStride, // for agreeement with'stride'
                    "Uh oh! VBObox5.vboStride disagrees with attribute-size values!");
  
                //----------------------Attribute offsets  
    this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
                                  // of 1st a_Pos0 attrib value in vboContents[]
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                  // (4 floats * bytes/float) 
                                  // # of bytes from START of vbo to the START
                                  // of 1st a_Colr0 attrib value in vboContents[]
                //-----------------------GPU memory locations:
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                  // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
                                  // set by compile/link of VERT_SRC and FRAG_SRC.
                            //------Attribute locations in our shaders:
    this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
    this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute
    this.a_NormalLoc;
    this.u_eyePosLoc;
    this.normals;
    this.spin = 0;

    this.u_DiffuseLightLoc;
    this.u_SpecLightLoc;
    this.u_LightPositionLoc;
    this.u_AmbientLightLoc;
    this.u_KdLoc;
    this.u_KaLoc;
    this.u_KsLoc;
    this.shinyLoc;
    this.light_x = document.getElementById("lx").value
    this.light_y = document.getElementById("ly").value
    this.light_z = document.getElementById("lz").value
    this.a_red =    document.getElementById("a_r").value/100
    this.a_green =  document.getElementById("a_g").value/100 
    this.a_blue =   document.getElementById("a_b").value/100

    this.s_red =    document.getElementById("s_r").value/100 
    this.s_green =  document.getElementById("s_g").value/100 
    this.s_blue =   document.getElementById("s_b").value/100

    this.d_red =    document.getElementById("d_r").value/100 
    this.d_green =  document.getElementById("d_g").value/100 
    this.d_blue =   document.getElementById("d_b").value/100

    this.u_NormalMatLoc;
    this.NormalMatrix = new Matrix4();
  
                //---------------------- Uniform locations &values in our shaders
    this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform
    
  }
  
  VBObox5.prototype.init = function() {
  //=============================================================================
  // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
  // kept in this VBObox. (This function usually called only once, within main()).
  // Specifically:
  // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
  //  executable 'program' stored and ready to use inside the GPU.  
  // b) create a new VBO object in GPU memory and fill it by transferring in all
  //  the vertex data held in our Float32array member 'VBOcontents'. 
  // c) Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
  // -------------------
  // CAREFUL!  before you can draw pictures using this VBObox contents, 
  //  you must call this VBObox object's switchToMe() function too!
  //--------------------
  // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create executable Shaders on the GPU. Bye!');
      return;
    }
  // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
  //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
  
    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
  
  // b) Create VBO on GPU, fill it------------------------------------------------
  this.vboLoc = gl.createBuffer();
  if (!this.vboLoc) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vboLoc);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);




  /*
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create VBO in GPU. Bye!'); 
      return;
    }
    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                    this.vboLoc);				  // the ID# the GPU uses for this buffer.
  
    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                      this.vboContents, 		// JavaScript Float32Array
                     gl.STATIC_DRAW);			// Usage hint.
    */




    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.
  
    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if(this.a_PosLoc < 0) {
      console.log(this.constructor.name + 
                  '.init() Failed to get GPU location of attribute a_Pos0');
      return -1;	// error exit.
    }
    /*
     this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if(this.a_ColrLoc < 0) {
      console.log(this.constructor.name + 
                  '.init() failed to get the GPU location of attribute a_Colr0');
      return -1;	// error exit.
    }
    */
  
   this.u_eyePosLoc = gl.getUniformLocation(this.shaderLoc, 'u_eyePos');
   if (!this.u_eyePosLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for u_eyePos uniform');
     return;
   } 

   this.u_KdLoc = gl.getUniformLocation(this.shaderLoc, 'u_Kd');
   if (!this.u_KdLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for Kd uniform');
     return;
   } 

   this.u_KaLoc = gl.getUniformLocation(this.shaderLoc, 'Ka');
   if (!this.u_KaLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for Ka uniform');
     return;
   } 

   this.u_KsLoc = gl.getUniformLocation(this.shaderLoc, 'Ks');
   if (!this.u_KsLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for Ks uniform');
     return;
   } 

   this.u_DiffuseLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_DiffuseLight');
   if (!this.u_DiffuseLightLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for u_DiffuseLight uniform');
     return;
   }

   this.u_SpecLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_SpecularLight');
    if (!this.u_SpecLightLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_SpecularLight uniform');
      return;
    } 

    this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_NormalLoc < 0) {
      console.log(this.constructor.name + 
                  '.init() Failed to get GPU location of attribute a_Normal');
      return -1;	// error exit.
    }

    this.shinyLoc = gl.getUniformLocation(this.shaderLoc, 'u_ShininessVal');
    if (!this.shinyLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_ShininessVal uniform');
      return;
    } 
    
    this.u_NormalMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
    if (!this.u_NormalMatLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_NormalMatrix uniform');
      return;
    }  

    this.u_AmbientLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_AmbientLight');
    if (!this.u_AmbientLightLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_AmbientLight uniform');
      return;
    } 

    this.u_LightPositionLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
    if (!this.u_LightPositionLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_NormalMatrix uniform');
      return;
    }  
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs: 
    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
    if (!this.u_ModelMatLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_ModelMat1 uniform');
      return;
    }  

  }

  VBObox5.prototype.switchToMe = function() {
  //==============================================================================
  // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
  //
  // We only do this AFTER we called the init() function, which does the one-time-
  // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
  // even then, you are STILL not ready to draw our VBObox's contents onscreen!
  // We must also first complete these steps:
  //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
  //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
  //  c) tell the GPU to connect the shader program's attributes to that VBO.
  
  // a) select our shader program:
    gl.useProgram(this.shaderLoc);	
  //		Each call to useProgram() selects a shader program from the GPU memory,
  // but that's all -- it does nothing else!  Any previously used shader program's 
  // connections to attributes and uniforms are now invalid, and thus we must now
  // establish new connections between our shader program's attributes and the VBO
  // we wish to use.  
    
  // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
  //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
  var posBuffer = gl.createBuffer();
  var normBuffer = gl.createBuffer();
      if (!posBuffer) {
        console.log('Failed to create the posbuffer object');
        return false;
      }
      if (!normBuffer) {
        console.log('Failed to create the normBuffer object');
        return false;
      }
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vboContents), gl.STATIC_DRAW);
  gl.vertexAttribPointer(this.a_PosLoc, 4, gl.FLOAT, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(this.a_PosLoc);

  gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
  gl.vertexAttribPointer(this.a_NormalLoc, 3, gl.FLOAT, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(this.a_NormalLoc);


  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vboLoc);
  /*
  //    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
                      this.vboLoc);			    // the ID# the GPU uses for our VBO.
  
  // c) connect our newly-bound VBO to supply attribute variable values for each
  // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
  // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:

    

    /*
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
      this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
      this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
      gl.FLOAT,			// type == what data type did we use for those numbers?
      false,				// isNormalized == are these fixed-point values that we need
                    //									normalize before use? true or false
      this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                    // stored attrib for this vertex to the same stored attrib
                    //  for the next vertex in our VBO.  This is usually the 
                    // number of bytes used to store one complete vertex.  If set 
                    // to zero, the GPU gets attribute values sequentially from 
                    // VBO, starting at 'Offset'.	
                    // (Our vertex size in bytes: 4 floats for pos + 3 for color)
      this.vboOffset_a_Pos0);						
                    // Offset == how many bytes from START of buffer to the first
                    // value we will actually use?  (We start with position).
    gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
                          gl.FLOAT, false, 
                          this.vboStride, this.vboOffset_a_Colr0);
    gl.vertexAttribPointer(
      this.a_NormalLoc,//index == ID# for the attribute var in your GLSL shader pgm;
      3,// # of floats used by this attribute: 1,2,3 or 4?
      gl.FLOAT,			// type == what data type did we use for those numbers?
      false,				// isNormalized == are these fixed-point values that we need
                    //									normalize before use? true or false
      this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                    // stored attrib for this vertex to the same stored attrib
                    //  for the next vertex in our VBO.  This is usually the 
                    // number of bytes used to store one complete vertex.  If set 
                    // to zero, the GPU gets attribute values sequentially from 
                    // VBO, starting at 'Offset'.	
                    // (Our vertex size in bytes: 4 floats for pos + 3 for color)
      this.FSIZE * 7);						
                    // Offset == how many bytes from START of buffer to the first
                    // value we will actually use?  (We start with position).

                  
  // --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
    gl.enableVertexAttribArray(this.a_NormalLoc);

    */
  }
  
  VBObox5.prototype.isReady = function() {
  //==============================================================================
  // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
  // this objects VBO and shader program; else return false.
  // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
  
  var isOK = true;
  
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
      console.log(this.constructor.name + 
                  '.isReady() false: shader program at this.shaderLoc not in use!');
      isOK = false;
    }
    if(gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                '.isReady() false: vbo at this.vboLoc not in use!');
      isOK = false;
    }
    return isOK;
  }

  VBObox5.prototype.adjust = function() {
  //==============================================================================
  // Update the GPU to newer, current values we now store for 'uniform' vars on 
  // the GPU; and (if needed) update each attribute's stride and offset in VBO.
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.adjust() call you needed to call this.switchToMe()!!');
    }  
    this.a_red =    document.getElementById("a_r").value/100
    this.a_green =  document.getElementById("a_g").value/100 
    this.a_blue =   document.getElementById("a_b").value/100

    this.s_red =    document.getElementById("s_r").value/100 
    this.s_green =  document.getElementById("s_g").value/100 
    this.s_blue =   document.getElementById("s_b").value/100

    this.d_red =    document.getElementById("d_r").value/100 
    this.d_green =  document.getElementById("d_g").value/100 
    this.d_blue =   document.getElementById("d_b").value/100

    this.light_x = document.getElementById("lx").value
    this.light_y = document.getElementById("ly").value
    this.light_z = document.getElementById("lz").value

    gl.uniform3f(this.u_LightPositionLoc, this.light_x, this.light_y,this.light_z)
    gl.uniform3f(this.u_AmbientLightLoc, this.a_red,this.a_green,this.a_blue);
    gl.uniform3f(this.u_DiffuseLightLoc, this.d_red,this.d_green,this.d_blue)
    gl.uniform3f(this.u_SpecLightLoc, this.s_red,this.s_green,this.s_blue);
    gl.uniform1f(this.shinyLoc, shinyVal);
    gl.uniform3f(this.u_KsLoc, specularVal[0], specularVal[1], specularVal[2]);
    gl.uniform3f(this.u_KdLoc, diffuseVal[0], diffuseVal[1], diffuseVal[2]);
    gl.uniform3f(this.u_KaLoc, ambientVal[0], ambientVal[1], ambientVal[2]);
    gl.uniform3f(this.u_eyePosLoc, g_EyeX, g_EyeY, g_EyeZ);
    
    // Adjust values for our uniforms,
    this.ModelMat.setIdentity();
    this.ModelMat.set(g_worldMat);	// use our global, shared camera.
    this.spin+=0.3
    this.ModelMat.translate(0,0,4)
    this.ModelMat.scale(3,3,3)
    this.ModelMat.rotate(this.spin,0,0,1);
      gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.ModelMat.elements);	// send data from Javascript.
// Adjust the attributes' stride and offset (if necessary)
// (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
    this.NormalMatrix.setIdentity();
    this.NormalMatrix.translate(0,0,4)
    this.NormalMatrix.scale(3,3,3)
    this.NormalMatrix.rotate(this.spin,0,0,1);
    gl.uniformMatrix4fv(this.u_NormalMatLoc,	// GPU location of the uniform
      false, 				// use matrix transpose instead?
      this.NormalMatrix.elements);	// send data from Javascript.

    
  }
  
  VBObox5.prototype.draw = function() {
  //=============================================================================
  // Render current VBObox contents.
  
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.draw() call you needed to call this.switchToMe()!!');
    }  

    // ----------------------------Draw the contents of the currently-bound VBO:
    gl.drawElements(gl.TRIANGLES, 	    // select the drawing primitive to draw,
                    // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                    //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
                   this.indices.length,
                   gl.UNSIGNED_SHORT,
                   0);		// number of vertices to draw on-screen.
  }
  
  VBObox5.prototype.reload = function() {
  //=============================================================================
  // Over-write current values in the GPU inside our already-created VBO: use 
  // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
  // contents to our VBO without changing any GPU memory allocations.
  
   gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                    0,                  // byte offset to where data replacement
                                        // begins in the VBO.
                      this.vboContents);   // the JS source-data array used to fill VBO
  }


VBObox5.prototype.makeUnitSphere = function()
{
var SPHERE_DIV = 26;

var i, ai, si, ci;
var j, aj, sj, cj;
var p1, p2;

this.sphVerts = [];
this.indices = [];
this.normals = [];

// Generate coordinates
for (j = 0; j <= SPHERE_DIV; j++) {
  aj = j * Math.PI / SPHERE_DIV;
  sj = Math.sin(aj);
  cj = Math.cos(aj);
  for (i = 0; i <= SPHERE_DIV; i++) {
    ai = i * 2 * Math.PI / SPHERE_DIV;
    si = Math.sin(ai);
    ci = Math.cos(ai);

    this.sphVerts.push(si * sj);  // X
    this.normals.push(si * sj);  // X
    this.sphVerts.push(cj);       // Y
    this.normals.push(cj);       // Y
    this.sphVerts.push(ci * sj);  // Z
    this.normals.push(ci * sj);  // Z
    this.sphVerts.push(1);        // W
  }
}

// Generate indices
for (j = 0; j < SPHERE_DIV; j++) {
  for (i = 0; i < SPHERE_DIV; i++) {
    p1 = j * (SPHERE_DIV+1) + i;
    p2 = p1 + (SPHERE_DIV+1);

    this.indices.push(p1);
    this.indices.push(p2);
    this.indices.push(p1 + 1);

    this.indices.push(p1 + 1);
    this.indices.push(p2);
    this.indices.push(p2 + 1);
  }
}
}
function VBObox6() {
  //=============================================================================
  //=============================================================================
  // CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
  // needed to render vertices from one Vertex Buffer Object (VBO) using one 
  // separate shader program (a vertex-shader & fragment-shader pair) and one
  // set of 'uniform' variables.
  
  // Constructor goal: 
  // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
  // written into code) in all other VBObox functions. Keeping all these (initial)
  // values here, in this one coonstrutor function, ensures we can change them 
  // easily WITHOUT disrupting any other code, ever!
    
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
    //
    'uniform mat4 u_ModelMat0;\n' +
    'uniform mat4 u_NormalMatrix;\n' +
    'uniform vec3 u_Kd; \n' +
    'attribute vec4 a_Pos0;\n' +
    'attribute vec3 a_Normal;\n' +
    	//-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
	  'varying vec3 v_Kd; \n' +							// Phong Lighting: diffuse reflectance
    // (I didn't make per-pixel Ke,Ka,Ks;
    // we use 'uniform' values instead)
    'varying vec4 v_Position; \n' +				
    'varying vec3 v_Normal; \n' +					// Why Vec3? its not a point, hence w==0

    //
    'void main() {\n' +
    '  gl_Position = u_ModelMat0 * a_Pos0;\n' +
    '  v_Position = a_Pos0;\n' +
    '  v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));\n' +
    '  v_Kd = u_Kd;\n'  +
    ' }\n';
  
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision highp float;\n' +
    'precision highp int;\n' +
    'uniform vec3 Ka;\n' +						// Phong Reflectance: ambient
	  // no Phong Reflectance: diffuse? -- no: use v_Kd instead for per-pixel value
    'uniform vec3 Ks;\n' +						// Phong Reflectance: specular
    'uniform float u_ShininessVal;\n' +				// Phong Reflectance: 1 < shiny < 128
    'uniform vec3 u_eyePos;\n' + 	// Camera/eye location in world coords.
    'uniform vec3 u_LightPosition;\n' +
    'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
    'uniform vec3 u_DiffuseLight;\n' +   // Diffuse light color
    'uniform vec3 u_SpecularLight;\n' +   // Specular light color

    'varying vec3 v_Kd; \n' +							// Phong Lighting: diffuse reflectance
    'varying vec4 v_Position; \n' +				
    'varying vec3 v_Normal; \n' +					// Why Vec3? its not a point, hence w==0
    'varying vec4 v_Colr0;\n' +
    'void main() {\n' +
    
    '  vec3 normal = normalize(v_Normal);\n' +
    '  vec3 lightVec = normalize(u_LightPosition - vec3(v_Position));\n' +
    '  vec3 eyeDirection = normalize(u_eyePos - normalize(v_Position.xyz));\n' +
    '  float nDotL = max(dot(lightVec, normal), 0.0);\n' +
    '  vec3 reflect = reflect(-lightVec, normal);\n' +
    '  float rDotV = max(dot(reflect, eyeDirection), 0.0);\n' +

    '  float spec = pow(rDotV, float(u_ShininessVal));\n' +
    '  vec3 ambient = u_AmbientLight * Ka;\n' +
    '  vec3 diffuse = nDotL * u_DiffuseLight * v_Kd;\n' +
    '  vec3 specular = spec * u_SpecularLight * Ks;\n' +
    '  gl_FragColor = vec4(ambient + diffuse + specular, 1.0);\n' + 

    '}\n';
    
    this.indices;
    this.floatsPerVertex = 10;
    this.sphVerts;
    this.makeUnitSphere();
    this.vboContents = new Float32Array(this.sphVerts);
    this.vboVerts = this.sphVerts.length/this.floatsPerVertex;						// # of vertices held in 'vboContents' array

    
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                  // bytes req'd by 1 vboContents array element;
                                  // (why? used to compute stride and offset 
                                  // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;               
                                  // total number of bytes stored in vboContents
                                  // (#  of floats in vboContents array) * 
                                  // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts; 
                                  // (== # of bytes to store one complete vertex).
                                  // From any attrib in a given vertex in the VBO, 
                                  // move forward by 'vboStride' bytes to arrive 
                                  // at the same attrib for the next vertex. 
  
                //----------------------Attribute sizes
    this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                  // attribute named a_Pos0. (4: x,y,z,w values)
    this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
    console.log(this.FSIZE);
    console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
                    this.vboFcount_a_Colr0 +
                    3) *   // every attribute in our VBO
                    this.FSIZE == this.vboStride, // for agreeement with'stride'
                    "Uh oh! VBObox6.vboStride disagrees with attribute-size values!");
  
                //----------------------Attribute offsets  
    this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
                                  // of 1st a_Pos0 attrib value in vboContents[]
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                  // (4 floats * bytes/float) 
                                  // # of bytes from START of vbo to the START
                                  // of 1st a_Colr0 attrib value in vboContents[]
                //-----------------------GPU memory locations:
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                  // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
                                  // set by compile/link of VERT_SRC and FRAG_SRC.
                            //------Attribute locations in our shaders:
    this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
    this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute
    this.a_NormalLoc;
    this.u_eyePosLoc;
    this.normals;
    this.spin = 0;

    this.u_DiffuseLightLoc;
    this.u_SpecLightLoc;
    this.u_LightPositionLoc;
    this.u_AmbientLightLoc;
    this.u_KdLoc;
    this.u_KaLoc;
    this.u_KsLoc;
    this.shinyLoc;
    this.light_x = document.getElementById("lx").value
    this.light_y = document.getElementById("ly").value
    this.light_z = document.getElementById("lz").value
    this.a_red =    document.getElementById("a_r").value/100
    this.a_green =  document.getElementById("a_g").value/100 
    this.a_blue =   document.getElementById("a_b").value/100

    this.s_red =    document.getElementById("s_r").value/100 
    this.s_green =  document.getElementById("s_g").value/100 
    this.s_blue =   document.getElementById("s_b").value/100

    this.d_red =    document.getElementById("d_r").value/100 
    this.d_green =  document.getElementById("d_g").value/100 
    this.d_blue =   document.getElementById("d_b").value/100

    this.u_NormalMatLoc;
    this.NormalMatrix = new Matrix4();
  
                //---------------------- Uniform locations &values in our shaders
    this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform
    
  }
  
  VBObox6.prototype.init = function() {
  //=============================================================================
  // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
  // kept in this VBObox. (This function usually called only once, within main()).
  // Specifically:
  // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
  //  executable 'program' stored and ready to use inside the GPU.  
  // b) create a new VBO object in GPU memory and fill it by transferring in all
  //  the vertex data held in our Float32array member 'VBOcontents'. 
  // c) Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
  // -------------------
  // CAREFUL!  before you can draw pictures using this VBObox contents, 
  //  you must call this VBObox object's switchToMe() function too!
  //--------------------
  // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create executable Shaders on the GPU. Bye!');
      return;
    }
  // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
  //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
  
    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
  
  // b) Create VBO on GPU, fill it------------------------------------------------
  this.vboLoc = gl.createBuffer();
  if (!this.vboLoc) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vboLoc);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);




  /*
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create VBO in GPU. Bye!'); 
      return;
    }
    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                    this.vboLoc);				  // the ID# the GPU uses for this buffer.
  
    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                      this.vboContents, 		// JavaScript Float32Array
                     gl.STATIC_DRAW);			// Usage hint.
    */




    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.
  
    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if(this.a_PosLoc < 0) {
      console.log(this.constructor.name + 
                  '.init() Failed to get GPU location of attribute a_Pos0');
      return -1;	// error exit.
    }
    /*
     this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if(this.a_ColrLoc < 0) {
      console.log(this.constructor.name + 
                  '.init() failed to get the GPU location of attribute a_Colr0');
      return -1;	// error exit.
    }
    */
  
   this.u_eyePosLoc = gl.getUniformLocation(this.shaderLoc, 'u_eyePos');
   if (!this.u_eyePosLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for u_eyePos uniform');
     return;
   } 

   this.u_KdLoc = gl.getUniformLocation(this.shaderLoc, 'u_Kd');
   if (!this.u_KdLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for Kd uniform');
     return;
   } 

   this.u_KaLoc = gl.getUniformLocation(this.shaderLoc, 'Ka');
   if (!this.u_KaLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for Ka uniform');
     return;
   } 

   this.u_KsLoc = gl.getUniformLocation(this.shaderLoc, 'Ks');
   if (!this.u_KsLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for Ks uniform');
     return;
   } 

   this.u_DiffuseLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_DiffuseLight');
   if (!this.u_DiffuseLightLoc) { 
     console.log(this.constructor.name + 
                 '.init() failed to get GPU location for u_DiffuseLight uniform');
     return;
   }

   this.u_SpecLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_SpecularLight');
    if (!this.u_SpecLightLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_SpecularLight uniform');
      return;
    } 

    this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_NormalLoc < 0) {
      console.log(this.constructor.name + 
                  '.init() Failed to get GPU location of attribute a_Normal');
      return -1;	// error exit.
    }

    this.shinyLoc = gl.getUniformLocation(this.shaderLoc, 'u_ShininessVal');
    if (!this.shinyLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_ShininessVal uniform');
      return;
    } 
    
    this.u_NormalMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
    if (!this.u_NormalMatLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_NormalMatrix uniform');
      return;
    }  

    this.u_AmbientLightLoc = gl.getUniformLocation(this.shaderLoc, 'u_AmbientLight');
    if (!this.u_AmbientLightLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_AmbientLight uniform');
      return;
    } 

    this.u_LightPositionLoc = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
    if (!this.u_LightPositionLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_NormalMatrix uniform');
      return;
    }  
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs: 
    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
    if (!this.u_ModelMatLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_ModelMat1 uniform');
      return;
    }  

  }

  VBObox6.prototype.switchToMe = function() {
  //==============================================================================
  // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
  //
  // We only do this AFTER we called the init() function, which does the one-time-
  // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
  // even then, you are STILL not ready to draw our VBObox's contents onscreen!
  // We must also first complete these steps:
  //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
  //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
  //  c) tell the GPU to connect the shader program's attributes to that VBO.
  
  // a) select our shader program:
    gl.useProgram(this.shaderLoc);	
  //		Each call to useProgram() selects a shader program from the GPU memory,
  // but that's all -- it does nothing else!  Any previously used shader program's 
  // connections to attributes and uniforms are now invalid, and thus we must now
  // establish new connections between our shader program's attributes and the VBO
  // we wish to use.  
    
  // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
  //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
  var posBuffer = gl.createBuffer();
  var normBuffer = gl.createBuffer();
      if (!posBuffer) {
        console.log('Failed to create the posbuffer object');
        return false;
      }
      if (!normBuffer) {
        console.log('Failed to create the normBuffer object');
        return false;
      }
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vboContents), gl.STATIC_DRAW);
  gl.vertexAttribPointer(this.a_PosLoc, 4, gl.FLOAT, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(this.a_PosLoc);

  gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
  gl.vertexAttribPointer(this.a_NormalLoc, 3, gl.FLOAT, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(this.a_NormalLoc);


  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vboLoc);
  /*
  //    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
                      this.vboLoc);			    // the ID# the GPU uses for our VBO.
  
  // c) connect our newly-bound VBO to supply attribute variable values for each
  // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
  // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:

    

    /*
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
      this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
      this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
      gl.FLOAT,			// type == what data type did we use for those numbers?
      false,				// isNormalized == are these fixed-point values that we need
                    //									normalize before use? true or false
      this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                    // stored attrib for this vertex to the same stored attrib
                    //  for the next vertex in our VBO.  This is usually the 
                    // number of bytes used to store one complete vertex.  If set 
                    // to zero, the GPU gets attribute values sequentially from 
                    // VBO, starting at 'Offset'.	
                    // (Our vertex size in bytes: 4 floats for pos + 3 for color)
      this.vboOffset_a_Pos0);						
                    // Offset == how many bytes from START of buffer to the first
                    // value we will actually use?  (We start with position).
    gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
                          gl.FLOAT, false, 
                          this.vboStride, this.vboOffset_a_Colr0);
    gl.vertexAttribPointer(
      this.a_NormalLoc,//index == ID# for the attribute var in your GLSL shader pgm;
      3,// # of floats used by this attribute: 1,2,3 or 4?
      gl.FLOAT,			// type == what data type did we use for those numbers?
      false,				// isNormalized == are these fixed-point values that we need
                    //									normalize before use? true or false
      this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
                    // stored attrib for this vertex to the same stored attrib
                    //  for the next vertex in our VBO.  This is usually the 
                    // number of bytes used to store one complete vertex.  If set 
                    // to zero, the GPU gets attribute values sequentially from 
                    // VBO, starting at 'Offset'.	
                    // (Our vertex size in bytes: 4 floats for pos + 3 for color)
      this.FSIZE * 7);						
                    // Offset == how many bytes from START of buffer to the first
                    // value we will actually use?  (We start with position).

                  
  // --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
    gl.enableVertexAttribArray(this.a_NormalLoc);

    */
  }
  
  VBObox6.prototype.isReady = function() {
  //==============================================================================
  // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
  // this objects VBO and shader program; else return false.
  // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
  
  var isOK = true;
  
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
      console.log(this.constructor.name + 
                  '.isReady() false: shader program at this.shaderLoc not in use!');
      isOK = false;
    }
    if(gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                '.isReady() false: vbo at this.vboLoc not in use!');
      isOK = false;
    }
    return isOK;
  }

  VBObox6.prototype.adjust = function() {
  //==============================================================================
  // Update the GPU to newer, current values we now store for 'uniform' vars on 
  // the GPU; and (if needed) update each attribute's stride and offset in VBO.
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.adjust() call you needed to call this.switchToMe()!!');
    }  
    this.a_red =    document.getElementById("a_r").value/100
    this.a_green =  document.getElementById("a_g").value/100 
    this.a_blue =   document.getElementById("a_b").value/100

    this.s_red =    document.getElementById("s_r").value/100 
    this.s_green =  document.getElementById("s_g").value/100 
    this.s_blue =   document.getElementById("s_b").value/100

    this.d_red =    document.getElementById("d_r").value/100 
    this.d_green =  document.getElementById("d_g").value/100 
    this.d_blue =   document.getElementById("d_b").value/100

    this.light_x = document.getElementById("lx").value
    this.light_y = document.getElementById("ly").value
    this.light_z = document.getElementById("lz").value

    gl.uniform3f(this.u_LightPositionLoc, this.light_x, this.light_y,this.light_z)
    gl.uniform3f(this.u_AmbientLightLoc, this.a_red,this.a_green,this.a_blue);
    gl.uniform3f(this.u_DiffuseLightLoc, this.d_red,this.d_green,this.d_blue)
    gl.uniform3f(this.u_SpecLightLoc, this.s_red,this.s_green,this.s_blue);
    gl.uniform1f(this.shinyLoc, shinyVal);
    gl.uniform3f(this.u_KsLoc, specularVal[0], specularVal[1], specularVal[2]);
    gl.uniform3f(this.u_KdLoc, diffuseVal[0], diffuseVal[1], diffuseVal[2]);
    gl.uniform3f(this.u_KaLoc, ambientVal[0], ambientVal[1], ambientVal[2]);
    gl.uniform3f(this.u_eyePosLoc, g_EyeX, g_EyeY, g_EyeZ);
    
    // Adjust values for our uniforms,
    this.ModelMat.setIdentity();
    this.ModelMat.set(g_worldMat);	// use our global, shared camera.
    this.spin+=0.3
    this.ModelMat.translate(0,0,4)
    this.ModelMat.scale(3,3,3)
    this.ModelMat.rotate(this.spin,0,0,1);
      gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.ModelMat.elements);	// send data from Javascript.

    
  }
  
  VBObox6.prototype.draw = function() {
  //=============================================================================
  // Render current VBObox contents.
  
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.draw() call you needed to call this.switchToMe()!!');
    }  

    // ----------------------------Draw the contents of the currently-bound VBO:
    gl.drawElements(gl.TRIANGLES, 	    // select the drawing primitive to draw,
                    // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                    //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
                   this.indices.length,
                   gl.UNSIGNED_SHORT,
                   0);		// number of vertices to draw on-screen.
  }
  
  VBObox6.prototype.reload = function() {
  //=============================================================================
  // Over-write current values in the GPU inside our already-created VBO: use 
  // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
  // contents to our VBO without changing any GPU memory allocations.
  
   gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                    0,                  // byte offset to where data replacement
                                        // begins in the VBO.
                      this.vboContents);   // the JS source-data array used to fill VBO
  }


VBObox6.prototype.makeUnitSphere = function()
{
var SPHERE_DIV = 26;

var i, ai, si, ci;
var j, aj, sj, cj;
var p1, p2;

this.sphVerts = [];
this.indices = [];
this.normals = [];

// Generate coordinates
for (j = 0; j <= SPHERE_DIV; j++) {
  aj = j * Math.PI / SPHERE_DIV;
  sj = Math.sin(aj);
  cj = Math.cos(aj);
  for (i = 0; i <= SPHERE_DIV; i++) {
    ai = i * 2 * Math.PI / SPHERE_DIV;
    si = Math.sin(ai);
    ci = Math.cos(ai);

    this.sphVerts.push(si * sj);  // X
    this.normals.push(si * sj);  // X
    this.sphVerts.push(cj);       // Y
    this.normals.push(cj);       // Y
    this.sphVerts.push(ci * sj);  // Z
    this.normals.push(ci * sj);  // Z
    this.sphVerts.push(1);        // W
  }
}

// Generate indices
for (j = 0; j < SPHERE_DIV; j++) {
  for (i = 0; i < SPHERE_DIV; i++) {
    p1 = j * (SPHERE_DIV+1) + i;
    p2 = p1 + (SPHERE_DIV+1);

    this.indices.push(p1);
    this.indices.push(p2);
    this.indices.push(p1 + 1);

    this.indices.push(p1 + 1);
    this.indices.push(p2);
    this.indices.push(p2 + 1);
  }
}
}