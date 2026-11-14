# Books API Week 02 Spec - Version 1

## Feature 1: Book CRUD Operations and Author References

### Goal
Update the existing Week 01 book API so book documents include a reference to an author and the API supports all CRUD operations for books. Every book route must be documented and testable in Swagger.

### Data Model
Book documents will be stored in the `books` collection.

Required book fields:
- `id`: string, required, custom id such as `b1`
- `authorId`: string, required, references the `id` field of an author document
- `title`: string, required
- `publicationDate`: string, required

Books will continue to use custom string ids instead of MongoDB `_id` values for route parameters.

### Relationship to Authors
Each book will identify its author with an `authorId` field. The value of `authorId` must match the custom `id` value of an existing author document.

When creating or updating a book, the API should reject the request with a `400` status code if the submitted `authorId` does not match an existing author.

### Routes

#### GET /books
Purpose: Return all books.

Success:
- Status code: `200`
- Response body: an array of book objects

Errors:
- `500` if an unexpected server or database error occurs

#### GET /books/:id
Purpose: Return one book by its custom id.

Success:
- Status code: `200`
- Response body: the matching book object

Errors:
- `404` if no book exists with that id
- `500` if an unexpected server or database error occurs

#### POST /books
Purpose: Create a new book.

Request body:

    {
      "id": "b4",
      "authorId": "a1",
      "title": "Example Book Title",
      "publicationDate": "2026-01-15"
    }

Success:
- Status code: `201`
- Response body: the newly created book object

Errors:
- `400` if a required field is missing
- `400` if the `id` already exists
- `400` if the `authorId` does not match an existing author
- `500` if an unexpected server or database error occurs

#### PUT /books/:id
Purpose: Update an existing book.

Request body:

    {
      "authorId": "a2",
      "title": "Updated Book Title",
      "publicationDate": "2026-02-20"
    }

Success:
- Status code: `200`
- Response body: the updated book object

Errors:
- `400` if a required field is missing
- `400` if the `authorId` does not match an existing author
- `404` if no book exists with that id
- `500` if an unexpected server or database error occurs

#### DELETE /books/:id
Purpose: Delete an existing book.

Success:
- Status code: `204`
- Response body: none

Errors:
- `404` if no book exists with that id
- `500` if an unexpected server or database error occurs

### Swagger Documentation
Swagger must document every book route.

### Deployment Expectations
After implementation, the book routes must work locally and from the deployed Render application. The deployed Swagger page at `/api-docs` must allow someone to test every book route from the browser.

## Feature 2: Author CRUD Operations

### Goal
Add an `authors` collection to the database and provide full CRUD operations for authors. Every author route must be documented and testable in Swagger.

### Data Model
Author documents will be stored in the `authors` collection.

Required author fields:
- `id`: string, required, custom id such as `a1`
- `name`: string, required
- `birthYear`: number (integer), required

Authors will use custom string ids (such as `a1`, `a2`) instead of MongoDB `_id` values for route parameters and book references.

### Relationship to Books
Books reference authors via the book's `authorId` field matching the author's custom `id` field.

If a client attempts to delete an author who still has one or more books in the `books` collection referencing that author's `id`, the API must reject the deletion with a `400` status code and an explanatory message rather than leaving orphaned book records.

### Routes

#### GET /authors
Purpose: Return all authors.

Success:
- Status code: `200`
- Response body: an array of author objects

Errors:
- `500` if an unexpected server or database error occurs

#### GET /authors/:id
Purpose: Return one author by its custom id.

Success:
- Status code: `200`
- Response body: the matching author object

Errors:
- `404` if no author exists with that id
- `500` if an unexpected server or database error occurs

#### POST /authors
Purpose: Create a new author.

Request body:

    {
      "id": "a1",
      "name": "Brandon Sanderson",
      "birthYear": 1975
    }

Success:
- Status code: `201`
- Response body: the newly created author object

Errors:
- `400` if a required field (`id`, `name`, or `birthYear`) is missing
- `400` if the `id` already exists
- `500` if an unexpected server or database error occurs

#### PUT /authors/:id
Purpose: Update an existing author.

Request body:

    {
      "name": "Brandon Sanderson",
      "birthYear": 1975
    }

Success:
- Status code: `200`
- Response body: the updated author object

