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

// Middleware to handle PUT and DELETE
app.use(methodOverride(middleware))


app.get('/alive', alive);
app.get('/', renderDB);
app.get('/books/:books_id', getOneCard);
app.get('/new', searchForm);
app.post('/searches', find);
app.post('/add', editDetails);
app.post('/books', saveThisBook);
app.post('/update', updateForm);
app.put('/update/:books_id', updateBook);
app.delete('/delete/:books_id', deleteBook);





function alive(req, res) {
    res.render('pages/test')
}

function searchForm(req, res) {
    res.render('searches/new')
}

function find(req, res) {
    let url = `https://www.googleapis.com/books/v1/volumes?q=in${req.body.search}:${req.body.keyword}`

    return superagent.get(url)
        .then(data => {
            let results = data.body.items.map(oneBook => {

                return new Books(oneBook)
            });
            res.render('pages/books/show', { book: results })
        })
        .catch()
}

function Books(data) {
    this.author = (data.volumeInfo.authors && data.volumeInfo.authors[0]) || ' ';
    this.title = data.volumeInfo.title;
    this.isbn = (data.volumeInfo.industryIdentifiers && data.volumeInfo.industryIdentifiers[0].identifier) || ' ';
    this.image_url = (data.volumeInfo.imageLinks && data.volumeInfo.imageLinks.thumbnail) || ' ';
    this.description = data.volumeInfo.description;
}

function renderDB(req, res) {
    let SQL = `SELECT * FROM books `
    client.query(SQL)
        .then(data => {
            res.render('pages/index', { book: data.rows })
        })
}
function getOneCard(req, res) {
    let SQL = `SELECT * FROM books WHERE id=$1`
    let values = [req.params.books_id]

    client.query(SQL, values)
        .then(results => {
            res.render('pages/books/details', { book: results.rows })
        })
}

function editDetails(req, res) {
    res.render('searches/add', { book: req.body })
}

function saveThisBook(req, res) {

    let { image_url, title, author, description, isbn, bookshelf } = req.body

    let SQL = `INSERT INTO books (image_url, title, author, description, isbn, bookshelf) VALUES ($1, $2, $3, $4, $5, $6)`
    let values = [image_url, title, author, description, isbn, bookshelf]

    client.query(SQL, values)
        .then(() => {
            res.redirect('/')
        })
}

function updateForm(req, res) {
    res.render('pages/books/edit', { book: req.body })
}

function updateBook(req, res) {
    let { image_url, title, author, description, isbn, bookshelf } = req.body;

    let SQL = `UPDATE books SET image_url=$1, title=$2, author=$3, description=$4, isbn=$5, bookshelf=$6 WHERE id=$7`

    let values = [image_url, title, author, description, isbn, bookshelf, req.params.books_id];

    client.query(SQL, values)
        .then(() => {
            res.redirect('/')
        })

}

function deleteBook(req, res) {
    let SQL = `DELETE FROM books WHERE id=$1`
    let values = [req.params.books_id]

    client.query(SQL, values)
        .then(() => {
            res.redirect('/')
        })
}

function middleware(req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        let method = req.body._method;
        delete req.body._method;
        return method;
    }
}
client.connect()
    .then(

        app.listen(PORT, () => { console.log(`Welcome aboard on ${PORT}`) })
    )