const definitions = require('../dist/cjs/definitions') // eslint-disable-line

const parameterNames = [ 'a', 'b', 'c' ]
const innerParameterNames = [ 'x', 'y', 'z' ]

function createGenerics (list) {
  return list.length ? `<${list.join(', ')}>` : ''
}

const allDefs = Object.entries(definitions).map(([ fn, spec ]) => {
  const {
    args,
    extending = [],
    generics: genericsList = [],
    extendingGenerics: extendingGenericsList = genericsList,
    name,
    returnType,
  } = spec

  function createInnerArg (parameter, i) {
    // eslint-disable-next-line no-use-before-define
    return `${innerParameterNames[i]}: ${getParameterType(parameter)}`
  }

  function createFunctionType (arg) {
    const parts = arg.split(':')
    const fnReturnType = parts[parts.length - 1]
    const fnArgs = parts.slice(1, -1)
    const fnParameters = fnArgs.map(createInnerArg)
    return `(${fnParameters.join(', ')}) => ${fnReturnType}`
  }

  function getParameterType (arg) {
    if (arg.indexOf('_sameType') !== -1) return arg.replace('_sameType', name)
    if (arg === '_any') return 'any'
    if (arg === '_contained') return 'T'
    if (arg.indexOf('_constructor') !== -1) return arg.replace('_constructor:', '')
    if (arg.startsWith('function')) return createFunctionType(arg)

    return arg
  }

  function formatArgument (arg, i) {
    const type = getParameterType(arg)
    const paramName = parameterNames[i]

    return `${paramName}: ${type}`
  }

  const generics = createGenerics(genericsList)
  const extendingGenerics = createGenerics(extendingGenericsList)
  const allGenerics = Array.from(new Set(`${args.join()} ${returnType}`.match(/\b[A-Z]\b/g)))
  const methodGenericsList = allGenerics.filter((x) => generics.indexOf(x) === -1)
  const methodGenerics = methodGenericsList.length ? `<${methodGenericsList.join(', ')}>` : ''
  const extendWithGenerics = extending.map((item) => `${item}${extendingGenerics}`)

  const method = `${fn}: ${methodGenerics}(${args.map(formatArgument).join(', ')})`
  const extendStatement = extending.length ? ` extends ${extendWithGenerics.join(', ')}` : ''
  return `export interface ${name}${generics}${extendStatement} {
  ${method} => ${returnType}\n}\n`
})
process.stdout.write(allDefs.join('\n'))
