import { readFileSync } from 'fs';

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
				// eslint-disable-next-line no-continue
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
		console.error('âŒ Error reading yarn.lock:', error.message);
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
					// eslint-disable-next-line no-continue
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
		console.error('âŒ Error reading package-lock.json:', error.message);
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

function checkMultipleProjects() {
	const projects = [
		{ name: 'main', lockFile: 'yarn.lock', type: 'yarn' },
		{ name: 'aws', lockFile: 'aws/package-lock.json', type: 'npm' },
	];

	let totalInfected = 0;
	let totalPackageVersions = 0;

	for (const project of projects) {
		console.log(`\nðŸ” Checking ${project.name} project (${project.type})...`);
		try {
			const packages =
				project.type === 'yarn'
					? getInstalledPackagesFromYarn(project.lockFile)
					: getInstalledPackagesFromNpm(project.lockFile);

			const packageVersionCount = Array.from(packages.values()).reduce(
				(total, versions) => total + versions.size,
				0,
			);

			console.log(
				`ðŸ“¦ Found ${packages.size} unique packages (${packageVersionCount} total package-version combinations)`,
			);

			const infected = checkForInfectedPackages(packages);

			if (infected.length > 0) {
				console.log(`ðŸš¨ INFECTED PACKAGES in ${project.name}:`);
				infected.forEach(({ package: pkg, version, infectedVersions }) => {
					console.log(`âŒ ${pkg}@${version}`);
					console.log(`   Infected versions: ${infectedVersions.join(', ')}`);
				});
				totalInfected += infected.length;
			} else {
				console.log(`âœ… ${project.name} is clean`);
			}

			totalPackageVersions += packageVersionCount;
		} catch (error) {
			console.log(`âš ï¸  Could not check ${project.name}: ${error.message}`);
		}
	}

	console.log('\nðŸ“Š Summary:');
	console.log(`   - Total package-version combinations checked: ${totalPackageVersions}`);
	console.log(`   - Total infected packages found: ${totalInfected}`);
	console.log(`   - Known infected packages: ${Object.keys(INFECTED_PACKAGES).length}`);
}

function main() {
	console.log('ðŸ” Checking for infected packages across all projects...\n');
	checkMultipleProjects();
}

main();
