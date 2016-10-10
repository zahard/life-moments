
$(document).ready(function()
{
	var Viewer =  new PhotoViewer($('#photoViewer'));

	var Gallery = new PhotoGallery($('#photos'), 1600);

	Gallery.setViewer(Viewer);

	Gallery.loadPhotos();

	window.G = Gallery;

});
