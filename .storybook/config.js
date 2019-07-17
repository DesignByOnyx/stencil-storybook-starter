import { configure } from '@storybook/html';
import buildStencilStories from './stories/stencil';

// The following contexts will be used to generate stories
// for multiple collections of components. This is particulary
// useful for monorepos where multiple packages might exist.
const COLLECTIONS = [
  {
    name: 'Stencil Components',
    loader: require('../loader/index.cjs.js'),
    componentsCtx: require.context('../dist/collection', true, /\/components\/([^/]+)\/\1\.js$/),
    storiesCtx: require.context('../src', true, /\.story\.tsx$/)
  }
];

function loadStories() {
  COLLECTIONS.forEach(({ name, loader, componentsCtx, storiesCtx }) => {
    buildStencilStories(name, loader, componentsCtx, storiesCtx);
  });
}

configure(loadStories, module);