Errors:
- `400` if a required field (`name` or `birthYear`) is missing
- `404` if no author exists with that id
- `500` if an unexpected server or database error occurs

#### DELETE /authors/:id
Purpose: Delete an existing author.

Success:
- Status code: `204`
- Response body: none

Errors:
- `400` if the author still has books referencing their `id`
- `404` if no author exists with that id
- `500` if an unexpected server or database error occurs

### Swagger Documentation
Swagger must document every author route.

### Deployment Expectations
After implementation, the author routes must work locally and from the deployed Render application. The deployed Swagger page at `/api-docs` must allow someone to test every author route from the browser.

---

# Specification Evaluation (Review of Version 1)

### 1. Are there any bugs or short-sighted decisions in this specification?
- **Empty or wrong-type fields pass basic presence checks:** Checking only `if (!field)` in JavaScript has a bug for `birthYear: 0` (falsy) and allows whitespace-only strings (`"   "`) or wrong types (e.g., passing an object or array for `title` or a string for `birthYear`).
- **Immutability of `id` on `PUT`:** Version 1 omits what happens if a client includes a different `id` in the `PUT /books/:id` or `PUT /authors/:id` body. The route parameter `:id` must remain the source of truth, and `id` should not be overwritten.
- **Order of checks on `PUT` and `DELETE`:** For `PUT /books/:id`, if both the book `:id` is not found (`404`) and the body is invalid (`400`), or on `DELETE /authors/:id` if the author does not exist (`404`) vs. has books (`400`), the check order must be defined clearly so status codes are predictable.

### 2. Are there any security considerations that are missing?
- **NoSQL operator injection:** If `req.body` or `req.params` values are not validated as primitive strings/numbers, a malicious payload such as `{ "id": { "$ne": null } }` in a JSON body could manipulate MongoDB queries. All input fields must be explicitly type-checked (`typeof value === 'string'` or `Number.isInteger(value)`).
- **Mass assignment / unexpected fields:** Inserting `req.body` directly into MongoDB (`insertOne(req.body)`) allows clients to store arbitrary extra properties in documents. Controllers/models must construct a clean object containing only the allowed schema fields (`id`, `authorId`, `title`, `publicationDate` for books; `id`, `name`, `birthYear` for authors).
- **Internal error leakage:** `500` responses must return a generic `{ "message": "Internal server error" }` instead of raw database or stack trace messages.

### 3. Are there any efficiency concerns with the current endpoint design?
- **Unindexed lookups on custom `id` and `authorId`:** Because routes query by custom `id` (`{ id: bookId }`, `{ id: authorId }`) and check author deletion via `{ authorId: id }`, MongoDB will perform collection scans unless indexes exist on `books.id` (unique), `books.authorId`, and `authors.id` (unique).
- **Checking if an author has books before deletion:** Using `collection.findOne({ authorId })` (or `countDocuments({ authorId }, { limit: 1 })`) is much more efficient than fetching all matching books with `.find({ authorId }).toArray()`.
- **Single-trip updates:** Using `findOneAndUpdate` (with `{ returnDocument: 'after' }`) or updating after validation avoids unnecessary extra queries.

### 4. Are any response examples or error behaviors unclear?
- **Consistent error format:** All error responses (`400`, `404`, `500`) should consistently return a JSON object of the shape `{ "message": "<clear description>" }`.
- **Full response examples:** Success responses for `GET`, `POST`, and `PUT` should specify whether MongoDB's internal `_id` is included or excluded, and show concrete JSON examples for both books and authors.

---

# Books API Week 02 Spec - Version 2

## Feature 1: Book CRUD Operations and Author References (Revised)

### Goal
Update the Week 01 Books API so book documents reference an existing author via `authorId` and support full CRUD operations (`GET`, `POST`, `PUT`, `DELETE`). Every route must validate inputs safely and be documented and testable in Swagger (`/api-docs`).

### Data Model (`books` collection)
Each book document stored in `books` has the following required fields:
- `id`: `string` (required, non-empty trimmed string, unique, e.g., `"b1"`)
- `authorId`: `string` (required, non-empty trimmed string, must match an existing `authors.id`, e.g., `"a1"`)
- `title`: `string` (required, non-empty trimmed string)
- `publicationDate`: `string` (required, non-empty trimmed string, e.g., `"2026-01-15"`)

