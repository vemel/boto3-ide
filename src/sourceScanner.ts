import { workspace, Uri } from 'vscode'
import * as fs from 'fs'
import ignore from 'ignore'
import * as path from 'path'

const SERVICE_RE = /(boto3|session)\.(client|resource)\(\s*['"]+(\S+)['"]+\s*\)/g

export default class SourceScanner {
  constructor(public workDir: string) { }
  async findPythonFiles(): Promise<string[]> {
    const exclude = [
      ...Object.keys((await workspace.getConfiguration('search', null).get('exclude')) || {}),
      ...Object.keys((await workspace.getConfiguration('files', null).get('exclude')) || {}),
      '**/.venv/**',
      '**/typings/**',
      '**/tests/**'
    ].join(',')
    const files = await workspace.findFiles('**/*.py', `{${exclude}}`)
    const result: string[] = []

    const gitignorePath = path.join(this.workDir, '.gitignore')
    const gitignoreExists = fs.existsSync(gitignorePath)
    const filters = gitignoreExists ? (await this.readFile(gitignorePath)).split(/\r?\n/) : []

    const gitignore = ignore()
    gitignore.add(filters)

    for (const file of files) {
      const relativePath = path.relative(this.workDir, file.fsPath)
      if (filters.length && gitignore.test(relativePath).ignored) {
        console.log(`File ${relativePath} is gitignored`)
        continue
      }
      console.log(`Discovered ${relativePath}`)
      result.push(file.fsPath)
    }
    return result
  }

  async readFile(filePath: string): Promise<string> {
    return new Promise((resolve) => {
      fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
        if (err) {
          console.log(`Error reading ${filePath}: ${err}`)
          resolve('')
          return
        }
        resolve(data)
      })
    })
  }

  async findServices(filePath: string): Promise<Set<string>> {
    const text = await this.readFile(filePath)
    const result: Set<string> = new Set()
    if (!text) {
      return result
    }
    SERVICE_RE.lastIndex = 0
    while (true) {
      const match = SERVICE_RE.exec(text)
      if (!match) {
        break
      }
      const serviceName = match.pop() || ''
      SERVICE_RE.lastIndex = match.index + 1
      result.add(serviceName)
    }
    return result
  }
}
