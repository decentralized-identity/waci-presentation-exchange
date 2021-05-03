import test from 'ava'

import * as fixture from './fixtures'

test('assertions on json message structure', async t => {
  t.true('credentialManifest' in fixture)
  t.true(JSON.stringify(fixture.request_vp) === JSON.stringify(require('./fixtures/expected-request.json')))
  t.true(JSON.stringify(fixture.submit_vp) === JSON.stringify(require('./fixtures/expected-submission.json')))
})
