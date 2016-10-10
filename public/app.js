
$(document).ready(function()
{
	var Viewer =  new PhotoViewer($('#photoViewer'));

	var Gallery = new PhotoGallery($('#photos'), {
		limit: 50,
		offset: 0,
		width: 1600,
		height: 250,
		margin: 10
	});

	Gallery.setViewer(Viewer);

	Gallery.init();

	window.G = Gallery;

});
