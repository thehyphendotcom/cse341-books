# Books and Authors API Week 02 Spec - Version 2

## Feature 1: Book CRUD Operations and Author References

### Goal
Update the existing Week 01 book API so book documents include a reference to an author (`authorId`) and the API supports all CRUD operations for books. Every book route must be documented and testable in Swagger at `/api-docs`.

### Data Model
Book documents are stored in the `books` collection inside `cse341-books-db`.

Required book fields:
- `id`: string, required, non-empty custom id such as `b1`
- `authorId`: string, required, references the custom `id` field of an existing author document in `authors`
- `title`: string, required, non-empty
- `publicationDate`: string, required, ISO 8601 date format (for example, `2026-01-15`)

Books continue to use custom string ids instead of MongoDB `_id` values for route parameters.

### Relationship to Authors
Each book identifies its author with an `authorId` field. The value of `authorId` must match the custom `id` value of an existing document in the `authors` collection.

When creating or updating a book, the API rejects the request with a `400` status code if the submitted `authorId` does not match an existing author.

### Routes

#### GET /books
Purpose: Return all books.
- Success: `200` with a JSON array of book objects.
- Errors: `500` with `{ "message": "Internal server error" }` if an unexpected server or database error occurs.

#### GET /books/:id
Purpose: Return one book by its custom id.
- Success: `200` with the matching book object.
- Errors:
  - `404` with `{ "message": "Book not found" }` if no book exists with that id.
  - `500` with `{ "message": "Internal server error" }` if an unexpected server or database error occurs.

#### POST /books
Purpose: Create a new book.
- Request body:
```json
{
  "id": "b4",
  "authorId": "a1",
  "title": "Example Book Title",
  "publicationDate": "2026-01-15"
}
```
- Success: `201` with the newly created book object.
- Errors:
  - `400` if a required field is missing or invalid.
  - `400` if the `id` already exists.
  - `400` if `authorId` does not match an existing author.
  - `500` with `{ "message": "Internal server error" }` on unexpected failures.

#### PUT /books/:id
Purpose: Update an existing book.
- Request body:
```json
{
  "authorId": "a2",
  "title": "Updated Book Title",
  "publicationDate": "2026-02-20"
}
```
- Success: `200` with the updated book object.
- Errors:
  - `400` if a required field is missing or invalid.
  - `400` if `authorId` does not match an existing author.
  - `404` if no book exists with that id.
  - `500` with `{ "message": "Internal server error" }` on unexpected failures.

#### DELETE /books/:id
Purpose: Delete an existing book.
- Success: `204` with no response body.
- Errors:
  - `404` if no book exists with that id.
  - `500` with `{ "message": "Internal server error" }` on unexpected failures.

---

## Feature 2: Author CRUD Operations

### Goal
Create an `authors` collection in MongoDB and provide full CRUD operations for authors, protecting referential integrity when books reference an author. Every author route must be documented and testable in Swagger at `/api-docs`.

### Data Model
Author documents are stored in the `authors` collection inside `cse341-books-db`.

Required author fields:
- `id`: string, required, non-empty custom id such as `a1`
- `name`: string, required, non-empty
- `birthYear`: number, required (integer year such as `1984`)

Authors use custom string ids instead of MongoDB `_id` values for route parameters.

### Relationship to Books
Books reference authors via `books.authorId -> authors.id`.

If a client attempts to delete an author who is still referenced by one or more books, the API blocks the deletion and returns `409 Conflict` with `{ "message": "Author cannot be deleted because they still have books." }`.

### Routes

#### GET /authors
Purpose: Return all authors.
- Success: `200` with a JSON array of author objects.
- Errors: `500` with `{ "message": "Unable to retrieve authors." }` on unexpected failures.

#### GET /authors/:id
Purpose: Return one author by custom id.
- Success: `200` with the matching author object.
- Errors:
  - `404` with `{ "message": "Author not found." }` if no author exists with that id.
  - `500` with `{ "message": "Unable to retrieve author." }` on unexpected failures.

#### POST /authors
Purpose: Create a new author.
- Request body:
```json
{
  "id": "a4",
  "name": "Example Author",
  "birthYear": 1980
}
```
- Success: `201` with the newly created author object.
- Errors:
  - `400` if a required field is missing or invalid (for example, non-numeric `birthYear`).
  - `400` if the `id` already exists.
  - `500` with `{ "message": "Unable to create author." }` on unexpected failures.

#### PUT /authors/:id
Purpose: Update an existing author.
- Request body:
```json
{
  "name": "Updated Author",
  "birthYear": 1981
}
```
- Success: `200` with the updated author object.
- Errors:
  - `400` if a required field is missing or invalid.
  - `404` with `{ "message": "Author not found." }` if no author exists with that id.
  - `500` with `{ "message": "Unable to update author." }` on unexpected failures.

#### DELETE /authors/:id
Purpose: Delete an existing author.
- Success: `204` with no response body.
- Errors:
  - `404` with `{ "message": "Author not found." }` if no author exists with that id.
  - `409` with `{ "message": "Author cannot be deleted because they still have books." }` if any book still references this author.
  - `500` with `{ "message": "Unable to delete author." }` on unexpected failures.

### Security and Error Handling Notes
- Only explicitly allowlisted fields (`id`, `authorId`, `title`, `publicationDate` for books; `id`, `name`, `birthYear` for authors) are written to MongoDB to prevent unexpected field injection.
- Never return raw MongoDB errors or stack traces to clients.
- Use environment variables for database credentials and connection settings.

### Swagger Documentation and Deployment Expectations
- All book and author routes are documented using `@openapi` OpenAPI 3 comments in `src/router.js` and compiled into `swagger.json` via `npm run swagger`.
- `swagger.json` is committed so Render can serve `/api-docs` using `swagger-ui-express` without requiring `swagger-jsdoc` in production.
- Every route must work and be testable from `/api-docs` both locally and on Render.
