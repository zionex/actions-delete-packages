import * as core from '@actions/core';
import {Octokit} from '@octokit/rest';

type PackageType = 'maven' | 'npm' | 'rubygems' | 'docker' | 'nuget' | 'container';

(async (): Promise<void> => {
  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    const packageName: string = core.getInput('package-name');
    const packageVersion: string = core.getInput('package-version');
    const packageTypeStr: string = core.getInput('package-type');
    const packageType: PackageType = packageTypeStr as PackageType;

    let owner: string = core.getInput('owner');
    if (!owner) {
      const repoInfo: string[] = process.env.GITHUB_REPOSITORY!.split('/');
      owner = repoInfo[0];
    }

    const pkgNames: string[] = packageName.split(',');
    for (const pkgName of pkgNames) {
      await octokit.packages.getAllPackageVersionsForPackageOwnedByOrg({
        package_type: packageType,
        package_name: pkgName,
        org: owner
      }).then(async ({ data }) => {
        const targetPackages = data.filter(p => p.name === packageVersion);

        for (const targetPackage of targetPackages) {
          console.log(`Deleting package... (version: "${targetPackage.name}", url: "${targetPackage.url})"`);

          await octokit.packages.deletePackageVersionForOrg({
            package_type: packageType,
            package_name: pkgName,
            org: owner,
            package_version_id: targetPackage.id
          });
        }
      })
    }
  } catch (err: any) {
    core.setFailed(err.message);
  }
})();
