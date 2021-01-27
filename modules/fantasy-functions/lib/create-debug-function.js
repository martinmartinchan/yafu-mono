import * as FL from 'fantasy-land'
import { I, composeN } from 'yafu'
import isSameType from './is-same-type'
import definitions from './definitions'

function clearGeneric (string) {
  return string.replace(/<\w+>/, '')
}

function findMethod (typeName) {
  const pairs = Object.entries(definitions)
  const match = pairs.find(([ , value ]) => value.name === typeName)
  return `fantasy-land/${match[0]}`
}

function isGeneric (paramName) {
  return /^[A-Z]$/.test(paramName)
}

function isFunction (spec) {
  return spec.indexOf('=>') !== -1
}

function isSameTypeSpec (spec) {
  return spec.indexOf('_sameType') === 0
}

function getSpecParts (spec) {
  if (isSameTypeSpec(spec)) {
    const base = {
      main: '_sameType',
    }
    if (isFunction(spec)) {
      Object.assign(base, { secondary: 'function' })
    }
    return base
  }
  if (isFunction(spec)) {
    return {
      main: 'function',
      secondary: spec.split(' => ')[1],
    }
  }
  const specParts = spec.split(':')
  return {
    main: specParts[0],
    secondary: specParts[1],
  }
}

function getExpectedString (algebra, spec) {
  const { main, secondary } = getSpecParts(spec)
  const type = algebra.constructor.name
  const messageParts = [
    'expects',
    isSameTypeSpec(main)
      ? `an instance of ${type}`
      : main === '_constructor'
        ? 'a type representative'
        : `a ${main}`,
  ]

  if (secondary != null && !isGeneric(secondary)) {
    const secondaryAction = isSameTypeSpec(main)
      ? 'containing'
      : main === '_constructor'
        ? 'of an'
        : 'returning'

    const secondaryType = isSameTypeSpec(secondary)
      ? `an instance of ${type}`
      : main === '_constructor'
        ? clearGeneric(secondary)
        : `a ${secondary}`

    messageParts.push(secondaryAction, secondaryType)
  }

  return messageParts.join(' ')
}

function isCustomSpec (s) {
  return s.startsWith('_')
}

function nilToString (v) {
  return v === undefined
    ? 'undefined'
    : v === null ? 'null' : v
}

function createValueString (isMain, algebra, specParts, value) {
  const { main } = specParts
  if (isMain) {
    if (main === '_constructor' && typeof value === 'function') return value.name
    return nilToString(value)
  }

  return main === 'function'
    ? `function returning ${nilToString(value)}`
    : `${algebra.constructor.name} containing ${nilToString(value)}`
}

function throwIfInvalid (name, algebra, spec, specPart, value) {
  if (specPart === '_any' || isGeneric(specPart)) return

  const specParts = getSpecParts(spec)
  const { main, secondary } = specParts

  // eslint-disable-next-line valid-typeof
  const isCorrectType = (!isCustomSpec(specPart) && typeof value === specPart)
    || (isSameTypeSpec(specPart) && (isSameType(value, algebra)))
    || (specPart === '_constructor' && value[findMethod(clearGeneric(secondary))] != null)

  if (!isCorrectType) {
    const isMain = specPart === main
    const expected = getExpectedString(algebra, spec)
    const valueString = createValueString(isMain, algebra, specParts, value)

    throw new TypeError([
      name,
      expected,
      'but got',
      valueString,
    ].join(' '))
  }
}
export default function createDebugFunction (name, definition) {
  const {
    args,
    isStatic,
  } = definition
  const flName = FL[name]
  const fnLength = args.length + 1

  function impl (...fnArgs) {
    const algebra = isStatic ? fnArgs[0] : fnArgs[args.length]

    if (algebra[flName] == null) {
      throw new TypeError(
        `${name} expects an object with property ${flName} but got ${algebra}`,
      )
    }

    const methodArgs = isStatic ? fnArgs.slice(1) : fnArgs.slice(0, args.length)

    function wrapFn (fn, spec) {
      return (...innerArgs) => {
        const result = fn(...innerArgs)
        const { secondary } = getSpecParts(spec)
        throwIfInvalid(name, algebra, spec, secondary, result)
        return result
      }
    }

    function wrapAlgebra (item, spec) {
      return item[FL.map]((inner) => {
        const { secondary } = getSpecParts(spec)
        throwIfInvalid(name, algebra, spec, secondary, inner)
        return inner
      })
    }

    const wrappedArgs = methodArgs.map((item, i) => {
      const spec = args[i]
      const { main, secondary } = getSpecParts(spec)
      throwIfInvalid(name, algebra, spec, main, item)

      if (secondary == null || main === '_constructor') return item

      return main === 'function'
        ? wrapFn(item, spec)
        : wrapAlgebra(item, spec)
    })

    return algebra[flName](...wrappedArgs)
  }

  return composeN(fnLength, I, impl)
}
