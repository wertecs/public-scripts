import { readFileSync, existsSync } from 'fs';

const INFECTED_PACKAGES = await fetch('https://raw.githubusercontent.com/wertecs/public-scripts/refs/heads/master/shai-hulud/packages.json').then(r => r.json());

function getInstalledPackagesFromYarn(lockFile) {
	try {
		const yarnLockContent = readFileSync(lockFile, 'utf8');
		const packages = new Map();

		const lines = yarnLockContent.split('\n');
		let currentPackage = null;

		for (let i = 0; i < lines.length; i += 1) {
			const line = lines[i].trim();

			const [, packageName] = line.match(/^"(@?[^@]+)@npm:([^"]+)":$/) || [];
			if (packageName) {
				currentPackage = packageName;
				continue;
			}

			if (currentPackage && line.startsWith('version: ')) {
				const versionMatch = line.match(/version: (.+)/);
				if (versionMatch) {
					const version = versionMatch[1];
					if (!packages.has(currentPackage)) {
						packages.set(currentPackage, new Set());
					}
					packages.get(currentPackage).add(version);
					currentPackage = null;
				}
			}
		}

		return packages;
	} catch (error) {
		console.error('❌ Error reading yarn.lock:', error.message);
		throw error;
	}
}

function getInstalledPackagesFromNpm(lockFile) {
	try {
		const lockContent = JSON.parse(readFileSync(lockFile, 'utf8'));
		const packages = new Map();

		if (lockContent.packages) {
			for (const [path, info] of Object.entries(lockContent.packages)) {
				if (!info.version) {
					continue;
				}

				let packageName = info.name;

				if (!packageName) {
					if (path.startsWith('node_modules/')) {
						const pathParts = path.split('/');
						if (pathParts[1]?.startsWith('@')) {
							packageName = `${pathParts[1]}/${pathParts[2]}`;
						} else {
							const [, pkgName] = pathParts;
							packageName = pkgName;
						}
					}
				}

				if (packageName) {
					if (!packages.has(packageName)) {
						packages.set(packageName, new Set());
					}
					packages.get(packageName).add(info.version);
				}
			}
		} else if (lockContent.dependencies) {
			function extractDeps(deps) {
				for (const [name, info] of Object.entries(deps)) {
					if (info.version) {
						if (!packages.has(name)) {
							packages.set(name, new Set());
						}
						packages.get(name).add(info.version);
					}
					if (info.dependencies) {
						extractDeps(info.dependencies);
					}
				}
			}
			extractDeps(lockContent.dependencies);
		}

		return packages;
	} catch (error) {
		console.error('❌ Error reading package-lock.json:', error.message);
		throw error;
	}
}

function checkForInfectedPackages(packages) {
	const infectedFound = [];

	for (const [packageName, versions] of packages) {
		if (INFECTED_PACKAGES[packageName]) {
			const infectedVersions = INFECTED_PACKAGES[packageName];
			const installedVersions = Array.from(versions);

			for (const installedVersion of installedVersions) {
				if (infectedVersions.includes(installedVersion)) {
					infectedFound.push({
						package: packageName,
						version: installedVersion,
						infectedVersions,
					});
				}
			}
		}
	}

	return infectedFound;
}

function main() {
	// Check what lock files exist in current directory
	const lockFiles = [
		{ file: 'package-lock.json', type: 'npm' },
		{ file: 'yarn.lock', type: 'yarn' },
		{ file: 'pnpm-lock.yaml', type: 'pnpm' }
	].filter(lock => existsSync(lock.file));

	if (lockFiles.length === 0) {
		console.log('⚠️  No lock files found in current directory');
		return;
	}

	let totalInfected = 0;
	let totalPackageVersions = 0;

	for (const lockFile of lockFiles) {
		console.log(`\n🔍 Checking ${lockFile.file} (${lockFile.type})...`);

		try {
			let packages;

			if (lockFile.type === 'yarn') {
				packages = getInstalledPackagesFromYarn(lockFile.file);
			} else if (lockFile.type === 'npm') {
				packages = getInstalledPackagesFromNpm(lockFile.file);
			} else {
				console.log(`⚠️  Unsupported lock file type: ${lockFile.type}`);
				continue;
			}

			const packageVersionCount = Array.from(packages.values()).reduce(
				(total, versions) => total + versions.size,
				0,
			);

			console.log(`📦 Found ${packages.size} unique packages (${packageVersionCount} total package-version combinations)`);

			const infected = checkForInfectedPackages(packages);

			if (infected.length > 0) {
				console.log(`🚨 INFECTED PACKAGES:`);
				infected.forEach(({ package: pkg, version, infectedVersions }) => {
					console.log(`❌ ${pkg}@${version}`);
					console.log(`   Infected versions: ${infectedVersions.join(', ')}`);
				});
				totalInfected += infected.length;
			} else {
				console.log(`✅ Clean`);
			}

			totalPackageVersions += packageVersionCount;
		} catch (error) {
			console.log(`⚠️  Could not check ${lockFile.file}: ${error.message}`);
		}
	}

	if (lockFiles.length > 0) {
		console.log('\n📊 Summary:');
		console.log(`   - Total package-version combinations checked: ${totalPackageVersions}`);
		console.log(`   - Total infected packages found: ${totalInfected}`);
	}
}

main();
