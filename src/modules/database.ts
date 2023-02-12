import pg from 'pg';

const {
	POSTGRES_DB,
	POSTGRES_HOST,
	POSTGRES_PORT,
	POSTGRES_USER,
	POSTGRES_PASSWORD,
	POSTGRES_CONNECTIONSTRING,
	POSTGRES_MAXCONNECTIONS
} = process.env;

export default class Database {
	public static pool: pg.Pool;
	public static connectionConfig: pg.PoolConfig;

	static {
		const maxConnections = parseInt(POSTGRES_MAXCONNECTIONS ?? '10');

		if (POSTGRES_CONNECTIONSTRING) {
			this.connectionConfig = {
				connectionString: POSTGRES_CONNECTIONSTRING,
				max: maxConnections,
				application_name: 'NEXUS BOT'
			};
		} else {
			this.connectionConfig = {
				user: POSTGRES_USER,
				host: POSTGRES_HOST,
				database: POSTGRES_DB,
				password: POSTGRES_PASSWORD,
				port: parseInt(POSTGRES_PORT ?? '5432'),
				max: maxConnections,
				application_name: 'NEXUS BOT'
			};
		}

		this.pool = new pg.Pool(this.connectionConfig);

		this.pool.on('error', (err: Error) => {
			console.error('Unexpected error on idle client', err);
			process.exit(-1);
		});
	}
}