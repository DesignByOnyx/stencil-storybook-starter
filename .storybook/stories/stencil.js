import path from 'path';
import Case from 'case';
import { storiesOf } from '@storybook/html';
import * as KNOBS from '@storybook/addon-knobs';
import { getRootFromPath, ensureProps } from './util';

// The following paths must be configured for your project.
// These can be configured to work with a monorepo too!

// Must point to "loaders" which export the `defineCustomElements` method
const stencilLoaders = require.context('../../loader/', true, /\/index.cjs.js/);
// Must point to generated "collection" files. These files are compiled versions
// of your components which contain necessary metadata about component properties.
const stencilComponents = require.context('../../dist/collection', true, /\/components\/([^/]+)\/\1\.js$/);
// Must point to story files for individual components: `<component>.story.ts`
// const stencilStoryConfigs = require.context('../../src/components/', true, /\/.+\.story\.tsx$/);
const stencilStoryConfigs = require.context('../../src', true, /\.story\.tsx$/);

/*******************************************************************************
 * You should not need to edit anything below this line unless you really      *
 * want to get your hands dirty and customize the generation of stories.       *
 * If you configured the above require contexts, then you should be have       *
 * a decently working storybook project which displays all of your components  *
 * with working knobs and different states. I apologize the following code was *
 * not written with the intent to be distributed. If I get time I will clean   *
 * it up and make it easier to read/customize.                                 *
 *******************************************************************************/

const DEFAULT_DATE = new Date();

/**
 * Given a module, iterates over the exports and returns the first
 * one which looks like a stencil component (using duck typing).
 */
function getComponentFromExports(_module) {
	const key = Object.keys(_module).find(exportKey => {
		const _export = _module[exportKey];
		// does it quack like a stencil class component?
		if (_export.prototype && _export.is && _export.encapsulation) {
			return true;
		}
	});

	return _module[key];
}

/**
 * Given a property (from stencil Component.properties) and an optional
 * knobOptions object generates a knob which can be used to
 * dynamically update the properties of the component.
 */
function getKnobForProp(prop, knobOptions = {}) {
	let type = 'text';
	let args = [prop.attribute];

	// knob options can defined using camelCase or kebab-case
	const propCamel = Case.camel(prop.attribute);
	const options = knobOptions[propCamel] || knobOptions[prop.attribute];

	// if knob options are defined, use those
	if (options) {
		type = options.type;
		args = args.concat(options.args);
	}
	// otherwise, implicitly create knobs based on prop type or attribute name
	else if (/^(?:number|boolean|object)$/i.test(prop.type)) {
    type = prop.type.toLowerCase();
	} else if (prop.attribute.indexOf('date') !== -1) {
		type = 'date';
		args[1] = DEFAULT_DATE;
	} else if (prop.attribute.indexOf('color') !== -1) {
    type = 'color';
  }

  if(prop.defaultValue) {
    args[1] = JSON.parse(prop.defaultValue)
  }

  console.log('generating', type, 'knob with args:', args);

	const val = KNOBS[type].apply(null, args);

	switch (type) {
		// knobs returns UNIX timestamp for "date" type
		// and we need to convert it to ISO-8601
		case 'date':
			return new Date(val).toISOString();
	}

	return val;
}

/**
 * Template used to render a single stencil component. To use this template
 * do something like the following code snippet:
 *
 *   ```
 *   const container = document.createElement('div');
 *   const component = document.createElement('your-component');
 *   container.innerHTML = getStencilTemplate('Some Title', 'Some Description');
 *   container.querySelector('.placeholder').appendChild(component);
 *   ```
 */
function getStencilTemplate({ title, description, tag, props }) {
  // build attribute="value" strings
  const attrs = Object.keys(props || {})
    .filter(prop => props[prop] != null)
		.map(prop => {
			return `${Case.kebab(prop)}={${JSON.stringify(props[prop])}}`;
		})
		.join(' ');

	let template =
		`
        <h2>${title}</h2>
        ${description ? '<p>' + description + '</p>' : ''}
        <div class="placeholder">
        <!-- the component will be inserted here --></div>
        <div class="code-block">
            <pre><code>` +
		`&lt;${tag}${attrs ? ' ' + attrs : ''}&gt;&lt;/${tag}&gt;` +
		`</code></pre>
            <a class="select-code">Select Code</a>
        </div>
    `;

	return template;
}

/**
 * Given a stencil Component and knob options, returns an dictionary of
 * all the properties and default values.
 */
function getPropsWithKnobValues(Component, knobOptions = {}) {
	return Object.keys(Component.properties).reduce((obj, key) => {
		const property = Component.properties[key];

		// normalize older "attr" into newer "attribute" property
		if (property.hasOwnProperty('attr')) {
			property.attribute = property.attr;
		}

		if (property.hasOwnProperty('attribute')) {
			obj[key] = getKnobForProp(property, knobOptions);
    }

		return obj;
	}, {});
}

/**
 * Generates an interactive knobs-enabled story for a stencil Component.
 * For any additional states, a static rendering is generated with
 * the given state (see existing components for examples).
 *
 * Example "states" array:
 *
 *   [{
 *     title: 'A title for this state',
 *     description: 'A description of why this state exists',
 *     props: {
 *        --- props to set on your component ---
 *     }
 *   }]
 *
 * Example "knobs" config:
 *
 *   {
 *     someProp: {            // A decorated @Prop() on your component
 *       type: 'color',       // The type of "knob" to use in the knobs panel
 *       args: [              // Additional arguments to pass to the knob **after the "label" argument**
 *         '#ff99cc',         // The defaultValue for the "color" knob
 *         'GROUP-1'          // The groupId for the "color" knob
 *       ]
 *     }
 *   }
 */
