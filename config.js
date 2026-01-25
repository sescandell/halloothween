import express from 'express';
import ejs from 'ejs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function(app, io) {

    // Set .html as the default template extension
    app.set('view engine', 'html');

    // Initialize the ejs template engine
    app.engine('html', ejs.renderFile);

    // Tell express where it can find the templates
    app.set('views', __dirname + '/views');

    // Make the files in the public folder available to the world
    app.use(express.static(__dirname + '/public'));
}