**Security & Validation Rules:**
1. Only the allowed fields (`id`, `authorId`, `title`, `publicationDate`) are persisted to MongoDB (prevents mass assignment).
2. All fields must be validated as `typeof field === 'string'` and `field.trim().length > 0` (prevents NoSQL injection and blank strings).
3. On `PUT /books/:id`, the book's `id` comes from `req.params.id` and cannot be changed.

### Relationship to Authors
- Before creating (`POST /books`) or updating (`PUT /books/:id`) a book, the server verifies that an author exists in the `authors` collection with `{ id: authorId }`.
- If no matching author exists, the server responds with `400 Bad Request` and `{ "message": "Invalid authorId: author does not exist" }`.

### Routes

#### 1. `GET /books`
- **Purpose:** Retrieve all books.
- **Success (`200 OK`):**
  ```json
  [
    {
      "id": "b1",
      "authorId": "a1",
      "title": "The Way of Kings",
      "publicationDate": "2010-08-31"
    }
  ]
  ```
- **Errors:**
  - `500 Internal Server Error`: `{ "message": "Internal server error" }`

#### 2. `GET /books/:id`
- **Purpose:** Retrieve a single book by its custom `id`.
- **Success (`200 OK`):**
  ```json
  {
    "id": "b1",
    "authorId": "a1",
    "title": "The Way of Kings",
    "publicationDate": "2010-08-31"
  }
  ```
- **Errors:**
  - `404 Not Found`: `{ "message": "Book not found" }` (if no book matches `:id`)
  - `500 Internal Server Error`: `{ "message": "Internal server error" }`

#### 3. `POST /books`
- **Purpose:** Create a new book.
- **Request Body:**
  ```json
  {
    "id": "b4",
    "authorId": "a1",
    "title": "Example Book Title",
    "publicationDate": "2026-01-15"
  }
  ```
- **Validation Order & Errors:**
  1. Validate that `id`, `authorId`, `title`, and `publicationDate` are present and non-empty strings -> otherwise return `400 Bad Request`: `{ "message": "All fields (id, authorId, title, publicationDate) are required and must be non-empty strings" }`.
  2. Check if a book with `id` already exists -> if so, return `400 Bad Request`: `{ "message": "Book with this id already exists" }`.
  3. Check if an author with `id: authorId` exists -> if not, return `400 Bad Request`: `{ "message": "Author with the specified authorId does not exist" }`.
- **Success (`201 Created`):** Returns the newly created book object.
- **Server Error (`500`):** `{ "message": "Internal server error" }`

#### 4. `PUT /books/:id`
- **Purpose:** Update an existing book by its custom `id`.
- **Request Body:**
  ```json
  {
    "authorId": "a2",
    "title": "Updated Book Title",
    "publicationDate": "2026-02-20"
  }
  ```
- **Validation Order & Errors:**
  1. Validate that `authorId`, `title`, and `publicationDate` are present and non-empty strings -> otherwise return `400 Bad Request`: `{ "message": "Fields authorId, title, and publicationDate are required and must be non-empty strings" }`.
  2. Check if an author with `id: authorId` exists -> if not, return `400 Bad Request`: `{ "message": "Author with the specified authorId does not exist" }`.
  3. Check if the book with `req.params.id` exists and update it -> if not found, return `404 Not Found`: `{ "message": "Book not found" }`.
- **Success (`200 OK`):** Returns the updated book object.
- **Server Error (`500`):** `{ "message": "Internal server error" }`

#### 5. `DELETE /books/:id`
- **Purpose:** Delete an existing book by its custom `id`.
- **Success (`204 No Content`):** Empty response body.
- **Errors:**
  - `404 Not Found`: `{ "message": "Book not found" }` (if `deletedCount === 0`)
  - `500 Internal Server Error`: `{ "message": "Internal server error" }`

---

## Feature 2: Author CRUD Operations (Revised)

### Goal
Add an `authors` collection and provide full CRUD operations (`GET`, `POST`, `PUT`, `DELETE`) with referential integrity protection so authors with existing books cannot be deleted. Document all author routes in Swagger (`/api-docs`).

### Data Model (`authors` collection)
Each author document stored in `authors` has the following required fields:
- `id`: `string` (required, non-empty trimmed string, unique, e.g., `"a1"`)
- `name`: `string` (required, non-empty trimmed string, e.g., `"Brandon Sanderson"`)
- `birthYear`: `number` (required, integer, e.g., `1975`)

