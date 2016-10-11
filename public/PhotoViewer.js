

class PhotoViewer
{	
	constructor(template)
	{
		this._template = template;

		this._container = this._template.find('.container');
		this._info = this._template.find('.imageInfo');
		this._photo = this._template.find('.photo');

		this._arrow = {};
		this._arrow.prev = this._template.find('.arrow.left')
		this._arrow.next = this._template.find('.arrow.right')

		this.attachListeners();

		this.fullWidth = true;

		this._events = {};
	}

	setPhoto(photo)
	{
		//Empty previous state
		this.clear();

		//Show loader
		//TODO

		var maxContainerWidth = Math.max(1600, window.innerWidth);
		var maxContainerHeight = window.innerHeight * 0.75;

		this.photo = photo;

		var url = photo.url;
		var img = new Image();
		this.blockControl = true;
		img.onload = function()
		{
			this.blockControl = false;
			//FIx orientation
			if (photo.exif.Orientation == 1 )
			{
				this._photo.append(img);
			}
			else
			{
				var imgDIv = $('<div class="rotate rotate-'+photo.exif.Orientation+'"></div>')
				imgDIv.append(img);

				if(photo.exif.Orientation != 3){
					imgDIv.height = img.width;					
				}

				this._photo.append(imgDIv);
			}

		}.bind(this);
		img.src = url;

	}

	getFixedImage(img, orientation)
	{
		var cnv = document.createElement('canvas');
		if(orientation == 3)
		{
			cnv.width = img.width;
			cnv.height = img.height;
		}else{
			cnv.width = img.height;
			cnv.height = img.width;
		}
		var ctx = cnv.getContext('2d');

		var degree = 0;
		if(orientation == 3)
		{	
			degree = 180;
		}else if(orientation == 6)
		{
			degree = 90;
		}else{
			degree =-90;
		}

		ctx.translate(cnv.width/2,cnv.height/2);
		ctx.rotate(degree * Math.PI / 180);
		ctx.drawImage(img,-img.width/2,-img.height/2);
		

		var image = new Image();
		image.src = cnv.toDataURL();
		return image;
	}

	show()
	{	
		this._template.show();
		this._template.on('mousewheel', function(e){
			return false;
		});
		this.emit('show');
	}

	hide()
	{
		this._template.hide();
		this.clear();
		this.emit('closed');
	}

	clear()
	{
		this._photo.empty();
		this.photo = null;
	}

	setControls(options)
	{
		if (typeof options.prev !== 'undefined') {
			if (options.prev === false)
				this._arrow.prev.hide();
			else
				this._arrow.prev.show();
		}

		if (typeof options.next !== 'undefined') {
			if (options.next === false)
				this._arrow.next.hide();
			else
				this._arrow.next.show();
		}
	}

	attachListeners()
	{	
		//Show/hide photo information
		this._template.find('.opener').click(function(e){
			if (this.fullWidth) {
				this._template.addClass('collapsed');
			} else {
				this._template.removeClass('collapsed');
			}

			this.fullWidth = !this.fullWidth;

			e.preventDefault();
			return false;

		}.bind(this));

		//Close Viewer
		this._template.find('.back').click(function(){
			this.hide()
		}.bind(this));

		//NExt prev
		this._arrow.next.click(function(){
			if (this.blockControl) return;

			this.emit('next')
		}.bind(this));

		this._arrow.prev.click(function(){
			if (this.blockControl) return;
			
			this.emit('prev')
		}.bind(this));



	}

	on(event, listener)
	{
		if (!this._events[event])
		{
			this._events[event] = [];
		}
		this._events[event].push(listener);
	}

	emit(event, params)
	{
		if(!(params instanceof Array))
		{
			params = [params];
		}
		
		if (!this._events[event]) return;
		if (!this._events[event].length) return;

		for (var i=0; i<this._events[event].length;i++)
		{
			this._events[event][i].apply(this, params);
		}
	}
}

