interface Permission {
	name: string,
	description: string
}

interface Role {
	name: string,
	description: string,
	permissions: Array<string>
}

const permissionLayout = [
	{
		name: 'BUSER',
		permissions: [
			{name: 'administrator', position: 1},
			{name: 'test', position: 2},
			{name: 'test2', position: 4},
		]
	},
	{
		name: 'SUSER',
		permissions: [
			{name: 'administrator', position: 1},
			{name: 'blacklist', position: 2},
		]
	},
];

// class Permission {
// 	name: string;
// 	flag: PermissionFlag;

// 	constructor(name: string, flag: PermissionFlag) {
// 		this.name = name;
// 		this.flag = flag;
// 	}

// 	public static fromFlag(flag: PermissionFlag): Permission {
// 		switch (flag) {
// 		case PermissionFlag.ALL:
// 			return new Permission('All', PermissionFlag.ALL);
// 		case PermissionFlag.BAN_USER:
// 			return new Permission('BAN USER', PermissionFlag.BAN_USER);
// 		case PermissionFlag.NONE:
// 		default:
// 			return new Permission('NONE', PermissionFlag.NONE);
// 		}
// 	}
// }

export enum PermissionFlag {
	NONE = 0,            // 0000
	ALL = ~(~0 << 14),    // 1111
	BAN_USER = 1 << 0,   // 0001
	BOT_PERSIST = 1 << 2, // 0010
	BAN_SERVER = 1 << 3,
	PROMOTE_USER = 1 << 4,
	DEMOTE_USER = 1 << 5,
	KILL_BOT_PROCESS = 1 << 6,
	GRANT_PERMISSION = 1 << 7,
	REVOKE_PERMISSION = 1 << 8,
	CREATE_ROLE = 1 << 9,
	DELETE_ROLE = 1 << 10,
	GRANT_ROLE_PERMISSIONS = 1 << 11,
	REVOKE_ROLE_PERMISSIONS = 1 << 12,
	GRANT_USER_ROLE = 1 << 13,
	REVOKE_USER_ROLE = 1 << 14,
	PARDON_USER = 1 << 15,
	PARDON_SERVER = 1 << 16,
}



const Permissions: Array<Permission> = [
	// DANGEROUS PERMISSIONS
	{ name: 'ROLE_CREATE', description: 'Create user roles' },
	{ name: 'ROLE_DELETE', description: 'Delete user roles' },
	{ name: 'ROLE_MODIFY', description: 'Modify role details' },
	{ name: 'ROLE_USER_ADD', description: 'Assign roles to users' },
	{ name: 'ROLE_USER_REMOVE', description: 'Remove roles from users' },
	{ name: 'ROLE_PERMISSION_ADD', description: 'Add permissions to roles' },
	{ name: 'ROLE_PERMISSION_REMOVE', description: 'Remove permissions from roles' },

	{ name: 'BLACKLIST_ENABLE', description: 'Enable blacklist' },
	{ name: 'BLACKLIST_DISABLE', description: 'Disable blacklist' },
	{ name: 'BLACKLIST_USER_ADD', description: 'Add users to blacklist' },
	{ name: 'BLACKLIST_USER_REMOVE', description: 'Remove users from blacklist' },

	// SAFE PERMISSIONS
	{ name: 'COMMAND_PLAY', description: 'Usage of the play command' },
	{ name: 'COMMAND_LOOP', description: 'Usage of the loop command' },
	{ name: 'COMMAND_LOOPQUEUE', description: 'Usage of the loop queue command' },
];

const Roles: Array<Role> = [
	{ name: 'Administrator', description: 'Bot Administrator', permissions: Permissions.map(({ name }) => name) },
	{ name: 'User', description: 'User', permissions: ['COMMAND_PLAY_ALLOW'] }
]; // default roles

export default class permissions {
	private static readonly userDivider = 'BUSER';
	private static readonly serverUserDivider = 'SUSER';

	public globalAdmin = false;

	public serverAdmin = false;
	public canBlacklist = false;

	public static fromBuffer(permissionsBuffer: Buffer): permissions {

		permissionLayout.forEach((section) => {
			if (permissionsBuffer.toString('ascii', 0, section.name.length) !== section.name) {
				return;
			}

			const permStart = section.name.length+1;
			const permLength = permissionsBuffer.readUIntBE(section.name.length, 1);

			const perms = permissionsBuffer.readUIntBE(permStart, permLength);

			console.log(perms);


			for (let pointer = 0; pointer < perms.toString().length; pointer++) {
				console.log(section.permissions[pointer].name + ' is ' + (perms & section.permissions[pointer].position));
			}
		});

		return new permissions();
		// if (permissionsBuffer.toString('ascii', 0, 6) !== this.userDivider) {
		// 	return new Permissions();
		// }

		// const udLen = permissionsBuffer.readIntLE(6, 10);

		// if (permissionsBuffer.toString('ascii', udLen, udLen+5) !== this.serverUserDivider) {
		// 	return new Permissions();
		// }

		// const sudLen = permissionsBuffer.readIntLE(udLen+5, udLen+5+4);
	}
}