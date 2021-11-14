import { BaseInstaller } from './base';


export default class PipInstaller extends BaseInstaller {
    async installPackage(name: string, version: string, extras: string[], dev: boolean): Promise<void> {
        const packageName = this.buildPackageName(name, extras);
        const versionConstraint = version ? this.buildVersionConstraint(version) : '';
        await this.exec(`${this.pythonPath} -m pip install -U "${packageName}${versionConstraint}"`);
    }

    async removePackage(name: string, dev: boolean): Promise<void> {
        await this.exec(`${this.pythonPath} -m pip uninstall -y ${name}`);
    }
}
