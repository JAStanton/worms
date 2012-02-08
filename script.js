/* Author: Jonathan Stanton
   Website: www.jastanton.com
   Date: January 29, 2012
   Links: http://www.emanueleferonato.com/2010/08/05/worms-like-destructible-terrain-in-flash-part-2/
   Links: http://hacks.mozilla.org/2009/06/pushing-pixels-with-canvas/
*/

var WORMS = function () {

	//private functions
	var Rectangle = function(x,y,w,h){
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.grid = [];
		for (var x_ = 0; x_ < this.w; x_++) {
			for (var y_ = 0; y_ < this.h; y_++) {
				this.grid.push([this.x + x_, this.y + y_]);
			}
		}
	};

	var Bitmap = function(imageData){
		this.imageData = imageData;
		this.height = this.imageData.height;
		this.width = this.imageData.width;
		this.x = 0;
		this.y = 0;
		this.hitTest = function(rect,color){
			color = color || "RGBA(0,255,0,255)";
			for (var i = 0; i < rect.grid.length; i++) {
				var x = rect.grid[i][0];
				var y = rect.grid[i][1];
				var pixel = get_pixel(Math.floor(x),Math.floor(y),this.imageData,-this.x,-this.y);
				if(pixel === color) return true;
			}
			return false;
		};
		this.fillColor = function(r,g,b,a){
			for (var x = 0; x < imageData.width; x++)  {
				for (var y = 0; y < imageData.height; y++)  {

					// Index of the pixel in the array
					var idx = (x + y * this.width) * 4;

					imageData.data[idx + 0] = r;
					imageData.data[idx + 1] = g;
					imageData.data[idx + 2] = b;
					imageData.data[idx + 3] = a;

				}
			}
		};
	};



	var Projectile = function(theta,v){
		this.theta = theta;
		this.x = WORMS.character_bmp.x; //start pos x
		this.y = WORMS.character_bmp.y; //start pos y
		this.r = 10; //radius
		this.frameCount = 0;
		var g = 9.8;
		var v0x = v * Math.cos(theta * Math.PI/180);
		var v0y = v * Math.sin(theta * Math.PI/180);
		var p_mass = 100;

 
		var w_theta = WORMS.wind_angle;
		var w_v = WORMS.wind_speed;// 28 max // 0 min
		var w_v0x = w_v * Math.cos(w_theta * Math.PI/180);
		var w_v0y = w_v * Math.sin(w_theta * Math.PI/180);

		this.draw = function(index){

			// add wind
			v0x += (w_v0x - v0x) / p_mass * this.frameCount;
			v0y += (w_v0y - v0y) / p_mass * this.frameCount;

			// integrate velocity
			this.x +=  v0x * this.frameCount;
			this.y -=  v0y * this.frameCount - (1/2 * g * Math.pow(this.frameCount,2));

			// this.y = this.y - ( v0y * this.frameCount - (1/2 * g * Math.pow(this.frameCount,2)) );
			// this.x = this.x + v0x * this.frameCount;


			WORMS.ctx.save();
				WORMS.ctx.beginPath();
				WORMS.ctx.fillStyle = "rgba(0, 200, 0, 0.6)";
				WORMS.ctx.arc(this.x,this.y,this.r,0,Math.PI*2,true);
				WORMS.ctx.fill();
				WORMS.ctx.stroke();
				WORMS.ctx.closePath();
			WORMS.ctx.restore();

			this.frameCount += 0.05;
			
			if(this.x < 0 || this.y < 0 || this.x > WORMS.ctx.canvas.width || this.y > WORMS.ctx.canvas.height){
				//destroy projectile
				WORMS.projectiles.splice(index, 1);
				return;
			}

			//test collision
			var me = new Rectangle(this.x - this.r,this.y - this.r,this.r*2,this.r*2 );
			// WORMS.draw_rectancgle(me);
			if(WORMS.terrain_bmp.hitTest(me)){
				WORMS.projectiles.splice(index, 1);
	
				WORMS.collide_projectile_terrain(this.x,this.y,30);

			}
		};

	};

	var get_pixel = function(x,y,canvasData,offsetX,offsetY){

		x = x + offsetX;
		y = y + offsetY;

		if(x < 0 || y < 0 || x > canvasData.width || y > canvasData.height) return;

		var r = (y * canvasData.width + x) * 4;
		var g = (y * canvasData.width + x) * 4 + 1;
		var b = (y * canvasData.width + x) * 4 + 2;
		var a = (y * canvasData.width + x) * 4 + 3;
		
		// WORMS.terrain_bmp.imageData.data[r] = 255;
		// WORMS.terrain_bmp.imageData.data[g] = 0;
		// WORMS.terrain_bmp.imageData.data[b] = 0;
		// WORMS.terrain_bmp.imageData.data[a] = 255;

		// WORMS.canvases.terrain.clearRect(0 , 0, WORMS.width ,WORMS.height);
		// WORMS.canvases.terrain.putImageData(WORMS.terrain_bmp.imageData,WORMS.terrain_bmp.x,WORMS.terrain_bmp.y);
		// WORMS.draw_objects();

		return "RGBA(" + canvasData.data[r] + "," + canvasData.data[g] + "," + canvasData.data[b] + "," + canvasData.data[a] + ")";
	};

	return {
		init: function () {
			this.theta = 45;
			this.velocity = 20;
			this.wind_angle = Math.floor(Math.random()*360);
			this.wind_speed = Math.floor(Math.random()*23);

			this.status = "paused";
			var hello = new Rectangle(10,10,3,3);
			var canvas = document.getElementById("surface");
			this.ctx = canvas.getContext("2d");

			this.canvases = {};
			this.projectiles = [];

			var terrain_bmpd = this.ctx.createImageData(1000,200);
			this.terrain_bmp = new Bitmap(terrain_bmpd);
			this.terrain_bmp.fillColor(0,255,0,255);


			var character_bmpd = this.ctx.createImageData(10,20);
			this.character_bmp = new Bitmap(character_bmpd);
			this.character_bmp.fillColor(0,0,255,255);

			this.width = canvas.getAttribute("width");
			this.height = canvas.getAttribute("height");

			document.onkeydown = this.key_down;
			document.onkeyup   = this.key_up;
			document.onmouseup = this.mouse_up;
			// document.onmousemove = this.mouse_move;

			this.jumping = false;
			this.up_key = false;
			this.down_key = false;
			this.left_key = false;
			this.right_key = false;
			this.space_key = false;
			this.character_speed = 0;

			this.init_objects(); //init the objects
			this.frame();
		},
		draw_wind : function(angle,power){
			var r = 27;
			var x = (this.width / 2) - r;
			var y = (r * 2) + 10;
			
			//draw a circle
			this.ctx.beginPath();
			this.ctx.arc(x, y, r, 0, Math.PI*2, true);
			this.ctx.closePath();
			this.ctx.stroke();


						
			this.ctx.save();
			this.ctx.translate(x,y);
			console.log(angle * Math.PI / 180);
			this.ctx.rotate(-angle * Math.PI / 180);
			this.ctx.moveTo(r,0);
			this.ctx.lineTo(r + 10,0);
			this.ctx.stroke();
			this.ctx.restore();

			var font_size = (8 * ((this.width  * 1) / 400));
			this.ctx.font = font_size + "pt Calibri";
			this.ctx.textAlign = "center";
			this.ctx.fillStyle = "green";
			this.ctx.fillText(power, x, y + (font_size / 2));
			
		},
		draw_rectancgle : function(rect,color){
			this.ctx.fillStyle = color || "rgba(255,0,0,.5)";
			this.ctx.fillRect(rect.x,rect.y,rect.w,rect.h);
		},
		collide_projectile_terrain : function(x,y,r){
			this.canvases.terrain.globalCompositeOperation = "destination-out";
			this.canvases.terrain.beginPath();
			this.canvases.terrain.arc(x,y,r,0,Math.PI*2,true);
			this.canvases.terrain.fill();
			
			//update
			var newCanvasData = this.canvases.terrain.getImageData(this.terrain_bmp.x, this.terrain_bmp.y, this.terrain_bmp.width, this.terrain_bmp.height);
			this.terrain_bmp.imageData = newCanvasData;
			this.canvases.terrain.putImageData(newCanvasData,this.terrain_bmp.x,this.terrain_bmp.y);
			this.draw_objects();
		},
		init_objects : function(){
			this.terrain_bmp.y = this.height - this.terrain_bmp.height;
			this.add_child("terrain",this.terrain_bmp);

			this.character_bmp.x = 250;
			this.character_bmp.y = this.height - this.terrain_bmp.height - this.character_bmp.height;
			this.add_child("character",this.character_bmp);

			this.draw_objects();
		},
		frame : function(){

			if(this.left_key || this.right_key || this.jumping) this.move_character();
			if(this.projectiles.length > 0) this.update_projeciles();
			stats.update();
			
			this.draw_angle();
			this.draw_power();
			this.draw_wind(this.wind_angle,this.wind_speed);

			setTimeout(function(){ WORMS.frame(); }, 1000 / 60); //the loop
		},
		update_projeciles : function(){
			WORMS.draw_objects();
			for (var i = 0; i < this.projectiles.length; i++) {
					this.projectiles[i].draw(i);
			}
		},
		fire_projectile : function(){
			this.projectiles.push(new Projectile(this.theta,this.velocity));
		},
		draw_angle : function(){
			if(this.up_key && this.theta < 180) this.theta += 1;
			var x = 5;
			var y = this.height - 5;
			var font_size = (5 * ((this.width  * 1) / 400));
			this.ctx.font = font_size + "pt Calibri";
			this.ctx.textAlign = "left";
			this.ctx.fillStyle = "blue";
			this.ctx.fillText("Angle: " + this.theta, x, y);
		},
		draw_power : function(){
			if(this.down_key && this.theta > 0) this.theta -= 1;
			var x = 5;
			var y = this.height - 20;
			var font_size = (5 * ((this.width  * 1) / 400));
			this.ctx.font = font_size + "pt Calibri";
			this.ctx.textAlign = "left";
			this.ctx.fillStyle = "blue";
			this.ctx.fillText("Power: " + this.velocity, x, y);
		},
		draw_objects : function(){
			this.ctx.clearRect (0 , 0, this.width ,this.height);

			for (var key in this.canvases) {
				var obj = this.canvases[key];
				if(obj !== undefined){
					this.ctx.drawImage(obj.canvas,0,0); //put the pieces together
				}
			}

		},
		add_child : function(temp_name,bitmap,method){
			//stores the canvases in temporary obj to manipulate later
			var t = document.createElement('canvas');
				t.height = this.height;
				t.width = this.width;
			
			var t_context = t.getContext("2d");
				t_context.putImageData(bitmap.imageData, bitmap.x, bitmap.y);

			this.canvases[temp_name] = t_context;
		},
		move_character : function(){
			var i = 0;

			// var left_arm = new Rectangle(this.character_bmp.x - 1,this.character_bmp.y,1,17);
			// var right_arm = new Rectangle(this.character_bmp.x + 10,this.character_bmp.y,1,17);
			//var head = new Rectangle(this.character_bmp.x,this.character_bmp.y,10,1);
			// var foot = new Rectangle(this.character_bmp.x,this.character_bmp.y + 20,10,1);

			if (this.left_key) {
				for (i = 0; i < 3; i++) {
					if(!this.terrain_bmp.hitTest(new Rectangle(this.character_bmp.x - 1,this.character_bmp.y,1,17))){
						this.character_bmp.x -= 1;
					}
					while(this.terrain_bmp.hitTest(new Rectangle(this.character_bmp.x,this.character_bmp.y + 20,10,1))){
						
						this.character_bmp.y -= 1;
					}
				}
			}
			
			if(this.right_key){
				for (i = 0; i < 3; i++) {
					if(!this.terrain_bmp.hitTest(new Rectangle(this.character_bmp.x + 10,this.character_bmp.y,1,17))){
						this.character_bmp.x += 1;
					}
					while(this.terrain_bmp.hitTest(new Rectangle(this.character_bmp.x,this.character_bmp.y + 20,10,1))){
						this.character_bmp.y -= 1;
					}
				}
			}

			if(this.space_key && !this.jumping){
				this.character_speed = -10;
				this.jumping = true;
			}
			this.character_speed++; //is this going to work prooperly?

			if(this.character_speed > 0){
				//check ground
				for (i = 0; i < this.character_speed; i++) {
					if(!this.terrain_bmp.hitTest(new Rectangle(this.character_bmp.x,this.character_bmp.y + 20,10,1))){
						this.character_bmp.y += 1;
					}else{
						this.jumping = false;
						this.character_speed = 0;
					}
				}
			}else{
				for (i = 0; i < Math.abs(this.character_speed); i++) {
					if(!this.terrain_bmp.hitTest(new Rectangle(this.character_bmp.x,this.character_bmp.y,10,1))){
						this.character_bmp.y -= 1;
					}else{
						this.character_speed = 0;
					}
				}
			}

			
			this.draw_character();
			// this.draw_rectancgle(new Rectangle(this.character_bmp.x,this.character_bmp.y,10,1));
		},
		draw_character : function(){
			this.canvases.character.clearRect(0 , 0, this.width ,this.height);
			this.canvases.character.putImageData(this.character_bmp.imageData,this.character_bmp.x,this.character_bmp.y);
			this.draw_objects();
		},
		mouse_move : function(){
			var x = event.offsetX,
				y = event.offsetY;
			
			console.log(get_pixel(x,y,WORMS.terrain_bmp.imageData,-WORMS.terrain_bmp.x,-WORMS.terrain_bmp.y));
		},
		mouse_up : function(){
			var x = event.offsetX,
				y = event.offsetY;
			
			WORMS.collide_projectile_terrain(x,y,30);
		},
		key_down: function () {
			var KeyID = event.keyCode;
			
			if(KeyID === 38) WORMS.up_key = true;
			if(KeyID === 40) WORMS.down_key = true;
			if(KeyID === 37) WORMS.left_key = true;
			if(KeyID === 39) WORMS.right_key = true;
			if(KeyID === 88) WORMS.space_key = true;
			if(KeyID === 32) WORMS.fire_projectile();
		},
		key_up: function () {
			var KeyID = event.keyCode;

			if(KeyID === 38) WORMS.up_key = false;
			if(KeyID === 40) WORMS.down_key = false;
			if(KeyID === 37) WORMS.left_key = false;
			if(KeyID === 39) WORMS.right_key = false;
			if(KeyID === 88) WORMS.space_key = false;
			if(KeyID === 32) WORMS.space_key = false;
		}
	}; //return

}();