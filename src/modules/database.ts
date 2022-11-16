import pkg from 'pg';
const { Pool } = pkg;

const {
	POSTGRES_DB,
	POSTGRES_HOST,
	POSTGRES_PORT,
	POSTGRES_USER,
	POSTGRES_PASSWORD,
	DATABASE_URL,
	DATABASE_MAXCONNECTIONS
} = process.env;

let client: pkg.Pool;

if (DATABASE_URL) {
	client = new Pool({
		connectionString: DATABASE_URL,
		ssl: {
			rejectUnauthorized: false,
		},
		max: parseInt(DATABASE_MAXCONNECTIONS ?? '10')
	});
} else {
	client = new Pool({
		user: POSTGRES_USER,
		host: POSTGRES_HOST,
		database: POSTGRES_DB,
		password: POSTGRES_PASSWORD,
		port: parseInt(POSTGRES_PORT ?? '5432'),
		max: parseInt(DATABASE_MAXCONNECTIONS ?? '10')
	});
}

client.on('error', (err) => {
	console.error('Unexpected error on idle client', err);
	process.exit(-1);
});

export default client;