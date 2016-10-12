
$(document).ready(function()
{	
	moment.locale('en');

	var Viewer =  new PhotoViewer($('#photoViewer'), true);

	var Gallery = new PhotoGallery($('#photos'), {
		limit: 50,
		offset: 0,
		width: 1200,
		height: 250,
		margin: 10
	});

	Gallery.setViewer(Viewer);

	Gallery.init();

	window.G = Gallery;

});
