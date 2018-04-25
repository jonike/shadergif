class MathjsPlayer {
	constructor(){
		this.mathjs_worker = null;
		this.mathjs_processing = false;
		this.compiled = false;
		this.canvas = document.createElement("canvas");
		this.message_area = document.createElement("pre");
		this.frames_defined_in_code = false;
		this.window_focused = true;
		this.code = "";
		this.anim_interval = null;
		
		// TODO: synchronize with vue
		this.width = 540;
		this.height = 540;
		this.rendering_gif = false;

		this.on_error_listener = function(error){
			console.log("Error: " + error);
		};

		{
			// Init canvas
			this.mathjs_worker = new Worker('/assets/mathjs-worker.js');
			this.canvas.width = this.width;
			this.canvas.height = this.height;
		}

		{
			// To save CPU / GPU
			window.addEventListener('focus', function() {
				this.window_focused = true;
			});
			
			window.addEventListener('blur', function() {
				this.window_focused = false;
			});
		}

		{
			this.message_area.classList.add("mathjs-message-area");
		}
	}
	
	/* 
	   Generic player functions 
	   (That would be in an interface if Javascript had that)
	 */
	
	set_container(div){
		div.appendChild(this.canvas);
		div.appendChild(this.message_area);
	}

	set_code(code){
		this.code = code;
		this.update();
	}
	
	set_width(w){
		this.width = w;
		this.canvas.width = w;
		this.update();
	}

	set_height(h){
		this.height = h;
		this.canvas.height = h;
		this.update();
	}

	/* callback receives a canvas element */
	render(time, callback){
		var canvas = this.canvas;
		
		var message = {
			w: canvas.width,
			h: canvas.height,
			code: this.code,
			time: time
		};
		
		this._mathjs_render(message, function(canvas){
			var ctx = canvas.getContext("2d");
			ctx.fillStyle = "#888888";
			ctx.fillText("shadergif.com", canvas.width - 80, canvas.height - 10);
			
			callback(canvas);
		});
	}

	_mathjs_render(data, callback){
		var player = this;
		var canvas = this.canvas;

		player.setMessage("Rendering...");
		
		player.mathjs_worker.onmessage = function(m){
			if(typeof(m.data.error) != "undefined"){
				player.on_error_listener(m.data.error);
			} else if (m.data.data.constructor == Uint8ClampedArray) {
				var ctx = canvas.getContext("2d");
				var w = m.data.w;
				var h = m.data.h;
				var img_data = new ImageData(m.data.data, w, h);
				canvas.width = w;
				canvas.height = h;
				ctx.putImageData(img_data, 0, 0);
				
				player.setMessage("Done...");
				callback(canvas);
			} else {
				player.on_error_listener("Worker output is not a Uint8ClampedArray");
			}
			
			player.mathjs_processing = false;
		};
		
		player.mathjs_worker.postMessage(data);
	}
	
	set_on_error_listener(callback){
		// Call this on error
		this.on_error_listener = callback;
	}

	dispose(){
		// Nothing to do
	}

	/* Mathjs specific functions */

	update(){
		var canvas = this.canvas;
		var now = new Date().getTime();

		var message = {
			w: canvas.width,
			h: canvas.height,
			code: this.code,
			time: now
		};
		
		this._mathjs_render(message, function(canvas){
			// do nothing
		});
	}

	setMessage(message){
		this.message_area.innerText = message;
	}
	
}