function createStencilStory({ Component, notes, states, knobs }, stories) {
	// It is important that the main container element
	// is NOT created inside of the render function below!!
	const mainEl = document.createElement('div');
	const storyOpts = notes ? { notes } : {};
	const tag = Component.is;

	// Clone the "states" array and add the default state first
	states = states && states.length ? states.slice(0) : [];
	states.unshift({
		title: 'Default state (use Knobs below to edit props):',
		tag: Component.is,
		props: {},
	});

	// Create the story with all of the states
	stories.add(
		Component.name,
		() => {
			mainEl.innerHTML = '';

			// First, add the knobs-enabled props to the default state.
			// This MUST be done inside this render function!!
			states[0].props = getPropsWithKnobValues(Component, knobs);

			// Next, render each state. Only the first one is interactive (with knobs).
			// This is sort of a light-weight "chapters" addon because the community
			// "chapters" addon only works with react :/
			states.forEach(({ title, description, props }) => {
				const containerEl = document.createElement('div');
				const componentEl = document.createElement(tag);

				Object.keys(props).forEach(prop => {
					componentEl[prop] = props[prop];
				});

				containerEl.innerHTML = getStencilTemplate({
					title,
					description,
					tag,
					props,
				});
				containerEl.querySelector(`.placeholder`).appendChild(componentEl);
				mainEl.appendChild(containerEl);
			});

			return mainEl;
		},
		storyOpts,
	);
}

/**
 * Cleans the notes, which should be in markdown format.
 * The markdown parser used by the notes addon is not the best, so
 * we have to fix some issues before rendering.
 */
function cleanNotes(notes) {
	if (notes) {
		// replaces "\|" with "` `" so property tables to break
		return notes.replace(/\\\|/g, '` `');
	}
}

/**
 * Iterates all of the stencil contexts and build a "config" object
 * which is used to generate the individual stories.
 */
function loadStencilStories() {
	const pkgConfig = {};
	const componentKeys = stencilComponents.keys();

	// define the custom elements so they are available
	stencilLoaders.keys().forEach(key => {
		stencilLoaders(key).defineCustomElements(window);
  });

  console.log('PKGCONFIG 1', { ...pkgConfig });

	// update the pkgConfig to use the compiled component
	componentKeys.reduce((obj, key) => {
		const pkg = getRootFromPath(key);
		const _module = stencilComponents(key);
    const Component = getComponentFromExports(_module);

		Object.assign(ensureProps(obj, pkg, Component.name), { Component });
		return obj;
  }, pkgConfig);

  console.log('PKGCONFIG 2', { ...pkgConfig });

	// get each components story config and merge onto pkgConfig
	stencilStoryConfigs.keys().reduce((obj, key) => {
		const pkg = getRootFromPath(key);
		const _export = stencilStoryConfigs(key).default;
		const parentName = path.basename(path.dirname(key));
		const basename = path.basename(key).split('.story')[0];
		const moduleName = parentName + '/' + basename + '.';
		const componentKey = componentKeys.find(k => k.indexOf(moduleName) !== -1);

		if (componentKey) {
      const _module = stencilComponents(componentKey);
      const Component = getComponentFromExports(_module);

      console.log('-- custom story config for', pkg, Component.name);

			// If the default export is a function, then that function should
			// be used to create the story. It will be passed the "stories" object
			// where it should call stories.add(...) manually.
			if (typeof _export === 'function') {
				Object.assign(ensureProps(obj, pkg, Component.name), _export);
			} else {
				let { states, knobs, notes } = _export;
				Object.assign(ensureProps(obj, pkg, Component.name), {
					states,
					knobs,
					notes: cleanNotes(notes),
        });
			}
		}

		return obj;
  }, pkgConfig);

  console.log('PKGCONFIG 3', { ...pkgConfig })

  /**
   * By the time we get here, the pkgConfig should be an
   * object with the following shape:
   *
   * ```
   * {
   *    <GROUP_NAME>: {                   // The group under which components will be listed in storybook nav
   *       // OPTION 1: a config object
   *       <COMPONENT_NAME>: {            // The display name for the component (used in storybook nav)
   *          Component: function() {},   // The component constructor (required)
   *          states?: [],                // Optional list of different states to render (see examples)
   *          knobs?: {},                 // Optional config for knobs used for each @Prop (see examples)
   *          notes?: {},                 // Optional notes (markdown) to display for this component (see examples)
   *       },
   *
   *       // OPTION 2: a function which calls stories.add() manually (see storybook docs)
   *       <COMPONENT_NAME>: function(stories, knobs) { ... }
   *    }
   * }
   * ```
   */

	// build stories for each pkg.Component
	Object.keys(pkgConfig).forEach(pkg => {
		const pkgTitle = Case.title(pkg);
		const stories = storiesOf(pkgTitle, module);
		stories.addDecorator(KNOBS.withKnobs);

		Object.keys(pkgConfig[pkg])
			.map(comp => pkgConfig[pkg][comp])
			.forEach(config =>
				typeof config === 'function'
					? // If the config is a function, call it with the stories context.
					  // The function is responsible for calling stories.add(...) manually.
					  // Pass any additional utilities such as knobs.
					  config(stories, KNOBS)
					: createStencilStory(config, stories),
			);
	});
}

export default loadStencilStories;
