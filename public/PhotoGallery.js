
class PhotoGallery
{
	constructor(wrap, width)
	{
		this.wrap = wrap;
		this._loader = wrap.parent().find('.loader');

		this.offset = 0;
		this.limit = 30;
		this.height = 250;
		this.margin = 10;

		this.wrapWidth = width;

		this.rows = [];

		this.attachListeners();


		this.totalLoaded = 0;
	}

	setViewer(viewer)
	{
		this.viewer = viewer;

		this.viewer.on('next', this.showNext.bind(this));
		this.viewer.on('prev', this.showPrev.bind(this));
	}


	viewPhoto(photo, rowIndex, index, showViewer)
	{	
		//Show viewer
		if (showViewer) this.viewer.show();

		//Set photo
		this.viewer.setPhoto(photo);

		this._current = {
			info: photo,
			index: index,
			row: rowIndex
		}

		var controls = {
			prev: true,
			next: true
		};
		if(rowIndex == 0 && index == 0) {
			controls.prev = false;
		} else if(this.rows.length - 1 == rowIndex && this.rows[rowIndex].photos.length-1 == index) {
			controls.next = false;
		}
		this.viewer.setControls(controls);
	}

	showNext()
	{
		var index = this._current.index;
		var rowIndex = this._current.row;

		var row = this.rows[this._current.row];
		if(!row) return;

		//If its end of row try find next row
		if (row.photos.length - 1 <= index)
		{	
			row = this.rows[this._current.row+1];
			if (!row) return;

			//Start from 0
			index = 0;
			rowIndex++;
		}else{
			index++;
		}

		//So at this point we can pick next photo from row
		var photo = row.photos[index];

		//Display it
		this.viewPhoto(photo, rowIndex, index);

	}

	showPrev()
	{
		var index = this._current.index;
		var rowIndex = this._current.row;
		//Find previous photo
		var row = this.rows[this._current.row];
		if (!row) return;

		//If its start of row - go back to previous row if it exists
		if (index == 0)
		{	
			row = this.rows[this._current.row-1];
			if (!row) return;

			//Start from 0
			index = row.photos.length-1;
			rowIndex--;
		}else{
			index--;
		}

		var photo = row.photos[index];

		//Display it
		this.viewPhoto(photo,rowIndex, index);
	}

	countMonthes(callback)
	{
		$.get('/monthes', function(data){
			
			this.applyMonthes(data);

			callback();
		}.bind(this))
	}

	loadPhotos()
	{
		this.countMonthes(function(){
			$.get('/photos?offset='+this.offset+'&limit='+this.limit, function(data){
				this.addPhotos(data);
			}.bind(this))
		}.bind(this));
	}

	loadMore()
	{	
		this._loader.show();
		this.offset += this.limit;
		this.loadPhotos();
	}

	createMonthRow(month)
	{
		var row = $('<div class="row month"/>');
		row.text(month.name);
		this.wrap.append(row);
	}

