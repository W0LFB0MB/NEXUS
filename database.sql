CREATE TABLE IF NOT EXISTS options (
	option text NOT NULL,
	value text,
	CONSTRAINT options_pkey PRIMARY KEY (option)
);

CREATE TABLE IF NOT EXISTS users (
	id TEXT NOT NULL PRIMARY KEY,
	premium BOOLEAN NOT NULL DEFAULT FALSE,
	songs_played integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS guilds (
	id TEXT NOT NULL PRIMARY KEY,
	premium BOOLEAN NOT NULL DEFAULT FALSE,
	track_location TEXT,
	track_type SMALLINT,
	queue TEXT,
	track_loop SMALLINT DEFAULT 0,
	channel_id TEXT,
	track_start TEXT,
	track_pause TEXT
);

CREATE TABLE IF NOT EXISTS song_plays (
	user_id TEXT,
	song_location TEXT,
	count INTEGER NOT NULL DEFAULT 1,
	CONSTRAINT uid_sloc_pkey PRIMARY KEY (user_id, song_location),
	CONSTRAINT user_id FOREIGN KEY (user_id),
    REFERENCES users(id),
    ON UPDATE CASCADE,
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS permission_groups (
	id integer NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY (INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1),
	name text NOT NULL,
	permissions bigint NOT NULL DEFAULT 0,
	description text
)