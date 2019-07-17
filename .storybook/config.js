import { configure } from '@storybook/html';
import loadStencilStories from './stories/stencil';

function loadStories() {
	loadStencilStories();
}

configure(loadStories, module);
