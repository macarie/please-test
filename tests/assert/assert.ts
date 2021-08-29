import { suite } from 'test-please'
import { is, does, unreachable } from 'test-please/assert'
import stripAnsi from 'strip-ansi'

import { is as $is } from '../../src/assert/assert.js'
import { AssertionError } from '../../src/assert/helpers/assertion-error.js'

const checkError =
  (
    assertion: string,
    message: string,
    testerTitle: string,
    diffChecker: (diff: string) => boolean
  ) =>
  (error: unknown) => {
    const assertionError = error as AssertionError

    is(assertionError instanceof AssertionError).true()
    is(assertionError.assertion, assertion)
    is(assertionError.message, message)
    is(assertionError.testerTitle, testerTitle)
    is(diffChecker(assertionError.diff)).true()

    return true
  }

const diffChecker =
  (expectedDiff: string) =>
  (actualDiff: string): boolean =>
    expectedDiff === stripAnsi(actualDiff)

// Testing AssertionError
const assertionErrorTests = suite('AssertionError')

assertionErrorTests('`AssertionError` should expose its options', () => {
  const assertion = 'is'
  const message = 'Custom error message'
  const diff = '  --- test\n  +++ tests'
  const testerTitle = 'Custom tester title'

  const error = new AssertionError({
    assertion,
    diff,
    message,
    stackTraceEnd: checkError,
  })

  error.setTesterTitle(testerTitle)

  checkError(assertion, message, testerTitle, diffChecker(diff))(error)
})

void assertionErrorTests.run()

// Testing is(x, y)
const isTests = suite('is(x, y)')

isTests('`is(x, y)` should be a function', () => {
  is(typeof $is, 'function')
})

isTests('`is(x, y)` should not throw if valid', async () => {
  const o = {}
  const a = []
  const s = Symbol('symbol')
  const b1 = BigInt('0x1fffffffffffff')
  const b2 = BigInt('0x1fffffffffffff')

  await does(() => {
    $is(1, 1)
    $is(true, true)
    $is('a', 'a')
    $is(o, o)
    $is(a, a)
    $is(s, s)
    $is(null, null)
    $is(undefined, undefined)
    $is(b1, b2)
    $is(Number.NaN, Number.NaN)
  }).not.throw()
})

isTests('`is(x, y)` should throw if invalid', () => {
  try {
    $is(true, false)

    unreachable()
  } catch (error: unknown) {
    checkError('is', '', 'Test', diffChecker('  --- true\n  +++ false'))(error)
  }
})

isTests(
  '`is(x, y)` should display a helpful message if trying to compare objects',
  () => {
    try {
      $is({}, [])
    } catch {
      checkError(
        'is',
        'It appears that `value` and `expected` are not strictly equal.',
        'Test',
        diffChecker(
          '  At a glance, `expected` is an array; usually, this type is compared to other values using `assert.equal`.'
        )
      )
    }

    try {
      $is({}, [])
    } catch {
      checkError(
        'is',
        'It appears that `value` and `expected` are not strictly equal.',
        'Test',
        diffChecker(
          '  At a glance, `expected` is an object; usually, this type is compared to other values using `assert.equal`.'
        )
      )
    }
  }
)

isTests('`is(x, y)` should throw with a custom message if passed', () => {
  try {
    $is(true, false, 'Custom message')
  } catch (error: unknown) {
    checkError(
      'is',
      'Custom message',
      'Test',
      diffChecker('  --- true\n  +++ false')
    )(error)
  }
})

void isTests.run()

// Testing is(x).equalTo(y)
const isEqual = suite('is(x).equalTo(y)')

isEqual('`is(x).equalTo(y)` should be a function', () => {
  is(typeof $is(0).equalTo, 'function')
})

isEqual('`is(x).equalTo(y)` shuold not throw if valid', async () => {
  const o = { foo: [1, 2, 3] }
  const a = [1, 2, 3]
  const s = Symbol('symbol')
  const b1 = BigInt('0x1fffffffffffff')
  const b2 = BigInt('0x1fffffffffffff')

  await does(() => {
    $is(1).equalTo(1)
    $is(true).equalTo(true)
    $is('a').equalTo('a')
    $is(o).equalTo(o)
    $is(o).equalTo({ foo: [1, 2, 3] })
    $is(a).equalTo(a)
    $is(a).equalTo([1, 2, 3])
    $is(s).equalTo(s)
    $is(null).equalTo(null)
    $is(undefined).equalTo(undefined)
    $is(b1).equalTo(b2)
    $is(Number.NaN).equalTo(Number.NaN)
  }).not.throw()
})

isEqual('`is(x).equalTo(y)` should throw if invalid', () => {
  const input = {
    foo: [1, 2, 3],
  }

  try {
    $is(input).equalTo({ foo: [] })

    unreachable()
  } catch (error: unknown) {
    checkError(
      'equal',
      '',
      'Test',
      diffChecker(
        '      {\n  ---   foo: [\n  ---     1,\n  ---     2,\n  ---     3\n  ---   ]\n  +++   foo: []\n      }\n'
      )
    )(error)
  }
})

isEqual(
  '`is(x).equalTo(y)` should throw with a custom message if passed',
  () => {
    const input = {
      foo: [1],
    }

    try {
      $is(input).equalTo({ foo: [] }, 'Custom message')

      unreachable()
    } catch (error: unknown) {
      checkError(
        'equal',
        'Custom message',
        'Test',
        diffChecker(
          '      {\n  ---   foo: [\n  ---     1\n  ---   ]\n  +++   foo: []\n      }\n'
        )
      )(error)
    }
  }
)

void isEqual.run()
