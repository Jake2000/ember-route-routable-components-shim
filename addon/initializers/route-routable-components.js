import { patchOutletKeyword } from '../outlet';
import { patchRoute } from '../route';

export function initialize(/* application */) {
  patchOutletKeyword();
  patchRoute();
}

export default {
  name: 'route-routable-components',
  initialize: initialize
};