	addPhotos(photos)
	{
		this._loader.hide();

		var photo;
		var takenWidth;
		var totalWidth = 0;
		var start = 0;
		var count = 0;

		//CHeck if we have imcomplete row
		if (this.rows.length)
		{
			var lastRow = this.rows[this.rows.length-1];
			if (!lastRow.isFull)
			{
				//Delete last row HTML
				this.wrap.find('.row').last().remove();

				//Prepend row data to new results
				photos = lastRow.photos.concat(photos);

				//Remove row from list
				this.rows.pop();
			}
		}

		//Draw month before start
		if (this.totalLoaded == 0)
		{
			this.createMonthRow(this.month);
		}

		//Stop index of next month (will be update if we changes month inside this render)
		var monthLimit = this.loadedMonthlyPhotos + this.month.count;


		//Add photo width to total used width
		//until it rich out limit
		//And take it for show row
		for (var i=0;i<photos.length;i++)
		{
			photo = photos[i];
			//Photo width its actually default row height muipliplied by  photo ratio
			var photoWidth =  photo.ratio * this.height;

			if (photoWidth > this.wrapWidth)
			{
				console.error('To narrow image. Skip it', photo.url)
				continue;
			}

			//Add photo width total width
			totalWidth += photoWidth;


			//Count how many photos we have in sequence
			count++;

			//Stop adding photos to current row
			if (totalWidth > this.wrapWidth) {

				//Width taken by row photos
				//To get it we remove last added photo
				var takenWidth = totalWidth - photoWidth - this.margin;

				//Draw photo row
				this.createRow(takenWidth, photos.slice(start, i), true);

				//Clear counters
				start = i;
				totalWidth = 0;
				count = 0;

				//Continue from curernt element
				i--;

			} 
			else
			{

				if (monthLimit == this.totalLoaded + i ) {

					//START NEW MONTH
					this.createRow(totalWidth, photos.slice(start, i), false);
					totalWidth = 0;
					count = 0;
					start = i;

					//Go to next month
					this.setNextMonth();
					monthLimit = this.loadedMonthlyPhotos + this.month.count;

					this.createMonthRow(this.month);

					i--;


				} else{
					//Add margin
					totalWidth += this.margin;
				}

			}
		}

		//If some photo still unused - draw it also
		if (count > 0) {
			this.createRow(totalWidth, photos.slice(start, i), false);
		}

		this.totalLoaded += photos.length;
	}


	createRow(width, photos, isFull)
	{	
		this.rows.push({
			photos: photos,
			isFull: isFull
		});

		var row = $('<div class="row"/>');
		this.wrap.append(row);

		var len = photos.length;
		var whiteSpace = (len -1) * this.margin;
		var rowHeight = this.height;

		if (isFull)
		{
			var ratioSum = (width-whiteSpace) / this.height;
			var rowHeight = Math.floor((this.wrapWidth-whiteSpace) / ratioSum);
		}
		row.height(rowHeight)

		//Its width taken by our photos
		//From start it just space bettwen them
		var usedWidth = whiteSpace;
		for (var i=0;i<len;i++)
		{

			var exactWidth = rowHeight * photos[i].ratio;

			//Round image width up and down. Thats for avoid subpixels
			var imageWidth = (i % 2 == 1) ? Math.floor(exactWidth) : Math.ceil(exactWidth);

			//Update used width
			usedWidth += imageWidth;

			//Correct width on last image
			//To fit exactly in container
			if (i == len-1 && isFull) {	
				imageWidth -= (usedWidth - this.wrapWidth);
			}

			//Create image itself
			this.createImage(photos[i], row, imageWidth, rowHeight,  i, this.rows.length-1);
		}

	}

	createImage(photo, parent, width, height, index, rowIndex)
	{
		var img = document.createElement('img');
		img.src= photo.thumbUrl;
		img.onclick = function(){
			this.viewPhoto(photo, rowIndex, index, true);
		}.bind(this);

		var div =$('<div class="img"/>')
		
		if (width) img.width = width;
		if (height) div.height(height)

		if (index == 0) div.css('margin-left','0')
		
		div.append(img);

		parent.append(div);
	}


	applyMonthes(monthes)
	{
		this.loadedMonthlyPhotos = 0;
		this.monthes = [];

		monthes.forEach((month) => {
			var ob = {
				name: this.monthName(month._id.year,month._id.month),
				count: month.total
			};
			this.monthes.push(ob);
		
		});

		this._monthIndex = 0;
		this.month = this.monthes[0];
	}

	setNextMonth()
	{
		this.loadedMonthlyPhotos += this.month.count;
		this._monthIndex++;
		this.month = this.monthes[this._monthIndex];
	}

	monthName(y,m)
	{
		var names = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
		return names[m-1] + ' ' + y;
	}

	onScroll()
	{
		var scrollLimit = document.body.offsetHeight - window.innerHeight - 10;
		if(window.scrollY > scrollLimit)
		{
			this.loadMore();
		}
	}

	attachListeners()
	{
		$(document).scroll(function(){
			this.onScroll();
		}.bind(this));
	}
}