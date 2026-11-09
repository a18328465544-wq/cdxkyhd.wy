import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AboutUsSection from './AboutUsSection';

test('about section links the founder profile to the personal site in a new tab', () => {
  const html = renderToStaticMarkup(createElement(AboutUsSection));

  assert.match(html, /关于我们/);
  assert.match(html, /访问创始人个人站/);
  assert.match(html, /href="https:\/\/guoxin\.cdgpu\.cn\//);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
});
