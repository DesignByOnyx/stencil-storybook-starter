const REG_DOT_SLASH = /^[\./]+$/;

/**
 * Given a path, returns the first section of that path.
 * 
 *   getRootFromPath('./foo/bar') -> "foo"
 *   getRootFromPath('.././../some_path/to/a/file') -> "some_path"
 */
function getRootFromPath(p) {
    return p.split('/').filter(p => !!p && !REG_DOT_SLASH.test(p))[0];
}

/**
 * Given an object and a list of "nested" property names, 
 * ensures that the properties exist and returns the *deep* object.
 * 
 *     ensureProps({}, 'foo', 'bar', 'baz')
 * 
 * 1) The above will mutate the obj {} into { foo: { bar: { baz: {} } } }
 * 2) It will return the nested "baz" object!!
 */
function ensureProps(obj /*, parentProp, childProp, ... */) {
    const props = Array.prototype.slice.call(arguments, 1);
    const prop = props.shift();

    if(!obj[prop]) {
        obj[prop] = {};
    }

    return props.length ? ensureProps(obj[prop], ...props) : obj[prop];
}

export {
    getRootFromPath,
    ensureProps
};