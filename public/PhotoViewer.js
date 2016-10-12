

class PhotoViewer
{	
	constructor(template, fullWidth)
	{
		this._template = template;

		this._container = this._template.find('.container');
		this._info = this._template.find('.imageInfo');
		this._properties = this._template.find('.imageInfo .properties');
		this._photo = this._template.find('.photo');

		this._arrow = {};
		this._arrow.prev = this._template.find('.arrow.left')
		this._arrow.next = this._template.find('.arrow.right')

		this.attachListeners();

		this.fullWidth = fullWidth || false;
		this.updateInfoBlock();

		this.active = false;

		this._events = {};
	}

	setPhoto(photo)
	{
		//Empty previous state
		this.clear();

		//Show loader
		//TODO

		var defaultWidth = 1400;

		var containerWidth = Math.max(1400, window.innerWidth);
		var maxContainerHeight = window.innerHeight * 0.75;

		this.photo = photo;

		var url = photo.url;
		var img = new Image();
		this.blockControl = true;
		img.onload = function()
		{
			this.blockControl = false;

			this.updateImagePosition();

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

		this._image = img;
		img.src = url;

		this.renderInfo(photo)

	}

	formatDate (date)
	{
		var date = ISODate(date);

		return moment(date).format("DD MMM, YYYY hh:mm")
	}

	renderInfo (photo)
	{

		var exif = photo.exif;
		var props = [
			{
				name:'Name', 
				value: photo.url.split('/').slice(-1)[0] 
			},{
				name:'Date',
				value: this.formatDate(exif.DateTimeOriginal)
			},{
				name:'Device',
				value: exif.Make+' '+exif.Model
			}
		];

		this._properties.empty();

		props.forEach((p)=>{
			this._properties.append('<dt>'+p.name+'</dt>');	
			this._properties.append('<dd>'+p.value+'</dd>');	
		})
	}


	updateImagePosition (image)
	{
		var contWidth;
		var img = image || this._image;

		var contWidth = this._template.width();
		//If not full width , sunstract info block width
		if (!this.fullWidth)
		{
			var infoBlockWidth = this._info[0].offsetWidth;
			contWidth -= infoBlockWidth;
		}

		var contHeight = this._container.height();

		var contRatio = contWidth/contHeight;
		var imageRatio = img.width/img.height;

		if (imageRatio <= contRatio)
		{
			img.style.height = '100%';
			img.style.width = 'auto';
			img.style.top = '';
		}
		else
		{
			img.style.height = 'auto';
			img.style.width = '100%';
			img.style.top = ((contHeight - (contWidth/imageRatio) )/2) + 'px';

		}
	}

	show()
	{	
		this._template.show();
		this._template.on('mousewheel', function(e){
			return false;
		});

		this.active = true;

		this.emit('show');
	}

	hide()
	{
		this._template.hide();
		this.clear();

		this.active = false;

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

	updateInfoBlock()
	{
		if (this.fullWidth) {
			this._template.addClass('collapsed');
		} else {
			this._template.removeClass('collapsed');
		}
	}

	attachListeners()
	{	
		//Show/hide photo information
		this._template.find('.opener').click(function(e){
			
			this.fullWidth = !this.fullWidth;

			this.updateInfoBlock()

			setTimeout(()=>{
				this.updateImagePosition();
			}, 200);

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

		$(window).on('resize', ()=>{
			if (!this.active) return;

			if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

			this.resizeTimeout = setTimeout(()=>{
				this.updateImagePosition();
			},250);
		});



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