**Security & Validation Rules:**
1. Only the allowed fields (`id`, `name`, `birthYear`) are persisted to MongoDB (prevents mass assignment).
2. `id` and `name` must be validated as `typeof value === 'string'` and `value.trim().length > 0`.
3. `birthYear` must be validated using `Number.isInteger(birthYear)` (correctly handles `0` and rejects strings, `NaN`, `null`, or objects).
4. On `PUT /authors/:id`, the author's `id` comes from `req.params.id` and cannot be changed.

### Relationship to Books (Referential Integrity on Delete)
- Before deleting an author in `DELETE /authors/:id`, the API checks if any book document in `books` has `{ authorId: req.params.id }` using a single-document lookup (`findOne({ authorId: id })`).
- If at least one book references the author, the API rejects the deletion with `400 Bad Request` and `{ "message": "Cannot delete author with existing books" }`.

### Routes

#### 1. `GET /authors`
- **Purpose:** Retrieve all authors.
- **Success (`200 OK`):**
  ```json
  [
    {
      "id": "a1",
      "name": "Brandon Sanderson",
      "birthYear": 1975
    }
  ]
  ```
- **Errors:**
  - `500 Internal Server Error`: `{ "message": "Internal server error" }`

#### 2. `GET /authors/:id`
- **Purpose:** Retrieve a single author by its custom `id`.
- **Success (`200 OK`):**
  ```json
  {
    "id": "a1",
    "name": "Brandon Sanderson",
    "birthYear": 1975
  }
  ```
- **Errors:**
  - `404 Not Found`: `{ "message": "Author not found" }`
  - `500 Internal Server Error`: `{ "message": "Internal server error" }`

#### 3. `POST /authors`
- **Purpose:** Create a new author.
- **Request Body:**
  ```json
  {
    "id": "a1",
    "name": "Brandon Sanderson",
    "birthYear": 1975
  }
  ```
- **Validation Order & Errors:**
  1. Validate that `id` and `name` are non-empty strings and `birthYear` is an integer -> otherwise return `400 Bad Request`: `{ "message": "Fields id (string), name (string), and birthYear (integer) are required" }`.
  2. Check if an author with `id` already exists -> if so, return `400 Bad Request`: `{ "message": "Author with this id already exists" }`.
- **Success (`201 Created`):** Returns the newly created author object.
- **Server Error (`500`):** `{ "message": "Internal server error" }`

#### 4. `PUT /authors/:id`
- **Purpose:** Update an existing author by its custom `id`.
- **Request Body:**
  ```json
  {
    "name": "Brandon Sanderson",
    "birthYear": 1975
  }
  ```
- **Validation Order & Errors:**
  1. Validate that `name` is a non-empty string and `birthYear` is an integer -> otherwise return `400 Bad Request`: `{ "message": "Fields name (string) and birthYear (integer) are required" }`.
  2. Check if the author with `req.params.id` exists and update it -> if not found, return `404 Not Found`: `{ "message": "Author not found" }`.
- **Success (`200 OK`):** Returns the updated author object.
- **Server Error (`500`):** `{ "message": "Internal server error" }`

#### 5. `DELETE /authors/:id`
- **Purpose:** Delete an existing author by its custom `id`.
- **Validation Order & Errors:**
  1. Check if the author with `req.params.id` exists -> if not found, return `404 Not Found`: `{ "message": "Author not found" }`.
  2. Check if any book in `books` has `authorId: req.params.id` -> if so, return `400 Bad Request`: `{ "message": "Cannot delete author with existing books" }`.
  3. Delete the author document.
- **Success (`204 No Content`):** Empty response body.
- **Server Error (`500`):** `{ "message": "Internal server error" }`

### Swagger & Deployment Checklist
- [ ] All 5 `/books` routes documented in Swagger (`GET /books`, `GET /books/{id}`, `POST /books`, `PUT /books/{id}`, `DELETE /books/{id}`).
- [ ] All 5 `/authors` routes documented in Swagger (`GET /authors`, `GET /authors/{id}`, `POST /authors`, `PUT /authors/{id}`, `DELETE /authors/{id}`).
- [ ] `swagger.json` regenerated via `npm run swagger`.
- [ ] All routes testable locally and on Render at `/api-docs`.
