#quickstart

copy env-config.example.ts to env-config.ts
add your api key to env-config.ts

run:
npm install
npm run build-database
npm start
open http://localhost:8080


#export prod version
npm run build
copy ./database to ./dist/database


Based on the awesome [TGXLoader](https://github.com/lowlines/three-tgx-loader) by [lowlines](https://github.com/lowlines)
