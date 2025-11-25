# File Manager

A small file storage microservice built with Node.js and Express.  
It provides user registration and authentication, file uploading (file / folder / image), file listing and retrieval, public/private sharing, and background thumbnail generation using Redis + a job queue (Bull/BullMQ). Tests are included (Mocha/Chai).

## What it is

This project implements a RESTful file-management microservice intended for learning / small deployments. It stores metadata in MongoDB and files on disk (configurable folder). For image files, it enqueues background jobs to generate thumbnails of multiple sizes.

## Features

- User registration and auth (token-based)
- Upload files, folders and images
- List files with paging and parent folder support
- Retrieve file metadata and file binary content (with content-type)
- Mark files as public/unpublish
- Background thumbnail generation for images
- Test suite covering controllers and DB utils

## Architecture overview

- Express server exposes REST endpoints (see API section).
- MongoDB stores users and files metadata.
- Redis is used for session/token mapping and as the queue backend.
- Bull/BullMQ (or kue in v0) processes file-related jobs:
  - `fileQueue` generates thumbnails (500, 250, 100)
  - `userQueue` processes user-related background tasks (welcome jobs)
- Files are written to disk in a configured folder (`FOLDER_PATH`) and stored locally with a generated uuid name; thumbnails are saved alongside with `_500`, `_250`, `_100` suffixes.

## Requirements

- Node.js (recommend >= 12, ideally LTS)
- npm or yarn
- MongoDB server
- Redis server
- Image libraries (the project uses `image-thumbnail` or similar)
- Python (optional) for helper scripts (upload script included)

## Environment variables

Create a `.env` or export in your shell. Defaults are shown where available.

- DB_HOST — MongoDB host (default: `localhost`)
- DB_PORT — MongoDB port (default: `27017`)
- DB_DATABASE — MongoDB database (default: `files_manager`)
- REDIS_URL — Redis connection URL (often `redis://127.0.0.1:6379`)
- FOLDER_PATH — Root folder for storing uploaded files (default in code: `/tmp/files_manager` or system tmp)
- PORT — HTTP server port (if supported in project)
- NODE_ENV — `development|test|production` (affects some behaviors)

Note: Some files use `redis://127.0.0.1:6379` directly; set `REDIS_URL` or adjust code if needed.

## Install

1. Clone the repository:
   ```zsh
   git clone https://github.com/psychemist/alx-files_manager.git
   cd alx-files_manager
   ```

2. Install dependencies:
   ```zsh
   npm install
   # or
   yarn install
   ```

3. Ensure MongoDB and Redis are running locally (or point env vars to remote services).

## Run (development)

If the repo has a `package.json` with start script:
```zsh
npm start
```

If not, run the server entry (common names: `server.js`, `routes/index.js`, or a file under `v0/main_files/`):
```zsh
node server.js
# or if `v0` is used:
node v0/main.js
```

Run the worker (if in separate file) to process jobs:
```zsh
node worker.js
# or v0/worker.js depending on the branch/version
```

Tip: set `FOLDER_PATH` for local testing so temp files are easy to find:
```zsh
export FOLDER_PATH=$HOME/tmp/files_manager
mkdir -p $FOLDER_PATH
```

## Testing

The project contains Mocha/Chai tests under `tests/`. Before running tests, ensure MongoDB and Redis are available and `FOLDER_PATH` is set to a safe test folder.

To run tests:
```zsh
npm test
# or
npx mocha
```

Tests require a clean DB and folder. The tests attempt to clean collections before running.

## API reference

Routes are defined in `routes/index.js`. Summary below:

- GET /status
  - Returns { redis: true|false, db: true|false }
- GET /stats
  - Returns counts: { users, files }
- GET /connect
  - Basic auth endpoint to sign in (returns token)
- GET /disconnect
  - Sign out / invalidate token
- POST /users
  - Create a user. body: { email, password } -> returns { id, email }
- GET /users/me
  - Returns user info for the provided token
- GET /files
  - Returns a list of files for current user. Query params: `page`, `parentId`
  - Requires `X-Token` header
- POST /files
  - Upload file/folder/image. body: { name, type: 'file'|'folder'|'image', data (base64), isPublic?, parentId? }
  - Requires `X-Token` header
- GET /files/:id
  - Returns metadata for the file (requires `X-Token`)
- GET /files/:id/data
  - Returns file content (public or owned by requester). Query `size` for image thumbnails.
- PUT /files/:id/publish
  - Mark a file as public (requires `X-Token`)
- PUT /files/:id/unpublish
  - Mark a file as private (requires `X-Token`)

Authorization: Most endpoints require header `X-Token: <token>`. Tokens map to user IDs stored in Redis keyed as `auth_<token>`.

Error responses are JSON: { error: 'Error message' } with proper HTTP status codes (400, 401, 404, 500).

## Example: upload an image (helper)

The repo includes a helper script `image_upload.py` that posts a base64-encoded file:

Usage:
```zsh
python image_upload.py /path/to/pic.png <X-TOKEN> 0
# args: file_path token parentId
```

Equivalent curl (example):
```zsh
curl -X POST http://127.0.0.1:5000/files \
  -H "Content-Type: application/json" \
  -H "X-Token: <token>" \
  -d '{
    "name": "pic.png",
    "type": "image",
    "isPublic": true,
    "data": "<BASE64_DATA>",
    "parentId": 0
  }'
```

(You can generate `<BASE64_DATA>` with `base64` or via Python: `base64.b64encode(open("pic.png","rb").read()).decode()`.)

## Storage & background jobs

- Files are saved to disk in `FOLDER_PATH` (e.g. `/tmp/files_manager`) as a uuid-named file; DB stores the `localPath`.
- When `type === 'image'`, job is enqueued (`fileQueue`) to generate thumbnails: sizes 500, 250, 100. Thumbnails are stored by appending suffixes `_500`, `_250`, `_100` to the `localPath`.
- Queue backend uses Redis (Bull or BullMQ depending on the branch). The worker file(s) are `worker.js` and/or `jobber.js`.

## Suggested next steps / improvements

- Add `package.json` start/test scripts (if missing) and document them.
- Add a Docker Compose file (MongoDB + Redis + Node app) for quicker local setup.
- Add OpenAPI/Swagger docs for the REST API.
- Add proper license file (e.g. MIT) if you want to allow re-use.
- Improve token management with expiry and refresh tokens.
- Add pagination metadata to /files responses (total, page, pageSize).
- Add example Postman collection or Swagger UI.

## Contributing

- Fork the repo, create a branch, and open a PR.
- Run tests and linters before submitting.
- Add tests for new features or bug fixes.
- Suggested small improvements: add Docker Compose to spin up MongoDB + Redis, add more integration tests, and add CI on GitHub Actions.

## License

[MIT](https://opensource.org/license/mit)
