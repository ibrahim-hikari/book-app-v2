`use strict`;

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg')
const methodOverride = require('method-override')
const expressLayouts = require('express-ejs-layouts')


const client = new pg.Client(process.env.DATABASE_URL);


const app = express();
const PORT = process.env.PORT || 9797;

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.use(expressLayouts);
app.set('view engine', 'ejs');



app.get('/alive', alive);
app.get('/', searchForm);
app.post('/searches', find)





function alive(req, res) {
    res.render('pages/test')
}

function searchForm(req, res) {
    res.render('pages/index')
}

function find(req, res) {
    let url = `https://www.googleapis.com/books/v1/volumes?q=in${req.body.search}:${req.body.keyword}`

    return superagent.get(url)
        .then(data => {
            let results = data.body.items.map(oneBook => {

                return new Books(oneBook)
            });
            res.render('searches/show', { book: results })
        })
        .catch()
}

function Books(data) {
    this.author = (data.volumeInfo.authors && data.volumeInfo.authors[0]) || ' ';
    this.title = data.volumeInfo.title;
    this.isbn = (data.volumeInfo.industryIdentifiers && data.volumeInfo.industryIdentifiers[0].identifiers) || ' ';
    this.image = (data.volumeInfo.imageLinks && data.volumeInfo.imageLinks.thumbnail) || ' ';
    this.description = data.volumeInfo.description;
}


app.listen(PORT, () => { console.log(`Welcome aboard on ${PORT}`) });