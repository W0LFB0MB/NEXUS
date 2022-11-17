/* eslint-disable @typescript-eslint/no-var-requires */
// import sys from 'sys';
import { exec } from 'child_process';
import os from 'os';

// Run command depending on the OS
if (os.type() === 'Linux' || os.type() === 'Darwin') 
	exec('rm -rf build'); 
else if (os.type() === 'Windows_NT') 
	exec('rmdir build /s /q');
else
	throw new Error('Unsupported OS found: ' + os.type());