import {
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    authorExists
} from '../models/books.js';

const getBooksHandler = async (req, res) => {
    try {
        const books = await getAllBooks();
        return res.status(200).json(books);
    } catch (error) {
        console.error('GET /books failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const getBookByIdHandler = async (req, res) => {
    const requestedId = req.params.id;

    try {
        const book = await getBookById(requestedId);

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        return res.status(200).json(book);
    } catch (error) {
        console.error('GET /books/:id failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const createBookHandler = async (req, res) => {
    try {
        const { id, authorId, title, publicationDate } = req.body || {};

        if (
            typeof id !== 'string' ||
            id.trim().length === 0 ||
            typeof authorId !== 'string' ||
            authorId.trim().length === 0 ||
            typeof title !== 'string' ||
            title.trim().length === 0 ||
            typeof publicationDate !== 'string' ||
            publicationDate.trim().length === 0
        ) {
            return res.status(400).json({
                message: 'All fields (id, authorId, title, publicationDate) are required and must be non-empty strings'
            });
        }

        const trimmedId = id.trim();
        const trimmedAuthorId = authorId.trim();
        const trimmedTitle = title.trim();
        const trimmedPublicationDate = publicationDate.trim();

        const existingBook = await getBookById(trimmedId);
        if (existingBook) {
            return res.status(400).json({ message: 'Book with this id already exists' });
        }

        const hasValidAuthor = await authorExists(trimmedAuthorId);
        if (!hasValidAuthor) {
            return res.status(400).json({
                message: 'Author with the specified authorId does not exist'
            });
        }

        const createdBook = await createBook({
            id: trimmedId,
            authorId: trimmedAuthorId,
            title: trimmedTitle,
            publicationDate: trimmedPublicationDate
        });

        return res.status(201).json(createdBook);
    } catch (error) {
        console.error('POST /books failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const updateBookHandler = async (req, res) => {
    const requestedId = req.params.id;

    try {
        const { authorId, title, publicationDate } = req.body || {};

        if (
            typeof authorId !== 'string' ||
            authorId.trim().length === 0 ||
            typeof title !== 'string' ||
            title.trim().length === 0 ||
            typeof publicationDate !== 'string' ||
            publicationDate.trim().length === 0
        ) {
            return res.status(400).json({
                message: 'Fields authorId, title, and publicationDate are required and must be non-empty strings'
            });
        }

        const trimmedAuthorId = authorId.trim();
        const trimmedTitle = title.trim();
        const trimmedPublicationDate = publicationDate.trim();

        const hasValidAuthor = await authorExists(trimmedAuthorId);
        if (!hasValidAuthor) {
            return res.status(400).json({
                message: 'Author with the specified authorId does not exist'
            });
        }

        const existingBook = await getBookById(requestedId);
        if (!existingBook) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const updatedBook = await updateBook(requestedId, {
            authorId: trimmedAuthorId,
            title: trimmedTitle,
            publicationDate: trimmedPublicationDate
        });

        return res.status(200).json(updatedBook);
    } catch (error) {
        console.error('PUT /books/:id failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteBookHandler = async (req, res) => {
    const requestedId = req.params.id;

    try {
        const existingBook = await getBookById(requestedId);
        if (!existingBook) {
            return res.status(404).json({ message: 'Book not found' });
        }

        await deleteBook(requestedId);
        return res.status(204).send();
    } catch (error) {
        console.error('DELETE /books/:id failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export {
    getBooksHandler,
    getBookByIdHandler,
    createBookHandler,
    updateBookHandler,
    deleteBookHandler
};
