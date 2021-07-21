#!/usr/bin/env node

import { cwd } from 'node:process'
import { resolve as resolvePath } from 'node:path'

import sade from 'sade'
import { totalist } from 'totalist'

import { exec } from '../runner/runner.js'

type CLIOptions = {
  cwd: string
  dir: string | string[]
  pattern: string | string[]
  ignore: string | string[]
}

const toRegExp = (input: string) => new RegExp(input, 'i')

const defaults = {
  dir: '.',
  patternWithDir: [/\.m?js$/i],
  patternWithoutDir: [/(^(tests?|__tests?__)[\\/].+|[-.](test|spec)?)\.js$/i],
  ignoredPaths: [/node_modules/i],
}

const getDir = (dir: string | string[] = defaults.dir) => {
  if (Array.isArray(dir)) {
    return dir
  }

  return [dir]
}

const getPattern = (pattern: string | string[], dir?: string | string[]) => {
  if (pattern === undefined) {
    if (dir === undefined) {
      return defaults.patternWithoutDir
    }

    return defaults.patternWithDir
  }

  if (Array.isArray(pattern)) {
    return pattern.map((p) => toRegExp(p))
  }

  return [toRegExp(pattern)]
}

const getIgnored = (ignored: string | string[]) => {
  if (ignored === undefined) {
    return defaults.ignoredPaths
  }

  if (Array.isArray(ignored)) {
    return [...defaults.ignoredPaths, ...ignored.map((i) => toRegExp(i))]
  }

  return [...defaults.ignoredPaths, toRegExp(ignored)]
}

sade('test-please', true)
  .option(
    '-C, --cwd',
    'The location from which lookups should be resolved',
    cwd()
  )
  .option('-d, --dir', "The test files' location")
  .option(
    '-p, --pattern',
    "A pattern that the test files' path should match to be executed"
  )
  .option(
    '-i, --ignore',
    'A pattern used to ignore files, `node_modules` is always ignored'
  )
  .action(async (options: CLIOptions) => {
    const dirs: string[] = getDir(options.dir)
    const patterns: RegExp[] = getPattern(options.pattern, options.dir)
    const ignored: RegExp[] = getIgnored(options.ignore)

    const tests: string[] = []

    await Promise.all(
      dirs.map(async (dir) =>
        totalist(resolvePath(options.cwd, dir), (relativePath) => {
          if (
            !ignored.every((ignoredPath) => ignoredPath.test(relativePath)) &&
            patterns.some((pattern) => pattern.test(relativePath))
          ) {
            tests.push(resolvePath(dir, relativePath))
          }
        })
      )
    )

    try {
      await exec({
        tests,
        workingDirectory: options.cwd,
      })
    } catch {
      process.exit(1)
    }
  })
  .parse(process.argv)
