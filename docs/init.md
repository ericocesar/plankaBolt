# init
npm start

# init config
npm install
cp server/.env.sample server/.env
# init db (também executado automaticamente por `npm start`)
npm run server:db:init

DATABASE_URL=postgresql://app:app@localhost:5432/planka
cp server/.env.sample server/.env
