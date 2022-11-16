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