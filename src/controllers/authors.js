import {
    getAllAuthors as getAllAuthorsFromDb,
    getAuthorById as getAuthorByIdFromDb,
    createAuthor as createAuthorFromDb,
    updateAuthor as updateAuthorFromDb,
    deleteAuthor as deleteAuthorFromDb,
    authorHasBooks
} from '../models/authors.js';

const getAllAuthors = async (req, res) => {
    try {
        const authors = await getAllAuthorsFromDb();
        return res.status(200).json(authors);
    } catch (error) {
        console.error('GET /authors failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const getAuthorById = async (req, res) => {
    try {
        const { id } = req.params;
        const author = await getAuthorByIdFromDb(id);

        if (!author) {
            return res.status(404).json({ message: 'Author not found' });
        }

        return res.status(200).json(author);
    } catch (error) {
        console.error('GET /authors/:id failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const createAuthor = async (req, res) => {
    try {
        const { id, name, birthYear } = req.body || {};

        if (
            typeof id !== 'string' ||
            id.trim().length === 0 ||
            typeof name !== 'string' ||
            name.trim().length === 0 ||
            !Number.isInteger(birthYear)
        ) {
            return res.status(400).json({
                message: 'Fields id (string), name (string), and birthYear (integer) are required'
            });
        }

        const trimmedId = id.trim();
        const trimmedName = name.trim();

        const existingAuthor = await getAuthorByIdFromDb(trimmedId);
        if (existingAuthor) {
            return res.status(400).json({ message: 'Author with this id already exists' });
        }

        const createdAuthor = await createAuthorFromDb({
            id: trimmedId,
            name: trimmedName,
            birthYear
        });

        return res.status(201).json(createdAuthor);
    } catch (error) {
        console.error('POST /authors failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const updateAuthor = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, birthYear } = req.body || {};

        if (
            typeof name !== 'string' ||
            name.trim().length === 0 ||
            !Number.isInteger(birthYear)
        ) {
            return res.status(400).json({
                message: 'Fields name (string) and birthYear (integer) are required'
            });
        }

        const existingAuthor = await getAuthorByIdFromDb(id);
        if (!existingAuthor) {
            return res.status(404).json({ message: 'Author not found' });
        }

        const updatedAuthor = await updateAuthorFromDb(id, {
            name: name.trim(),
            birthYear
        });

        return res.status(200).json(updatedAuthor);
    } catch (error) {
        console.error('PUT /authors/:id failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteAuthor = async (req, res) => {
    try {
        const { id } = req.params;

        const existingAuthor = await getAuthorByIdFromDb(id);
        if (!existingAuthor) {
            return res.status(404).json({ message: 'Author not found' });
        }

        if (await authorHasBooks(id)) {
            return res.status(400).json({
                message: 'Cannot delete author with existing books'
            });
        }

        await deleteAuthorFromDb(id);
        return res.status(204).send();
    } catch (error) {
        console.error('DELETE /authors/:id failed:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export {
    getAllAuthors,
    getAuthorById,
    createAuthor,
    updateAuthor,
    deleteAuthor
};
