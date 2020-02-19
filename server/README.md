Il server contiene uno script principale [app.ts](https://github.com/enricomors/radix-bootleg/blob/master/server/src/app.ts) e i file per il salvataggio dei dati sul database mongodb. Si basa sul template [typescript-express-boilerplate](https://github.com/texzhichen/typescript-express-boilerplate), che utilizza TypeScript 2.9, Express 4, and Webpack 4.

- For development, it uses `nodemon` to monitor source file changes.
- For production, it uses `webpack` to bundle source files.

## Installation

- `npm install -g nodemon ts-node typescript`
- `npm install`
- `npm start` for development; `npm run build` for production

The command `npm start` will start a local server running on port 3001.
